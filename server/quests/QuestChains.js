/**
 * Quest Chains - Multi-step Story Quests
 * Manages connected quest sequences with narrative progression
 * Version 0.2.1 - Quest System Integration
 */

class QuestChains {
    constructor(questGenerator, database) {
        this.questGenerator = questGenerator;
        this.database = database;
        
        // Active quest chains
        this.activeChains = new Map();
        this.completedChains = new Map();
        this.chainTemplates = new Map();
        
        // Chain progression tracking
        this.playerProgress = new Map();
        
        // Initialize
        this.initializeChainTemplates();
    }
    
    initializeChainTemplates() {
        // Goblin Threat Chain - Beginner friendly
        this.addChainTemplate('goblin_threat', {
            name: 'Ameaça Goblin',
            description: 'Uma crescente ameaça goblin precisa ser eliminada antes que se torne um problema sério.',
            difficulty: 1,
            requiredLevel: { min: 1, max: 15 },
            estimatedTime: 120, // minutes
            rewards: {
                completionBonus: {
                    xp: 500,
                    gold: 200,
                    items: ['goblin_slayer_title', 'iron_dagger']
                }
            },
            quests: [
                {
                    step: 1,
                    templateId: 'kill_goblins',
                    customTitle: 'Primeiros Sinais',
                    customDescription: 'Os aldeões estão relatando avistamentos de goblins. Investigue a situação.',
                    customObjectives: [
                        { type: 'kill', target: 'goblin', amount: 8 }
                    ],
                    nextStepUnlock: 'Após eliminar os goblins, você descobre pistas sobre um acampamento maior.'
                },
                {
                    step: 2,
                    templateId: 'find_goblin_camp',
                    customTitle: 'Rastreamento do Acampamento',
                    customDescription: 'As pistas levam a um acampamento goblin nas proximidades. Encontre e investigue o local.',
                    customObjectives: [
                        { type: 'explore', target: 'goblin_camp', amount: 1 },
                        { type: 'discover', target: 'goblin_plans', amount: 3 }
                    ],
                    nextStepUnlock: 'Você descobre planos para um ataque maior e a localização do líder goblin.'
                },
                {
                    step: 3,
                    templateId: 'defeat_goblin_king',
                    customTitle: 'Confronto Final',
                    customDescription: 'O Rei Goblin está planejando um ataque à vila. Derrote-o antes que seja tarde demais!',
                    customObjectives: [
                        { type: 'kill', target: 'goblin_king', amount: 1 },
                        { type: 'kill', target: 'goblin_guard', amount: 3 }
                    ],
                    isFinalStep: true
                }
            ]
        });
        
        // Lost Explorer Chain - Exploration focused
        this.addChainTemplate('lost_explorer', {
            name: 'Explorador Perdido',
            description: 'Um famoso explorador desapareceu enquanto investigava ruínas antigas. Encontre-o e descubra o que aconteceu.',
            difficulty: 2,
            requiredLevel: { min: 10, max: 30 },
            estimatedTime: 180,
            rewards: {
                completionBonus: {
                    xp: 800,
                    gold: 400,
                    items: ['explorer_compass', 'ancient_map_fragment', 'reputation_explorers_guild']
                }
            },
            quests: [
                {
                    step: 1,
                    templateId: 'explore_area',
                    customTitle: 'Último Avistamento',
                    customDescription: 'O explorador foi visto pela última vez dirigindo-se às ruínas antigas. Comece sua busca pela área.',
                    customObjectives: [
                        { type: 'explore', target: 'ancient_ruins_entrance', amount: 1 },
                        { type: 'discover', target: 'explorer_trail', amount: 5 }
                    ],
                    nextStepUnlock: 'Você encontra pistas que sugerem que o explorador adentrou as ruínas.'
                },
                {
                    step: 2,
                    templateId: 'find_ruins',
                    customTitle: 'Dentro das Ruínas',
                    customDescription: 'Siga as pistas para dentro das ruínas antigas e procure por sinais do explorador.',
                    customObjectives: [
                        { type: 'explore', target: 'ruins_inner_chamber', amount: 1 },
                        { type: 'collect', target: 'explorer_journal', amount: 1 },
                        { type: 'kill', target: 'ruin_guardian', amount: 2 }
                    ],
                    nextStepUnlock: 'O diário revela que o explorador encontrou um artefato poderoso, mas foi capturado.'
                },
                {
                    step: 3,
                    templateId: 'recover_artifacts',
                    customTitle: 'Artefatos Perdidos',
                    customDescription: 'Recupere os artefatos antigos e encontre o explorador antes que os guardiões o sacrifiquem.',
                    customObjectives: [
                        { type: 'collect', target: 'ancient_artifact', amount: 3 },
                        { type: 'kill', target: 'ruin_high_priest', amount: 1 },
                        { type: 'escort', target: 'lost_explorer', amount: 1 }
                    ],
                    nextStepUnlock: 'O explorador está seguro, mas revela informações sobre um tesouro maior.'
                },
                {
                    step: 4,
                    templateId: 'return_to_society',
                    customTitle: 'Retorno Triunfante',
                    customDescription: 'Escolte o explorador de volta à civilização e entregue suas descobertas à guilda.',
                    customObjectives: [
                        { type: 'delivery', target: 'explorers_guild', location: 'main_city', amount: 1 },
                        { type: 'deliver', target: 'ancient_artifacts', location: 'museum', amount: 3 }
                    ],
                    isFinalStep: true
                }
            ]
        });
        
        // Master Craftsman Chain - Crafting progression
        this.addChainTemplate('master_craftsman', {
            name: 'Mestre Artesão',
            description: 'Torne-se um mestre artesão reconhecido em todo o reino, criando obras-primas lendárias.',
            difficulty: 3,
            requiredLevel: { min: 15, max: 50 },
            estimatedTime: 240,
            requirements: {
                skill: { type: 'blacksmithing', level: { min: 2 } }
            },
            rewards: {
                completionBonus: {
                    xp: 1200,
                    gold: 800,
                    items: ['master_hammer', 'crafting_title', 'unique_recipe_book'],
                    skills: { blacksmithing: 2 }
                }
            },
            quests: [
                {
                    step: 1,
                    templateId: 'collect_minerals',
                    customTitle: 'Materiais Raros',
                    customDescription: 'Para criar sua primeira obra-prima, você precisa de minerais raros das montanhas do norte.',
                    customObjectives: [
                        { type: 'collect', target: 'mythril_ore', amount: 5 },
                        { type: 'collect', target: 'rare_gems', amount: 3 }
                    ],
                    nextStepUnlock: 'Com os materiais em mãos, você está pronto para criar sua primeira obra-prima.'
                },
                {
                    step: 2,
                    templateId: 'craft_items',
                    customTitle: 'A Obra-Prima',
                    customDescription: 'Crie uma espada lendária usando os materiais raros que você coletou.',
                    customObjectives: [
                        { type: 'craft', target: 'mythril_sword', amount: 1 },
                        { type: 'craft', target: 'enchanted_armor', amount: 1 }
                    ],
                    nextStepUnlock: 'Sua obra-prima impressiona o mestre ferreiro, que lhe dá uma encomenda especial.'
                },
                {
                    step: 3,
                    templateId: 'deliver_masterwork',
                    customTitle: 'Encomenda Real',
                    customDescription: 'A nobreza ouviu falar de seu talento. Entregue suas criações ao castelo real.',
                    customObjectives: [
                        { type: 'delivery', target: 'royal_blacksmith', location: 'castle', amount: 1 },
                        { type: 'craft', target: 'royal_sword', amount: 2 }
                    ],
                    nextStepUnlock: 'O rei fica impressionado e lhe concede o título de Mestre Artesão.'
                },
                {
                    step: 4,
                    templateId: 'earn_recognition',
                    customTitle: 'Reconhecimento Real',
                    customDescription: 'Particiipe do torneio de artesãos para provar sua maestria perante todo o reino.',
                    customObjectives: [
                        { type: 'craft', target: 'tournament_piece', amount: 3 },
                        { type: 'win', target: 'crafting_tournament', amount: 1 }
                    ],
                    isFinalStep: true
                }
            ]
        });
        
        // Dragon Slayer Chain - Epic endgame content
        this.addChainTemplate('dragon_slayer', {
            name: 'Mata Dragões',
            description: 'Uma ameaça draconiana paira sobre o reino. Reúna aliados e enfrente o dragão antigo.',
            difficulty: 5,
            requiredLevel: { min: 40, max: 100 },
            estimatedTime: 300,
            requirements: {
                partySize: { min: 4 },
                completedChains: ['goblin_threat', 'lost_explorer']
            },
            rewards: {
                completionBonus: {
                    xp: 3000,
                    gold: 2000,
                    items: ['dragon_scale_armor', 'dragon_sword_legendary', 'dragon_slayer_title'],
                    skills: { dragon_lore: 1 },
                    reputation: { kingdom: 100, dragonslayers: 50 }
                }
            },
            quests: [
                {
                    step: 1,
                    templateId: 'investigate_dragon',
                    customTitle: 'Sinais do Dragão',
                    customDescription: 'Relatos de um dragão surgiram. Investigue as áreas afetadas para confirmar a ameaça.',
                    customObjectives: [
                        { type: 'explore', target: 'dragon_territory', amount: 3 },
                        { type: 'discover', target: 'dragon_evidence', amount: 5 },
                        { type: 'talk', target: 'dragon_witness', amount: 3 }
                    ],
                    nextStepUnlock: 'As evidências confirmam: um dragão antigo awakening. Você precisa de aliados.'
                },
                {
                    step: 2,
                    templateId: 'gather_allies',
                    customTitle: 'Exército de Heróis',
                    customDescription: 'Reúna um grupo de aventureiros corajosos para enfrentar o dragão.',
                    customObjectives: [
                        { type: 'recruit', target: 'warrior', amount: 1 },
                        { type: 'recruit', target: 'mage', amount: 1 },
                        { type: 'recruit', target: 'healer', amount: 1 },
                        { type: 'collect', target: 'dragon_slaying_equipment', amount: 5 }
                    ],
                    nextStepUnlock: 'Com seu grupo formado, é hora de encontrar o covil do dragão.'
                },
                {
                    step: 3,
                    templateId: 'find_dragon_lair',
                    customTitle: 'O Covil do Dragão',
                    customDescription: 'Localize o covil do dragão nas montanhas proibidas e prepare-se para o confronto.',
                    customObjectives: [
                        { type: 'explore', target: 'forbidden_mountains', amount: 1 },
                        { type: 'discover', target: 'dragon_lair_entrance', amount: 1 },
                        { type: 'kill', target: 'dragon_lair_guards', amount: 10 }
                    ],
                    nextStepUnlock: 'O caminho até o dragão está livre. A batalha final o espera.'
                },
                {
                    step: 4,
                    templateId: 'defeat_dragon',
                    customTitle: 'Confronto com o Dragão',
                    customDescription: 'Enfrente o dragão antigo em uma batalha épica que decidirá o destino do reino.',
                    customObjectives: [
                        { type: 'kill', target: 'ancient_dragon', amount: 1 },
                        { type: 'survive', target: 'dragon_breath', amount: 5 },
                        { type: 'protect', target: 'allies', amount: 3 }
                    ],
                    isFinalStep: true
                }
            ]
        });
        
        // Merchant Empire Chain - Economic focused
        this.addChainTemplate('merchant_empire', {
            name: 'Império Comercial',
            description: 'Construa um império comercial do zero, dominando o mercado e estabelecendo rotas de comércio lucrativas.',
            difficulty: 2,
            requiredLevel: { min: 5, max: 60 },
            estimatedTime: 200,
            rewards: {
                completionBonus: {
                    xp: 1000,
                    gold: 5000,
                    items: ['merchant_license_premium', 'trade_route_map', 'reputation_merchants_guild'],
                    skills: { trading: 2, negotiation: 1 }
                }
            },
            quests: [
                {
                    step: 1,
                    templateId: 'start_business',
                    customTitle: 'Primeiros Negócios',
                    customDescription: 'Comece sua carreira comercial estabelecendo uma pequena barraca de mercado.',
                    customObjectives: [
                        { type: 'craft', target: 'market_stall', amount: 1 },
                        { type: 'collect', target: 'starting_goods', amount: 20 },
                        { type: 'sell', target: 'goods', amount: 10 }
                    ],
                    nextStepUnlock: 'Seus negócios estão prosperando. Hora de expandir para novas rotas.'
                },
                {
                    step: 2,
                    templateId: 'establish_routes',
                    customTitle: 'Rotas Comerciais',
                    customDescription: 'Estabeleça rotas comerciais com outras cidades para expandir seus negócios.',
                    customObjectives: [
                        { type: 'delivery', target: 'trade_caravan', location: 'neighboring_town', amount: 3 },
                        { type: 'negotiate', target: 'trade_agreement', amount: 2 },
                        { type: 'collect', target: 'exotic_goods', amount: 15 }
                    ],
                    nextStepUnlock: 'Suas rotas estão estabelecidas. Agora é hora de dominar o mercado local.'
                },
                {
                    step: 3,
                    templateId: 'market_domination',
                    customTitle: 'Dominação do Mercado',
                    customDescription: 'Torne-se o principal comerciante da região controlando o mercado de bens essenciais.',
                    customObjectives: [
                        { type: 'buy', target: 'market_stall', amount: 3 },
                        { type: 'control', target: 'goods_market', amount: 50 },
                        { type: 'negotiate', target: 'monopoly_contract', amount: 1 }
                    ],
                    nextStepUnlock: 'Você domina o mercado local. O reino agora busca seus serviços.'
                },
                {
                    step: 4,
                    templateId: 'royal_contracts',
                    customTitle: 'Contratos Reais',
                    customDescription: 'Estabeleça contratos exclusivos com a coroa para fornecer bens ao exército e nobreza.',
                    customObjectives: [
                        { type: 'delivery', target: 'royal_supplies', location: 'castle', amount: 5 },
                        { type: 'negotiate', target: 'royal_contract', amount: 1 },
                        { type: 'establish', target: 'merchant_guild', amount: 1 }
                    ],
                    isFinalStep: true
                }
            ]
        });
    }
    
