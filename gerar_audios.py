"""Gera os áudios da narradora Brisa (voz neural em português) para o site no Render.

Rode NO SEU COMPUTADOR (precisa de internet):

    pip install edge-tts
    python3 gerar_audios.py

Opções:
    --voz pt-BR-FranciscaNeural   (padrão; outras: pt-BR-ThalitaMultilingualNeural, pt-BR-AntonioNeural)
    --velocidade -5%              (mais devagar: -10%; mais rápido: +10%)
    --testar                      (gera só 3 falas para você ouvir antes)

Ele lê audio/falas.json, cria um .mp3 para cada fala em audio/ e escreve
audio/manifest.json, que o jogo usa para saber qual arquivo tocar.
Se parar no meio, é só rodar de novo: ele continua de onde parou.
Depois: git add audio && git commit -m "Áudios da Brisa" && git push
"""
import argparse
import asyncio
import json
from pathlib import Path

try:
    import edge_tts
except ImportError:
    raise SystemExit("Instale primeiro:  pip install edge-tts")

PASTA = Path(__file__).resolve().parent / "audio"


async def gerar(voz, velocidade, testar):
    falas = json.loads((PASTA / "falas.json").read_text(encoding="utf-8"))
    if testar:
        falas = falas[:3]
    manifest_path = PASTA / "manifest.json"
    manifest = {}
    if manifest_path.exists() and not testar:
        try:
            manifest = json.loads(manifest_path.read_text(encoding="utf-8")) or {}
        except json.JSONDecodeError:
            manifest = {}
    feitas = 0
    for i, f in enumerate(falas, 1):
        arquivo = f"{f['id']}.mp3"
        destino = PASTA / arquivo
        if not (destino.exists() and destino.stat().st_size > 0):
            for tentativa in range(3):
                try:
                    await edge_tts.Communicate(f["texto"], voz, rate=velocidade).save(str(destino))
                    break
                except Exception as e:  # rede instável: tenta de novo
                    print(f"  tentativa {tentativa + 1} falhou ({e}); tentando de novo…")
                    await asyncio.sleep(2)
            else:
                print(f"  ⚠️ pulei: {f['texto'][:60]}")
                continue
            feitas += 1
        manifest[f["texto"]] = arquivo
        if i % 20 == 0 or i == len(falas):
            manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=0), encoding="utf-8")
            print(f"{i}/{len(falas)} falas prontas")
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=0), encoding="utf-8")
    print(f"✅ {feitas} áudios novos · {len(manifest)} no total · voz {voz}")
    if testar:
        print("Ouça os arquivos f0001.mp3, f0002.mp3 e f0003.mp3 na pasta audio/. Se gostar, rode sem --testar.")


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--voz", default="pt-BR-FranciscaNeural")
    ap.add_argument("--velocidade", default="-5%")
    ap.add_argument("--testar", action="store_true")
    a = ap.parse_args()
    asyncio.run(gerar(a.voz, a.velocidade, a.testar))
