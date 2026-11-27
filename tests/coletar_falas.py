"""Joga todos os caminhos do jogo e salva todas as falas da Brisa em audio/falas.json.

Uso: python3 tests/coletar_falas.py
Depois: python3 gerar_audios.py   (no seu computador, com internet)
"""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from conftest import GAME, ROOT, WEB_SPEECH_STUB, Game, claude_mock  # noqa: E402
from playwright.sync_api import sync_playwright  # noqa: E402

EXTRAS_JS = """(()=>{const out=[];const add=t=>{const c=cleanSpeech(t);if(c)out.push(c)};
  const walk=v=>{if(typeof v==='string')add(v);else if(Array.isArray(v))v.forEach(walk);
    else if(typeof v==='function')add(v(''));else if(v&&typeof v==='object')Object.values(v).forEach(walk)};
  walk(N);add('Voltei! Vou ler tudo pra você.');add('Oiê! Eu sou a Brisa. É assim que eu vou ler o jogo pra você.');
  return out})()"""

SCREEN_EXTRAS_JS = """(()=>{const out=[];const add=t=>{const c=cleanSpeech(t);if(c)out.push(c)};
  document.querySelectorAll('#body .sc').forEach(e=>{add(e.innerText+', marcado');add(e.innerText+', desmarcado')});
  document.querySelectorAll('#body .organs button').forEach(e=>add(e.innerText));
  document.querySelectorAll('#body .chip').forEach(e=>add(e.textContent));
  document.querySelectorAll('#body .seg').forEach(e=>add(e.textContent.trim()+' é só parte do app, não é isca. Continue procurando!'));
  return out})()"""


class Coletor(Game):
    def __init__(self, page):
        super().__init__(page)
        self.extra = []

    def grab(self):
        self.extra += self.p.evaluate(SCREEN_EXTRAS_JS)

    def mcq_all(self, right=1, n=4):
        for i in range(n):
            if i != right and not self.p.query_selector(f'.opt[data-i="{i}"].wrong'):
                self.p.click(f'.opt[data-i="{i}"]'); self.p.wait_for_selector(".fb.bad"); self.p.wait_for_timeout(120)
        self.p.click(f'.opt[data-i="{right}"]'); self.nx()

    def jogar(self, escolhas, mito, chase, fissura, scanner_erra=True):
        p = self.p
        # ---------- Fase 1 ----------
        self.mcq_all()
        p.click(f'.ch[data-i="{escolhas[0]}"]'); self.nx()
        for i, ans in enumerate(mito):
            p.click(f'#mvbtns button[data-v="{ans}"]')
            p.wait_for_selector("#nc" if i < 2 else "#nx")
            if i < 2: p.click("#nc")
        self.nx()
        self.grab()
        if scanner_erra:
            p.click('.sc[data-k="1"]'); p.click("#go"); p.wait_for_selector(".fb.bad")
            p.click('.sc[data-k="1"]'); p.click('.sc[data-k="0"]'); p.click("#go"); p.wait_for_selector(".fb.bad")
            p.click('.sc[data-k="0"]')
        for k in [0, 2, 4, 6, 7]: p.click(f'.sc[data-k="{k}"]')
        p.click("#go"); self.nx()
        if self.go_next(): self.chase(chase); self.wait_tr()
        # ---------- Fase 2 ----------
        p.click("#dr"); p.click("#go"); p.wait_for_selector(".fb.bad")
        for _ in range(4): p.click("#dr")
        p.click("#go"); p.wait_for_selector(".fb.bad"); p.click("#dl"); p.click("#go"); self.nx()
        p.click(f'.ch[data-i="{escolhas[1]}"]'); self.nx()
        if escolhas[1] != 0:
            for i in [3, 2, 1, 0]: p.click(f'.pool .opt[data-id="{i}"]')
            p.wait_for_selector(".fb.bad"); p.click("#reset")
            for i in [0, 1, 2, 3]: p.click(f'.pool .opt[data-id="{i}"]')
        self.nx()
        self.mcq_all()
        if self.go_next():
            self.grab()
            p.click('.sc[data-k="4"]'); p.click("#go"); p.wait_for_selector(".fb.bad"); p.click('.sc[data-k="4"]')
            for k in [0, 1, 2]: p.click(f'.sc[data-k="{k}"]')
            p.click("#go"); p.wait_for_selector(".fb.bad")
            p.click('.sc[data-k="3"]'); p.click("#go"); self.nx(); self.wait_tr()
        # ---------- Fase 3 ----------
        self.grab()
        for wrong in range(1, 4):
            p.click('.organs button[data-i="0"]'); p.click(f'.effects button[data-i="{wrong}"]'); p.wait_for_selector(".fb.bad")
        for i in range(1, 4):
            p.click(f'.organs button[data-i="{i}"]'); p.click('.effects button[data-i="0"]'); p.wait_for_selector(".fb.bad")
        for i in range(4):
            p.click(f'.organs button[data-i="{i}"]'); p.click(f'.effects button[data-i="{i}"]')
        self.nx()
        p.click(f'.ch[data-i="{escolhas[2]}"]'); self.nx()
        self.grab()
        p.click('.sc[data-k="1"]'); p.click("#go"); p.wait_for_selector(".fb.bad"); p.click('.sc[data-k="1"]')
        for k in [0, 2, 4, 5]: p.click(f'.sc[data-k="{k}"]')
        p.click("#go"); self.nx()
        self.mcq_all()
        self.go_next()
        # ---------- Fase 4 ----------
        self.grab()
        p.click('.seg[data-k="x"]'); p.click('.seg[data-k="y"]')
        for k in "abcde": p.click(f'.seg[data-k="{k}"]')
        self.extra += p.eval_on_selector_all("#log .bait", "els=>els.map(e=>cleanSpeech(e.innerText))")
        self.nx()
        p.click(f'.ch[data-i="{escolhas[3]}"]'); self.nx()
        self.grab()
        p.click('.sc[data-k="4"]'); p.click("#go"); p.wait_for_selector(".fb.bad"); p.click('.sc[data-k="4"]')
        for k in [0, 1, 2, 3, 5, 7]: p.click(f'.sc[data-k="{k}"]')
        p.click("#go"); self.nx()
        self.mcq_all()
        if self.go_next():
            self.grab()
            p.click('.sc[data-k="4"]'); p.click("#go"); p.wait_for_selector(".fb.bad"); p.click('.sc[data-k="4"]')
            for k in [0, 1, 2, 3]: p.click(f'.sc[data-k="{k}"]')
            p.click("#go"); self.nx(); self.wait_tr()
        # ---------- Fase 5 ----------
        if p.query_selector("#give"):
            if fissura == "cede":
                p.click("#give"); self.nx()
            else:
                x, y = self.press_point("#hold"); p.mouse.move(x, y); p.mouse.down(); p.wait_for_timeout(500); p.mouse.up()
                self.breathe()
        p.click("#run"); p.wait_for_selector("#nx", timeout=8000)
        if "solitária" in p.inner_text("#nx").lower():
            self.nx(); self.solitary()
        else:
            self.nx()
        p.wait_for_selector("#q .opt", timeout=15000)
        for i in [0, 2, 3]:
            p.click(f'#q .opt[data-i="{i}"]'); p.wait_for_selector(".fb.bad")
        p.click('#q .opt[data-i="1"]')
        p.wait_for_selector('#q .opt[data-i="2"]', timeout=15000)
        for i in [0, 1, 3]:
            p.click(f'#q .opt[data-i="{i}"]'); p.wait_for_selector(".fb.bad")
        p.click('#q .opt[data-i="2"]'); self.nx()
        self.mcq_all()
        self.grab()
        p.fill("#vt", "Meu não é minha escolha"); p.click("#go"); self.nx()
        self.to_final()
        p.wait_for_timeout(500)
        p.click(".relisten"); p.wait_for_timeout(500)