    // Chain template management
    addChainTemplate(chainId, template) {
        this.chainTemplates.set(chainId, {
            id: chainId,
            ...template,
            createdAt: Date.now()
        });
    }
    
    // Chain progression
    startQuestChain(playerId, chainId) {
        const template = this.chainTemplates.get(chainId);
        if (!template) {
            throw new Error(`Chain template not found: ${chainId}`);
        }
        
        // Check requirements
        const player = this.getPlayerData(playerId);
        if (!this.meetsChainRequirements(player, template)) {
            throw new Error('Player does not meet chain requirements');
        }
        
        // Check if already active
        if (this.activeChains.has(`${playerId}_${chainId}`)) {
            throw new Error('Chain already active for this player');
        }
        
        // Check if already completed
        if (this.completedChains.has(`${playerId}_${chainId}`)) {
            throw new Error('Chain already completed by this player');
        }
        
        const chain = {
            id: `${playerId}_${chainId}`,
            playerId: playerId,
            chainId: chainId,
            name: template.name,
            description: template.description,
            currentStep: 0,
            totalSteps: template.quests.length,
            startedAt: Date.now(),
            quests: [],
            completedSteps: [],
            state: 'active'
        };
        
        // Generate first quest
        const firstQuest = this.generateChainQuest(template, 0, player);
        if (firstQuest) {
            chain.quests.push(firstQuest);
            this.activeChains.set(chain.id, chain);
            
            // Initialize player progress
            if (!this.playerProgress.has(playerId)) {
                this.playerProgress.set(playerId, {
                    activeChains: [],
                    completedChains: [],
                    totalChainsCompleted: 0
                });
            }
            
            const progress = this.playerProgress.get(playerId);
            progress.activeChains.push(chainId);
            
            return chain;
        }
        
        return null;
    }
    
