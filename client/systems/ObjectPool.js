/**
 * ObjectPool.js
 * Sistema de Object Pooling para Performance
 * Legacy of Komodo MMORPG v0.5.0
 */

class ObjectPool {
    constructor(createFn, resetFn, initialSize = 10, maxSize = 100) {
        this.createFn = createFn;
        this.resetFn = resetFn;
        this.pool = [];
        this.active = new Set();
        this.maxSize = maxSize;
        this.totalCreated = 0;
        this.totalReused = 0;
        
        // Pre-popula o pool
        for (let i = 0; i < initialSize; i++) {
            this.pool.push(this.createFn());
            this.totalCreated++;
        }
        
        console.log(`🔄 ObjectPool initialized (size: ${initialSize}, max: ${maxSize})`);
    }

    /**
     * Obtém objeto do pool
     */
    acquire() {
        let obj;
        
        if (this.pool.length > 0) {
            // Reusa objeto existente
            obj = this.pool.pop();
            this.totalReused++;
        } else if (this.active.size < this.maxSize) {
            // Cria novo objeto
            obj = this.createFn();
            this.totalCreated++;
        } else {
            // Pool esgotado
            console.warn('ObjectPool: Max size reached, returning null');
            return null;
        }
        
        // Reseta objeto antes de usar
        this.resetFn(obj);
        this.active.add(obj);
        
        return obj;
    }

    /**
     * Devolve objeto ao pool
     */
    release(obj) {
        if (!obj || !this.active.has(obj)) return;
        
        this.active.delete(obj);
        
        // Limpa referências
        if (obj.cleanup) {
            obj.cleanup();
        }
        
        // Retorna ao pool
        this.pool.push(obj);
    }

    /**
     * Obtém estatísticas
     */
    getStats() {
        return {
            available: this.pool.length,
            active: this.active.size,
            total: this.pool.length + this.active.size,
            created: this.totalCreated,
            reused: this.totalReused,
            reuseRate: this.totalCreated > 0 ? 
                ((this.totalReused / (this.totalReused + this.totalCreated)) * 100).toFixed(1) + '%' : '0%'
        };
    }

    /**
     * Limpa pool
     */
    clear() {
        this.pool = [];
        this.active.clear();
        this.totalCreated = 0;
        this.totalReused = 0;
    }
}

/**
 * PoolManager - Gerencia múltiplos pools
 */
class PoolManager {
    constructor() {
        this.pools = new Map();
        this.initialized = false;
        
        console.log('🏊 PoolManager initialized');
    }

    /**
     * Inicializa pools comuns
     */
    initialize() {
        if (this.initialized) return;
        
        console.log('🏊 Initializing object pools...');
        
        // Pool de projéteis
        this.createPool('projectiles', 
            () => ({ x: 0, y: 0, vx: 0, vy: 0, damage: 0, owner: null, active: false }),
            (obj) => { obj.x = 0; obj.y = 0; obj.vx = 0; obj.vy = 0; obj.damage = 0; obj.owner = null; obj.active = true; },
            50, 200
        );
        
        // Pool de partículas
        this.createPool('particles',
            () => ({ x: 0, y: 0, vx: 0, vy: 0, life: 0, maxLife: 0, color: null, size: 0, active: false }),
            (obj) => { obj.x = 0; obj.y = 0; obj.vx = 0; obj.vy = 0; obj.life = 0; obj.maxLife = 0; obj.color = null; obj.size = 0; obj.active = true; },
            100, 500
        );
        
        // Pool de textos flutuantes
        this.createPool('floatingTexts',
            () => ({ x: 0, y: 0, text: '', color: '', life: 0, vy: 0, active: false }),
            (obj) => { obj.x = 0; obj.y = 0; obj.text = ''; obj.color = ''; obj.life = 0; obj.vy = -1; obj.active = true; },
            20, 50
        );
        
        // Pool de mobs (para spawning)
        this.createPool('mobInstances',
            () => ({ id: null, type: null, x: 0, y: 0, hp: 0, maxHp: 0, active: false }),
            (obj) => { obj.id = null; obj.type = null; obj.x = 0; obj.y = 0; obj.hp = 0; obj.maxHp = 0; obj.active = true; },
            30, 100
        );
        
        // Pool de pickups
        this.createPool('pickups',
            () => ({ x: 0, y: 0, type: '', value: 0, active: false }),
            (obj) => { obj.x = 0; obj.y = 0; obj.type = ''; obj.value = 0; obj.active = true; },
            20, 50
        );
        
        this.initialized = true;
        console.log('✅ Object pools initialized');
    }

    /**
     * Cria um novo pool
     */
    createPool(name, createFn, resetFn, initialSize = 10, maxSize = 100) {
        const pool = new ObjectPool(createFn, resetFn, initialSize, maxSize);
        this.pools.set(name, pool);
        return pool;
    }

    /**
     * Obtém objeto de um pool
     */
    acquire(poolName) {
        const pool = this.pools.get(poolName);
        if (!pool) {
            console.warn(`Pool ${poolName} not found`);
            return null;
        }
        return pool.acquire();
    }

    /**
     * Devolve objeto ao pool
     */
    release(poolName, obj) {
        const pool = this.pools.get(poolName);
        if (!pool) {
            console.warn(`Pool ${poolName} not found`);
            return;
        }
        pool.release(obj);
    }

    /**
     * Obtém estatísticas de todos os pools
     */
    getStats() {
        const stats = {};
        this.pools.forEach((pool, name) => {
            stats[name] = pool.getStats();
        });
        return stats;
    }

    /**
     * Limpa todos os pools
     */
    clearAll() {
        this.pools.forEach(pool => pool.clear());
    }
}

// Exporta para uso global
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ObjectPool, PoolManager };
} else {
    window.ObjectPool = ObjectPool;
    window.PoolManager = PoolManager;
}
