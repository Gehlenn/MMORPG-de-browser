/**
 * 👾 MobSystem - Sistema de Mobs
 * Arquivo: server/systems/MobSystem.js
 * Gerencia spawn, comportamento e estado dos mobs
 */

class MobSystem {
    constructor() {
        this.mobs = new Map();
        
        // NOVO: Configurações de limite e spawn para MVP (Passo 4)
        this.config = {
            maxMobs: 30,           // Limite máximo de mobs ativos
            minSpawnDistance: 200, // Distância mínima do jogador para spawn
            maxSpawnDistance: 800, // Distância máxima do jogador para spawn
            respawnDelay: 5000,    // 5 segundos antes de respawnar
            respawnInterval: 1000, // Verificar respawn a cada 1 segundo
            mobsPerZone: {
                'training_fields': 8,
                'forest': 8,
                'mountains': 8,
                'orc_territory': 6
            }
        };
        
        // Zonas e seus tipos de mobs permitidos
        this.zoneMobTypes = {
            'training_fields': ['slime'],
            'forest': ['goblin', 'spider'],
            'mountains': ['wolf', 'skeleton'],
            'orc_territory': ['orc']
        };
        
        // Contadores de spawn por zona
        this.zoneMobCounts = new Map();
        
        this.mobTypes = {
            slime: {
                name: "Slime",
                hp: 50,
                maxHp: 50,
                stats: { STR: 8, VIT: 8, AGI: 5, INT: 2, SAB: 2, FIS: 5 },
                level: 1,
                expReward: 10,
                goldReward: 5,
                damage: 5,
                attackSpeed: 1.5,
                moveSpeed: 60,
                aggroRange: 150,
                color: "#7FFF00"
            },
            goblin: {
                name: "Goblin",
                hp: 80,
                maxHp: 80,
                stats: { STR: 12, VIT: 10, AGI: 15, INT: 5, SAB: 5, FIS: 8 },
                level: 5,
                expReward: 25,
                goldReward: 12,
                damage: 12,
                attackSpeed: 1.2,
                moveSpeed: 100,
                aggroRange: 200,
                color: "#228B22"
            },
            wolf: {
                name: "Lobo",
                hp: 120,
                maxHp: 120,
                stats: { STR: 15, VIT: 12, AGI: 20, INT: 3, SAB: 8, FIS: 10 },
                level: 8,
                expReward: 40,
                goldReward: 20,
                damage: 18,
                attackSpeed: 1.0,
                moveSpeed: 130,
                aggroRange: 250,
                color: "#808080"
            },
            orc: {
                name: "Orc",
                hp: 200,
                maxHp: 200,
                stats: { STR: 20, VIT: 18, AGI: 10, INT: 5, SAB: 6, FIS: 15 },
                level: 12,
                expReward: 70,
                goldReward: 35,
                damage: 25,
                attackSpeed: 0.8,
                moveSpeed: 80,
                aggroRange: 180,
                color: "#8B4513"
            },
            skeleton: {
                name: "Esqueleto",
                hp: 90,
                maxHp: 90,
                stats: { STR: 14, VIT: 8, AGI: 12, INT: 3, SAB: 5, FIS: 12 },
                level: 6,
                expReward: 30,
                goldReward: 15,
                damage: 15,
                attackSpeed: 1.0,
                moveSpeed: 90,
                aggroRange: 200,
                color: "#F5F5F5"
            },
            spider: {
                name: "Aranha Gigante",
                hp: 60,
                maxHp: 60,
                stats: { STR: 10, VIT: 8, AGI: 18, INT: 4, SAB: 6, FIS: 6 },
                level: 4,
                expReward: 20,
                goldReward: 10,
                damage: 10,
                attackSpeed: 1.3,
                moveSpeed: 110,
                aggroRange: 180,
                color: "#4B0082"
            }
        };
        
        this.nextMobId = 1;
        console.log('✅ MobSystem inicializado com', Object.keys(this.mobTypes).length, 'tipos de mobs');
    }

