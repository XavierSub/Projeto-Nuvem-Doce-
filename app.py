"""Servidor do jogo Fuga da Prisão Nuvem Doce (para o Render).

- Serve o jogo (index.html) e os áudios da Brisa (pasta audio/).
- Mini banco de dados SQLite com:
    dispositivos  → aparelhos que abriram o jogo (identificador anônimo)
    pontuacoes    → ranking geral
    varal         → mensagens do Varal da Conscientização
- Painel do professor em /painel (protegido por senha) com ranking,
  mensagens do Varal (com opção de ocultar) e exportação em CSV.

Rodar no computador:
    pip install -r requirements.txt
    PAINEL_SENHA=minhasenha uvicorn app:app --reload
"""
import asyncio
import csv
import hmac
import io
import json
import os
import re
import sqlite3
import threading
import time
from collections import defaultdict, deque
from pathlib import Path

from starlette.applications import Starlette
from starlette.middleware import Middleware
from starlette.middleware.gzip import GZipMiddleware
from starlette.requests import Request
from starlette.responses import FileResponse, HTMLResponse, JSONResponse, PlainTextResponse, Response
from starlette.routing import Mount, Route
from starlette.staticfiles import StaticFiles

RAIZ = Path(__file__).resolve().parent
DB_PATH = Path(os.environ.get("DB_PATH", RAIZ / "dados" / "nuvem_doce.db"))
SENHA = os.environ.get("PAINEL_SENHA", "")

FINAIS = {"livre", "cicatriz", "corrente"}
ID_RE = re.compile(r"^[A-Za-z0-9_-]{8,64}$")

# ------------------------------------------------------------------ banco
_lock = threading.Lock()


def conectar():
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    con = sqlite3.connect(DB_PATH, check_same_thread=False)
    con.row_factory = sqlite3.Row
    con.execute("PRAGMA journal_mode=WAL")
    con.executescript("""
    CREATE TABLE IF NOT EXISTS dispositivos(
        id TEXT PRIMARY KEY,
        plataforma TEXT NOT NULL,
        primeiro_acesso INTEGER NOT NULL,
        ultimo_acesso INTEGER NOT NULL,
        acessos INTEGER NOT NULL DEFAULT 1
    );
    CREATE TABLE IF NOT EXISTS pontuacoes(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        dispositivo TEXT,
        apelido TEXT NOT NULL,
        pontos INTEGER NOT NULL,
        estrelas INTEGER NOT NULL,
        tempo TEXT NOT NULL,
        final TEXT NOT NULL,
        avatar TEXT NOT NULL,
        criado_em INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_pontos ON pontuacoes(pontos DESC);
    CREATE TABLE IF NOT EXISTS varal(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        dispositivo TEXT,
        apelido TEXT NOT NULL,
        mensagem TEXT NOT NULL,
        oculta INTEGER NOT NULL DEFAULT 0,
        criado_em INTEGER NOT NULL
    );
    """)
    con.commit()
    return con


DB = conectar()


def inserir(sql, args=()):
    with _lock:
        cur = DB.execute(sql, args)
        DB.commit()
        return cur.lastrowid


def q(sql, args=(), one=False):
    with _lock:
        cur = DB.execute(sql, args)
        rows = cur.fetchall()
        DB.commit()
    return (rows[0] if rows else None) if one else rows


# ------------------------------------------------------------------ limites
_janela = defaultdict(deque)


def excedeu(chave, maximo, segundos):
    """Limite simples de pedidos por chave (IP + rota)."""
    agora = time.time()
    fila = _janela[chave]
    while fila and agora - fila[0] > segundos:
        fila.popleft()
    if len(fila) >= maximo:
        return True
    fila.append(agora)
    return False


def ip(request: Request):
    # No Render, o último endereço da lista é o que o próprio Render adicionou (não dá para falsificar)
    fwd = request.headers.get("x-forwarded-for", "")
    return (fwd.split(",")[-1].strip() or (request.client.host if request.client else "?"))[:64]


