# Arquitetura do Jogo - Eldoria Chronicles

## 🎮 Visão Geral

MMORPG browser inspirado em World of Warcraft e New World, com foco em:
- **Progressão narrativa** até level 10
- **Combate tático** com posicionamento
- **Sistema de zonas** temáticas
- **Quests imersivas**
- **Arquitetura escalável** para multiplayer

## 🏗️ Estrutura de Arquivos

```
client/
├── index.html                    # Tela principal (login, char, jogo)
├── config.js                     # Configurações (modo, debug, etc)
├── game-state.js                 # Estado global do cliente
├── network-events.js             # Constantes de eventos de rede
├── logger.js                     # Sistema centralizado de logs
├── HUDManager.js                 # Interface do usuário (HUD)
├── LocalDataManager.js           # Persistência offline
├── SimpleLoginManager.js         # Login e seleção de personagem
├── test-mode.js                 # Modo de desenvolvimento rápido
├── quest-system.js               # Sistema de missões
├── zone-system.js                # Sistema de zonas e mapas
├── progression-system.js          # Sistema de níveis e progressão
├── npc-system.js                 # Sistema de NPCs e interação
├── modes/
│   ├── offline/
│   │   └── GameplayEngine.js   # Motor do jogo (offline)
│   └── online/
│       └── NetworkManager.js   # Comunicação com servidor
└── assets/                      # Recursos visuais (futuro)

server/
├── server.js                    # Servidor principal
├── controllers/                 # Controladores de API
├── models/                      # Modelos de dados
└── db/                         # Configuração de banco

scripts/                          # Scripts de automação
```

## 🎯 Sistemas Principais

### 1. GameState (Estado Global)
- **Responsabilidade:** Centralizar estado da aplicação
- **Dados:** tela atual, usuário, personagem, conexão
- **Métodos:** `setScreen()`, `setUser()`, `reset()`

### 2. ZoneSystem (Zonas e Mapas)
- **Responsabilidade:** Gerenciar zonas do mundo
- **Zonas Implementadas:**
  - `korvien_village` (Level 1-6): Vila starter
  - `ancient_forest` (Level 5-10): Floresta com quests
  - `shadow_cavern` (Level 10+): Caverna com boss
- **Recursos:** Gerar mobs, itens, transições

### 3. QuestSystem (Missões)
- **Responsabilidade:** Gerenciar progressão de quests
- **Tipos de Objetivos:**
  - `talk`: Conversar com NPCs
  - `kill`: Derrotar mobs
  - `gather`: Coletar itens
  - `explore`: Explorar áreas
- **Fluxo:** Auto-start da próxima quest

### 4. ProgressionSystem (Níveis e Stats)
- **Responsabilidade:** Gerenciar progressão do personagem
- **Classes:** Warrior, Mage, Archer, Rogue
- **Stats:** Strength, Stamina, Agility, Intelligence
- **Habilidades:** Desbloqueadas por nível
- **Fórmula XP:** `baseXP * 1.15^(level-1)`

### 5. NPCSystem (Personagens Não-Jogáveis)
- **Responsabilidade:** Gerenciar NPCs e interação
- **Tipos de NPCs:**
  - `quest_giver`: Dão missões
  - `vendor`: Vendem itens
  - `guard_info`: Informações da área
- **Interação:** Tecla [E] quando próximo

### 6. GameplayEngine (Motor do Jogo)
- **Responsabilidade:** Loop principal, renderização, física
- **Sistemas Integrados:**
  - Movimento WASD + corrida (Shift)
  - Combate com cooldown
  - Renderização de entidades
  - Câmera seguindo jogador
- **Performance:** `requestAnimationFrame` otimizado

## 🎨 Fluxo de Jogo

