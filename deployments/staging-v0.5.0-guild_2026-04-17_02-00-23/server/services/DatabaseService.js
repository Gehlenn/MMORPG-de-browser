/**
 * Database Service - Camada de Abstração de Banco de Dados
 * Serviço centralizado para operações de banco com cache e pooling
 * Version 1.0.0 - Refactoring
 */

const sqlite3 = require('sqlite3').verbose();
const { promisify } = require('util');

class DatabaseService {
    constructor() {
        this.db = null;
        this.connectionPool = [];
        this.maxConnections = 10;
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutos
        this.queryCount = 0;
        this.slowQueries = [];
        
        this.initialize();
    }
    
    /**
     * Inicializa o serviço de banco
     */
    async initialize() {
        try {
            console.log('🗄️ Inicializando Database Service v1.0.0');
            
            // Abrir conexão principal
            this.db = new sqlite3.Database('./database/game.db', (err) => {
                if (err) {
                    console.error('❌ Erro ao abrir banco:', err);
                    throw err;
                }
                console.log('✅ Banco de dados conectado');
            });
            
            // Configurar banco para performance
            await this.configureDatabase();
            
            // Criar tabelas se não existirem
            await this.createTables();
            
            console.log('✅ Database Service inicializado com sucesso');
        } catch (error) {
            console.error('❌ Falha na inicialização do Database Service:', error);
            throw error;
        }
    }
    
    /**
     * Configura o banco para performance
     */
    async configureDatabase() {
        const run = promisify(this.db.run.bind(this.db));
        
        // Habilitar foreign keys
        await run('PRAGMA foreign_keys = ON');
        
        // Otimizar para escrita
        await run('PRAGMA journal_mode = WAL');
        
        // Configurar cache
        await run('PRAGMA cache_size = 10000');
        
        // Synchronous mode para operações críticas
        await run('PRAGMA synchronous = NORMAL');
    }
    
    /**
     * Obtém conexão do pool
     */
    getConnection() {
        if (this.connectionPool.length > 0) {
            return this.connectionPool.pop();
        }
        
        // Criar nova conexão se necessário
        if (this.connectionPool.length < this.maxConnections) {
            const newDb = new sqlite3.Database('./database/game.db');
            this.connectionPool.push(newDb);
            return newDb;
        }
        
        console.warn('⚠️ Pool de conexões esgotado');
        return this.db; // Fallback para conexão principal
    }
    
    /**
     * Retorna conexão ao pool
     */
    releaseConnection(connection) {
        if (connection !== this.db && this.connectionPool.length < this.maxConnections) {
            this.connectionPool.push(connection);
        }
    }
    