def texto(v, maximo):
    if not isinstance(v, str):
        return ""
    v = re.sub(r"[\x00-\x1f\x7f]", " ", v)
    return re.sub(r"\s+", " ", v).strip()[:maximo]


def inteiro(v, minimo, maximo, padrao=0):
    try:
        n = int(v)
    except (TypeError, ValueError):
        return padrao
    return max(minimo, min(maximo, n))


async def corpo(request: Request):
    if int(request.headers.get("content-length") or 0) > 4096:
        return None
    try:
        dados = await request.json()
    except Exception:
        return None
    return dados if isinstance(dados, dict) else None


def erro(msg, status=400):
    return JSONResponse({"ok": False, "erro": msg}, status_code=status)


def limpar_avatar(av):
    av = av if isinstance(av, dict) else {}
    lim = {"s": 3, "h": 4, "hc": 5, "u": 3, "a": 3}
    return {k: inteiro(av.get(k), 0, m) for k, m in lim.items()}


# ------------------------------------------------------------------ rotas públicas
_html = {"mtime": 0, "texto": ""}


async def pagina(request):
    """Entrega o jogo marcando que há servidor (o jogo então usa ranking, Varal e dispositivos)."""
    arq = RAIZ / "index.html"
    m = arq.stat().st_mtime
    if m != _html["mtime"]:
        _html["texto"] = arq.read_text(encoding="utf-8").replace('<html lang="pt-BR">', '<html lang="pt-BR" data-servidor="nuvem-doce">', 1)
        _html["mtime"] = m
    return HTMLResponse(_html["texto"], headers={"Cache-Control": "no-cache"})


async def saude(request):
    return JSONResponse({"ok": True, "servidor": "nuvem-doce"})


async def registrar_dispositivo(request):
    if excedeu(("disp", ip(request)), 30, 60):
        return erro("muitos pedidos", 429)
    d = await corpo(request)
    if not d:
        return erro("dados inválidos")
    did = d.get("id")
    if not isinstance(did, str) or not ID_RE.match(did):
        return erro("id inválido")
    plat = d.get("plataforma") if d.get("plataforma") in ("celular", "computador", "tablet") else "outro"
    agora = int(time.time())
    inserir("""INSERT INTO dispositivos(id, plataforma, primeiro_acesso, ultimo_acesso) VALUES(?,?,?,?)
         ON CONFLICT(id) DO UPDATE SET ultimo_acesso=excluded.ultimo_acesso, acessos=acessos+1, plataforma=excluded.plataforma""",
      (did, plat, agora, agora))
    return JSONResponse({"ok": True})


async def salvar_pontuacao(request):
    if excedeu(("pts", ip(request)), 20, 600):
        return erro("muitos envios, tente mais tarde", 429)
    d = await corpo(request)
    if not d:
        return erro("dados inválidos")
    apelido = texto(d.get("apelido"), 16) or "Detento"
    pontos = inteiro(d.get("pontos"), -1000, 10000, None)
    if pontos is None:
        return erro("pontuação inválida")
    final = d.get("final") if d.get("final") in FINAIS else None
    if not final:
        return erro("final inválido")
    tempo = d.get("tempo") if isinstance(d.get("tempo"), str) and re.match(r"^\d{1,3}:\d{2}$", d.get("tempo")) else "0:00"
    disp = d.get("dispositivo") if isinstance(d.get("dispositivo"), str) and ID_RE.match(d.get("dispositivo")) else None
    novo_id = inserir("""INSERT INTO pontuacoes(dispositivo, apelido, pontos, estrelas, tempo, final, avatar, criado_em)
               VALUES(?,?,?,?,?,?,?,?)""",
            (disp, apelido, pontos, inteiro(d.get("estrelas"), 1, 3, 1), tempo, final,
             json.dumps(limpar_avatar(d.get("avatar"))), int(time.time())))
    pos = q("SELECT COUNT(*)+1 AS p FROM pontuacoes WHERE pontos > ?", (pontos,), one=True)["p"]
    return JSONResponse({"ok": True, "id": novo_id, "posicao": pos})


