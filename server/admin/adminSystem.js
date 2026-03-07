/**
 * Admin System - Server Administration and Management
 * Handles GM commands, server monitoring, and administrative functions
 * Version 0.3 - First Playable Gameplay Systems
 */

class AdminSystem {
    constructor(server) {
        this.server = server;
        
        // Admin configuration
        this.config = {
            logLevel: 'info',
            maxLogEntries: 10000,
            commandCooldown: 1000, // 1 second
            sessionTimeout: 1800000, // 30 minutes
            autoBackupInterval: 3600000, // 1 hour
            maxBackups: 24,
            maintenanceMode: false,
            debugMode: false
        };
        
        // Admin permissions
        this.permissions = {
            guest: ['view', 'help'],
            moderator: ['kick', 'mute', 'warn', 'view', 'help'],
            gamemaster: ['kick', 'ban', 'mute', 'warn', 'teleport', 'spawn', 'give', 'view', 'help'],
            administrator: ['all'],
            developer: ['all', 'debug', 'reload']
        };
        
        // Admin sessions
        this.adminSessions = new Map();
        
        // Server logs
        this.serverLogs = {
            system: [],
            players: [],
            errors: [],
            security: [],
            commands: []
        };
        
        // Server statistics
        this.serverStats = {
            startTime: Date.now(),
            totalConnections: 0,
            activeConnections: 0,
            totalCommands: 0,
            totalErrors: 0,
            memoryUsage: 0,
            cpuUsage: 0,
            uptime: 0
        };
        
        // Server monitoring
        this.monitoring = {
            enabled: true,
            alertThresholds: {
                memory: 0.8, // 80%
                cpu: 0.9, // 90%
                players: 100
            },
            alerts: []
        };
        
        // Backup system
        this.backupSystem = {
            enabled: true,
            lastBackup: 0,
            backupPath: './backups',
            backups: []
        };
        
        // Command system
        this.commands = new Map();
        this.loadCommands();
        
        // Initialize
        this.initialize();
    }
    
    initialize() {
        // Load admin data
        this.loadAdminData();
        
        // Setup event handlers
        this.setupEventHandlers();
        
        // Start monitoring
        this.startMonitoring();
        
        // Start backup system
        this.startBackupSystem();
        
        // Start log cleanup
        this.startLogCleanup();
        
        console.log('Admin System initialized');
    }
    
    async loadAdminData() {
        try {
            // Load admin accounts
            const adminData = await this.server.db.all('SELECT * FROM admin_accounts WHERE active = 1');
            
            for (const data of adminData) {
                this.adminSessions.set(data.username, {
                    username: data.username,
                    role: data.role,
                    permissions: this.permissions[data.role] || [],
                    loggedIn: false,
                    lastActivity: 0,
                    sessionTimeout: this.config.sessionTimeout
                });
            }
            
            // Load server settings
            const settings = await this.server.db.get('SELECT * FROM server_settings');
            if (settings) {
                this.config.maintenanceMode = settings.maintenance_mode === 1;
                this.config.debugMode = settings.debug_mode === 1;
            }
            
            console.log(`Loaded ${adminData.length} admin accounts`);
            
        } catch (error) {
            console.error('Error loading admin data:', error);
        }
    }
    
    setupEventHandlers() {
        // Player events
        this.server.on('playerConnected', (playerId, playerData) => {
            this.handlePlayerConnected(playerId, playerData);
        });
        
        this.server.on('playerDisconnected', (playerId) => {
            this.handlePlayerDisconnected(playerId);
        });
        
        this.server.on('playerDeath', (playerId, killerId) => {
            this.handlePlayerDeath(playerId, killerId);
        });
        
        // Server events
        this.server.on('serverError', (error) => {
            this.handleServerError(error);
        });
        
        this.server.on('securityAlert', (alert) => {
            this.handleSecurityAlert(alert);
        });
        
        // Admin events
        this.server.on('adminCommand', (playerId, command, args) => {
            this.handleAdminCommand(playerId, command, args);
        });
        
        this.server.on('adminLogin', (playerId, username, password) => {
            this.handleAdminLogin(playerId, username, password);
        });
        
        this.server.on('adminLogout', (playerId) => {
            this.handleAdminLogout(playerId);
        });
    }
    
