# ARCHITECTURE

## Objetivo
Documentar uma arquitetura simples, incremental e segura para o MMORPG browser, evitando regressões e retrabalho.

## Princípios
- Um arquivo, uma responsabilidade principal
- Gameplay separado de HUD
- Estado global explícito
- Eventos de rede padronizados
- Fluxo de telas previsível
- Mudanças pequenas e verificáveis

## Camadas

### Cliente
- `index.html`: estrutura base, telas e inclusão dos scripts
- `game-state.js`: estado global do cliente
- `logger.js`: logs centralizados
- `network-events.js`: nomes padronizados dos eventos
- `SimpleLoginManager.js`: autenticação e fluxo login/personagem
- `HUDManager.js`: atualização visual da interface (HP, skills, chat)
- `InputManager.js`: captura de teclado/mouse
- `LocalDataManager.js`: persistência offline (localStorage)

### Gameplay (Core)
- `core/GameplayEngine.js`: motor principal (state, render, loop)
- `core/InputManager.js`: processamento de input
- `entities/Character.js`: classe base para players, mobs, NPCs
```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENTE                              │
├─────────────────────────────────────────────────────────────┤
│  UI Layer:     HUDManager, UIManager, ChatManager          │
│  Game Layer:   GameplayEngine (orquestrador)              │
│  Systems:      Movement, Combat, Quest, Loot               │
│  Managers:     Mob, Loot, Equipment, Player               │
│  Network:      NetworkManager (Socket.IO)                 │
│  State:        GameState                                  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼ WebSocket
┌─────────────────────────────────────────────────────────────┐
│                        SERVIDOR                             │
├─────────────────────────────────────────────────────────────┤
│  Modules:      CombatModule, QuestModule, LootModule     │
│  Systems:      MobSystem, SpawnManager, ZoneManager        │
│  Data:         PlayerDataManager                          │
│  Network:      Socket.IO handlers                         │
└─────────────────────────────────────────────────────────────┘
```

## Correções Recentes (Março 2026)

### 1. Código Duplicado Removido
- ✅ 9 arquivos `.deprecated` removidos (NetworkManagers, GameplayEngines, QuestSystems duplicados)
- ✅ Referências no `index.html` corrigidas

### 2. Bug de Login Corrigido
- ✅ `authenticateUser()` bugada removida (usava `email` undefined)
- ✅ Código morto (`else` órfão) removido em `initializeHUDs()`

### 3. Sistemas de XP Consolidados
- ✅ 3 sistemas (`checkLevelUp`, `handleXpGained`, `handlePlayerXpGain`) → 1 sistema
- ✅ `player.exp` é agora a fonte única de verdade

### 4. Fallbacks Legados Removidos
- ✅ `server.js`: removidos fallbacks para métodos legados de combat, loot e quests
- ✅ Agora usa apenas os módulos especializados

### 5. Culling de Renderização Implementado
- ✅ Método `isOnScreen(x, y, margin)` adicionado
- ✅ `renderResourceNodes()` e `renderLootDrops()` otimizados
'slash': {
    id: 'slash',
    name: 'Corte Rápido',
    baseDamage: 25,
    scaling: { str: 1.5 },
    cooldown: 2,
    manaCost: 0
}

// Uso
const skill = getSkill('slash');
const damage = calculateSkillDamage(skill, character);
```

## Convenções

### Nomenclatura
- Classes: `PascalCase` (GameplayEngine, HUDManager)
- Funções: `camelCase` (updatePlayer, renderMap)
- Constantes: `UPPER_SNAKE` (MAX_HP, ATTACK_RANGE)
- Arquivos: `kebab-case.js` ou `PascalCase.js`

### Eventos Socket
- `namespace:action` (ex: `auth:login`, `player:move`)
- Evitar nomes genéricos (`message`, `data`)

### Commits
- Inglês simples
- Verbo no imperativo: "Add", "Fix", "Update", "Remove"
- Ex: "Add GameplayEngine with state/render separation"

## Checklist de Qualidade

- [ ] State isolado de renderização
- [ ] HUD não modifica estado diretamente
- [ ] Skills têm validação de range/mana/cooldown
- [ ] Movimento sincronizado com servidor
- [ ] FPS estável (>30)
- [ ] Sem memory leaks (cleanup de eventos)

## Próximos Passos

1. Consolidar GameplayEngine (state/render separados)
2. Extrair HUDManager independente
3. Criar Character base
4. Definir SkillDB completo
5. Sincronizar cliente/servidor

## Referências

- `NEXT-STEPS-MVP.md`: roadmap de implementação
- `GDD_ELDORIA_COMPLETE.md`: design de classes/skills
- `client/core/` e `client/entities/`: implementações novas
