"""Gera tests/RELATORIO.md a partir do resultado do pytest (junit xml).

Uso: python3 -m pytest tests --junitxml=/tmp/junit.xml && python3 tests/relatorio.py /tmp/junit.xml
"""
import sys
import xml.etree.ElementTree as ET
from datetime import datetime
from pathlib import Path

NOMES = {
    "test_projeto": "🎮 Projeto (fluxo do jogo)",
    "test_interface": "📱 Interface",
    "test_narracao": "🎙️ Narração da Brisa",
}
DESC = {
    "test_caminho_bom_final_liberdade": "Partida só com escolhas boas → final Liberdade total, placar e barra de progresso certos",
    "test_caminho_ruim_fases_extras_final_corrente": "Partida só com escolhas ruins → 3 fases extras, solitária e final A corrente invisível",
    "test_caminho_misto_final_cicatriz_e_enfermeiro_ajuda": "Escolha ruim + contar a verdade ao enfermeiro → dependência cai e final Livre com cicatriz",
    "test_erros_em_todos_os_tipos_de_desafio": "Erros em todos os tipos de desafio (múltipla escolha, cartas, scanner, cofre, ordem, mapa do corpo, iscas, conversa)",
    "test_talento_hacker_elimina_so_opcao_errada": "Talento Hacker: a pista nunca elimina a resposta certa",
    "test_talento_atleta_e_lider": "Talentos Atleta (120 de fôlego) e Líder (+50 nas escolhas boas)",
    "test_aliado_rato_salva_na_corrida": "Rato aliado salva o jogador na corrida sem fôlego",
    "test_respiracao_na_fissura": "Minijogo de respiração na crise de fissura (inclusive soltar cedo demais)",
    "test_jogar_de_novo_zera_tudo": "Jogar de novo zera pontos, medidores, cronômetro e progresso",
    "test_nomes_perigosos_sao_mostrados_como_texto": "Nome com código malicioso aparece como texto (segurança)",
    "test_nome_vazio_e_nome_longo": "Nome vazio vira 'Detento 17' e nome longo é cortado",
    "test_funciona_sem_localstorage": "Jogo funciona mesmo com o armazenamento do navegador bloqueado",
    "test_ranking_local_ordena": "Ranking do aparelho guarda e ordena as partidas",
    "test_ranking_geral_no_claude": "Ranking geral (claude.ai): envia a pontuação e ignora dados inválidos",
    "test_certificado_baixa_png": "Certificado baixa como PNG 1600×1130 com nome de arquivo sem acento",
    "test_certificado_no_claude_usa_downloads": "Certificado no claude.ai usa o salvamento da plataforma",
    "test_pular_transicao_e_tempo": "Tocar na transição pula a animação",
    "test_toques_aleatorios_rapidos": "Teste 'macaco': 600 toques aleatórios e rápidos sem nenhum erro",
    "test_telas_principais_em_varios_tamanhos": "Telas principais sem rolagem lateral, sem cortes e com botões grandes o bastante",
    "test_partida_completa_no_celular_pequeno": "Partida completa num celular pequeno (320 px), conferindo que nada cobre os botões",
    "test_partida_ruim_no_celular_pequeno": "Partida com todas as fases extras num celular pequeno",
    "test_balao_da_brisa_nao_tampa_botao": "Balão da Brisa não cobre o botão Continuar",
    "test_movimento_reduzido": "Funciona com animações reduzidas (acessibilidade)",
    "test_painel_de_voz_e_ranking_cabem_na_tela": "Painel de voz e ranking cabem na tela",
    "test_hud_mostra_personagem_e_medidores": "Painel do personagem e medidores aparecem certos",
    "test_brisa_le_o_jogo_inteiro_com_a_mesma_voz": "A Brisa lê a partida inteira sempre com a mesma voz",
    "test_texto_falado_e_limpo": "Falas sem emoji, sem código e sem palavras em maiúsculas (que seriam soletradas)",
    "test_le_pergunta_e_todas_as_opcoes_em_ordem": "Lê a pergunta e as opções A, B, C e D em ordem",
    "test_le_historia_personagens_e_consequencias": "Lê a história, o que os personagens falam e a consequência das escolhas",
    "test_para_de_falar_ao_avancar": "Ao avançar, a fala anterior para na hora antes da próxima",
    "test_falhas_da_voz_nao_trocam_voz_nem_repetem_fala_velha": "Falhas da voz: não troca de voz e não repete fala antiga",
    "test_cliques_rapidos_nao_quebram": "Cliques rápidos com falhas de voz não quebram o jogo",
    "test_destaque_acompanha_a_leitura": "O destaque azul acompanha o trecho lido",
    "test_liga_desliga_narracao": "Botão 🎙️ liga e desliga a narração",
    "test_ouvir_de_novo_e_botao_ouvir": "Botões 'Ouvir de novo' e '🔊 Ouvir'",
    "test_velocidade_devagar_fica_salva": "Velocidade 'Devagar' é aplicada e fica salva",
    "test_conversa_da_rodinha_lida_em_ordem": "Conversa da rodinha lida em ordem (Lucas, Bia, Lucas)",
    "test_sem_voz_da_brisa_fica_so_legenda": "Sem a voz da Brisa (site próprio/celular): só legenda, nunca voz robótica",
    "test_claude_sem_tts_tambem_fica_so_legenda": "No claude.ai sem voz disponível: só legenda",
}

xml = ET.parse(sys.argv[1] if len(sys.argv) > 1 else "/tmp/junit.xml").getroot()
cases = xml.iter("testcase")
grupos, total, ok = {}, 0, 0
for c in cases:
    mod = c.get("classname").split(".")[-1]
    name = c.get("name")
    base = name.split("[")[0]
    param = name[len(base):]
    failed = c.find("failure") is not None or c.find("error") is not None
    total += 1; ok += not failed
    grupos.setdefault(mod, []).append((DESC.get(base, base) + (f" {param}" if param else ""), not failed, float(c.get("time", 0))))

linhas = [f"# Relatório de testes · Fuga da Prisão Nuvem Doce",
          "",
          f"Gerado em {datetime.now().strftime('%d/%m/%Y %H:%M')} · **{ok} de {total} testes passaram**",
          "",
          "Os testes abrem o jogo num navegador Chrome automático e jogam sozinhos, clicando como uma pessoa. "
          "A voz é simulada para conferir exatamente o que a Brisa falaria e quando.",
          ""]
for mod, itens in grupos.items():
    linhas += [f"## {NOMES.get(mod, mod)}", "", "| Resultado | Teste | Tempo |", "|---|---|---|"]
    for d, passou, t in itens:
        linhas.append(f"| {'✅' if passou else '❌'} | {d} | {t:.0f} s |")
    linhas.append("")
linhas += ["## Como rodar de novo", "", "```bash", "pip install pytest playwright pillow", "python3 -m playwright install chromium",
           "python3 -m pytest tests -v --junitxml=/tmp/junit.xml", "python3 tests/relatorio.py /tmp/junit.xml", "```", "",
           "As capturas de tela ficam em `tests/capturas/`."]
Path(__file__).with_name("RELATORIO.md").write_text("\n".join(linhas), encoding="utf-8")
print(f"{ok}/{total} ok")
