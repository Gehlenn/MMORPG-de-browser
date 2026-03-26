/**
 * Simple Map Renderer - Legacy of Komodo
 * Sistema de renderização de mapa simples para o primeiro mapa
 */

class SimpleMapRenderer {
    constructor(canvas, spriteSystem) {
        this.spriteSystem = spriteSystem;
        
        if (canvas && typeof canvas === 'string') {
            this.canvas = document.getElementById(canvas);
            if (this.canvas) {
                this.ctx = this.canvas.getContext('2d');
                console.log('✅ SimpleMapRenderer canvas configurado:', canvas);
            } else {
                console.warn('⚠️ Canvas não encontrado:', canvas);
                this.canvas = null;
                this.ctx = null;
            }
        } else if (canvas && canvas.getContext) {
            // Se canvas já é um elemento canvas
            this.canvas = canvas;
            this.ctx = canvas.getContext('2d');
            console.log('✅ SimpleMapRenderer canvas direto configurado');
        } else {
            console.warn('⚠️ Canvas inválido fornecido para SimpleMapRenderer');
            this.canvas = null;
            this.ctx = null;
        }
        
        this.tileSize = 32;
        this.mapWidth = 50;  // 50 tiles de largura
        this.mapHeight = 40; // 40 tiles de altura
        this.camera = { x: 0, y: 0 };
        this.tiles = [];
        this.decorations = [];
        
        this.initializeMap();
    }
    
    initializeMap() {
        // Gerar mapa base para Starter Plains
        this.generateStarterPlainsMap();
    }
    
    /**
     * Gera o mapa Starter Plains
     */
    generateStarterPlainsMap() {
        // Inicializar tiles
        for (let y = 0; y < this.mapHeight; y++) {
            this.tiles[y] = [];
            for (let x = 0; x < this.mapWidth; x++) {
                this.tiles[y][x] = this.generateTile(x, y);
            }
        }
        
        // Adicionar decorações
        this.addDecorations();
    }
    
    /**
     * Gera um tile específico
     */
    generateTile(x, y) {
        // Base: grama na maioria das áreas
        let tileType = 'grass_tile';
        let variant = 'normal';
        
        // Adicionar variações
        const random = Math.random();
        
        // Caminhos de terra (15% chance)
        if (random < 0.15) {
            tileType = 'dirt_tile';
        }
        
        // Áreas de pedra (5% chance)
        else if (random < 0.20) {
            tileType = 'stone_tile';
        }
        
        // Pequenas áreas de água (3% chance)
        else if (random < 0.23) {
            tileType = 'water_tile';
        }
        
        // Variação de cor
        const colorRandom = Math.random();
        if (colorRandom < 0.3) {
            variant = 'light';
        } else if (colorRandom < 0.6) {
            variant = 'dark';
        }
        
        return {
            type: tileType,
            variant: variant,
            x: x,
            y: y,
            walkable: tileType !== 'water_tile' && tileType !== 'stone_tile'
        };
    }
    
    /**
     * Adiciona decorações ao mapa
     */
    addDecorations() {
        // Árvores (20 árvores)
        for (let i = 0; i < 20; i++) {
            const x = Math.floor(Math.random() * this.mapWidth);
            const y = Math.floor(Math.random() * this.mapHeight);
            
            if (this.canPlaceDecoration(x, y)) {
                this.decorations.push({
                    type: Math.random() < 0.5 ? 'tree_oak' : 'tree_pine',
                    x: x,
                    y: y,
                    width: 2,
                    height: 2
                });
            }
        }
        
        // Arbustos (30 arbustos)
        for (let i = 0; i < 30; i++) {
            const x = Math.floor(Math.random() * this.mapWidth);
            const y = Math.floor(Math.random() * this.mapHeight);
            
            if (this.canPlaceDecoration(x, y)) {
                this.decorations.push({
                    type: Math.random() < 0.6 ? 'bush_small' : 'bush_large',
                    x: x,
                    y: y,
                    width: 1,
                    height: 1
                });
            }
        }
        
        // Pedras (15 pedras)
        for (let i = 0; i < 15; i++) {
            const x = Math.floor(Math.random() * this.mapWidth);
            const y = Math.floor(Math.random() * this.mapHeight);
            
            if (this.canPlaceDecoration(x, y)) {
                this.decorations.push({
                    type: Math.random() < 0.7 ? 'rock_small' : 'rock_large',
                    x: x,
                    y: y,
                    width: 1,
                    height: 1
                });
            }
        }
        
        // Flores (40 flores)
        for (let i = 0; i < 40; i++) {
            const x = Math.floor(Math.random() * this.mapWidth);
            const y = Math.floor(Math.random() * this.mapHeight);
            
            if (this.canPlaceDecoration(x, y)) {
                const flowerTypes = ['flower_red', 'flower_yellow', 'flower_blue', 'flower_purple'];
                this.decorations.push({
                    type: flowerTypes[Math.floor(Math.random() * flowerTypes.length)],
                    x: x,
                    y: y,
                    width: 1,
                    height: 1
                });
            }
        }
    }
    
