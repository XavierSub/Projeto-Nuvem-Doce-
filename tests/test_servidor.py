"""Testes do servidor (app.py) e do mini banco de dados: API, segurança, painel e o jogo ligado ao servidor."""
import json
import os
import socket
import sys
import tempfile
import threading
import time
import urllib.error
import urllib.request
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parent.parent
SENHA = "senha-de-teste-123"


@pytest.fixture(scope="module")
def servidor():
    tmp = tempfile.mkdtemp()
    os.environ["DB_PATH"] = str(Path(tmp) / "teste.db")
    os.environ["PAINEL_SENHA"] = SENHA
    sys.path.insert(0, str(ROOT))
    import importlib
    import app as appmod
    importlib.reload(appmod)
    import uvicorn
    s = socket.socket(); s.bind(("127.0.0.1", 0)); port = s.getsockname()[1]; s.close()
    srv = uvicorn.Server(uvicorn.Config(appmod.app, host="127.0.0.1", port=port, log_level="warning"))
    th = threading.Thread(target=srv.run, daemon=True); th.start()
    for _ in range(50):
        if srv.started:
            break
        time.sleep(0.1)
    yield f"http://127.0.0.1:{port}", appmod
    srv.should_exit = True


def chamar(base, path, body=None, headers=None, ip=None):
    h = {"content-type": "application/json", **(headers or {})}
    if ip:
        h["x-forwarded-for"] = ip
    req = urllib.request.Request(base + path, data=json.dumps(body).encode() if body is not None else None, headers=h)
    try:
        with urllib.request.urlopen(req, timeout=10) as r:
            raw = r.read()
            return r.status, (json.loads(raw) if r.headers.get("content-type", "").startswith("application/json") else raw.decode("utf-8", "replace"))
    except urllib.error.HTTPError as e:
        raw = e.read()
        try:
            return e.code, json.loads(raw)
        except Exception:
            return e.code, raw.decode("utf-8", "replace")


PAINEL = {"x-painel-senha": SENHA}


def test_serve_jogo_audios_e_painel(servidor):
    base, _ = servidor
    st, html = chamar(base, "/")
    assert st == 200 and "Fuga da Prisão" in html
    st, _ = chamar(base, "/audio/manifest.json")
    assert st == 200
    st, html = chamar(base, "/painel")
    assert st == 200 and "Painel do professor" in html
    assert chamar(base, "/api/saude")[1]["servidor"] == "nuvem-doce"


def test_nao_expoe_arquivos_do_servidor(servidor):
    base, _ = servidor
    for path in ["/app.py", "/dados/nuvem_doce.db", "/audio/../app.py", "/audio/%2e%2e/app.py", "/.git/config", "/render.yaml", "/src/game.js"]:
        st, _ = chamar(base, path)
        assert st == 404, f"{path} não deveria estar acessível"


def test_dispositivo_registra_e_atualiza(servidor):
    base, appmod = servidor
    st, j = chamar(base, "/api/dispositivo", {"id": "dteste0001", "plataforma": "celular"}, ip="10.0.0.1")
    assert st == 200 and j["ok"]
    chamar(base, "/api/dispositivo", {"id": "dteste0001", "plataforma": "celular"}, ip="10.0.0.1")
    row = appmod.q("SELECT * FROM dispositivos WHERE id='dteste0001'", one=True)
    assert row["acessos"] == 2 and row["plataforma"] == "celular"
    for ruim in [{"id": "x"}, {"id": "a" * 100}, {"id": "../../etc"}, {}, {"id": 123}]:
        assert chamar(base, "/api/dispositivo", ruim, ip="10.0.0.1")[0] == 400
    assert chamar(base, "/api/dispositivo", {"id": "dteste0002", "plataforma": "<script>"}, ip="10.0.0.1")[0] == 200
    assert appmod.q("SELECT plataforma FROM dispositivos WHERE id='dteste0002'", one=True)["plataforma"] == "outro"


def test_pontuacao_valida_e_ranking_ordenado(servidor):
    base, _ = servidor
    for nome, pts in [("Ana", 1500), ("Bia", 2500), ("Caio", 900)]:
        st, j = chamar(base, "/api/pontuacao", {"apelido": nome, "pontos": pts, "estrelas": 3, "tempo": "8:30", "final": "livre",
                                                 "avatar": {"s": 1, "h": 2}}, ip="10.0.0.2")
        assert st == 200 and j["ok"]
    st, j = chamar(base, "/api/ranking?limite=10")
    pts = [r["pontos"] for r in j["ranking"]]
    assert pts == sorted(pts, reverse=True) and pts[0] == 2500


def test_pontuacao_rejeita_dados_ruins_e_limpa_texto(servidor):
    base, appmod = servidor
    ruins = [{"pontos": "abc", "final": "livre"}, {"pontos": 100, "final": "hackeado"}, {"pontos": 100}, "texto", [1, 2]]
    for b in ruins:
        assert chamar(base, "/api/pontuacao", b, ip="10.0.0.3")[0] == 400
    st, j = chamar(base, "/api/pontuacao", {"apelido": "<img src=x onerror=1>\n\tmuito longo demais aqui", "pontos": 999999,
                                             "estrelas": 99, "tempo": "x", "final": "corrente", "avatar": {"s": 999}}, ip="10.0.0.3")
    assert st == 200
    r = appmod.q("SELECT * FROM pontuacoes WHERE id=?", (j["id"],), one=True)
    assert len(r["apelido"]) <= 16 and "\n" not in r["apelido"]
    assert r["pontos"] == 10000 and r["estrelas"] == 3 and r["tempo"] == "0:00"
    assert json.loads(r["avatar"])["s"] == 3


