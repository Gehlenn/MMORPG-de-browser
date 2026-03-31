# MVP-FLOW.md
# Fluxo do Jogador - Eldoria MMORPG MVP
# Data: Março 2026

## 📋 Visão Geral

Este documento define o fluxo completo de um jogador no MVP do Eldoria MMORPG, desde o login até a jogabilidade no mundo.

---

## 🎯 Fluxo de um Novo Jogador

```
[Login] → [Criar Conta] → [Criar Personagem] → [Entrar no Mundo] → [Jogar]
```

### 1. Login (1ª vez - Novo Jogador)

**Entrada:**
- Username único (3-20 caracteres)
- Password (mínimo 6 caracteres)

**Processo:**
1. Cliente envia `auth:login` com credenciais
2. Servidor verifica se conta existe
3. Se não existe → Criar nova conta automaticamente
4. Se existe → Validar password
5. Retornar `auth:login-success` ou `auth:login-failed`

**Saída:**
- Session token (socket.id)
- Lista de personagens (vazia para novo jogador)

---

### 2. Criar Personagem

**Entrada:**
- Nome do personagem (único)
- Classe: warrior | mage | archer | rogue
- Cor do personagem (hex)

**Dados Iniciais (Server-Side):**
```javascript
{
  id: socket.id,
  name: playerName,
  class: selectedClass,
  
  // Posição inicial aleatória no mapa de teste
  x: 100 + Math.random() * 824,  // 1024 - margem
  y: 100 + Math.random() * 824,
  worldId: "testing_zone",
  
  // Stats base por classe
  level: 1,
  xp: 0,
  hp: 100,
  maxHp: 100,
  mana: 50,
  maxMana: 50,
  
  // Atributos
  attack: 10 + (classe === 'warrior' ? 5 : 0),
  defense: 5 + (classe === 'warrior' ? 3 : 0),
  speed: 1,
  
  // Inventário vazio
  inventory: [],
  
  // Equipamento vazio (3 slots)
  equipment: {
    weapon: null,
    armor: null,
    accessory: null
  },
  
  createdAt: Date.now()
}
```

**Processo:**
1. Cliente envia `character:create`
2. Servidor valida nome único
3. Aplica stats base da classe
4. Define posição inicial aleatória no mapa
5. Salva em `data/players/{playerId}.json`
6. Retorna `character:created`

---

### 3. Entrar no Mundo

**Entrada:**
- Personagem selecionado

**Regras de Entrada:**
```javascript
// Se jogador já tem worldId salvo → usa o mesmo
// Se não tiver → coloca em "testing_zone"

worldId = player.savedWorldId || "testing_zone";

// Posição de spawn
if (player.savedPosition) {
  x = player.savedPosition.x;
  y = player.savedPosition.y;
} else {
  // Spawn aleatório dentro do mapa 1024x1024
  x = 100 + Math.random() * 824;
  y = 100 + Math.random() * 824;
}

// Evitar spawn em cima de outros players/mobs
// Verificar colisão com entities próximas
// Se colidir, tentar nova posição (até 5 tentativas)
```

**Processo:**
1. Cliente envia `world:init-request` com playerId
2. Servidor carrega dados salvos do JSON
3. Monta `world:init` com:
   - Dados do jogador (stats, inventário, equipamento)
   - Lista de mobs ativos no mapa
   - Lista de outros jogadores no mesmo mapa
   - Loot drops no chão
   - NPCs do mapa

**Estrutura do `world:init`:**
```javascript
{
  player: {
    id, name, class, level, x, y,
    hp, maxHp, mana, maxMana,
    attack, defense, speed,
    inventory, equipment,
    xp, xpToNext
  },
  
  entities: [
    // Mobs
    { id, type: 'mob', name, x, y, hp, maxHp, level },
    // Outros jogadores
    { id, type: 'player', name, x, y, level }
  ],
  
  lootDrops: [
    { id, itemId, name, quantity, x, y }
  ],
  
  npcs: [
    { id, name, x, y, type: 'quest_giver' }
  ],
  
  worldInfo: {
    id: "testing_zone",
    width: 1024,
    height: 1024,
    mobCount: 15
  }
}
```

