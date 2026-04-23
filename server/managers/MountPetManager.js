/**
 * MountPetManager - Sistema de Montarias e Pets
 * 
 * Features:
 * - Montarias com diferentes velocidades e habilidades
 * - Pets de combate, coleta e cosméticos
 * - Sistema de invocação/despawning
 * - Buffs passivos de montarias/pets
 * - Estabilidade e stamina
 * - Customização de aparência
 */

class MountPetManager {
    constructor(server) {
        this.server = server;
        this.io = server.io;
        
        // Storage
        this.playerMounts = new Map(); // playerId -> { activeMount, ownedMounts[] }
        this.playerPets = new Map(); // playerId -> { activePet, ownedPets[] }
        this.activeEntities = new Map(); // entityId -> entity data
        
        // Mount/Pet database
        this.mountDatabase = this.initializeMountDatabase();
        this.petDatabase = this.initializePetDatabase();
        
        // Config
        this.config = {
            mountCooldown: 3000, // 3s between mount/dismount
            petSummonCooldown: 2000,
            maxMountsPerPlayer: 50,
            maxPetsPerPlayer: 20,
            summonRange: 50 // Range to summon pet to player
        };
        
        this.initialize();
    }
    
    initialize() {
        this.setupEventHandlers();
        this.startUpdateLoop();
        console.log('[MountPetManager] Sistema de montarias e pets inicializado');
    }
    
    initializeMountDatabase() {
        return {
            // Common mounts
            horse_brown: {
                id: 'horse_brown',
                name: 'Cavalo Castanho',
                type: 'ground',
                icon: '🐴',
                speedBonus: 0.3, // +30% speed
                rarity: 'common',
                stamina: 100,
                staminaRegen: 5,
                staminaDrain: 2,
                abilities: [],
                unlockRequirement: null,
                cost: 500
            },
            horse_white: {
                id: 'horse_white',
                name: 'Cavalo Branco',
                type: 'ground',
                icon: '🦄',
                speedBonus: 0.35,
                rarity: 'uncommon',
                stamina: 120,
                staminaRegen: 6,
                staminaDrain: 2,
                abilities: ['spirit_aura'],
                unlockRequirement: { level: 10 },
                cost: 2000
            },
            wolf_grey: {
                id: 'wolf_grey',
                name: 'Lobo Cinza',
                type: 'ground',
                icon: '🐺',
                speedBonus: 0.4,
                rarity: 'rare',
                stamina: 150,
                staminaRegen: 8,
                staminaDrain: 3,
                abilities: ['pack_leader', 'hunter_sense'],
                unlockRequirement: { achievement: 'monster_hunter' },
                cost: 5000
            },
            panther_black: {
                id: 'panther_black',
                name: 'Pantera Negra',
                type: 'ground',
                icon: '🐆',
                speedBonus: 0.5,
                rarity: 'epic',
                stamina: 180,
                staminaRegen: 10,
                staminaDrain: 3,
                abilities: ['shadow_step', 'stealth_ride'],
                unlockRequirement: { level: 30, achievement: 'elite_slayer' },
                cost: 15000
            },
            // Flying mounts
            griffin: {
                id: 'griffin',
                name: 'Grifo Dourado',
                type: 'flying',
                icon: '🦅',
                speedBonus: 0.6,
                flightSpeed: 2.0,
                rarity: 'legendary',
                stamina: 200,
                staminaRegen: 8,
                staminaDrain: 5,
                abilities: ['flight', 'aerial_dive', 'wind_gust'],
                unlockRequirement: { level: 40, quest: 'griffin_taming' },
                cost: 50000
            },
            dragon_whelp: {
                id: 'dragon_whelp',
                name: 'Draco Jovem',
                type: 'flying',
                icon: '🐉',
                speedBonus: 0.7,
                flightSpeed: 2.5,
                rarity: 'legendary',
                stamina: 250,
                staminaRegen: 10,
                staminaDrain: 6,
                abilities: ['flight', 'fire_breath', 'draconic_aura'],
                unlockRequirement: { level: 50, achievement: 'boss_bane' },
                cost: 100000
            },
            // Special mounts
            turtle_giant: {
                id: 'turtle_giant',
                name: 'Tartaruga Gigante',
                type: 'aquatic',
                icon: '🐢',
                speedBonus: 0.15,
                waterSpeed: 1.5,
                rarity: 'rare',
                stamina: 300,
                staminaRegen: 3,
                abilities: ['water_walk', 'shell_defense', 'aquatic_breathing'],
                unlockRequirement: { level: 20, zone: 'aurélia' },
                cost: 8000
            },
            mechanical_steed: {
                id: 'mechanical_steed',
                name: 'Corcel Mecânico',
                type: 'ground',
                icon: '🤖',
                speedBonus: 0.45,
                rarity: 'epic',
                stamina: 999, // Mechanical doesn't tire
                abilities: ['overdrive', 'repair_mode', 'steam_blast'],
                unlockRequirement: { profession: 'engineering', level: 300 },
                cost: 0 // Crafted
            }
        };
    }
    
