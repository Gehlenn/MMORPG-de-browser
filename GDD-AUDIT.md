# 🎮 GDD - Eldoria MMORPG (v0.3.5.1a)

## 🌍 Visão do Mundo

### Lore
Eldoria é um mundo fantástico pós-apocalíptico onde civilizações antigas colidiram com magia arcana. Jogadores emergem como "Despertos" com habilidades latentes e devem reconstruir a sociedade enquanto enfrentam criaturas distorcidas pela energia residual.

### Geografia
- **Continente Principal**: Eldoria Central (5 regiões)
- **Cidades Principais**: Nova Arcadia (capital), Fortaleza do Amanhecer, Vale dos Esquecidos
- **Dungeons**: 10 instâncias variando de level 1-50
- **Zonas PvP**: Arenas controladas por guildas

## 👥 Sistema de Personagens

### Raças (6 disponíveis)
1. **Humano** - Versáteis, +10% EXP bonus
2. **Elfo** - Ágeis, +15% dodge chance
3. **Anão** - Resistentes, +20% physical defense
4. **Orc** - Fortes, +15% melee damage
5. **Morto-Vivo** - Misteriosos, +10% dark magic resistance
6. **Fada** - Mágicas, +15% mana regeneration

### Classes (Progressão)
#### Inicial: Aprendiz (Level 1-10)
- Skills básicas de todas as classes
- Flexibilidade de especialização futura
- HP: 100, MP: 50

#### Avançadas (Level 10+)
1. **Guerreiro** - Tank/DPS
   - Skills: Taunt, Shield Bash, Whirlwind
   - Stats: STR+3, CON+2
   
2. **Mago** - DPS/Support
   - Skills: Fireball, Frost Armor, Teleport
   - Stats: INT+3, WIS+2
   
3. **Arqueiro** - Ranged DPS
   - Skills: Precise Shot, Volley, Hunter's Mark
   - Stats: DEX+3, AGI+2
   
4. **Ladino** - Stealth/Utility
   - Skills: Backstab, Lockpick, Invisibility
   - Stats: DEX+2, AGI+3

### Sistema de Atributos
- **FOR (Força)**: Melee damage, carry capacity
- **AGI (Agilidade)**: Attack speed, dodge chance
- **INT (Inteligência)**: Magic damage, mana pool
- **CON (Constituição)**: HP, physical resistance
- **SAB (Sabedoria)**: Magic resistance, mana regen
- **CAR (Carisma)**: NPC prices, quest rewards

## ⚔️ Sistema de Combate

### Mecânicas Básicas
- **Real-time action combat**
- **Auto-attack com weapon speed**
- **Skill cooldowns globais e individuais**
- **Positioning system (front/back/side attacks)**
- **Critical hit system (2x damage)**

### Elementos
- **Fogo** > Planta > Água > Fogo
- **Luz** > Sombra > Espírito > Luz
- **Terra** > Elétrico > Metal > Terra
- **Neutro**: Sem vantagens/desvantagens

### Status Effects
- **Positivos**: Buff, Heal, Shield, Haste
- **Negativos**: Poison, Curse, Slow, Stun
- **Duração**: Baseada em ticks (1 tick = 0.5s)
- **Stacking**: Máximo 3 stacks do mesmo tipo

## 💰 Sistema Econômico

### Moedas
- **Gold (GOL)**: Moeda principal (1 GOL = 100 SIL)
- **Silver (SIL)**: Moeda intermediária (1 SIL = 100 COP)
- **Copper (COP)**: Moeda básica
- **Premium Gems**: Moeda real (R$ 1 = 100 gems)

### Fluxos Econômicos
1. **Mobs Drops**: 60% da economia
2. **Quest Rewards**: 25% da economia
3. **Craft/Trade**: 10% da economia
4. **Services**: 5% da economia

### Sinks Econômicos
- **Repair costs**: 20% do item value
- **Skill training**: Baseado em level
- **Guild maintenance**: 1000 GOL/semana
- **Market taxes**: 5% em transações

### Validação de Transações
```javascript
// Arquitetura de validação
class TransactionValidator {
  validate(transaction) {
    // 1. Verificar saldo do jogador
    if (!this.hasBalance(transaction.from, transaction.amount)) {
      throw new InsufficientFundsError();
    }
    
    // 2. Verificar integridade dos dados
    if (!this.isValidAmount(transaction.amount)) {
      throw new InvalidAmountError();
    }
    
    // 3. Prevenir double-spend
    if (this.isSpent(transaction.id)) {
      throw new DoubleSpendError();
    }
    
    // 4. Validar assinatura digital
    if (!this.verifySignature(transaction)) {
      throw new InvalidSignatureError();
    }
    
    return true;
  }
}
```

## 🏪 Sistema de Inventário

### Estrutura
- **Slots principais**: 20 (equipamento)
- **Slots de inventário**: 40 (itens)
- **Slots de bag**: 100 (expansível com gems)
- **Bank slots**: 200 (seguro, acessível em cidades)

### Categorias de Itens
1. **Weapons**: Sword, Bow, Staff, Dagger
2. **Armor**: Helmet, Chest, Gloves, Boots
3. **Accessories**: Ring, Amulet, Belt, Cloak
4. **Consumables**: Potions, Food, Scrolls
5. **Materials**: Ore, Herbs, Wood, Leather
6. **Quest Items**: Chaves, Artefatos, Runas

