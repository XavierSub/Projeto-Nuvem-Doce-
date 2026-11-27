"""Testes de narração: o que a Brisa fala, com qual voz e quando para."""
import re

from conftest import GAME, claude_mock

EMOJI = re.compile("[\U0001F300-\U0001FAFF☀-➿█▌]")
SHOUT = re.compile(r"(?<![\wÀ-ú])(?!EVALI|SUS|UBS|RDC)[A-ZÀ-ÚÇ]{3,}(?![\wÀ-ú])")


def tts_calls(g, kind=None):
    calls = g.p.evaluate("window.__tts")
    return [c for c in calls if kind is None or c["kind"] == kind]


def spoken_lines(g):
    out = []
    for c in tts_calls(g):
        if c["kind"] in ("speak", "add"):
            out += [l["text"] for l in c["lines"]]
    return out


def web_spoken(g):
    return g.p.evaluate("window.__spoken")


def test_brisa_le_o_jogo_inteiro_com_a_mesma_voz(make_game):
    g = make_game(claude=claude_mock())
    g.start("Kai")
    g.play()
    calls = [c for c in tts_calls(g) if c["kind"] in ("speak", "add")]
    assert len(calls) > 60, "esperava muitas falas durante a partida"
    for c in calls:
        assert c["opts"]["voice"] == "airy" and c["opts"]["language"] == "pt-BR"
        assert len(c["lines"]) <= 100
        for l in c["lines"]:
            assert l["voice"] == "airy" and l["language"] == "pt-BR", "cada linha precisa travar a voz da Brisa"
            assert 0 < len(l["text"]) <= 1900
    assert web_spoken(g) == [], "a voz robótica do aparelho nunca deve ser usada"
    assert not g.errors, g.errors


def test_texto_falado_e_limpo(make_game):
    g = make_game(claude=claude_mock())
    g.start("Kai")
    g.play(rato="trago", diretor="atalho", contrabando="compra", craving="cede", chase=("0", "1", "1"))
    lines = spoken_lines(g)
    for t in lines:
        assert not EMOJI.search(t), f"emoji/símbolo na fala: {t!r}"
        assert "<" not in t and ">" not in t, f"código na fala: {t!r}"
        assert not SHOUT.search(t), f"palavra em MAIÚSCULAS (seria soletrada): {t!r}"
        assert not re.search(r"\bundefined\b|\bNaN\b|\[object", t), t
    assert not g.errors, g.errors


def test_le_pergunta_e_todas_as_opcoes_em_ordem(make_game):
    g = make_game(claude=claude_mock())
    g.start("Kai")
    g.p.wait_for_timeout(600)
    lines = spoken_lines(g)
    i = lines.index("Escolha uma opção:")
    assert "fumacinha" in lines[i - 1]
    assert [l[:8] for l in lines[i + 1:i + 5]] == ["Opção A:", "Opção B:", "Opção C:", "Opção D:"]
    assert "aerossol aquecido" in lines[i + 2]


def test_le_historia_personagens_e_consequencias(make_game):
    g = make_game(claude=claude_mock())
    g.start("Kai")
    g.p.click('.opt[data-i="1"]'); g.nx()
    g.p.wait_for_timeout(400)
    lines = spoken_lines(g)
    assert any(l.startswith("Rato fala:") for l in lines)
    assert any(l.startswith("Opção 1:") for l in lines) and any(l.startswith("Opção 3:") for l in lines)
    g.p.click('.ch[data-i="0"]'); g.p.wait_for_timeout(500)
    lines = spoken_lines(g)
    assert any("Primeira dose" in l for l in lines), "a consequência da escolha deve ser lida"


