/**
 * PerformanceOptimizer - Sistema de Otimização de Performance
 * 
 * Gerencia:
 * - Spatial Partitioning (Grid) para colisões
 * - Object Pooling para partículas e efeitos
 * - Adaptive Quality baseado em FPS
 * - Memory management e cleanup
 * - Frame time monitoring
 */

class PerformanceOptimizer {
    constructor(gameplayEngine) {
        this.engine = gameplayEngine;
        
        // Configurações
        this.config = {
            // Spatial Partitioning
            gridCellSize: 100,
            gridUpdateInterval: 500, // ms
            
            // Object Pooling
            particlePoolSize: 100,
            textPoolSize: 50,
            effectPoolSize: 30,
            
            // Adaptive Quality
            targetFPS: 60,
            adaptiveQuality: true,
            qualityLevels: ['high', 'medium', 'low'],
            currentQuality: 'high',
            
            // Cleanup
            cleanupInterval: 5000, // ms
            maxParticles: 200,
            maxCombatEffects: 50,
            maxFloatingTexts: 30,
            
            // Throttling
            renderThrottle: 0, // ms entre renders (0 = sem throttle)
            updateThrottle: 0,
        };
        
        // Estado
        this.spatialGrid = new Map();
        this.lastGridUpdate = 0;
        
        // Object Pools
        this.pools = {
            particles: [],
            floatingTexts: [],
            combatEffects: [],
            attackAnimations: []
        };
        
        // Performance Metrics
        this.metrics = {
            fps: 60,
            frameTime: 16.67,
            renderTime: 0,
            updateTime: 0,
            collisionChecks: 0,
            objectsRendered: 0,
            lastUpdate: performance.now()
        };
        
        // FPS History para adaptação suave
        this.fpsHistory = [];
        this.maxFPSHistory = 30;
        
        // Throttling
        this.lastRenderTime = 0;
        this.lastUpdateTime = 0;
        
        // Memory tracking
        this.memorySnapshots = [];
        
        this.initialized = false;
    }
    
    /**
     * Inicializa o otimizador
     */
    init() {
        if (this.initialized) return;
        
        this.createObjectPools();
        this.startCleanupInterval();
        
        this.initialized = true;
        console.log('⚡ PerformanceOptimizer inicializado');
    }
    
    // ===================== SPATIAL PARTITIONING =====================
    
    /**
     * Atualiza a spatial grid com posições atuais de entidades
     */
    updateSpatialGrid() {
        const now = Date.now();
        if (now - this.lastGridUpdate < this.config.gridUpdateInterval) {
            return;
        }
        this.lastGridUpdate = now;
        
        // Limpar grid anterior
        this.spatialGrid.clear();
        
        // Inserir obstáculos no grid
        if (this.engine.map && this.engine.map.obstacles) {
            this.engine.map.obstacles.forEach(obstacle => {
                this.insertIntoGrid('obstacle', obstacle);
            });
        }
        
        // Inserir mobs no grid
        if (this.engine.mobs) {
            this.engine.mobs.forEach(mob => {
                this.insertIntoGrid('mob', mob);
            });
        }
        
        // Inserir loot drops no grid
        if (this.engine.lootDrops) {
            this.engine.lootDrops.forEach(drop => {
                this.insertIntoGrid('loot', drop);
            });
        }
    }
    
    /**
     * Insere objeto no grid espacial
     */
    insertIntoGrid(type, obj) {
        const cellX = Math.floor(obj.x / this.config.gridCellSize);
        const cellY = Math.floor(obj.y / this.config.gridCellSize);
        const key = `${cellX},${cellY}`;
        
        if (!this.spatialGrid.has(key)) {
            this.spatialGrid.set(key, []);
        }
        
        this.spatialGrid.get(key).push({ type, obj });
    }
    
