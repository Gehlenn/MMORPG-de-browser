# Mapeamento de Substituicao de Assets

Substitua os arquivos atuais pelos novos exports (mantendo os mesmos nomes usados pelo jogo).

## Areas
- `client/areas/village.svg` <- `village_day`
- `client/areas/forest.svg` <- `forest_north`
- `client/areas/mountain.svg` <- `mountain_gate` (ou `mountain_inside` quando quiser variar)
- `client/areas/cave.svg` <- `cave_echo`

## Sprites jogaveis
- `client/sprites/human.svg` <- `human_adventurer`
- `client/sprites/elf.svg` <- `elf_ranger`
- `client/sprites/dwarf.svg` <- `dwarf_guardian`

## Monstros
- `client/sprites/goblin.svg` <- `goblin_raider`
- `client/sprites/wolf.svg` <- `dire_wolf`
- `client/sprites/orc.svg` <- `mountain_orc`

## NPCs
Hoje o jogo reaproveita sprites de raca para NPCs. Quando quiser separar por NPC, posso ajustar o `client/game.js` para usar sprites dedicados.
