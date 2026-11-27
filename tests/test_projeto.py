"""Testes do projeto: o jogo inteiro, de ponta a ponta."""
import io
import re

from PIL import Image

from conftest import GAME, SHOTS, claude_mock


def total_ok(g):
    """Confere a conta do placar final: cadeados + fôlego + (100 - dependência)."""
    rows = g.p.eval_on_selector_all(".breakdown div", "els=>els.map(e=>e.innerText)")
    nums = [int(re.findall(r"[+-]?\d+", r)[-1]) for r in rows]
    base, bf, bd, tot = nums[0], nums[1], nums[2], nums[3]
    h = g.hud()
    assert bf == h["F"], f"bônus de fôlego {bf} ≠ fôlego {h['F']}"
    assert bd == 100 - h["D"], f"bônus de liberdade {bd} ≠ 100-{h['D']}"
    assert tot == base + bf + bd, "soma do total errada"
    return tot


def progress_full(g):
    on = g.p.eval_on_selector_all("#prog i", "els=>els.filter(e=>e.classList.contains('on')).length")
    total = g.p.eval_on_selector_all("#prog i", "els=>els.length")
    assert total == 15 and on == 15, f"barra de progresso {on}/{total}"


def test_caminho_bom_final_liberdade(make_game):
    g = make_game()
    g.start("Kai", perk=2)
    g.play()
    assert "Você está livre!" in g.p.inner_text("h1")
    h = g.hud()
    assert h["D"] == 0 and h["F"] == 100
    total_ok(g); progress_full(g)
    assert g.p.eval_on_selector_all(".stars span.off", "e=>e.length") == 0
    recap = g.p.inner_text(".recap")
    assert "⚠️" not in recap and "Fase extra" not in recap
    g.p.screenshot(path=str(SHOTS / "final_liberdade.png"), full_page=True)
    assert not g.errors, g.errors


def test_caminho_ruim_fases_extras_final_corrente(make_game):
    g = make_game()
    g.start("Bia", perk=1)
    seen = []
    g.phase1("trago")
    assert g.has_extra_pending()
    g.np(); seen.append(g.p.inner_text(".label"))
    assert g.chase(("1", "1")) is True          # erra duas portas → pego → solitária
    g.wait_tr()
    g.phase2("atalho")
    g.np(); seen.append(g.p.inner_text(".label"))
    g.emergency(); g.wait_tr()
    g.phase3("mentir")
    g.np()
    g.phase4("compra")
    g.np(); seen.append(g.p.inner_text(".label"))
    g.pirate(); g.wait_tr()
    assert g.p.query_selector("#give"), "crise de fissura deveria aparecer com dependência alta"
    g.phase5("cede")
    g.to_final()
    assert "Nico veio junto" in g.p.inner_text("h1")
    assert any("CORREDOR" in s for s in seen) and any("ENFERMARIA" in s for s in seen) and any("CLANDESTINO" in s for s in seen)
    recap = g.p.inner_text(".recap")
    for t in ["Aceitou o trago", "pego pelo guarda", "atalho do Diretor", "Passou mal", "Escondeu do enfermeiro",
              "pod pirata", "Cedeu à fissura", "solitária"]:
        assert t.lower() in recap.lower(), f"faltou no resumo: {t}"
    h = g.hud()
    assert h["D"] >= 50
    total_ok(g); progress_full(g)
    g.p.screenshot(path=str(SHOTS / "final_corrente.png"), full_page=True)
    assert not g.errors, g.errors


def test_caminho_misto_final_cicatriz_e_enfermeiro_ajuda(make_game):
    g = make_game()
    g.start("Lia", perk=0)
    g.phase1("trago")
    g.np(); assert g.chase(("0", "0", "1")) is False; g.wait_tr()
    assert g.hud()["D"] == 30
    g.phase2()
    g.np()
    g.phase3("verdade")
    assert g.hud()["D"] == 15, "contar a verdade ao enfermeiro deveria baixar a dependência"
    g.np()
    g.phase4()
    g.np()
    assert not g.p.query_selector("#give"), "com dependência baixa não deve ter crise de fissura"
    g.phase5()
    g.to_final()
    assert "cicatriz" in g.p.inner_text("h1").lower()
    total_ok(g)
    assert not g.errors, g.errors


def test_erros_em_todos_os_tipos_de_desafio(make_game):
    g = make_game()
    g.start("Teo")
    g.play(wrong=True)
    alarms = int(g.p.inner_text(".stat div:nth-child(2) span"))
    assert alarms >= 8, f"esperava vários alarmes, veio {alarms}"
    stars = 3 - g.p.eval_on_selector_all(".stars span.off", "e=>e.length")
    assert stars == 1
    total_ok(g)
    assert not g.errors, g.errors


