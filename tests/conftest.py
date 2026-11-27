"""Infraestrutura dos testes automatizados do jogo Fuga da Prisão Nuvem Doce.

Os testes abrem o index.html num Chrome sem janela (Playwright) e jogam
sozinhos. A voz é substituída por um "gravador" para sabermos exatamente
o que a narração falaria.
"""
import json
import re
from pathlib import Path

import pytest
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
GAME = (ROOT / "index.html").as_uri()
SHOTS = ROOT / "tests" / "capturas"
SHOTS.mkdir(parents=True, exist_ok=True)

# Gravador da voz do navegador (speechSynthesis)
WEB_SPEECH_STUB = """
window.__spoken=[];window.__cancel=0;window.__speechDelay=window.__speechDelay||5;
window.__voices=window.__voices||[{name:'Google português do Brasil',lang:'pt-BR'},{name:'Voz Comum',lang:'pt-BR'}];
(function(){const q=[];let busy=false;const ls={};
function run(){if(busy||!q.length)return;busy=true;const u=q.shift();
  const hl=document.querySelector('.reading');
  window.__spoken.push({text:u.text,voice:u.voice?u.voice.name:null,rate:u.rate,lang:u.lang,hl:hl?hl.innerText.slice(0,80):null});
  u.onstart&&u.onstart();
  setTimeout(()=>{const h2=document.querySelector('.reading');window.__spoken[window.__spoken.length-1].hl2=h2?h2.innerText.slice(0,80):null;busy=false;u.onend&&u.onend();run()},window.__speechDelay)}
const ss={speak(u){q.push(u);run()},cancel(){window.__cancel++;q.length=0},getVoices(){return window.__voices},
  get pending(){return q.length>0},addEventListener(n,f){(ls[n]=ls[n]||[]).push(f)},
  __fire(n){(ls[n]||[]).forEach(f=>f())}};
Object.defineProperty(window,'speechSynthesis',{value:ss,configurable:true});
window.SpeechSynthesisUtterance=function(t){this.text=t};})();
"""

# Simulação do ambiente claude.ai: voz natural (tts), banco (db) e downloads
def claude_mock(tts=True, db=True, downloads=True, fail_every=0, db_rows=None):
    return """
window.__tts=[];window.__dbAdds=[];window.__saves=[];
(function(){
let st=null,ln=null,n=0;const FAIL=%d;
const tts={speak(lines,o){n++;window.__tts.push({kind:'speak',opts:o,lines});
    if(FAIL&&n%%FAIL===0){window.__tts.push({kind:'RL',lines});return Promise.reject({code:'rate_limited',retryAfterMs:50})}
    st&&st({state:'speaking'});
    lines.forEach((l,i)=>setTimeout(()=>{ln&&ln({line:i,id:l.id});setTimeout(()=>{const h=document.querySelector('.reading');(window.__hl=window.__hl||[]).push([l.text.slice(0,60),h?h.innerText.slice(0,60):null])},5)},i*25));
    return new Promise(r=>setTimeout(()=>{st&&st({state:'idle',reason:'completed'});r({playedMs:1})},20))},
  add(lines,o){window.__tts.push({kind:'add',opts:o,lines});return Promise.resolve({playedMs:1})},
  stop(){window.__tts.push({kind:'stop'});return Promise.resolve()},active(){return true},setRate(r){window.__tts.push({kind:'rate',r});return Promise.resolve()},
  onState(h){st=h;return()=>{}},onLine(h){ln=h;return()=>{}}};
const rows=%s;
const db={collection(p){const q={orderBy(){return q},limit(){return q},
    get(){return Promise.resolve({docs:rows.map((r,i)=>({id:'g'+i,data:()=>r}))})},
    add(d){window.__dbAdds.push({path:p,doc:d});return Promise.resolve({id:'novo1'})}};return q}};
const dl={save(r){window.__saves.push({filename:r.filename,size:r.data&&r.data.size,type:r.data&&r.data.type});return Promise.resolve({status:'saved'})}};
const map={tts:%s,db:%s,downloads:%s};
window.claude={use:name=>Promise.resolve(map[name]||null)};
})();
""" % (fail_every, json.dumps(db_rows or []),
       "tts" if tts else "null", "db" if db else "null", "dl" if downloads else "null")


BAD_TEXT = re.compile(r"\bundefined\b|\bNaN\b|\[object |\$\{")