---

### 4. Jogar (Loop Principal)

#### 4.1 Movimento

**Cliente → Servidor:**
```javascript
// A cada ~60ms (ou quando muda)
socket.emit('player:move', {
  x: player.x,
  y: player.y,
  facing: 'up' | 'down' | 'left' | 'right'
});
```

**Servidor → Todos:**
```javascript
// Broadcast para outros jogadores próximos
socket.broadcast.emit('player:moved', {
  id: socket.id,
  x: newX,
  y: newY,
  facing: direction
});
```

**Validação Server-Side:**
- Nova posição dentro dos limites do mapa (0-1024)
- Velocidade máxima: 200px/segundo (anti-cheat)
- Se ultrapassar → reverter para última posição válida

#### 4.2 Combate

**Atacar Mob:**
```javascript
// Cliente detecta hit (espaço pressionado + mob próximo)
socket.emit('combat:attack', {
  targetId: mob.id,
  targetType: 'mob'
});

// Servidor calcula
const damage = calcularDano(player, target);
target.hp -= damage;

// Se morreu
if (target.hp <= 0) {
  // Calcular XP
  const xpGained = target.xpReward; // ex: 20
  player.xp += xpGained;
  
  // Criar loot
  const drop = {
    itemId: Math.random() > 0.5 ? 'gold_coin' : 'slime_goo',
    quantity: 1 + Math.floor(Math.random() * 3)
  };
  
  // Notificar todos
  io.emit('mob:died', { mobId, killerId, xpGained });
  
  // Dar XP ao jogador
  socket.emit('player:xp-gain', { gained: xpGained, newXp: player.xp });
  
  // Verificar level up
  if (player.xp >= xpToNext) {
    player.level++;
    player.maxHp += 10;
    player.hp = player.maxHp;
    player.attack += 2;
    socket.emit('player:level-up', { newLevel, newMaxHp, newAttack });
  }
}
```

#### 4.3 Coletar Loot

**Detecção Automática:**
```javascript
// Cliente verifica distância a cada frame
for (drop of visibleDrops) {
  const dist = distance(player, drop);
  if (dist < 40) {
    // Auto-collect
    socket.emit('loot:collect', { dropId: drop.id });
  }
}
```

**Servidor:**
```javascript
// Verificar se drop existe e está perto
if (lootDrops.has(dropId)) {
  const drop = lootDrops.get(dropId);
  const dist = distance(player, drop);
  
  if (dist < 50) {
    // Adicionar ao inventário
    player.inventory.push({
      id: drop.itemId,
      name: drop.itemName,
      quantity: drop.quantity
    });
    
    // Remover do mundo
    lootDrops.delete(dropId);
    
    // Confirmar
    socket.emit('loot:collected', { 
      success: true, 
      item: drop,
      inventory: player.inventory 
    });
    
    // Notificar outros que sumiu
    socket.broadcast.emit('loot:removed', { dropId });
  }
}
```

#### 4.4 Equipar Item

**Interação:**
```javascript
// Jogador clica em item no inventário + botão "Equipar"
socket.emit('equipment:equip', { itemId: 'rusty_sword' });
```

**Servidor:**
```javascript
// Encontrar item no inventário
const item = player.inventory.find(i => i.id === itemId);

// Verificar se é equipável
if (item && item.slot) { // 'weapon', 'armor', 'accessory'
  // Se já tem item equipado no slot, desequipar
  if (player.equipment[item.slot]) {
    player.inventory.push(player.equipment[item.slot]);
  }
  
  // Equipar novo
  player.equipment[item.slot] = item;
  
  // Remover do inventário
  player.inventory = player.inventory.filter(i => i.id !== itemId);
  
  // Recalcular stats
  recalcularStats(player);
  
  // Enviar atualizações
  socket.emit('equipment:sync', { equipment: player.equipment });
  socket.emit('player:stats-sync', { 
    attack: player.attack,
    defense: player.defense,
    maxHp: player.maxHp 
  });
}
```