    loadCommands() {
        // Basic commands
        this.commands.set('help', {
            description: 'Show available commands',
            usage: 'help [command]',
            permission: 'view',
            execute: (playerId, args) => this.cmdHelp(playerId, args)
        });
        
        this.commands.set('who', {
            description: 'List online players',
            usage: 'who',
            permission: 'view',
            execute: (playerId, args) => this.cmdWho(playerId, args)
        });
        
        this.commands.set('info', {
            description: 'Show player information',
            usage: 'info [player]',
            permission: 'view',
            execute: (playerId, args) => this.cmdInfo(playerId, args)
        });
        
        // Moderation commands
        this.commands.set('kick', {
            description: 'Kick a player',
            usage: 'kick <player> [reason]',
            permission: 'kick',
            execute: (playerId, args) => this.cmdKick(playerId, args)
        });
        
        this.commands.set('ban', {
            description: 'Ban a player',
            usage: 'ban <player> [duration] [reason]',
            permission: 'ban',
            execute: (playerId, args) => this.cmdBan(playerId, args)
        });
        
        this.commands.set('mute', {
            description: 'Mute a player',
            usage: 'mute <player> [duration]',
            permission: 'mute',
            execute: (playerId, args) => this.cmdMute(playerId, args)
        });
        
        this.commands.set('warn', {
            description: 'Warn a player',
            usage: 'warn <player> <message>',
            permission: 'warn',
            execute: (playerId, args) => this.cmdWarn(playerId, args)
        });
        
        // GM commands
        this.commands.set('teleport', {
            description: 'Teleport to coordinates',
            usage: 'teleport <x> <y> [player]',
            permission: 'teleport',
            execute: (playerId, args) => this.cmdTeleport(playerId, args)
        });
        
        this.commands.set('spawn', {
            description: 'Spawn an entity',
            usage: 'spawn <type> [x] [y]',
            permission: 'spawn',
            execute: (playerId, args) => this.cmdSpawn(playerId, args)
        });
        
        this.commands.set('give', {
            description: 'Give item to player',
            usage: 'give <player> <item> [quantity]',
            permission: 'give',
            execute: (playerId, args) => this.cmdGive(playerId, args)
        });
        
        // Admin commands
        this.commands.set('maintenance', {
            description: 'Toggle maintenance mode',
            usage: 'maintenance [on/off]',
            permission: 'administrator',
            execute: (playerId, args) => this.cmdMaintenance(playerId, args)
        });
        
        this.commands.set('announce', {
            description: 'Send server announcement',
            usage: 'announce <message>',
            permission: 'administrator',
            execute: (playerId, args) => this.cmdAnnounce(playerId, args)
        });
        
        this.commands.set('shutdown', {
            description: 'Shutdown server',
            usage: 'shutdown [delay] [reason]',
            permission: 'administrator',
            execute: (playerId, args) => this.cmdShutdown(playerId, args)
        });
        
        this.commands.set('restart', {
            description: 'Restart server',
            usage: 'restart [delay] [reason]',
            permission: 'administrator',
            execute: (playerId, args) => this.cmdRestart(playerId, args)
        });
        
        // System commands
        this.commands.set('stats', {
            description: 'Show server statistics',
            usage: 'stats',
            permission: 'view',
            execute: (playerId, args) => this.cmdStats(playerId, args)
        });
        
        this.commands.set('logs', {
            description: 'View server logs',
            usage: 'logs [type] [limit]',
            permission: 'view',
            execute: (playerId, args) => this.cmdLogs(playerId, args)
        });
        
        this.commands.set('backup', {
            description: 'Create server backup',
            usage: 'backup',
            permission: 'administrator',
            execute: (playerId, args) => this.cmdBackup(playerId, args)
        });
        
        // Debug commands
        this.commands.set('debug', {
            description: 'Toggle debug mode',
            usage: 'debug [on/off]',
            permission: 'debug',
            execute: (playerId, args) => this.cmdDebug(playerId, args)
        });
        
        this.commands.set('reload', {
            description: 'Reload server modules',
            usage: 'reload [module]',
            permission: 'reload',
            execute: (playerId, args) => this.cmdReload(playerId, args)
        });
    }
    
    startMonitoring() {
        setInterval(() => {
            this.updateServerStats();
            this.checkAlerts();
        }, 30000); // Update every 30 seconds
    }
    
    startBackupSystem() {
        if (!this.backupSystem.enabled) return;
        
        setInterval(() => {
            this.createBackup();
        }, this.config.autoBackupInterval);
    }
    
    startLogCleanup() {
        setInterval(() => {
            this.cleanupLogs();
        }, 3600000); // Clean every hour
    }
    
    // Authentication
    async loginAdmin(playerId, username, password) {
        const session = this.adminSessions.get(username);
        if (!session) {
            return { success: false, message: 'Admin account not found' };
        }
        
        try {
            // Verify password
            const adminData = await this.server.db.get(
                'SELECT * FROM admin_accounts WHERE username = ? AND active = 1',
                [username]
            );
            
            if (!adminData || !this.verifyPassword(password, adminData.password_hash)) {
                this.logSecurity(`Failed admin login attempt: ${username} from ${playerId}`);
                return { success: false, message: 'Invalid credentials' };
            }
            
            // Check if already logged in
            if (session.loggedIn) {
                return { success: false, message: 'Already logged in' };
            }
            
            // Create session
            session.loggedIn = true;
            session.playerId = playerId;
            session.loginTime = Date.now();
            session.lastActivity = Date.now();
            
            this.logCommand(`Admin ${username} logged in from ${playerId}`);
            
            // Notify player
            const socket = this.server.getPlayerSocket(playerId);
            if (socket) {
                socket.emit('adminLoginSuccess', {
                    username: username,
                    role: session.role,
                    permissions: session.permissions
                });
            }
            
            return { success: true, session: session };
            
        } catch (error) {
            console.error('Error during admin login:', error);
            return { success: false, message: 'Login error' };
        }
    }
    