    /**
     * Verifica se pode colocar decoração em uma posição
     */
    canPlaceDecoration(x, y) {
        // Verificar se o tile é walkable
        if (!this.tiles[y] || !this.tiles[y][x] || !this.tiles[y][x].walkable) {
            return false;
        }
        
        // Verificar se não há outras decorações muito próximas
        for (const decoration of this.decorations) {
            const distance = Math.sqrt(Math.pow(decoration.x - x, 2) + Math.pow(decoration.y - y, 2));
            if (distance < 2) {
                return false;
            }
        }
        
        return true;
    }
    
    /**
     * Renderiza o mapa
     */
    render() {
        // Limpar canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Calcular tiles visíveis
        const startTileX = Math.floor(this.camera.x / this.tileSize);
        const startTileY = Math.floor(this.camera.y / this.tileSize);
        const endTileX = Math.ceil((this.camera.x + this.canvas.width) / this.tileSize);
        const endTileY = Math.ceil((this.camera.y + this.canvas.height) / this.tileSize);
        
        // Renderizar tiles
        for (let y = startTileY; y < Math.min(endTileY, this.mapHeight); y++) {
            for (let x = startTileX; x < Math.min(endTileX, this.mapWidth); x++) {
                if (this.tiles[y] && this.tiles[y][x]) {
                    this.renderTile(x, y);
                }
            }
        }
        
        // Renderizar decorações
        for (const decoration of this.decorations) {
            this.renderDecoration(decoration);
        }
    }
    
    /**
     * Renderiza um tile
     */
    renderTile(tileX, tileY) {
        const tile = this.tiles[tileY][tileX];
        const screenX = tileX * this.tileSize - this.camera.x;
        const screenY = tileY * this.tileSize - this.camera.y;
        
        this.spriteSystem.drawSprite(
            this.ctx,
            tile.type,
            screenX,
            screenY,
            this.tileSize,
            this.tileSize,
            { variant: tile.variant }
        );
    }
    
    /**
     * Renderiza uma decoração
     */
    renderDecoration(decoration) {
        const screenX = decoration.x * this.tileSize - this.camera.x;
        const screenY = decoration.y * this.tileSize - this.camera.y;
        const width = decoration.width * this.tileSize;
        const height = decoration.height * this.tileSize;
        
        this.spriteSystem.drawSprite(
            this.ctx,
            decoration.type,
            screenX,
            screenY,
            width,
            height
        );
    }
    
    /**
     * Move a câmera
     */
    moveCamera(x, y) {
        this.camera.x = Math.max(0, Math.min(x, this.mapWidth * this.tileSize - this.canvas.width));
        this.camera.y = Math.max(0, Math.min(y, this.mapHeight * this.tileSize - this.canvas.height));
    }
    
    /**
     * Converte coordenadas de mundo para tiles
     */
    worldToTile(worldX, worldY) {
        return {
            x: Math.floor(worldX / this.tileSize),
            y: Math.floor(worldY / this.tileSize)
        };
    }
    
    /**
     * Converte coordenadas de tiles para mundo
     */
    tileToWorld(tileX, tileY) {
        return {
            x: tileX * this.tileSize,
            y: tileY * this.tileSize
        };
    }
    
    /**
     * Verifica se uma posição é walkable
     */
    isWalkable(worldX, worldY) {
        const tile = this.worldToTile(worldX, worldY);
        
        if (tile.x < 0 || tile.x >= this.mapWidth || tile.y < 0 || tile.y >= this.mapHeight) {
            return false;
        }
        
        return this.tiles[tile.y][tile.x].walkable;
    }
    
