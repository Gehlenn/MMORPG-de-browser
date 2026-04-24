/**
 * RaidSystem.js
 * Sistema de Raids e Dungeons para 10+ jogadores
 * Legacy of Komodo MMORPG v0.5.0 - Nível 9
 */

class RaidSystem {
    constructor(database, playerManager, bossManager) {
        this.db = database;
        this.playerManager = playerManager;
        this.bossManager = bossManager;
        
        // Raids disponíveis
        this.raids = {
            tomb_of_eternity: {
                id: 'tomb_of_eternity',
                name: 'Túmulo da Eternidade',
                description: 'A tumba sagrada do antigo lorre Anubis. Apenas os mais corajosos ousam entrar.',
                minLevel: 80,
                maxPlayers: 10,
                minPlayers: 5,
                duration: 3600000, // 1 hora
                phases: 3,
                bosses: ['guardian_of_souls', 'anubis_sentinel', 'pharaoh_anub'],
                loot: ['pharaoh_crown', 'soul_reaver', 'eternity_ring'],
                mechanics: ['soul_drain', 'sandstorm', 'afterlife_portal']
            },
            dragon_spire: {
                id: 'dragon_spire',
                name: 'Torre do Dragão',
                description: 'O ninho do antigo dragão Krazgoth. O calor derrete armaduras fracas.',
                minLevel: 85,
                maxPlayers: 10,
                minPlayers: 5,
                duration: 3600000,
                phases: 3,
                bosses: ['dragon_whelp', 'flame_guardian', 'ancient_dragon_krazgoth'],
                loot: ['dragon_scale_armor', 'fire_breath_sword', 'wings_of_flame'],
                mechanics: ['fire_breath', 'tail_sweep', 'magma_eruption']
            },
            crypt_of_constructors: {
                id: 'crypt_of_constructors',
                name: 'Cripta dos Construtores',
                description: 'Tecnologia proibida dos antigos. Mecanismos mortais aguardam.',
                minLevel: 90,
                maxPlayers: 10,
                minPlayers: 5,
                duration: 4200000, // 1h 10min
                phases: 4,
                bosses: ['defense_matrix', 'constructor_prime', 'omega_construct'],
                loot: ['constructor_core', 'ancient_tech_gauntlets', 'quantum_blade'],
                mechanics: ['laser_grid', 'time_dilation', 'nanite_swarm', 'core_overload']
            }
        };
        
        // Instâncias ativas
        this.activeRaids = new Map();
        
        // Matchmaking queue
        this.matchmakingQueue = new Map(); // raidId -> players[]
        
        console.log('🏰 RaidSystem initialized');
    }