### Qualidade de Itens
- **Normal (Grey)**: Stats base
- **Magic (Green)**: +10% stats
- **Rare (Blue)**: +25% stats + 1 skill
- **Epic (Purple)**: +50% stats + 2 skills
- **Legendary (Orange)**: +100% stats + 3 skills + unique effect

## 📜 Sistema de Missões

### Tipos de Missões
1. **Main Story**: Linear, level-gated
2. **Side Quests**: Opcionais, rewards variados
3. **Daily Quests**: Reset 00:00 UTC
4. **Weekly Quests**: Eventos especiais
5. **Guild Quests**: Requerem guild membership

### Estrutura de Missão
```javascript
const QuestTemplate = {
  id: "quest_001",
  name: "O Ataque dos Goblins",
  level: 5,
  type: "kill",
  objectives: [
    { type: "kill", target: "goblin", amount: 10 },
    { type: "collect", item: "goblin_ear", amount: 5 }
  ],
  rewards: {
    exp: 500,
    gold: 100,
    items: ["health_potion_small"],
    reputation: { faction: "human_guard", amount: 50 }
  },
  prerequisites: ["quest_000"],
  timeLimit: 3600 // 1 hora
};
```

## 🏰 Sistema de Guildas

### Estrutura Hierárquica
1. **Guild Master** (1): Controle total
2. **Officers** (5): Gerenciamento diário
3. **Veterans** (20): Liderança tática
4. **Members** (Ilimitado): Membros base

### Permissões por Rank
- **Guild Master**: Todas as permissões
- **Officers**: Recruit, kick, promote, bank access
- **Veterans**: Raid leadership, chat moderation
- **Members**: Basic guild features

### Guild Features
- **Guild Hall**: Instância privada personalizada
- **Guild Bank**: Compartilhamento de recursos
- **Guild Wars**: Sistema de conquista territorial
- **Guild Shop**: Itens exclusivos com guild points
- **Guild Chat**: Canal privado de comunicação

## 🎨 Sistema de Customização

### Aparência do Personagem
- **Face**: 10 opções + sliders
- **Hair**: 20 estilos + 30 cores
- **Skin**: 15 tons + 20 patterns
- **Eyes**: 12 formatos + 25 cores
- **Body Type**: 3 opções (slim, normal, muscular)

### Equipamento Visual
- **Dye system**: 50 cores para itens
- **Transmog**: Manter aparência com stats diferentes
- **Cosmetics**: Itens puramente visuais
- **Mounts**: 30 opções + customização
- **Pets**: 50 tipos + habilidades especiais

## 🔊 Sistema de Chat

### Canais
1. **General**: Chat global (level 1+)
2. **Trade**: Compra/venda (level 5+)
3. **LFG**: Looking for group (level 10+)
4. **Guild**: Privado da guilda
5. **Party**: Grupo temporário (5 jogadores)
6. **Whisper**: Privado 1-a-1
7. **System**: Mensagens do servidor

### Moderação
- **Auto-moderation**: Palavras bloqueadas
- **Report system**: Denúncias de jogadores
- **GM commands**: Comandos de administrador
- **Chat logs**: Auditoria de 30 dias

## 🎯 Sistema de Progressão

### Experience Curve
```javascript
const expTable = {
  1: 0,      10: 1000,    20: 5000,    30: 15000,
  2: 100,    11: 1200,    21: 5800,    31: 17500,
  3: 200,    12: 1450,    22: 6700,    32: 20500,
  // ... curva exponencial até level 100
};
```

### Mastery System
- **Weapon Mastery**: +1% damage por 100 usos
- **Magic Mastery**: +1% effectiveness por 50 casts
- **Craft Mastery**: +1% quality chance por 20 crafts
- **Social Mastery**: +1% NPC prices por 50 trades

## 🎪 Eventos Dinâmicos

### World Events
- **Boss Invasions**: 2x por semana
- **Double EXP Weekends**: Finais de mês
- **Holiday Events**: Temáticos especiais
- **PvP Tournaments**: Semanais com prêmios
- **Treasure Hunts**: Diários com mapas aleatórios

### Dynamic Content
- **Weather System**: Afeta gameplay (chuva = +10% water damage)
- **Day/Night Cycle**: Mobs diferentes à noite
- **Economy Fluctuations**: Preços baseados em oferta/demanda
- **NPC Schedules**: Rotinas diárias dos NPCs

## 🔐 Sistema de Segurança

### Anti-Cheat Measures
- **Server-side validation**: Todas as ações
- **Behavior analysis**: Detecção de bots
- **Speed hacks**: Limites de movimento
- **Item duplication**: Verificação de IDs únicos
- **Exploit detection**: Pattern matching

### Data Protection
- **Encryption**: TLS 1.3 em todas as conexões
- **Hashing**: bcrypt para senhas
- **Session management**: JWT com refresh tokens
- **Audit trails**: Log de todas as transações
- **GDPR compliance**: Direito ao esquecimento

---

**Versão do GDD**: v0.3.5.1a
**Status**: Em desenvolvimento ativo
**Próxima atualização**: pós-v0.4.0 release
**Responsável**: Game Director & Lead Designer
