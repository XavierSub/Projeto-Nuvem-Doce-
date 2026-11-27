# Relatório de testes · Fuga da Prisão Nuvem Doce

Gerado em 27/11/2026 14:52 · **64 de 64 testes passaram**

Os testes abrem o jogo num navegador Chrome automático e jogam sozinhos, clicando como uma pessoa. A voz é simulada para conferir exatamente o que a Brisa falaria e quando.

## 🔊 Áudios gravados (site no Render)

| Resultado | Teste | Tempo |
|---|---|---|
| ✅ | Áudios gravados tocam em ordem (pergunta e opções A a D), sem voz robótica | 7 s |
| ✅ | Ao avançar, o áudio anterior para na hora | 5 s |
| ✅ | Fala sem áudio: mostra a legenda e segue para a próxima | 7 s |
| ✅ | Velocidade Devagar vale também para os áudios | 2 s |
| ✅ | Partida completa (erros e fases extras) tocando os áudios | 72 s |
| ✅ | Toda fala da Brisa numa partida nova tem áudio na lista (audio/falas.json) | 123 s |

## 📱 Interface

| Resultado | Teste | Tempo |
|---|---|---|
| ✅ | Telas principais sem rolagem lateral, sem cortes e com botões grandes o bastante [320-568-celular_pequeno] | 4 s |
| ✅ | Telas principais sem rolagem lateral, sem cortes e com botões grandes o bastante [360-740-android] | 4 s |
| ✅ | Telas principais sem rolagem lateral, sem cortes e com botões grandes o bastante [390-844-iphone] | 4 s |
| ✅ | Telas principais sem rolagem lateral, sem cortes e com botões grandes o bastante [768-1024-tablet] | 4 s |
| ✅ | Telas principais sem rolagem lateral, sem cortes e com botões grandes o bastante [1366-768-notebook] | 4 s |
| ✅ | Partida completa num celular pequeno (320 px), conferindo que nada cobre os botões | 58 s |
| ✅ | Partida com todas as fases extras num celular pequeno | 82 s |
| ✅ | Balão da Brisa não cobre o botão Continuar | 5 s |
| ✅ | Funciona com animações reduzidas (acessibilidade) | 8 s |
| ✅ | Painel de voz e ranking cabem na tela | 1 s |
| ✅ | Painel do personagem e medidores aparecem certos | 4 s |

## 🎙️ Narração da Brisa

| Resultado | Teste | Tempo |
|---|---|---|
| ✅ | A Brisa lê a partida inteira sempre com a mesma voz | 47 s |
| ✅ | Falas sem emoji, sem código e sem palavras em maiúsculas (que seriam soletradas) | 63 s |
| ✅ | Lê a pergunta e as opções A, B, C e D em ordem | 4 s |
| ✅ | Lê a história, o que os personagens falam e a consequência das escolhas | 6 s |
| ✅ | Ao avançar, a fala anterior para na hora antes da próxima | 6 s |
| ✅ | Falhas da voz: não troca de voz e não repete fala antiga | 47 s |
| ✅ | Cliques rápidos com falhas de voz não quebram o jogo | 6 s |
| ✅ | O destaque azul acompanha o trecho lido | 5 s |
| ✅ | Botão 🎙️ liga e desliga a narração | 6 s |
| ✅ | Botões 'Ouvir de novo' e '🔊 Ouvir' | 5 s |
| ✅ | Velocidade 'Devagar' é aplicada e fica salva | 3 s |
| ✅ | Conversa da rodinha lida em ordem (Lucas, Bia, Lucas) | 39 s |
| ✅ | Sem a voz da Brisa (site próprio/celular): só legenda, nunca voz robótica | 4 s |
| ✅ | No claude.ai sem voz disponível: só legenda | 5 s |
| ✅ | Se a voz da Brisa demorar a carregar, ela fala assim que chegar (não fica muda) | 12 s |
| ✅ | Celular no claude.ai (sem a voz da Brisa) toca os áudios gravados | 6 s |

## 🎮 Projeto (fluxo do jogo)

| Resultado | Teste | Tempo |
|---|---|---|
| ✅ | Partida só com escolhas boas → final Liberdade total, placar e barra de progresso certos | 46 s |
| ✅ | Partida só com escolhas ruins → 3 fases extras, solitária e final A corrente invisível | 70 s |
| ✅ | Escolha ruim + contar a verdade ao enfermeiro → dependência cai e final Livre com cicatriz | 52 s |
| ✅ | Erros em todos os tipos de desafio (múltipla escolha, cartas, scanner, cofre, ordem, mapa do corpo, iscas, conversa) | 49 s |
| ✅ | Talento Hacker: a pista nunca elimina a resposta certa | 4 s |
| ✅ | Talentos Atleta (120 de fôlego) e Líder (+50 nas escolhas boas) | 10 s |
| ✅ | Rato aliado salva o jogador na corrida sem fôlego | 37 s |
| ✅ | Minijogo de respiração na crise de fissura (inclusive soltar cedo demais) | 60 s |
| ✅ | Jogar de novo zera pontos, medidores, cronômetro e progresso | 53 s |
| ✅ | Nome com código malicioso aparece como texto (segurança) | 47 s |
| ✅ | Nome vazio vira 'Detento 17' e nome longo é cortado | 3 s |
| ✅ | Jogo funciona mesmo com o armazenamento do navegador bloqueado | 48 s |
| ✅ | Ranking do aparelho guarda e ordena as partidas | 96 s |
| ✅ | Ranking geral (claude.ai): envia a pontuação e ignora dados inválidos | 47 s |
| ✅ | Certificado baixa como PNG 1600×1130 com nome de arquivo sem acento | 46 s |
| ✅ | Certificado no claude.ai usa o salvamento da plataforma | 46 s |
| ✅ | Tocar na transição pula a animação | 4 s |
| ✅ | Teste 'macaco': 600 toques aleatórios e rápidos sem nenhum erro | 39 s |

## 🗄️ Servidor e banco de dados

| Resultado | Teste | Tempo |
|---|---|---|
| ✅ | Servidor entrega o jogo, os áudios e o painel | 0 s |
| ✅ | Arquivos do servidor, banco e código não ficam acessíveis | 0 s |
| ✅ | Registra os dispositivos e conta os acessos; rejeita dados inválidos | 0 s |
| ✅ | Salva pontuações e devolve o ranking em ordem | 0 s |
| ✅ | Rejeita pontuação inválida e limpa textos e números exagerados | 0 s |
| ✅ | Recusa envios grandes demais | 0 s |
| ✅ | Salva mensagens do Varal (até 120 caracteres) | 0 s |
| ✅ | Limite de envios por aparelho (contra spam) | 0 s |
| ✅ | Painel e dados exigem a senha | 1 s |
| ✅ | Painel oculta mensagens e apaga pontuações | 0 s |
| ✅ | CSV abre no Excel com acentos e neutraliza fórmulas perigosas | 0 s |
| ✅ | Partida completa pelo servidor: aparelho, pontuação, Varal e ranking geral | 48 s |
| ✅ | Painel no navegador: senha, mensagens com código mostradas como texto, CSV | 1 s |

## Como rodar de novo

```bash
pip install pytest playwright pillow
python3 -m playwright install chromium
python3 -m pytest tests -v --junitxml=/tmp/junit.xml
python3 tests/relatorio.py /tmp/junit.xml
```

As capturas de tela ficam em `tests/capturas/`.