    initializePetDatabase() {
        return {
            // Combat pets
            wolf_pup: {
                id: 'wolf_pup',
                name: 'Filhote de Lobo',
                type: 'combat',
                icon: '🐕',
                rarity: 'common',
                attack: 10,
                defense: 5,
                hp: 100,
                abilities: ['bite', 'howl'],
                loyalty: 100,
                unlockRequirement: null,
                cost: 300
            },
            bear_cub: {
                id: 'bear_cub',
                name: 'Filhote de Urso',
                type: 'combat',
                icon: '🐻',
                rarity: 'uncommon',
                attack: 15,
                defense: 15,
                hp: 200,
                abilities: ['claw', 'roar', 'thick_hide'],
                loyalty: 100,
                unlockRequirement: { level: 15 },
                cost: 1500
            },
            panther_young: {
                id: 'panther_young',
                name: 'Pantera Jovem',
                type: 'combat',
                icon: '🐈‍⬛',
                rarity: 'rare',
                attack: 25,
                defense: 10,
                hp: 150,
                abilities: ['pounce', 'rend', 'shadow_stalk'],
                loyalty: 80,
                unlockRequirement: { level: 25, achievement: 'monster_hunter' },
                cost: 4000
            },
            phoenix_chick: {
                id: 'phoenix_chick',
                name: 'Fênix Jovem',
                type: 'combat',
                icon: '🔥',
                rarity: 'epic',
                attack: 40,
                defense: 20,
                hp: 300,
                abilities: ['fire_bolt', 'rebirth', 'burning_aura', 'healing_flame'],
                loyalty: 100,
                unlockRequirement: { level: 40, quest: 'phoenix_egg' },
                cost: 25000
            },
            // Gathering pets
            squirrel: {
                id: 'squirrel',
                name: 'Esquilo Coletor',
                type: 'gathering',
                icon: '🐿️',
                rarity: 'common',
                gatheringSpeed: 0.2, // +20% gathering speed
                inventorySlots: 10,
                abilities: ['auto_gather', 'nut_finder'],
                loyalty: 100,
                unlockRequirement: null,
                cost: 200
            },
            mole: {
                id: 'mole',
                name: 'Toupeira Mineira',
                type: 'gathering',
                icon: '🦔',
                rarity: 'uncommon',
                gatheringSpeed: 0.3,
                miningBonus: 0.25,
                inventorySlots: 15,
                abilities: ['ore_sense', 'auto_mine', 'burrow'],
                loyalty: 100,
                unlockRequirement: { profession: 'mining', level: 50 },
                cost: 1000
            },
            fairy: {
                id: 'fairy',
                name: 'Fada Herbalista',
                type: 'gathering',
                icon: '🧚',
                rarity: 'rare',
                gatheringSpeed: 0.4,
                herbalismBonus: 0.3,
                inventorySlots: 20,
                abilities: ['herb_sense', 'auto_gather', 'healing_dust', 'growth_aura'],
                loyalty: 100,
                unlockRequirement: { profession: 'herbalism', level: 100 },
                cost: 3000
            },
            // Cosmetic pets
            cat: {
                id: 'cat',
                name: 'Gato',
                type: 'cosmetic',
                icon: '🐱',
                rarity: 'common',
                abilities: ['follow', 'sit', 'purr'],
                loyalty: 100,
                unlockRequirement: null,
                cost: 100
            },
            dog: {
                id: 'dog',
                name: 'Cachorro',
                type: 'cosmetic',
                icon: '🐕‍🦺',
                rarity: 'common',
                abilities: ['follow', 'sit', 'fetch', 'wag'],
                loyalty: 100,
                unlockRequirement: null,
                cost: 100
            },
            rabbit: {
                id: 'rabbit',
                name: 'Coelho',
                type: 'cosmetic',
                icon: '🐰',
                rarity: 'uncommon',
                abilities: ['follow', 'hop', 'burrow', 'lucky_charm'],
                loyalty: 100,
                unlockRequirement: { achievement: 'step_by_step' },
                cost: 500
            },
            dragon_whelp_pet: {
                id: 'dragon_whelp_pet',
                name: 'Dragonete',
                type: 'cosmetic',
                icon: '🦎',
                rarity: 'epic',
                abilities: ['follow', 'fly_around', 'fire_breath_mini', 'roar_tiny'],
                loyalty: 100,
                unlockRequirement: { level: 50, achievement: 'boss_bane' },
                cost: 20000
            }
        };
    }
    