    /**
     * Retorna objetos próximos a uma posição (para colisão otimizada)
     */
    getNearbyObjects(x, y, width, height, types = ['obstacle', 'mob']) {
        const nearby = [];
        
        // Calcular células cobertas pela área
        const startCellX = Math.floor((x - width) / this.config.gridCellSize);
        const endCellX = Math.floor((x + width * 2) / this.config.gridCellSize);
        const startCellY = Math.floor((y - height) / this.config.gridCellSize);
        const endCellY = Math.floor((y + height * 2) / this.config.gridCellSize);
        
        for (let cx = startCellX; cx <= endCellX; cx++) {
            for (let cy = startCellY; cy <= endCellY; cy++) {
                const key = `${cx},${cy}`;
                const cell = this.spatialGrid.get(key);
                
                if (cell) {
                    cell.forEach(item => {
                        if (types.includes(item.type)) {
                            nearby.push(item.obj);
                        }
                    });
                }
            }
        }
        
        return nearby;
    }
    
    /**
     * Versão otimizada de checkCollisionWithAll usando spatial grid
     */
    checkCollisionOptimized(x, y, width, height) {
        // Usar colisão tradicional se grid não estiver pronto
        if (this.spatialGrid.size === 0) {
            return this.engine.checkCollisionWithAll(x, y, width, height);
        }
        
        this.metrics.collisionChecks++;
        
        // Verificar apenas objetos próximos
        const nearby = this.getNearbyObjects(x, y, width, height, ['obstacle', 'mob']);
        
        for (const obj of nearby) {
            if (this.rectIntersect(x, y, width, height, obj.x, obj.y, obj.width || 32, obj.height || 32)) {
                return true;
            }
        }
        
        // Verificar limites do mapa
        return this.engine.checkMapBounds(x, y, width, height);
    }
    
    /**
     * Verifica interseção de retângulos
     */
    rectIntersect(x1, y1, w1, h1, x2, y2, w2, h2) {
        return x1 < x2 + w2 && x1 + w1 > x2 && y1 < y2 + h2 && y1 + h1 > y2;
    }
    
    // ===================== OBJECT POOLING =====================
    
    /**
     * Cria pools de objetos reutilizáveis
     */
    createObjectPools() {
        // Pool de partículas
        for (let i = 0; i < this.config.particlePoolSize; i++) {
            this.pools.particles.push({
                active: false,
                x: 0, y: 0,
                vx: 0, vy: 0,
                life: 0, maxLife: 0,
                color: '', size: 0
            });
        }
        
        // Pool de textos flutuantes
        for (let i = 0; i < this.config.textPoolSize; i++) {
            this.pools.floatingTexts.push({
                active: false,
                text: '',
                x: 0, y: 0,
                color: '',
                startTime: 0,
                duration: 0
            });
        }
        
        // Pool de efeitos de combate
        for (let i = 0; i < this.config.effectPoolSize; i++) {
            this.pools.combatEffects.push({
                active: false,
                type: '',
                x: 0, y: 0,
                life: 0, maxLife: 0
            });
        }
        
        console.log(`📦 Object pools criados: ${this.config.particlePoolSize} partículas, ${this.config.textPoolSize} textos, ${this.config.effectPoolSize} efeitos`);
    }
    
    /**
     * Obtém partícula do pool
     */
    getParticle(x, y, vx, vy, color, size, life) {
        // Procurar partícula inativa
        let particle = this.pools.particles.find(p => !p.active);
        
        if (!particle) {
            // Se pool esgotado, criar nova ou reutilizar a mais antiga
            if (this.pools.particles.length >= this.config.maxParticles) {
                // Reutilizar partícula mais antiga
                particle = this.pools.particles.reduce((oldest, p) => 
                    p.life < oldest.life ? p : oldest
                );
            } else {
                particle = {};
                this.pools.particles.push(particle);
            }
        }
        
        particle.active = true;
        particle.x = x;
        particle.y = y;
        particle.vx = vx;
        particle.vy = vy;
        particle.color = color;
        particle.size = size;
        particle.life = life;
        particle.maxLife = life;
        
        return particle;
    }
    