    /**
     * Cria tabelas necessárias
     */
    async createTables() {
        const run = promisify(this.db.run.bind(this.db));
        
        const tables = [
            {
                name: 'players',
                sql: `
                    CREATE TABLE IF NOT EXISTS players (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        username TEXT UNIQUE NOT NULL,
                        email TEXT UNIQUE,
                        password_hash TEXT NOT NULL,
                        salt TEXT NOT NULL,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        last_login DATETIME,
                        is_active BOOLEAN DEFAULT 1,
                        level INTEGER DEFAULT 1,
                        experience INTEGER DEFAULT 0,
                        gold INTEGER DEFAULT 100,
                        class TEXT DEFAULT 'warrior'
                    )
                `
            },
            {
                name: 'characters',
                sql: `
                    CREATE TABLE IF NOT EXISTS characters (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        player_id INTEGER NOT NULL,
                        name TEXT NOT NULL,
                        class TEXT NOT NULL,
                        level INTEGER DEFAULT 1,
                        experience INTEGER DEFAULT 0,
                        hp INTEGER DEFAULT 100,
                        max_hp INTEGER DEFAULT 100,
                        mana INTEGER DEFAULT 50,
                        max_mana INTEGER DEFAULT 50,
                        strength INTEGER DEFAULT 10,
                        dexterity INTEGER DEFAULT 10,
                        intelligence INTEGER DEFAULT 10,
                        agility INTEGER DEFAULT 10,
                        skill_points INTEGER DEFAULT 0,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        last_played DATETIME,
                        x REAL DEFAULT 400,
                        y REAL DEFAULT 300,
                        map_id TEXT DEFAULT 'starting_area',
                        FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
                    )
                `
            },
            {
                name: 'skills',
                sql: `
                    CREATE TABLE IF NOT EXISTS skills (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        character_id INTEGER NOT NULL,
                        skill_id TEXT NOT NULL,
                        level INTEGER DEFAULT 1,
                        experience INTEGER DEFAULT 0,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
                    )
                `
            },
            {
                name: 'inventory',
                sql: `
                    CREATE TABLE IF NOT EXISTS inventory (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        character_id INTEGER NOT NULL,
                        item_id TEXT NOT NULL,
                        quantity INTEGER DEFAULT 1,
                        slot INTEGER,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
                    )
                `
            },
            {
                name: 'game_sessions',
                sql: `
                    CREATE TABLE IF NOT EXISTS game_sessions (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        character_id INTEGER NOT NULL,
                        session_token TEXT UNIQUE NOT NULL,
                        started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        ended_at DATETIME,
                        duration INTEGER,
                        experience_gained INTEGER DEFAULT 0,
                        gold_gained INTEGER DEFAULT 0,
                        FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
                    )
                `
            }
        ];
        
        for (const table of tables) {
            try {
                await run(table.sql);
                console.log(`✅ Tabela verificada/criada: ${table.name}`);
            } catch (error) {
                console.error(`❌ Erro ao criar tabela ${table.name}:`, error);
                throw error;
            }
        }
    }
    
    /**
     * Executa query com cache
     */
    async query(sql, params = [], useCache = true) {
        const startTime = Date.now();
        this.queryCount++;
        
        // Verificar cache
        const cacheKey = this.generateCacheKey(sql, params);
        if (useCache && this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheTimeout) {
                return cached.result;
            }
        }
        
        const connection = this.getConnection();
        const run = promisify(connection.all.bind(connection));
        