    generateChainQuest(template, stepIndex, player) {
        const questTemplate = template.quests[stepIndex];
        if (!questTemplate) {
            return null;
        }
        
        // Get the base template
        const baseTemplate = this.questGenerator.getQuestTemplate(questTemplate.templateId);
        if (!baseTemplate) {
            console.error(`Base template not found: ${questTemplate.templateId}`);
            return null;
        }
        
        // Create custom quest from chain step
        const quest = this.questGenerator.generateQuestFromTemplate(baseTemplate, player, {
            chainId: template.id,
            chainStep: stepIndex,
            isChainQuest: true
        });
        
        // Override with chain-specific customizations
        if (questTemplate.customTitle) {
            quest.title = questTemplate.customTitle;
        }
        
        if (questTemplate.customDescription) {
            quest.description = questTemplate.customDescription;
        }
        
        if (questTemplate.customObjectives) {
            quest.objectives = questTemplate.customObjectives.map((obj, index) => ({
                id: `objective_${index}`,
                description: this.questGenerator.generateObjectiveDescription(obj),
                ...obj
            }));
        }
        
        // Add chain metadata
        quest.chainId = template.id;
        quest.chainStep = stepIndex;
        quest.isChainQuest = true;
        quest.nextStepUnlock = questTemplate.nextStepUnlock;
        quest.isFinalStep = questTemplate.isFinalStep || false;
        
        return quest;
    }
    
