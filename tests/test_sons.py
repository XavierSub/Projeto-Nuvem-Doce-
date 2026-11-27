"""Testes dos efeitos sonoros (Web Audio)."""
from conftest import GAME

SPY = """
window.__osc=[];window.__src=0;window.__resume=0;
(function(){const P=(window.AudioContext||window.webkitAudioContext).prototype;
const co=P.createOscillator;P.createOscillator=function(){const o=co.call(this);const sv=o.frequency.setValueAtTime.bind(o.frequency);
  o.frequency.setValueAtTime=(v,t)=>{window.__osc.push({f:v,type:o.type,t:performance.now()});return sv(v,t)};return o};
const cb=P.createBufferSource;P.createBufferSource=function(){window.__src++;return cb.call(this)};
const rs=P.resume;P.resume=function(){window.__resume++;return rs.call(this)};})();
"""


def freqs(g, desde=0):
    return [o["f"] for o in g.p.evaluate("window.__osc")[desde:]]


def test_audio_liberado_no_primeiro_toque(make_game):
    g = make_game(extra_js=SPY)
    g.p.goto(GAME); g.p.wait_for_selector("#new")
    assert g.p.evaluate("AC") is None, "o áudio só deve ser criado depois de um toque"
    g.p.click("#new")
    g.p.wait_for_timeout(300)
    assert g.p.evaluate("AC&&AC.state") == "running"
    assert 1800 in freqs(g), "o clique deve tocar"


def test_audio_volta_se_o_celular_pausar(make_game):
    g = make_game(extra_js=SPY)
    g.p.goto(GAME); g.p.click("#new"); g.p.wait_for_timeout(200)
    g.p.evaluate("AC.suspend()"); g.p.wait_for_timeout(200)
    assert g.p.evaluate("AC.state") == "suspended"
    g.p.click('#r-p button[data-v="1"]'); g.p.wait_for_timeout(300)
    assert g.p.evaluate("AC.state") == "running", "um toque deve destravar o som de novo"


def test_sons_de_acerto_erro_e_grade(make_game):
    g = make_game(extra_js=SPY)
    g.start("Som")
    n = len(freqs(g))
    g.p.click('.opt[data-i="0"]'); g.p.wait_for_selector(".fb.bad"); g.p.wait_for_timeout(200)
    assert 440 in freqs(g, n), "erro deve tocar o som de alarme"
    n = len(freqs(g))
    g.p.click('.opt[data-i="1"]'); g.p.wait_for_selector("#nx"); g.p.wait_for_timeout(300)
    assert 880 in freqs(g, n) and 1320 in freqs(g, n), "acerto deve tocar o som de vitória"
    g.nx()
    g.p.click('.ch[data-i="1"]'); g.nx()
    for v in ["0", "1", "0"]:
        g.p.click(f'#mvbtns button[data-v="{v}"]'); g.p.wait_for_timeout(700)
        if g.p.query_selector("#nc"): g.p.click("#nc")
    g.nx()
    for k in [0, 2, 4, 6, 7]: g.p.click(f'.sc[data-k="{k}"]')
    g.p.click("#go"); g.nx()
    src0 = g.p.evaluate("window.__src")
    g.p.wait_for_timeout(700)
    assert g.p.evaluate("window.__src") > src0, "abrir a grade deve tocar o 'clank' metálico"
    assert not g.errors, g.errors


def test_sem_graves_que_celular_nao_toca(make_game):
    """Alto-falante de celular quase não reproduz abaixo de ~250 Hz: nenhum som deve começar tão grave."""
    g = make_game(extra_js=SPY)
    g.start("Grave")
    g.play(rato="trago", diretor="atalho", enfermeiro="mentir", contrabando="compra", craving="cede", chase=("1", "1"), wrong=True)
    fs = [f for f in freqs(g) if f > 0]
    assert fs and min(fs) >= 250, f"som grave demais: {min(fs)} Hz"
    assert not g.errors, g.errors


def test_botao_desliga_os_efeitos(make_game):
    g = make_game(extra_js=SPY)
    g.start("Mudo")
    g.p.click("#mute")
    n = len(freqs(g)); s = g.p.evaluate("window.__src")
    g.p.click('.opt[data-i="0"]'); g.p.wait_for_selector(".fb.bad")
    g.p.click('.opt[data-i="1"]'); g.p.wait_for_selector("#nx"); g.p.wait_for_timeout(300)
    assert len(freqs(g)) == n, "com 🔇 não deve tocar efeitos"
    g.p.click("#mute"); n = len(freqs(g))
    g.nx(); g.p.wait_for_timeout(200)
    assert len(freqs(g)) > n, "ligando de novo, os efeitos voltam"