    /**
     * Spawna um mob em uma posição
     * @param {string} type - Tipo do mob
     * @param {number} x - Posição X
     * @param {number} y - Posição Y
     * @param {string} zone - Zona (opcional)
     * @returns {object} Mob criado
     */
    spawnMob(type, x, y, zone = "default") {
        // NOVO: Verificar limite máximo de mobs (MVP - Passo 4)
        if (this.getAllMobs().length >= this.config.maxMobs) {
            console.log(`⚠️ Limite de mobs atingido (${this.config.maxMobs}) - não spawnando ${type}`);
            return null;
        }
        
        // NOVO: Verificar limite por zona
        const zoneCount = this.getMobsInZone(zone).length;
        const zoneLimit = this.config.mobsPerZone[zone] || 6;
        if (zoneCount >= zoneLimit) {
            console.log(`⚠️ Limite de mobs na zona ${zone} atingido (${zoneLimit})`);
            return null;
        }
        
        const template = this.mobTypes[type];
        if (!template) {
            console.error(`❌ Tipo de mob ${type} não encontrado`);
            return null;
        }

        const mob = {
            id: `mob_${this.nextMobId++}`,
            type: type,
            name: template.name,
            x: x,
            y: y,
            zone: zone,
            
            // Stats
            level: template.level,
            hp: template.hp,
            maxHp: template.maxHp,
            stats: { ...template.stats },
            
            // Combate
            damage: template.damage,
            attackSpeed: template.attackSpeed,
            attackCooldown: 0,
            
            // Movimento
            moveSpeed: template.moveSpeed,
            aggroRange: template.aggroRange,
            target: null,
            
            // Estado
            isDead: false,
            isAggro: false,
            lastAttack: 0,
            
            // Visual
            color: template.color,
            
            // Rewards
            expReward: template.expReward,
            goldReward: template.goldReward,
            
            // Spawn info
            spawnTime: Date.now(),
            respawnTime: null
        };

        this.mobs.set(mob.id, mob);
        
        // NOVO: Atualizar contador de zona
        this.updateZoneCounts();
        
        console.log(`👾 Mob ${mob.name} (${mob.id}) spawnado em (${x}, ${y}) na zona ${zone}`);
        
        return mob;
    }

    /**
     * NOVO: Verifica se pode spawnar mob perto de jogadores (MVP - Passo 4)
     * @param {number} x - Posição X
     * @param {number} y - Posição Y
     * @param {array} players - Lista de jogadores
     * @returns {boolean} Pode spawnar?
     */
    canSpawnNearPlayers(x, y, players) {
        if (!players || players.length === 0) return true;
        
        for (const player of players) {
            const dx = player.x - x;
            const dy = player.y - y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Spawnar longe demais ou muito perto dos jogadores
            if (distance < this.config.minSpawnDistance || distance > this.config.maxSpawnDistance) {
                return false;
            }
        }
        
        return true;
    }

    /**
     * NOVO: Spawna mob em posição aleatória válida (MVP - Passo 4)
     * @param {string} type - Tipo do mob
     * @param {string} zone - Zona
     * @param {array} players - Lista de jogadores para verificar distância
     * @returns {object} Mob criado ou null
     */
    spawnMobRandomPosition(type, zone, players) {
        // Tentar encontrar posição válida (até 10 tentativas)
        for (let attempts = 0; attempts < 10; attempts++) {
            const x = 100 + Math.random() * 1400; // Mapa 1500x1200
            const y = 100 + Math.random() * 1000;
            
            if (this.canSpawnNearPlayers(x, y, players)) {
                return this.spawnMob(type, x, y, zone);
            }
        }
        
        // Se não encontrou posição válida, spawnar em posição padrão
        return this.spawnMob(type, 400, 400, zone);
    }

    /**
     * NOVO: Retorna mobs em uma zona específica (MVP - Passo 4)
     * @param {string} zone - Nome da zona
     * @returns {array} Lista de mobs
     */
    getMobsInZone(zone) {
        return this.getAllMobs().filter(mob => mob.zone === zone);
    }

    /**
     * NOVO: Atualiza contadores de mobs por zona (MVP - Passo 4)
     */
    updateZoneCounts() {
        this.zoneMobCounts.clear();
        for (const mob of this.getAllMobs()) {
            const count = this.zoneMobCounts.get(mob.zone) || 0;
            this.zoneMobCounts.set(mob.zone, count + 1);
        }
    }

    /**
     * Remove um mob
     * @param {string} mobId - ID do mob
     */
    removeMob(mobId) {
        const mob = this.mobs.get(mobId);
        if (mob) {
            mob.isDead = true;
            // NOVO: Respawn mais rápido para MVP (5 segundos)
            mob.respawnTime = Date.now() + this.config.respawnDelay;
            mob.deathPosition = { x: mob.x, y: mob.y }; // Salvar posição da morte
            console.log(`💀 Mob ${mob.name} (${mobId}) morto - respawn em ${this.config.respawnDelay/1000}s`);
        }
    }

    /**
     * Retorna todos os mobs ativos
     * @returns {array} Lista de mobs
     */
    getAllMobs() {
        return Array.from(this.mobs.values()).filter(mob => !mob.isDead);
    }

    /**
     * Retorna todos os mobs (incluindo mortos)
     * @returns {array} Lista completa
     */
    getAllMobsIncludingDead() {
        return Array.from(this.mobs.values());
    }

    /**
     * Encontra mobs em uma área
     * @param {number} x - Centro X
     * @param {number} y - Centro Y
     * @param {number} radius - Raio
     * @returns {array} Mobs na área
     */
    getMobsInArea(x, y, radius) {
        return this.getAllMobs().filter(mob => {
            const dx = mob.x - x;
            const dy = mob.y - y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            return distance <= radius;
        });
    }