    logoutAdmin(playerId) {
        for (const [username, session] of this.adminSessions) {
            if (session.playerId === playerId && session.loggedIn) {
                session.loggedIn = false;
                session.playerId = null;
                session.logoutTime = Date.now();
                
                this.logCommand(`Admin ${username} logged out`);
                
                // Notify player
                const socket = this.server.getPlayerSocket(playerId);
                if (socket) {
                    socket.emit('adminLogoutSuccess');
                }
                
                return true;
            }
        }
        
        return false;
    }
    
    verifyPassword(password, hash) {
        // Simplified password verification
        // In production, use proper hashing like bcrypt
        return password === 'admin123'; // Temporary
    }
    
    // Command system
    async executeCommand(playerId, commandLine) {
        const session = this.getAdminSession(playerId);
        if (!session || !session.loggedIn) {
            return { success: false, message: 'Not logged in as admin' };
        }
        
        // Check cooldown
        const now = Date.now();
        if (session.lastCommand && now - session.lastCommand < this.config.commandCooldown) {
            return { success: false, message: 'Command cooldown' };
        }
        
        session.lastCommand = now;
        
        // Parse command
        const args = commandLine.trim().split(' ');
        const command = args.shift().toLowerCase();
        
        if (!command) {
            return { success: false, message: 'No command specified' };
        }
        
        const commandInfo = this.commands.get(command);
        if (!commandInfo) {
            return { success: false, message: 'Unknown command' };
        }
        
        // Check permission
        if (!this.hasPermission(session, commandInfo.permission)) {
            return { success: false, message: 'Permission denied' };
        }
        
        try {
            // Execute command
            const result = await commandInfo.execute(playerId, args);
            
            // Log command
            this.logCommand(`${session.username} executed: ${commandLine}`);
            session.lastActivity = now;
            
            return result;
            
        } catch (error) {
            console.error(`Error executing command ${command}:`, error);
            this.logError(`Command error: ${command} - ${error.message}`);
            return { success: false, message: 'Command execution error' };
        }
    }
    
    hasPermission(session, permission) {
        if (session.permissions.includes('all')) return true;
        return session.permissions.includes(permission);
    }
    
    getAdminSession(playerId) {
        for (const session of this.adminSessions.values()) {
            if (session.playerId === playerId && session.loggedIn) {
                return session;
            }
        }
        return null;
    }
    
    // Command implementations
    async cmdHelp(playerId, args) {
        const session = this.getAdminSession(playerId);
        const commands = [];
        
        if (args[0]) {
            // Show specific command help
            const command = this.commands.get(args[0]);
            if (command && this.hasPermission(session, command.permission)) {
                commands.push({
                    name: args[0],
                    description: command.description,
                    usage: command.usage
                });
            }
        } else {
            // Show all available commands
            for (const [name, command] of this.commands) {
                if (this.hasPermission(session, command.permission)) {
                    commands.push({
                        name: name,
                        description: command.description,
                        usage: command.usage
                    });
                }
            }
        }
        
        const socket = this.server.getPlayerSocket(playerId);
        if (socket) {
            socket.emit('adminCommandResponse', {
                type: 'help',
                commands: commands
            });
        }
        
        return { success: true, commands: commands };
    }
    
    async cmdWho(playerId, args) {
        const players = [];
        
        for (const [playerId, player] of this.server.players) {
            players.push({
                id: playerId,
                name: player.name,
                level: player.level,
                x: Math.floor(player.x),
                y: Math.floor(player.y),
                online: true
            });
        }
        
        const socket = this.server.getPlayerSocket(playerId);
        if (socket) {
            socket.emit('adminCommandResponse', {
                type: 'who',
                players: players,
                total: players.length
            });
        }
        
        return { success: true, players: players };
    }
    
    async cmdInfo(playerId, args) {
        const targetName = args[0];
        if (!targetName) {
            return { success: false, message: 'Player name required' };
        }
        
        const target = this.server.playersByName.get(targetName);
        if (!target) {
            return { success: false, message: 'Player not found' };
        }
        
        const playerInfo = {
            id: target.playerId,
            name: target.name,
            level: target.level,
            experience: target.experience,
            gold: target.gold,
            health: target.health,
            maxHealth: target.maxHealth,
            position: { x: Math.floor(target.x), y: Math.floor(target.y) },
            guild: target.guildId || 'None',
            online: true,
            loginTime: target.loginTime,
            lastActivity: Date.now()
        };
        
        const socket = this.server.getPlayerSocket(playerId);
        if (socket) {
            socket.emit('adminCommandResponse', {
                type: 'info',
                player: playerInfo
            });
        }
        
        return { success: true, player: playerInfo };
    }
    