    /**
     * Obtém texto flutuante do pool
     */
    getFloatingText(text, x, y, color, duration) {
        let ft = this.pools.floatingTexts.find(t => !t.active);
        
        if (!ft) {
            if (this.pools.floatingTexts.length >= this.config.maxFloatingTexts) {
                ft = this.pools.floatingTexts[0];
            } else {
                ft = {};
                this.pools.floatingTexts.push(ft);
            }
        }
        
        ft.active = true;
        ft.text = text;
        ft.x = x;
        ft.y = y;
        ft.color = color;
        ft.startTime = Date.now();
        ft.duration = duration;
        
        return ft;
    }
    
    /**
     * Libera objeto de volta ao pool
     */
    releaseToPool(pool, obj) {
        obj.active = false;
    }
    
    // ===================== ADAPTIVE QUALITY =====================
    
    /**
     * Atualiza métricas de performance
     */
    updateMetrics(deltaTime) {
        const now = performance.now();
        
        // Calcular FPS atual
        const currentFPS = 1000 / deltaTime;
        this.fpsHistory.push(currentFPS);
        
        if (this.fpsHistory.length > this.maxFPSHistory) {
            this.fpsHistory.shift();
        }
        
        // Média móvel de FPS
        this.metrics.fps = this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length;
        this.metrics.frameTime = deltaTime;
        
        // Adaptar qualidade se necessário
        if (this.config.adaptiveQuality) {
            this.adaptQuality();
        }
    }
    
    /**
     * Adapta qualidade baseado em FPS
     */
    adaptQuality() {
        const avgFPS = this.metrics.fps;
        
        if (avgFPS < 30 && this.config.currentQuality !== 'low') {
            this.setQuality('low');
        } else if (avgFPS < 45 && this.config.currentQuality === 'high') {
            this.setQuality('medium');
        } else if (avgFPS > 55 && this.config.currentQuality === 'low') {
            this.setQuality('medium');
        } else if (avgFPS > 58 && this.config.currentQuality === 'medium') {
            this.setQuality('high');
        }
    }
    
    /**
     * Define nível de qualidade
     */
    setQuality(level) {
        if (this.config.currentQuality === level) return;
        
        const oldQuality = this.config.currentQuality;
        this.config.currentQuality = level;
        
        switch (level) {
            case 'high':
                this.config.maxParticles = 200;
                this.config.maxCombatEffects = 50;
                this.config.maxFloatingTexts = 30;
                this.config.gridUpdateInterval = 500;
                break;
                
            case 'medium':
                this.config.maxParticles = 100;
                this.config.maxCombatEffects = 30;
                this.config.maxFloatingTexts = 20;
                this.config.gridUpdateInterval = 1000;
                break;
                
            case 'low':
                this.config.maxParticles = 50;
                this.config.maxCombatEffects = 15;
                this.config.maxFloatingTexts = 10;
                this.config.gridUpdateInterval = 2000;
                break;
        }
        
        console.log(`🎨 Qualidade adaptativa: ${oldQuality} → ${level} (FPS: ${this.metrics.fps.toFixed(1)})`);
    }
    
    // ===================== THROTTLING =====================
    
    /**
     * Verifica se deve renderizar neste frame
     */
    shouldRender() {
        if (this.config.renderThrottle === 0) return true;
        
        const now = performance.now();
        if (now - this.lastRenderTime >= this.config.renderThrottle) {
            this.lastRenderTime = now;
            return true;
        }
        return false;
    }
    
    /**
     * Verifica se deve atualizar neste frame
     */
    shouldUpdate() {
        if (this.config.updateThrottle === 0) return true;
        
        const now = performance.now();
        if (now - this.lastUpdateTime >= this.config.updateThrottle) {
            this.lastUpdateTime = now;
            return true;
        }
        return false;
    }
    
    // ===================== CLEANUP =====================
    
