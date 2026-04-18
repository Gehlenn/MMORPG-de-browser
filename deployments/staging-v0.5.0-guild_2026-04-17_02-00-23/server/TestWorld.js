/**
 * TestWorld.js
 * Configuração do mapa de teste minimal (MVP - Passo 7)
 * Mapa único 1024x1024 com 15 slimes para teste
 */

class TestWorld {
  constructor() {
    this.id = 'testing_zone';
    this.name = 'Zona de Teste';
    this.width = 1024;
    this.height = 1024;
    
    // Configuração de spawn
    this.spawnConfig = {
      safeZone: { x: 100, y: 100, width: 200, height: 200 }, // Área segura inicial
      minDistanceFromPlayer: 100,  // Mobs não spawnam muito perto
      maxMobs: 15,                 // Limite total de mobs
      respawnDelay: 5000          // 5 segundos para respawn
    };
    
    // Configuração dos slimes
    this.slimeConfig = {
      count: 15,
      type: 'slime',
      name: 'Slime',
      
      // Stats
      level: 1,
      hp: 50,
      maxHp: 50,
      attack: 5,
      defense: 2,
      speed: 40, // pixels/segundo
      
      // Rewards
      xpReward: 20,
      
      // Drops
      drops: [
        { itemId: 'gold_coin', chance: 0.8, minQty: 1, maxQty: 3 },
        { itemId: 'slime_goo', chance: 0.5, minQty: 1, maxQty: 2 }
      ],
      
      // Visual
      color: '#7FFF00',
      size: 24
    };
    
    // NPCs do mapa
    this.npcs = [
      {
        id: 'guard_village',
        name: 'Guarda da Vila',
        x: 400,
        y: 300,
        type: 'quest_giver',
        icon: '🛡️',
        color: '#1976D2'
      }
    ];
    
    // Boundaries (obstáculos simples)
    this.boundaries = [
      // Bordas do mapa
      { x: 0, y: 0, width: 1024, height: 20 },      // Topo
      { x: 0, y: 1004, width: 1024, height: 20 },  // Baixo
      { x: 0, y: 0, width: 20, height: 1024 },     // Esquerda
      { x: 1004, y: 0, width: 20, height: 1024 }  // Direita
    ];
  }

  /**
   * Gera posição de spawn aleatória válida
   */
  getRandomSpawnPosition(playerX, playerY) {
    let x, y, distance;
    let attempts = 0;
    
    do {
      x = 50 + Math.random() * (this.width - 100);
      y = 50 + Math.random() * (this.height - 100);
      
      // Calcular distância do jogador
      const dx = x - playerX;
      const dy = y - playerY;
      distance = Math.sqrt(dx * dx + dy * dy);
      
      attempts++;
    } while (distance < this.spawnConfig.minDistanceFromPlayer && attempts < 10);
    
    return { x, y };
  }

  /**
   * Cria configuração de mobs iniciais
   */
  generateInitialMobs() {
    const mobs = [];
    
    for (let i = 0; i < this.slimeConfig.count; i++) {
      const pos = this.getRandomSpawnPosition(400, 300); // Centro aproximado
      
      mobs.push({
        id: `slime_${i}`,
        type: this.slimeConfig.type,
        name: this.slimeConfig.name,
        x: pos.x,
        y: pos.y,
        
        level: this.slimeConfig.level,
        hp: this.slimeConfig.hp,
        maxHp: this.slimeConfig.maxHp,
        attack: this.slimeConfig.attack,
        defense: this.slimeConfig.defense,
        speed: this.slimeConfig.speed,
        
        xpReward: this.slimeConfig.xpReward,
        drops: this.slimeConfig.drops,
        
        color: this.slimeConfig.color,
        size: this.slimeConfig.size,
        
        isDead: false,
        target: null,
        lastAttack: 0
      });
    }
    
    return mobs;
  }

  /**
   * Verifica se posição está dentro do mapa
   */
  isInsideWorld(x, y) {
    return x >= 0 && x <= this.width && y >= 0 && y <= this.height;
  }

  /**
   * Verifica colisão com boundaries
   */
  checkCollision(x, y, size = 32) {
    for (const bound of this.boundaries) {
      if (x < bound.x + bound.width &&
          x + size > bound.x &&
          y < bound.y + bound.height &&
          y + size > bound.y) {
        return true;
      }
    }
    return false;
  }

  /**
   * Retorna dados do mundo para world:init
   */
  getWorldData() {
    return {
      id: this.id,
      name: this.name,
      width: this.width,
      height: this.height,
      mobs: this.generateInitialMobs(),
      npcs: this.npcs,
      spawnConfig: this.spawnConfig
    };
  }

  /**
   * Retorna posição segura de spawn para novo jogador
   */
  getSafeSpawnPosition() {
    const safe = this.spawnConfig.safeZone;
    return {
      x: safe.x + Math.random() * safe.width,
      y: safe.y + Math.random() * safe.height
    };
  }
}

// Singleton
let instance = null;

module.exports = {
  TestWorld,
  getInstance: () => {
    if (!instance) {
      instance = new TestWorld();
    }
    return instance;
  }
};