    setupEventHandlers() {
        // Mount events
        this.server.on('mount:summon', (socket, data) => {
            this.handleMountSummon(socket, data);
        });
        
        this.server.on('mount:dismiss', (socket) => {
            this.handleMountDismiss(socket);
        });
        
        this.server.on('mount:get_list', (socket) => {
            this.handleGetMountList(socket);
        });
        
        this.server.on('mount:buy', (socket, data) => {
            this.handleBuyMount(socket, data);
        });
        
        // Pet events
        this.server.on('pet:summon', (socket, data) => {
            this.handlePetSummon(socket, data);
        });
        
        this.server.on('pet:dismiss', (socket) => {
            this.handlePetDismiss(socket);
        });
        
        this.server.on('pet:get_list', (socket) => {
            this.handleGetPetList(socket);
        });
        
        this.server.on('pet:buy', (socket, data) => {
            this.handleBuyPet(socket, data);
        });
        
        this.server.on('pet:command', (socket, data) => {
            this.handlePetCommand(socket, data);
        });
    }
    
    // ===== MOUNT OPERATIONS =====
    
    handleMountSummon(socket, data) {
        const player = this.server.players.get(socket.playerId);
        if (!player) return;
        
        const { mountId } = data;
        const playerData = this.getOrCreatePlayerMounts(socket.playerId);
        
        // Check if player owns this mount
        if (!playerData.ownedMounts.includes(mountId)) {
            socket.emit('mountpet:error', { message: 'Você não possui esta montaria!' });
            return;
        }
        
        // Check cooldown
        if (playerData.lastMountTime && Date.now() - playerData.lastMountTime < this.config.mountCooldown) {
            socket.emit('mountpet:error', { message: 'Aguarde o cooldown da montaria!' });
            return;
        }
        
        const mountDef = this.mountDatabase[mountId];
        if (!mountDef) {
            socket.emit('mountpet:error', { message: 'Montaria não encontrada!' });
            return;
        }
        
        // Dismiss current mount if any
        if (playerData.activeMount) {
            this.dismissMount(socket.playerId);
        }
        
        // Dismiss active pet (can't have both)
        const playerPets = this.playerPets.get(socket.playerId);
        if (playerPets?.activePet) {
            this.dismissPet(socket.playerId);
        }
        
        // Activate mount
        const entityId = `mount_${socket.playerId}_${Date.now()}`;
        playerData.activeMount = {
            entityId,
            mountId,
            stamina: mountDef.stamina,
            maxStamina: mountDef.stamina,
            summonedAt: Date.now()
        };
        playerData.lastMountTime = Date.now();
        
        this.activeEntities.set(entityId, {
            type: 'mount',
            ownerId: socket.playerId,
            mountId,
            position: { x: player.x || 0, y: player.y || 0 },
            velocity: { x: 0, y: 0 }
        });
        
        // Apply speed buff
        const speedMultiplier = 1 + mountDef.speedBonus;
        
        socket.emit('mount:summoned', {
            entityId,
            mount: mountDef,
            speedMultiplier,
            stamina: playerData.activeMount.stamina
        });
        
        // Notify nearby players
        this.io.to(`zone:${player.zone || 'default'}`).emit('mount:spawned', {
            entityId,
            ownerId: socket.playerId,
            ownerName: player.name,
            mount: {
                id: mountDef.id,
                name: mountDef.name,
                icon: mountDef.icon,
                type: mountDef.type
            },
            position: { x: player.x || 0, y: player.y || 0 }
        });
        
        console.log(`[MountPetManager] ${player.name} montou ${mountDef.name}`);
    }
    
    handleMountDismiss(socket) {
        const player = this.server.players.get(socket.playerId);
        if (!player) return;
        
        const dismissed = this.dismissMount(socket.playerId);
        if (dismissed) {
            socket.emit('mount:dismissed');
        }
    }
    
