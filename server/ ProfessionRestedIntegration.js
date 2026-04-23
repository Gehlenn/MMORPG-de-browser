/**
 * ProfessionRestedIntegration - Integração segura dos sistemas de Profissão e XP Rested
 * 
 * Este arquivo estende o MMOServer com funcionalidades de:
 * - ProfessionSystem (New World style)
 * - RestedXpSystem (WoW style)
 * 
 * Uso: Adicionar ao final do constructor do MMOServer:
 *   new ProfessionRestedIntegration(this);
 */

const ProfessionSystem = require('./managers/ProfessionSystem.js');
const RestedXpSystem = require('./managers/RestedXpSystem.js');

class ProfessionRestedIntegration {
    constructor(server) {
        this.server = server;
        
        // Inicializar sistemas
        this.initSystems();
        
        // Registrar handlers de socket
        this.registerSocketHandlers();
        
        // Registrar hooks de login/logout
        this.registerHooks();
        
        console.log('[ProfessionRestedIntegration] Sistemas integrados com sucesso');
    }
    
    initSystems() {
        // ProfessionSystem
        this.server.professionSystem = new ProfessionSystem(
            this.server.playerDataManager,
            this.server.itemDatabase
        );
        
        // RestedXpSystem
        this.server.restedXpSystem = new RestedXpSystem(
            this.server.playerDataManager
        );
        
        // Inicializar
        if (this.server.professionSystem.initialize) {
            this.server.professionSystem.initialize();
        }
        if (this.server.restedXpSystem.initialize) {
            this.server.restedXpSystem.initialize();
        }
    }
    
    registerSocketHandlers() {
        const originalSetupHandlers = this.server.setupPlayerEventHandlers.bind(this.server);
        
        this.server.setupPlayerEventHandlers = (socket) => {
            // Chamar handler original
            originalSetupHandlers(socket);
            
            // Registrar handlers adicionais
            this.registerProfessionHandlers(socket);
            this.registerRestedXpHandlers(socket);
        };
    }
    
    registerProfessionHandlers(socket) {
        // Gather resource (mining, logging, harvesting, etc.)
        socket.on('profession:gather', (data) => {
            this.handleGather(socket, data);
        });
        
        // Craft item
        socket.on('profession:craft', (data) => {
            this.handleCraft(socket, data);
        });
        
        // Get profession info
        socket.on('profession:get_info', () => {
            this.sendProfessionInfo(socket);
        });
        
        // Refine material
        socket.on('profession:refine', (data) => {
            this.handleRefine(socket, data);
        });
    }
    
    registerRestedXpHandlers(socket) {
        // Get rested XP status
        socket.on('rested_xp:get_status', () => {
            this.sendRestedStatus(socket);
        });
    }
    
    registerHooks() {
        // Hook no login para acumular XP rested
        const originalHandleLogin = this.server.handlePlayerConnection.bind(this.server);
        
        this.server.handlePlayerConnection = (socket) => {
            originalHandleLogin(socket);
            
            // Acumular XP rested após login (delay para não sobrecarregar)
            setTimeout(() => {
                const player = this.server.players.get(socket.id);
                if (player && this.server.restedXpSystem) {
                    this.server.restedXpSystem.onPlayerLogin(player.name);
                }
            }, 2000);
        };
        
        // Hook no logout para salvar estado de rested
        const originalHandleDisconnect = this.server.handlePlayerDisconnection.bind(this.server);
        
        this.server.handlePlayerDisconnection = (socket) => {
            const player = this.server.players.get(socket.id);
            if (player && this.server.restedXpSystem) {
                this.server.restedXpSystem.onPlayerLogout(player.name);
            }
            
            originalHandleDisconnect(socket);
        };
    }
    
    // ===== HANDLERS =====
    
    handleGather(socket, data) {
        const player = this.server.players.get(socket.id);
        if (!player) {
            socket.emit('profession:gather_result', {
                success: false,
                error: 'Player not found'
            });
            return;
        }
        
        const { nodeId, position } = data;
        
        if (this.server.professionSystem && this.server.professionSystem.gatherResource) {
            const result = this.server.professionSystem.gatherResource(
                player.name,
                nodeId,
                position
            );
            socket.emit('profession:gather_result', result);
        } else {
            // Fallback
            socket.emit('profession:gather_result', {
                success: false,
                error: 'Profession system not available'
            });
        }
    }
    
    handleCraft(socket, data) {
        const player = this.server.players.get(socket.id);
        if (!player) {
            socket.emit('profession:craft_result', {
                success: false,
                error: 'Player not found'
            });
            return;
        }
        
        const { professionId, recipeId, quantity } = data;
        
        if (this.server.professionSystem && this.server.professionSystem.craftItem) {
            const result = this.server.professionSystem.craftItem(
                player.name,
                professionId,
                recipeId,
                quantity || 1
            );
            socket.emit('profession:craft_result', result);
        } else {
            socket.emit('profession:craft_result', {
                success: false,
                error: 'Profession system not available'
            });
        }
    }
    
    handleRefine(socket, data) {
        const player = this.server.players.get(socket.id);
        if (!player) {
            socket.emit('profession:refine_result', {
                success: false,
                error: 'Player not found'
            });
            return;
        }
        
        const { professionId, materialId, quantity } = data;
        
        if (this.server.professionSystem && this.server.professionSystem.refineMaterial) {
            const result = this.server.professionSystem.refineMaterial(
                player.name,
                professionId,
                materialId,
                quantity || 1
            );
            socket.emit('profession:refine_result', result);
        } else {
            socket.emit('profession:refine_result', {
                success: false,
                error: 'Profession system not available'
            });
        }
    }
    
    sendProfessionInfo(socket) {
        const player = this.server.players.get(socket.id);
        if (!player) return;
        
        if (this.server.professionSystem && this.server.professionSystem.getAllProfessions) {
            const professions = this.server.professionSystem.getAllProfessions();
            const playerProfessions = {};
            
            // Get data for each profession
            for (const prof of professions) {
                playerProfessions[prof.id] = this.server.professionSystem.getProfessionData(
                    player.name,
                    prof.id
                );
            }
            
            socket.emit('profession:info', {
                success: true,
                allProfessions: professions,
                playerProfessions: playerProfessions
            });
        }
    }
    
    sendRestedStatus(socket) {
        const player = this.server.players.get(socket.id);
        if (!player || !this.server.restedXpSystem) {
            socket.emit('rested_xp:status', {
                combat: { current: 0, max: 0, hasBonus: false },
                professions: {}
            });
            return;
        }
        
        const status = this.server.restedXpSystem.getRestedStatus(player.name);
        socket.emit('rested_xp:status', status);
    }
}

module.exports = ProfessionRestedIntegration;
