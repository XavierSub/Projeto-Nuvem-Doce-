"""Testes de interface: tamanhos de tela, rolagem, toques e sobreposições."""
import pytest

from conftest import GAME, SHOTS

TELAS = [(320, 568, "celular_pequeno"), (360, 740, "android"), (390, 844, "iphone"),
         (768, 1024, "tablet"), (1366, 768, "notebook")]

OVERFLOW_JS = "document.documentElement.scrollWidth - window.innerWidth"
# Botões do jogo com área de toque pequena (menos de 40 px de altura)
SMALL_JS = """[...document.querySelectorAll('#screen .btn,#screen .opt,#screen .ch,#screen .door,#screen .sc,#screen .chip,#screen .tabs button')]
  .filter(e=>e.offsetParent!==null).map(e=>[e.innerText.slice(0,25),Math.round(e.getBoundingClientRect().height)]).filter(x=>x[1]<40)"""
# Elementos cortados para fora da tela na horizontal
CLIP_JS = """[...document.querySelectorAll('#screen *')].filter(e=>{const r=e.getBoundingClientRect();
  return e.offsetParent!==null&&r.width>0&&(r.right>window.innerWidth+1||r.left<-1)&&!e.closest('.scene')}).map(e=>e.className||e.tagName).slice(0,5)"""


def snap(g, nome):
    g.p.screenshot(path=str(SHOTS / f"{nome}.png"))


def assert_layout(g, onde):
    assert g.p.evaluate(OVERFLOW_JS) <= 1, f"rolagem lateral em {onde}"
    clipped = g.p.evaluate(CLIP_JS)
    assert not clipped, f"elementos saindo da tela em {onde}: {clipped}"


@pytest.mark.parametrize("w,h,nome", TELAS)
def test_telas_principais_em_varios_tamanhos(make_game, w, h, nome):
    g = make_game(viewport=(w, h))
    g.p.goto(GAME); g.p.wait_for_selector("#new")
    assert_layout(g, "tela inicial"); snap(g, f"{nome}_1_inicio")
    g.p.click("#new"); assert_layout(g, "criação de personagem"); snap(g, f"{nome}_2_personagem")
    g.p.fill("#nm", "Kai"); g.p.click("#ok")
    assert_layout(g, "abertura"); snap(g, f"{nome}_3_abertura")
    g.p.click("#go"); g.p.wait_for_timeout(700); snap(g, f"{nome}_4_transicao"); g.wait_tr()
    assert_layout(g, "fase 1"); snap(g, f"{nome}_5_fase1")
    small = g.p.evaluate(SMALL_JS)
    assert not small, f"botões pequenos demais para tocar: {small}"
    g.p.click('.opt[data-i="0"]'); g.p.wait_for_selector(".fb.bad")
    assert_layout(g, "resposta errada")
    g.p.click('.opt[data-i="1"]'); g.p.wait_for_selector("#nx")
    assert_layout(g, "resposta certa"); snap(g, f"{nome}_6_acerto")
    assert not g.errors, g.errors


def test_partida_completa_no_celular_pequeno(make_game):
    g = make_game(viewport=(320, 568), cover_check=True)
    g.start("Kai")
    g.play()
    assert_layout(g, "final")
    g.p.screenshot(path=str(SHOTS / "celular_pequeno_7_final.png"), full_page=True)
    assert not g.errors, g.errors


def test_partida_ruim_no_celular_pequeno(make_game):
    g = make_game(viewport=(320, 568), cover_check=True)
    g.start("Bia", perk=1)
    g.play(rato="trago", diretor="atalho", enfermeiro="mentir", contrabando="compra", craving="cede", chase=("1", "1"))
    assert_layout(g, "final ruim")
    assert not g.errors, g.errors


def test_balao_da_brisa_nao_tampa_botao(make_game):
    """Com a legenda da Brisa aberta, o botão 'Continuar' rolado até ele fica visível."""
    g = make_game(viewport=(360, 640))
    g.start("Kai")
    g.p.click('.opt[data-i="1"]')
    g.p.wait_for_selector("#nx")
    g.p.evaluate("document.querySelector('#narr').classList.add('show')")
    g.p.locator("#nx").scroll_into_view_if_needed(); g.p.wait_for_timeout(500)
    over = g.p.evaluate("""(()=>{const a=document.querySelector('#nx').getBoundingClientRect(),
       b=document.querySelector('#narr .nb').getBoundingClientRect();
       return !(a.bottom<=b.top||a.top>=b.bottom||a.right<=b.left||a.left>=b.right)})()""")
    assert not over, "o balão da Brisa está cobrindo o botão"
    snap(g, "balao_e_botao")


def test_movimento_reduzido(make_game):
    g = make_game(reduced=True)
    g.start("Calmo")
    g.phase1()
    g.np()
    assert "cofre" in g.p.inner_text("#body").lower()
    assert not g.errors, g.errors


def test_painel_de_voz_e_ranking_cabem_na_tela(make_game):
    g = make_game(viewport=(320, 568))
    g.p.goto(GAME); g.p.click("#voz")
    assert g.p.evaluate("(()=>{const r=document.querySelector('.vbox').getBoundingClientRect();return r.left>=0&&r.right<=innerWidth})()")
    snap(g, "painel_voz")
    g.p.click("#vclose"); g.p.click("#rank")
    assert_layout(g, "ranking"); snap(g, "ranking_vazio")


def test_hud_mostra_personagem_e_medidores(make_game):
    g = make_game(viewport=(320, 568))
    g.start("Nome Grandão Xx", perk=1)
    assert g.p.is_visible("#status")
    box = g.p.locator("#status").bounding_box()
    assert box["x"] >= 0 and box["x"] + box["width"] <= 320
    assert g.p.inner_text("#stnm").startswith("Nome")
    assert not g.errors, g.errors
