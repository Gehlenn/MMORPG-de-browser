/**
 * CombatModule.js
 * Módulo de combate do servidor MMORPG
 * Responsabilidade: Gerenciar ataques, dano, morte de alvos e XP
 */

class CombatModule {
    constructor(server) {
        this.server = server;
    }

    /**
     * Handle combat attack from player
     */
    handleCombatAttack(socket, data) {
        const playerId = socket.id;
        const player = this.server.players.get(playerId);
        
        if (!player) {
            socket.emit('combat:attack_result', {
                success: false,
                error: 'Player not found'
            });
            return;
        }
        
        const targetId = data.targetId;
        const targetType = data.targetType || 'mob';
        
        console.log(`⚔️ Player ${player.name} attacking ${targetType} ${targetId}`);
        
        // Find target (mob only for now)
        let target = this.findTarget(targetId, targetType);
        
        if (!target) {
            socket.emit('combat:attack_result', {
                success: false,
                error: 'Target not found',
                targetId: targetId
            });
            return;
        }
        
        // Calculate damage
        const damage = this.calculateDamage(player, target);
        
        // Apply damage
        const currentHealth = target.hp || target.health || 100;
        const newHealth = Math.max(0, currentHealth - damage);
        target.hp = newHealth;
        target.health = newHealth;
        
        console.log(`💥 ${target.name || target.type} took ${damage} damage. HP: ${newHealth}/${target.maxHp || 100}`);
        
        // Check if target died
        const isDead = newHealth <= 0;
        
        if (isDead) {
            this.handleTargetDeath(socket, player, target, targetType, damage);
        } else {
            this.handleTargetHit(socket, playerId, target, targetId, targetType, damage, newHealth);
        }
    }

    /**
     * Find target by ID and type
     */
    findTarget(targetId, targetType) {
        let target = null;
        
        if (targetType === 'mob') {
            // Try to find in mobSystem first
            if (this.server.mobSystem) {
                target = this.server.mobSystem.getMob(targetId);
            }
            // Fallback to mobSpawner
            if (!target && global.mobSpawner) {
                target = global.mobSpawner.getMob(targetId);
            }
        }
        
        return target;
    }

    /**
     * Calculate damage for combat
     */
    calculateDamage(player, target) {
        // Base damage (10-20)
        const baseDamage = 10 + Math.floor(Math.random() * 11);
        
        // Level bonus (+2 per level)
        const levelBonus = (player.level || 1) * 2;
        
        // Random variation (0.8 - 1.2)
        const variation = 0.8 + (Math.random() * 0.4);
        
        const totalDamage = Math.floor((baseDamage + levelBonus) * variation);
        
        return Math.max(1, totalDamage); // Minimum 1 damage
    }

    /**
     * Handle target hit (not dead)
     */
    handleTargetHit(socket, playerId, target, targetId, targetType, damage, newHealth) {
        // Send damage result
        socket.emit('combat:attack_result', {
            success: true,
            targetId: targetId,
            targetType: targetType,
            damage: damage,
            currentHealth: newHealth,
            maxHealth: target.maxHp || 100,
            isDead: false
        });
        
        // Broadcast damage to nearby players
        this.server.io.emit('combat:damage', {
            targetId: targetId,
            targetType: targetType,
            damage: damage,
            currentHealth: newHealth,
            attackerId: playerId
        });
    }

    /**
     * Handle target death com shared XP/loot
     */
    handleTargetDeath(socket, player, target, targetType, damage) {
        const playerId = socket.id;
        
        console.log(`💀 ${target.name || target.type} died!`);
        
        // Encontrar jogadores próximos para shared XP
        const nearbyPlayers = this.getNearbyPlayers(target.x, target.y, 200, playerId);
        const allContributors = [{ player: player, playerId: playerId, damage: damage }, ...nearbyPlayers];
        
        // Calcular XP total
        const baseXp = target.xpValue || (target.level || 1) * 10;
        
        // Dar XP para cada contribuidor
        for (const contributor of allContributors) {
            this.grantXp(contributor.player, contributor.playerId, baseXp, allContributors.length);
        }
        
        // Criar drops individuais para cada jogador
        this.createLootDrops(target, allContributors);
        
        // Send attack result (final blow) para quem deu o último hit
        socket.emit('combat:attack_result', {
            success: true,
            targetId: target.id,
            targetType: targetType,
            damage: damage,
            currentHealth: 0,
            maxHealth: target.maxHp || 100,
            isDead: true,
            xpGained: baseXp,
            isShared: allContributors.length > 1,
            sharedWith: allContributors.length
        });
        
        // Broadcast mob death to all players
        this.server.io.emit('mob:died', {
            mobId: target.id,
            mobType: target.type,
            mobName: target.name,
            killerId: playerId,
            killerName: player.name,
            xpGained: baseXp,
            isShared: allContributors.length > 1,
            contributors: allContributors.map(c => ({ id: c.playerId, name: c.player.name })),
            position: { x: target.x, y: target.y }
        });
        
        // Remove mob from world
        this.removeTarget(target, targetType);
        
        // Atualizar progresso de quests v2
        if (target.type) {
            for (const contributor of allContributors) {
                this.updateQuestProgress(contributor.playerId, target.type);
            }
        }
    }

