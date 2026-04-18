/**
 * NPC Manager - Sistema de Gerenciamento de NPCs
 * Cria e gerencia NPCs no mundo do jogo
 */

class NPCManager {
    constructor(spritesheetManager) {
        this.npcs = new Map();
        this.spritesheetManager = spritesheetManager;
        this.interactionDistance = 50;
        
        // Definir NPCs predefinidos
        this.npcTemplates = {
            merchant: {
                id: 'merchant_001',
                name: 'Vendedor de Armas',
                type: 'merchant',
                x: 200,
                y: 200,
                dialogue: [
                    'Bem-vindo, aventureiro!',
                    'Tenho as melhores armas do reino.',
                    'Deseja comprar alguma coisa?'
                ],
                shop: [
                    { id: 'sword_001', name: 'Espada de Ferro', price: 100, damage: 15 },
                    { id: 'shield_001', name: 'Escudo de Madeira', price: 50, defense: 5 },
                    { id: 'potion_001', name: 'Poção de Cura', price: 25, heal: 50 }
                ]
            },
            guard: {
                id: 'guard_001',
                name: 'Guarda da Cidade',
                type: 'guard',
                x: 400,
                y: 150,
                dialogue: [
                    'Pare! Quem vai aí?',
                    'Esta é uma cidade pacífica.',
                    'Mantenha a ordem, por favor.'
                ]
            },
            villager: {
                id: 'villager_001',
                name: 'Aldeão',
                type: 'villager',
                x: 600,
                y: 300,
                dialogue: [
                    'Olá, forasteiro!',
                    'Nossa cidade é pacata e próspera.',
                    'Cuidado com os monstros nas redondezas.'
                ]
            },
            quest_giver: {
                id: 'quest_giver_001',
                name: 'Mestre de Guilda',
                type: 'quest_giver',
                x: 300,
                y: 400,
                dialogue: [
                    'Ah, um novo aventureiro!',
                    'Tenho uma missão para você.',
                    'Preciso que derrote 5 goblins.'
                ],
                quest: {
                    id: 'quest_001',
                    name: 'Caça aos Goblins',
                    description: 'Derrote 5 goblins e retorne para recompensa.',
                    target: 'goblin',
                    count: 5,
                    reward: { gold: 100, exp: 50 }
                }
            }
        };
        
        this.initializeNPCs();
    }
    
    initializeNPCs() {
        console.log('👥 Inicializando NPCs...');
        
        Object.values(this.npcTemplates).forEach(template => {
            const npc = {
                ...template,
                currentDialogue: 0,
                isActive: true,
                interactionCooldown: 0
            };
            
            this.npcs.set(npc.id, npc);
            console.log(`✅ NPC criado: ${npc.name} (${npc.type})`);
        });
        
        console.log(`✅ ${this.npcs.size} NPCs inicializados`);
    }
    
    update(deltaTime, player) {
        this.npcs.forEach(npc => {
            if (!npc.isActive) return;
            
            // Atualizar cooldown de interação
            if (npc.interactionCooldown > 0) {
                npc.interactionCooldown -= deltaTime;
            }
            
            // Verificar proximidade com player
            const distance = this.getDistance(player, npc);
            if (distance <= this.interactionDistance && npc.interactionCooldown <= 0) {
                // NPC pode interagir
                npc.canInteract = true;
            } else {
                npc.canInteract = false;
            }
        });
    }
    
    render(ctx, camera) {
        this.npcs.forEach(npc => {
            if (!npc.isActive) return;
            
            // Calcular posição relativa à câmera
            const screenX = npc.x - camera.x + camera.width / 2;
            const screenY = npc.y - camera.y + camera.height / 2;
            
            // Desenhar sprite do NPC
            this.spritesheetManager.drawSprite(ctx, 'npcs', npc.type, screenX - 16, screenY - 16);
            
            // Desenhar nome do NPC
            ctx.fillStyle = '#FFFFFF';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(npc.name, screenX, screenY - 20);
            
            // Desenhar indicador de interação
            if (npc.canInteract) {
                ctx.fillStyle = '#FFD700';
                ctx.font = 'bold 16px Arial';
                ctx.fillText('!', screenX, screenY - 30);
            }
        });
    }
    
    interact(npcId, player) {
        const npc = this.npcs.get(npcId);
        if (!npc || !npc.canInteract) return null;
        
        // Configurar cooldown
        npc.interactionCooldown = 1000; // 1 segundo
        
        // Retornar dados de interação
        return {
            npc: npc,
            dialogue: npc.dialogue[npc.currentDialogue] || npc.dialogue[0],
            quest: npc.quest,
            shop: npc.shop
        };
    }
    
    advanceDialogue(npcId) {
        const npc = this.npcs.get(npcId);
        if (!npc) return;
        
        npc.currentDialogue = (npc.currentDialogue + 1) % npc.dialogue.length;
    }
    
    completeQuest(npcId, player) {
        const npc = this.npcs.get(npcId);
        if (!npc || !npc.quest) return false;
        
        // Lógica de completar quest
        console.log(`🎯 Quest completada: ${npc.quest.name}`);
        
        // Dar recompensa ao player
        if (npc.quest.reward) {
            if (npc.quest.reward.gold) {
                player.gold = (player.gold || 0) + npc.quest.reward.gold;
            }
            if (npc.quest.reward.exp) {
                player.exp = (player.exp || 0) + npc.quest.reward.exp;
            }
        }
        
        // Marcar quest como completada
        npc.quest.completed = true;
        
        return true;
    }
    
    buyItem(npcId, itemId, player) {
        const npc = this.npcs.get(npcId);
        if (!npc || !npc.shop) return false;
        
        const item = npc.shop.find(item => item.id === itemId);
        if (!item) return false;
        
        // Verificar se player tem ouro suficiente
        if ((player.gold || 0) < item.price) {
            return { success: false, message: 'Ouro insuficiente!' };
        }
        
        // Remover ouro e adicionar item
        player.gold -= item.price;
        if (!player.inventory) player.inventory = [];
        player.inventory.push(item);
        
        console.log(`🛒 Item comprado: ${item.name} por ${item.price} de ouro`);
        
        return { success: true, item, message: `${item.name} comprado!` };
    }
    
    getDistance(entity1, entity2) {
        const dx = entity1.x - entity2.x;
        const dy = entity1.y - entity2.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    getNPCsInArea(x, y, width, height) {
        const npcsInArea = [];
        
        this.npcs.forEach(npc => {
            if (!npc.isActive) return;
            
            if (npc.x >= x && npc.x <= x + width &&
                npc.y >= y && npc.y <= y + height) {
                npcsInArea.push(npc);
            }
        });
        
        return npcsInArea;
    }
    
    getNPCById(npcId) {
        return this.npcs.get(npcId);
    }
    
    getAllNPCs() {
        return Array.from(this.npcs.values());
    }
    
    spawnNPC(template, x, y) {
        const npc = {
            ...template,
            id: `npc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            x: x,
            y: y,
            currentDialogue: 0,
            isActive: true,
            interactionCooldown: 0
        };
        
        this.npcs.set(npc.id, npc);
        return npc;
    }
    
    removeNPC(npcId) {
        const npc = this.npcs.get(npcId);
        if (npc) {
            npc.isActive = false;
            this.npcs.delete(npcId);
            console.log(`🗑️ NPC removido: ${npc.name}`);
        }
    }
}

// Exportar para uso global
window.NPCManager = NPCManager;