#### 4.5 Visualizar Outros Jogadores

**Renderização:**
```javascript
// GameplayEngine.render()
for (remotePlayer of remotePlayers.values()) {
  // Só renderizar se dentro da tela
  if (isOnScreen(remotePlayer, camera)) {
    drawPlayer(ctx, remotePlayer.x - camera.x, remotePlayer.y - camera.y);
    
    // Nome acima
    drawText(remotePlayer.name, remotePlayer.x - camera.x, remotePlayer.y - camera.y - 10);
    
    // Level
    drawText(`Lv.${remotePlayer.level}`, remotePlayer.x - camera.x, remotePlayer.y - camera.y - 20, '#FFD54F');
  }
}
```

---

## 💾 Salvamento de Progresso

### Quando Salvar:
1. **A cada 30 segundos** (auto-save)
2. **Ao desconectar** (disconnect)
3. **Após level up**
4. **Após equipar/desequipar item**
5. **Após completar quest**

### O que Salvar:
```javascript
{
  accountId: player.id,
  name: player.name,
  class: player.class,
  level: player.level,
  xp: player.xp,
  
  // Stats
  maxHp: player.maxHp,
  maxMana: player.maxMana,
  attack: player.attack,
  defense: player.defense,
  speed: player.speed,
  
  // Inventário e equipamento
  inventory: player.inventory,
  equipment: player.equipment,
  
  // Posição
  x: player.x,
  y: player.y,
  worldId: player.worldId,
  
  // Timestamp
  lastSaved: Date.now()
}
```

### Onde Salvar:
```
server/data/players/{playerId}.json
```

---

## 🔄 Sincronização de Estado

### Server → Client (Eventos)

| Evento | Quando | Dados |
|--------|--------|-------|
| `world:init` | Entrada no mundo | Player, entities, loot, npcs |
| `player:moved` | Qualquer movimento | id, x, y, facing |
| `mob:spawn` | Mob nasce | id, type, x, y, hp |
| `mob:died` | Mob morre | id, killerId, xpGained |
| `loot:created` | Drop gerado | id, item, x, y |
| `loot:removed` | Coletado | dropId |
| `player:xp-gain` | Ganho XP | gained, newXp, newTotalXp |
| `player:level-up` | Level up | newLevel, newStats |
| `equipment:sync` | Equipar/desequipar | equipment |
| `player:stats-sync` | Stats mudam | attack, defense, maxHp, etc |
| `inventory:sync` | Inventário muda | items[] |

### Client → Server (Ações)

| Evento | Quando | Dados |
|--------|--------|-------|
| `auth:login` | Login | username, password |
| `character:create` | Criar char | name, class |
| `world:init-request` | Entrar mundo | playerId |
| `player:move` | Movimento | x, y, facing |
| `combat:attack` | Atacar | targetId, targetType |
| `loot:collect` | Coletar | dropId |
| `equipment:equip` | Equipar | itemId |
| `equipment:unequip` | Desequipar | slot |

---

## 📊 Mapa de Teste Minimal

### Configuração:
```javascript
{
  id: "testing_zone",
  width: 1024,
  height: 1024,
  
  mobs: [
    { type: 'slime', count: 15, xpReward: 20, hp: 50 },
    { type: 'goblin', count: 5, xpReward: 35, hp: 80 }
  ],
  
  spawnRules: {
    minDistanceFromPlayer: 100,
    respawnDelay: 5000 // 5 segundos
  }
}
```