async def ranking(request):
    limite = inteiro(request.query_params.get("limite"), 1, 50, 20)
    rows = q("SELECT id, apelido, pontos, estrelas, tempo, final, avatar FROM pontuacoes ORDER BY pontos DESC, id ASC LIMIT ?", (limite,))
    return JSONResponse({"ok": True, "ranking": [
        {"id": r["id"], "apelido": r["apelido"], "pontos": r["pontos"], "estrelas": r["estrelas"],
         "tempo": r["tempo"], "final": r["final"], "avatar": json.loads(r["avatar"])} for r in rows]},
        headers={"Cache-Control": "no-store"})


async def salvar_varal(request):
    if excedeu(("varal", ip(request)), 10, 600):
        return erro("muitos envios, tente mais tarde", 429)
    d = await corpo(request)
    if not d:
        return erro("dados inválidos")
    msg = texto(d.get("mensagem"), 120)
    if len(msg) < 3:
        return erro("mensagem muito curta")
    disp = d.get("dispositivo") if isinstance(d.get("dispositivo"), str) and ID_RE.match(d.get("dispositivo")) else None
    inserir("INSERT INTO varal(dispositivo, apelido, mensagem, criado_em) VALUES(?,?,?,?)",
      (disp, texto(d.get("apelido"), 16) or "Detento", msg, int(time.time())))
    return JSONResponse({"ok": True})


# ------------------------------------------------------------------ painel (com senha)
def autorizado(request: Request):
    if not SENHA:
        return False
    enviada = request.headers.get("x-painel-senha", "")
    return hmac.compare_digest(enviada.encode(), SENHA.encode())


async def painel(request):
    return FileResponse(RAIZ / "painel.html", headers={"Cache-Control": "no-cache"})


async def painel_dados(request):
    if excedeu(("painel", ip(request)), 60, 60):
        return erro("muitos pedidos", 429)
    if not SENHA:
        return erro("Defina a variável PAINEL_SENHA no Render para usar o painel.", 503)
    if not autorizado(request):
        await asyncio.sleep(0.5)
        return erro("senha incorreta", 401)
    agora = int(time.time())
    hoje = agora - agora % 86400
    resumo = {
        "dispositivos": q("SELECT COUNT(*) n FROM dispositivos", one=True)["n"],
        "dispositivos_hoje": q("SELECT COUNT(*) n FROM dispositivos WHERE ultimo_acesso >= ?", (hoje,), one=True)["n"],
        "online_agora": q("SELECT COUNT(*) n FROM dispositivos WHERE ultimo_acesso >= ?", (agora - 120,), one=True)["n"],
        "por_plataforma": {r["plataforma"]: r["n"] for r in q("SELECT plataforma, COUNT(*) n FROM dispositivos GROUP BY plataforma")},
        "partidas": q("SELECT COUNT(*) n FROM pontuacoes", one=True)["n"],
        "finais": {r["final"]: r["n"] for r in q("SELECT final, COUNT(*) n FROM pontuacoes GROUP BY final")},
        "mensagens": q("SELECT COUNT(*) n FROM varal", one=True)["n"],
    }
    rank = [dict(r) for r in q("SELECT id, apelido, pontos, estrelas, tempo, final, criado_em FROM pontuacoes ORDER BY pontos DESC, id ASC LIMIT 50")]
    msgs = [dict(r) for r in q("SELECT id, apelido, mensagem, oculta, criado_em FROM varal ORDER BY id DESC LIMIT 500")]
    return JSONResponse({"ok": True, "resumo": resumo, "ranking": rank, "varal": msgs}, headers={"Cache-Control": "no-store"})


async def painel_ocultar(request):
    if not autorizado(request):
        return erro("senha incorreta", 401)
    d = await corpo(request) or {}
    q("UPDATE varal SET oculta=? WHERE id=?", (1 if d.get("oculta") else 0, inteiro(d.get("id"), 0, 10**9)))
    return JSONResponse({"ok": True})