    completeChainQuest(playerId, chainId, questId) {
        const chain = this.activeChains.get(`${playerId}_${chainId}`);
        if (!chain) {
            throw new Error('Chain not found for player');
        }
        
        const questIndex = chain.quests.findIndex(q => q.id === questId);
        if (questIndex === -1) {
            throw new Error('Quest not found in chain');
        }
        
        if (questIndex !== chain.currentStep) {
            throw new Error('Quest is not the current step in chain');
        }
        
        // Mark step as completed
        chain.completedSteps.push(questIndex);
        chain.currentStep++;
        
        // Check if chain is completed
        if (chain.currentStep >= chain.totalSteps) {
            return this.completeQuestChain(playerId, chainId);
        }
        
        // Generate next quest in chain
        const template = this.chainTemplates.get(chainId);
        const player = this.getPlayerData(playerId);
        const nextQuest = this.generateChainQuest(template, chain.currentStep, player);
        
        if (nextQuest) {
            chain.quests.push(nextQuest);
            
            // Update chain in storage
            this.activeChains.set(chain.id, chain);
            
            return {
                chain: chain,
                nextQuest: nextQuest,
                isCompleted: false
            };
        }
        
        return null;
    }
    
    completeQuestChain(playerId, chainId) {
        const chain = this.activeChains.get(`${playerId}_${chainId}`);
        if (!chain) {
            throw new Error('Chain not found for player');
        }
        
        const template = this.chainTemplates.get(chainId);
        
        // Mark chain as completed
        chain.state = 'completed';
        chain.completedAt = Date.now();
        
        // Move to completed chains
        this.completedChains.set(chain.id, chain);
        this.activeChains.delete(chain.id);
        
        // Update player progress
        const progress = this.playerProgress.get(playerId);
        if (progress) {
            progress.activeChains = progress.activeChains.filter(id => id !== chainId);
            progress.completedChains.push(chainId);
            progress.totalChainsCompleted++;
        }
        
        // Award completion bonus
        const completionBonus = template.rewards.completionBonus;
        if (completionBonus) {
            this.awardChainRewards(playerId, completionBonus);
        }
        
        return {
            chain: chain,
            rewards: completionBonus,
            isCompleted: true
        };
    }
    
