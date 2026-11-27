"""Gera o index.html juntando os arquivos da pasta src/.

Uso: python3 build.py
"""
from pathlib import Path

src = Path(__file__).parent / "src"
css = "".join((src / f).read_text(encoding="utf-8") for f in
              ["base.css", "extra.css", "extra2.css", "extra3.css", "fx.css"])
js = (src / "game.js").read_text(encoding="utf-8")
shell = (src / "shell.html").read_text(encoding="utf-8")
out = shell.replace("/*CSS*/", css).replace("/*JS*/", js)
(Path(__file__).parent / "index.html").write_text(out, encoding="utf-8")
print("index.html gerado:", len(out), "caracteres")
