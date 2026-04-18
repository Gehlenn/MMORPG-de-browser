/**
 * PlayerManager.js
 * Gerencia o jogador local e jogadores remotos (MVP - Passo 2)
 * Responsabilidade: Sincronização de player stats, XP, remotePlayers
 */

class PlayerManager {
  constructor(gameplayEngine) {
    this.engine = gameplayEngine;
    
    // Jogador local
    this.player = {
      id: null,
      name: 'Unknown',
      class: 'warrior',
      level: 1,
      xp: 0,
      xpToNext: 100,
      
      // Posição
      x: 400,
      y: 300,
      
      // Stats
      hp: 100,
      maxHp: 100,
      mana: 50,
      maxMana: 50,
      attack: 10,
      defense: 5,
      speed: 1,
      
      // Inventário e equipamento
      inventory: [],
      equipment: {
        weapon: null,
        armor: null,
        accessory: null
      },
      
      // Movimento
      isMoving: false,
      facing: 'down',
      lastMoveTime: 0
    };
    
    // Jogadores remotos (Map para lookup rápido)
    this.remotePlayers = new Map();
    
    // Callbacks
    this.onStatsChanged = null;
    this.onXpGained = null;
    this.onLevelUp = null;
  }

  /**
   * Inicializa jogador com dados do servidor
   */
  initPlayer(serverData) {
    if (!serverData) return;
    
    this.player.id = serverData.id || this.player.id;
    this.player.name = serverData.name || this.player.name;
    this.player.class = serverData.class || this.player.class;
    this.player.level = serverData.level || 1;
    this.player.xp = serverData.xp || 0;
    this.player.xpToNext = serverData.xpToNext || this.calculateXpToNext(1);
    
    this.player.x = serverData.x || 400;
    this.player.y = serverData.y || 300;
    
    this.player.hp = serverData.hp || 100;
    this.player.maxHp = serverData.maxHp || 100;
    this.player.mana = serverData.mana || 50;
    this.player.maxMana = serverData.maxMana || 50;
    
    this.player.attack = serverData.attack || 10;
    this.player.defense = serverData.defense || 5;
    this.player.speed = serverData.speed || 1;
    
    this.player.inventory = serverData.inventory || [];
    this.player.equipment = serverData.equipment || {
      weapon: null,
      armor: null,
      accessory: null
    };
    
    console.log('✅ PlayerManager: Jogador inicializado', this.player.name, 'Lv.' + this.player.level);
  }

  /**
   * Calcula XP necessário para próximo level
   */
  calculateXpToNext(level) {
    return 50 * level * level;
  }

  /**
   * Atualiza stats do jogador
   */
  updateStats(stats) {
    if (!stats) return;
    
    const oldStats = { ...this.player };
    
    if (stats.maxHp !== undefined) this.player.maxHp = stats.maxHp;
    if (stats.attack !== undefined) this.player.attack = stats.attack;
    if (stats.defense !== undefined) this.player.defense = stats.defense;
    if (stats.speed !== undefined) this.player.speed = stats.speed;
    
    // Notificar mudança
    if (this.onStatsChanged && JSON.stringify(oldStats) !== JSON.stringify(this.player)) {
      this.onStatsChanged(this.player);
    }
  }

  /**
   * Adiciona XP ao jogador
   */
  addXp(amount, isShared = false, sharedWith = 1) {
    if (!amount || amount <= 0) return null;
    
    const oldLevel = this.player.level;
    this.player.xp += amount;
    
    let leveledUp = false;
    
    // Verificar level up
    while (this.player.xp >= this.player.xpToNext) {
      this.player.xp -= this.player.xpToNext;
      this.player.level++;
      this.player.xpToNext = this.calculateXpToNext(this.player.level);
      
      // Buff stats no level up
      this.player.maxHp += 10;
      this.player.hp = this.player.maxHp; // Full heal
      this.player.attack += 2;
      
      leveledUp = true;
    }
    
    const result = {
      gained: amount,
      newXp: this.player.xp,
      xpToNext: this.player.xpToNext,
      newLevel: this.player.level,
      leveledUp,
      isShared,
      sharedWith
    };
    
    // Notificar
    if (this.onXpGained) {
      this.onXpGained(result);
    }
    
    if (leveledUp && this.onLevelUp) {
      this.onLevelUp({
        newLevel: this.player.level,
        newMaxHp: this.player.maxHp,
        newHp: this.player.hp,
        newAttack: this.player.attack
      });
    }
    
    return result;
  }