CAMINHOS = [
    # escolhas: rato, diretor, enfermeiro, contrabando | mito | perseguição | fissura
    ((0, 0, 0, 0), ["1", "0", "1"], ("1", "0", "1"), "cede"),      # tudo ruim → corrente
    ((1, 1, 1, 1), ["0", "1", "0"], ("0", "0", "1"), "respira"),   # tudo bom → livre
    ((0, 2, 1, 2), ["0", "1", "1"], ("0", "0", "1"), "respira"),   # trago + verdade → cicatriz
    ((2, 0, 2, 0), ["0", "0", "1"], ("0", "0", "1"), "cede"),      # aliado salva na corrida
    ((0, 0, 0, 1), ["0", "1", "0"], ("1", "1", "1"), "respira"),   # respiração na fissura
]


def main():
    falas, vistos = [], set()

    def junta(lista):
        for t in lista:
            if t and t not in vistos:
                vistos.add(t); falas.append(t)

    with sync_playwright() as pw:
        chrome = "/usr/bin/google-chrome"
        b = pw.chromium.launch(executable_path=chrome) if Path(chrome).exists() else pw.chromium.launch()
        for n, (esc, mito, chase, fis) in enumerate(CAMINHOS, 1):
            ctx = b.new_context(viewport={"width": 400, "height": 860})
            page = ctx.new_page()
            page.add_init_script(script=WEB_SPEECH_STUB)
            page.add_init_script(script=claude_mock())
            g = Coletor(page)
            g.start("Kai", perk=n % 3)
            g.p.click("#narrbtn"); g.p.click("#narrbtn")
            g.jogar(esc, mito, chase, fis)
            calls = g.p.evaluate("window.__tts")
            junta([l["text"] for c in calls if c["kind"] in ("speak", "add") for l in c["lines"]])
            junta(g.extra)
            junta(g.p.evaluate(EXTRAS_JS))
            junta([g.p.evaluate(f"cleanSpeech('{v}')") for v in ["12", "15", "18", "21", "25", "30"]])
            assert not g.errors, g.errors
            print(f"caminho {n}: {len(falas)} falas até agora")
            ctx.close()
        b.close()

    out = ROOT / "audio"
    out.mkdir(exist_ok=True)
    data = [{"id": f"f{i:04d}", "texto": t} for i, t in enumerate(falas, 1)]
    (out / "falas.json").write_text(json.dumps(data, ensure_ascii=False, indent=1), encoding="utf-8")
    chars = sum(len(t) for t in falas)
    print(f"{len(falas)} falas ({chars} caracteres) salvas em audio/falas.json")


if __name__ == "__main__":
    main()
