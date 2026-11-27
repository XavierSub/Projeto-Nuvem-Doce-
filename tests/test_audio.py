"""Testes da narração com áudios gravados (site próprio / Render)."""
import io
import json
import struct
import wave

from conftest import GAME, ROOT

FALAS = json.loads((ROOT / "audio" / "falas.json").read_text(encoding="utf-8"))

AUDIO_SPY = """
window.__aud=[];(function(){const A=window.Audio;
window.Audio=function(src){const a=new A(src);
  const o=a.play.bind(a);a.play=function(){window.__aud.push({ev:'play',src:(a.src||'').split('/').pop(),rate:a.playbackRate});return o()};
  const op=a.pause.bind(a);a.pause=function(){window.__aud.push({ev:'pause',src:(a.src||'').split('/').pop()});return op()};
  return a};})();
"""


def silencio(ms=120):
    buf = io.BytesIO()
    with wave.open(buf, "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(8000)
        w.writeframes(struct.pack("<h", 0) * int(8 * ms))
    return buf.getvalue()


WAV = silencio()


def com_audios(g, faltando=()):
    """Serve um manifest com todas as falas (menos as 'faltando') apontando para áudios de teste."""
    manifest = {f["texto"]: f["id"] + ".wav" for f in FALAS if f["texto"] not in faltando}
    g.p.route("**/audio/manifest.json", lambda r: r.fulfill(status=200, content_type="application/json",
                                                             body=json.dumps(manifest, ensure_ascii=False)))
    g.p.route("**/audio/*.wav", lambda r: r.fulfill(status=200, content_type="audio/wav", body=WAV))
    return manifest


def plays(g):
    return [x for x in g.p.evaluate("window.__aud") if x["ev"] == "play" and x["src"]]


def test_toca_audios_em_ordem_sem_voz_robotica(make_game):
    g = make_game(extra_js=AUDIO_SPY)
    m = com_audios(g)
    g.start("Kai")
    g.p.wait_for_timeout(2500)
    files = [p["src"] for p in plays(g)]
    inv = {v: k for k, v in m.items()}
    textos = [inv.get(f, "?") for f in files]
    i = textos.index("Escolha uma opção:")
    assert [t[:8] for t in textos[i + 1:i + 5]] == ["Opção A:", "Opção B:", "Opção C:", "Opção D:"]
    assert g.p.evaluate("window.__spoken") == [], "nunca usar a voz robótica"
    assert not g.p.is_visible(".novoice-note")
    assert not g.errors, g.errors


def test_para_o_audio_ao_avancar(make_game):
    g = make_game(extra_js=AUDIO_SPY)
    com_audios(g)
    g.start("Kai")
    g.p.wait_for_timeout(300)
    n = len(g.p.evaluate("window.__aud"))
    g.p.click('.opt[data-i="1"]')
    g.p.wait_for_timeout(600)
    ev = g.p.evaluate("window.__aud")[n:]
    assert ev and ev[0]["ev"] == "pause", "a fala anterior deveria parar na hora"
    assert any(e["ev"] == "play" for e in ev[1:]), "e depois tocar a nova fala"
    assert not g.errors, g.errors


def test_fala_sem_audio_mostra_legenda_e_segue(make_game):
    g = make_game(extra_js=AUDIO_SPY)
    com_audios(g, faltando={"O laudo escondido"})
    g.start("Kai")
    g.p.wait_for_function("document.querySelector('#ntext').innerText.includes('O laudo escondido')", timeout=8000)
    g.p.wait_for_timeout(2500)
    assert any(p["src"] for p in plays(g)), "depois da fala sem áudio, continua tocando as próximas"
    assert not g.errors, g.errors


def test_velocidade_devagar_no_audio(make_game):
    g = make_game(extra_js=AUDIO_SPY)
    com_audios(g)
    g.p.goto(GAME); g.p.wait_for_timeout(400)
    g.p.click("#voz"); g.p.click('#vrate button[data-r="0.85"]'); g.p.wait_for_timeout(400)
    assert plays(g)[-1]["rate"] == 0.85


def test_partida_inteira_no_modo_audio(make_game):
    """Partida completa (com erros e fases extras) tocando os áudios, sem nenhum erro."""
    g = make_game(extra_js=AUDIO_SPY)
    com_audios(g)
    g.start("Kai", perk=1)
    g.play(rato="trago", diretor="atalho", enfermeiro="mentir", contrabando="compra", craving="cede", chase=("1", "1"), wrong=True)
    g.p.wait_for_timeout(1000)
    assert len(plays(g)) > 80, "deveria ter tocado muitos áudios"
    assert g.p.evaluate("window.__spoken") == []
    assert not g.errors, g.errors


def test_lista_de_falas_cobre_tudo_que_a_brisa_diz(make_game):
    """Compara o que a Brisa falaria numa partida nova com a lista de falas gravadas."""
    from conftest import claude_mock
    textos = {f["texto"] for f in FALAS}
    faltas = set()
    for caminho in ("bom", "ruim"):
        g = make_game(claude=claude_mock())
        g.start("Zé", perk=2)
        if caminho == "bom":
            g.play(wrong=True)
        else:
            g.play(rato="trago", diretor="atalho", enfermeiro="mentir", contrabando="compra", craving="cede", chase=("1", "1"))
        g.p.wait_for_timeout(800)
        for c in g.p.evaluate("window.__tts"):
            if c["kind"] in ("speak", "add"):
                faltas |= {l["text"] for l in c["lines"] if l["text"] not in textos}
    assert not faltas, f"falas sem áudio: {sorted(faltas)[:10]}"