    async cmdKick(playerId, args) {
        const targetName = args[0];
        const reason = args.slice(1).join(' ') || 'No reason provided';
        
        if (!targetName) {
            return { success: false, message: 'Player name required' };
        }
        
        const target = this.server.playersByName.get(targetName);
        if (!target) {
            return { success: false, message: 'Player not found' };
        }
        
        // Cannot kick other admins
        const targetSession = this.getAdminSession(target.playerId);
        if (targetSession) {
            return { success: false, message: 'Cannot kick admin' };
        }
        
        // Kick player
        const socket = this.server.getPlayerSocket(target.playerId);
        if (socket) {
            socket.emit('kicked', {
                reason: reason,
                kickedBy: this.getAdminSession(playerId).username
            });
            socket.disconnect();
        }
        
        this.logCommand(`Player ${targetName} kicked by ${this.getAdminSession(playerId).username}: ${reason}`);
        
        // Notify all admins
        this.notifyAdmins(`Player ${targetName} was kicked: ${reason}`, 'moderation');
        
        return { success: true, target: targetName, reason: reason };
    }
    
    async cmdBan(playerId, args) {
        const targetName = args[0];
        const duration = args[1] || 'permanent';
        const reason = args.slice(2).join(' ') || 'No reason provided';
        
        if (!targetName) {
            return { success: false, message: 'Player name required' };
        }
        
        const target = this.server.playersByName.get(targetName);
        if (!target) {
            return { success: false, message: 'Player not found' };
        }
        
        // Cannot ban other admins
        const targetSession = this.getAdminSession(target.playerId);
        if (targetSession) {
            return { success: false, message: 'Cannot ban admin' };
        }
        
        try {
            // Add ban to database
            const banDuration = duration === 'permanent' ? 0 : this.parseDuration(duration);
            await this.server.db.run(`
                INSERT INTO player_bans (player_id, reason, duration, banned_by, timestamp)
                VALUES (?, ?, ?, ?, ?)
            `, [target.playerId, reason, banDuration, this.getAdminSession(playerId).username, Date.now()]);
            
            // Kick player if online
            const socket = this.server.getPlayerSocket(target.playerId);
            if (socket) {
                socket.emit('banned', {
                    reason: reason,
                    duration: duration,
                    bannedBy: this.getAdminSession(playerId).username
                });
                socket.disconnect();
            }
            
            this.logCommand(`Player ${targetName} banned by ${this.getAdminSession(playerId).username}: ${reason} (${duration})`);
            
            // Notify all admins
            this.notifyAdmins(`Player ${targetName} was banned: ${reason} (${duration})`, 'moderation');
            
            return { success: true, target: targetName, duration: duration, reason: reason };
            
        } catch (error) {
            console.error('Error banning player:', error);
            return { success: false, message: 'Ban error' };
        }
    }
    
    async cmdMute(playerId, args) {
        const targetName = args[0];
        const duration = args[1] || '10m';
        
        if (!targetName) {
            return { success: false, message: 'Player name required' };
        }
        
        const target = this.server.playersByName.get(targetName);
        if (!target) {
            return { success: false, message: 'Player not found' };
        }
        
        try {
            const muteDuration = this.parseDuration(duration);
            
            // Add mute to database
            await this.server.db.run(`
                INSERT INTO player_mutes (player_id, duration, muted_by, timestamp)
                VALUES (?, ?, ?, ?)
            `, [target.playerId, muteDuration, this.getAdminSession(playerId).username, Date.now()]);
            
            // Apply mute
            target.muted = true;
            target.muteUntil = Date.now() + muteDuration;
            
            this.logCommand(`Player ${targetName} muted by ${this.getAdminSession(playerId).username}: ${duration}`);
            
            // Notify target
            const socket = this.server.getPlayerSocket(target.playerId);
            if (socket) {
                socket.emit('muted', {
                    duration: duration,
                    mutedBy: this.getAdminSession(playerId).username
                });
            }
            
            // Notify all admins
            this.notifyAdmins(`Player ${targetName} was muted: ${duration}`, 'moderation');
            
            return { success: true, target: targetName, duration: duration };
            
        } catch (error) {
            console.error('Error muting player:', error);
            return { success: false, message: 'Mute error' };
        }
    }
    