    abandonQuestChain(playerId, chainId) {
        const chain = this.activeChains.get(`${playerId}_${chainId}`);
        if (!chain) {
            return false;
        }
        
        // Remove from active chains
        this.activeChains.delete(chain.id);
        
        // Update player progress
        const progress = this.playerProgress.get(playerId);
        if (progress) {
            progress.activeChains = progress.activeChains.filter(id => id !== chainId);
        }
        
        return true;
    }
    
    // Progress tracking
    getChainProgress(playerId, chainId) {
        const chain = this.activeChains.get(`${playerId}_${chainId}`) || 
                     this.completedChains.get(`${playerId}_${chainId}`);
        
        if (!chain) {
            return null;
        }
        
        return {
            chainId: chainId,
            name: chain.name,
            currentStep: chain.currentStep,
            totalSteps: chain.totalSteps,
            progress: (chain.currentStep / chain.totalSteps) * 100,
            state: chain.state,
            startedAt: chain.startedAt,
            completedAt: chain.completedAt
        };
    }
    
    getPlayerChains(playerId) {
        const activeChains = [];
        const completedChains = [];
        
        for (const [chainId, chain] of this.activeChains) {
            if (chain.playerId === playerId) {
                activeChains.push(this.getChainProgress(playerId, chain.chainId));
            }
        }
        
        for (const [chainId, chain] of this.completedChains) {
            if (chain.playerId === playerId) {
                completedChains.push(this.getChainProgress(playerId, chain.chainId));
            }
        }
        
        return {
            active: activeChains,
            completed: completedChains,
            totalCompleted: this.playerProgress.get(playerId)?.totalChainsCompleted || 0
        };
    }
    
    getAvailableChains(player) {
        const availableChains = [];
        
        for (const [chainId, template] of this.chainTemplates) {
            // Check if player meets requirements
            if (this.meetsChainRequirements(player, template)) {
                // Check if not already active or completed
                const chainKey = `${player.id}_${chainId}`;
                if (!this.activeChains.has(chainKey) && !this.completedChains.has(chainKey)) {
                    availableChains.push({
                        id: chainId,
                        name: template.name,
                        description: template.description,
                        difficulty: template.difficulty,
                        estimatedTime: template.estimatedTime,
                        totalSteps: template.quests.length,
                        requirements: template.requirements,
                        rewards: template.rewards
                    });
                }
            }
        }
        
        return availableChains;
    }
    