    /**
     * Cria uma instância de raid
     */
    async createRaid(raidId, leaderId, party = []) {
        const raidConfig = this.raids[raidId];
        if (!raidConfig) {
            return { success: false, error: 'Raid not found' };
        }
        
        // Valida líder
        const leader = await this.playerManager.getPlayer(leaderId);
        if (!leader || leader.level < raidConfig.minLevel) {
            return { success: false, error: `Level ${raidConfig.minLevel}+ required` };
        }
        
        // Cria instância
        const raidInstance = {
            id: `raid_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            raidId: raidId,
            status: 'forming', // forming, in_progress, completed, failed
            leaderId: leaderId,
            players: new Map(),
            maxPlayers: raidConfig.maxPlayers,
            minPlayers: raidConfig.minPlayers,
            phase: 0,
            bosses: new Map(),
            loot: [],
            startTime: null,
            endTime: null,
            mechanics: new Set(),
            createdAt: Date.now()
        };
        
        // Adiciona líder
        raidInstance.players.set(leaderId, {
            id: leaderId,
            role: 'leader',
            status: 'ready',
            damage: 0,
            healing: 0,
            deaths: 0,
            joinedAt: Date.now()
        });
        
        // Adiciona party inicial
        for (const playerId of party) {
            if (raidInstance.players.size < raidConfig.maxPlayers) {
                raidInstance.players.set(playerId, {
                    id: playerId,
                    role: 'member',
                    status: 'ready',
                    damage: 0,
                    healing: 0,
                    deaths: 0,
                    joinedAt: Date.now()
                });
            }
        }
        
        this.activeRaids.set(raidInstance.id, raidInstance);
        
        console.log(`🏰 Raid ${raidConfig.name} created by ${leader.name}`);
        
        return {
            success: true,
            raid: this.formatRaidInstance(raidInstance)
        };
    }

    /**
     * Inicia a raid
     */
    async startRaid(raidInstanceId) {
        const raid = this.activeRaids.get(raidInstanceId);
        if (!raid) {
            return { success: false, error: 'Raid instance not found' };
        }
        
        const config = this.raids[raid.raidId];
        
        // Verifica mínimo de jogadores
        if (raid.players.size < config.minPlayers) {
            return { 
                success: false, 
                error: `Need ${config.minPlayers} players to start (current: ${raid.players.size})` 
            };
        }
        
        // Spawna bosses
        for (let i = 0; i < config.bosses.length; i++) {
            const bossId = config.bosses[i];
            const boss = this.bossManager.createBoss(bossId, {
                raidInstanceId: raidInstanceId,
                phase: i + 1
            });
            raid.bosses.set(bossId, boss);
        }
        
        // Inicia mecânicas
        this.startMechanics(raid);
        
        // Atualiza status
        raid.status = 'in_progress';
        raid.startTime = Date.now();
        raid.phase = 1;
        
        // Notifica todos os jogadores
        for (const [playerId] of raid.players) {
            this.playerManager.notify(playerId, 'raid:start', {
                raid: this.formatRaidInstance(raid),
                message: `${config.name} has begun!`
            });
        }
        
        console.log(`🏰 Raid ${config.name} started!`);
        
        return {
            success: true,
            raid: this.formatRaidInstance(raid)
        };
    }

    /**
     * Matchmaking automático
     */
    async joinMatchmaking(playerId, raidId, role = 'dps') {
        const config = this.raids[raidId];
        if (!config) {
            return { success: false, error: 'Raid not found' };
        }
        
        const player = await this.playerManager.getPlayer(playerId);
        if (!player || player.level < config.minLevel) {
            return { success: false, error: `Level ${config.minLevel}+ required` };
        }
        
        // Inicializa fila se não existe
        if (!this.matchmakingQueue.has(raidId)) {
            this.matchmakingQueue.set(raidId, []);
        }
        
        const queue = this.matchmakingQueue.get(raidId);
        
        // Verifica se já está na fila
        if (queue.some(p => p.id === playerId)) {
            return { success: false, error: 'Already in queue' };
        }
        
        // Adiciona à fila
        queue.push({
            id: playerId,
            role: role,
            itemLevel: this.calculateItemLevel(player),
            joinedAt: Date.now()
        });
        
        // Ordena por item level para balanceamento
        queue.sort((a, b) => b.itemLevel - a.itemLevel);
        
        // Verifica se tem jogadores suficientes
        if (queue.length >= config.minPlayers) {
            // Pega os primeiros jogadores
            const raidParty = queue.splice(0, config.maxPlayers);
            
            // Cria raid
            const leader = raidParty[0];
            const result = await this.createRaid(
                raidId, 
                leader.id, 
                raidParty.slice(1).map(p => p.id)
            );
            
            if (result.success) {
                // Inicia automaticamente se todos confirmarem
                setTimeout(() => this.startRaid(result.raid.id), 30000);
            }
            
            return {
                success: true,
                matched: true,
                raid: result.raid,
                position: null
            };
        }
        
        return {
            success: true,
            matched: false,
            position: queue.length,
            estimatedTime: this.estimateQueueTime(raidId, queue.length)
        };
    }

    /**
     * Processa dano em boss
     */
    async processBossDamage(raidInstanceId, bossId, playerId, damage, isCritical = false) {
        const raid = this.activeRaids.get(raidInstanceId);
        if (!raid || raid.status !== 'in_progress') {
            return { success: false, error: 'Raid not active' };
        }
        
        const boss = raid.bosses.get(bossId);
        if (!boss || boss.hp <= 0) {
            return { success: false, error: 'Boss not found or dead' };
        }
        
        // Aplica dano
        boss.hp = Math.max(0, boss.hp - damage);
        
        // Atualiza stats do jogador
        const playerStats = raid.players.get(playerId);
        if (playerStats) {
            playerStats.damage += damage;
        }
        
        // Verifica se boss morreu
        if (boss.hp <= 0) {
            await this.handleBossDeath(raid, boss);
        }
        
        // Broadcast para todos na raid
        this.broadcastToRaid(raid, 'raid:boss:damage', {
            bossId: bossId,
            bossHp: boss.hp,
            bossMaxHp: boss.maxHp,
            damage: damage,
            isCritical: isCritical,
            attacker: playerId
        });
        
        return { success: true, bossHp: boss.hp };
    }

    /**
     * Processa cura
     */
    async processHealing(raidInstanceId, targetId, healerId, amount) {
        const raid = this.activeRaids.get(raidInstanceId);
        if (!raid) {
            return { success: false, error: 'Raid not found' };
        }
        
        // Atualiza stats do healer
        const healerStats = raid.players.get(healerId);
        if (healerStats) {
            healerStats.healing += amount;
        }
        
        // Aplica cura no alvo
        const target = await this.playerManager.getPlayer(targetId);
        if (target) {
            target.hp = Math.min(target.stats.maxHp, target.hp + amount);
        }
        
        return { success: true, healed: amount };
    }

    /**
     * Lida com morte de boss
     */
    async handleBossDeath(raid, boss) {
        const config = this.raids[raid.raidId];
        
        console.log(`💀 Boss ${boss.name} defeated in raid ${raid.id}`);
        
        // Gera loot
        const loot = this.generateLoot(config, boss);
        raid.loot.push(...loot);
        
        // Avança fase
        raid.phase++;
        
        // Verifica se completou todas as fases
        if (raid.phase > config.phases) {
            await this.completeRaid(raid);
        } else {
            // Notifica próxima fase
            this.broadcastToRaid(raid, 'raid:phase', {
                phase: raid.phase,
                message: `Phase ${raid.phase} begins!`
            });
        }
        
        // Distribui loot
        await this.distributeLoot(raid, loot);
    }

    /**
     * Gera loot
     */
    generateLoot(config, boss) {
        const loot = [];
        const baseLoot = config.loot;
        
        // Cada jogador tem chance de loot
        const numItems = Math.floor(Math.random() * 3) + 1; // 1-3 itens
        
        for (let i = 0; i < numItems; i++) {
            const itemId = baseLoot[Math.floor(Math.random() * baseLoot.length)];
            loot.push({
                id: itemId,
                boss: boss.id,
                rolled: false,
                winner: null
            });
        }
        
        return loot;
    }

    /**
     * Distribui loot (sistema de roll/need/greed)
     */
    async distributeLoot(raid, loot) {
        // Simplificado: distribui aleatoriamente
        for (const item of loot) {
            const players = Array.from(raid.players.keys());
            const winner = players[Math.floor(Math.random() * players.length)];
            
            item.winner = winner;
            item.rolled = true;
            
            // Entrega ao jogador
            const player = await this.playerManager.getPlayer(winner);
            if (player) {
                player.inventory.push({ id: item.id, source: 'raid' });
                await this.playerManager.updatePlayer(player);
                
                // Notifica
                this.playerManager.notify(winner, 'raid:loot', {
                    item: item.id,
                    boss: item.boss
                });
            }
        }
    }

    /**
     * Completa a raid
     */
    async completeRaid(raid) {
        raid.status = 'completed';
        raid.endTime = Date.now();
        
        const duration = raid.endTime - raid.startTime;
        
        // Calcula rankings
        const playerStats = Array.from(raid.players.values());
        const topDamage = playerStats.sort((a, b) => b.damage - a.damage)[0];
        const topHealing = playerStats.sort((a, b) => b.healing - a.healing)[0];
        
        // Salva no banco
        await this.db.saveRaidCompletion({
            raidId: raid.raidId,
            instanceId: raid.id,
            players: Array.from(raid.players.keys()),
            duration: duration,
            topDamage: topDamage?.id,
            topHealing: topHealing?.id,
            loot: raid.loot,
            completedAt: new Date().toISOString()
        });
        
        // Notifica todos
        this.broadcastToRaid(raid, 'raid:complete', {
            duration: duration,
            topDamage: topDamage ? { id: topDamage.id, damage: topDamage.damage } : null,
            topHealing: topHealing ? { id: topHealing.id, healing: topHealing.healing } : null,
            lootSummary: raid.loot.map(l => ({ item: l.id, winner: l.winner }))
        });
        
        console.log(`🏰 Raid ${raid.id} completed in ${duration}ms`);
        
        // Limpa após 5 minutos
        setTimeout(() => {
            this.activeRaids.delete(raid.id);
        }, 300000);
    }

    /**
     * Falha na raid (wipe)
     */
    async failRaid(raid, reason = 'wipe') {
        raid.status = 'failed';
        raid.endTime = Date.now();
        
        this.broadcastToRaid(raid, 'raid:fail', {
            reason: reason,
            phase: raid.phase,
            message: 'The raid has failed. The bosses have reset.'
        });
        
        // Limpa após 1 minuto
        setTimeout(() => {
            this.activeRaids.delete(raid.id);
        }, 60000);
    }

    /**
     * Inicia mecânicas da raid
     */
    startMechanics(raid) {
        const config = this.raids[raid.raidId];
        
        // Timer para enrage/wipe
        setTimeout(() => {
            if (raid.status === 'in_progress') {
                this.failRaid(raid, 'time_limit');
            }
        }, config.duration);
        
        // Mecânicas periódicas
        const mechanicsInterval = setInterval(() => {
            if (raid.status !== 'in_progress') {
                clearInterval(mechanicsInterval);
                return;
            }
            
            this.triggerRandomMechanic(raid);
        }, 30000); // A cada 30s
    }

    /**
     * Triggers mecânica aleatória
     */
    triggerRandomMechanic(raid) {
        const config = this.raids[raid.raidId];
        const mechanic = config.mechanics[Math.floor(Math.random() * config.mechanics.length)];
        
        this.broadcastToRaid(raid, 'raid:mechanic', {
            type: mechanic,
            message: this.getMechanicMessage(mechanic),
            duration: 10000
        });
    }

    /**
     * Mensagens de mecânicas
     */
    getMechanicMessage(mechanic) {
        const messages = {
            soul_drain: '💀 Souls are being drained! Stack together!',
            sandstorm: '🌪️ Sandstorm approaching! Find shelter!',
            afterlife_portal: '🌀 Portal to the afterlife opens! Kill adds!',
            fire_breath: '🔥 Dragon preparing breath! Spread out!',
            tail_sweep: '🐉 Tail sweep incoming! Move to the sides!',
            magma_eruption: '🌋 Magma eruption! Avoid red zones!',
            laser_grid: '⚡ Laser grid activating! Watch your step!',
            time_dilation: '⏰ Time dilation field! Speed changes!',
            nanite_swarm: '🤖 Nanite swarm detected! Cleanse quickly!',
            core_overload: '☢️ Core overloading! Burst damage now!'
        };
        return messages[mechanic] || '⚠️ Mechanic incoming!';
    }

    /**
     * Calcula item level do jogador
     */
    calculateItemLevel(player) {
        if (!player.equipment) return 0;
        
        const slots = ['weapon', 'armor', 'helmet', 'boots', 'accessory'];
        let total = 0;
        let count = 0;
        
        for (const slot of slots) {
            const item = player.equipment[slot];
            if (item && item.itemLevel) {
                total += item.itemLevel;
                count++;
            }
        }
        
        return count > 0 ? Math.floor(total / count) : 0;
    }

    /**
     * Estima tempo de fila
     */
    estimateQueueTime(raidId, currentPosition) {
        // Estimativa base: ~2 min por jogador faltando
        const config = this.raids[raidId];
        const needed = config.minPlayers - currentPosition;
        return Math.max(0, needed * 120);
    }

    /**
     * Broadcast para todos na raid
     */
    broadcastToRaid(raid, event, data) {
        for (const [playerId] of raid.players) {
            this.playerManager.notify(playerId, event, data);
        }
    }

    /**
     * Formata instância para resposta
     */
    formatRaidInstance(raid) {
        const config = this.raids[raid.raidId];
        return {
            id: raid.id,
            name: config.name,
            status: raid.status,
            phase: raid.phase,
            players: Array.from(raid.players.values()),
            maxPlayers: raid.maxPlayers,
            bosses: Array.from(raid.bosses.values()).map(b => ({
                id: b.id,
                name: b.name,
                hp: b.hp,
                maxHp: b.maxHp
            })),
            loot: raid.loot
        };
    }

    /**
     * Obtém raids disponíveis
     */
    getAvailableRaids(playerLevel = 1) {
        return Object.values(this.raids)
            .filter(raid => playerLevel >= raid.minLevel)
            .map(raid => ({
                id: raid.id,
                name: raid.name,
                description: raid.description,
                minLevel: raid.minLevel,
                maxPlayers: raid.maxPlayers,
                minPlayers: raid.minPlayers
            }));
    }

    /**
     * Estatísticas
     */
    getStats() {
        return {
            activeRaids: this.activeRaids.size,
            totalRaids: Object.keys(this.raids).length,
            matchmakingQueues: this.matchmakingQueue.size,
            playersInMatchmaking: Array.from(this.matchmakingQueue.values())
                .reduce((sum, q) => sum + q.length, 0)
        };
    }
}

// Exporta
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RaidSystem;
} else {
    window.RaidSystem = RaidSystem;
}