### 1. Login → Personagem → Jogo
```
1. Usuário cria conta/login (localStorage)
2. Seleciona ou cria personagem
3. Clica "Entrar no Mundo"
4. GameplayEngine.startGame() é chamado
5. Zona inicial carregada (korvien_village)
6. Sistemas inicializados (quests, npcs, mobs)
7. Loop de gameplay inicia
```

### 2. Progressão até Level 10
```
Level 1-3: Tutorial básico
├── Quest: "Primeiros Passos" (falar com capitão)
├── Objetivo: Aprender controles
└── Recompensa: XP + espada básica

Level 4-6: Primeiro combate
├── Quest: "Primeiro Sangue" (matar 5 goblins)
├── Objetivo: Combate básico
└── Recompensa: XP + poção de cura

Level 7-8: Exploração
├── Quest: "Exploração do Bosque" (coletar ervas)
├── Objetivo: Explorar nova zona
└── Recompensa: XP + poção de mana

Level 9-10: Boss final
├── Quest: "Ameaça nas Cavernas" (derrotar boss)
├── Objetivo: Combate avançado
└── Recompensa: XP + item épico
```

## 🌐 Arquitetura de Rede

### Eventos Padronizados
Formato: `dominio:acao`
- `auth:login` / `auth:login-success`
- `world:init-request` / `world:init`
- `player:move` / `player:moved`
- `quest:update` / `quest:completed`

### Modos de Operação
```javascript
const Config = {
  GAME_MODE: 'CLIENT_OFFLINE', // 'CLIENT_OFFLINE' | 'SERVER_ONLINE'
  SERVER_ADDRESS: 'http://localhost:3000'
};
```

## 🎮 Gameplay Mechanics

### Movimento
- **WASD:** Movimento básico
- **Shift:** Correr (consome stamina)
- **Velocidade:** Base + bônus de agilidade

### Combate
- **Espaço:** Ataque básico (melee)
- **1-3:** Habilidades da classe
- **Cooldown:** Global por habilidade
- **Posicionamento:** Dano bonus por trás

### Interação
- **E:** Interagir com NPCs
- **F:** Coletar itens próximos
- **Tab:** Abrir/fechar inventário

### HUD Elements
- **Vida/Mana:** Barras coloridas
- **XP:** Barra de progressão
- **Minimapa:** Zona atual
- **Chat:** Mensagens do sistema
- **Quest Log:** Objetivos ativos

## 📊 Performance e Escalabilidade

### Cliente
- **Render:** 60 FPS com requestAnimationFrame
- **Entities:** Até 50 mobs + 10 players
- **Memory:** < 100MB
- **Latency:** < 100ms para inputs

### Servidor
- **Players:** Até 100 simultâneos
- **Zones:** 5-10 zonas ativas
- **Tick Rate:** 20 updates/segundo
- **Database:** PostgreSQL/MongoDB

## 🚀 Próximos Passos

### Fase 1 (Atual)
- ✅ Sistemas básicos implementados
- ✅ Progressão 1-10 funcional
- ✅ 3 zonas temáticas
- ✅ NPCs interativos
- ✅ Quest system completo

### Fase 2 (Multiplayer)
- 🔄 NetworkManager cliente
- 🔄 Conexão real com servidor
- 🔄 Sincronização de movimento
- 🔄 Remote players visíveis
- 🔄 Chat global

### Fase 3 (Expansão)
- 📋 Mais zonas (nível 10-30)
- 📋 Sistema de guildas
- 📋 Economy e trading
- 📋 Instâncias (dungeons)
- 📋 PvP arenas

## 🎯 Métricas de Sucesso

### Gameplay
- **Tempo para level 10:** 4-6 horas
- **Engajamento:** > 70% completam quests
- **Retenção:** > 40% voltam no dia seguinte

### Técnico
- **FPS:** Médio > 45
- **Latency:** < 150ms
- **Uptime:** > 99%
- **Memory:** < 200MB

---

**Eldoria Chronicles - Arquitetura escalável para MMORPG browser** 🎮✨
