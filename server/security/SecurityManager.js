/**
 * SecurityManager.js
 * Sistema de Segurança Avançado
 * Legacy of Komodo MMORPG v0.5.0
 */

class SecurityManager {
    constructor(database, redis) {
        this.db = database;
        this.redis = redis;
        
        // Configurações de segurança
        this.config = {
            // Rate limiting
            rateLimits: {
                login: { max: 5, window: 300000, block: 900000 },      // 5 tentativas / 5min, block 15min
                chat: { max: 30, window: 60000 },                       // 30 mensagens / min
                action: { max: 100, window: 60000 },                    // 100 ações / min
                move: { max: 120, window: 60000 },                       // 120 movimentos / min
                attack: { max: 60, window: 60000 }                      // 60 ataques / min
            },
            
            // Validações
            maxMessageLength: 500,
            maxUsernameLength: 20,
            maxGuildNameLength: 30,
            allowedUsernameChars: /^[a-zA-Z0-9_-]+$/,
            
            // Sanitização
            forbiddenWords: ['palavrão1', 'palavrão2', 'spam', 'hack'],
            blockedPatterns: [
                /(https?:\/\/[^\s]+)/gi,  // URLs
                /<script[^>]*>.*?<\/script>/gi,  // XSS
                /\{\{.*?\}\}/g,  // Template injection
                /javascript:/gi   // JS protocol
            ]
        };
        
        // Suspicious activity tracking
        this.suspiciousActivity = new Map();
        this.bannedIPs = new Set();
        this.blockedUsers = new Set();
        
        console.log('🔒 SecurityManager initialized');
    }

    /**
     * Valida login com proteção contra brute force
     */
    async validateLogin(playerId, ip) {
        // Verifica se IP está banido
        if (this.bannedIPs.has(ip)) {
            return { success: false, error: 'IP blocked', code: 'IP_BLOCKED' };
        }
        
        // Rate limiting por IP
        const ipKey = `login_ip:${ip}`;
        const ipAttempts = await this.getRateLimit(ipKey, this.config.rateLimits.login);
        if (ipAttempts.exceeded) {
            await this.logSecurityEvent('BRUTE_FORCE_ATTEMPT', { ip, playerId });
            return { success: false, error: 'Too many attempts', code: 'RATE_LIMITED', retryAfter: ipAttempts.resetTime };
        }
        
        // Rate limiting por usuário
        const userKey = `login_user:${playerId}`;
        const userAttempts = await this.getRateLimit(userKey, this.config.rateLimits.login);
        if (userAttempts.exceeded) {
            await this.logSecurityEvent('ACCOUNT_LOCKOUT', { ip, playerId });
            return { success: false, error: 'Account temporarily locked', code: 'ACCOUNT_LOCKED', retryAfter: userAttempts.resetTime };
        }
        
        return { success: true };
    }

    /**
     * Valida mensagem de chat
     */
    validateChatMessage(message, playerId) {
        // Tamanho
        if (!message || message.length === 0) {
            return { valid: false, error: 'Empty message' };
        }
        if (message.length > this.config.maxMessageLength) {
            return { valid: false, error: 'Message too long' };
        }
        
        // Sanitização básica
        let sanitized = message.trim();
        
        // Remove XSS
        sanitized = sanitized
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;');
        
        // Remove patterns perigosos
        this.config.blockedPatterns.forEach(pattern => {
            sanitized = sanitized.replace(pattern, '[REMOVED]');
        });
        
        // Verifica palavras proibidas
        const lowerMsg = sanitized.toLowerCase();
        for (const word of this.config.forbiddenWords) {
            if (lowerMsg.includes(word)) {
                this.logSecurityEvent('FORBIDDEN_WORD', { playerId, word });
                return { valid: false, error: 'Inappropriate content' };
            }
        }
        
        // Verifica spam (mensagens repetidas)
        const spamKey = `spam:${playerId}`;
        const recentMessages = this.suspiciousActivity.get(spamKey) || [];
        const now = Date.now();
        
        // Limpa mensagens antigas
        const recent = recentMessages.filter(m => now - m.time < 60000);
        
        // Verifica repetição
        const duplicates = recent.filter(m => m.message === sanitized);
        if (duplicates.length >= 3) {
            this.logSecurityEvent('SPAM_DETECTED', { playerId, message: sanitized });
            return { valid: false, error: 'Spam detected' };
        }
        
        // Armazena mensagem
        recent.push({ message: sanitized, time: now });
        this.suspiciousActivity.set(spamKey, recent);
        
        return { valid: true, sanitized };
    }