    /**
     * Inicia intervalo de limpeza automática
     */
    startCleanupInterval() {
        setInterval(() => {
            this.performCleanup();
        }, this.config.cleanupInterval);
    }
    
    /**
     * Realiza limpeza de memória
     */
    performCleanup() {
        // Limpar partículas inativas do engine
        if (this.engine.particles) {
            this.engine.particles = this.engine.particles.filter(p => p.life > 0);
        }
        
        // Limpar efeitos de combate inativos
        if (this.engine.combatEffects) {
            this.engine.combatEffects = this.engine.combatEffects.filter(e => e.life > 0);
        }
        
        // Limpar animações de ataque inativas
        if (this.engine.attackAnimations) {
            this.engine.attackAnimations = this.engine.attackAnimations.filter(a => a.life > 0);
        }
        
        // Limpar textos flutuantes antigos
        if (this.engine.floatingTexts) {
            const now = Date.now();
            this.engine.floatingTexts = this.engine.floatingTexts.filter(
                ft => (now - ft.startTime) < ft.duration
            );
        }
        
        // Limitar arrays ao máximo configurado
        this.enforceMaxLimit('particles', this.config.maxParticles);
        this.enforceMaxLimit('combatEffects', this.config.maxCombatEffects);
        this.enforceMaxLimit('floatingTexts', this.config.maxFloatingTexts);
        this.enforceMaxLimit('attackAnimations', 20);
        
        // Trigger GC hint (não garantido, mas ajuda)
        if (window.gc) {
            window.gc();
        }
    }
    
    /**
     * Limita array ao tamanho máximo (mantém os mais recentes)
     */
    enforceMaxLimit(arrayName, maxSize) {
        if (this.engine[arrayName] && this.engine[arrayName].length > maxSize) {
            this.engine[arrayName] = this.engine[arrayName].slice(-maxSize);
        }
    }
    
    // ===================== MONITORING =====================
    
    /**
     * Retorna relatório de performance
     */
    getPerformanceReport() {
        return {
            fps: this.metrics.fps.toFixed(1),
            frameTime: this.metrics.frameTime.toFixed(2),
            quality: this.config.currentQuality,
            spatialGridSize: this.spatialGrid.size,
            collisionChecks: this.metrics.collisionChecks,
            poolUsage: {
                particles: this.pools.particles.filter(p => p.active).length,
                floatingTexts: this.pools.floatingTexts.filter(t => t.active).length,
                combatEffects: this.pools.combatEffects.filter(e => e.active).length
            },
            objectCounts: {
                particles: this.engine.particles?.length || 0,
                mobs: this.engine.mobs?.length || 0,
                lootDrops: this.engine.lootDrops?.length || 0,
                floatingTexts: this.engine.floatingTexts?.length || 0
            }
        };
    }
    
    /**
     * Renderiza informações de debug
     */
    renderDebugInfo(ctx) {
        if (!this.engine.config.debug) return;
        
        const report = this.getPerformanceReport();
        const lines = [
            `⚡ OPTIMIZER`,
            `Quality: ${report.quality}`,
            `Grid Cells: ${report.spatialGridSize}`,
            `Pool: P:${report.poolUsage.particles}/${this.pools.particles.length} T:${report.poolUsage.floatingTexts}/${this.pools.floatingTexts.length}`,
            `Objects: M:${report.objectCounts.mobs} L:${report.objectCounts.lootDrops} P:${report.objectCounts.particles}`,
            `Collisions/frame: ${report.collisionChecks}`
        ];
        
        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(10, 100, 280, lines.length * 15 + 10);
        
        ctx.fillStyle = '#0f0';
        ctx.font = '11px monospace';
        ctx.textAlign = 'left';
        
        lines.forEach((line, i) => {
            ctx.fillText(line, 15, 115 + i * 15);
        });
        
        ctx.restore();
        
        // Reset collision counter
        this.metrics.collisionChecks = 0;
    }
}

// Exportar
window.PerformanceOptimizer = PerformanceOptimizer;
