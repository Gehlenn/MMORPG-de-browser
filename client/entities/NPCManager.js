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
            },
            // Guild Masters - NPCs de Job Change
            guild_master_warrior: {
                id: 'guild_master_warrior',
                name: 'Mestre Thorvald',
                type: 'guild_master',
                subtype: 'warrior',
                x: 150,
                y: 250,
                icon: '⚔️',
                color: '#8B0000',
                dialogue: [
                    'Saudações, jovem! Deseja seguir o caminho do Guerreiro?',
                    'Nossa guilda forja os guerreiros mais fortes!',
                    'Volte no nível 10 para sua primeira evolução.'
                ],
                jobInfo: {
                    baseClass: 'warrior',
                    availableAt: 10,
                    firstJobs: ['cavaleiro', 'berserker', 'templario'],
                    description: 'Especialistas em combate corpo a corpo e defesa.'
                }
            },
            guild_master_mage: {
                id: 'guild_master_mage',
                name: 'Arquimago Elara',
                type: 'guild_master',
                subtype: 'mage',
                x: 650,
                y: 250,
                icon: '🔮',
                color: '#4B0082',
                dialogue: [
                    'Bem-vindo à Torre Mística. Sente o poder?',
                    'A magia flui através de nós.',
                    'No nível 10, você poderá escolher sua especialização.'
                ],
                jobInfo: {
                    baseClass: 'mage',
                    availableAt: 10,
                    firstJobs: ['elementalista', 'arcano', 'conjurador'],
                    description: 'Mestres da magia arcana e elemental.'
                }
            },
            guild_master_rogue: {
                id: 'guild_master_rogue',
                name: 'Sombra Kaelen',
                type: 'guild_master',
                subtype: 'rogue',
                x: 400,
                y: 150,
                icon: '🗡️',
                color: '#2F4F4F',
                dialogue: [
                    'Shh... vem pelas sombras.',
                    'Procura as artes secretas?',
                    'No nível 10, você poderá se tornar Assassino, Ninja ou Ladrão Mestre.'
                ],
                jobInfo: {
                    baseClass: 'rogue',
                    availableAt: 10,
                    firstJobs: ['assassino', 'ninja', 'ladrao_mestre'],
                    description: 'Especialistas em furtividade e ataques surpresa.'
                }
            },
            guild_master_archer: {
                id: 'guild_master_archer',
                name: 'Ranger Sylas',
                type: 'guild_master',
                subtype: 'archer',
                x: 250,
                y: 350,
                icon: '🏹',
                color: '#228B22',
                dialogue: [
                    'A floresta me enviou.',
                    'Busca dominar o arco?',
                    'No nível 10, você poderá se tornar Caçador, Atirador ou Bardo.'
                ],
                jobInfo: {
                    baseClass: 'archer',
                    availableAt: 10,
                    firstJobs: ['cacador', 'atirador', 'bardo'],
                    description: 'Mestres do arco e da precisão à distância.'
                }
            },
            guild_master_druid: {
                id: 'guild_master_druid',
                name: 'Anciã Ysera',
                type: 'guild_master',
                subtype: 'druid',
                x: 550,
                y: 350,
                icon: '🌿',
                color: '#006400',
                dialogue: [
                    'A natureza sussurra seu nome.',
                    'Ouve a chamada da floresta?',
                    'No nível 10, você poderá se tornar Guardião, Feiticeiro Natural ou Xamã.'
                ],
                jobInfo: {
                    baseClass: 'druid',
                    availableAt: 10,
                    firstJobs: ['guardiao_florestal', 'feiticeiro_natural', 'xama'],
                    description: 'Guardiões da natureza e curandeiros.'
                }
            },
            guild_master_priest: {
                id: 'guild_master_priest',
                name: 'Alto Sacerdote Lucius',
                type: 'guild_master',
                subtype: 'priest',
                x: 200,
                y: 150,
                icon: '✨',
                color: '#FFD700',
                dialogue: [
                    'A luz divina brilha em você.',
                    'Busca servir aos deuses?',
                    'No nível 10, você poderá se tornar Santo, Paladino Sagrado ou Oráculo.'
                ],
                jobInfo: {
                    baseClass: 'priest',
                    availableAt: 10,
                    firstJobs: ['santo', 'paladino_sagrado', 'oraculo'],
                    description: 'Curandeiros e defensores da fé.'
                }
            },
            guild_master_warlock: {
                id: 'guild_master_warlock',
                name: 'Warlock Morvath',
                type: 'guild_master',
                subtype: 'warlock',
                x: 600,
                y: 150,
                icon: '💀',
                color: '#4B0082',
                dialogue: [
                    'Hehehe... deseja poder?',
                    'Poder tem seu preço...',
                    'No nível 10, você poderá se tornar Necromante, Mago Sombrio ou Invocador.'
                ],
                jobInfo: {
                    baseClass: 'warlock',
                    availableAt: 10,
                    firstJobs: ['necromante', 'mago_sombrio', 'invocador'],
                    description: 'Usuários de magia negra e invocações.'
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
            
            // Desenhar sprite do NPC ou ícone especial para Guild Masters
            if (npc.type === 'guild_master') {
                this.renderGuildMaster(ctx, npc, screenX, screenY);
            } else {
                this.spritesheetManager.drawSprite(ctx, 'npcs', npc.type, screenX - 16, screenY - 16);
            }
            
            // Desenhar nome do NPC
            ctx.fillStyle = npc.color || '#FFFFFF';
            ctx.font = npc.type === 'guild_master' ? 'bold 12px Arial' : '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(npc.name, screenX, screenY - 25);
            
            // Desenhar tipo/título para Guild Masters
            if (npc.type === 'guild_master' && npc.jobInfo) {
                ctx.fillStyle = '#888';
                ctx.font = '10px Arial';
                ctx.fillText(`[${npc.jobInfo.availableAt}+] ${npc.jobInfo.baseClass}`, screenX, screenY - 38);
            }
            
            // Desenhar indicador de interação
            if (npc.canInteract) {
                ctx.fillStyle = '#FFD700';
                ctx.font = 'bold 16px Arial';
                ctx.fillText('!', screenX, screenY - 45);
            }
        });
    }
    
    renderGuildMaster(ctx, npc, x, y) {
        const size = 24;
        const color = npc.color || '#888';
        
        // Aura glow effect
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, size);
        gradient.addColorStop(0, color + '44'); // 25% opacity
        gradient.addColorStop(0.5, color + '22'); // 13% opacity
        gradient.addColorStop(1, 'transparent');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw icon background circle
        ctx.fillStyle = color + '33';
        ctx.beginPath();
        ctx.arc(x, y, size/2, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw border
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, size/2, 0, Math.PI * 2);
        ctx.stroke();
        
        // Draw icon
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = color;
        ctx.fillText(npc.icon || '👤', x, y);
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