  /**
   * Atualiza posição do jogador
   */
  updatePosition(x, y, facing) {
    this.player.x = x;
    this.player.y = y;
    if (facing) this.player.facing = facing;
    this.player.lastMoveTime = Date.now();
  }

  /**
   * Retorna dados do jogador para sincronização
   */
  getPlayerData() {
    return {
      id: this.player.id,
      name: this.player.name,
      class: this.player.class,
      level: this.player.level,
      x: this.player.x,
      y: this.player.y,
      hp: this.player.hp,
      maxHp: this.player.maxHp,
      facing: this.player.facing
    };
  }

  // ========== REMOTE PLAYERS ==========

  /**
   * Adiciona ou atualiza jogador remoto
   */
  updateRemotePlayer(data) {
    if (!data || !data.id) return;
    
    // Ignorar jogador local
    if (data.id === this.player.id) return;
    
    const existing = this.remotePlayers.get(data.id);
    
    if (existing) {
      // Atualizar existente
      existing.x = data.x ?? existing.x;
      existing.y = data.y ?? existing.y;
      existing.level = data.level ?? existing.level;
      existing.hp = data.hp ?? existing.hp;
      existing.maxHp = data.maxHp ?? existing.maxHp;
      existing.facing = data.facing ?? existing.facing;
      existing.lastUpdate = Date.now();
    } else {
      // Criar novo
      this.remotePlayers.set(data.id, {
        id: data.id,
        name: data.name || `Player ${data.id.substr(0, 4)}`,
        level: data.level || 1,
        x: data.x || 0,
        y: data.y || 0,
        hp: data.hp || 100,
        maxHp: data.maxHp || 100,
        facing: data.facing || 'down',
        color: data.color || this.generatePlayerColor(data.id),
        lastUpdate: Date.now()
      });
      
      console.log('👤 PlayerManager: Jogador remoto adicionado', data.id);
    }
  }

  /**
   * Remove jogador remoto
   */
  removeRemotePlayer(playerId) {
    if (this.remotePlayers.has(playerId)) {
      this.remotePlayers.delete(playerId);
      console.log('👤 PlayerManager: Jogador remoto removido', playerId);
    }
  }

  /**
   * Retorna lista de jogadores remotos
   */
  getRemotePlayers() {
    return Array.from(this.remotePlayers.values());
  }

  /**
   * Limpa jogadores remotos inativos (não atualizados há 10s)
   */
  cleanupRemotePlayers(maxAge = 10000) {
    const now = Date.now();
    let removed = 0;
    
    for (const [id, player] of this.remotePlayers) {
      if (now - player.lastUpdate > maxAge) {
        this.remotePlayers.delete(id);
        removed++;
      }
    }
    
    if (removed > 0) {
      console.log('👤 PlayerManager:', removed, 'jogadores remotos removidos (inativos)');
    }
  }

  /**
   * Gera cor consistente para jogador baseada no ID
   */
  generatePlayerColor(id) {
    const colors = [
      '#2196F3', // Blue
      '#4CAF50', // Green
      '#FFC107', // Amber
      '#9C27B0', // Purple
      '#FF5722', // Deep Orange
      '#00BCD4', // Cyan
      '#E91E63', // Pink
      '#795548'  // Brown
    ];
    
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = ((hash << 5) - hash) + id.charCodeAt(i);
      hash = hash & hash;
    }
    