    dismissMount(playerId) {
        const playerData = this.playerMounts.get(playerId);
        if (!playerData?.activeMount) return false;
        
        const entityId = playerData.activeMount.entityId;
        this.activeEntities.delete(entityId);
        
        playerData.activeMount = null;
        
        // Notify nearby players
        const player = this.server.players.get(playerId);
        if (player) {
            this.io.to(`zone:${player.zone || 'default'}`).emit('mount:despawned', { entityId });
        }
        
        return true;
    }
    
    handleGetMountList(socket) {
        const playerData = this.getOrCreatePlayerMounts(socket.playerId);
        
        const mounts = playerData.ownedMounts.map(id => ({
            ...this.mountDatabase[id],
            owned: true
        }));
        
        // Add available mounts for purchase
        const availableMounts = Object.values(this.mountDatabase)
            .filter(m => !playerData.ownedMounts.includes(m.id))
            .map(m => ({ ...m, owned: false }));
        
        socket.emit('mount:list', {
            owned: mounts,
            available: availableMounts,
            activeMount: playerData.activeMount
        });
    }
    
    handleBuyMount(socket, data) {
        const player = this.server.players.get(socket.playerId);
        if (!player) return;
        
        const { mountId } = data;
        const mountDef = this.mountDatabase[mountId];
        
        if (!mountDef) {
            socket.emit('mountpet:error', { message: 'Montaria não encontrada!' });
            return;
        }
        
        const playerData = this.getOrCreatePlayerMounts(socket.playerId);
        
        // Check if already owned
        if (playerData.ownedMounts.includes(mountId)) {
            socket.emit('mountpet:error', { message: 'Você já possui esta montaria!' });
            return;
        }
        
        // Check requirements
        if (!this.checkRequirements(player, mountDef.unlockRequirement)) {
            socket.emit('mountpet:error', { message: 'Requisitos não atendidos!' });
            return;
        }
        
        // Check gold
        if ((player.gold || 0) < mountDef.cost) {
            socket.emit('mountpet:error', { message: `Ouro insuficiente! Necessário: ${mountDef.cost}g` });
            return;
        }
        
        // Deduct gold
        player.gold -= mountDef.cost;
        
        // Add to collection
        playerData.ownedMounts.push(mountId);
        
        socket.emit('mount:purchased', { mountId, mount: mountDef });
        
        console.log(`[MountPetManager] ${player.name} comprou ${mountDef.name}`);
    }
    
    // ===== PET OPERATIONS =====
    
    handlePetSummon(socket, data) {
        const player = this.server.players.get(socket.playerId);
        if (!player) return;
        
        const { petId } = data;
        const playerData = this.getOrCreatePlayerPets(socket.playerId);
        
        // Check if player owns this pet
        if (!playerData.ownedPets.includes(petId)) {
            socket.emit('mountpet:error', { message: 'Você não possui este pet!' });
            return;
        }
        
        // Check cooldown
        if (playerData.lastPetTime && Date.now() - playerData.lastPetTime < this.config.petSummonCooldown) {
            socket.emit('mountpet:error', { message: 'Aguarde o cooldown do pet!' });
            return;
        }
        
        const petDef = this.petDatabase[petId];
        if (!petDef) {
            socket.emit('mountpet:error', { message: 'Pet não encontrado!' });
            return;
        }
        
        // Dismiss current pet if any
        if (playerData.activePet) {
            this.dismissPet(socket.playerId);
        }
        
        // Activate pet
        const entityId = `pet_${socket.playerId}_${Date.now()}`;
        playerData.activePet = {
            entityId,
            petId,
            hp: petDef.hp,
            maxHp: petDef.hp,
            loyalty: petDef.loyalty,
            summonedAt: Date.now()
        };
        playerData.lastPetTime = Date.now();
        
        this.activeEntities.set(entityId, {
            type: 'pet',
            ownerId: socket.playerId,
            petId,
            position: { x: (player.x || 0) - 30, y: (player.y || 0) },
            state: 'follow',
            target: null
        });
        
        socket.emit('pet:summoned', {
            entityId,
            pet: petDef,
            hp: playerData.activePet.hp,
            loyalty: playerData.activePet.loyalty
        });
        
        // Notify nearby players
        this.io.to(`zone:${player.zone || 'default'}`).emit('pet:spawned', {
            entityId,
            ownerId: socket.playerId,
            ownerName: player.name,
            pet: {
                id: petDef.id,
                name: petDef.name,
                icon: petDef.icon,
                type: petDef.type
            },
            position: { x: (player.x || 0) - 30, y: (player.y || 0) }
        });
        
        console.log(`[MountPetManager] ${player.name} invocou ${petDef.name}`);
    }
    
