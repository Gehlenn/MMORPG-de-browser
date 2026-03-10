# MMORPG Browser - GDD v0.3.5
## Game Design Document

### 🎮 Visão Geral
MMORPG baseado em browser com foco em acessibilidade, gameplay rápido e comunidade ativa.

---

## 🌟 Core Mechanics

### 👤 Sistema de Personagem

#### Criação de Personagem
- **Slots:** 2 por conta (gratuitos)
- **Customização:**
  - Nome: 3-18 caracteres
  - Raça: Humano, Elfo, Anão, Orc
  - Classe: Aprendiz (inicial)
  - Avatar baseado na raça

#### Progressão
- **Níveis:** 1-50 (v0.3.5: apenas nível 1)
- **Atributos:**
  - HP (Health Points)
  - MP (Mana Points)
  - STR (Strength)
  - INT (Intelligence)
  - AGI (Agility)
  - DEF (Defense)

#### Classes Futuras (v0.5+)
- **Aprendiz →** Guerreiro, Mago, Arqueiro, Ladino
- **Especializações:** Level 10+
- **Skill Trees:** Pontos por nível

### 🗺️ Sistema de Mundo

#### Mapas Atuais (v0.3.5)
- **Village Day:** Área inicial segura
- **Forest North:** Zona de level 1-10
- **Cave Echo:** Dungeon inicial

#### Sistema de Coordenadas
- **Grid-based:** 64x64 tiles
- **Viewport:** 800x600 pixels
- **Scroll:** Suave com player center

#### Interatividade
- **NPCs:** Diálogos e quests
- **Portais:** Transição entre mapas
- **Safe Zones:** Cidades e vilas
- **PvP Zones:** Áreas específicas

### ⚔️ Sistema de Combate (Planejado v0.4)

#### Turn-Based Combat
- **Initiative:** Baseado em AGI
- **Actions:** Attack, Skill, Item, Defend
- **Critical Hits:** 5% base chance
- **Damage Formula:** `(STR * Weapon) - DEF`

#### Skills por Classe
- **Guerreiro:** Slash, Taunt, Whirlwind
- **Mago:** Fireball, Frost, Lightning
- **Arqueiro:** Shot, Multi-shot, Poison
- **Ladino:** Stealth, Backstab, Lockpick

### 💰 Sistema Econômico (Planejado v0.5)

#### Moedas
- **Gold:** Moeda principal
- **Premium:** Moeda real (futuro)

#### Inventário
- **Slots:** 20 base + expansões
- **Stacking:** Até 99 por item
- **Categories:** Armas, Armaduras, Consumíveis, Materiais

#### Trading
- **Player-to-Player:** Direto
- **Auction House:** Sistema de leilões
- **NPC Shops:** Compra/venda básica

---

## 🎨 Interface e UX

### 📱 Layout Principal

#### Tela de Login
- **Form:** Username + Password
- **Register:** Novos usuários
- **Recuperação:** Esqueci senha (futuro)

#### Tela de Seleção
- **Character Slots:** 2 cards visuais
- **Create Button:** Modal de criação
- **Enter Game:** Após seleção

#### Interface de Jogo
- **Game Canvas:** 800x600 central
- **HUD:** Status bars, minimapa, chat
- **Inventory:** Grid de itens
- **Character Sheet:** Stats e equipamentos

### 🎮 Controles

#### Teclado
- **WASD:** Movimento
- **Enter:** Chat
- **I:** Inventário
- **M:** Minimapa
- **ESC:** Menu principal

#### Mouse
- **Click:** Interação com NPCs
- **Drag & Drop:** Inventário
- **Hover:** Tooltips

### 🎨 Visual Design

#### Estilo Artístico
- **Pixel Art:** 32x32 sprites
- **Isometric:** Vista 2.5D
- **Color Palette:** Vibrante e acessível
- **Animations:** Smooth 60fps

