/**
 * Sprite Testing System
 * Test and validate all loaded sprites
 */

class SpriteTester {
    constructor() {
        this.testResults = [];
        this.testCanvas = null;
        this.testCtx = null;
        this.testContainer = null;
        // Removido initTestCanvas() para não mostrar janela automaticamente
    }
    
    /**
     * Initialize test canvas manually (only when requested)
     */
    initTestCanvas() {
        if (this.testCanvas) return; // Já inicializado
        
        this.testCanvas = document.createElement('canvas');
        this.testCanvas.width = 800;
        this.testCanvas.height = 600;
        this.testCtx = this.testCanvas.getContext('2d');
        
        // Posicionar o canvas acima de outras janelas
        this.testCanvas.style.position = 'fixed';
        this.testCanvas.style.top = '60px';
        this.testCanvas.style.left = '360px';
        this.testCanvas.style.border = '2px solid #4CAF50';
        this.testCanvas.style.background = '#000';
        this.testCanvas.style.zIndex = '99998';
        document.body.appendChild(this.testCanvas);
        
        // Add test panel to page
        this.createTestPanel();
    }
    
    /**
     * Create test panel UI
     */
    createTestPanel() {
        const panelHTML = `
            <div id="spriteTestPanel" style="
                position: fixed;
                top: 50px;
                right: 50px;
                width: 300px;
                height: 200px;
                background: rgba(0,0,0,0.95);
                color: white;
                padding: 15px;
                border-radius: 8px;
                font-family: Arial, sans-serif;
                font-size: 11px;
                overflow-y: auto;
                z-index: 99999;
                border: 2px solid #4CAF50;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.7);
                resize: both;
                min-width: 250px;
                min-height: 150px;
            ">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; cursor: move;">
                    <h3 style="margin: 0; color: #4CAF50; font-size: 14px;">🧪 Sprites</h3>
                    <button onclick="spriteTester.closePanel()" style="
                        background: #f44336;
                        color: white;
                        border: none;
                        padding: 4px 8px;
                        border-radius: 3px;
                        cursor: pointer;
                        font-size: 11px;
                    ">✕</button>
                </div>
                <div id="spriteTestResults" style="
                    max-height: 100px;
                    overflow-y: auto;
                    line-height: 1.3;
                "></div>
                <button onclick="spriteTester.runFullTest()" style="
                    margin-top: 8px;
                    padding: 6px 12px;
                    background: #4CAF50;
                    color: white;
                    border: none;
                    border-radius: 3px;
                    cursor: pointer;
                    width: 100%;
                    font-size: 11px;
                ">🚀 Testar Todos</button>
                <button onclick="spriteTester.closePanel()" style="
                    margin-top: 5px;
                    padding: 6px 12px;
                    background: #FF9800;
                    color: white;
                    border: none;
                    border-radius: 3px;
                    cursor: pointer;
                    width: 100%;
                    font-size: 11px;
                ">🗑️ Limpar</button>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', panelHTML);
        this.resultsDiv = document.getElementById('spriteTestResults');
        
        // Make draggable
        this.makeDraggable(document.getElementById('spriteTestPanel'));
    }
    
    /**
     * Run comprehensive sprite test
     */
    async runFullTest() {
        // Inicializa o canvas apenas quando o teste é executado
        this.initTestCanvas();
        
        if (!window.spriteManager || !window.spriteManager.isLoaded()) {
            this.addResult('❌ SpriteManager não carregado', 'error');
            return;
        }
        
        this.addResult('🧪 Iniciando teste completo de sprites...', 'info');
        this.testResults = [];
        
        // Test player sprites
        await this.testPlayerSprites();
        
        // Test NPC sprites
        await this.testNPCSprites();
        
        // Test monster sprites
        await this.testMonsterSprites();
        
        // Generate summary
        this.generateSummary();
    }
    
    /**
     * Test all player sprites
     */
    async testPlayerSprites() {
        const races = ['human', 'elf', 'dwarf', 'orc'];
        
        for (const race of races) {
            try {
                const sprite = window.spriteManager.getPlayerSprite(race);
                if (sprite && sprite.loaded) {
                    this.addResult(`✅ Player ${race}: ${sprite.width}x${sprite.height}`, 'success');
                    
                    // Test animation frames
                    await this.testAnimationFrames(`player_${race}`, 'idle');
                } else {
                    this.addResult(`❌ Player ${race}: Não carregado`, 'error');
                }
            } catch (error) {
                this.addResult(`❌ Player ${race}: ${error.message}`, 'error');
            }
        }
    }
    
    /**
     * Test all NPC sprites
     */
    async testNPCSprites() {
        const npcs = ['innkeeper', 'merchant', 'captain', 'explorer', 'hermit', 'miner', 'ranger', 'sentinel'];
        
        for (const npc of npcs) {
            try {
                const sprite = window.spriteManager.getNPCSprite(npc);
                if (sprite && sprite.loaded) {
                    this.addResult(`✅ NPC ${npc}: ${sprite.width}x${sprite.height}`, 'success');
                    
                    // Test animation frames
                    await this.testAnimationFrames(`npc_${npc}`, 'idle');
                } else {
                    this.addResult(`❌ NPC ${npc}: Não carregado`, 'error');
                }
            } catch (error) {
                this.addResult(`❌ NPC ${npc}: ${error.message}`, 'error');
            }
        }
    }
    
    /**
     * Test all monster sprites
     */
    async testMonsterSprites() {
        const monsters = ['goblin', 'wolf'];
        
        for (const monster of monsters) {
            try {
                const sprite = window.spriteManager.getMonsterSprite(monster);
                if (sprite && sprite.loaded) {
                    this.addResult(`✅ Monster ${monster}: ${sprite.width}x${sprite.height}`, 'success');
                    
                    // Test animation frames
                    await this.testAnimationFrames(`monster_${monster}`, 'idle');
                } else {
                    this.addResult(`❌ Monster ${monster}: Não carregado`, 'error');
                }
            } catch (error) {
                this.addResult(`❌ Monster ${monster}: ${error.message}`, 'error');
            }
        }
    }
    
    /**
     * Test animation frames for a sprite
     */
    async testAnimationFrames(spriteKey, animationType) {
        try {
            for (let i = 0; i < 4; i++) {
                const frame = window.spriteManager.getAnimationFrame(spriteKey, animationType, i);
                if (frame) {
                    this.testResults.push({
                        sprite: spriteKey,
                        animation: animationType,
                        frame: i,
                        success: true
                    });
                } else {
                    this.addResult(`⚠️ ${spriteKey} ${animationType} frame ${i}: Falha`, 'warning');
                }
            }
        } catch (error) {
            this.addResult(`❌ ${spriteKey} ${animationType}: ${error.message}`, 'error');
        }
    }
    
    /**
     * Add test result
     */
    addResult(message, type = 'info') {
        const result = { message, type, timestamp: new Date().toISOString() };
        this.testResults.push(result);
        
        if (this.resultsDiv) {
            const color = type === 'success' ? '#4CAF50' : 
                         type === 'error' ? '#f44336' : 
                         type === 'warning' ? '#ff9800' : '#2196F3';
            
            this.resultsDiv.innerHTML += `
                <div style="
                    margin: 2px 0;
                    padding: 5px;
                    background: ${color}20;
                    border-left: 3px solid ${color};
                    border-radius: 3px;
                    font-size: 11px;
                ">${message}</div>
            `;
            this.resultsDiv.scrollTop = this.resultsDiv.scrollHeight;
        }
    }
    
    /**
     * Generate test summary
     */
    generateSummary() {
        const total = this.testResults.length;
        const success = this.testResults.filter(r => r.success !== false).length;
        const errors = this.testResults.filter(r => r.type === 'error').length;
        const warnings = this.testResults.filter(r => r.type === 'warning').length;
        
        const summary = `
            <div style="
                margin-top: 15px;
                padding: 10px;
                background: rgba(76, 175, 80, 0.2);
                border-radius: 5px;
                border: 1px solid #4CAF50;
            ">
                <strong>📊 Resumo:</strong><br>
                ✅ Sucesso: ${success}/${total}<br>
                ❌ Erros: ${errors}<br>
                ⚠️ Avisos: ${warnings}<br>
                📈 Taxa: ${((success/total)*100).toFixed(1)}%
            </div>
        `;
        
        if (this.resultsDiv) {
            this.resultsDiv.innerHTML += summary;
        }
        
        console.log('📊 Resumo do teste de sprites:', {
            total,
            success,
            errors,
            warnings,
            successRate: (success/total)*100
        });
    }
    
    /**
     * Close test panel
     */
    closePanel() {
        const panel = document.getElementById('spriteTestPanel');
        if (panel) {
            panel.remove();
        }
    }
    
    /**
     * Draw test sprite
     */
    drawTestSprite(sprite, x, y) {
        this.testCtx.drawImage(
            sprite.image,
            x, y,
            sprite.frameWidth,
            sprite.frameHeight
        );
        
        return {
            x: x,
            y: y,
            width: sprite.frameWidth,
            height: sprite.frameHeight
        };
    }
    
    /**
     * Create visual sprite preview
     */
    createSpritePreview(spriteKey, x = 0, y = 0) {
        const sprite = window.spriteManager.getSprite(spriteKey);
        if (!sprite || !sprite.loaded) return null;
        
        const preview = this.drawTestSprite(sprite, x, y);
        
        return preview;
    }
    
    /**
     * Make window draggable
     */
    makeDraggable(element) {
        let isDragging = false;
        let currentX;
        let currentY;
        let initialX;
        let initialY;
        let xOffset = 0;
        let yOffset = 0;

        const header = element.querySelector('div');
        
        header.addEventListener('mousedown', dragStart);
        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', dragEnd);

        function dragStart(e) {
            initialX = e.clientX - xOffset;
            initialY = e.clientY - yOffset;

            if (e.target === header || header.contains(e.target)) {
                isDragging = true;
            }
        }

        function drag(e) {
            if (isDragging) {
                e.preventDefault();
                currentX = e.clientX - initialX;
                currentY = e.clientY - initialY;

                xOffset = currentX;
                yOffset = currentY;

                element.style.transform = `translate(${currentX}px, ${currentY}px)`;
            }
        }

        function dragEnd(e) {
            initialX = currentX;
            initialY = currentY;
            isDragging = false;
        }
    }

    /**
     * Hide test window
     */
    hideTestCanvas() {
        if (this.testCanvas && this.testCanvas.parentNode) {
            this.testCanvas.parentNode.removeChild(this.testCanvas);
        }
    }
}

// Global instance
window.spriteTester = new SpriteTester();
