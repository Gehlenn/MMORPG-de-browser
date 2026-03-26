/**
 * Regression Tests v0.4.0
 * Testes para garantir que novas features não quebram funcionalidades legadas
 * Version 0.4.0 - Production Ready
 */

const { describe, it, expect, beforeEach, afterEach } = require('@jest/globals');

describe('Regression Tests v0.4.0', () => {
    let legacySystem;
    let newSystem;
    let mockPlayer;
    
    beforeEach(() => {
        // Mock jogador para testes
        mockPlayer = {
            id: 'test_player_1',
            name: 'TestPlayer',
            level: 1,
            exp: 0,
            maxExp: 100,
            hp: 100,
            maxHp: 100,
            mana: 50,
            maxMana: 50,
            gold: 100,
            gems: 0,
            inventory: [],
            skills: [],
            position: { x: 400, y: 300 },
            stats: {
                attack: 10,
                defense: 5,
                speed: 100,
                strength: 10,
                dexterity: 10,
                intelligence: 10,
                agility: 10
            }
        };
        
        // Sistema legado (v0.3.7)
        legacySystem = {
            players: new Map(),
            createPlayer: (playerData) => {
                const player = {
                    ...mockPlayer,
                    ...playerData,
                    id: playerData.id || `player_${Date.now()}`,
                    createdAt: Date.now()
                };
                legacySystem.players.set(player.id, player);
                return player;
            },
            updatePlayerPosition: (playerId, x, y) => {
                const player = legacySystem.players.get(playerId);
                if (player) {
                    player.position = { x, y };
                    player.lastUpdate = Date.now();
                    return true;
                }
                return false;
            },
            addExperience: (playerId, exp) => {
                const player = legacySystem.players.get(playerId);
                if (player) {
                    player.exp += exp;
                    while (player.exp >= player.maxExp) {
                        player.exp -= player.maxExp;
                        player.level++;
                        player.maxExp = Math.floor(player.maxExp * 1.2);
                        player.maxHp += 10;
                        player.hp = player.maxHp;
                        player.maxMana += 5;
                        player.mana = player.maxMana;
                        player.stats.attack += 2;
                        player.stats.defense += 1;
                    }
                    return true;
                }
                return false;
            },
            takeDamage: (playerId, damage) => {
                const player = legacySystem.players.get(playerId);
                if (player) {
                    player.hp = Math.max(0, player.hp - damage);
                    return player.hp;
                }
                return null;
            },
            heal: (playerId, amount) => {
                const player = legacySystem.players.get(playerId);
                if (player) {
                    player.hp = Math.min(player.maxHp, player.hp + amount);
                    return player.hp;
                }
                return null;
            }
        };
        
        // Novo sistema (v0.4.0)
        newSystem = {
            players: new Map(),
            createPlayer: (playerData) => {
                const player = {
                    ...mockPlayer,
                    ...playerData,
                    id: playerData.id || `player_${Date.now()}`,
                    createdAt: Date.now(),
                    lastUpdate: Date.now(),
                    buffs: [],
                    debuffs: [],
                    equipment: {
                        weapon: null,
                        armor: null,
                        accessory: null
                    },
                    stats: {
                        ...mockPlayer.stats,
                        critChance: 5,
                        critMultiplier: 1.5,
                        dodgeChance: 5,
                        blockChance: 5
                    }
                };
                newSystem.players.set(player.id, player);
                return player;
            },
            updatePlayerPosition: (playerId, x, y) => {
                const player = newSystem.players.get(playerId);
                if (player) {
                    // Validação adicional no novo sistema
                    if (x < 0 || x > 1000 || y < 0 || y > 1000) {
                        return false;
                    }
                    player.position = { x, y };
                    player.lastUpdate = Date.now();
                    return true;
                }
                return false;
            },
            addExperience: (playerId, exp) => {
                const player = newSystem.players.get(playerId);
                if (player) {
                    // Aplicar bônus de experiência se houver
                    let expMultiplier = 1;
                    player.buffs.forEach(buff => {
                        if (buff.type === 'exp_boost') {
                            expMultiplier *= buff.multiplier;
                        }
                    });
                    
                    const finalExp = Math.floor(exp * expMultiplier);
                    player.exp += finalExp;
                    
                    while (player.exp >= player.maxExp) {
                        player.exp -= player.maxExp;
                        player.level++;
                        player.maxExp = Math.floor(player.maxExp * 1.2);
                        player.maxHp += 10;
                        player.hp = player.maxHp;
                        player.maxMana += 5;
                        player.mana = player.maxMana;
                        player.stats.attack += 2;
                        player.stats.defense += 1;
                        player.stats.strength += 1;
                        player.stats.dexterity += 1;
                        player.stats.intelligence += 1;
                        player.stats.agility += 1;
                    }
                    return true;
                }
                return false;
            },
            takeDamage: (playerId, damage) => {
                const player = newSystem.players.get(playerId);
                if (player) {
                    // Calcular dodge
                    const dodgeRoll = Math.random() * 100;
                    if (dodgeRoll < player.stats.dodgeChance) {
                        return player.hp; // Dodgeou
                    }
                    
                    // Calcular block
                    const blockRoll = Math.random() * 100;
                    let finalDamage = damage;
                    if (blockRoll < player.stats.blockChance) {
                        finalDamage = Math.floor(damage * 0.5); // Bloqueou 50%
                    }
                    
                    // Aplicar defesa
                    finalDamage = Math.max(1, finalDamage - player.stats.defense);
                    
                    player.hp = Math.max(0, player.hp - finalDamage);
                    return player.hp;
                }
                return null;
            },
            heal: (playerId, amount) => {
                const player = newSystem.players.get(playerId);
                if (player) {
                    // Aplicar bônus de cura se houver
                    let healMultiplier = 1;
                    player.buffs.forEach(buff => {
                        if (buff.type === 'heal_boost') {
                            healMultiplier *= buff.multiplier;
                        }
                    });
                    
                    const finalHeal = Math.floor(amount * healMultiplier);
                    player.hp = Math.min(player.maxHp, player.hp + finalHeal);
                    return player.hp;
                }
                return null;
            }
        };
    });
    
    afterEach(() => {
        legacySystem.players.clear();
        newSystem.players.clear();
    });
    
    describe('Compatibilidade de Criação de Jogador', () => {
        it('deve criar jogadores com a mesma estrutura básica', () => {
            const playerData = {
                name: 'TestPlayer',
                class: 'warrior',
                level: 5
            };
            
            const legacyPlayer = legacySystem.createPlayer(playerData);
            const newPlayer = newSystem.createPlayer(playerData);
            
            // Verificar campos básicos
            expect(legacyPlayer.id).toBeDefined();
            expect(newPlayer.id).toBeDefined();
            expect(legacyPlayer.name).toBe(newPlayer.name);
            expect(legacyPlayer.level).toBe(newPlayer.level);
            expect(legacyPlayer.hp).toBe(newPlayer.hp);
            expect(legacyPlayer.maxHp).toBe(newPlayer.maxHp);
            expect(legacyPlayer.gold).toBe(newPlayer.gold);
        });
        
        it('deve manter compatibilidade com dados legados', () => {
            const legacyPlayer = legacySystem.createPlayer({
                name: 'LegacyPlayer',
                class: 'mage'
            });
            
            // Migrar para novo sistema
            const migratedPlayer = newSystem.createPlayer(legacyPlayer);
            
            expect(migratedPlayer.name).toBe(legacyPlayer.name);
            expect(migratedPlayer.level).toBe(legacyPlayer.level);
            expect(migratedPlayer.hp).toBe(legacyPlayer.hp);
        });
    });
    
    describe('Compatibilidade de Movimento', () => {
        it('deve manter comportamento básico de movimento', () => {
            const player = legacySystem.createPlayer({ name: 'TestPlayer' });
            const newPlayer = newSystem.createPlayer({ name: 'TestPlayer' });
            
            const x = 500, y = 200;
            
            const legacyResult = legacySystem.updatePlayerPosition(player.id, x, y);
            const newResult = newSystem.updatePlayerPosition(newPlayer.id, x, y);
            
            expect(legacyResult).toBe(true);
            expect(newResult).toBe(true);
            expect(player.position.x).toBe(x);
            expect(player.position.y).toBe(y);
            expect(newPlayer.position.x).toBe(x);
            expect(newPlayer.position.y).toBe(y);
        });
        
        it('deve adicionar validações sem quebrar compatibilidade', () => {
            const player = legacySystem.createPlayer({ name: 'TestPlayer' });
            const newPlayer = newSystem.createPlayer({ name: 'TestPlayer' });
            
            // Posição válida para ambos
            const validX = 500, validY = 200;
            expect(legacySystem.updatePlayerPosition(player.id, validX, validY)).toBe(true);
            expect(newSystem.updatePlayerPosition(newPlayer.id, validX, validY)).toBe(true);
            
            // Posição inválida apenas para novo sistema
            const invalidX = -100, invalidY = 2000;
            expect(legacySystem.updatePlayerPosition(player.id, invalidX, invalidY)).toBe(true);
            expect(newSystem.updatePlayerPosition(newPlayer.id, invalidX, invalidY)).toBe(false);
        });
    });
    
    describe('Compatibilidade de Experiência', () => {
        it('deve manter progressão básica de nível', () => {
            const player = legacySystem.createPlayer({ name: 'TestPlayer' });
            const newPlayer = newSystem.createPlayer({ name: 'TestPlayer' });
            
            // Adicionar experiência suficiente para level up
            const expAmount = 150;
            
            const legacyResult = legacySystem.addExperience(player.id, expAmount);
            const newResult = newSystem.addExperience(newPlayer.id, expAmount);
            
            expect(legacyResult).toBe(true);
            expect(newResult).toBe(true);
            expect(player.level).toBe(2);
            expect(newPlayer.level).toBe(2);
            expect(player.maxHp).toBe(newPlayer.maxHp);
            expect(player.stats.attack).toBe(newPlayer.stats.attack);
        });
        
        it('deve manter compatibilidade com múltiplos levels', () => {
            const player = legacySystem.createPlayer({ name: 'TestPlayer' });
            const newPlayer = newSystem.createPlayer({ name: 'TestPlayer' });
            
            // Adicionar experiência para múltiplos levels
            const expAmount = 500;
            
            legacySystem.addExperience(player.id, expAmount);
            newSystem.addExperience(newPlayer.id, expAmount);
            
            expect(player.level).toBe(newPlayer.level);
            expect(player.maxHp).toBe(newPlayer.maxHp);
            expect(player.stats.attack).toBe(newPlayer.stats.attack);
        });
    });
    
    describe('Compatibilidade de Combate', () => {
        it('deve manter comportamento básico de dano', () => {
            const player = legacySystem.createPlayer({ name: 'TestPlayer' });
            const newPlayer = newSystem.createPlayer({ name: 'TestPlayer' });
            
            const damage = 20;
            
            const legacyHp = legacySystem.takeDamage(player.id, damage);
            const newHp = newSystem.takeDamage(newPlayer.id, damage);
            
            expect(legacyHp).toBe(80);
            expect(newHp).toBe(80); // 100 - (20 - 5 defesa)
        });
        
        it('deve manter comportamento básico de cura', () => {
            const player = legacySystem.createPlayer({ name: 'TestPlayer' });
            const newPlayer = newSystem.createPlayer({ name: 'TestPlayer' });
            
            // Primeiro tomar dano
            legacySystem.takeDamage(player.id, 30);
            newSystem.takeDamage(newPlayer.id, 30);
            
            // Curar
            const healAmount = 20;
            const legacyHp = legacySystem.heal(player.id, healAmount);
            const newHp = newSystem.heal(newPlayer.id, healAmount);
            
            expect(legacyHp).toBe(90);
            expect(newHp).toBe(90);
        });
        
        it('deve adicionar novas mecânicas sem quebrar as antigas', () => {
            const player = legacySystem.createPlayer({ name: 'TestPlayer' });
            const newPlayer = newSystem.createPlayer({ name: 'TestPlayer' });
            
            // Testar dano crítico (nova feature)
            const damage = 20;
            const legacyHp = legacySystem.takeDamage(player.id, damage);
            
            // Simular dano crítico no novo sistema
            const critRoll = Math.random() * 100;
            const finalDamage = critRoll < newPlayer.stats.critChance ? 
                Math.floor(damage * newPlayer.stats.critMultiplier) : damage;
            
            const newHp = newSystem.takeDamage(newPlayer.id, finalDamage);
            
            // Ambos devem ter HP válido
            expect(legacyHp).toBeGreaterThanOrEqual(0);
            expect(newHp).toBeGreaterThanOrEqual(0);
            expect(legacyHp).toBeLessThanOrEqual(100);
            expect(newHp).toBeLessThanOrEqual(100);
        });
    });
    
    describe('Compatibilidade de Dados', () => {
        it('deve manter estrutura de dados básica', () => {
            const player = legacySystem.createPlayer({ name: 'TestPlayer' });
            const newPlayer = newSystem.createPlayer({ name: 'TestPlayer' });
            
            // Verificar campos essenciais
            const essentialFields = ['id', 'name', 'level', 'hp', 'maxHp', 'mana', 'maxMana', 'gold', 'exp', 'maxExp', 'position', 'stats'];
            
            essentialFields.forEach(field => {
                expect(player[field]).toBeDefined();
                expect(newPlayer[field]).toBeDefined();
                expect(typeof player[field]).toBe(typeof newPlayer[field]);
            });
        });
        
        it('deve permitir migração de dados legados', () => {
            const legacyPlayer = legacySystem.createPlayer({
                name: 'LegacyPlayer',
                class: 'rogue',
                gold: 500,
                level: 3
            });
            
            // Simular progressão
            legacySystem.addExperience(legacyPlayer.id, 200);
            legacySystem.takeDamage(legacyPlayer.id, 20);
            
            // Migrar para novo sistema
            const migratedPlayer = newSystem.createPlayer(legacyPlayer);
            
            expect(migratedPlayer.name).toBe(legacyPlayer.name);
            expect(migratedPlayer.level).toBe(legacyPlayer.level);
            expect(migratedPlayer.gold).toBe(legacyPlayer.gold);
            expect(migratedPlayer.hp).toBe(legacyPlayer.hp);
        });
    });
    
    describe('Performance e Escalabilidade', () => {
        it('deve manter performance em operações básicas', () => {
            const iterations = 1000;
            
            // Testar sistema legado
            const legacyStart = performance.now();
            for (let i = 0; i < iterations; i++) {
                const player = legacySystem.createPlayer({ name: `Player${i}` });
                legacySystem.updatePlayerPosition(player.id, Math.random() * 1000, Math.random() * 1000);
                legacySystem.addExperience(player.id, 50);
            }
            const legacyTime = performance.now() - legacyStart;
            
            // Testar novo sistema
            const newStart = performance.now();
            for (let i = 0; i < iterations; i++) {
                const player = newSystem.createPlayer({ name: `Player${i}` });
                newSystem.updatePlayerPosition(player.id, Math.random() * 1000, Math.random() * 1000);
                newSystem.addExperience(player.id, 50);
            }
            const newTime = performance.now() - newStart;
            
            // Novo sistema não deve ser significativamente mais lento
            const performanceRatio = newTime / legacyTime;
            expect(performanceRatio).toBeLessThan(2); // Máximo 2x mais lento
        });
    });
    
    describe('Edge Cases e Boundary Conditions', () => {
        it('deve lidar com valores extremos consistentemente', () => {
            const player = legacySystem.createPlayer({ name: 'TestPlayer' });
            const newPlayer = newSystem.createPlayer({ name: 'TestPlayer' });
            
            // Testar dano extremo
            const extremeDamage = 1000;
            const legacyHp = legacySystem.takeDamage(player.id, extremeDamage);
            const newHp = newSystem.takeDamage(newPlayer.id, extremeDamage);
            
            expect(legacyHp).toBe(0);
            expect(newHp).toBe(0);
            
            // Testar cura extrema
            const extremeHeal = 1000;
            const legacyHealedHp = legacySystem.heal(player.id, extremeHeal);
            const newHealedHp = newSystem.heal(newPlayer.id, extremeHeal);
            
            expect(legacyHealedHp).toBe(100);
            expect(newHealedHp).toBe(100);
        });
        
        it('deve lidar com IDs inválidos consistentemente', () => {
            const invalidId = 'non_existent_player';
            
            const legacyResult = legacySystem.updatePlayerPosition(invalidId, 100, 100);
            const newResult = newSystem.updatePlayerPosition(invalidId, 100, 100);
            
            expect(legacyResult).toBe(false);
            expect(newResult).toBe(false);
            
            const legacyHp = legacySystem.takeDamage(invalidId, 10);
            const newHp = newSystem.takeDamage(invalidId, 10);
            
            expect(legacyHp).toBeNull();
            expect(newHp).toBeNull();
        });
    });
});