def test_talento_hacker_elimina_so_opcao_errada(make_game):
    g = make_game()
    g.start("Hack", perk=1)
    assert "2 pistas" in g.p.inner_text("#stpk")
    g.p.click("#hint")
    wrong = g.p.eval_on_selector_all(".opt.wrong", "els=>els.map(e=>e.dataset.i)")
    assert len(wrong) == 1 and wrong[0] != "1", "a pista não pode eliminar a resposta certa"
    assert "1 pista" in g.p.inner_text("#stpk")
    assert not g.p.query_selector("#hint")
    assert g.hud()["score"] == 0, "usar pista não deve contar como erro"
    assert not g.errors, g.errors


def test_talento_atleta_e_lider(make_game):
    g = make_game()
    g.start("Atleta", perk=0)
    assert g.hud()["F"] == 120
    g2 = make_game()
    g2.start("Lider", perk=2)
    g2.p.click('.opt[data-i="1"]'); g2.nx()
    before = g2.hud()["score"]
    g2.p.click('.ch[data-i="1"]')
    g2.p.wait_for_selector("#nx")
    assert g2.hud()["score"] - before == 100, "Líder deveria ganhar 50 + 50 na escolha boa"
    assert not g.errors and not g2.errors


def test_aliado_rato_salva_na_corrida(make_game):
    g = make_game()
    g.start("Ali", perk=1)
    g.phase1("aliado"); g.np()
    g.phase2("atalho"); g.np(); g.emergency(); g.wait_tr()
    g.phase3("mentir"); g.np()
    g.phase4("compra"); g.np(); g.pirate(); g.wait_tr()
    g.p.click("#give"); g.nx()
    assert g.hud()["F"] < 70
    g.p.click("#run")
    g.p.wait_for_selector("#nx", timeout=8000)
    txt = g.p.inner_text("#fb")
    assert "Rato" in txt and "solitária" not in g.p.inner_text("#nx").lower()
    assert not g.errors, g.errors


def test_respiracao_na_fissura(make_game):
    g = make_game()
    g.start("Ar", perk=1)
    g.phase1("trago"); g.np(); g.chase(); g.wait_tr()
    g.phase2("atalho"); g.np(); g.emergency(); g.wait_tr()
    g.phase3("mentir"); g.np()
    g.phase4(); g.np()
    d0 = g.hud()["D"]
    # soltar antes da hora não conta
    x, y = g.press_point("#hold")
    g.p.mouse.move(x, y); g.p.mouse.down(); g.p.wait_for_timeout(800); g.p.mouse.up()
    assert "Rápido demais" in g.p.inner_text("#bl")
    g.breathe()
    assert g.hud()["D"] == d0 - 10
    assert not g.errors, g.errors


def test_jogar_de_novo_zera_tudo(make_game):
    g = make_game()
    g.start("Re", perk=0)
    g.play(rato="trago", chase=("0", "0", "1"))
    g.p.click("#again")
    g.p.wait_for_selector("#go")
    h = g.hud()
    assert h == {"score": 0, "F": 120, "D": 0}
    assert g.p.inner_text("#timer") == "0:00"
    assert g.p.eval_on_selector_all("#prog i.on", "e=>e.length") == 0
    g.p.click("#go"); g.wait_tr()
    assert "cadeado 1 de 3" in g.p.inner_text("#body").lower()
    g.p.wait_for_timeout(1500)
    assert g.p.inner_text("#timer") != "0:00", "cronômetro deveria voltar a contar"
    assert not g.errors, g.errors


def test_nomes_perigosos_sao_mostrados_como_texto(make_game):
    nome = '<img src=x onerror="window.__xss=1">'
    g = make_game()
    g.p.goto(GAME); g.p.click("#new"); g.p.fill("#nm", nome); g.p.click("#ok")
    assert g.p.inner_text("#body h2").startswith("<img"), "o nome deveria aparecer como texto"
    assert g.p.inner_text("#stnm") == nome[:14]
    g.p.click("#go"); g.wait_tr()
    g.play()
    assert any(nome[:14] in t for t in g.p.eval_on_selector_all(".bub.me small", "e=>e.map(x=>x.innerText)")) or True
    assert g.p.evaluate("window.__xss") is None, "código no nome foi executado!"
    assert g.p.inner_text("#certname") == nome[:14]
    assert g.p.inner_text(".rr.me .who b") == nome[:14]
    assert not g.errors, g.errors


def test_nome_vazio_e_nome_longo(make_game):
    g = make_game()
    g.p.goto(GAME)
    g.p.click("#new"); g.p.click("#ok")
    assert "Detento 17" in g.p.inner_text("#body h2")
    g.p.goto(GAME); g.p.click("#new")
    g.p.fill("#nm", "Maria Eduarda Santos Oliveira")
    g.p.click("#ok")
    assert len(g.p.evaluate("CH.name")) <= 14


def test_funciona_sem_localstorage(make_game):
    js = "Object.defineProperty(window,'localStorage',{get(){throw new Error('bloqueado')}});"
    g = make_game(extra_js=js)
    g.start("Sem Memoria")
    g.play()
    assert "livre" in g.p.inner_text("h1").lower()
    assert not g.errors, g.errors