    /**
     * Obtém informações do tile em uma posição
     */
    getTileAt(worldX, worldY) {
        const tile = this.worldToTile(worldX, worldY);
        
        if (tile.x < 0 || tile.x >= this.mapWidth || tile.y < 0 || tile.y >= this.mapHeight) {
            return null;
        }
        
        return this.tiles[tile.y][tile.x];
    }
    
    /**
     * Encontra posição aleatória walkable
     */
    getRandomWalkablePosition() {
        let attempts = 0;
        while (attempts < 100) {
            const x = Math.floor(Math.random() * this.mapWidth);
            const y = Math.floor(Math.random() * this.mapHeight);
            
            if (this.tiles[y] && this.tiles[y][x] && this.tiles[y][x].walkable) {
                return this.tileToWorld(x, y);
            }
            attempts++;
        }
        
        // Fallback para posição central
        return this.tileToWorld(Math.floor(this.mapWidth / 2), Math.floor(this.mapHeight / 2));
    }
    
    /**
     * Obtém decorações próximas a uma posição
     */
    getNearbyDecorations(worldX, worldY, radius = 3) {
        const nearby = [];
        const centerTile = this.worldToTile(worldX, worldY);
        
        for (const decoration of this.decorations) {
            const distance = Math.sqrt(
                Math.pow(decoration.x - centerTile.x, 2) + 
                Math.pow(decoration.y - centerTile.y, 2)
            );
            
            if (distance <= radius) {
                nearby.push({
                    ...decoration,
                    worldPosition: this.tileToWorld(decoration.x, decoration.y),
                    distance: distance
                });
            }
        }
        
        return nearby.sort((a, b) => a.distance - b.distance);
    }
    
    /**
     * Atualiza o tamanho do canvas
     */
    updateCanvasSize(width, height) {
        this.canvas.width = width;
        this.canvas.height = height;
        
        // Ajustar câmera se necessário
        this.moveCamera(this.camera.x, this.camera.y);
    }
    
    /**
     * Obtém estatísticas do mapa
     */
    getMapStats() {
        const stats = {
            width: this.mapWidth,
            height: this.mapHeight,
            totalTiles: this.mapWidth * this.mapHeight,
            decorations: this.decorations.length,
            walkableTiles: 0,
            tileTypes: {}
        };
        
        // Contar tiles walkable e tipos
        for (let y = 0; y < this.mapHeight; y++) {
            for (let x = 0; x < this.mapWidth; x++) {
                const tile = this.tiles[y][x];
                if (tile.walkable) {
                    stats.walkableTiles++;
                }
                
                if (!stats.tileTypes[tile.type]) {
                    stats.tileTypes[tile.type] = 0;
                }
                stats.tileTypes[tile.type]++;
            }
        }
        
        return stats;
    }
    
    /**
     * Renderiza minimapa
     */
    renderMinimap(ctx, x, y, width, height) {
        const scale = Math.min(width / (this.mapWidth * this.tileSize), height / (this.mapHeight * this.tileSize));
        
        // Fundo
        ctx.fillStyle = '#000';
        ctx.fillRect(x, y, width, height);
        
        // Renderizar tiles
        for (let ty = 0; ty < this.mapHeight; ty++) {
            for (let tx = 0; tx < this.mapWidth; tx++) {
                const tile = this.tiles[ty][tx];
                const screenX = x + tx * this.tileSize * scale;
                const screenY = y + ty * this.tileSize * scale;
                const tileWidth = this.tileSize * scale;
                const tileHeight = this.tileSize * scale;
                
                // Cor base do tile
                let color = '#4CAF50'; // grama
                if (tile.type === 'water_tile') color = '#2196F3';
                else if (tile.type === 'stone_tile') color = '#757575';
                else if (tile.type === 'dirt_tile') color = '#8D6E63';
                
                ctx.fillStyle = color;
                ctx.fillRect(screenX, screenY, tileWidth, tileHeight);
            }
        }
        
        // Renderizar decorações importantes
        ctx.fillStyle = '#FF5722';
        for (const decoration of this.decorations) {
            if (decoration.type.includes('tree') || decoration.type.includes('rock_large')) {
                const screenX = x + decoration.x * this.tileSize * scale;
                const screenY = y + decoration.y * this.tileSize * scale;
                ctx.fillRect(screenX, screenY, decoration.width * this.tileSize * scale, decoration.height * this.tileSize * scale);
            }
        }
        
        // Borda
        ctx.strokeStyle = '#FFF';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, width, height);
    }
}

// Exportar para uso global
window.SimpleMapRenderer = SimpleMapRenderer;
