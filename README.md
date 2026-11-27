# 🚨 Fuga da Prisão Nuvem Doce

Jogo educativo no formato **escape room** sobre prevenção ao uso de cigarros eletrônicos (vapes/pods) entre adolescentes de 14 a 18 anos.

Projeto da disciplina **Promoção da Saúde** do Curso de Enfermagem da UniCerrado (Goiatuba-GO). O jogo é a etapa "Jogo educativo digital" do plano de ação, com duração de cerca de 10 minutos.

## Como funciona

- **Criação de personagem:** nome, visual e um talento (Atleta, Hacker ou Líder).
- **5 fases e 15 cadeados:**
  1. **A Cela:** composição do aerossol ("não é vapor").
  2. **O Cofre:** nicotina, dopamina e o cérebro em formação.
  3. **Sala de Raio-X:** efeitos no corpo, sinais de alerta e EVALI.
  4. **O Telão:** redes sociais, iscas de marketing, desinformação e fatores de influência.
  5. **O Portão:** pressão dos amigos, acolher quem quer parar e o Varal da Conscientização.
- **Escolhas com consequência:** os medidores de 🫁 Fôlego e ⛓️ Dependência mudam a história. Escolhas ruins abrem **fases extras**:
  - perseguição no corredor;
  - emergência na enfermaria;
  - pod pirata;
  - solitária.
- **3 finais:** Liberdade total, Livre com cicatriz e A corrente invisível.
- **Narradora Brisa:** lê a tela inteira em voz alta (história, perguntas e opções), com legenda e destaque do trecho lido. Ajuda quem ainda não lê bem.
- **Certificado de Fuga:** pode ser baixado como imagem PNG ou impresso, com o nome do jogador e a mensagem que ele escreveu para o Varal.
- **Ranking** de pontuação.

O tom segue o plano de ação: informação, respeito e acolhimento, sem culpar ninguém. Errar uma pergunta só gera uma explicação.

## Publicar no Render (site estático)

1. Entre em [render.com](https://render.com) e clique em **New → Blueprint**.
2. Escolha este repositório (`XavierSub/Projeto-Nuvem-Doce-`). O Render lê o `render.yaml` e cria o site sozinho.
3. Clique em **Apply**. Em cerca de 1 minuto o jogo fica no ar num endereço `https://fuga-nuvem-doce.onrender.com` (ou parecido).

Outra opção é ir em **New → Static Site**, escolher o repositório, deixar o *Build Command* vazio e usar `./` como *Publish Directory*.

> Site estático no Render não "dorme": abre na hora, sem a espera dos serviços gratuitos.

## Diferenças entre o Render e o claude.ai

| Recurso | Render (site próprio) | Página no claude.ai |
|---|---|---|
| Voz da narração | Áudios gravados com voz neural (pasta `audio/`, em qualquer celular ou computador) | Voz natural da Brisa (Chrome/Edge do computador) |
| Ranking | Só do aparelho | Do aparelho + geral compartilhado |
| Certificado | Baixar PNG e imprimir | Baixar PNG |
| Login | Não precisa | Precisa estar logado no claude.ai |

## Voz da Brisa no Render (áudios gravados)

A voz da Brisa do claude.ai não pode ser exportada, então o site no Render toca **arquivos .mp3** gerados com uma voz neural em português. A lista com todas as falas do jogo (467) já está em `audio/falas.json`.

**Jeito automático (recomendado):** o GitHub gera os áudios sozinho. Quando a lista de falas muda, o robô da aba **Actions** do repositório roda, cria os .mp3 e salva na pasta `audio/`, e o Render publica de novo. Para trocar a voz ou a velocidade, vá em **Actions → Gerar áudios da Brisa → Run workflow**.

**Jeito manual:** rode no seu computador (precisa de internet, leva alguns minutos):

```bash
pip install edge-tts
python3 gerar_audios.py --testar     # gera 3 falas para você ouvir antes
python3 gerar_audios.py              # gera todas
git add audio && git commit -m "Áudios da Brisa" && git push
```

Para outra voz: `python3 gerar_audios.py --voz pt-BR-ThalitaMultilingualNeural`. Para mais devagar: `--velocidade -15%`.
Se mudar textos do jogo, rode `python3 tests/coletar_falas.py` para atualizar a lista e gere de novo (os áudios que já existem são reaproveitados).

Enquanto os áudios não forem gerados, a narração no Render aparece só em legenda.

## Testes automatizados

São 50 testes que jogam sozinhos num Chrome automático: fluxo do jogo (todos os finais, fases extras, talentos, erros, ranking, certificado, segurança), interface (5 tamanhos de tela), narração (o que a Brisa lê, a voz fixa e a parada ao avançar) e áudios gravados (ordem, parada, velocidade e se toda fala tem áudio). Veja o resultado em [`tests/RELATORIO.md`](tests/RELATORIO.md).

```bash
pip install pytest playwright pillow
python3 -m playwright install chromium
python3 -m pytest tests -v --junitxml=/tmp/junit.xml
python3 tests/relatorio.py /tmp/junit.xml
```

## Editar o jogo

O `index.html` é gerado a partir da pasta `src/`:

- `src/game.js`: lógica, fases, perguntas, narração e efeitos.
- `src/*.css`: visual e animações.
- `src/shell.html`: estrutura da página.

Depois de editar, rode:

```bash
python3 build.py
```

e faça o commit do `index.html` gerado.

## Referências usadas no conteúdo

- ANVISA. RDC nº 855, de 23 de abril de 2024 (proíbe fabricação, importação, comercialização e propaganda de dispositivos eletrônicos para fumar).
- INCA. Dispositivos eletrônicos para fumar.
- Oliveira de Melo, A. B. et al. Consequências do uso de cigarros eletrônicos na saúde respiratória de jovens: associação com EVALI. BJIHS, 2026.
- Pio, J. L. O.; Sousa, M. N. A.; Egypto, I. A. S. Uso de cigarro eletrônico entre adolescentes. REBES, 2024.