    /**
     * Remove target from world systems
     */
    removeTarget(target, targetType) {
        if (targetType === 'mob') {
            if (this.server.mobSystem) {
                this.server.mobSystem.removeMob(target.id);
            }
            if (global.mobSpawner) {
                global.mobSpawner.removeMob(target.id);
            }
        }
    }

    /**
     * Grant XP to player
     */
    grantXp(player, playerId, xpAmount, contributorCount) {
        const xpResult = this.server.playerDataManager?.grantXpToPlayer(player, xpAmount);
        
        if (xpResult) {
            const socket = this.server.io.sockets.sockets.get(playerId);
            if (socket) {
                socket.emit('player:xp_gain', {
                    ...xpResult,
                    isShared: contributorCount > 1,
                    sharedWith: contributorCount
                });
                
                if (xpResult.leveledUp) {
                    socket.emit('player:level_up', {
                        newLevel: xpResult.newLevel,
                        newMaxHP: player.baseStats?.maxHealth || (100 + xpResult.newLevel * 10),
                        newHP: player.baseStats?.maxHealth || (100 + xpResult.newLevel * 10),
                        xpToNext: xpResult.xpToNext
                    });
                }
                
                // Sync stats
                const newStats = this.calculatePlayerStats(player);
                socket.emit('player:stats_sync', { stats: newStats });
            }
            
            console.log(`⭐ Player ${player.name} ganhou ${xpResult.gained} XP (${contributorCount > 1 ? 'shared' : 'solo'})`);
        }
    }

    /**
     * Calculate player stats
     */
    calculatePlayerStats(player) {
        return {
            level: player.level || 1,
            maxHealth: player.maxHp || 100,
            attack: 10 + (player.level || 1) * 2,
            defense: (player.level || 1),
            speed: 1 + (player.level || 1) * 0.1
        };
    }

    /**
     * Retorna jogadores próximos a uma posição
     */
    getNearbyPlayers(x, y, range, excludePlayerId = null) {
        const nearby = [];
        
        for (const [playerId, player] of this.server.players) {
            if (excludePlayerId && playerId === excludePlayerId) continue;
            
            const dx = player.x - x;
            const dy = player.y - y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance <= range) {
                const simulatedDamage = 10;
                nearby.push({ player, playerId, damage: simulatedDamage });
            }
        }
        
        return nearby;
    }

    /**
     * Cria drops individuais para cada jogador
     */
    createLootDrops(target, contributors) {
        for (const contributor of contributors) {
            const dropId = `drop_${target.id}_${contributor.playerId}_${Date.now()}`;
            
            const drop = {
                id: dropId,
                itemId: 'gold_coin',
                itemName: 'Gold Coin',
                quantity: 1 + Math.floor(Math.random() * 3),
                x: target.x + (Math.random() - 0.5) * 40,
                y: target.y + (Math.random() - 0.5) * 40,
                createdAt: Date.now(),
                droppedBy: target.id,
                ownerId: contributor.playerId,
                isSharedDrop: contributors.length > 1
            };
            
            this.server.lootDrops.set(dropId, drop);
            
            // Notificar apenas o jogador dono do drop
            const socket = this.server.io.sockets.sockets.get(contributor.playerId);
            if (socket) {
                socket.emit('loot:drop_created', {
                    ...drop,
                    message: contributors.length > 1 
                        ? `💰 Loot compartilhado! ${drop.quantity} gold para você!` 
                        : `💰 ${drop.quantity} gold dropado!`
                });
            }
        }
        
        console.log(`💰 ${contributors.length} drops criados (shared loot) para ${target.name}`);
    }

    /**
     * Atualizar progresso de quest
     */
    updateQuestProgress(playerId, mobType) {
        // Delegar para QuestModule se disponível
        if (this.server.questModule) {
            this.server.questModule.updateQuestProgressV2(playerId, mobType);
        }
    }

    /**
     * Check and handle player level up
     */
    checkPlayerLevelUp(socket, player) {
        const xpNeeded = (player.level || 1) * 100;
        
        if (player.xp >= xpNeeded) {
            player.level = (player.level || 1) + 1;
            player.xp -= xpNeeded;
            player.maxHp = (player.maxHp || 100) + 10;
            player.hp = player.maxHp;
            
            console.log(`🎉 Player ${player.name} leveled up to ${player.level}!`);
            
            socket.emit('player:level_up', {
                newLevel: player.level,
                newMaxHP: player.maxHp,
                newHP: player.hp,
                xpToNext: player.level * 100
            });
        }
    }
}

module.exports = CombatModule;