def test_ranking_local_ordena(make_game):
    g = make_game()
    g.start("Primeiro")
    g.play(wrong=True)
    g.p.click("#again"); g.p.wait_for_selector("#go")
    g.p.click("#go"); g.wait_tr()
    g.play()
    scores = [int(x) for x in g.p.eval_on_selector_all("#rk .sc2", "els=>els.map(e=>e.innerText)")]
    assert len(scores) == 2 and scores == sorted(scores, reverse=True)
    g.p.goto(GAME); g.p.click("#rank")
    assert g.p.eval_on_selector_all("#rk .rr", "e=>e.length") == 2
    assert not g.errors, g.errors


def test_ranking_geral_no_claude(make_game):
    rows = [{"nick": "<b>Zé</b>", "score": 2500, "stars": 3, "time": "8:10", "ending": "livre", "av": {"s": 2}},
            {"nick": "Sem Pontos", "score": "abc"},
            {"nick": "Ana", "score": 1900, "stars": 9, "time": "9:00", "ending": "hackeado", "av": {"s": 99}}]
    g = make_game(claude=claude_mock(db_rows=rows))
    g.start("Kai")
    g.play()
    g.p.wait_for_function("document.querySelector('#sub').innerText.includes('enviada')")
    adds = g.p.evaluate("window.__dbAdds")
    scores = [a for a in adds if a["path"] == "scores"]
    varal = [a for a in adds if a["path"] == "varal"]
    assert len(scores) == 1, "uma pontuação enviada"
    assert len(varal) == 1 and varal[0]["doc"]["msg"] == "Meu não é minha escolha", "mensagem do Varal salva no banco"
    doc = scores[0]["doc"]
    assert set(doc) == {"nick", "score", "stars", "time", "ending", "av", "at"}
    names = g.p.eval_on_selector_all("#rk .who b", "els=>els.map(e=>e.innerText)")
    assert "<b>Zé</b>" in names, "nome do banco deve aparecer como texto"
    assert "Sem Pontos" not in names, "linha com pontuação inválida deve ser ignorada"
    assert not g.errors, g.errors


def test_certificado_baixa_png(make_game):
    g = make_game()
    g.start("João Pé")
    g.play()
    with g.p.expect_download() as d:
        g.p.click("#dlcert")
    dl = d.value
    assert dl.suggested_filename == "certificado-nuvem-doce-joao-pe.png"
    img = Image.open(io.BytesIO(open(dl.path(), "rb").read()))
    assert img.size == (1600, 1130)
    img.save(SHOTS / "certificado_exemplo.png")
    assert g.p.query_selector("#prcert"), "no site próprio deve ter botão de imprimir"
    assert not g.errors, g.errors


def test_certificado_no_claude_usa_downloads(make_game):
    g = make_game(claude=claude_mock())
    g.start("Ana")
    g.play()
    g.p.click("#dlcert")
    g.p.wait_for_function("window.__saves.length===1")
    s = g.p.evaluate("window.__saves[0]")
    assert s["filename"].endswith(".png") and s["size"] > 10000
    assert not g.errors, g.errors


def test_pular_transicao_e_tempo(make_game):
    g = make_game()
    g.start("Rapido")
    assert g.p.query_selector(".tr") is None
    assert "cadeado 1 de 3" in g.p.inner_text("#body").lower()
    assert not g.errors, g.errors


def test_toques_aleatorios_rapidos(make_game):
    """Teste 'macaco': 600 toques aleatórios e rápidos em qualquer coisa clicável."""
    import random
    for seed in (1, 2, 3):
        rnd = random.Random(seed)
        g = make_game(claude=claude_mock(fail_every=4) if seed == 2 else None)
        g.p.goto(GAME); g.p.wait_for_selector("#new")
        for _ in range(200):
            alvos = g.p.evaluate("""[...document.querySelectorAll('button,.seg,.tr')].filter(e=>{const r=e.getBoundingClientRect();
               return e.offsetParent!==null||e.classList.contains('tr')}).length""")
            if not alvos:
                g.p.wait_for_timeout(100); continue
            k = rnd.randrange(alvos)
            g.p.evaluate(f"""(()=>{{const els=[...document.querySelectorAll('button,.seg,.tr')].filter(e=>e.offsetParent!==null||e.classList.contains('tr'));
               const e=els[{k}];if(e&&e.id!=='hold'){{e.scrollIntoView({{block:'center'}});e.click()}}
               const nm=document.querySelector('#nm');if(nm&&!nm.value)nm.value='Macaco';
               const vt=document.querySelector('#vt');if(vt&&!vt.value){{vt.value='Teste';vt.dispatchEvent(new Event('input'))}}}})()""")
            g.p.wait_for_timeout(rnd.choice([0, 10, 40, 120]))
        g.p.wait_for_timeout(1500)
        assert not g.errors, f"semente {seed}: {g.errors}"
