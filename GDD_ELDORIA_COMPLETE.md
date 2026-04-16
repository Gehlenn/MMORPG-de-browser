# 🎮 GAME DESIGN DOCUMENT - ELDORIA MMORPG
## Sistema de Classes, Equipamentos, Skills e Progression

**Versão:** 1.0 (Base Consolidada)  
**Data:** Março 2026  
**Projeto:** Eldoria MMORPG  
**Objetivo:** Definição completa de classes, talents, habilidades e progression

---

## 📑 ÍNDICE

1. [Sistema de Classe e Progression](#1-sistema-de-classe-e-progression)
2. [Árvore de Classes com Evolução](#2-árvore-de-classes-com-evolução)
3. [Atributos Base por Classe](#3-atributos-base-por-classe)
4. [Sistema de Equipamento](#4-sistema-de-equipamento)
5. [Item Rarities (WoW Style)](#5-item-rarities-wow-style)
6. [Item Loot e Item Level](#6-item-loot-e-item-level)
7. [Skills por Classe](#7-skills-por-classe)
8. [Skill Bar e UI](#8-skill-bar-e-ui)
9. [Profissões](#9-profissões-new-world--albion-style)
10. [HUD e UI](#10-hud-e-ui-wow--new-world-blend)
11. [Mapa e Navegação](#11-mapa-e-navegação-ragnarok-style)
12. [Árvore de Talentos](#12-árvore-de-talentos-wow-style)

---

## 1. SISTEMA DE CLASSE E PROGRESSION

### 🎯 Fases de Progressão de Classe

#### **FASE 1: Aprendiz (Nível 1-9)**
Todos os personagens começam como **Aprendiz**:

- ✅ 2-3 skills básicas de combate (ataque físico)
- ✅ 1 habilidade de movimento básica (dash curto ou roll)
- ✅ Stats base baixos
- ✅ Aprendizado das mecânicas básicas de combate e movimentação
- ✅ Quests de tutorial e introdução ao mundo

#### **FASE 2: Classe Base (Nível 10-39)**
Ao atingir **Nível 10**, o jogador pode escolher uma das **8 classes base**:

| Classe | Tipo | Role |
|--------|------|------|
| **Guerreiro** | Melee | DPS/Tank |
| **Mago** | Ranged | DPS/Control |
| **Arqueiro** | Ranged | DPS/Precision |
| **Sacerdote** | Suporte | Healer |
| **Druida** | Híbrido | Natureza |
| **Ladino** | Melee | DPS/Stealth |
| **Bruxo** | Ranged | DPS/DoT |
| **Lutador** | Melee | DPS/Combo |

**Ao escolher a classe base:**
- Unlock de 5-6 skills específicas da classe
- Distribuição de stats base específica
- Access a quest chain de classe
- Unlock de Talent Tree (iniciante)
- Class identity and role locking
- Profissão inicial ligada à classe
- Guild recommendation based on class role

#### **FASE 3: Especialização (Nível 40-89)**
Ao atingir **Nível 40**, cada classe base pode escolher uma de **3 especializações**:

**Exemplo — Guerreiro Level 40:**

| Caminho | Nome | Tipo | Stats |
|---------|------|------|-------|
| 1 | **Cavaleiro** | Tank/Proteção | +DEF, +VIT, -AGI |
| 2 | **Gladiador** | Melee DPS puro | +ATK, +AGI, +FÍS |
| 3 | **Paladino** | Híbrido/Proteção Mágica | +DEF, +INT, +SAB |

**Exemplo — Mago Level 40:**

| Caminho | Nome | Tipo | Stats |
|---------|------|------|-------|
| 1 | **Piromante** | AoE DPS/Burn | +INT, +FÍS, -VIT |
| 2 | **Criomante** | Control/Freeze | +INT, +SAB, +AGI |
| 3 | **Arcano** | Puro DPS/Buff | +INT, +AGI, +FÍS |

**Ao escolher especialização:**
- +5 skills específicas da especialização
- Modificadores de stats permanentes
- Unlock de Talent Tree especializado
- New quest chains and world events
- Special mounts and cosmetics
- PvP role specialization

#### **FASE 4: Evolução Avançada (Nível 90-98)**
Ao atingir **Nível 90**, cada especialização pode escolher uma de **2 evoluções**:

**Exemplo — Guerreiro > Cavaleiro > Evolução Level 90:**

| Caminho | Nome | Tipo | Stats |
|---------|------|------|-------|
| 1 | **Sentinela** | Proteção máxima, aura defensiva | +2 DEF, +VIT |
| 2 | **Guardião** | Proteção + taunt | +2 DEF, +ATK (reduzido) |

**Ao escolher evolução nível 90:**
- +3 skills ultra-específicas
- Modificadores de stats secundários
- Unlock final de Talent Tree
- Mythic gear path
- Realm/zone-specific abilities
- Hidden class features

#### **FASE 5: Classe Mestre (Nível 99+)**
Ao atingir **Nível 99**, o jogador pode evoluir para a versão **Mestre** da classe:

**Exemplo — Guerreiro > Cavaleiro > Sentinela > Mestre do Sentinela:**

- **Nome final:** "Mestre Sentinela" ou "Imortal Guardião"
- **+2 skills exclusivas de Mestre**
- **Bônus permanente final:** +5% a todos os stats
- **Unlock de cosmética/transmog exclusiva** (aura mestre)
- **Access a quest exclusiva de Mestre** (world boss, dungeon único)
- **Title and recognition**

### 📊 Resumo Visual do Flow de Classes

```
APRENDIZ (Lv 1-9)
    ↓ [Escolhe Classe Base em Lv 10]
┌─────────────────────────────────────────────────────┐
│ GUERREIRO │ MAGO │ ARQUEIRO │ SACERDOTE │ ...       │ (Lv 10-39)
│ (classe   │      │          │          │           │
│  base)    │      │          │          │           │
└─────────────────────────────────────────────────────┘
    ↓ [Escolhe Especialização em Lv 40]
  ┌─────────────────┬──────────────────┬─────────────────┐
  │ CAVALEIRO       │ GLADIADOR        │ PALADINO        │ (Lv 40-89)
  │ (tank/proteção) │ (DPS puro)       │ (híbrido)       │
  └─────────────────┴──────────────────┴─────────────────┘
    ↓ [Escolhe Evolução em Lv 90]
  ┌──────────────────┬─────────────────┐
  │ SENTINELA        │ GUARDIÃO         │ (Lv 90-98)
  │ (defesa máxima)  │ (defesa + taunt) │
  └──────────────────┴─────────────────┘
    ↓ [Evolui para Mestre em Lv 99]
  ✨ MESTRE SENTINELA ✨ (Lv 99+)
```

---

## 2. ÁRVORE DE CLASSES COM EVOLUÇÃO

### ⚔️ GUERREIRO (Classe Base)

#### Nível 40 - Escolha de Especialização

```
GUERREIRO (Base)
├─ CAVALEIRO ────────────────► Lv 90: SENTINELA / GUARDIÃO
│  (Tanque puro)
│  • Proteção máxima
│  • Habilidades defensivas
│  • Redução de dano
│  • Resistência a Crowd Control
│  • Aggro management
│  • Support-oriented tanking
│  • High survivability
│  • Low mobility
│  • Strong single-target protection
│  • Moderate AoE capabilities
│  • Focus on shielding
│  • 4 core abilities
│  • 3 defensive cooldowns
│  • 2 crowd control options
│  • 1 passive utility
│
├─ GLADIADOR ────────────────► Lv 90: CAMPEÃO / CONQUISTADOR
│  (Melee DPS puro)
│  • Alta mobilidade
│  • Combos devastadores
│  • Alta critic rate
│  • Burst damage
│  • Medium armor
│
└─ PALADINO ────────────────► Lv 90: ILUMINADO / PURIFICADOR
   (Híbrido/Proteção Mágica)
   • Cura + defesa
   • Resistência mágica
   • Buffs de grupo
   • Sustentação
```

### 🔮 MAGO (Classe Base)

```
MAGO (Base)
├─ PIROMANTE ────────────────► Lv 90: INFERNAL / DEVORADOR DE CHAMAS
│  (AoE DPS/Burn)
│  • Dano em área massivo
│  • Burn DoT
│  • Alta INT, baixa VIT
│
├─ CRIOMANTE ────────────────► Lv 90: GELADO / ARCANO CONGELADO
│  (Control/Freeze)
│  • Controle de multidões
│  • Freeze/Slow
│  • Alta SAB
│
└─ ARCANO ────────────────► Lv 90: SÁBIO ARCANO / MESTRE DIMENSIONAL
   (Puro DPS/Buff)
   • Dano single-target extremo
   • Buffs mágicos
   • Alta AGI
```

### 🏹 ARQUEIRO (Classe Base)

```
ARQUEIRO (Base)
├─ RANGER ────────────────► Lv 90: CAÇADOR / BESTEIRO
│  (DPS Ranged/Traps)
│
├─ SNIPER ────────────────► Lv 90: ATIRADOR / FRANCO ATIRADOR
│  (DPS Ranged/Precision)
│
└─ BEASTMASTER ────────────────► Lv 90: DOMADOR / ESPÍRITO SELVAGEM
   (DPS Ranged/Pets)
```

### ⭐ SACERDOTE (Classe Base)

```
SACERDOTE (Base)
├─ CLÉRIGO ────────────────► Lv 90: SANTO / BEATO
│  (Healer puro)
│
├─ SANTO GUERREIRO ────────────────► Lv 90: CRUZADO / PALADINO SAGRADO
│  (Healer DPS híbrido)
│
└─ ORÁCULO ────────────────► Lv 90: PROFETA / VIDENTE
   (Support/Debuff)
```

### 🌿 DRUIDA (Classe Base)

```
DRUIDA (Base)
├─ GUARDA FLORESTAL ────────────────► Lv 90: PROTETOR / GUARDIÃO DA NATUREZA
│  (Tank/Heal)
│
├─ XAMÃ ────────────────► Lv 90: LENDÁRIO / ESPÍRITO ANCESTRAL
│  (DPS Natureza)
│
└─ FORMA SELVAGEM ────────────────► Lv 90: BESTA / TITÃ FERAL
   (Melee DPS/Tank)
```

### 🗡️ LADINO (Classe Base)

```
LADINO (Base)
├─ ASSASSINO ────────────────► Lv 90: MESTRE ASSASSINO / SOMBRA MORTAL
│  (Burst DPS/Stealth)
│
├─ LADRÃO ────────────────► Lv 90: MESTRE LADRÃO / LADINO LENDÁRIO
│  (Utility/Stealth)
│
└─ DUELISTA ────────────────► Lv 90: MESTRE DUELISTA / CAMPEÃO DAS LÂMINAS
   (Sustained DPS/Evasion)
```

### 💀 BRUXO (Classe Base)

```
BRUXO (Base)
├─ NECROMANTE ────────────────► Lv 90: ARQUIMAGO DAS TREVAS / SENHOR DOS MORTOS
│  (Summoner/DoT)
│
├─ FEITICEIRO ────────────────► Lv 90: CONJURADOR / EVOCADOR
│  (DoT/Curse)
│
└─ ALQUIMISTA DAS TREVAS ────────────────► Lv 90: ALQUIMISTA MESTRE / ELIXIR DE DOOM
   (Debuff/Support)
```

### 🥊 LUTADOR (Classe Base)

```
LUTADOR (Base)
├─ MESTRE EM ARTES MARCIAIS ────────────────► Lv 90: GRÃO MESTRE / DRAGÃO
│  (Combo DPS)
│
├─ BERSERKER ────────────────► Lv 90: FÚRIA SANGRENTA / RAVAGER
│  (Rage-based DPS)
│
└─ MONGUE ────────────────► Lv 90: ILUMINADO / TRANSCENDENTE
   (Híbrido DPS/Heal)
```

---

## 3. ATRIBUTOS BASE POR CLASSE

### 📊 Seis Atributos Principais

| Atributo | Classe Afetada | Efeito |
|----------|----------------|--------|
| **STR** (Força) | Guerreiro, Lutador | +ATK físico, +Carry capacity, +Parry |
| **AGI** (Agilidade) | Ladino, Arqueiro | +Dodge, +Crit, +Attack Speed, +Movement |
| **INT** (Inteligência) | Mago, Bruxo | +Magia, +Spell Crit, +Mana |
| **VIT** (Vitalidade) | Guerreiro, Druida | +HP max, +Resistência a DoT |
| **SAB** (Sabedoria) | Sacerdote, Bruxo | +Cura efetividade, +Resistência Mágica, +Mana Regen |
| **FÍS** (Física) | Guerreiro, Lutador | +Armadura, +Redução Dano Físico, +Block |

### 📈 Distribuição Inicial (soma extra ao +10 base)

| Classe | STR | AGI | INT | VIT | SAB | FÍS |
|--------|-----|-----|-----|-----|-----|-----|
| **Guerreiro** | +20 | +10 | +5 | +15 | +8 | +12 |
| **Mago** | +5 | +12 | +25 | +5 | +15 | +10 |
| **Arqueiro** | +12 | +22 | +8 | +10 | +10 | +8 |
| **Sacerdote** | +8 | +8 | +18 | +12 | +22 | +5 |
| **Druida** | +14 | +15 | +12 | +14 | +14 | +12 |
| **Ladino** | +12 | +24 | +8 | +8 | +10 | +8 |
| **Bruxo** | +8 | +10 | +22 | +8 | +18 | +8 |
| **Lutador** | +18 | +16 | +8 | +16 | +10 | +15 |

---

## 4. SISTEMA DE EQUIPAMENTO

### 🛡️ Tipos de Armadura (3 Weights)

#### **TECIDO (Leve)**
- **Usuários:** Magos, Bruxos, Sacerdotes
- **Proteção:** Baixa físico, +40% mágico
- **Dodge:** +25%
- **Penalty:** -15% STR, -10% FÍS no Guerreiro

#### **COURO (Médio)**
- **Usuários:** Ladinos, Arqueiros, Druidas
- **Proteção:** +15% físico, +20% mágico
- **Dodge:** +15%
- **Parry:** +12%

#### **PLACA (Pesada)**
- **Usuários:** Guerreiros, alguns Paladinos
- **Proteção:** +50% físico, -20% mágico
- **Dodge:** -10%
- **Parry:** +25%

### 📦 14 Slots de Equipamento

1. Cabeça (Head)
2. Peito (Chest)
3. Costas (Back)
4. Ombro (Shoulder)
5. Braço (Arms)
6. Mãos (Hands)
7. Cintura (Waist)
8. Pernas (Legs)
9. Pés (Feet)
10. Acessórios (Trinkets) - 2 slots
11. Anéis (Rings) - 2 slots
12. Arma Primária (Main Hand)
13. Arma Secundária (Off Hand)

---

## 5. ITEM RARITIES (WOW STYLE)

### 🎨 6 Níveis de Raridade

| # | Raridade | Cor | Border | Vendável | Bônus | Exemplo |
|---|----------|-----|--------|----------|-------|---------|
| 1 | **COMUM** (Gray) | `#9D9D9D` | Gray | 5-15 gold | 0-1 stat | "Calça Comum" |
| 2 | **INCOMUM** (Green) | `#1EFF00` | Green | 20-50 gold | 1 primário OU 2 secundários | "Elmo de Ferro Reforçado" |
| 3 | **RARO** (Blue) | `#0070DD` | Blue | 100-300 gold | 2 primários OU 3 secundários + 1 passivo | "Túnica Azulada do Arcano" |
| 4 | **ÉPICO** (Purple) | `#A335EE` | Purple | 500-2000 gold | 3 primários + 1-3 passivos, 1-2 sockets | "Veste Épica do Sábio Arcano" |
| 5 | **LENDÁRIO** (Orange) | `#FF8000` | Orange | NÃO vendável | 4 primários + 2 passivos, 2 sockets, 1 encantamento exclusivo | "Coroa do Rei Caído" |
| 6 | **MÍTICO/ARTEFATO** (Gold) | `#FFD700` | Gold | NUNCA vendável | 5 primários + 3 passivos, 3 sockets, 1 encantamento ativo | "Artefato Infinito" |

---

## 6. ITEM LOOT E ITEM LEVEL

### 📊 Item Level (iLvl) Progression

| Zona | iLvl | Mobs | Dungeons | World Boss | Raid |
|------|------|------|----------|------------|------|
| **Iniciante (1-20)** | 10-25 | 10-15 | 20 | N/A | N/A |
| **Médio (21-40)** | 30-50 | 30-40 | 50 | 55 | N/A |
| **Avançado (41-60)** | 60-80 | 60-70 | 80 | 90 | 100 |
| **Épico (61-80)** | 100-130 | 100-120 | 130 | 145 | 160 |
| **Lendário (81-99)** | 150-190 | 150-170 | 190 | 210 | 240 |

### 🎲 Drop Tables

#### **Mob Normal:**
- 60% sem item
- 25% Comum
- 12% Incomum
- 3% Raro

#### **Mob Elite:**
- 10% sem item
- 30% Comum
- 40% Incomum
- 18% Raro
- 2% Épico

#### **World Boss:**
- 100% drop
- 5% Comum
- 20% Incomum
- 40% Raro
- 30% Épico
- 5% Lendário

---

## 7. SKILLS POR CLASSE

### 🎯 Estrutura de Skills

Cada classe tem **20-22 skills** (2 bars de 8 slots = 16 usáveis). Estrutura:

| Fase | Nível | Skills Adicionadas | Total |
|------|-------|-------------------|-------|
| Fase 1 | 1-9 | 2-3 básicas | 3 |
| Fase 2 | 10-39 | +5-6 específicas | 8-9 |
| Fase 3 | 40-89 | +5 de especialização | 13-14 |
| Fase 4 | 90-98 | +3 ultra-específicas | 16-17 |
| Fase 5 | 99+ | +2 de Mestre | 18-19 |

### ⚔️ Skills por Classe (Exemplos)

#### **GUERREIRO - Cavaleiro (Tank)**

| Slot | Skill | Tipo | Descrição |
|------|-------|------|-----------|
| 1 | **Corte Rápido** | Ataque Básico | Dano físico moderado, gera rage |
| 2 | **Investida Escudada** | Gap Closer | Avança com escudo, atordoa |
| 3 | **Golpe de Escudo** | Defesa/Ataque | Dano + aumenta defesa temporária |
| 4 | **Provocar** | Taunt | Força inimigo a atacar você |
| 5 | **Muralha de Escudo** | Defesa | +50% redução de dano por 5s |
| 6 | **Retalhar** | Counter | Contra-ataca após bloquear |
| 7 | **Grito de Batalha** | Buff | +20% ARM para grupo por 10s |
| 8 | **Último Resistir** | Emergency | Heal + imunidade por 3s (cooldown 5min) |

#### **MAGO - Piromante (AoE DPS)**

| Slot | Skill | Tipo | Descrição |
|------|-------|------|-----------|
| 1 | **Projétil Arcano** | Ataque Básico | Dano mágico, baixo cooldown |
| 2 | **Bola de Fogo** | Nuke | Dano de fogo em área |
| 3 | **Chama Continuada** | DoT | Aplica burn por 8s |
| 4 | **Explosão de Chamas** | AoE | Grande dano em cone |
| 5 | **Pilar de Fogo** | Ground AoE | Dano em área ao longo do tempo |
| 6 | **Escudo de Fogo** | Defesa | Absorve dano + queima atacantes |
| 7 | **Meteoro** | Ultimate AoE | Dano massivo em área (cooldown 3min) |
| 8 | **Teleporte** | Mobility | Teleporta curta distância |

---

## 8. SKILL BAR E UI

### 🎮 2 Skill Bars

#### **Bar 1 (Hotbar Principal):** 8 slots (teclas 1-8)
- Skills primárias de combate
- Skills de movimento
- Consumíveis

#### **Bar 2 (Hotbar Secundária):** 8 slots (Shift+1-8)
- Buffs de longa duração
- Skills situacionais
- Skills de utilidade

### 📖 Skill Book
- Interface de drag-and-drop para Hotbar
- Visualização de todas as skills desbloqueadas
- 16 skills selecionáveis simultaneamente

### 🖱️ UI Elements

| Elemento | Posição | Descrição |
|----------|---------|-----------|
| **Skill Bar 1** | Inferior centro | 8 slots principais |
| **Skill Bar 2** | Acima da Bar 1 | 8 slots secundários (Shift) |
| **Cooldown Overlay** | Em cada skill | Indicador visual de recarga |
| **Energy/Mana** | Abaixo das bars | Recurso atual / máximo |

---

## 9. PROFISSÕES (NEW WORLD + ALBION STYLE)

### 🛠️ 8 Profissões (Máx 3 aprendidas, 1 ativa)

| Profissão | Tipo | Produtos |
|-----------|------|----------|
| **ARMEIRO** | Crafting | Armas (espadas, arcos, cajados) |
| **ARMACÉM** | Crafting | Armaduras (placa, couro, tecido) |
| **JOALHARIA** | Crafting | Anéis, amuletos, gemas |
| **ALQUIMIA** | Crafting | Poções, venenos, elixires |
| **CULINÁRIA** | Crafting | Comidas com buffs |
| **TECELAGEM** | Crafting | Tecidos, capas, bags |
| **ENCANTARIA** | Crafting | Encantamentos para equipamentos |
| **GARIMPO** | Gathering | Minérios, pedras preciosas |

### 📈 Sistema de Progression

- **10 níveis de expertise** por profissão
- Cada nível concede:
  - +XP em crafts
  - Bônus de stats no equipamento craftado
  - Material salvável (chance de economizar materiais)
  - Rare recipes (receitas raras desbloqueadas)

### 🎯 Profissão por Classe (Recomendação)

| Classe | Profissão Primária | Secundária |
|--------|-------------------|------------|
| Guerreiro | Armeiro | Armacém |
| Mago | Alquimia | Encantaria |
| Arqueiro | Joalharia | Tecelegem |
| Sacerdote | Culinária | Alquimia |
| Druida | Garimpo | Tecelegem |
| Ladino | Armeiro | Joalharia |
| Bruxo | Alquimia | Encantaria |
| Lutador | Armacém | Culinária |

---

## 10. HUD E UI (WOW + NEW WORLD BLEND)

### 🖥️ Layout 1920x1080

```
╔══════════════════════════════════════════════════════════════════╗
║  [Player Panel]        [Target Panel]        [Minimap]          ║
║  HP/Mana/Name/Level     Alvo/Buffs/Distância  Mapa/Compass        ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                  ║
║                    [ÁREA DE JOGO]                                ║
║                                                                  ║
╠══════════════════════════════════════════════════════════════════╣
║  [Chat]                                    [Combat Log]          ║
║  Sistema/Guild/Party/Whisper               Danos/Curas            ║
╠══════════════════════════════════════════════════════════════════╣
║                    [HOTBAR PRINCIPAL]                            ║
║                    8 slots + Energy/Mana                         ║
╠══════════════════════════════════════════════════════════════════╣
║                    [HOTBAR SECUNDÁRIA]                           ║
║                    8 slots (Shift)                                 ║
╠══════════════════════════════════════════════════════════════════╣
║         [Party Frame] 5 membros + HP    [Ações]                  ║
╚══════════════════════════════════════════════════════════════════╝
```

### 🎯 Componentes Detalhados

#### **Player Panel** (Canto superior esquerdo)
- Barra de HP (verde/vermelho)
- Barra de Mana/Energy (azul)
- Nome do personagem + nível
- Status effects (buffs/debuffs)

#### **Target Panel** (Centro superior)
- Nome do alvo
- HP do alvo
- Buffs/debuffs do alvo
- Distância (em metros)
- Level do alvo

#### **Minimap** (Canto superior direito)
- Mapa circular/zoomável
- Compass indicador
- Waypoints (waypoint livre 1x, 10 gold depois)
- Ícones: 🏰 Cidade, ⚔️ Inimigos, 💎 Quest, 📦 Loot

#### **Chat** (Canto inferior esquerdo)
- Tabs: Sistema, Guild, Party, Whisper, Global
- Comandos: /g, /p, /w, /say

#### **Combat Log** (Canto inferior direito)
- Danos causados/recebidos
- Curas
- Misses/dodges/crits
- Scrollable history

#### **Party Frame** (Direita)
- 5 membros máximo
- HP/Mana de cada membro
- Distância indicador
- Role icon (tank/healer/dps)

---

## 11. MAPA E NAVEGAÇÃO (RAGNAROK STYLE)

### 🗺️ 2D Top-Down Pixel Art

#### **9 Zonas Conectadas:**

| # | Zona | Nível | Tipo | Conecta para |
|---|------|-------|------|--------------|
| 1 | **Campos de Treinamento** | 1-10 | Iniciante | Floresta |
| 2 | **Floresta Enevoada** | 10-25 | Floresta | Caverna |
| 3 | **Caverna Goblin** | 20-30 | Dungeon | Montanhas |
| 4 | **Montanhas Áridas** | 30-40 | Montanha | Castelo |
| 5 | **Castelo Arruinado** | 40-50 | Dungeon | Pântano |
| 6 | **Pântano Escuro** | 50-60 | Pântano | Torre |
| 7 | **Torre do Mago** | 60-70 | Dungeon | Celestial |
| 8 | **Reino Celestial** | 70-99 | Endgame | Dragão |
| 9 | **Câmara do Dragão** | 90+ | Raid | (End) |

### 🎯 Mapa Interativo

#### **Waypoints:**
- Waypoints gratuitos: 1x por hora
- Custo adicional: 10 gold
- Desbloqueados ao descobrir local

#### **Ícones no Mapa:**
| Ícone | Significado |
|-------|-------------|
| 🏰 | Cidade/Assentamento |
| ⚔️ | Área de inimigos |
| 💎 | Quest disponível |
| 📦 | Loot/Especial |
| 🔗 | Waypoint |
| ⭐ | World Boss |
| 🏪 | Merchant/Shop |
| ⚕️ | Healer/Santuário |

#### **Features:**
- Zoom in/out
- Waypoints salvos
- Filtro por tipo de conteúdo
- Tracking de quests
- Party member positions

---

## 12. ÁRVORE DE TALENTOS (WOW STYLE)

### 🌳 3 Árvores por Classe

Cada árvore:
- **5 linhas** de 6 + 1 ultimate
- **Linhas desbloqueam** a cada 10 níveis de especialização
- **1 ponto de talento** a cada 2 níveis (total 45 pontos até 99)

### ⚔️ Exemplo: Guerreiro > Cavaleiro (Tank)

#### **LINE 1** (40+)
| # | Talento | Efeito |
|---|---------|--------|
| 1 | **Armadura Reforçada** | +10% ARM |
| 2 | **Vida Extra** | +15% HP |
| 3 | **Parry Master** | +20% Parry chance |
| 4 | **Escudo Perfeito** | +30% block chance |
| 5 | **Stance Defensiva** | -10% dano recebido |
| 6 | **Defensor Natural** | +5% all resistances |
| **ULT** | **Fortaleza Imortal** | +50% HP por 10s (cooldown 5min) |

#### **LINE 2** (50+)
| # | Talento | Efeito |
|---|---------|--------|
| 1 | **Aura Defensiva** | Grupo +10% ARM |
| 2 | **Transferência de Dano** | 20% dano do aliado → você |
| 3 | **Escudo do Companheiro** | Protege aliado por 5s |
| 4 | **Reflexão** | Reflete 15% dano melee |
| 5 | **Resistência CC** | -30% crowd control duration |
| 6 | **Protetor Instintivo** | Auto-taunt em aliado atacado |
| **ULT** | **Protetor de Grupo** | Todos +50% ARM por 8s |

#### **LINE 3** (60+)
| # | Talento | Efeito |
|---|---------|--------|
| 1 | **Taunt Aprimorado** | Taunt + debuff de dano |
| 2 | **Taunt AoE** | Ataque em área + taunt |
| 3 | **Taunt de Longa Distância** | Range +50% |
| 4 | **Taunt Knockback** | Empurra inimigos |
| 5 | **Auto-heal em Taunt** | Heal 5% HP ao taunt |
| 6 | **Taunt Infinito** | Cooldown -50% |
| **ULT** | **Taunt Infinito** | Todos inimigos em 30m taunted |

#### **LINE 4** (70+)
| # | Talento | Efeito |
|---|---------|--------|
| 1 | **Último Resistir** | <30% HP = +50% redução dano |
| 2 | **Cura Sob Pressão** | +20% cura recebida <30% HP |
| 3 | **Imunidade Knockback** | Não pode ser empurrado |
| 4 | **Auto-heal Constante** | 1% HP a cada 2 hits recebidos |
| 5 | **Vitalidade Extrema** | +30% VIT |
| 6 | **Escudo de Emergência** | Escudo automático <20% HP |
| **ULT** | **Inabalável** | Imune a tudo por 5s (1x por combate) |

#### **LINE 5** (80+)
| # | Talento | Efeito |
|---|---------|--------|
| 1 | **Armadura Lendária** | Stacking +40% ARM por 10s |
| 2 | **Parada Perfeita** | Block = stun atacante |
| 3 | **Contra-ataque Mortal** | Contra-ataque +100% dano |
| 4 | **Fúria do Defensor** | Cada hit recebido = +2% ATK |
| 5 | **Muralha Viva** | +100% thorns damage |
| 6 | **Imortalidade** | 1x por dia, revive com 50% HP |
| **ULT** | **Muralha Imortal** | Imune por 10s, cura 100% HP |

### ⭐ CAPSTONE (99): Mestre Sentinela

| Talento | Efeito |
|---------|--------|
| **Mestre da Defesa** | +5% todos os stats |
| **Skills Mestre** | Unlock de 2 skills exclusivas de Mestre |
| **Aura Mestre** | Efeito visual exclusivo |
| **Título** | "Mestre Sentinela de Eldoria" |

---

## 📎 ANEXOS IMPORTANTES

### Tabela de HUD (Referência Rápida)

| Elemento | Offset X | Offset Y | Tamanho | Keybinding |
|----------|----------|----------|---------|------------|
| Player Panel | 20 | 20 | 250x100 | - |
| Target Panel | 835 | 50 | 250x80 | Tab |
| Minimap | 1650 | 20 | 150x150 | M |
| Chat | 20 | 750 | 400x200 | Enter |
| Combat Log | 1500 | 550 | 250x400 | L |
| Hotbar Principal | 660 | 900 | 600x80 | 1-8 |
| Hotbar Secundária | 660 | 820 | 600x60 | Shift+1-8 |
| Party Frame | 1700 | 300 | 100x250 | P |

### Tabela de Talentos (Unlock Levels)

| Line | Nível Mínimo | Pontos Máximos |
|------|--------------|----------------|
| Line 1 | 40 | 7 |
| Line 2 | 50 | 7 |
| Line 3 | 60 | 7 |
| Line 4 | 70 | 7 |
| Line 5 | 80 | 7 |
| Capstone | 99 | 3 |
| **TOTAL** | - | **38 pontos** |

### Quest Chains (Referência)

| Tipo | Nível | Recompensa | XP |
|------|-------|------------|-----|
| Main Story | 1-99 | Items, Gold | Alto |
| Class Quest | 10, 40, 90 | Class Skills | Muito Alto |
| Daily | 20-99 | Gold, Rep | Médio |
| World Event | 30-99 | Rare Items | Alto |
| Dungeon | 20-99 | Dungeon Gear | Alto |
| Raid | 60-99 | Legendary | Muito Alto |

---

## ✅ PRÓXIMOS PASSOS

### 🎯 Implementação

1. **Servidor:** Classes base → Especialização → Talentos
2. **Skills:** Sistema de 20-22 skills por classe
3. **UI:** Skill bars + HUD completo
4. **Loot:** Tabelas de drop + iLvl
5. **Profissões:** Sistema de crafting
6. **Mapa:** 9 zonas conectadas

### 📊 Prioridades

| # | Sistema | Prioridade | Estimativa |
|---|---------|------------|------------|
| 1 | Sistema de Classe | P0 | 2 semanas |
| 2 | Skill Bar UI | P0 | 1 semana |
| 3 | Talent Tree | P1 | 2 semanas |
| 4 | Equipamento/Rarities | P1 | 1 semana |
| 5 | Loot Tables | P1 | 3 dias |
| 6 | Profissões | P2 | 2 semanas |
| 7 | Mapa/Nav | P2 | 1 semana |
| 8 | HUD Completo | P2 | 1 semana |

---

**🎮 GAME DESIGN DOCUMENT COMPLETO**  
**Projeto:** Eldoria MMORPG  
**Versão:** 1.0  
**Status:** Base Consolidada - Pronto para Implementação

*Documento criado para desenvolvimento do sistema de classes, equipamentos, skills e progression do Eldoria MMORPG.*
