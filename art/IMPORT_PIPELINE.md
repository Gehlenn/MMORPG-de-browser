# Pipeline de Importacao de Arte IA

## 1) Coloque os arquivos gerados em
`art/generated`

Use os nomes definidos em `art/ASSET_LIST.json`, por exemplo:
- `village_day.png`
- `human_adventurer.png`
- `goblin_raider.png`

Pode usar extensoes: `.svg`, `.png`, `.webp`, `.jpg`, `.jpeg`

## 2) Simular sem alterar
```bash
npm run art:dry
```

## 3) Aplicar
```bash
npm run art:apply
```

## O que o script faz
- Procura cada asset no `art/generated`.
- Faz backup dos arquivos atuais em `art/backups/<timestamp>/`.
- Copia e renomeia para os paths do jogo (`client/areas`, `client/sprites`).
- Atualiza automaticamente as referencias de extensao em `client/game.js`.
- Copia assets extras (NPCs e dungeons) para pastas dedicadas.

## Configuracao
Ajuste mapeamentos em `art/pipeline.config.json`.

## Observacao
Se gerar variantes (ex.: `village_day_01.png`), o script aceita e escolhe automaticamente a melhor extensao por prioridade (`svg > png > webp > jpg > jpeg`).