    handlePetDismiss(socket) {
        const dismissed = this.dismissPet(socket.playerId);
        if (dismissed) {
            socket.emit('pet:dismissed');
        }
    }
    
    dismissPet(playerId) {
        const playerData = this.playerPets.get(playerId);
        if (!playerData?.activePet) return false;
        
        const entityId = playerData.activePet.entityId;
        this.activeEntities.delete(entityId);
        
        playerData.activePet = null;
        
        // Notify nearby players
        const player = this.server.players.get(playerId);
        if (player) {
            this.io.to(`zone:${player.zone || 'default'}`).emit('pet:despawned', { entityId });
        }
        
        return true;
    }
    
    handleGetPetList(socket) {
        const playerData = this.getOrCreatePlayerPets(socket.playerId);
        
        const pets = playerData.ownedPets.map(id => ({
            ...this.petDatabase[id],
            owned: true
        }));
        
        const availablePets = Object.values(this.petDatabase)
            .filter(p => !playerData.ownedPets.includes(p.id))
            .map(p => ({ ...p, owned: false }));
        
        socket.emit('pet:list', {
            owned: pets,
            available: availablePets,
            activePet: playerData.activePet
        });
    }
    
    handleBuyPet(socket, data) {
        const player = this.server.players.get(socket.playerId);
        if (!player) return;
        
        const { petId } = data;
        const petDef = this.petDatabase[petId];
        
        if (!petDef) {
            socket.emit('mountpet:error', { message: 'Pet não encontrado!' });
            return;
        }
        
        const playerData = this.getOrCreatePlayerPets(socket.playerId);
        
        // Check if already owned
        if (playerData.ownedPets.includes(petId)) {
            socket.emit('mountpet:error', { message: 'Você já possui este pet!' });
            return;
        }
        
        // Check requirements
        if (!this.checkRequirements(player, petDef.unlockRequirement)) {
            socket.emit('mountpet:error', { message: 'Requisitos não atendidos!' });
            return;
        }
        
        // Check gold
        if ((player.gold || 0) < petDef.cost) {
            socket.emit('mountpet:error', { message: `Ouro insuficiente! Necessário: ${petDef.cost}g` });
            return;
        }
        
        // Deduct gold
        player.gold -= petDef.cost;
        
        // Add to collection
        playerData.ownedPets.push(petId);
        
        socket.emit('pet:purchased', { petId, pet: petDef });
        
        console.log(`[MountPetManager] ${player.name} comprou ${petDef.name}`);
    }
    
    handlePetCommand(socket, data) {
        const { command, targetId } = data;
        const playerData = this.playerPets.get(socket.playerId);
        
        if (!playerData?.activePet) {
            socket.emit('mountpet:error', { message: 'Nenhum pet ativo!' });
            return;
        }
        
        const entity = this.activeEntities.get(playerData.activePet.entityId);
        if (!entity) return;
        
        switch (command) {
            case 'follow':
                entity.state = 'follow';
                entity.target = null;
                break;
            case 'stay':
                entity.state = 'stay';
                entity.target = null;
                break;
            case 'attack':
                if (targetId) {
                    entity.state = 'attack';
                    entity.target = targetId;
                }
                break;
            case 'gather':
                if (entity.petId && this.petDatabase[entity.petId]?.type === 'gathering') {
                    entity.state = 'gather';
                }
                break;
        }
        
        socket.emit('pet:command_ack', { command, entityId: entity.entityId });
    }
    
    // ===== UTILITIES =====
    
    getOrCreatePlayerMounts(playerId) {
        if (!this.playerMounts.has(playerId)) {
            this.playerMounts.set(playerId, {
                playerId,
                ownedMounts: ['horse_brown'], // Starter mount
                activeMount: null,
                lastMountTime: 0
            });
        }
        return this.playerMounts.get(playerId);
    }
    
    getOrCreatePlayerPets(playerId) {
        if (!this.playerPets.has(playerId)) {
            this.playerPets.set(playerId, {
                playerId,
                ownedPets: ['squirrel'], // Starter pet
                activePet: null,
                lastPetTime: 0
            });
        }
        return this.playerPets.get(playerId);
    }
    