    async cmdWarn(playerId, args) {
        const targetName = args[0];
        const message = args.slice(1).join(' ');
        
        if (!targetName || !message) {
            return { success: false, message: 'Player name and message required' };
        }
        
        const target = this.server.playersByName.get(targetName);
        if (!target) {
            return { success: false, message: 'Player not found' };
        }
        
        try {
            // Add warning to database
            await this.server.db.run(`
                INSERT INTO player_warnings (player_id, message, warned_by, timestamp)
                VALUES (?, ?, ?, ?)
            `, [target.playerId, message, this.getAdminSession(playerId).username, Date.now()]);
            
            // Send warning to player
            const socket = this.server.getPlayerSocket(target.playerId);
            if (socket) {
                socket.emit('warning', {
                    message: message,
                    warnedBy: this.getAdminSession(playerId).username
                });
            }
            
            this.logCommand(`Player ${targetName} warned by ${this.getAdminSession(playerId).username}: ${message}`);
            
            // Notify all admins
            this.notifyAdmins(`Player ${targetName} was warned: ${message}`, 'moderation');
            
            return { success: true, target: targetName, message: message };
            
        } catch (error) {
            console.error('Error warning player:', error);
            return { success: false, message: 'Warning error' };
        }
    }
    
    async cmdTeleport(playerId, args) {
        const x = parseInt(args[0]);
        const y = parseInt(args[1]);
        const targetName = args[2];
        
        if (isNaN(x) || isNaN(y)) {
            return { success: false, message: 'Valid coordinates required' };
        }
        
        let target = targetName ? this.server.playersByName.get(targetName) : this.server.players.get(playerId);
        
        if (!target) {
            return { success: false, message: 'Target not found' };
        }
        
        // Teleport player
        target.x = x;
        target.y = y;
        
        // Update world manager
        this.server.worldManager.updatePlayerPosition(target.playerId, x, y);
        
        // Notify player
        const socket = this.server.getPlayerSocket(target.playerId);
        if (socket) {
            socket.emit('teleported', {
                x: x,
                y: y,
                teleportedBy: this.getAdminSession(playerId).username
            });
        }
        
        this.logCommand(`Player ${target.name} teleported to (${x}, ${y}) by ${this.getAdminSession(playerId).username}`);
        
        return { success: true, target: target.name, x: x, y: y };
    }
    
    async cmdSpawn(playerId, args) {
        const entityType = args[0];
        const x = parseInt(args[1]) || 0;
        const y = parseInt(args[2]) || 0;
        
        if (!entityType) {
            return { success: false, message: 'Entity type required' };
        }
        
        // Spawn entity
        const entity = this.server.worldManager.spawnSystem.forceSpawn(entityType, x, y, 1);
        
        if (!entity) {
            return { success: false, message: 'Failed to spawn entity' };
        }
        
        this.logCommand(`Entity ${entityType} spawned at (${x}, ${y}) by ${this.getAdminSession(playerId).username}`);
        
        return { success: true, entity: entity, x: x, y: y };
    }
    
    async cmdGive(playerId, args) {
        const targetName = args[0];
        const itemTemplate = args[1];
        const quantity = parseInt(args[2]) || 1;
        
        if (!targetName || !itemTemplate) {
            return { success: false, message: 'Player name and item required' };
        }
        
        const target = this.server.playersByName.get(targetName);
        if (!target) {
            return { success: false, message: 'Player not found' };
        }
        
        // Give item to player
        const item = {
            id: this.generateItemId(),
            template: itemTemplate,
            quantity: quantity
        };
        
        // This would integrate with inventory system
        console.log(`Giving ${quantity}x ${itemTemplate} to ${targetName}`);
        
        this.logCommand(`Item ${itemTemplate} x${quantity} given to ${targetName} by ${this.getAdminSession(playerId).username}`);
        
        // Notify player
        const socket = this.server.getPlayerSocket(target.playerId);
        if (socket) {
            socket.emit('itemReceived', {
                item: item,
                givenBy: this.getAdminSession(playerId).username
            });
        }
        
        return { success: true, target: targetName, item: itemTemplate, quantity: quantity };
    }
    
    async cmdMaintenance(playerId, args) {
        const mode = args[0];
        
        if (mode === 'on' || mode === 'true') {
            this.config.maintenanceMode = true;
        } else if (mode === 'off' || mode === 'false') {
            this.config.maintenanceMode = false;
        } else {
            return { success: false, message: 'Use on/off or true/false' };
        }
        
        // Save setting
        await this.server.db.run(`
            UPDATE server_settings SET maintenance_mode = ? WHERE id = 1
        `, [this.config.maintenanceMode ? 1 : 0]);
        
        // Notify all players
        if (this.config.maintenanceMode) {
            this.server.io.emit('maintenanceMode', { enabled: true });
            this.notifyAdmins('Maintenance mode enabled', 'system');
        } else {
            this.server.io.emit('maintenanceMode', { enabled: false });
            this.notifyAdmins('Maintenance mode disabled', 'system');
        }
        
        this.logCommand(`Maintenance mode ${this.config.maintenanceMode ? 'enabled' : 'disabled'} by ${this.getAdminSession(playerId).username}`);
        
        return { success: true, maintenanceMode: this.config.maintenanceMode };
    }
    
