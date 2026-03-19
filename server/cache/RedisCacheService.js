/**
 * Redis Cache Service - Sistema de Cache Distribuído
 * Implementação avançada de cache com Redis para performance máxima
 * Version 1.0.0 - Performance Optimization
 */

const redis = require('redis');
const { promisify } = require('util');

class RedisCacheService {
    constructor() {
        this.client = null;
        this.connected = false;
        this.defaultTTL = 300; // 5 minutos
        this.maxRetries = 3;
        this.retryDelay = 1000;
        this.metrics = {
            hits: 0,
            misses: 0,
            errors: 0,
            operations: 0
        };
        
        this.initialize();
    }
    
    /**
     * Inicializa conexão com Redis
     */
    async initialize() {
        try {
            console.log('🔴 Inicializando Redis Cache Service v1.0.0');
            
            // Configuração do cliente Redis
            this.client = redis.createClient({
                host: process.env.REDIS_HOST || 'localhost',
                port: process.env.REDIS_PORT || 6379,
                password: process.env.REDIS_PASSWORD || undefined,
                db: process.env.REDIS_DB || 0,
                retryDelayOnFailover: 100,
                maxRetriesPerRequest: 3,
                lazyConnect: true,
                keepAlive: 30000,
                connectTimeout: 10000,
                commandTimeout: 5000,
                enableReadyCheck: true,
                maxMemoryPolicy: 'allkeys-lru'
            });
            
            // Configurar callbacks
            this.client.on('connect', () => {
                console.log('✅ Redis conectado com sucesso');
                this.connected = true;
            });
            
            this.client.on('error', (err) => {
                console.error('❌ Erro no Redis:', err);
                this.connected = false;
                this.metrics.errors++;
            });
            
            this.client.on('end', () => {
                console.log('🔴 Redis desconectado');
                this.connected = false;
            });
            
            // Conectar ao Redis
            await this.client.connect();
            
            // Configurar comandos assíncronos
            this.getAsync = promisify(this.client.get).bind(this.client);
            this.setAsync = promisify(this.client.set).bind(this.client);
            this.delAsync = promisify(this.client.del).bind(this.client);
            this.existsAsync = promisify(this.client.exists).bind(this.client);
            this.expireAsync = promisify(this.client.expire).bind(this.client);
            this.keysAsync = promisify(this.client.keys).bind(this.client);
            this.flushdbAsync = promisify(this.client.flushdb).bind(this.client);
            
            console.log('✅ Redis Cache Service inicializado com sucesso');
            
        } catch (error) {
            console.error('❌ Falha na inicialização do Redis:', error);
            throw error;
        }
    }
    
    /**
     * Define um valor no cache com TTL
     */
    async set(key, value, ttl = this.defaultTTL) {
        if (!this.connected) {
            console.warn('⚠️ Redis não conectado, ignorando cache set');
            return false;
        }
        
        try {
            const serializedValue = JSON.stringify(value);
            const result = await this.setAsync(key, serializedValue, 'EX', ttl);
            
            this.metrics.operations++;
            console.log(`📝 Cache SET: ${key} (${serializedValue.length} bytes)`);
            
            return result === 'OK';
        } catch (error) {
            console.error(`❌ Erro ao definir cache ${key}:`, error);
            this.metrics.errors++;
            return false;
        }
    }
    
    /**
     * Obtém um valor do cache
     */
    async get(key) {
        if (!this.connected) {
            console.warn('⚠️ Redis não conectado, cache miss');
            this.metrics.misses++;
            return null;
        }
        
        try {
            const value = await this.getAsync(key);
            
            if (value === null) {
                this.metrics.misses++;
                console.log(`❌ Cache MISS: ${key}`);
                return null;
            }
            
            this.metrics.hits++;
            const parsedValue = JSON.parse(value);
            console.log(`✅ Cache HIT: ${key} (${value.length} bytes)`);
            
            return parsedValue;
        } catch (error) {
            console.error(`❌ Erro ao obter cache ${key}:`, error);
            this.metrics.errors++;
            this.metrics.misses++;
            return null;
        }
    }
    
    /**
     * Remove uma chave do cache
     */
    async del(key) {
        if (!this.connected) {
            console.warn('⚠️ Redis não conectado, ignorando cache del');
            return false;
        }
        
        try {
            const result = await this.delAsync(key);
            this.metrics.operations++;
            console.log(`🗑️ Cache DEL: ${key} (${result} chaves removidas)`);
            
            return result > 0;
        } catch (error) {
            console.error(`❌ Erro ao remover cache ${key}:`, error);
            this.metrics.errors++;
            return false;
        }
    }
    
    /**
     * Verifica se uma chave existe
     */
    async exists(key) {
        if (!this.connected) {
            return false;
        }
        
        try {
            const result = await this.existsAsync(key);
            return result === 1;
        } catch (error) {
            console.error(`❌ Erro ao verificar existência ${key}:`, error);
            this.metrics.errors++;
            return false;
        }
    }
    
    /**
     * Define TTL para uma chave existente
     */
    async expire(key, ttl) {
        if (!this.connected) {
            return false;
        }
        
        try {
            const result = await this.expireAsync(key, ttl);
            console.log(`⏰ Cache EXPIRE: ${key} (${ttl}s)`);
            
            return result === 1;
        } catch (error) {
            console.error(`❌ Erro ao definir TTL ${key}:`, error);
            this.metrics.errors++;
            return false;
        }
    }
    