def test_corpo_grande_demais(servidor):
    base, _ = servidor
    st, _ = chamar(base, "/api/varal", {"mensagem": "a" * 10000}, ip="10.0.0.4")
    assert st == 400


def test_varal_salva_e_limita(servidor):
    base, appmod = servidor
    assert chamar(base, "/api/varal", {"mensagem": "ok"}, ip="10.0.0.5")[0] == 400
    st, _ = chamar(base, "/api/varal", {"apelido": "Lu", "mensagem": "Meu não é minha escolha 💪 " + "x" * 200}, ip="10.0.0.5")
    assert st == 200
    m = appmod.q("SELECT * FROM varal ORDER BY id DESC LIMIT 1", one=True)
    assert len(m["mensagem"]) == 120 and m["oculta"] == 0


def test_limite_de_envios(servidor):
    base, _ = servidor
    codes = [chamar(base, "/api/varal", {"mensagem": f"mensagem {i}"}, ip="10.9.9.9")[0] for i in range(14)]
    assert codes[:10] == [200] * 10 and 429 in codes[10:], codes


def test_painel_exige_senha(servidor):
    base, _ = servidor
    assert chamar(base, "/api/painel/dados")[0] == 401
    assert chamar(base, "/api/painel/dados", headers={"x-painel-senha": "errada"})[0] == 401
    assert chamar(base, "/api/painel/ocultar", {"id": 1, "oculta": True})[0] == 401
    assert chamar(base, "/api/painel/csv/varal")[0] == 401
    st, j = chamar(base, "/api/painel/dados", headers=PAINEL)
    assert st == 200 and j["resumo"]["partidas"] >= 3 and j["resumo"]["dispositivos"] >= 1


def test_painel_oculta_e_apaga(servidor):
    base, appmod = servidor
    mid = appmod.q("SELECT id FROM varal ORDER BY id DESC LIMIT 1", one=True)["id"]
    assert chamar(base, "/api/painel/ocultar", {"id": mid, "oculta": True}, headers=PAINEL)[0] == 200
    assert appmod.q("SELECT oculta FROM varal WHERE id=?", (mid,), one=True)["oculta"] == 1
    pid = appmod.q("SELECT id FROM pontuacoes WHERE apelido='Caio'", one=True)["id"]
    chamar(base, "/api/painel/apagar-pontuacao", {"id": pid}, headers=PAINEL)
    assert appmod.q("SELECT COUNT(*) n FROM pontuacoes WHERE id=?", (pid,), one=True)["n"] == 0


def test_csv_abre_no_excel_e_protege_formulas(servidor):
    base, _ = servidor
    chamar(base, "/api/varal", {"apelido": "Hacker", "mensagem": "=HYPERLINK(\"x\") cuidado"}, ip="10.0.0.6")
    st, txt = chamar(base, "/api/painel/csv/varal", headers=PAINEL)
    assert st == 200 and txt.startswith("﻿id;apelido;mensagem")
    assert "'=HYPERLINK" in txt, "fórmulas devem ser neutralizadas no CSV"
    for tipo in ("ranking", "dispositivos"):
        assert chamar(base, f"/api/painel/csv/{tipo}", headers=PAINEL)[0] == 200
    assert chamar(base, "/api/painel/csv/../../app", headers=PAINEL)[0] == 404


def test_jogo_completo_ligado_ao_servidor(servidor, make_game):
    """Joga pelo servidor: registra o aparelho, envia pontuação e Varal, e o ranking geral aparece."""
    base, appmod = servidor
    antes = appmod.q("SELECT COUNT(*) n FROM pontuacoes", one=True)["n"]
    g = make_game()
    g.p.goto(base + "/")
    g.p.wait_for_function("SERVER.on===true", timeout=8000)
    did = g.p.evaluate("deviceId()")
    assert appmod.q("SELECT COUNT(*) n FROM dispositivos WHERE id=?", (did,), one=True)["n"] == 1
    import conftest
    real = conftest.GAME
    conftest.GAME = base + "/"
    try:
        g.start("Servidor")
    finally:
        conftest.GAME = real
    g.play()
    g.p.wait_for_function("document.querySelector('#sub').innerText.includes('lugar')", timeout=10000)
    assert appmod.q("SELECT COUNT(*) n FROM pontuacoes", one=True)["n"] == antes + 1
    assert appmod.q("SELECT mensagem FROM varal ORDER BY id DESC LIMIT 1", one=True)["mensagem"] == "Meu não é minha escolha"
    assert g.p.query_selector("#rk .rr.me"), "a própria pontuação deve aparecer destacada no ranking geral"
    assert not g.errors, g.errors


def test_painel_no_navegador(servidor, make_game):
    base, _ = servidor
    chamar(base, "/api/varal", {"apelido": "<b>x</b>", "mensagem": "<img src=x onerror=\"window.__xss=1\"> oi"}, ip="10.0.0.7")
    g = make_game(viewport=(1280, 900))
    g.p.goto(base + "/painel")
    g.p.fill("#senha", "errada"); g.p.click("button[type=submit]")
    g.p.wait_for_function("document.querySelector('#err').innerText.length>0")
    g.p.fill("#senha", SENHA); g.p.click("button[type=submit]")
    g.p.wait_for_selector("#app:not(.hidden)")
    assert g.p.evaluate("window.__xss") is None, "mensagem com código não pode rodar no painel"
    assert "<img" in g.p.inner_text("#varal")
    assert int(g.p.inner_text("#cards .card b")) >= 0
    with g.p.expect_download() as d:
        g.p.click('[data-csv="varal"]')
    assert d.value.suggested_filename == "varal.csv"
    g.p.screenshot(path=str(ROOT / "tests" / "capturas" / "painel_professor.png"), full_page=True)
    assert not [e for e in g.errors if "401" not in e], g.errors
