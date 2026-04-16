/**
 * MobManager.js
 * Gerenciamento de mobs no cliente - cria, atualiza, remove e renderiza mobs
 * Parte da refatoração MVP (Passo 2)
 */

class MobManager {
    constructor(gameplayEngine) {
        this.engine = gameplayEngine;
        this.mobs = [];
        this.mobSprites = new Map(); // Cache de sprites/configurações
        
        // Configurações de renderização
        this.renderConfig = {
            showNames: true,
            showHealthBars: true,
            nameRange: 300, // Só mostra nome se estiver dentro dessa distância
            maxMobsToRender: 50 // Limite para performance
        };
    }

    // ========== GERENCIAMENTO DE MOBS ==========
    
    addMob(mobData) {
        if (!mobData || !mobData.id) {
            console.warn('MobManager: Tentativa de adicionar mob sem ID');
            return null;
        }
        
        // Verificar se já existe
        const existingIndex = this.mobs.findIndex(m => m.id === mobData.id);
        if (existingIndex >= 0) {
            // Atualizar existente
            this.mobs[existingIndex] = { ...this.mobs[existingIndex], ...mobData };
            return this.mobs[existingIndex];
        }
        
        // Criar novo mob com propriedades padrão
        const newMob = {
            id: mobData.id,
            type: mobData.type || 'unknown',
            name: mobData.name || 'Mob',
            x: mobData.x || 0,
            y: mobData.y || 0,
            width: mobData.width || 32,
            height: mobData.height || 32,
            hp: mobData.hp || 100,
            maxHp: mobData.maxHp || 100,
            level: mobData.level || 1,
            color: mobData.color || this.getMobColor(mobData.type),
            facing: mobData.facing || 'down',
            state: mobData.state || 'idle',
            lastUpdate: Date.now()
        };
        
        this.mobs.push(newMob);
        console.log(`MobManager: Mob adicionado - ${newMob.name} (${newMob.id})`);
        return newMob;
    }
    
    removeMob(mobId) {
        const index = this.mobs.findIndex(m => m.id === mobId);
        if (index >= 0) {
            const removed = this.mobs.splice(index, 1)[0];
            console.log(`MobManager: Mob removido - ${removed.name} (${removed.id})`);
            return removed;
        }
        return null;
    }
    
    updateMob(mobId, data) {
        const mob = this.mobs.find(m => m.id === mobId);
        if (mob) {
            Object.assign(mob, data);
            mob.lastUpdate = Date.now();
            return true;
        }
        return false;
    }
    
    updateMobsFromServer(serverMobs) {
        if (!Array.isArray(serverMobs)) return;
        
        serverMobs.forEach(serverMob => {
            if (serverMob.type === 'mob') {
                const existing = this.mobs.find(m => m.id === serverMob.id);
                if (existing) {
                    // Atualizar existente
                    Object.assign(existing, serverMob);
                    existing.lastUpdate = Date.now();
                } else {
                    // Adicionar novo
                    this.addMob(serverMob);
                }
            }
        });
        
        // Remover mobs que não estão mais no servidor
        this.mobs = this.mobs.filter(mob => {
            const stillExists = serverMobs.some(sm => sm.id === mob.id);
            return stillExists;
        });
    }
    
    clearMobs() {
        this.mobs = [];
        console.log('MobManager: Todos os mobs removidos');
    }
    
    getMobById(mobId) {
        return this.mobs.find(m => m.id === mobId);
    }
    
    getMobsInRange(x, y, range) {
        return this.mobs.filter(mob => {
            const dx = mob.x - x;
            const dy = mob.y - y;
            return Math.sqrt(dx * dx + dy * dy) <= range;
        });
    }
    
    // ========== RENDERIZAÇÃO ==========
    
    render(ctx, camera) {
        if (!ctx || !camera) return;
        
        // Ordenar por distância do jogador para culling
        const player = this.engine.player;
        if (player) {
            this.mobs.sort((a, b) => {
                const distA = Math.hypot(a.x - player.x, a.y - player.y);
                const distB = Math.hypot(b.x - player.x, b.y - player.y);
                return distA - distB;
            });
        }
        
        // Renderizar apenas os mais próximos (culling)
        const mobsToRender = this.mobs.slice(0, this.renderConfig.maxMobsToRender);
        
        mobsToRender.forEach(mob => {
            // Verificar se está dentro da câmera
            if (this.isInCamera(mob, camera)) {
                this.renderMob(ctx, mob, camera, player);
            }
        });
    }
    