    /**
     * Obtém múltiplos valores (mget)
     */
    async mget(keys) {
        if (!this.connected || keys.length === 0) {
            return [];
        }
        
        try {
            const values = await Promise.all(
                keys.map(key => this.get(key))
            );
            
            console.log(`📦 Cache MGET: ${keys.length} chaves`);
            return values;
        } catch (error) {
            console.error('❌ Erro ao obter múltiplos valores:', error);
            this.metrics.errors++;
            return [];
        }
    }
    
    /**
     * Define múltiplos valores (mset)
     */
    async mset(keyValuePairs, ttl = this.defaultTTL) {
        if (!this.connected || keyValuePairs.length === 0) {
            return false;
        }
        
        try {
            const promises = keyValuePairs.map(([key, value]) => 
                this.set(key, value, ttl)
            );
            
            const results = await Promise.all(promises);
            const success = results.every(result => result);
            
            console.log(`📦 Cache MSET: ${keyValuePairs.length} pares`);
            return success;
        } catch (error) {
            console.error('❌ Erro ao definir múltiplos valores:', error);
            this.metrics.errors++;
            return false;
        }
    }
    
    /**
     * Limpa todo o cache
     */
    async flush() {
        if (!this.connected) {
            return false;
        }
        
        try {
            const result = await this.flushdbAsync();
            console.log('🧹 Cache FLUSH: Todo o cache limpo');
            this.metrics.operations++;
            
            return result === 'OK';
        } catch (error) {
            console.error('❌ Erro ao limpar cache:', error);
            this.metrics.errors++;
            return false;
        }
    }
    
    /**
     * Obtém estatísticas do cache
     */
    getStats() {
        const hitRate = this.metrics.hits + this.metrics.misses > 0 
            ? (this.metrics.hits / (this.metrics.hits + this.metrics.misses)) * 100 
            : 0;
            
        return {
            ...this.metrics,
            hitRate: hitRate.toFixed(2) + '%',
            connected: this.connected,
            uptime: this.connected ? process.uptime() : 0
        };
    }
    
    /**
     * Cache para queries de banco de dados
     */
    async cacheQuery(sql, params, result, ttl = 300) {
        const key = `query:${this.generateQueryHash(sql, params)}`;
        return await this.set(key, result, ttl);
    }
    
    /**
     * Obtém query do cache
     */
    async getCachedQuery(sql, params) {
        const key = `query:${this.generateQueryHash(sql, params)}`;
        return await this.get(key);
    }
    
    /**
     * Cache para sessões de usuário
     */
    async cacheSession(sessionId, sessionData, ttl = 3600) {
        const key = `session:${sessionId}`;
        return await this.set(key, sessionData, ttl);
    }
    
    /**
     * Obtém sessão do cache
     */
    async getCachedSession(sessionId) {
        const key = `session:${sessionId}`;
        return await this.get(key);
    }
    
    /**
     * Cache para dados de jogador
     */
    async cachePlayerData(playerId, playerData, ttl = 600) {
        const key = `player:${playerId}`;
        return await this.set(key, playerData, ttl);
    }
    
    /**
     * Obtém dados de jogador do cache
     */
    async getCachedPlayerData(playerId) {
        const key = `player:${playerId}`;
        return await this.get(key);
    }
    
    /**
     * Cache para dados de mundo
     */
    async cacheWorldData(worldId, worldData, ttl = 1800) {
        const key = `world:${worldId}`;
        return await this.set(key, worldData, ttl);
    }
    
    /**
     * Obtém dados de mundo do cache
     */
    async getCachedWorldData(worldId) {
        const key = `world:${worldId}`;
        return await this.get(key);
    }
    
    /**
     * Cache para configurações
     */
    async cacheConfig(configKey, configValue, ttl = 86400) {
        const key = `config:${configKey}`;
        return await this.set(key, configValue, ttl);
    }
    
    /**
     * Obtém configuração do cache
     */
    async getCachedConfig(configKey) {
        const key = `config:${configKey}`;
        return await this.get(key);
    }
    
    /**
     * Gera hash para queries
     */
    generateQueryHash(sql, params) {
        const crypto = require('crypto');
        const query = sql + JSON.stringify(params);
        return crypto.createHash('md5').update(query).digest('hex');
    }
    
    /**
     * Invalida cache relacionado
     */
    async invalidatePattern(pattern) {
        if (!this.connected) {
            return false;
        }
        
        try {
            const keys = await this.keysAsync(pattern);
            if (keys.length > 0) {
                const result = await this.delAsync(...keys);
                console.log(`🗑️ Cache INVALIDATE: ${keys.length} chaves com padrão ${pattern}`);
                return result > 0;
            }
            return false;
        } catch (error) {
            console.error(`❌ Erro ao invalidar padrão ${pattern}:`, error);
            this.metrics.errors++;
            return false;
        }
    }
    
    /**
     * Health check do Redis
     */
    async healthCheck() {
        if (!this.connected) {
            return { status: 'unhealthy', message: 'Redis não conectado' };
        }
        
        try {
            const start = Date.now();
            await this.setAsync('health_check', 'ok', 'EX', 10);
            const value = await this.getAsync('health_check');
            const latency = Date.now() - start;
            
            if (value === 'ok') {
                return {
                    status: 'healthy',
                    latency: `${latency}ms`,
                    uptime: process.uptime()
                };
            } else {
                return { status: 'unhealthy', message: 'Cache health check falhou' };
            }
        } catch (error) {
            return { status: 'unhealthy', message: error.message };
        }
    }
    
    /**
     * Fecha conexão com Redis
     */
    async close() {
        if (this.client && this.connected) {
            console.log('🔴 Fechando Redis Cache Service');
            await this.client.quit();
            this.connected = false;
        }
    }
}

module.exports = RedisCacheService;