    return colors[Math.abs(hash) % colors.length];
  }

  // ========== EQUIPAMENTO ==========

  /**
   * Equipar item
   */
  equipItem(item) {
    if (!item || !item.slot) return false;
    
    const slot = item.slot;
    
    // Se já tem item equipado, retornar ao inventário
    if (this.player.equipment[slot]) {
      this.player.inventory.push(this.player.equipment[slot]);
    }
    
    // Equipar novo
    this.player.equipment[slot] = item;
    
    // Remover do inventário
    this.player.inventory = this.player.inventory.filter(i => i.id !== item.id);
    
    // Recalcular stats
    this.recalculateStats();
    
    return true;
  }

  /**
   * Desequipar item
   */
  unequipItem(slot) {
    if (!this.player.equipment[slot]) return false;
    
    // Retornar ao inventário
    this.player.inventory.push(this.player.equipment[slot]);
    
    // Limpar slot
    this.player.equipment[slot] = null;
    
    // Recalcular stats
    this.recalculateStats();
    
    return true;
  }

  /**
   * Recalcula stats baseado no equipamento
   */
  recalculateStats() {
    // Stats base por classe
    const baseStats = this.getBaseStatsForClass(this.player.class);
    
    // Aplicar bônus de equipamento
    let bonusHp = 0;
    let bonusAttack = 0;
    let bonusDefense = 0;
    
    for (const slot of ['weapon', 'armor', 'accessory']) {
      const item = this.player.equipment[slot];
      if (item && item.bonuses) {
        bonusHp += item.bonuses.maxHp || 0;
        bonusAttack += item.bonuses.attack || 0;
        bonusDefense += item.bonuses.defense || 0;
      }
    }
    
    // Aplicar bônus de level
    const levelBonus = (this.player.level - 1) * 2;
    
    this.player.maxHp = baseStats.maxHp + bonusHp + (this.player.level * 10);
    this.player.attack = baseStats.attack + bonusAttack + levelBonus;
    this.player.defense = baseStats.defense + bonusDefense + (this.player.level);
    
    // Atualizar HP atual proporcionalmente
    const hpPercent = this.player.hp / this.player.maxHp;
    this.player.hp = Math.floor(this.player.maxHp * hpPercent);
  }

  /**
   * Retorna stats base por classe
   */
  getBaseStatsForClass(className) {
    const stats = {
      warrior: { maxHp: 120, attack: 12, defense: 8, speed: 1 },
      mage: { maxHp: 80, attack: 15, defense: 3, speed: 1 },
      archer: { maxHp: 90, attack: 13, defense: 4, speed: 1.2 },
      rogue: { maxHp: 85, attack: 14, defense: 3, speed: 1.3 }
    };
    
    return stats[className] || stats.warrior;
  }

  /**
   * Adiciona item ao inventário
   */
  addToInventory(item) {
    if (!item) return false;
    
    // Verificar se já existe
    const existing = this.player.inventory.find(i => i.id === item.id);
    if (existing && item.stackable) {
      existing.quantity += item.quantity || 1;
    } else {
      this.player.inventory.push(item);
    }
    
    return true;
  }

  /**
   * Remove item do inventário
   */
  removeFromInventory(itemId, quantity = 1) {
    const item = this.player.inventory.find(i => i.id === itemId);
    if (!item) return false;
    
    if (item.quantity > quantity) {
      item.quantity -= quantity;
    } else {
      this.player.inventory = this.player.inventory.filter(i => i.id !== itemId);
    }
    
    return true;
  }

  /**
   * Retorna dados para salvar no servidor
   */
  getSaveData() {
    return {
      id: this.player.id,
      name: this.player.name,
      class: this.player.class,
      level: this.player.level,
      xp: this.player.xp,
      
      x: this.player.x,
      y: this.player.y,
      
      hp: this.player.hp,
      maxHp: this.player.maxHp,
      mana: this.player.mana,
      maxMana: this.player.maxMana,
      
      attack: this.player.attack,
      defense: this.player.defense,
      speed: this.player.speed,
      
      inventory: this.player.inventory,
      equipment: this.player.equipment
    };
  }
}

// Exportar para uso global
window.PlayerManager = PlayerManager;