    /**
     * Valida movimento do jogador (anti-cheat)
     */
    validateMovement(player, newX, newY, timestamp) {
        // Calcula distância
        const dx = newX - player.x;
        const dy = newY - player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Tempo desde último movimento
        const deltaTime = timestamp - player.lastMoveTime;
        if (deltaTime <= 0) {
            return { valid: false, error: 'Invalid timestamp' };
        }
        
        // Velocidade máxima permitida (unidades/segundo)
        const maxSpeed = player.speed * 1.2; // 20% tolerância para lag
        const actualSpeed = distance / (deltaTime / 1000);
        
        if (actualSpeed > maxSpeed) {
            this.logSecurityEvent('SPEED_HACK', {
                playerId: player.id,
                expectedSpeed: maxSpeed,
                actualSpeed,
                distance,
                deltaTime
            });
            return { valid: false, error: 'Speed limit exceeded', correctPosition: { x: player.x, y: player.y } };
        }
        
        // Verifica boundaries do mapa
        if (newX < 0 || newY < 0 || newX > 5000 || newY > 5000) {
            return { valid: false, error: 'Out of bounds' };
        }
        
        // Verifica colisão com obstáculos
        if (this.isCollision(newX, newY)) {
            return { valid: false, error: 'Collision detected' };
        }
        
        return { valid: true };
    }

    /**
     * Valida ação de combate
     */
    validateCombatAction(player, target, action) {
        // Rate limiting
        const actionKey = `combat:${player.id}:${action.type}`;
        const limit = this.getRateLimitSync(actionKey, this.config.rateLimits.attack);
        if (limit.exceeded) {
            return { valid: false, error: 'Action rate limited' };
        }
        
        // Verifica distância de ataque
        const dx = target.x - player.x;
        const dy = target.y - player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        const attackRange = action.range || 50; // Default melee range
        if (distance > attackRange * 1.2) { // 20% tolerância
            return { valid: false, error: 'Target out of range' };
        }
        
        // Verifica cooldown
        if (action.cooldownEnd && Date.now() < action.cooldownEnd) {
            return { valid: false, error: 'Ability on cooldown' };
        }
        
        // Verifica se alvo é válido
        if (!target || target.hp <= 0) {
            return { valid: false, error: 'Invalid target' };
        }
        
        // Verifica se não está atacando aliados
        if (target.faction === player.faction && !action.friendlyFire) {
            return { valid: false, error: 'Cannot attack allies' };
        }
        
        return { valid: true };
    }

    /**
     * Rate limiting genérico
     */
    async getRateLimit(key, config) {
        const now = Date.now();
        const windowStart = now - config.window;
        
        // Busca tentativas recentes
        const attempts = await this.redis.zRangeByScore(key, windowStart, now);
        
        if (attempts.length >= config.max) {
            // Calcula quando pode tentar novamente
            const oldestAttempt = attempts[0];
            const resetTime = parseInt(oldestAttempt) + config.window;
            
            // Se tem block time, adiciona
            if (config.block) {
                await this.redis.set(`block:${key}`, '1', 'PX', config.block);
            }
            
            return {
                exceeded: true,
                attempts: attempts.length,
                resetTime: resetTime - now
            };
        }
        
        // Adiciona tentativa
        await this.redis.zAdd(key, { score: now, value: now.toString() });
        await this.redis.expire(key, Math.ceil(config.window / 1000));
        
        return {
            exceeded: false,
            attempts: attempts.length,
            remaining: config.max - attempts.length - 1
        };
    }

