# Relatório de testes · Fuga da Prisão Nuvem Doce

Gerado em 27/11/2026 13:37 · **50 de 50 testes passaram**

Os testes abrem o jogo num navegador Chrome automático e jogam sozinhos, clicando como uma pessoa. A voz é simulada para conferir exatamente o que a Brisa falaria e quando.

## 🔊 Áudios gravados (site no Render)

| Resultado | Teste | Tempo |
|---|---|---|
| ✅ | Áudios gravados tocam em ordem (pergunta e opções A a D), sem voz robótica | 7 s |
| ✅ | Ao avançar, o áudio anterior para na hora | 5 s |
| ✅ | Fala sem áudio: mostra a legenda e segue para a próxima | 7 s |
| ✅ | Velocidade Devagar vale também para os áudios | 2 s |
| ✅ | Partida completa (erros e fases extras) tocando os áudios | 72 s |
| ✅ | Toda fala da Brisa numa partida nova tem áudio na lista (audio/falas.json) | 122 s |

## 📱 Interface

| Resultado | Teste | Tempo |
|---|---|---|
| ✅ | Telas principais sem rolagem lateral, sem cortes e com botões grandes o bastante [320-568-celular_pequeno] | 4 s |
| ✅ | Telas principais sem rolagem lateral, sem cortes e com botões grandes o bastante [360-740-android] | 4 s |
| ✅ | Telas principais sem rolagem lateral, sem cortes e com botões grandes o bastante [390-844-iphone] | 4 s |
| ✅ | Telas principais sem rolagem lateral, sem cortes e com botões grandes o bastante [768-1024-tablet] | 4 s |
| ✅ | Telas principais sem rolagem lateral, sem cortes e com botões grandes o bastante [1366-768-notebook] | 4 s |
| ✅ | Partida completa num celular pequeno (320 px), conferindo que nada cobre os botões | 56 s |
| ✅ | Partida com todas as fases extras num celular pequeno | 80 s |
| ✅ | Balão da Brisa não cobre o botão Continuar | 5 s |
| ✅ | Funciona com animações reduzidas (acessibilidade) | 8 s |
| ✅ | Painel de voz e ranking cabem na tela | 2 s |
| ✅ | Painel do personagem e medidores aparecem certos | 4 s |

## 🎙️ Narração da Brisa

| Resultado | Teste | Tempo |
|---|---|---|
| ✅ | A Brisa lê a partida inteira sempre com a mesma voz | 45 s |
| ✅ | Falas sem emoji, sem código e sem palavras em maiúsculas (que seriam soletradas) | 63 s |
| ✅ | Lê a pergunta e as opções A, B, C e D em ordem | 5 s |
| ✅ | Lê a história, o que os personagens falam e a consequência das escolhas | 6 s |
| ✅ | Ao avançar, a fala anterior para na hora antes da próxima | 6 s |
| ✅ | Falhas da voz: não troca de voz e não repete fala antiga | 46 s |
| ✅ | Cliques rápidos com falhas de voz não quebram o jogo | 6 s |
| ✅ | O destaque azul acompanha o trecho lido | 5 s |
| ✅ | Botão 🎙️ liga e desliga a narração | 6 s |
| ✅ | Botões 'Ouvir de novo' e '🔊 Ouvir' | 5 s |
| ✅ | Velocidade 'Devagar' é aplicada e fica salva | 3 s |
| ✅ | Conversa da rodinha lida em ordem (Lucas, Bia, Lucas) | 38 s |
| ✅ | Sem a voz da Brisa (site próprio/celular): só legenda, nunca voz robótica | 4 s |
| ✅ | No claude.ai sem voz disponível: só legenda | 5 s |
| ✅ | Se a voz da Brisa demorar a carregar, ela fala assim que chegar (não fica muda) | 12 s |

## 🎮 Projeto (fluxo do jogo)

| Resultado | Teste | Tempo |
|---|---|---|
| ✅ | Partida só com escolhas boas → final Liberdade total, placar e barra de progresso certos | 45 s |
| ✅ | Partida só com escolhas ruins → 3 fases extras, solitária e final A corrente invisível | 68 s |
| ✅ | Escolha ruim + contar a verdade ao enfermeiro → dependência cai e final Livre com cicatriz | 48 s |
| ✅ | Erros em todos os tipos de desafio (múltipla escolha, cartas, scanner, cofre, ordem, mapa do corpo, iscas, conversa) | 47 s |
| ✅ | Talento Hacker: a pista nunca elimina a resposta certa | 4 s |
| ✅ | Talentos Atleta (120 de fôlego) e Líder (+50 nas escolhas boas) | 9 s |
| ✅ | Rato aliado salva o jogador na corrida sem fôlego | 37 s |
| ✅ | Minijogo de respiração na crise de fissura (inclusive soltar cedo demais) | 59 s |
| ✅ | Jogar de novo zera pontos, medidores, cronômetro e progresso | 52 s |
| ✅ | Nome com código malicioso aparece como texto (segurança) | 44 s |
| ✅ | Nome vazio vira 'Detento 17' e nome longo é cortado | 4 s |
| ✅ | Jogo funciona mesmo com o armazenamento do navegador bloqueado | 43 s |
| ✅ | Ranking do aparelho guarda e ordena as partidas | 91 s |
| ✅ | Ranking geral (claude.ai): envia a pontuação e ignora dados inválidos | 47 s |
| ✅ | Certificado baixa como PNG 1600×1130 com nome de arquivo sem acento | 45 s |
| ✅ | Certificado no claude.ai usa o salvamento da plataforma | 48 s |
| ✅ | Tocar na transição pula a animação | 4 s |
| ✅ | Teste 'macaco': 600 toques aleatórios e rápidos sem nenhum erro | 40 s |

## Como rodar de novo

```bash
pip install pytest playwright pillow
python3 -m playwright install chromium
python3 -m pytest tests -v --junitxml=/tmp/junit.xml
python3 tests/relatorio.py /tmp/junit.xml
```

As capturas de tela ficam em `tests/capturas/`.