    // Utility methods
    meetsChainRequirements(player, template) {
        // Check level requirements
        if (template.requiredLevel) {
            const minLevel = template.requiredLevel.min || 0;
            const maxLevel = template.requiredLevel.max || Infinity;
            if (player.level < minLevel || player.level > maxLevel) {
                return false;
            }
        }
        
        // Check skill requirements
        if (template.requirements && template.requirements.skill) {
            const skill = template.requirements.skill;
            const playerSkill = player.skills[skill.type] || 0;
            const minSkill = skill.level.min || 0;
            const maxSkill = skill.level.max || Infinity;
            if (playerSkill < minSkill || playerSkill > maxSkill) {
                return false;
            }
        }
        
        // Check completed chain requirements
        if (template.requirements && template.requirements.completedChains) {
            const playerProgress = this.playerProgress.get(player.id);
            if (!playerProgress) return false;
            
            for (const requiredChain of template.requirements.completedChains) {
                if (!playerProgress.completedChains.includes(requiredChain)) {
                    return false;
                }
            }
        }
        
        return true;
    }
    
    awardChainRewards(playerId, rewards) {
        const player = this.getPlayerData(playerId);
        
        // Award XP
        if (rewards.xp) {
            player.gainExperience(rewards.xp);
        }
        
        // Award gold
        if (rewards.gold) {
            player.gold += rewards.gold;
        }
        
        // Award items
        if (rewards.items) {
            for (const item of rewards.items) {
                player.addToInventory({ id: item, quantity: 1 });
            }
        }
        
        // Award skills
        if (rewards.skills) {
            for (const [skillName, amount] of Object.entries(rewards.skills)) {
                player.skills[skillName] = (player.skills[skillName] || 0) + amount;
            }
        }
        
        // Award reputation
        if (rewards.reputation) {
            for (const [faction, amount] of Object.entries(rewards.reputation)) {
                player.reputation[faction] = (player.reputation[faction] || 0) + amount;
            }
        }
        
        // Save player data
        this.savePlayerData(player);
    }
    
    getPlayerData(playerId) {
        // This would typically fetch from database
        // For now, return a mock player object
        return {
            id: playerId,
            level: 25,
            gold: 1000,
            skills: { blacksmithing: 3 },
            reputation: { merchants: 50 },
            inventory: [],
            gainExperience: function(amount) { console.log(`Gained ${amount} XP`); },
            addToInventory: function(item) { console.log(`Added ${item.id} to inventory`); }
        };
    }
    
    savePlayerData(player) {
        // This would typically save to database
        console.log('Saving player data:', player.id);
    }
    
    // Public API
    getChainTemplate(chainId) {
        return this.chainTemplates.get(chainId);
    }
    
    getAllChainTemplates() {
        return Array.from(this.chainTemplates.values());
    }
    
    getActiveChains() {
        return Array.from(this.activeChains.values());
    }
    
    getCompletedChains() {
        return Array.from(this.completedChains.values());
    }
    
    // Statistics and analytics
    getChainStatistics() {
        const stats = {
            totalChains: this.chainTemplates.size,
            activeChains: this.activeChains.size,
            completedChains: this.completedChains.size,
            averageCompletionTime: 0,
            mostPopularChain: null,
            chainDifficultyDistribution: {}
        };
        
        // Calculate difficulty distribution
        for (const template of this.chainTemplates.values()) {
            const difficulty = template.difficulty;
            stats.chainDifficultyDistribution[difficulty] = 
                (stats.chainDifficultyDistribution[difficulty] || 0) + 1;
        }
        
        // Calculate average completion time
        let totalCompletionTime = 0;
        let completedCount = 0;
        
        for (const chain of this.completedChains.values()) {
            if (chain.startedAt && chain.completedAt) {
                totalCompletionTime += (chain.completedAt - chain.startedAt);
                completedCount++;
            }
        }
        
        if (completedCount > 0) {
            stats.averageCompletionTime = totalCompletionTime / completedCount;
        }
        
        return stats;
    }
    
    // Cleanup
    cleanup() {
        this.activeChains.clear();
        this.completedChains.clear();
        this.chainTemplates.clear();
        this.playerProgress.clear();
    }
}

export default QuestChains;