        try {
            const result = await run(sql, params);
            
            // Armazenar em cache
            if (useCache) {
                this.cache.set(cacheKey, {
                    result,
                    timestamp: Date.now()
                });
            }
            
            // Limpar cache antigo
            this.cleanCache();
            
            // Log de performance
            const duration = Date.now() - startTime;
            if (duration > 100) {
                this.slowQueries.push({
                    sql,
                    params,
                    duration,
                    timestamp: new Date().toISOString()
                });
            }
            
            return result;
        } catch (error) {
            console.error('❌ Erro na query:', error);
            throw error;
        } finally {
            this.releaseConnection(connection);
        }
    }
    
    /**
     * Executa query única (retorna um registro)
     */
    async get(sql, params = [], useCache = true) {
        const results = await this.query(sql, params, useCache);
        return results[0] || null;
    }
    
    /**
     * Executa query de inserção/atualização
     */
    async run(sql, params = []) {
        const connection = this.getConnection();
        const run = promisify(connection.run.bind(connection));
        
        try {
            const result = await run(sql, params);
            
            // Invalidar cache relacionado
            this.invalidateRelatedCache(sql);
            
            return result;
        } catch (error) {
            console.error('❌ Erro na query RUN:', error);
            throw error;
        } finally {
            this.releaseConnection(connection);
        }
    }
    
    /**
     * Gera chave de cache
     */
    generateCacheKey(sql, params) {
        return `${sql}:${JSON.stringify(params)}`;
    }
    
    /**
     * Limpa cache expirado
     */
    cleanCache() {
        const now = Date.now();
        for (const [key, value] of this.cache) {
            if (now - value.timestamp > this.cacheTimeout) {
                this.cache.delete(key);
            }
        }
    }
    
    /**
     * Invalida cache relacionado
     */
    invalidateRelatedCache(sql) {
        const lowerSql = sql.toLowerCase();
        
        for (const [key] of this.cache) {
            if (key.includes(lowerSql)) {
                this.cache.delete(key);
            }
        }
    }
    
    /**
     * Limpa todo o cache
     */
    clearCache() {
        this.cache.clear();
        console.log('🧹 Cache limpo');
    }
    
    /**
     * Obtém estatísticas do banco
     */
    getStats() {
        return {
            queryCount: this.queryCount,
            cacheSize: this.cache.size,
            connectionPoolSize: this.connectionPool.length,
            slowQueries: this.slowQueries.length,
            uptime: process.uptime()
        };
    }
    
    /**
     * Operações de jogadores
     */
    async createPlayer(playerData) {
        const sql = `
            INSERT INTO players (username, email, password_hash, salt, created_at)
            VALUES (?, ?, ?, ?, ?)
        `;
        
        return await this.run(sql, [
            playerData.username,
            playerData.email,
            playerData.passwordHash,
            playerData.salt
        ]);
    }
    
    async getPlayerByUsername(username) {
        const sql = 'SELECT * FROM players WHERE username = ? AND is_active = 1';
        return await this.get(sql, [username]);
    }
    
    async getPlayerById(id) {
        const sql = 'SELECT * FROM players WHERE id = ?';
        return await this.get(sql, [id]);
    }
    
    async updatePlayerLastLogin(id) {
        const sql = 'UPDATE players SET last_login = CURRENT_TIMESTAMP WHERE id = ?';
        return await this.run(sql, [id]);
    }
    
    /**
     * Operações de personagens
     */
    async createCharacter(characterData) {
        const sql = `
            INSERT INTO characters (player_id, name, class, level, experience, hp, max_hp, mana, max_mana, strength, dexterity, intelligence, agility, skill_points, x, y, map_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        return await this.run(sql, [
            characterData.playerId,
            characterData.name,
            characterData.class,
            characterData.level,
            characterData.experience,
            characterData.hp,
            characterData.maxHp,
            characterData.mana,
            characterData.maxMana,
            characterData.strength,
            characterData.dexterity,
            characterData.intelligence,
            characterData.agility,
            characterData.skillPoints,
            characterData.x,
            characterData.y,
            characterData.mapId
        ]);
    }
    
    async getCharactersByPlayerId(playerId) {
        const sql = 'SELECT * FROM characters WHERE player_id = ? ORDER BY created_at';
        return await this.query(sql, [playerId]);
    }
    
    async updateCharacterLevel(characterId, newLevel, experience) {
        const sql = 'UPDATE characters SET level = ?, experience = ? WHERE id = ?';
        return await this.run(sql, [newLevel, experience, characterId]);
    }
    
    /**
     * Operações de sessões
     */
    async createGameSession(characterId, sessionToken) {
        const sql = `
            INSERT INTO game_sessions (character_id, session_token, started_at)
            VALUES (?, ?, ?)
        `;
        
        return await this.run(sql, [characterId, sessionToken]);
    }
    
    async getGameSession(sessionToken) {
        const sql = `
            SELECT gs.*, c.name as character_name, c.class, c.level
            FROM game_sessions gs
            JOIN characters c ON gs.character_id = c.id
            WHERE gs.session_token = ? AND gs.ended_at IS NULL
        `;
        
        return await this.get(sql, [sessionToken]);
    }
    
    async endGameSession(sessionToken, experience, gold) {
        const sql = `
            UPDATE game_sessions 
            SET ended_at = CURRENT_TIMESTAMP, duration = strftime('%s', 'now') - started_at, experience_gained = ?, gold_gained = ?
            WHERE session_token = ?
        `;
        
        return await this.run(sql, [experience, gold, sessionToken]);
    }
    
    /**
     * Fecha o serviço de banco
     */
    async close() {
        if (this.db) {
            console.log('🔒 Fechando Database Service');
            
            // Limpar pool de conexões
            for (const connection of this.connectionPool) {
                if (connection !== this.db) {
                    connection.close();
                }
            }
            
            // Fechar conexão principal
            await new Promise((resolve) => {
                this.db.close((err) => {
                    if (err) {
                        console.error('❌ Erro ao fechar banco:', err);
                    } else {
                        console.log('✅ Database Service fechado com sucesso');
                    }
                    resolve();
                });
            });
        }
    }
}

module.exports = DatabaseService;
