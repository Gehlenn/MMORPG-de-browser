/**
 * DatabaseArchitecture.js
 * Arquitetura de Banco de Dados Otimizada para Produção
 * Legacy of Komodo MMORPG v0.6.0 - Nível 10
 * 
 * Features:
 * - Connection Pooling
 * - Query Optimization
 * - Redis Caching Layer
 * - Read/Write Replication
 * - Sharding Support
 * - Automated Backups
 * - Connection Health Monitoring
 */

const { Pool } = require('pg');
const Redis = require('ioredis');
const EventEmitter = require('events');

class DatabaseArchitecture extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            // PostgreSQL Primary
            primary: {
                host: config.primaryHost || process.env.DB_HOST || 'localhost',
                port: config.primaryPort || process.env.DB_PORT || 5432,
                database: config.database || process.env.DB_NAME || 'legacy_komodo',
                user: config.user || process.env.DB_USER || 'postgres',
                password: config.password || process.env.DB_PASSWORD || '',
                // Pool settings
                maxConnections: config.maxConnections || 50,
                minConnections: config.minConnections || 10,
                idleTimeoutMillis: 30000,
                connectionTimeoutMillis: 2000,
                statementTimeout: 30000,
                queryTimeout: 30000
            },
            
            // Read Replicas
            replicas: config.replicas || [],
            
            // Redis Cache
            redis: {
                host: config.redisHost || process.env.REDIS_HOST || 'localhost',
                port: config.redisPort || process.env.REDIS_PORT || 6379,
                password: config.redisPassword || process.env.REDIS_PASSWORD,
                db: config.redisDb || 0,
                maxRetriesPerRequest: 3,
                enableReadyCheck: true,
                maxSockets: 10
            },
            
            // Performance
            cacheTTL: config.cacheTTL || 300, // 5 minutos default
            queryCacheSize: config.queryCacheSize || 1000,
            enableQueryLogging: config.enableQueryLogging || false,
            slowQueryThreshold: config.slowQueryThreshold || 1000, // ms
            
            // Sharding
            shardCount: config.shardCount || 1,
            shardKey: config.shardKey || 'player_id',
            
            // Backup
            backupInterval: config.backupInterval || 24 * 60 * 60 * 1000, // 24h
            backupRetention: config.backupRetention || 30, // dias
            backupPath: config.backupPath || './backups'
        };
        
        // Connection pools
        this.primaryPool = null;
        this.replicaPools = [];
        this.redisClient = null;
        
        // Stats
        this.stats = {
            queriesExecuted: 0,
            cacheHits: 0,
            cacheMisses: 0,
            slowQueries: 0,
            errors: 0,
            connectionFails: 0
        };
        
        // Query cache (in-memory LRU)
        this.queryCache = new Map();
        this.queryCacheTimestamps = new Map();
        
        // Health status
        this.health = {
            primary: 'unknown',
            replicas: [],
            redis: 'unknown',
            lastCheck: null
        };
        
        this.initialized = false;
    }

    /**
     * Inicializa arquitetura completa
     */
    async initialize() {
        if (this.initialized) return;
        
        console.log('🗄️ Initializing Database Architecture...');
        
        try {
            // 1. Setup Primary Connection Pool
            await this.setupPrimaryPool();
            
            // 2. Setup Read Replicas
            await this.setupReplicaPools();
            
            // 3. Setup Redis Cache
            await this.setupRedis();
            
            // 4. Setup Monitoring
            this.setupHealthMonitoring();
            
            // 5. Setup Backup System
            this.setupBackupSystem();
            
            // 6. Run Initial Health Check
            await this.healthCheck();
            
            this.initialized = true;
            this.emit('ready');
            
            console.log('✅ Database Architecture ready');
            console.log(`   Primary: ${this.health.primary}`);
            console.log(`   Replicas: ${this.replicaPools.length}`);
            console.log(`   Redis: ${this.health.redis}`);
            
        } catch (error) {
            console.error('❌ Database Architecture initialization failed:', error);
            this.emit('error', error);
            throw error;
        }
    }

    /**
     * Setup Primary Connection Pool
     */
    async setupPrimaryPool() {
        this.primaryPool = new Pool({
            host: this.config.primary.host,
            port: this.config.primary.port,
            database: this.config.primary.database,
            user: this.config.primary.user,
            password: this.config.primary.password,
            max: this.config.primary.maxConnections,
            min: this.config.primary.minConnections,
            idleTimeoutMillis: this.config.primary.idleTimeoutMillis,
            connectionTimeoutMillis: this.config.primary.connectionTimeoutMillis,
            statement_timeout: this.config.primary.statementTimeout,
            query_timeout: this.config.primary.queryTimeout
        });
        
        // Event handlers
        this.primaryPool.on('connect', () => {
            this.health.primary = 'healthy';
            this.emit('primary:connect');
        });
        
        this.primaryPool.on('error', (err) => {
            console.error('Primary pool error:', err);
            this.health.primary = 'error';
            this.stats.errors++;
            this.emit('primary:error', err);
        });
        
        this.primaryPool.on('remove', () => {
            this.emit('primary:disconnect');
        });
        
        // Test connection
        const client = await this.primaryPool.connect();
        await client.query('SELECT NOW()');
        client.release();
        
        console.log('✅ Primary pool established');
    }

    /**
     * Setup Read Replica Pools
     */
    async setupReplicaPools() {
        for (const replica of this.config.replicas) {
            try {
                const pool = new Pool({
                    host: replica.host,
                    port: replica.port || 5432,
                    database: this.config.primary.database,
                    user: this.config.primary.user,
                    password: this.config.primary.password,
                    max: 20,
                    min: 5,
                    idleTimeoutMillis: 30000,
                    connectionTimeoutMillis: 2000,
                    application_name: 'legacy_komodo_read'
                });
                
                // Test connection
                const client = await pool.connect();
                await client.query('SELECT 1');
                client.release();
                
                this.replicaPools.push({
                    pool: pool,
                    host: replica.host,
                    status: 'healthy',
                    queryCount: 0
                });
                
                console.log(`✅ Replica pool established: ${replica.host}`);
                
            } catch (error) {
                console.warn(`⚠️ Failed to connect to replica ${replica.host}:`, error.message);
                this.health.replicas.push({ host: replica.host, status: 'error' });
            }
        }
    }

    /**
     * Setup Redis Cache
     */
    async setupRedis() {
        this.redisClient = new Redis({
            host: this.config.redis.host,
            port: this.config.redis.port,
            password: this.config.redis.password,
            db: this.config.redis.db,
            maxRetriesPerRequest: this.config.redis.maxRetriesPerRequest,
            enableReadyCheck: this.config.redis.enableReadyCheck,
            retryStrategy: (times) => {
                const delay = Math.min(times * 50, 2000);
                return delay;
            }
        });
        
        this.redisClient.on('connect', () => {
            this.health.redis = 'healthy';
            this.emit('redis:connect');
        });
        
        this.redisClient.on('error', (err) => {
            console.error('Redis error:', err);
            this.health.redis = 'error';
            this.emit('redis:error', err);
        });
        
        // Test connection
        await this.redisClient.ping();
        
        console.log('✅ Redis cache connected');
    }

    /**
     * Query com caching e routing inteligente
     */
    async query(sql, params = [], options = {}) {
        const startTime = Date.now();
        const {
            useCache = true,
            cacheTTL = this.config.cacheTTL,
            forcePrimary = false,
            priority = 'normal' // normal, high, critical
        } = options;
        
        // Generate cache key
        const cacheKey = useCache ? this.generateCacheKey(sql, params) : null;
        
        // Try cache first
        if (useCache && cacheKey) {
            const cached = await this.getFromCache(cacheKey);
            if (cached) {
                this.stats.cacheHits++;
                return {
                    rows: cached,
                    cached: true,
                    queryTime: Date.now() - startTime
                };
            }
        }
        
        // Select connection
        const isReadQuery = this.isReadQuery(sql);
        let client;
        
        try {
            if (forcePrimary || !isReadQuery || this.replicaPools.length === 0) {
                // Use primary for writes or if forced
                client = await this.getPrimaryConnection(priority);
            } else {
                // Use replica for reads
                client = await this.getReplicaConnection();
            }
            
            // Execute query
            const result = await client.query(sql, params);
            
            const queryTime = Date.now() - startTime;
            this.stats.queriesExecuted++;
            
            // Log slow queries
            if (queryTime > this.config.slowQueryThreshold) {
                this.stats.slowQueries++;
                console.warn(`⚠️ Slow query (${queryTime}ms): ${sql.substring(0, 100)}...`);
                this.emit('slowQuery', { sql, params, time: queryTime });
            }
            
            // Cache result if applicable
            if (useCache && cacheKey && isReadQuery) {
                await this.setCache(cacheKey, result.rows, cacheTTL);
            }
            
            return {
                rows: result.rows,
                rowCount: result.rowCount,
                cached: false,
                queryTime: queryTime
            };
            
        } catch (error) {
            this.stats.errors++;
            console.error('Query error:', error);
            throw error;
        } finally {
            if (client && client.release) {
                client.release();
            }
        }
    }

    /**
     * Transaction com retry e circuit breaker
     */
    async transaction(callback, options = {}) {
        const { retries = 3, isolationLevel = 'READ COMMITTED' } = options;
        
        let lastError;
        
        for (let attempt = 0; attempt < retries; attempt++) {
            const client = await this.primaryPool.connect();
            
            try {
                // Set isolation level
                await client.query(`SET TRANSACTION ISOLATION LEVEL ${isolationLevel}`);
                
                // Begin transaction
                await client.query('BEGIN');
                
                // Execute callback
                const result = await callback(client);
                
                // Commit
                await client.query('COMMIT');
                
                return result;
                
            } catch (error) {
                await client.query('ROLLBACK').catch(() => {});
                lastError = error;
                
                // Retry on specific errors
                if (this.isRetryableError(error) && attempt < retries - 1) {
                    const delay = Math.pow(2, attempt) * 100;
                    await this.sleep(delay);
                    continue;
                }
                
                throw error;
            } finally {
                client.release();
            }
        }
        
        throw lastError;
    }

    /**
     * Batch operations otimizado
     */
    async batchInsert(table, columns, values, options = {}) {
        const { batchSize = 1000, onConflict = 'DO NOTHING' } = options;
        
        const results = [];
        
        for (let i = 0; i < values.length; i += batchSize) {
            const batch = values.slice(i, i + batchSize);
            
            // Generate placeholders
            const placeholders = batch.map((_, rowIndex) => 
                columns.map((_, colIndex) => `$${rowIndex * columns.length + colIndex + 1}`).join(', ')
            ).map(p => `(${p})`).join(', ');
            
            const flatValues = batch.flat();
            
            const sql = `
                INSERT INTO ${table} (${columns.join(', ')})
                VALUES ${placeholders}
                ON CONFLICT ${onConflict}
                RETURNING *
            `;
            
            const result = await this.query(sql, flatValues, { forcePrimary: true });
            results.push(...result.rows);
        }
        
        return results;
    }

    /**
     * Get from cache (multi-layer: L1 in-memory, L2 Redis)
     */
    async getFromCache(key) {
        // L1: In-memory
        const l1Cached = this.queryCache.get(key);
        if (l1Cached) {
            const timestamp = this.queryCacheTimestamps.get(key);
            if (Date.now() - timestamp < 60000) { // 1 min in-memory
                return l1Cached;
            }
        }
        
        // L2: Redis
        try {
            const l2Cached = await this.redisClient.get(key);
            if (l2Cached) {
                const parsed = JSON.parse(l2Cached);
                // Populate L1
                this.queryCache.set(key, parsed);
                this.queryCacheTimestamps.set(key, Date.now());
                return parsed;
            }
        } catch (error) {
            // Redis error, continue without cache
        }
        
        this.stats.cacheMisses++;
        return null;
    }

    /**
     * Set cache em ambas as camadas
     */
    async setCache(key, value, ttl) {
        // L1: In-memory
        this.queryCache.set(key, value);
        this.queryCacheTimestamps.set(key, Date.now());
        
        // L2: Redis
        try {
            await this.redisClient.setex(key, ttl, JSON.stringify(value));
        } catch (error) {
            // Redis error, continue
        }
    }

    /**
     * Invalidate cache
     */
    async invalidateCache(pattern) {
        // L1: In-memory
        for (const key of this.queryCache.keys()) {
            if (key.includes(pattern)) {
                this.queryCache.delete(key);
                this.queryCacheTimestamps.delete(key);
            }
        }
        
        // L2: Redis
        try {
            const keys = await this.redisClient.keys(`*${pattern}*`);
            if (keys.length > 0) {
                await this.redisClient.del(...keys);
            }
        } catch (error) {
            console.error('Cache invalidation error:', error);
        }
    }

    /**
     * Sharding: determina qual shard baseado na chave
     */
    getShardForKey(key) {
        if (this.config.shardCount === 1) return 0;
        
        // Consistent hashing
        const hash = this.hashKey(key);
        return hash % this.config.shardCount;
    }

    /**
     * Hash function para sharding
     */
    hashKey(key) {
        let hash = 0;
        for (let i = 0; i < key.length; i++) {
            const char = key.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash);
    }

    /**
     * Health check periódico
     */
    async healthCheck() {
        const checks = {
            timestamp: Date.now(),
            primary: await this.checkPrimary(),
            replicas: [],
            redis: await this.checkRedis()
        };
        
        // Check replicas
        for (const replica of this.replicaPools) {
            try {
                const client = await replica.pool.connect();
                await client.query('SELECT 1');
                client.release();
                checks.replicas.push({ host: replica.host, status: 'healthy' });
                replica.status = 'healthy';
            } catch (error) {
                checks.replicas.push({ host: replica.host, status: 'error', error: error.message });
                replica.status = 'error';
            }
        }
        
        this.health = checks;
        this.health.lastCheck = Date.now();
        
        this.emit('healthCheck', checks);
        
        return checks;
    }

    /**
     * Setup health monitoring
     */
    setupHealthMonitoring() {
        // Health check a cada 30 segundos
        setInterval(() => this.healthCheck(), 30000);
        
        // Cleanup cache antigo a cada 5 minutos
        setInterval(() => this.cleanupOldCache(), 300000);
        
        // Log stats a cada hora
        setInterval(() => this.logStats(), 3600000);
    }

    /**
     * Setup automated backups
     */
    setupBackupSystem() {
        const backup = async () => {
            try {
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                const filename = `${this.config.backupPath}/backup-${timestamp}.sql`;
                
                // Executa pg_dump
                const { exec } = require('child_process');
                const command = `pg_dump -h ${this.config.primary.host} -p ${this.config.primary.port} -U ${this.config.primary.user} -d ${this.config.primary.database} -f ${filename}`;
                
                exec(command, { env: { PGPASSWORD: this.config.primary.password } }, (error) => {
                    if (error) {
                        console.error('Backup error:', error);
                        this.emit('backup:error', error);
                    } else {
                        console.log(`✅ Backup completed: ${filename}`);
                        this.emit('backup:complete', filename);
                        this.cleanupOldBackups();
                    }
                });
                
            } catch (error) {
                console.error('Backup setup error:', error);
            }
        };
        
        // Schedule backup
        setInterval(backup, this.config.backupInterval);
        
        console.log('✅ Backup system configured');
    }

    /**
     * Cleanup old backups
     */
    async cleanupOldBackups() {
        const fs = require('fs').promises;
        const path = require('path');
        
        try {
            const files = await fs.readdir(this.config.backupPath);
            const cutoff = Date.now() - (this.config.backupRetention * 24 * 60 * 60 * 1000);
            
            for (const file of files) {
                const filePath = path.join(this.config.backupPath, file);
                const stats = await fs.stat(filePath);
                
                if (stats.mtime.getTime() < cutoff) {
                    await fs.unlink(filePath);
                    console.log(`🗑️ Removed old backup: ${file}`);
                }
            }
        } catch (error) {
            console.error('Backup cleanup error:', error);
        }
    }

    // ==================== HELPER METHODS ====================

    async getPrimaryConnection(priority = 'normal') {
        const client = await this.primaryPool.connect();
        
        // Set statement timeout baseado na prioridade
        const timeout = priority === 'critical' ? 60000 : 
                       priority === 'high' ? 30000 : 10000;
        await client.query(`SET statement_timeout = ${timeout}`);
        
        return client;
    }

    async getReplicaConnection() {
        // Load balancing round-robin
        const healthyReplicas = this.replicaPools.filter(r => r.status === 'healthy');
        
        if (healthyReplicas.length === 0) {
            // Fallback to primary
            return this.getPrimaryConnection();
        }
        
        // Select least loaded replica
        const replica = healthyReplicas.reduce((min, r) => 
            r.queryCount < min.queryCount ? r : min
        );
        
        replica.queryCount++;
        
        const client = await replica.pool.connect();
        return client;
    }

    isReadQuery(sql) {
        const readPatterns = /^\s*(SELECT|WITH|EXPLAIN|SHOW|DESCRIBE)/i;
        return readPatterns.test(sql);
    }

    isRetryableError(error) {
        const retryableCodes = ['ECONNRESET', 'ETIMEDOUT', '08006', '08003', '40001'];
        return retryableCodes.some(code => 
            error.code === code || 
            error.message?.includes(code)
        );
    }

    generateCacheKey(sql, params) {
        const crypto = require('crypto');
        const data = `${sql}:${JSON.stringify(params)}`;
        return `query:${crypto.createHash('sha256').update(data).digest('hex').substring(0, 32)}`;
    }

    async checkPrimary() {
        try {
            const client = await this.primaryPool.connect();
            const result = await client.query('SELECT NOW(), pg_database_size(current_database()) as size');
            client.release();
            
            return {
                status: 'healthy',
                timestamp: result.rows[0].now,
                databaseSize: result.rows[0].size
            };
        } catch (error) {
            return { status: 'error', error: error.message };
        }
    }

    async checkRedis() {
        try {
            const info = await this.redisClient.info('server');
            const uptime = info.match(/uptime_in_seconds:(\d+)/);
            
            return {
                status: 'healthy',
                uptime: uptime ? parseInt(uptime[1]) : 0
            };
        } catch (error) {
            return { status: 'error', error: error.message };
        }
    }

    cleanupOldCache() {
        const now = Date.now();
        const maxAge = 60000; // 1 minuto
        
        for (const [key, timestamp] of this.queryCacheTimestamps) {
            if (now - timestamp > maxAge) {
                this.queryCache.delete(key);
                this.queryCacheTimestamps.delete(key);
            }
        }
    }

    logStats() {
        console.log('📊 Database Stats (last hour):');
        console.log(`   Queries: ${this.stats.queriesExecuted}`);
        console.log(`   Cache Hit Rate: ${(this.stats.cacheHits / (this.stats.cacheHits + this.stats.cacheMisses) * 100).toFixed(1)}%`);
        console.log(`   Slow Queries: ${this.stats.slowQueries}`);
        console.log(`   Errors: ${this.stats.errors}`);
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Graceful shutdown
     */
    async shutdown() {
        console.log('🛑 Shutting down Database Architecture...');
        
        // Close pools
        if (this.primaryPool) {
            await this.primaryPool.end();
        }
        
        for (const replica of this.replicaPools) {
            await replica.pool.end();
        }
        
        if (this.redisClient) {
            await this.redisClient.quit();
        }
        
        console.log('✅ Database Architecture shutdown complete');
    }

    getStats() {
        return {
            ...this.stats,
            cacheHitRate: this.stats.cacheHits / (this.stats.cacheHits + this.stats.cacheMisses),
            health: this.health,
            poolStatus: {
                primary: {
                    total: this.primaryPool?.totalCount || 0,
                    idle: this.primaryPool?.idleCount || 0,
                    waiting: this.primaryPool?.waitingCount || 0
                },
                replicas: this.replicaPools.map(r => ({
                    host: r.host,
                    total: r.pool?.totalCount || 0,
                    status: r.status
                }))
            }
        };
    }
}

module.exports = DatabaseArchitecture;