### Slime (Mob Básico):
```javascript
{
  id: `mob_${id}`,
  type: 'slime',
  name: 'Slime',
  
  // Stats
  level: 1,
  hp: 50,
  maxHp: 50,
  attack: 5,
  defense: 2,
  
  // Rewards
  xpReward: 20,
  
  // Drops
  possibleDrops: [
    { itemId: 'gold_coin', chance: 0.8, quantity: [1, 3] },
    { itemId: 'slime_goo', chance: 0.5, quantity: [1, 2] }
  ],
  
  // AI
  aggroRange: 100,
  moveSpeed: 40 // pixels/segundo
}
```

---

## ✅ Validações Anti-Cheat (Server-Side)

### Movimento:
```javascript
const MAX_SPEED = 250; // px/segundo
const timeDelta = now - lastMoveTime;
const distance = calcDistance(lastPos, newPos);
const speed = distance / timeDelta;

if (speed > MAX_SPEED) {
  // Rejeitar movimento, reverter para posição anterior
  player.x = lastPos.x;
  player.y = lastPos.y;
  socket.emit('player:teleport', { x: lastPos.x, y: lastPos.y });
}
```

### Combate:
```javascript
// Verificar cooldown
const now = Date.now();
if (now - player.lastAttack < 500) { // 500ms cooldown
  return; // Ignorar ataque
}
player.lastAttack = now;

// Verificar distância ao alvo
const dist = distance(player, target);
const MAX_ATTACK_RANGE = 60;
if (dist > MAX_ATTACK_RANGE) {
  return; // Muito longe
}
```

### XP:
```javascript
// XP ganho sempre servidor-autoritativo
// Cliente nunca envia "ganhei X XP"
// Servidor calcula e envia confirmação
```

---

## 🧪 Teste com 2+ Jogadores

### Roteiro de Teste:

1. **Abrir 2 abas do navegador**
   - Aba A: http://localhost:3000
   - Aba B: http://localhost:3000

2. **Criar 2 contas**
   - Conta A: "player1" / "senha123"
   - Conta B: "player2" / "senha123"

3. **Criar 2 personagens**
   - Char A: "Hero1", classe Warrior
   - Char B: "Hero2", classe Mage

4. **Verificar entrada no mundo:**
   - [ ] Ambos aparecem no mesmo mapa
   - [ ] Posições iniciais diferentes (não sobrepostas)
   - [ ] Cada um vê o outro no canvas

5. **Testar movimento:**
   - [ ] Mover Char A → Char B vê movimento em tempo real
   - [ ] Mover Char B → Char A vê movimento em tempo real

6. **Testar combate:**
   - [ ] Char A mata um Slime
   - [ ] Char A recebe XP
   - [ ] Loot aparece no chão
   - [ ] Char B vê o Slime sumir
   - [ ] Char B NÃO recebe XP (não participou)

7. **Testar loot compartilhado:**
   - [ ] Ambos jogadores perto do Slime (< 200px)
   - [ ] Char A mata o Slime
   - [ ] Ambos recebem XP (shared)
   - [ ] Ambos recebem loot individual

8. **Testar persistência:**
   - [ ] Char A ganha level, equipa item
   - [ ] Char A faz logout (F5)
   - [ ] Char A loga novamente
   - [ ] Level, XP, equipamento persistiram

---

## 🚫 Fora do Escopo MVP

NÃO incluir nesta fase:
- Múltiplos mapas/zonas
- Guildas
- Party system
- Chat privado
- Trade entre players
- Crafting complexo
- Bosses
- Dungeons
- PvP
- Sistema de amizades
- Loja/mercado

---

## 📁 Arquivos Relacionados

| Arquivo | Descrição |
|---------|-----------|
| `server/server.js` | Servidor principal, handlers |
| `server/PlayerDataManager.js` | Persistência JSON |
| `client/managers/MobManager.js` | Gerenciamento de mobs |
| `client/managers/LootManager.js` | Gerenciamento de loot |
| `client/managers/EquipmentManager.js` | Equipamento |
| `client/HUDManager.js` | Interface do usuário |
| `client/modes/offline/GameplayEngine.js` | Engine principal |

---

*Documento v1.0 - MVP Eldoria MMORPG*
