# Prompt Base (usar em todos)
Estilo fantasy cartoon 2D para MMORPG de browser, colorido, leitura clara, silhueta forte, luz suave, pintura digital limpa, sem texto.

Negativo: sem watermark, sem logo, sem texto, sem moldura, sem anatomia quebrada, sem membros extras.

---

## UI - Layout principal
Arquivo alvo: `layout_main_01`

Prompt:
"Interface completa de MMORPG web em estilo fantasy cartoon 2D, com painel esquerdo de navegacao e quests, area central com cena e minimapa visual, painel direito com personagem inventario equipamentos e conquistas, visual premium e limpo, contraste alto, legibilidade excelente, botoes coerentes, sem texto real, placeholders visuais, composicao organizada, desktop 16:9"

---

## Zonas

Arquivo alvo: `village_day`
Prompt:
"Vila medieval de fantasia em estilo cartoon, pracinha central, taverna aconchegante, mercado aberto, quadro de missoes, paleta quente, dia claro, ambiente amigavel, sem personagens em destaque, fundo para jogo"

Arquivo alvo: `forest_north`
Prompt:
"Floresta do norte em fantasia cartoon, arvores altas, trilha de terra, nevoa leve, tons verdes profundos, clima de exploracao, fundo para gameplay"

Arquivo alvo: `mountain_gate`
Prompt:
"Entrada de montanhas em fantasia cartoon, paredoes rochosos, passarela estreita, bandeiras gastas, horizonte frio, fundo de zona"

Arquivo alvo: `mountain_inside`
Prompt:
"Interior de montanhas em fantasia cartoon, penhascos, trilhas perigosas, ruinas antigas, luz fria, fundo de combate"

Arquivo alvo: `cave_echo`
Prompt:
"Caverna escura de fantasia cartoon, cristais discretos, poças rasas, sombras profundas, caminho central legivel, fundo de dungeon"

Arquivo alvo: `swamp_west`
Prompt:
"Pantano oeste em fantasia cartoon, agua turva, raizes retorcidas, vegetacao densa, atmosfera misteriosa, fundo para exploracao"

Arquivo alvo: `dungeon_solo_ruins`
Prompt:
"Ruinas antigas para dungeon solo, fantasia cartoon, colunas quebradas, simbolos antigos, luz dramatica suave, caminho central claro"

Arquivo alvo: `dungeon_group_crypt`
Prompt:
"Cripta para dungeon em grupo, fantasia cartoon, tumbas de pedra, tochas azuladas, corredor largo para batalha em equipe"

---

## Racas jogaveis (sprites)

Arquivo alvo: `human_adventurer`
Prompt:
"Aventureiro humano estilo fantasy cartoon 2D, corpo inteiro, pose idle, 3/4 frontal, equipamento leve de couro, fundo transparente"

Arquivo alvo: `elf_ranger`
Prompt:
"Elfo rastreador estilo fantasy cartoon 2D, corpo inteiro, pose idle, 3/4 frontal, arco elegante, capa verde, fundo transparente"

Arquivo alvo: `dwarf_guardian`
Prompt:
"Anao guardiao estilo fantasy cartoon 2D, corpo inteiro, pose idle, 3/4 frontal, armadura robusta e martelo, fundo transparente"

---

## NPCs (sprites)

Arquivo alvo: `innkeeper`
Prompt:
"NPC taverneiro simpatico, fantasia cartoon 2D, corpo inteiro, pose idle, roupa de estalajadeiro, fundo transparente"

Arquivo alvo: `merchant`
Prompt:
"NPC mercadora de mercado, fantasia cartoon 2D, corpo inteiro, pose idle, bolsa de moedas e itens, fundo transparente"

Arquivo alvo: `captain`
Prompt:
"NPC capitao da guarda, fantasia cartoon 2D, corpo inteiro, pose firme, armadura media, fundo transparente"

Arquivo alvo: `ranger_npc`
Prompt:
"NPC patrulheiro da floresta, fantasia cartoon 2D, corpo inteiro, pose idle, fundo transparente"

Arquivo alvo: `explorer_npc`
Prompt:
"NPC explorador de montanha, fantasia cartoon 2D, corpo inteiro, pose idle, mochila e corda, fundo transparente"

Arquivo alvo: `hermit_npc`
Prompt:
"NPC eremita do pantano, fantasia cartoon 2D, corpo inteiro, pose idle, cajado simples, fundo transparente"

Arquivo alvo: `miner_npc`
Prompt:
"NPC minerador, fantasia cartoon 2D, corpo inteiro, pose idle, picareta, lanterna, fundo transparente"

Arquivo alvo: `sentinel_npc`
Prompt:
"NPC sentinela de montanha, fantasia cartoon 2D, corpo inteiro, pose de guarda, fundo transparente"

---

## Monstros (sprites)

Arquivo alvo: `goblin_raider`
Prompt:
"Goblin saqueador, fantasia cartoon 2D, corpo inteiro, pose agressiva leve, cores verdes, fundo transparente"

Arquivo alvo: `dire_wolf`
Prompt:
"Lobo feroz de fantasia cartoon 2D, corpo inteiro, pose de alerta, pelo escuro, fundo transparente"

Arquivo alvo: `mountain_orc`
Prompt:
"Orc das montanhas, fantasia cartoon 2D, corpo inteiro, porte forte, armadura rude, fundo transparente"

---

## Pipeline recomendado
1. Gerar 3 variacoes por prompt.
2. Escolher 1 por asset mantendo consistencia.
3. Upscale leve e limpeza de bordas.
4. Exportar PNG final.
5. Substituir nos caminhos do projeto (`client/areas` e `client/sprites`) mantendo nomes usados no codigo.