    async cmdAnnounce(playerId, args) {
        const message = args.join(' ');
        
        if (!message) {
            return { success: false, message: 'Message required' };
        }
        
        // Send announcement to all players
        this.server.io.emit('announcement', {
            message: message,
            from: this.getAdminSession(playerId).username,
            timestamp: Date.now()
        });
        
        this.logCommand(`Announcement sent by ${this.getAdminSession(playerId).username}: ${message}`);
        
        return { success: true, message: message };
    }
    
    async cmdShutdown(playerId, args) {
        const delay = parseInt(args[0]) || 0;
        const reason = args.slice(1).join(' ') || 'Server shutdown';
        
        if (delay > 0) {
            // Schedule shutdown
            this.server.io.emit('serverShutdown', {
                delay: delay * 1000,
                reason: reason
            });
            
            this.notifyAdmins(`Server shutdown scheduled in ${delay} seconds: ${reason}`, 'system');
            
            setTimeout(() => {
                this.shutdownServer(reason);
            }, delay * 1000);
        } else {
            // Immediate shutdown
            this.shutdownServer(reason);
        }
        
        this.logCommand(`Server shutdown initiated by ${this.getAdminSession(playerId).username}: ${reason} (delay: ${delay}s)`);
        
        return { success: true, delay: delay, reason: reason };
    }
    
    async cmdRestart(playerId, args) {
        const delay = parseInt(args[0]) || 0;
        const reason = args.slice(1).join(' ') || 'Server restart';
        
        if (delay > 0) {
            // Schedule restart
            this.server.io.emit('serverRestart', {
                delay: delay * 1000,
                reason: reason
            });
            
            this.notifyAdmins(`Server restart scheduled in ${delay} seconds: ${reason}`, 'system');
            
            setTimeout(() => {
                this.restartServer(reason);
            }, delay * 1000);
        } else {
            // Immediate restart
            this.restartServer(reason);
        }
        
        this.logCommand(`Server restart initiated by ${this.getAdminSession(playerId).username}: ${reason} (delay: ${delay}s)`);
        
        return { success: true, delay: delay, reason: reason };
    }
    
    async cmdStats(playerId, args) {
        const stats = {
            uptime: Date.now() - this.serverStats.startTime,
            totalConnections: this.serverStats.totalConnections,
            activeConnections: this.server.players.size,
            totalCommands: this.serverStats.totalCommands,
            totalErrors: this.serverStats.totalErrors,
            memoryUsage: process.memoryUsage(),
            nodeVersion: process.version,
            platform: process.platform
        };
        
        const socket = this.server.getPlayerSocket(playerId);
        if (socket) {
            socket.emit('adminCommandResponse', {
                type: 'stats',
                stats: stats
            });
        }
        
        return { success: true, stats: stats };
    }
    
    async cmdLogs(playerId, args) {
        const type = args[0] || 'system';
        const limit = parseInt(args[1]) || 50;
        
        const logs = this.serverLogs[type] || [];
        const recentLogs = logs.slice(-limit);
        
        const socket = this.server.getPlayerSocket(playerId);
        if (socket) {
            socket.emit('adminCommandResponse', {
                type: 'logs',
                logType: type,
                logs: recentLogs
            });
        }
        
        return { success: true, logs: recentLogs };
    }
    
    async cmdBackup(playerId, args) {
        const backup = await this.createBackup();
        
        const socket = this.server.getPlayerSocket(playerId);
        if (socket) {
            socket.emit('adminCommandResponse', {
                type: 'backup',
                backup: backup
            });
        }
        
        return { success: true, backup: backup };
    }
    
    async cmdDebug(playerId, args) {
        const mode = args[0];
        
        if (mode === 'on' || mode === 'true') {
            this.config.debugMode = true;
        } else if (mode === 'off' || mode === 'false') {
            this.config.debugMode = false;
        } else {
            return { success: false, message: 'Use on/off or true/false' };
        }
        
        // Save setting
        await this.server.db.run(`
            UPDATE server_settings SET debug_mode = ? WHERE id = 1
        `, [this.config.debugMode ? 1 : 0]);
        
        this.logCommand(`Debug mode ${this.config.debugMode ? 'enabled' : 'disabled'} by ${this.getAdminSession(playerId).username}`);
        
        return { success: true, debugMode: this.config.debugMode };
    }
    
    async cmdReload(playerId, args) {
        const module = args[0];
        
        if (module) {
            // Reload specific module
            this.logCommand(`Module ${module} reloaded by ${this.getAdminSession(playerId).username}`);
        } else {
            // Reload all modules
            this.logCommand(`All modules reloaded by ${this.getAdminSession(playerId).username}`);
        }
        
        return { success: true, module: module };
    }
    