class Game:
    """Joga o jogo clicando como uma pessoa."""

    def __init__(self, page, cover_check=False):
        self.p = page
        self.cover_check = cover_check
        self.errors = []
        page.on("pageerror", lambda e: self.errors.append(str(e)))
        page.on("console", lambda m: m.type == "error" and self.errors.append("console: " + m.text))
        page.set_default_timeout(25000)

    # ---------- utilidades ----------
    def check(self):
        t = self.p.inner_text("#screen")
        m = BAD_TEXT.search(t)
        assert not m, f"Texto estranho na tela: {m.group(0)!r} em …{t[max(0, m.start()-60):m.end()+60]}…"

    def wait_tr(self):
        self.p.wait_for_selector(".tr", state="attached", timeout=5000)
        self.p.click(".tr")
        self.p.wait_for_selector(".tr", state="detached")
        self.p.wait_for_timeout(150)

    def nx(self):
        self.check()
        if self.cover_check:
            self.p.wait_for_selector("#nx")
            self.press_point("#nx")
        self.p.click("#nx")
        self.p.wait_for_timeout(200)

    def np(self, transition=True):
        self.check()
        self.p.click("#np")
        if transition:
            self.wait_tr()

    def hud(self):
        return {"score": int(self.p.inner_text("#score").replace("⭐", "").strip()),
                "F": int(self.p.inner_text("#mfv")), "D": int(self.p.inner_text("#mdv"))}

    def has_extra_pending(self):
        return "fase extra" in self.p.inner_text("#body").lower()

    # ---------- início ----------
    def start(self, name="Kai", perk=0, look=(1, 0, 0, 0, 0)):
        self.p.goto(GAME)
        self.p.wait_for_selector("#new")
        self.check()
        self.p.click("#new")
        self.p.fill("#nm", name)
        for key, v in zip(["s", "h", "hc", "u", "a"], look):
            self.p.click(f'#r-{key} button[data-v="{v}"]')
        self.p.click(f'#r-p button[data-v="{perk}"]')
        self.p.click("#ok")
        self.p.wait_for_selector("#go")
        self.check()
        self.p.click("#go")
        self.wait_tr()

    # ---------- fases ----------
    def phase1(self, rato="aliado", wrong=False):
        if wrong:
            self.p.click('.opt[data-i="0"]'); self.p.wait_for_selector(".fb.bad")
        self.p.click('.opt[data-i="1"]'); self.nx()
        self.p.click(f'.ch[data-i="{ {"trago": 0, "recusa": 1, "aliado": 2}[rato] }"]'); self.nx()
        for i, v in enumerate(["0", "1", "0"]):
            ans = v if not (wrong and i == 0) else ("1" if v == "0" else "0")
            self.p.click(f'#mvbtns button[data-v="{ans}"]')
            self.p.wait_for_selector("#nc" if i < 2 else "#nx")
            if i < 2:
                self.p.click("#nc")
        self.nx()
        if wrong:
            self.p.click('.sc[data-k="1"]'); self.p.click("#go"); self.p.wait_for_selector(".fb.bad")
            self.p.click('.sc[data-k="1"]')
        for k in [0, 2, 4, 6, 7]:
            self.p.click(f'.sc[data-k="{k}"]')
        self.p.click("#go"); self.nx()

    def chase(self, answers=("0", "0", "1")):
        """Responde às bifurcações. Retorna True se foi pego."""
        for i, a in enumerate(answers):
            self.p.click(f'.door[data-v="{a}"]')
            txt = self.p.inner_text("#nx")
            self.nx()
            if "pego" in txt:
                self.solitary()
                return True
        self.nx()
        return False

    def solitary(self):
        self.p.wait_for_selector("#cd")
        self.p.wait_for_selector("#nx", timeout=15000)
        self.nx()

    def phase2(self, diretor="desmascara", wrong=False):
        if wrong:
            self.p.click("#dr"); self.p.click("#go"); self.p.wait_for_selector(".fb.bad")
            for _ in range(4): self.p.click("#dr")
            self.p.click("#go"); self.p.wait_for_selector(".fb.bad")
            self.p.click("#dl")
        else:
            for _ in range(4): self.p.click("#dr")
        self.p.click("#go"); self.nx()
        self.p.click(f'.ch[data-i="{ {"atalho": 0, "recusa": 1, "desmascara": 2}[diretor] }"]'); self.nx()
        if diretor != "atalho":
            if wrong:
                for i in [3, 2, 1, 0]: self.p.click(f'.pool .opt[data-id="{i}"]')
                self.p.wait_for_selector(".fb.bad"); self.p.click("#reset")
            for i in [0, 1, 2, 3]: self.p.click(f'.pool .opt[data-id="{i}"]')
        self.nx()
        self.p.click('.opt[data-i="1"]'); self.nx()

    def emergency(self):
        for k in [0, 1, 2, 3]: self.p.click(f'.sc[data-k="{k}"]')
        self.p.click("#go"); self.nx()

    def phase3(self, enfermeiro="verdade", wrong=False):
        if wrong:
            self.p.click('.organs button[data-i="0"]'); self.p.click('.effects button[data-i="1"]')
            self.p.wait_for_selector(".fb.bad")
        for i in range(4):
            self.p.click(f'.organs button[data-i="{i}"]'); self.p.click(f'.effects button[data-i="{i}"]')
        self.nx()
        self.p.click(f'.ch[data-i="{ {"mentir": 0, "verdade": 1, "recusa": 2}[enfermeiro] }"]'); self.nx()
        for k in [0, 2, 4, 5]: self.p.click(f'.sc[data-k="{k}"]')
        self.p.click("#go"); self.nx()
        if wrong:
            self.p.click('.opt[data-i="3"]'); self.p.wait_for_selector(".fb.bad")
        self.p.click('.opt[data-i="1"]'); self.nx()

    def phase4(self, contrabando="questiona", wrong=False):
        if wrong:
            self.p.click('.seg[data-k="x"]')
        for k in "abcde": self.p.click(f'.seg[data-k="{k}"]')
        self.nx()
        self.p.click(f'.ch[data-i="{ {"compra": 0, "questiona": 1, "recusa": 2}[contrabando] }"]'); self.nx()
        for k in [0, 1, 2, 3, 5, 7]: self.p.click(f'.sc[data-k="{k}"]')
        self.p.click("#go"); self.nx()
        self.p.click('.opt[data-i="1"]'); self.nx()

    def pirate(self):
        for k in [0, 1, 2, 3]: self.p.click(f'.sc[data-k="{k}"]')
        self.p.click("#go"); self.nx()

    def press_point(self, sel):
        """Rola até o botão e confere que nada (ex.: balão da Brisa) está por cima dele."""
        loc = self.p.locator(sel)
        loc.scroll_into_view_if_needed()
        self.p.wait_for_timeout(400)
        box = loc.bounding_box()
        x, y = box["x"] + box["width"] / 2, box["y"] + box["height"] / 2
        top = self.p.evaluate(f"(()=>{{const e=document.elementFromPoint({x},{y});return e&&(e.closest('{sel}')?'ok':e.className||e.tagName)}})()")
        assert top == "ok", f"{sel} está coberto por: {top}"
        return x, y

    def breathe(self):
        for _ in range(3):
            x, y = self.press_point("#hold")
            self.p.mouse.move(x, y)
            self.p.mouse.down(); self.p.wait_for_timeout(3200); self.p.mouse.up()
            self.p.wait_for_timeout(3300)
        self.nx()

    def phase5(self, craving="respira", wrong=False):
        if self.p.query_selector("#give"):
            if craving == "cede":
                self.p.click("#give"); self.nx()
            else:
                self.breathe()
        self.p.click("#run")
        self.p.wait_for_selector("#nx", timeout=8000)
        if "solitária" in self.p.inner_text("#nx").lower():
            self.nx(); self.solitary()
        else:
            self.nx()
        self.p.wait_for_selector("#q .opt", timeout=15000)
        if wrong:
            self.p.click('#q .opt[data-i="0"]'); self.p.wait_for_selector(".fb.bad")
        self.p.click('#q .opt[data-i="1"]')
        self.p.wait_for_selector('#q .opt[data-i="2"]', timeout=15000)
        self.p.click('#q .opt[data-i="2"]')
        self.nx()
        self.p.click('.opt[data-i="1"]'); self.nx()
        self.p.fill("#vt", "Meu não é minha escolha")
        self.p.click("#go"); self.nx()

    def to_final(self):
        self.p.click("#np")
        self.p.wait_for_selector(".cert")
        self.check()

    def go_next(self):
        """Depois da fase: segue (com ou sem fase extra)."""
        extra = self.has_extra_pending()
        self.np()
        return extra

    # ---------- partidas prontas ----------
    def play(self, rato="aliado", diretor="desmascara", enfermeiro="verdade", contrabando="questiona",
             craving="respira", chase=("0", "0", "1"), wrong=False):
        self.phase1(rato, wrong)
        if self.go_next(): self.chase(chase); self.wait_tr()
        self.phase2(diretor, wrong)
        if self.go_next(): self.emergency(); self.wait_tr()
        self.phase3(enfermeiro, wrong)
        self.go_next()
        self.phase4(contrabando, wrong)
        if self.go_next(): self.pirate(); self.wait_tr()
        self.phase5(craving, wrong)
        self.to_final()


@pytest.fixture(scope="session")
def browser():
    with sync_playwright() as p:
        chrome = "/usr/bin/google-chrome"
        b = p.chromium.launch(executable_path=chrome) if Path(chrome).exists() else p.chromium.launch()
        yield b
        b.close()


@pytest.fixture
def make_game(browser):
    ctxs = []

    def _make(viewport=(400, 860), claude=None, extra_js="", reduced=False, cover_check=False):
        ctx = browser.new_context(viewport={"width": viewport[0], "height": viewport[1]},
                                  accept_downloads=True, reduced_motion="reduce" if reduced else "no-preference")
        ctxs.append(ctx)
        page = ctx.new_page()
        page.add_init_script(script=extra_js + WEB_SPEECH_STUB)
        if claude is not None:
            page.add_init_script(script=claude)
        g = Game(page, cover_check)
        return g

    yield _make
    for c in ctxs:
        c.close()