#### UI Theme
- **Dark Mode:** Fundo escuro
- **Accent Colors:** Verde (#45a049)
- **Typography:** Sans-serif legível
- **Icons:** Emojis integrados

---

## 🌐 Multiplayer

### 📡 Sistema de Real-time

#### WebSocket Communication
- **Socket.io:** Conexão persistente
- **Events:** Movement, combat, chat
- **Latency:** < 100ms target
- **Reconnection:** Automática

#### Player Synchronization
- **Position:** 60 updates/second
- **State:** HP, MP, buffs
- **Animation:** Sync de ataques
- **Chat:** Global, guild, party

### 👥 Social Features

#### Amizades
- **Friend List:** Até 50 amigos
- **Status:** Online, offline, busy
- **Invite:** Para party e guild

#### Guilds (Planejado v0.6)
- **Creation:** 5+ players
- **Ranks:** Master, Officer, Member
- **Guild Bank:** Compartilhado
- **Guild Wars:** PvP sistemático

---

## 🎯 Game Loop

### ⚙️ Engine Cycle

#### 60 FPS Game Loop
```javascript
1. Input Handling
2. Player Movement
3. AI Updates (NPCs)
4. Collision Detection
5. Combat Resolution
6. State Synchronization
7. Rendering
8. UI Updates
```

#### State Management
- **Client State:** Local e preditivo
- **Server State:** Autoritativo
- **Reconciliation:** Correção de drift

### 🗺️ World Management

#### Map Loading
- **Streaming:** Sob demanda
- **Caching:** LRU cache
- **Preloading:** Mapas adjacentes
- **Memory:** < 100MB target

#### Entity Management
- **Players:** Até 100 por mapa
- **NPCs:** 20-30 por mapa
- **Monsters:** 10-15 por mapa
- **Items:** Ground items temporários

---

## 🔧 Technical Architecture

### 🏗️ Client-Side

#### JavaScript Modules
- **Game Engine:** Core loop e rendering
- **Asset Manager:** Cache e loading
- **Sprite Manager:** Animation system
- **UI System:** Interface components
- **Network Layer:** Socket.io client

#### Performance Targets
- **FPS:** 60 estável
- **Load Time:** < 5s inicial
- **Memory:** < 100MB
- **Bandwidth:** < 1MB/minuto

### 🖥️ Server-Side

#### Node.js Architecture
- **Express:** API REST
- **Socket.io:** Real-time communication
- **SQLite:** Database principal
- **Rate Limiting:** Anti-abuse

#### Database Schema
```sql
Users: id, username, password_hash, email
Characters: id, user_id, name, race, class, level, x, y
Inventory: id, character_id, item_id, quantity, slot
Guilds: id, name, master_id, created_at
```

---

## 🎯 Monetization (Planejado v1.0+)

### 💳 Premium Features

#### Subscription Model
- **Free:** 2 character slots, basic inventory
- **Premium:** 4 slots, bank access, cosmetics
- **VIP:** 6 slots, exclusive content, priority support

#### Microtransactions
- **Cosmetics:** Skins, pets, effects
- **Convenience:** Extra slots, fast travel
- **Time Savers:** Boosts, skips

#### Ethical Guidelines
- **No Pay-to-Win:** Only cosmetics/convenience
- **Transparent:** Odds claras em loot boxes
- **Fair Play:** Free players competitive

---

## 📊 Analytics & Metrics

### 📈 Player Engagement
- **DAU/MAU:** Daily/Monthly Active Users
- **Session Length:** Tempo médio por sessão
- **Retention:** Dia 1, 7, 30
- **Churn Rate:** Perda de jogadores

### 🎮 Game Balance
- **Class Distribution:** Popularidade das classes
- **Economy Flow:** Inflation/deflation
- **Difficulty Metrics:** Taxa de sucesso
- **Social Metrics:** Guilds, trades, chats

---

## 🚀 Roadmap de Features

### 📅 v0.4.0 - Combat System
- Turn-based battles
- Skills e abilities
- PvP arena

### 📅 v0.5.0 - Economy
- Inventory system
- NPC shops
- Trading

### 📅 v0.6.0 - Social
- Guild system
- Friend lists
- Party system

### 📅 v1.0.0 - Launch
- Mobile support
- Performance optimization
- Security hardening

---

## 🎨 Art & Sound Direction

### 🖼️ Visual Style
- **Art Direction:** Pixel art moderno
- **Color Theory:** Alto contraste, legível
- **Animation:** Smooth e responsiva
- **UI:** Clean e minimalista

### 🎵 Audio Design (Planejado)
- **Music:** Ambient por região
- **SFX:** Interactions e combat
- **Voice:** NPCs principais
- **Settings:** Volume controls

---

**GDD v0.3.5** - Documentação completa do sistema atual e visão futura.

*Última atualização: Versão 0.3.5 - Sistema Core Completo*
