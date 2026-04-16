# NEXT STEPS MVP

## Objetivo imediato
Fechar um loop jogável estável:
login -> personagem -> entrar no mundo -> mover -> ver mobs -> atacar

## Prioridade 1
- Consolidar fluxo de telas
- Consolidar GameplayEngine
- Remover duplicações antigas
- Padronizar eventos

## Prioridade 2
- Introduzir NetworkManager cliente
- Conectar login no servidor
- Receber world_init real
- Sincronizar movimento

## Prioridade 3
- Remote players
- Mobs reais do servidor
- Combate sincronizado
- Persistência de personagem

## Definição de pronto do MVP
- Jogador cria conta
- Faz login
- Cria personagem
- Entra no mapa
- Anda com WASD
- Vê pelo menos 3 mobs
- Consegue atacar
- Não crasha ao trocar de tela

## Status Atual
- ✅ Login local funcional
- ✅ Seleção de personagem
- ✅ Gameplay básico
- ✅ HUD funcional
- ✅ Mobs locais
- ✅ Movimento WASD
- ✅ Sistema de ataque
- ✅ Loop robusto com requestAnimationFrame
- ✅ Eventos padronizados
- ✅ GameState central
- ✅ HUDManager separado
- ✅ Logger central
- ✅ Suporte a entidades remotas

## Próximos Passos Imediatos
1. Implementar NetworkManager cliente
2. Conectar eventos de login ao servidor
3. Implementar world_init real
4. Sincronizar movimento multiplayer
5. Testar com múltiplos jogadores

## Arquitetura Atual
```
client/
├── config.js              # Configuração de modos
├── game-state.js          # Estado centralizado
├── network-events.js      # Eventos padronizados
├── logger.js             # Sistema de logs
├── HUDManager.js         # Interface do jogo
├── SimpleLoginManager.js # Login com modos
├── test-mode.js         # Modo de teste
├── modes/
│   ├── offline/
│   │   └── GameplayEngine.js  # Gameplay + multiplayer
│   └── online/
│       └── NetworkManager.js  # Comunicação futura
└── index.html             # Scripts organizados
```

## Métricas de Sucesso
- Tempo de login < 2s
- FPS estável > 30
- Sem memory leaks
- Comunicação < 100ms
- Zero crashes em troca de tela