    /**
     * Spawna mobs iniciais no mundo
     */
    spawnInitialMobs() {
        // Campos de Treinamento (Lv 1-10)
        this.spawnMob("slime", 300, 300, "training_fields");
        this.spawnMob("slime", 350, 320, "training_fields");
        this.spawnMob("slime", 280, 350, "training_fields");
        
        // Floresta (Lv 10-25)
        this.spawnMob("goblin", 600, 400, "forest");
        this.spawnMob("goblin", 650, 450, "forest");
        this.spawnMob("spider", 620, 380, "forest");
        
        // Montanhas (Lv 30-40)
        this.spawnMob("wolf", 900, 600, "mountains");
        this.spawnMob("wolf", 950, 650, "mountains");
        this.spawnMob("skeleton", 920, 620, "mountains");
        
        // Território Orc (Lv 40+)
        this.spawnMob("orc", 1200, 800, "orc_territory");
        this.spawnMob("orc", 1250, 850, "orc_territory");
        
        console.log(`✅ ${this.mobs.size} mobs iniciais spawnados`);
    }

    /**
     * Respawn de mobs mortos (MVP - Passo 4: Respawn controlado em nova posição)
     */
    respawnDeadMobs() {
        const now = Date.now();
        let respawned = 0;
        
        for (const [mobId, mob] of this.mobs.entries()) {
            if (mob.isDead && mob.respawnTime && now >= mob.respawnTime) {
                // NOVO: Verificar se ainda há espaço para respawn
                if (this.getAllMobs().length >= this.config.maxMobs) {
                    // Adiar respawn se limite atingido
                    mob.respawnTime = now + this.config.respawnDelay;
                    continue;
                }
                
                // NOVO: Respawn em nova posição aleatória na mesma zona
                const newPos = this.getRandomPositionInZone(mob.zone);
                if (newPos) {
                    mob.x = newPos.x;
                    mob.y = newPos.y;
                }
                
                // Respawn com HP full
                mob.hp = mob.maxHp;
                mob.isDead = false;
                mob.target = null;
                mob.isAggro = false;
                mob.respawnTime = null;
                mob.deathPosition = null;
                mob.spawnTime = now;
                
                respawned++;
                console.log(`🔄 Mob ${mob.name} (${mobId}) respawnou em (${mob.x}, ${mob.y}) na zona ${mob.zone}`);
            }
        }
        
        if (respawned > 0) {
            this.updateZoneCounts();
            console.log(`🔄 ${respawned} mobs respawnados no total`);
        }
    }

    /**
     * NOVO: Retorna posição aleatória em uma zona (MVP - Passo 4)
     * @param {string} zone - Nome da zona
     * @returns {object} Posição {x, y} ou null
     */
    getRandomPositionInZone(zone) {
        // Definir áreas de spawn por zona
        const zoneAreas = {
            'training_fields': { x: 200, y: 200, w: 400, h: 300 },
            'forest': { x: 500, y: 300, w: 400, h: 300 },
            'mountains': { x: 800, y: 500, w: 400, h: 300 },
            'orc_territory': { x: 1100, y: 700, w: 400, h: 300 }
        };
        
        const area = zoneAreas[zone];
        if (!area) return { x: 400 + Math.random() * 200, y: 400 + Math.random() * 200 };
        
        return {
            x: area.x + Math.random() * area.w,
            y: area.y + Math.random() * area.h
        };
    }

    /**
     * Mob ataca um alvo
     * @param {object} mob - Mob atacante
     * @param {object} target - Alvo
     * @returns {object} Resultado do ataque
     */
    mobAttack(mob, target) {
        if (mob.isDead || target.isDead) {
            return { success: false, error: "Mob ou alvo morto" };
        }

        const now = Date.now();
        const attackCooldown = (1 / mob.attackSpeed) * 1000;
        
        if (now - mob.lastAttack < attackCooldown) {
            return { success: false, error: "Cooldown de ataque" };
        }

        mob.lastAttack = now;

        // Calcular dano com variação
        const variance = 0.8 + Math.random() * 0.4; // ±20%
        const damage = Math.floor(mob.damage * variance);

        return {
            success: true,
            damage: damage,
            mobId: mob.id,
            mobName: mob.name,
            targetId: target.id
        };
    }

    /**
     * Atualiza comportamento dos mobs
     */
    updateMobs() {
        this.respawnDeadMobs();
        
        // Aqui seria a lógica de AI dos mobs
        // Por enquanto, apenas respawn
    }

    /**
     * Retorna estatísticas do sistema
     * @returns {object} Estatísticas
     */
    getStats() {
        const all = this.getAllMobsIncludingDead();
        return {
            total: all.length,
            alive: this.getAllMobs().length,
            dead: all.filter(m => m.isDead).length,
            types: Object.keys(this.mobTypes).length
        };
    }
}

module.exports = MobSystem;