async def painel_apagar_pontuacao(request):
    if not autorizado(request):
        return erro("senha incorreta", 401)
    d = await corpo(request) or {}
    q("DELETE FROM pontuacoes WHERE id=?", (inteiro(d.get("id"), 0, 10**9),))
    return JSONResponse({"ok": True})


def _csv(nome, cab, linhas):
    buf = io.StringIO()
    buf.write("﻿")  # acentos certos no Excel
    w = csv.writer(buf, delimiter=";")
    w.writerow(cab)
    for l in linhas:
        w.writerow(["'" + c if isinstance(c, str) and c[:1] in "=+-@" else c for c in l])
    return Response(buf.getvalue(), media_type="text/csv; charset=utf-8",
                    headers={"Content-Disposition": f'attachment; filename="{nome}"'})


async def painel_csv(request):
    if not autorizado(request):
        return erro("senha incorreta", 401)
    tipo = request.path_params["tipo"]
    fmt = lambda t: time.strftime("%d/%m/%Y %H:%M", time.localtime(t - 3 * 3600))
    if tipo == "varal":
        rows = q("SELECT id, apelido, mensagem, oculta, criado_em FROM varal ORDER BY id")
        return _csv("varal.csv", ["id", "apelido", "mensagem", "oculta", "data (Brasília)"],
                    [(r["id"], r["apelido"], r["mensagem"], "sim" if r["oculta"] else "não", fmt(r["criado_em"])) for r in rows])
    if tipo == "ranking":
        rows = q("SELECT id, apelido, pontos, estrelas, tempo, final, criado_em FROM pontuacoes ORDER BY pontos DESC")
        return _csv("ranking.csv", ["id", "apelido", "pontos", "estrelas", "tempo", "final", "data (Brasília)"],
                    [(r["id"], r["apelido"], r["pontos"], r["estrelas"], r["tempo"], r["final"], fmt(r["criado_em"])) for r in rows])
    if tipo == "dispositivos":
        rows = q("SELECT plataforma, primeiro_acesso, ultimo_acesso, acessos FROM dispositivos ORDER BY primeiro_acesso")
        return _csv("dispositivos.csv", ["plataforma", "primeiro acesso", "último acesso", "acessos"],
                    [(r["plataforma"], fmt(r["primeiro_acesso"]), fmt(r["ultimo_acesso"]), r["acessos"]) for r in rows])
    return PlainTextResponse("tipo inválido", status_code=404)


async def nao_encontrado(request, exc):
    return PlainTextResponse("Página não encontrada", status_code=404)


SEGURANCA = {
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "same-origin",
    "X-Frame-Options": "SAMEORIGIN",
}


class Cabecalhos:
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        async def enviar(msg):
            if msg["type"] == "http.response.start":
                h = msg.setdefault("headers", [])
                for k, v in SEGURANCA.items():
                    h.append((k.lower().encode(), v.encode()))
            await send(msg)
        await self.app(scope, receive, enviar)


routes = [
    Route("/", pagina),
    Route("/index.html", pagina),
    Route("/api/saude", saude),
    Route("/api/dispositivo", registrar_dispositivo, methods=["POST"]),
    Route("/api/pontuacao", salvar_pontuacao, methods=["POST"]),
    Route("/api/ranking", ranking),
    Route("/api/varal", salvar_varal, methods=["POST"]),
    Route("/painel", painel),
    Route("/api/painel/dados", painel_dados),
    Route("/api/painel/ocultar", painel_ocultar, methods=["POST"]),
    Route("/api/painel/apagar-pontuacao", painel_apagar_pontuacao, methods=["POST"]),
    Route("/api/painel/csv/{tipo}", painel_csv),
    Mount("/audio", StaticFiles(directory=RAIZ / "audio"), name="audio"),
]

app = Starlette(routes=routes, middleware=[Middleware(Cabecalhos), Middleware(GZipMiddleware, minimum_size=1000)],
                exception_handlers={404: nao_encontrado})