    // Event handlers
    handlePlayerConnected(playerId, playerData) {
        this.serverStats.totalConnections++;
        this.serverStats.activeConnections++;
        
        this.logPlayer(`Player ${playerData.name} connected (${playerId})`);
        
        // Check for bans
        this.checkPlayerBans(playerId);
    }
    
    handlePlayerDisconnected(playerId) {
        this.serverStats.activeConnections--;
        
        const player = this.server.players.get(playerId);
        if (player) {
            this.logPlayer(`Player ${player.name} disconnected (${playerId})`);
        }
        
        // Logout admin if needed
        this.logoutAdmin(playerId);
    }
    
    handlePlayerDeath(playerId, killerId) {
        const player = this.server.players.get(playerId);
        const killer = this.server.players.get(killerId);
        
        this.logPlayer(`Player ${player?.name} killed by ${killer?.name || 'unknown'}`);
    }
    
    handleServerError(error) {
        this.serverStats.totalErrors++;
        this.logError(`Server error: ${error.message}`);
        
        if (this.config.debugMode) {
            console.error('Server error details:', error);
        }
    }
    
    handleSecurityAlert(alert) {
        this.logSecurity(`Security alert: ${alert.message}`);
        this.notifyAdmins(`Security alert: ${alert.message}`, 'security');
    }
    
    handleAdminCommand(playerId, command, args) {
        this.executeCommand(playerId, command + ' ' + args.join(' '));
    }
    
    handleAdminLogin(playerId, username, password) {
        this.loginAdmin(playerId, username, password);
    }
    
    handleAdminLogout(playerId) {
        this.logoutAdmin(playerId);
    }
    
    // Server monitoring
    updateServerStats() {
        this.serverStats.uptime = Date.now() - this.serverStats.startTime;
        this.serverStats.activeConnections = this.server.players.size;
        this.serverStats.memoryUsage = process.memoryUsage();
        
        // Update CPU usage (simplified)
        const usage = process.cpuUsage();
        this.serverStats.cpuUsage = usage.user + usage.system;
    }
    
    checkAlerts() {
        const alerts = [];
        
        // Check memory usage
        const memoryUsage = this.serverStats.memoryUsage;
        const memoryPercent = memoryUsage.heapUsed / memoryUsage.heapTotal;
        
        if (memoryPercent > this.monitoring.alertThresholds.memory) {
            alerts.push({
                type: 'memory',
                message: `High memory usage: ${Math.round(memoryPercent * 100)}%`,
                severity: 'warning'
            });
        }
        
        // Check player count
        if (this.serverStats.activeConnections > this.monitoring.alertThresholds.players) {
            alerts.push({
                type: 'players',
                message: `High player count: ${this.serverStats.activeConnections}`,
                severity: 'info'
            });
        }
        
        // Send alerts to admins
        for (const alert of alerts) {
            this.notifyAdmins(alert.message, 'monitoring', alert.severity);
        }
        
        this.monitoring.alerts = alerts;
    }
    