    checkRequirements(player, requirements) {
        if (!requirements) return true;
        
        if (requirements.level && player.level < requirements.level) {
            return false;
        }
        
        if (requirements.achievement) {
            // Check achievement - would integrate with AchievementManager
            // For now, assume unlocked
        }
        
        if (requirements.profession && requirements.level) {
            // Check profession level
            const profLevel = player.professions?.[requirements.profession] || 0;
            if (profLevel < requirements.level) return false;
        }
        
        return true;
    }
    
    // ===== UPDATE LOOP =====
    
    startUpdateLoop() {
        setInterval(() => {
            this.updateEntities();
        }, 100); // Update 10 times per second
    }
    
    updateEntities() {
        for (const [entityId, entity] of this.activeEntities) {
            if (entity.type === 'mount') {
                this.updateMount(entity);
            } else if (entity.type === 'pet') {
                this.updatePet(entity);
            }
        }
    }
    
    updateMount(entity) {
        const player = this.server.players.get(entity.ownerId);
        if (!player) {
            this.dismissMount(entity.ownerId);
            return;
        }
        
        // Update mount position to follow player
        entity.position.x = player.x || 0;
        entity.position.y = player.y || 0;
        
        // Stamina management
        const playerData = this.playerMounts.get(entity.ownerId);
        if (playerData?.activeMount) {
            const mountDef = this.mountDatabase[entity.mountId];
            const mount = playerData.activeMount;
            
            // Drain stamina when moving
            if (player.isMoving) {
                mount.stamina = Math.max(0, mount.stamina - mountDef.staminaDrain * 0.1);
            } else {
                // Regen when stationary
                mount.stamina = Math.min(mount.maxStamina, mount.stamina + mountDef.staminaRegen * 0.1);
            }
            
            // Dismount if out of stamina
            if (mount.stamina <= 0) {
                this.dismissMount(entity.ownerId);
                const socket = this.getSocketByPlayerId(entity.ownerId);
                if (socket) {
                    socket.emit('mount:out_of_stamina');
                }
            }
        }
    }
    
    updatePet(entity) {
        const player = this.server.players.get(entity.ownerId);
        if (!player) {
            this.dismissPet(entity.ownerId);
            return;
        }
        
        const petDef = this.petDatabase[entity.petId];
        
        switch (entity.state) {
            case 'follow':
                // Pet follows player at a distance
                const targetX = (player.x || 0) - 30;
                const targetY = (player.y || 0);
                
                const dx = targetX - entity.position.x;
                const dy = targetY - entity.position.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist > 5) {
                    const speed = 3;
                    entity.position.x += (dx / dist) * speed;
                    entity.position.y += (dy / dist) * speed;
                }
                break;
                
            case 'attack':
                // Pet attacks target
                if (entity.target) {
                    // Attack logic would go here
                }
                break;
                
            case 'gather':
                // Gathering pet auto-gathers nearby resources
                break;
        }
    }
    
    getSocketByPlayerId(playerId) {
        // Placeholder - would need actual socket lookup
        return null;
    }
    
    // ===== API =====
    
    getPlayerActiveMount(playerId) {
        const playerData = this.playerMounts.get(playerId);
        return playerData?.activeMount;
    }
    
    getPlayerActivePet(playerId) {
        const playerData = this.playerPets.get(playerId);
        return playerData?.activePet;
    }
    
    getEntityPosition(entityId) {
        return this.activeEntities.get(entityId)?.position;
    }
    
    getMountSpeedMultiplier(playerId) {
        const mount = this.getPlayerActiveMount(playerId);
        if (!mount) return 1;
        
        const mountDef = this.mountDatabase[mount.mountId];
        return 1 + (mountDef?.speedBonus || 0);
    }
    
    getPetBonuses(playerId) {
        const pet = this.getPlayerActivePet(playerId);
        if (!pet) return {};
        
        const petDef = this.petDatabase[pet.petId];
        const bonuses = {};
        
        if (petDef.gatheringSpeed) {
            bonuses.gatheringSpeed = petDef.gatheringSpeed;
        }
        if (petDef.miningBonus) {
            bonuses.miningBonus = petDef.miningBonus;
        }
        if (petDef.herbalismBonus) {
            bonuses.herbalismBonus = petDef.herbalismBonus;
        }
        
        return bonuses;
    }
}

module.exports = MountPetManager;