    renderMob(ctx, mob, camera, player) {
        const screenX = mob.x - camera.x;
        const screenY = mob.y - camera.y;
        
        ctx.save();
        
        // Sombra
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(screenX + 16, screenY + 28, 12, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Corpo do mob
        ctx.fillStyle = mob.color || '#FF5722';
        ctx.fillRect(screenX, screenY, mob.width, mob.height);
        
        // Borda
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.strokeRect(screenX, screenY, mob.width, mob.height);
        
        // Indicador de direção
        this.renderFacingIndicator(ctx, mob, screenX, screenY);
        
        // Barra de HP
        if (this.renderConfig.showHealthBars && mob.maxHp > 0) {
            this.renderHealthBar(ctx, mob, screenX, screenY);
        }
        
        // Nome (só se próximo o suficiente)
        if (this.renderConfig.showNames && player) {
            const dist = Math.hypot(mob.x - player.x, mob.y - player.y);
            if (dist <= this.renderConfig.nameRange) {
                this.renderName(ctx, mob, screenX, screenY);
            }
        }
        
        ctx.restore();
    }
    
    renderHealthBar(ctx, mob, x, y) {
        const barWidth = 32;
        const barHeight = 4;
        const hpPercent = Math.max(0, Math.min(1, mob.hp / mob.maxHp));
        
        // Fundo
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(x, y - 8, barWidth, barHeight);
        
        // HP
        ctx.fillStyle = hpPercent > 0.5 ? '#4CAF50' : hpPercent > 0.25 ? '#FFC107' : '#F44336';
        ctx.fillRect(x, y - 8, barWidth * hpPercent, barHeight);
        
        // Borda
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y - 8, barWidth, barHeight);
    }
    
    renderName(ctx, mob, x, y) {
        ctx.fillStyle = '#FFF';
        ctx.font = '11px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        
        // Sombra do texto
        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        ctx.shadowBlur = 2;
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 1;
        
        ctx.fillText(mob.name, x + 16, y - 12);
        
        // Reset shadow
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        
        // Nível
        ctx.font = '9px Arial';
        ctx.fillStyle = '#FFD54F';
        ctx.fillText(`Lv.${mob.level}`, x + 16, y - 2);
    }
    
    renderFacingIndicator(ctx, mob, x, y) {
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        const size = 6;
        const offset = 26;
        
        switch(mob.facing) {
            case 'up':
                ctx.fillRect(x + 13, y - 2, size, size);
                break;
            case 'down':
                ctx.fillRect(x + 13, y + offset, size, size);
                break;
            case 'left':
                ctx.fillRect(x - 2, y + 13, size, size);
                break;
            case 'right':
                ctx.fillRect(x + offset, y + 13, size, size);
                break;
        }
    }
    
    isInCamera(entity, camera) {
        return entity.x + entity.width > camera.x &&
               entity.x < camera.x + camera.width &&
               entity.y + entity.height > camera.y &&
               entity.y < camera.y + camera.height;
    }
    
    // ========== UTILITÁRIOS ==========
    
    getMobColor(type) {
        const colors = {
            'slime': '#8BC34A',
            'goblin': '#FF9800',
            'wolf': '#9E9E9E',
            'orc': '#4CAF50',
            'skeleton': '#BDBDBD',
            'zombie': '#795548',
            'spider': '#607D8B',
            'bear': '#5D4037',
            'default': '#FF5722'
        };
        return colors[type] || colors['default'];
    }
    
    getMobCount() {
        return this.mobs.length;
    }
    
    // ========== SINCRONIZAÇÃO COM SERVIDOR ==========
    
    handleMobSpawn(data) {
        const mob = this.addMob(data);
        if (mob && this.engine.hud) {
            // Notificação opcional de spawn
            console.log(`👾 ${mob.name} apareceu!`);
        }
        return mob;
    }
    
    handleMobDespawn(data) {
        const removed = this.removeMob(data.id);
        if (removed) {
            console.log(`👾 ${removed.name} desapareceu`);
        }
        return removed;
    }
    
    handleMobUpdate(data) {
        return this.updateMob(data.id, data);
    }
    
    serializeForNetwork() {
        return this.mobs.map(mob => ({
            id: mob.id,
            type: mob.type,
            x: mob.x,
            y: mob.y,
            hp: mob.hp,
            maxHp: mob.maxHp,
            state: mob.state
        }));
    }
}

// Exportar para uso global
window.MobManager = MobManager;