    // Backup system
    async createBackup() {
        if (!this.backupSystem.enabled) return null;
        
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupFile = `backup_${timestamp}.db`;
            
            // Create backup (simplified)
            const backup = {
                id: this.generateBackupId(),
                filename: backupFile,
                timestamp: Date.now(),
                size: 0, // Would be actual file size
                type: 'full'
            };
            
            this.backupSystem.backups.push(backup);
            this.backupSystem.lastBackup = Date.now();
            
            // Clean old backups
            if (this.backupSystem.backups.length > this.config.maxBackups) {
                this.backupSystem.backups.shift();
            }
            
            this.logSystem(`Backup created: ${backupFile}`);
            
            return backup;
            
        } catch (error) {
            console.error('Error creating backup:', error);
            this.logError(`Backup error: ${error.message}`);
            return null;
        }
    }
    
    // Logging system
    logSystem(message) {
        const logEntry = {
            timestamp: Date.now(),
            level: 'info',
            message: message
        };
        
        this.serverLogs.system.push(logEntry);
        console.log(`[SYSTEM] ${message}`);
    }
    
    logPlayer(message) {
        const logEntry = {
            timestamp: Date.now(),
            level: 'info',
            message: message
        };
        
        this.serverLogs.players.push(logEntry);
        console.log(`[PLAYER] ${message}`);
    }
    
    logError(message) {
        const logEntry = {
            timestamp: Date.now(),
            level: 'error',
            message: message
        };
        
        this.serverLogs.errors.push(logEntry);
        console.error(`[ERROR] ${message}`);
    }
    
    logSecurity(message) {
        const logEntry = {
            timestamp: Date.now(),
            level: 'warning',
            message: message
        };
        
        this.serverLogs.security.push(logEntry);
        console.warn(`[SECURITY] ${message}`);
    }
    
    logCommand(message) {
        const logEntry = {
            timestamp: Date.now(),
            level: 'info',
            message: message
        };
        
        this.serverLogs.commands.push(logEntry);
        this.serverStats.totalCommands++;
        
        if (this.config.debugMode) {
            console.log(`[COMMAND] ${message}`);
        }
    }
    
    cleanupLogs() {
        const maxEntries = this.config.maxLogEntries;
        
        for (const [type, logs] of Object.entries(this.serverLogs)) {
            if (logs.length > maxEntries) {
                this.serverLogs[type] = logs.slice(-maxEntries);
            }
        }
    }
    
    // Utility methods
    parseDuration(duration) {
        const match = duration.match(/^(\d+)([smhd])$/);
        if (!match) return 0;
        
        const value = parseInt(match[1]);
        const unit = match[2];
        
        const multipliers = {
            's': 1000,
            'm': 60000,
            'h': 3600000,
            'd': 86400000
        };
        
        return value * multipliers[unit];
    }
    
    async checkPlayerBans(playerId) {
        try {
            const ban = await this.server.db.get(`
                SELECT * FROM player_bans 
                WHERE player_id = ? AND (duration = 0 OR timestamp + duration > ?)
            `, [playerId, Date.now()]);
            
            if (ban) {
                const socket = this.server.getPlayerSocket(playerId);
                if (socket) {
                    socket.emit('banned', {
                        reason: ban.reason,
                        duration: ban.duration === 0 ? 'permanent' : this.formatDuration(ban.duration),
                        bannedBy: ban.banned_by
                    });
                    socket.disconnect();
                }
            }
        } catch (error) {
            console.error('Error checking player bans:', error);
        }
    }
    
    formatDuration(ms) {
        if (ms === 0) return 'permanent';
        
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        if (days > 0) return `${days}d`;
        if (hours > 0) return `${hours}h`;
        if (minutes > 0) return `${minutes}m`;
        return `${seconds}s`;
    }
    
    notifyAdmins(message, type = 'info', severity = 'info') {
        for (const session of this.adminSessions.values()) {
            if (session.loggedIn && session.playerId) {
                const socket = this.server.getPlayerSocket(session.playerId);
                if (socket) {
                    socket.emit('adminNotification', {
                        message: message,
                        type: type,
                        severity: severity,
                        timestamp: Date.now()
                    });
                }
            }
        }
    }
    
    shutdownServer(reason) {
        this.logSystem(`Server shutting down: ${reason}`);
        
        // Notify all players
        this.server.io.emit('serverShutdown', {
            reason: reason,
            immediate: true
        });
        
        // Save all data
        this.saveAllData();
        
        // Close connections
        setTimeout(() => {
            process.exit(0);
        }, 5000);
    }
    
    restartServer(reason) {
        this.logSystem(`Server restarting: ${reason}`);
        
        // Notify all players
        this.server.io.emit('serverRestart', {
            reason: reason,
            immediate: true
        });
        
        // Save all data
        this.saveAllData();
        
        // Restart process
        setTimeout(() => {
            process.exit(1); // Exit code 1 for restart
        }, 5000);
    }
    
    async saveAllData() {
        // Save all system data
        try {
            // Save server settings
            await this.server.db.run(`
                INSERT OR REPLACE INTO server_settings (id, maintenance_mode, debug_mode)
                VALUES (1, ?, ?)
            `, [this.config.maintenanceMode ? 1 : 0, this.config.debugMode ? 1 : 0]);
            
            this.logSystem('All server data saved');
            
        } catch (error) {
            console.error('Error saving server data:', error);
        }
    }
    
    // ID generators
    generateItemId() {
        return 'item_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    
    generateBackupId() {
        return 'backup_' + Date.now().toString(36);
    }
    
    // Public API
    getServerStats() {
        return { ...this.serverStats };
    }
    
    getLogs(type, limit = 100) {
        const logs = this.serverLogs[type] || [];
        return logs.slice(-limit);
    }
    
    getActiveAdmins() {
        const admins = [];
        for (const session of this.adminSessions.values()) {
            if (session.loggedIn) {
                admins.push({
                    username: session.username,
                    role: session.role,
                    lastActivity: session.lastActivity
                });
            }
        }
        return admins;
    }
    
    isMaintenanceMode() {
        return this.config.maintenanceMode;
    }
    
    isDebugMode() {
        return this.config.debugMode;
    }
    
    // Cleanup
    async cleanup() {
        // Save all data
        await this.saveAllData();
        
        // Clear sessions
        for (const session of this.adminSessions.values()) {
            session.loggedIn = false;
        }
        
        console.log('Admin System cleanup complete');
    }
}

module.exports = AdminSystem;