    /**
     * Rate limiting síncrono (memória)
     */
    getRateLimitSync(key, config) {
        const now = Date.now();
        const attempts = this.suspiciousActivity.get(key) || [];
        
        // Limpa tentativas antigas
        const recent = attempts.filter(t => now - t < config.window);
        
        if (recent.length >= config.max) {
            return {
                exceeded: true,
                attempts: recent.length,
                resetTime: recent[0] + config.window - now
            };
        }
        
        // Adiciona tentativa
        recent.push(now);
        this.suspiciousActivity.set(key, recent);
        
        return {
            exceeded: false,
            attempts: recent.length,
            remaining: config.max - recent.length
        };
    }

    /**
     * Verifica colisão
     */
    isCollision(x, y) {
        // Implementação básica - em produção usaria spatial hash
        return false; // Placeholder
    }

    /**
     * Log de eventos de segurança
     */
    async logSecurityEvent(type, data) {
        const event = {
            type,
            data,
            timestamp: new Date().toISOString(),
            ip: data.ip,
            playerId: data.playerId
        };
        
        console.log(`🔒 SECURITY: ${type}`, data);
        
        // Salva no banco
        await this.db.saveSecurityLog(event);
        
        // Alerta se necessário
        if (this.isHighSeverity(type)) {
            this.alertAdmins(event);
        }
    }

    /**
     * Verifica severidade
     */
    isHighSeverity(type) {
        const highSeverity = [
            'BRUTE_FORCE_ATTEMPT',
            'SPEED_HACK',
            'BOT_DETECTED',
            'EXPLOIT_ATTEMPT',
            'INJECTION_ATTEMPT'
        ];
        return highSeverity.includes(type);
    }

    /**
     * Alerta administradores
     */
    alertAdmins(event) {
        // Notifica via WebSocket, email, Discord, etc.
        console.warn(`🚨 HIGH SEVERITY: ${event.type}`, event.data);
    }

    /**
     * Bane jogador
     */
    async banPlayer(playerId, reason, duration) {
        const ban = {
            playerId,
            reason,
            bannedAt: new Date().toISOString(),
            expiresAt: duration ? new Date(Date.now() + duration).toISOString() : null,
            permanent: !duration
        };
        
        await this.db.saveBan(ban);
        this.blockedUsers.add(playerId);
        
        this.logSecurityEvent('PLAYER_BANNED', ban);
    }

    /**
     * Bane IP
     */
    async banIP(ip, reason, duration) {
        this.bannedIPs.add(ip);
        
        setTimeout(() => {
            this.bannedIPs.delete(ip);
        }, duration || 86400000); // Default 24h
        
        this.logSecurityEvent('IP_BANNED', { ip, reason, duration });
    }

    /**
     * Valida nome de usuário
     */
    validateUsername(username) {
        if (!username || username.length < 3) {
            return { valid: false, error: 'Username too short (min 3)' };
        }
        if (username.length > this.config.maxUsernameLength) {
            return { valid: false, error: 'Username too long (max 20)' };
        }
        if (!this.config.allowedUsernameChars.test(username)) {
            return { valid: false, error: 'Invalid characters' };
        }
        
        // Verifica palavras proibidas
        const lower = username.toLowerCase();
        for (const word of this.config.forbiddenWords) {
            if (lower.includes(word)) {
                return { valid: false, error: 'Inappropriate username' };
            }
        }
        
        return { valid: true };
    }

    /**
     * Encripta dados sensíveis
     */
    encrypt(data) {
        // Placeholder - usar bcrypt/argon2 em produção
        return data;
    }

    /**
     * Verifica integridade de dados
     */
    verifyIntegrity(data, checksum) {
        // Placeholder - usar SHA256 em produção
        return true;
    }

    /**
     * Estatísticas
     */
    getStats() {
        return {
            bannedIPs: this.bannedIPs.size,
            blockedUsers: this.blockedUsers.size,
            suspiciousEvents: this.suspiciousActivity.size,
            rateLimits: Object.keys(this.config.rateLimits).length
        };
    }
}

// Exporta
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SecurityManager;
} else {
    window.SecurityManager = SecurityManager;
}
