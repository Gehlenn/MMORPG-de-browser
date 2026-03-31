# 🎮 GAME DESIGN DOCUMENT — COMPLEMENTO
## Eldoria MMORPG - Sistemas Avançados, Conteúdo Endgame, Economia e PvP

**Versão:** 1.1 (Complemento)  
**Data:** Março 2026  
**Projeto:** Eldoria MMORPG  
**Objetivo:** Expandir o GDD base com sistemas críticos de retenção, economia, competição e conteúdo progressivo

---

## 📑 ÍNDICE

1. [PvP e Arenas](#1-pvp-e-arenas)
2. [Sistema de Guilds](#2-sistema-de-guilds)
3. [Economia e Moeda](#3-economia-e-moeda)
4. [Quest System](#4-quest-system)
5. [Dungeons e Raids](#5-dungeons-e-raids)
6. [World Events e Seasonal](#6-world-events-e-seasonal)
7. [Death Penalty e Respawn](#7-death-penalty-e-respawn)
8. [Farmeable Resources e Gathering](#8-farmeable-resources-e-gathering)
9. [Trading e Auction House](#9-trading-e-auction-house)
10. [Achievements e Titles](#10-achievements-e-titles)
11. [Battle Pass e Seasonal Progression](#11-battle-pass-e-seasonal-progression)
12. [Anti-Cheat e Fair Play](#12-anti-cheat-e-fair-play)
13. [Performance e Otimização](#13-performance-e-otimização)
14. [Balanço e Iteração](#14-balanço-e-iteração)
15. [Monetização e Cosmetics](#15-monetização-e-cosmetics)

---

## 1. PvP E ARENAS

### 🎯 Tipos de PvP

#### **1. Open World PvP (Flagged)**
- ✅ Jogadores podem se flaggar para PvP voluntariamente
- ✅ Flag dura até deslogar ou morrer
- ✅ Penalidade: -10% drop rate quando flaggado
- ✅ Recompensa: +25% loot ao matar jogador flaggado

**Corrupted System:**
- Ao matar 5 jogadores, fica "Corrupted" (vermelho)
- Corrupted: -50% movimento, visível no mapa para todos
- Pode ser hunted por jogadores normais
- Ao morrer Corrupted: perde 1 item raro da bolsa

#### **2. Arena PvP (Instanciado)**

**1v1 Duel Arena (Ladder Mensal):**
- Matchmaking por MMR (1200-5000)
- Best of 3 matches
- Rewards: Cosmetics, Titles, Rating badges
- Season reset mensal com rewards escalonados

**3v3 Team Arena:**
- Requer guild ou squad pré-formado
- Melhor de 5 matches
- Rewards: Gold, Cosmetics, Guild buffs

**10v10 Large Scale Arena (Semanal):**
- 4 slots abertos (First come, first serve)
- Rewards por posição final
- Duração: 20 minutos
- Kill streak counter (5+ kills = "Legendary")

#### **3. World Boss Contention**
- Mundo inteiro compete pelo boss
- Last hit = 40% gold/loot
- Contribution damage = 60% split
- PvP permitido na área do boss
- Se solo: 100% loot; Se grupo: escala

### 📊 Sistema de Rating PvP

| Rating Range | Título | Bônus |
|--------------|--------|-------|
| 0-1200 | Iniciante | Nenhum |
| 1200-1500 | Promissor | +5% Gold PvP |
| 1500-1800 | Guerreiro | +10% Gold PvP |
| 1800-2100 | Campeão | +15% Gold PvP + Cosmetic |
| 2100-2500 | Lenda | +20% Gold PvP + Cosmetic |
| 2500+ | Imortal | +25% Gold PvP + Mount lendário |

### 🏆 Ranking PvP Semanal
- **Top 10 global** → Bônus permanente por 1 semana (+30% exp PvP)
- **Top 100 global** → Cosmetic exclusivo por season
- **Top 1 global** → Título "Rei/Rainha da Arena"
- **Rewards resetam** toda segunda-feira

---

## 2. SISTEMA DE GUILDS

### 👑 Estrutura de Ranks

**Guild Hierarchy (5 Ranks Base):**

#### **Líder (Guild Leader)**
- 1 slot
- Gerencia treasury
- Remove/aprova membros
- Declara guild wars
- Nomeia oficiais

#### **Oficial (Officer)**
- Até 3 slots
- Gerencia treasury (tier 1)
- Convida/remove membros
- Organiza eventos
- Acesso a guild chat privado

#### **Membro Veterano (Veteran)**
- Membros com +30 dias
- Acesso full ao guild bank
- Contribui para treasury
- Participa de guild quests

#### **Membro (Member)**
- Membros novos
- Acesso limitado guild bank
- 1 transação/dia no treasury
- Sem contribuição obrigatória

#### **Recruta (Recruit)**
- Trial members
- Sem acesso treasury
- Visível no roster mas sem benefícios
- Dura 7 dias

### 🏦 Guild Bank

- **Slots:** 50 (upgrade cada Lv guild: +10/level até 200)

**Tiers de Acesso:**
| Tier | Rank | Permissões |
|------|------|------------|
| Tier 1 | Recruit | View only, 1 withdraw/semana (max 100 gold) |
| Tier 2 | Member | 5 withdraws/semana, max 500 gold |
| Tier 3 | Veteran | Unlimited, max 5000 gold/semana |
| Tier 4 | Officer | Manager completo |

- **Tax:** 10% de todos os depósitos vão direto ao treasury

### 💰 Guild Treasury (Wallet)

Moeda coletiva da guild:
- **Crescimento:** +10% de cada gold vendido por membros
- **Uso:** Guild upgrades, perks, buffs coletivos, events
- **Limite:** 1,000,000 gold (depois acumula lentamente)

### 📈 Guild Leveling

| Level | Requerimento | Desbloqueável |
|-------|--------------|---------------|
| 1 | Criado | 50 bank slots |
| 2 | 10,000 gold | +10 slots, Chat privado |
| 3 | 50,000 gold | +10 slots, Emblema guild |
| 4 | 200,000 gold | +10 slots, Guild house (23h acesso) |
| 5 | 500,000 gold | +20 slots, Perk: +10% exp para todos |
| 6 | 1,000,000 gold | +20 slots, Perk: +5% damage vs pve |
| 7 | 2,000,000 gold | +20 slots, Skill especial: Guild resurrection |
| 8 | 5,000,000 gold | +30 slots, Guild seal (cosmetic) |
| 9 | 10,000,000 gold | +30 slots, Perk: +20% loot MvM events |
| 10 | 20,000,000 gold | +50 slots, Exclusive mount + all perks stacked |

### ⚔️ Guild Wars (Territory Control)

- Cada guild pode controlar 1 territory (cidade ou dungeon)
- **Defesa:** Ganha 20% gold em vendas dentro território + acesso exclusivo
- **Ataque:** Declara guerra (50,000 gold fee), tem 7 dias para conquistar
- **Sistema:** Base com HP coletivo, defendedores vs atacantes (24 players max cada)
- **Reward vencedor:** 2x gold de loot por 7 dias, título exclusivo

### 📜 Guild Quests (Weekly)

| Quest Type | Objetivo | Reward |
|------------|----------|--------|
| Matar X mobs | Todos contribuem | +20% Treasury |
| Completar Dungeon | Guild run | Guild exp +50K |
| Matar World Boss | Cooperation | +2% Guild exp |
| Craft 100 items | Crafters work | +30K gold |
| Treasury donate | Coletivo: 50K gold | Unlock guild perk temp |

---

## 3. ECONOMIA E MOEDA

### 💰 Gold Spawn por Atividade

| Atividade | Gold | Frequência | Cap Diário |
|-----------|------|------------|------------|
| Mob comum | 5-15 | Por kill | 1000 gold/dia |
| Mob elite | 25-50 | Por kill | 500 gold/dia |
| World boss | 500 | Primeiras 5 kills | Ilimitado |
| Dungeon fácil | 500 | Por clear | 2000/dia |
| Dungeon média | 1000 | Por clear | 3000/dia |
| Dungeon hard | 2000 | Por clear | 4000/dia |
| PvP arena | 100-500 | Por vitória | 1500/dia |
| Quest | 50-500 | Depende quest | Ilimitado |
| Vendor vende item | -10% preço craft | Qualquer hora | Ilimitado |

### 🕳️ Gold Sinks (Consumidores de Gold)

| Atividade | Custo | Frequência |
|-----------|-------|------------|
| Viagem rápida (fast travel) | 10 gold | 30min CD |
| Reparar item quebrado | 10-50 g | Conforme break |
| Respec talento tree | 50 gold | 1h CD 1ª free |
| Death penalty item loss | 1 item | Ao morrer |
| Auction house listing | 5% venda | Ao vender |
| Guild war declaration | 50,000 g | Por guerra |
| Transmog cosmetic | 1,000 g | Por transmog |

### 📊 Preços Dinâmicos (Auction House)

- **Base price:** Definido pela rarity e iLevel
- **Market modifier:** ±30% baseado em oferta/demanda
- **NPC vendor:** Sempre 50% do preço AH (piso mínimo)
- **Fórmula:** `base_price × rarity_mult × ilvl_mult × market_adj`

### 📉 Inflation Control

- **Logarithmic scale:** O valor de farmear aumenta com player level
- **Patch rebalance mensal:** Ajusta drops se economia desviar
- **Server-wide economy report:** Top sellers, average prices, inflation %, disponível no site
- **Weekly deflation:** Cada segunda-feira, some ~2% do gold em circulação (evento random)

---

## 4. QUEST SYSTEM

### 🎯 Tipos de Quest

#### **Main Quests (Campanha Principal)**
- 1 por nível (100 total Lv 1-99)
- Storyline conectada
- XP escalado: 10% total exp necessário por level
- Rewards: Armor/weapon garantido ao atingir boss quest
- Não repeatable
- Desbloqueiam dungeons

#### **Side Quests (Conteúdo Opcional)**
- 50+ espalhadas pelo mundo
- XP: 5% do necessário por level
- Rewards: Variados (gold, itens, cosmetics)
- Completar 10 side quests = Título "Explorer"

#### **Daily Quests**
- 10 disponíveis por dia (rotam cada 24h)
- XP: 2% por nivel (acumulam em 10)
- Rewards: Gold + reputation
- Reset: Meia-noite server time

#### **Weekly Quests**
- 5 disponíveis (rotam cada 7 dias)
- XP: 5% por quest
- Rewards: Raro+ item garantido
- Reset: Segunda-feira 8h

#### **Reputation Quests (Faction)**
- Após 10 daily quests, unlock faction quests
- **3 factions:** Ordem (protect), Caos (conquest), Natureza (balance)
- Recompensa: Acesso a vendor exclusivo + bônus stats (+5% por faction level)

### 📋 Quest Tracking UI

```
┌─────────────────────────────────────┐
│ [QUESTS]                            │
│                                     │
│ Main: Slay the Shadow King          │
│ Progress: 0/1 boss defeat           │
│ Reward: 10,000 XP + Rune Armor      │
│ Location: Dark Tower (marked)       │
│ Distance: 2.5 km away               │
│                                     │
│ Daily: Collect 20 herbs             │
│ Progress: 12/20 collected           │
│ Reward: 500 Gold                    │
│ [Auto-pickup enabled]               │
│                                     │
│ Abandoned quest: Clear cave         │
│ [Abandon] [Resume]                    │
└─────────────────────────────────────┘
```

### 🗺️ Quest Markers

| Tipo | Cor/Ícone |
|------|-----------|
| Main quest | Amarelo (star) no mapa |
| Side quest | Verde no mapa |
| Daily | Azul no mapa |
| Completed | Cinza (já fez, reward dado) |
| Progressão | Percentual visível no icon |
| Auto-navigate | Clique no quest → auto-pathing ativado |

---

## 5. DUNGEONS E RAIDS

### 🎚️ Difficulty Modes

| Difficulty | Level Rec | Party | Loot iLevel | Cooldown | Duration |
|------------|-----------|-------|-------------|----------|----------|
| Normal | iLv -30 | 1-5 | iLv +10 | 6h | ~15min |
| Hard | iLv +0 | 1-5 | iLv +30 | 12h | ~25min |
| Mythic | iLv +20 | 1-5 | iLv +60 | 24h | ~40min |

### 🏰 Dungeon Progression

#### **Tier 1 Dungeons (Lv 10-30)**

**1. Caverna Goblin** (5 mobs elite + 1 boss)
- **Boss:** Goblin King (50% stun, 1x summon)
- **Loot:** Incomum-Raro
- **Reward:** 500 gold, 2000 exp

**2. Templo Ruído** (8 mobs + 2 bosses)
- **Bosses:** Twin Clerics (cura simultânea)
- **Loot:** Raro (30%)
- **Reward:** 1000 gold, 4000 exp

#### **Tier 2 Dungeons (Lv 30-60)**

**3. Castelo Arruinado** (15 mobs + 3 bosses)
- **Boss 1:** Black Knight (high armor)
- **Boss 2:** Sorcerer (AoE magic)
- **Boss 3:** Dragon Whelp (fire DoT)
- **Loot:** Épico (20%), Raro (50%)
- **Reward:** 3000 gold, 10,000 exp

#### **Tier 3 Dungeons (Lv 60-90)**

**4. Torre do Mago** (20 mobs + 4 bosses) — Vertical tower
- **Floor 1:** Frost Mage (slow aura)
- **Floor 2:** Infernal Guardian (AoE)
- **Floor 3:** Shadow Assassin (stealth + burst)
- **Floor 4:** Archmage (buff allies + buff self)
- **Loot:** Épico (50%), Lendário (5%)
- **Reward:** 8000 gold, 20,000 exp

#### **Tier 4 Raid Dungeons (Lv 90+)**

**5. Câmara do Dragão** (10-player raid, 5 bosses)
- **Boss 1:** Ancient Wyvern
- **Boss 2:** Elemental Council (3 elementais simultâneos)
- **Boss 3-5:** Dragon aspects (fire/ice/lightning)
- **Enrage timer:** 30 min total
- **Loot:** Lendário (40%), Mítico (5%)
- **Reward:** 20,000 gold, 50,000 exp
- **Weekly resets:** Max 3 kills/semana

### ⚙️ Dungeon Mechanics

#### **Standard Boss Mechanics:**
- **Phase 1 (100%-75% HP):** Ataque + 1 ability
- **Phase 2 (75%-50% HP):** Ataque + 2 abilities + summons
- **Phase 3 (50%-0% HP):** Ataque + 3 abilities + enrage (+50% damage)

#### **Common Mechanics:**
- **Frontal Cone:** Evitar área frontal (20 graus, 15m)
- **Ground AoE:** Circular explosão (teleportar out)
- **Mechanic Stun:** Boss interruptível por 5s se jogadores atacarem X vezes
- **Heal Mech:** Boss invoca adds que precisam ser killed para quebrar invulnerabilidade
- **Enrage:** Timer de 30 min (raid) ou 15 min (dungeon), boss gains +500% damage se passar

### 🎁 Weekly Vault / Loot Trading

- Completar dungeon = 1 vault key por difficulty
- 3 keys = 1 week de rewards automático
- Podem trocar loot entre members se todos presentes no clear
- 1h window para trade após boss kill

---

## 6. WORLD EVENTS E SEASONAL

### 📅 Event Calendar (Anual)

| Mês | Event | Duração | Reward Theme |
|-----|-------|---------|--------------|
| Janeiro | New Year Gauntlet | 7 dias | New Year cosmetics |
| Fevereiro | Amor Festival | 14 dias | Pink/red cosmetics |
| Março | Spring Renewal | 21 dias | Nature cosmetics |
| Abril | Chaos Month | 30 dias | Dark cosmetics |
| Maio | Arena Championship | 7 dias | Title + mount |
| Junho | Summer Solstice | 21 dias | Gold cosmetics |
| Julho | King's Tournament | 14 dias | Royal cosmetics |
| Agosto | Harvest Festival | 21 dias | Crop/plant themed |
| Setembro | Fall Migration | 14 dias | Travel cosmetics |
| Outubro | Spooky Hollow | 21 dias | Halloween items |
| Novembro | Gratitude Month | 14 dias | Free rewards |
| Dezembro | Winter Wonderland | 30 dias | Frozen cosmetics |

### 🎪 Seasonal Dungeon

- Limited-time dungeon por event (2x week)
- Exclusive loot (seasonal cosmetics, limited skins)
- Difficulty aumenta conforme event progride
- Boss exclusivo semanal com unique mechanic

### 🐉 World Boss Schedule

| Boss Name | Zone | Level | Spawn Time | Respawn |
|-----------|------|-------|------------|---------|
| Flame Wyvern | Lava Field | 40 | Wed 20h | 3 dias |
| Frozen Titan | Ice Peak | 60 | Sat 18h | 3 dias |
| Shadow Reaper | Dark Forest | 80 | Sun 22h | 5 dias |
| Azure Dragon | Sky Temple | 99 | Fri 21h | 7 dias |

- **Primeiros 10 a dar hit:** +50% loot
- **Guild que mata:** +20% gold em território por 7 dias

### 🎫 Seasonal Battle Pass

- **100 tiers progressivos**
- Tier reward a cada 1000 XP seasonal (de quests, events, dungeons)
- **Free track:** 50 rewards (cosmetics, gold)
- **Premium pass:** +50 rewards (exclusive skins, mounts, emotes)
- **Custo:** 500 gold ou $5 USD
- **Durability:** 3 meses, reset a cada season

**Sample Battle Pass Rewards:**

| Tier | Free Rewards | Premium Rewards |
|------|--------------|-----------------|
| 1-20 | 100 Gold x10, Cosmetic: Simple Cape | 200 Gold x10, + Rare helmet skin |
| 21-40 | Transmog token x5, Emote: Sit | 500 Gold x5, + Legendary transmog |
| 41-60 | Experience scroll +10%, Random cosmetic | Mount skin (generic), + 5x Rune stones |
| 61-80 | Title: "Season X Vet", 2000 Gold | Title: "S X Master", + 10,000 Gold |
| 81-100 | "Champion Cape" transmog, + Final Title | Unique Artifact skin, + Legendary mount |

---

## 7. DEATH PENALTY E RESPAWN

### 💀 Death Mechanics

- **Respawn:** Automático 5 segundos após morte (cancelável com clique)
- **Penalty:** -5% XP no próximo level (recuperável com quest)

**Item Loss:**
- Se morre por NPC: nenhuma loss (item regenera)
- Se morre por player flaggado: 1 item Raro+ aleatório vai pra inventory do matador (max 1/dia)
- Se morre em dungeon: item cai no chão, 5 min window para recuperar

### 📍 Respawn Location

- **Default:** Última waypoint usada (viagem rápida)
- **Alternativa:** Próxima cidade (menos 100 XP penalty)
- **PvP zones:** Respawn em base segura (1 min de invulnerabilidade)

### 👻 Ghost Form (Antes de Respawn)

- Vê inimigos que o mataram por 10 seg
- Pode usar emotes (sem efectos visuais)
- Não pode atacar nem ser atacado
- Timer de respawn visível

### 📉 Recovery Penalty

- **Próximas 3 mortes em 1 hora:** -10% XP por morte (stacking)
- **Reset:** 1 hora sem morrer
- **Max penalty:** -30% XP

---

## 8. FARMEABLE RESOURCES E GATHERING

### ⛏️ Gathering Professions (Extras)

#### **Mining (Minério Refinado)**

**Nodes aparecem em:**
| Minério | Local | Level |
|---------|-------|-------|
| Copper | Starter zone | Lv 1 |
| Iron | Misty Forest | Lv 15 |
| Mithril | Mountains | Lv 40 |
| Adamantite | Dark Realm | Lv 70 |
| Orichalcum | Sky Temple | Lv 99 |

- **Respawn:** 10 min após harvest
- **XP:** +50 por node

#### **Herbalism (Ervas Alquímicas)**

**Nodes aparecem em:**
| Erva | Local | Level |
|------|-------|-------|
| Marigold | Starter zone | Lv 1 |
| Moonflower | Forest | Lv 20 |
| Dragonscale fern | Volcanic zone | Lv 50 |
| Starlight herb | Celestial zone | Lv 80 |

- **Respawn:** 8 min
- **XP:** +40 por node

#### **Fishing (Special ingredients)**

- Spots em rivers/lakes de cada zone
- **Rare chance:** 5% ao pescar = Legendary fish
- **XP:** +30 por pesca

### 📊 Resource Locations Table

| Resource | Zone | Level | Density | Rarity |
|----------|------|-------|---------|--------|
| Copper Ore | Starter Fields | 1 | High | Common |
| Iron Ore | Misty Forest | 15 | Medium | Common |
| Mithril | Mountains | 40 | Low | Rare |
| Adamantite | Wasteland | 70 | Very Low | Rare |
| Orichalcum | Sky Temple | 99 | Ultra Low | Epic |

---

## 9. TRADING E AUCTION HOUSE

### 🏛️ Auction House System

#### **Listing**
- **Custo:** 5% da venda final (deducted automaticamente)
- **Duration:** 48 horas
- **Max listings per player:** 20 simultâneos
- **Min preço:** 1 gold
- **Max preço:** 10,000,000 gold

#### **Search & Filter**
```
[Search Bar] ___________
[Item Name] [Rarity ▼] [iLevel Min/Max] [Price Min/Max] [Sort: Price/Freshness/Rating]

Results:
═════════════════════════════════════════════════════════════════
Item Name        │ Rarity │ iLvl │ Price │ Seller │ Time Left
─────────────────┼────────┼──────┼────────┼────────┼─────────
Sword Epic +50   │ Epic   │ 100  │ 5,000  │ Smith  │ 24h 3min
Sword Epic +50   │ Epic   │ 100  │ 4,800  │ Knight │ 18h 22min
Sword Epic +50   │ Epic   │ 100  │ 5,200  │ Mage   │ 47h 15min
═════════════════════════════════════════════════════════════════
```

#### **Bid System (Opcional)**
- **Start bid:** 80% asking price
- **Buyout:** 100% asking price
- **Duration:** 24-72 horas
- **Winner paga via automatic gold transfer**

### 🤝 Trade Window (Player-to-Player)

- Requerer iniciação: `/trade @playername`
- Ambos colocam items + gold
- Both devem confirmar antes de aceitar
- **Timeout:** 30 seg inativo = cancela

### 📧 Mail System

- Enviar items/gold para offline players
- **Duration:** 30 dias (auto-delete se não coletado)
- **Max items por mail:** 10
- **Custo:** Grátis para gold, 10 gold para items

---

## 10. ACHIEVEMENTS E TITLES

### 🏆 Achievement Categories

#### **Combat Achievements**
| Achievement | Requisito |
|-------------|-----------|
| "Slayer" | Kill 100 mobs comuns |
| "Elite Hunter" | Kill 50 mobs elite |
| "World Boss Slayer" | Kill todos world bosses |
| "Unstoppable" | Kill 10 jogadores consecutivos sem morrer |
| "Glass Cannon" | Deal 10,000 damage em 1 hit |

#### **Exploration Achievements**
| Achievement | Requisito |
|-------------|-----------|
| "Explorer" | Visit 50 unique locations |
| "Cartographer" | Discover 100% do mapa |
| "Secret Finder" | Find 25 hidden treasures |
| "Waypoint Master" | Unlock todos 50 waypoints |

#### **Economy Achievements**
| Achievement | Requisito |
|-------------|-----------|
| "Rich" | Acumulate 1,000,000 gold |
| "Merchant" | Sell 500 items no auction house |
| "Crafting Master" | Craft 1000 items |
| "Collector" | Gather 10,000 resources |

#### **Social Achievements**
| Achievement | Requisito |
|-------------|-----------|
| "Guildmaster" | Create a guild |
| "War Hero" | Win 10 guild wars |
| "Arena Champion" | Reach MMR 2000+ |
| "Popular" | Get 50 friends |

#### **Dungeon Achievements**
| Achievement | Requisito |
|-------------|-----------|
| "Dungeon Crawler" | Complete 10 dungeons |
| "Speed Runner" | Complete dungeon em <5 min |
| "No Hit Run" | Complete dungeon sem tomar dano |
| "Raid Master" | Complete raid no Mythic |

### 🎖️ Title System

- **Títulos aparecem** above character name (opcional)
- **Cores baseadas em rarity:**
  - Incomum: Verde
  - Raro: Azul
  - Épico: Roxo
  - Lendário: Laranja
  - Mítico: Dourado

**Sample Titles:**

| Achievement | Title Obtido | Color |
|-------------|--------------|-------|
| First Boss Kill | "Slayer of [Boss]" | Blue |
| Reach Level 99 | "Eternal Guardian" | Orange |
| PvP Rating 2500 | "Imortal Arena" | Gold |
| Kill 1000 mobs | "Devourer of Flesh" | Purple |

---

## 11. BATTLE PASS E SEASONAL PROGRESSION

### 📈 Progression Path (Seasonal)

- **Cada season dura 3 meses**
- Começa com level 1, tier 1
- **XP seasonal:** Quests daily (+500), Dungeons (+1000), PvP (+2000), Events (+500)
- **Level up** a cada 5000 XP (leva ~100h de jogo média)

### 🎁 Tier Rewards Structure

| Tier | Free Rewards | Premium Rewards |
|------|--------------|-----------------|
| 1-10 | 100 Gold x10, Cosmetic: Simple Cape | 200 Gold x10, + Rare helmet skin |
| 11-20 | Transmog token x5, Emote: Sit | 500 Gold x5, + Legendary transmog |
| 21-50 | Experience scroll +10%, Random cosmetic | Mount skin (generic), + 5x Rune stones |
| 51-80 | Title: "Season X Vet", 2000 Gold | Title: "S X Master", + 10,000 Gold |
| 81-100 | "Champion Cape" transmog, + Final Title | Unique Artifact skin, + Legendary mount |

### 🔄 Seasonal Reset Mechanics

- **End of season:** Todos os seasonal itens ficar "legacy"
- **Cosmetics permanecem** visíveis mas marcados como "S1 Champion"
- **Rating/ranks resetam** para 50% do anterior (floor 1200)
- **New battle pass** começa fresco
- **Cosmetics exclusivos** não viram tradable

---

## 12. ANTI-CHEAT E FAIR PLAY

### 🛡️ Anti-Cheat Measures

#### **Client-Side Detection**
- Detecção de modificações em assets (hash check)
- Detecção de speedhack (movimento velocidade anômala)
- Detecção de wall-clipping (posição inválida)
- Detecção de skill spam (cooldown bypass)

#### **Server-Side Validation**
- **Authority validation:** Servidor valida todo damage/heal
- **Movement check:** Flag movimento impossível (teleport, velocidade >limite)
- **Skill validation:** Checar linha de visão, distância, cooldown
- **Stat validation:** Recalcular damage/defense from scratch (não confiar cliente)

### ⚖️ Punishment System

| Offense | First | Second | Third |
|---------|-------|--------|-------|
| Speedhack detected | 1h ban | 24h ban | Permanent |
| Damage hack | 24h ban | 7 dias | Permanent |
| Wall clip exploit | Warning | 24h ban | 7 dias |
| RMT (real money) | Confiscate | 30d ban | Permanent |
| Harassment/toxic | Mute 24h | Mute 7d | Ban 7d |

### 🎮 Fair Play Systems

- **Matchmaking:** MMR-based (deviation < 500 rating)
- **Latency advantage:** Server-side hit detection, client only aim assist
- **Skill balance:** Monthly balance patch se win rate >55% qualquer classe
- **Economy monitoring:** Flag se player gains >1M gold/day (likely goldseller)

---

## 13. PERFORMANCE E OTIMIZAÇÃO

### 💻 Client Optimization

#### **LOD (Level of Detail): 3 stages**
| Stage | Distância | Detalhe |
|-------|-----------|---------|
| Far (>100m) | >100m | Sprite simples, no animation |
| Mid (50-100m) | 50-100m | Sprite normal, sem aura |
| Near (<50m) | <50m | Full detail + aura + effects |

#### **Outras Otimizações:**
- **Object pooling:** Recicla bullets/effects
- **Culling:** Renderiza apenas viewport + 20% buffer
- **Network rate:** 20 packet/sec (50ms latency)

### 🖥️ Server Optimization

- **Instance pooling:** Pre-spawns dungeons
- **NPC AI tick rate:** 10 updates/sec (não 60)
- **Pathing cache:** Navmesh precalc
- **Database queries:** Query batching, 1 query/sec máximo per player
- **Guild bank:** Lazy load (carrega ao abrir)

### 📊 Performance Targets (Quality)

| Metric | Target | Acceptable | Unacceptable |
|--------|--------|------------|--------------|
| Client FPS | 60 | 40+ | <30 |
| Network latency | <50ms | <100ms | >150ms |
| Login time | <5s | <10s | >20s |
| Dungeon load | <3s | <5s | >10s |
| Server tick | <16ms | <33ms | >50ms |
| DB query response | <50ms | <100ms | >200ms |

### 💾 Memory Budgets

| Component | Budget | Notes |
|-----------|--------|-------|
| Player model | 5 MB | Includes armor |
| Item assets | 20 MB | All rarities |
| Abilities/VFX | 30 MB | Skill animations |
| Map data | 50 MB | Per zone (streamed) |
| NPC/Mob models | 15 MB | Shared variants |
| UI | 10 MB | All panels |
| **Total Target** | **200 MB** | Comfortable on 1GB RAM |

---

## 14. BALANÇO E ITERAÇÃO

### ⚖️ Balanço Philosophy

- **Patch schedule:** Mensal (primeiro terça-feira)
- **Hotfix:** Urgente < 24h (crashes, exploits)
- **Win rate target:** 48-52% por classe vs todos outros
- **TTK (Time to Kill):** 30-120 segundos vs mob normal (skill dependent)

### 📊 Data-Driven Decisions

Toda patch baseada em:
1. Win rates (PvP) e clear times (PvE)
2. Player feedback (community polls)
3. Economy health (inflation, item demand)
4. Engagement metrics (DAU, session length, retention)

### 📈 Balance Targets (Classes)

| Class | Win Rate (PvP) | Clear Time (Dungeon) | Popularity |
|-------|----------------|----------------------|------------|
| Guerreiro | 50% | 20 min avg | 15% |
| Mago | 50% | 25 min avg | 12% |
| Arqueiro | 50% | 18 min avg | 14% |
| Sacerdote | 50% | 30 min avg (heal) | 10% |
| Druida | 50% | 22 min avg | 13% |
| Ladino | 50% | 19 min avg | 16% |
| Bruxo | 50% | 23 min avg | 12% |
| Lutador | 50% | 21 min avg | 18% |

**Se algum desviar de 48-52%, trigger patch hotfix.**

---

## 15. MONETIZAÇÃO E COSMETICS

### 🛒 Cosmetic Shop

- **Premium currency:** Rune Stones (100 = $1 USD)
- **Monthly cosmetics:** 5 novos skins/emotes/mounts
- **No P2W:** Apenas estético, zero vantagem
- **Bundle deals:** 20% discount em bundles (3+ items)

### 💄 Cosmetic Categories

| Category | Price | Examples |
|----------|-------|----------|
| Helmet skin | 500 rs | Crown, Demon horns |
| Armor transmog | 800 rs | Pirate, Noble, Demon |
| Mount skin | 1200 rs | Dragon, Phoenix |
| Emote | 200 rs | Sit, Dance, Laugh |
| Title | 300 rs | "Legendary", "OG Player" |
| Weapon skin | 600 rs | Flaming sword, Ice staff |

### 🆓 Free Cosmetics (Earned)

- Todas as achievements geram cosmetics grátis
- Battle pass free track: 50 cosmetics/season
- Events: seasonal cosmetics free para top 100 participants

---

## 🎯 CONCLUSÃO E ROADMAP

### ✅ Este documento complementa o GDD base com:

- ✅ Sistemas competitivos (PvP, Guilds)
- ✅ Economia sustentável (gold, inflation control)
- ✅ Conteúdo endgame (raids, world events)
- ✅ Progressão saudável (quests, battle pass)
- ✅ Retenção a longo prazo (achievements, seasonal)
- ✅ Fair play (anti-cheat, balance)
- ✅ Performance adequada (optimization targets)

### 🗓️ Next Phase Development

| Fase | Sprint | Foco | Timeline |
|------|--------|------|----------|
| 1 | 1-2 | Core loop (login → character → gameplay) | 2 semanas |
| 2 | 3-4 | PvE (quests, dungeons) | 2 semanas |
| 3 | 5-6 | PvP & Guilds | 2 semanas |
| 4 | 7-8 | Economy & Trading | 2 semanas |
| 5 | 9-10 | Endgame & Events | 2 semanas |
| 6 | 11+ | Polish & Optimization | 2+ semanas |

**Estimativa:** 3-6 meses até MVP multiplayer completo.

---

**🎮 GAME DESIGN DOCUMENT COMPLEMENTO**  
**Projeto:** Eldoria MMORPG  
**Versão:** 1.1  
**Status:** Complemento ao GDD Base - Sistemas Avançados Documentados

*Documento criado para expandir o Eldoria MMORPG com sistemas críticos de retenção, economia, competição e conteúdo progressivo.*