def test_para_de_falar_ao_avancar(make_game):
    """Ao tocar para avançar, a fala anterior é interrompida antes da próxima começar."""
    g = make_game(claude=claude_mock())
    g.start("Kai")
    g.p.wait_for_timeout(400)
    clicks = 0
    for sel in ['.opt[data-i="1"]', "#nx", '.ch[data-i="1"]', "#nx"]:
        n_before = len(tts_calls(g))
        g.p.click(sel); clicks += 1
        g.p.wait_for_timeout(400)
        after = tts_calls(g)[n_before:]
        assert after and after[0]["kind"] == "stop", f"depois de clicar em {sel} a primeira ação deveria ser parar a fala"
        assert any(c["kind"] == "speak" for c in after), f"depois de {sel} a Brisa deveria ler a nova parte"
    assert not g.errors, g.errors


def test_falhas_da_voz_nao_trocam_voz_nem_repetem_fala_velha(make_game):
    g = make_game(claude=claude_mock(fail_every=3))
    g.start("Kai")
    g.play()
    calls = tts_calls(g)
    assert any(c["kind"] == "RL" for c in calls), "o teste deveria ter simulado falhas"
    assert web_spoken(g) == [], "nunca trocar para a voz do aparelho"
    for i, c in enumerate(calls):
        if c["kind"] != "RL":
            continue
        for j in range(i + 1, len(calls)):
            if calls[j]["kind"] == "add" and calls[j]["lines"] == c["lines"]:
                between = [x["kind"] for x in calls[i + 1:j]]
                assert "speak" not in between and "stop" not in between, "repetiu uma fala velha depois de avançar"
                break
    assert "livre" in g.p.inner_text("h1").lower()
    assert not g.errors, g.errors


def test_cliques_rapidos_nao_quebram(make_game):
    g = make_game(claude=claude_mock(fail_every=2))
    g.start("Kai")
    for _ in range(3):
        g.p.click(".relisten"); g.p.wait_for_timeout(30)
    g.p.click('.opt[data-i="1"]'); g.p.click("#nx"); g.p.wait_for_timeout(50)
    g.p.click('.ch[data-i="2"]'); g.p.click("#nx")
    g.p.wait_for_selector("#mvbtns")
    assert not g.errors, g.errors


def test_destaque_acompanha_a_leitura(make_game):
    g = make_game(claude=claude_mock())
    g.start("Kai")
    g.p.wait_for_timeout(800)
    hl = g.p.evaluate("window.__hl")
    pares = [(t, h) for t, h in hl if t.startswith("Opção B")]
    assert pares and pares[-1][1] and "aerossol aquecido" in pares[-1][1], "a opção lida deve ficar destacada"


def test_liga_desliga_narracao(make_game):
    g = make_game(claude=claude_mock())
    g.start("Kai")
    g.p.click("#narrbtn")
    n = len([c for c in tts_calls(g) if c["kind"] in ("speak", "add")])
    g.p.click('.opt[data-i="1"]'); g.nx(); g.p.wait_for_timeout(400)
    assert len([c for c in tts_calls(g) if c["kind"] in ("speak", "add")]) == n, "com a narração desligada não deve falar"
    assert not g.p.is_visible(".relisten")
    g.p.click("#narrbtn"); g.p.wait_for_timeout(300)
    assert any("Voltei" in l for l in spoken_lines(g))


def test_ouvir_de_novo_e_botao_ouvir(make_game):
    g = make_game(claude=claude_mock())
    g.start("Kai")
    g.p.wait_for_timeout(300)
    n = len(tts_calls(g))
    g.p.click(".relisten"); g.p.wait_for_timeout(300)
    novas = [l["text"] for c in tts_calls(g)[n:] if c["kind"] == "speak" for l in c["lines"]]
    assert "O laudo escondido" in novas
    g.p.click('.opt[data-i="0"]'); g.p.wait_for_selector(".fb.bad .listen")
    n = len(tts_calls(g))
    g.p.click(".fb.bad .listen"); g.p.wait_for_timeout(300)
    novas = [l["text"] for c in tts_calls(g)[n:] if c["kind"] == "speak" for l in c["lines"]]
    assert any("vapor de água" in l for l in novas)


def test_velocidade_devagar_fica_salva(make_game):
    g = make_game(claude=claude_mock())
    g.p.goto(GAME); g.p.wait_for_timeout(300)
    g.p.click("#voz"); g.p.click('#vrate button[data-r="0.85"]'); g.p.wait_for_timeout(300)
    assert tts_calls(g, "speak")[-1]["opts"]["rate"] == 0.85
    g.p.click("#vclose")
    g.p.reload(); g.p.wait_for_timeout(300)
    g.p.click("#new"); g.p.wait_for_timeout(400)
    assert tts_calls(g, "speak")[-1]["opts"]["rate"] == 0.85


def test_conversa_da_rodinha_lida_em_ordem(make_game):
    g = make_game(claude=claude_mock())
    g.start("Kai")
    g.phase1(); g.np(); g.phase2(); g.np(); g.phase3(); g.np(); g.phase4(); g.np()
    g.p.click("#run"); g.p.wait_for_selector("#nx", timeout=8000); g.nx()
    g.p.wait_for_selector("#q .opt", timeout=15000)
    adds = [l["text"] for c in tts_calls(g, "add") for l in c["lines"]]
    falas = [a for a in adds if " diz: " in a]
    assert [f.split(" diz:")[0] for f in falas[:3]] == ["Lucas", "Bia", "Lucas"]
    assert any(a.startswith("Opção A:") for a in adds)


def test_sem_voz_da_brisa_fica_so_legenda(make_game):
    """Sem a voz da Brisa e sem áudios gravados: só legenda, nunca voz robótica."""
    g = make_game()  # sem claude.ai e sem áudios gravados
    g.p.route("**/audio/manifest.json", lambda r: r.fulfill(status=200, content_type="application/json", body="{}"))
    g.p.goto(GAME); g.p.wait_for_selector("#new")
    assert g.p.is_visible(".novoice-note")
    g.p.click("#new"); g.p.fill("#nm", "Kai"); g.p.click("#ok"); g.p.click("#go"); g.wait_tr()
    g.p.wait_for_timeout(600)
    assert web_spoken(g) == [], "não pode usar a voz robótica do aparelho"
    assert g.p.is_visible("#narr") and g.p.inner_text("#ntext").strip()
    assert not g.p.is_visible(".relisten")
    assert not g.errors, g.errors


def test_claude_sem_tts_tambem_fica_so_legenda(make_game):
    g = make_game(claude=claude_mock(tts=False))
    g.p.route("**/audio/manifest.json", lambda r: r.fulfill(status=200, content_type="application/json", body="{}"))
    g.start("Kai")
    g.p.wait_for_timeout(500)
    assert web_spoken(g) == []
    assert g.p.inner_text("#ntext").strip()
    assert not g.errors, g.errors


def test_voz_da_brisa_atrasada_nao_deixa_muda(make_game):
    """Se a voz da Brisa demorar para carregar, ela começa a falar assim que chegar."""
    g = make_game(claude=claude_mock(tts_delay=7000))
    g.p.goto(GAME); g.p.click("#new"); g.p.fill("#nm", "Kai"); g.p.click("#ok")
    g.p.wait_for_timeout(4500)
    assert not tts_calls(g), "ainda não deveria ter voz"
    assert g.p.inner_text("#ntext").strip(), "enquanto isso, a legenda aparece"
    g.p.wait_for_timeout(3500)
    g.p.click("#go"); g.wait_tr(); g.p.wait_for_timeout(500)
    assert any(c["kind"] == "speak" for c in tts_calls(g)), "a Brisa deveria falar depois que a voz chegou"
    assert web_spoken(g) == []
    assert not g.errors, g.errors


def test_celular_no_claude_toca_audios_gravados(make_game):
    """No claude.ai sem a voz da Brisa (ex.: celular), toca os áudios gravados."""
    from test_audio import AUDIO_SPY
    g = make_game(claude=claude_mock(tts=False), extra_js=AUDIO_SPY)
    g.start("Kai")
    g.p.wait_for_timeout(1500)
    assert g.p.evaluate("engine()") == "audio"
    assert any(e["ev"] == "play" for e in g.p.evaluate("window.__aud"))
    assert web_spoken(g) == []
    assert not g.errors, g.errors
