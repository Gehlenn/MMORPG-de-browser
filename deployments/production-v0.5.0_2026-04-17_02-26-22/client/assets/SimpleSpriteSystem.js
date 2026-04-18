/**
 * Simple Sprite System - Legacy of Komodo
 * Sistema básico de sprites para elementos iniciais do jogo
 */

class SimpleSpriteSystem {
    constructor(assetManager) {
        this.assetManager = assetManager;
        this.sprites = new Map();
        this.colors = new Map();
        this.patterns = new Map();
        
        this.initializeSprites();
    }
    
    initializeSprites() {
        // === CORES PARA SPRITES SIMPLES ===
        this.colors.set('grass', '#4CAF50');
        this.colors.set('grass_dark', '#388E3C');
        this.colors.set('grass_light', '#81C784');
        this.colors.set('dirt', '#8D6E63');
        this.colors.set('dirt_dark', '#6D4C41');
        this.colors.set('dirt_light', '#A1887F');
        this.colors.set('stone', '#757575');
        this.colors.set('stone_dark', '#424242');
        this.colors.set('stone_light', '#9E9E9E');
        this.colors.set('water', '#2196F3');
        this.colors.set('water_dark', '#1976D2');
        this.colors.set('water_light', '#64B5F6');
        this.colors.set('wood', '#795548');
        this.colors.set('wood_dark', '#5D4037');
        this.colors.set('wood_light', '#8D6E63');
        this.colors.set('leaf', '#4CAF50');
        this.colors.set('leaf_dark', '#388E3C');
        this.colors.set('leaf_light', '#81C784');
        this.colors.set('flower_red', '#F44336');
        this.colors.set('flower_yellow', '#FFEB3B');
        this.colors.set('flower_blue', '#2196F3');
        this.colors.set('flower_purple', '#9C27B0');
        this.colors.set('bush', '#2E7D32');
        this.colors.set('bush_dark', '#1B5E20');
        this.colors.set('bush_light', '#43A047');
        this.colors.set('tree_trunk', '#5D4037');
        this.colors.set('tree_trunk_dark', '#3E2723');
        this.colors.set('tree_trunk_light', '#6D4C41');
        this.colors.set('rock', '#757575');
        this.colors.set('rock_dark', '#424242');
        this.colors.set('rock_light', '#9E9E9E');
        
        // === CORES PARA PERSONAGENS E MOBS ===
        this.colors.set('player_apprentice', '#2196F3');
        this.colors.set('player_apprentice_dark', '#1976D2');
        this.colors.set('player_apprentice_light', '#64B5F6');
        this.colors.set('mob_rat', '#795548');
        this.colors.set('mob_slime', '#4CAF50');
        this.colors.set('mob_wolf', '#616161');
        this.colors.set('mob_bandit', '#F44336');
        this.colors.set('mob_boar', '#795548');
        this.colors.set('mob_goblin', '#4CAF50');
        this.colors.set('mob_rabbit', '#FFC107');
        this.colors.set('mob_bear', '#795548');
        this.colors.set('mob_imp', '#9C27B0');
    }
    
    /**
     * Desenha sprite simples no canvas
     */
    drawSprite(ctx, type, x, y, width = 32, height = 32, options = {}) {
        switch (type) {
            case 'grass_tile':
                this.drawGrassTile(ctx, x, y, width, height, options);
                break;
            case 'dirt_tile':
                this.drawDirtTile(ctx, x, y, width, height, options);
                break;
            case 'stone_tile':
                this.drawStoneTile(ctx, x, y, width, height, options);
                break;
            case 'water_tile':
                this.drawWaterTile(ctx, x, y, width, height, options);
                break;
            case 'tree_oak':
                this.drawOakTree(ctx, x, y, width, height, options);
                break;
            case 'tree_pine':
                this.drawPineTree(ctx, x, y, width, height, options);
                break;
            case 'bush_small':
                this.drawSmallBush(ctx, x, y, width, height, options);
                break;
            case 'bush_large':
                this.drawLargeBush(ctx, x, y, width, height, options);
                break;
            case 'rock_small':
                this.drawSmallRock(ctx, x, y, width, height, options);
                break;
            case 'rock_large':
                this.drawLargeRock(ctx, x, y, width, height, options);
                break;
            case 'flower_red':
                this.drawFlower(ctx, x, y, width, height, '#F44336', options);
                break;
            case 'flower_yellow':
                this.drawFlower(ctx, x, y, width, height, '#FFEB3B', options);
                break;
            case 'flower_blue':
                this.drawFlower(ctx, x, y, width, height, '#2196F3', options);
                break;
            case 'flower_purple':
                this.drawFlower(ctx, x, y, width, height, '#9C27B0', options);
                break;
            case 'player_apprentice':
                this.drawApprenticePlayer(ctx, x, y, width, height, options);
                break;
            case 'mob_rat':
                this.drawRat(ctx, x, y, width, height, options);
                break;
            case 'mob_slime':
                this.drawSlime(ctx, x, y, width, height, options);
                break;
            case 'mob_wolf':
                this.drawWolf(ctx, x, y, width, height, options);
                break;
            case 'mob_bandit':
                this.drawBandit(ctx, x, y, width, height, options);
                break;
            case 'mob_boar':
                this.drawBoar(ctx, x, y, width, height, options);
                break;
            case 'mob_goblin':
                this.drawGoblin(ctx, x, y, width, height, options);
                break;
            case 'mob_rabbit':
                this.drawRabbit(ctx, x, y, width, height, options);
                break;
            case 'mob_bear':
                this.drawBear(ctx, x, y, width, height, options);
                break;
            case 'mob_imp':
                this.drawImp(ctx, x, y, width, height, options);
                break;
            default:
                this.drawDefaultSprite(ctx, x, y, width, height, options);
        }
    }
    
    /**
     * Desenha tile de grama
     */
    drawGrassTile(ctx, x, y, width, height, options) {
        const baseColor = options.variant === 'dark' ? this.colors.get('grass_dark') : 
                         options.variant === 'light' ? this.colors.get('grass_light') : 
                         this.colors.get('grass');
        
        // Base
        ctx.fillStyle = baseColor;
        ctx.fillRect(x, y, width, height);
        
        // Textura simples
        ctx.strokeStyle = this.colors.get('grass_dark');
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.3;
        
        // Linhas de grama
        for (let i = 0; i < 5; i++) {
            const grassX = x + Math.random() * width;
            const grassY = y + Math.random() * height;
            ctx.beginPath();
            ctx.moveTo(grassX, grassY);
            ctx.lineTo(grassX + 2, grassY - 4);
            ctx.stroke();
        }
        
        ctx.globalAlpha = 1;
    }
    
    /**
     * Desenha tile de terra
     */
    drawDirtTile(ctx, x, y, width, height, options) {
        const baseColor = options.variant === 'dark' ? this.colors.get('dirt_dark') : 
                         options.variant === 'light' ? this.colors.get('dirt_light') : 
                         this.colors.get('dirt');
        
        // Base
        ctx.fillStyle = baseColor;
        ctx.fillRect(x, y, width, height);
        
        // Textura de terra
        ctx.fillStyle = this.colors.get('dirt_dark');
        ctx.globalAlpha = 0.2;
        
        // Pontos de terra
        for (let i = 0; i < 8; i++) {
            const dirtX = x + Math.random() * width;
            const dirtY = y + Math.random() * height;
            ctx.fillRect(dirtX, dirtY, 2, 2);
        }
        
        ctx.globalAlpha = 1;
    }
    
    /**
     * Desenha tile de pedra
     */
    drawStoneTile(ctx, x, y, width, height, options) {
        const baseColor = options.variant === 'dark' ? this.colors.get('stone_dark') : 
                         options.variant === 'light' ? this.colors.get('stone_light') : 
                         this.colors.get('stone');
        
        // Base
        ctx.fillStyle = baseColor;
        ctx.fillRect(x, y, width, height);
        
        // Textura de pedra
        ctx.strokeStyle = this.colors.get('stone_dark');
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.3;
        
        // Linhas de pedra
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.moveTo(x + Math.random() * width, y);
            ctx.lineTo(x + Math.random() * width, y + height);
            ctx.stroke();
        }
        
        ctx.globalAlpha = 1;
    }
    
    /**
     * Desenha tile de água
     */
    drawWaterTile(ctx, x, y, width, height, options) {
        const baseColor = options.variant === 'dark' ? this.colors.get('water_dark') : 
                         options.variant === 'light' ? this.colors.get('water_light') : 
                         this.colors.get('water');
        
        // Base
        ctx.fillStyle = baseColor;
        ctx.fillRect(x, y, width, height);
        
        // Ondas simples
        ctx.strokeStyle = this.colors.get('water_light');
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.5;
        
        // Linhas de onda
        for (let i = 0; i < 3; i++) {
            const waveY = y + (height / 4) * i + (height / 8);
            ctx.beginPath();
            ctx.moveTo(x, waveY);
            ctx.lineTo(x + width, waveY);
            ctx.stroke();
        }
        
        ctx.globalAlpha = 1;
    }
    
    /**
     * Desenha árvore de carvalho
     */
    drawOakTree(ctx, x, y, width, height, options) {
        // Tronco
        ctx.fillStyle = this.colors.get('tree_trunk');
        const trunkWidth = width / 3;
        const trunkHeight = height / 2;
        const trunkX = x + (width - trunkWidth) / 2;
        const trunkY = y + height - trunkHeight;
        ctx.fillRect(trunkX, trunkY, trunkWidth, trunkHeight);
        
        // Folhas (círculo grande)
        ctx.fillStyle = this.colors.get('leaf');
        ctx.beginPath();
        ctx.arc(x + width / 2, y + height / 3, width / 2.5, 0, Math.PI * 2);
        ctx.fill();
        
        // Detalhes das folhas
        ctx.fillStyle = this.colors.get('leaf_dark');
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.arc(x + width / 2 - 5, y + height / 3 - 5, width / 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }
    
    /**
     * Desenha árvore de pinheiro
     */
    drawPineTree(ctx, x, y, width, height, options) {
        // Tronco
        ctx.fillStyle = this.colors.get('tree_trunk');
        const trunkWidth = width / 4;
        const trunkHeight = height / 3;
        const trunkX = x + (width - trunkWidth) / 2;
        const trunkY = y + height - trunkHeight;
        ctx.fillRect(trunkX, trunkY, trunkWidth, trunkHeight);
        
        // Folhas (triângulo)
        ctx.fillStyle = this.colors.get('leaf_dark');
        ctx.beginPath();
        ctx.moveTo(x + width / 2, y);
        ctx.lineTo(x, y + height * 0.7);
        ctx.lineTo(x + width, y + height * 0.7);
        ctx.closePath();
        ctx.fill();
        
        // Segunda camada
        ctx.fillStyle = this.colors.get('leaf');
        ctx.beginPath();
        ctx.moveTo(x + width / 2, y + height * 0.2);
        ctx.lineTo(x + width * 0.2, y + height * 0.8);
        ctx.lineTo(x + width * 0.8, y + height * 0.8);
        ctx.closePath();
        ctx.fill();
    }
    
    /**
     * Desenha arbusto pequeno
     */
    drawSmallBush(ctx, x, y, width, height, options) {
        ctx.fillStyle = this.colors.get('bush');
        
        // Círculo principal
        ctx.beginPath();
        ctx.arc(x + width / 2, y + height / 2, width / 2.5, 0, Math.PI * 2);
        ctx.fill();
        
        // Detalhes
        ctx.fillStyle = this.colors.get('bush_dark');
        ctx.globalAlpha = 0.4;
        ctx.beginPath();
        ctx.arc(x + width / 3, y + height / 3, width / 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }
    
    /**
     * Desenha arbusto grande
     */
    drawLargeBush(ctx, x, y, width, height, options) {
        ctx.fillStyle = this.colors.get('bush');
        
        // Três círculos sobrepostos
        ctx.beginPath();
        ctx.arc(x + width / 3, y + height / 2, width / 3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(x + width * 2 / 3, y + height / 2, width / 3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(x + width / 2, y + height / 3, width / 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Detalhes
        ctx.fillStyle = this.colors.get('bush_dark');
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.arc(x + width / 2, y + height / 2, width / 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }
    
    /**
     * Desenha pedra pequena
     */
    drawSmallRock(ctx, x, y, width, height, options) {
        ctx.fillStyle = this.colors.get('rock');
        
        // Forma irregular de pedra
        ctx.beginPath();
        ctx.moveTo(x + width * 0.2, y + height * 0.8);
        ctx.lineTo(x + width * 0.4, y + height * 0.2);
        ctx.lineTo(x + width * 0.8, y + height * 0.3);
        ctx.lineTo(x + width * 0.7, y + height * 0.9);
        ctx.closePath();
        ctx.fill();
        
        // Sombra
        ctx.fillStyle = this.colors.get('rock_dark');
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.moveTo(x + width * 0.4, y + height * 0.5);
        ctx.lineTo(x + width * 0.6, y + height * 0.4);
        ctx.lineTo(x + width * 0.7, y + height * 0.7);
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = 1;
    }
    
    /**
     * Desenha pedra grande
     */
    drawLargeRock(ctx, x, y, width, height, options) {
        ctx.fillStyle = this.colors.get('rock');
        
        // Forma irregular grande
        ctx.beginPath();
        ctx.moveTo(x + width * 0.1, y + height * 0.7);
        ctx.lineTo(x + width * 0.3, y + height * 0.1);
        ctx.lineTo(x + width * 0.7, y + height * 0.2);
        ctx.lineTo(x + width * 0.9, y + height * 0.6);
        ctx.lineTo(x + width * 0.8, y + height * 0.9);
        ctx.lineTo(x + width * 0.2, y + height * 0.8);
        ctx.closePath();
        ctx.fill();
        
        // Textura
        ctx.fillStyle = this.colors.get('rock_dark');
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.moveTo(x + width * 0.3, y + height * 0.4);
        ctx.lineTo(x + width * 0.5, y + height * 0.3);
        ctx.lineTo(x + width * 0.6, y + height * 0.6);
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = 1;
    }
    
    /**
     * Desenha flor
     */
    drawFlower(ctx, x, y, width, height, color, options) {
        // Caule
        ctx.strokeStyle = '#4CAF50';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x + width / 2, y + height);
        ctx.lineTo(x + width / 2, y + height * 0.6);
        ctx.stroke();
        
        // Pétalas
        ctx.fillStyle = color;
        const petalCount = 5;
        const petalRadius = width / 6;
        const centerX = x + width / 2;
        const centerY = y + height * 0.4;
        
        for (let i = 0; i < petalCount; i++) {
            const angle = (i * 2 * Math.PI) / petalCount;
            const petalX = centerX + Math.cos(angle) * petalRadius;
            const petalY = centerY + Math.sin(angle) * petalRadius;
            ctx.beginPath();
            ctx.arc(petalX, petalY, petalRadius / 2, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Centro
        ctx.fillStyle = '#FFEB3B';
        ctx.beginPath();
        ctx.arc(centerX, centerY, petalRadius / 3, 0, Math.PI * 2);
        ctx.fill();
    }
    
    /**
     * Desenha jogador aprendiz
     */
    drawApprenticePlayer(ctx, x, y, width, height, options) {
        // Corpo
        ctx.fillStyle = this.colors.get('player_apprentice');
        ctx.fillRect(x + width * 0.3, y + height * 0.4, width * 0.4, height * 0.4);
        
        // Cabeça
        ctx.beginPath();
        ctx.arc(x + width / 2, y + height * 0.3, width * 0.15, 0, Math.PI * 2);
        ctx.fill();
        
        // Chapéu de aprendiz
        ctx.fillStyle = this.colors.get('player_apprentice_dark');
        ctx.fillRect(x + width * 0.25, y + height * 0.2, width * 0.5, height * 0.1);
        ctx.fillRect(x + width * 0.35, y + height * 0.15, width * 0.3, height * 0.05);
        
        // Braços
        ctx.fillStyle = this.colors.get('player_apprentice');
        ctx.fillRect(x + width * 0.2, y + height * 0.45, width * 0.1, height * 0.2);
        ctx.fillRect(x + width * 0.7, y + height * 0.45, width * 0.1, height * 0.2);
        
        // Pernas
        ctx.fillRect(x + width * 0.35, y + height * 0.75, width * 0.1, height * 0.25);
        ctx.fillRect(x + width * 0.55, y + height * 0.75, width * 0.1, height * 0.25);
        
        // Varinha mágica
        ctx.strokeStyle = '#8D6E63';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x + width * 0.8, y + height * 0.5);
        ctx.lineTo(x + width * 0.95, y + height * 0.3);
        ctx.stroke();
        
        // Estrela na varinha
        ctx.fillStyle = '#FFEB3B';
        ctx.beginPath();
        ctx.arc(x + width * 0.95, y + height * 0.3, 3, 0, Math.PI * 2);
        ctx.fill();
    }
    
    /**
     * Desenha rato
     */
    drawRat(ctx, x, y, width, height, options) {
        // Corpo
        ctx.fillStyle = this.colors.get('mob_rat');
        ctx.beginPath();
        ctx.ellipse(x + width / 2, y + height / 2, width * 0.4, height * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Cabeça
        ctx.beginPath();
        ctx.arc(x + width * 0.7, y + height * 0.4, width * 0.2, 0, Math.PI * 2);
        ctx.fill();
        
        // Cauda
        ctx.strokeStyle = this.colors.get('mob_rat');
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x + width * 0.1, y + height * 0.5);
        ctx.quadraticCurveTo(x - width * 0.1, y + height * 0.3, x - width * 0.2, y + height * 0.1);
        ctx.stroke();
        
        // Olhos
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(x + width * 0.75, y + height * 0.35, 2, 0, Math.PI * 2);
        ctx.fill();
    }
    
    /**
     * Desenha slime
     */
    drawSlime(ctx, x, y, width, height, options) {
        // Corpo principal
        ctx.fillStyle = this.colors.get('mob_slime');
        ctx.beginPath();
        ctx.ellipse(x + width / 2, y + height * 0.6, width * 0.4, height * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Parte superior
        ctx.beginPath();
        ctx.arc(x + width / 2, y + height * 0.4, width * 0.3, 0, Math.PI * 2);
        ctx.fill();
        
        // Olhos
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(x + width * 0.4, y + height * 0.4, 2, 0, Math.PI * 2);
        ctx.arc(x + width * 0.6, y + height * 0.4, 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Brilho
        ctx.fillStyle = '#81C784';
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.arc(x + width * 0.3, y + height * 0.5, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }
    
    /**
     * Desenha lobo
     */
    drawWolf(ctx, x, y, width, height, options) {
        // Corpo
        ctx.fillStyle = this.colors.get('mob_wolf');
        ctx.beginPath();
        ctx.ellipse(x + width / 2, y + height / 2, width * 0.4, height * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Cabeça
        ctx.beginPath();
        ctx.arc(x + width * 0.7, y + height * 0.4, width * 0.2, 0, Math.PI * 2);
        ctx.fill();
        
        // Orelhas
        ctx.beginPath();
        ctx.moveTo(x + width * 0.6, y + height * 0.3);
        ctx.lineTo(x + width * 0.55, y + height * 0.2);
        ctx.lineTo(x + width * 0.65, y + height * 0.25);
        ctx.closePath();
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(x + width * 0.75, y + height * 0.3);
        ctx.lineTo(x + width * 0.7, y + height * 0.2);
        ctx.lineTo(x + width * 0.8, y + height * 0.25);
        ctx.closePath();
        ctx.fill();
        
        // Cauda
        ctx.beginPath();
        ctx.moveTo(x + width * 0.1, y + height * 0.5);
        ctx.quadraticCurveTo(x - width * 0.1, y + height * 0.3, x - width * 0.15, y + height * 0.5);
        ctx.lineTo(x - width * 0.1, y + height * 0.6);
        ctx.closePath();
        ctx.fill();
        
        // Olhos
        ctx.fillStyle = '#FF0000';
        ctx.beginPath();
        ctx.arc(x + width * 0.75, y + height * 0.35, 2, 0, Math.PI * 2);
        ctx.fill();
    }
    
    /**
     * Desenha bandido
     */
    drawBandit(ctx, x, y, width, height, options) {
        // Corpo
        ctx.fillStyle = this.colors.get('mob_bandit');
        ctx.fillRect(x + width * 0.3, y + height * 0.4, width * 0.4, height * 0.4);
        
        // Cabeça
        ctx.beginPath();
        ctx.arc(x + width / 2, y + height * 0.3, width * 0.15, 0, Math.PI * 2);
        ctx.fill();
        
        // Chapéu
        ctx.fillStyle = '#000';
        ctx.fillRect(x + width * 0.25, y + height * 0.2, width * 0.5, height * 0.05);
        
        // Máscara
        ctx.fillStyle = '#000';
        ctx.fillRect(x + width * 0.35, y + height * 0.3, width * 0.3, height * 0.1);
        
        // Espada
        ctx.fillStyle = '#757575';
        ctx.fillRect(x + width * 0.8, y + height * 0.4, width * 0.15, height * 0.02);
        ctx.fillRect(x + width * 0.88, y + height * 0.35, width * 0.02, height * 0.15);
        
        // Olhos
        ctx.fillStyle = '#FF0000';
        ctx.beginPath();
        ctx.arc(x + width * 0.4, y + height * 0.35, 2, 0, Math.PI * 2);
        ctx.arc(x + width * 0.6, y + height * 0.35, 2, 0, Math.PI * 2);
        ctx.fill();
    }
    
    /**
     * Desenha javali
     */
    drawBoar(ctx, x, y, width, height, options) {
        // Corpo
        ctx.fillStyle = this.colors.get('mob_boar');
        ctx.beginPath();
        ctx.ellipse(x + width / 2, y + height / 2, width * 0.4, height * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Cabeça
        ctx.beginPath();
        ctx.arc(x + width * 0.7, y + height * 0.4, width * 0.2, 0, Math.PI * 2);
        ctx.fill();
        
        // Presas
        ctx.fillStyle = '#FFF';
        ctx.beginPath();
        ctx.moveTo(x + width * 0.75, y + height * 0.45);
        ctx.lineTo(x + width * 0.8, y + height * 0.5);
        ctx.lineTo(x + width * 0.75, y + height * 0.55);
        ctx.closePath();
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(x + width * 0.8, y + height * 0.45);
        ctx.lineTo(x + width * 0.85, y + height * 0.5);
        ctx.lineTo(x + width * 0.8, y + height * 0.55);
        ctx.closePath();
        ctx.fill();
        
        // Olhos
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(x + width * 0.75, y + height * 0.35, 2, 0, Math.PI * 2);
        ctx.fill();
    }
    
    /**
     * Desenha goblin
     */
    drawGoblin(ctx, x, y, width, height, options) {
        // Corpo
        ctx.fillStyle = this.colors.get('mob_goblin');
        ctx.fillRect(x + width * 0.3, y + height * 0.4, width * 0.4, height * 0.4);
        
        // Cabeça
        ctx.beginPath();
        ctx.arc(x + width / 2, y + height * 0.3, width * 0.15, 0, Math.PI * 2);
        ctx.fill();
        
        // Orelhas pontudas
        ctx.beginPath();
        ctx.moveTo(x + width * 0.35, y + height * 0.25);
        ctx.lineTo(x + width * 0.3, y + height * 0.15);
        ctx.lineTo(x + width * 0.4, y + height * 0.2);
        ctx.closePath();
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(x + width * 0.65, y + height * 0.25);
        ctx.lineTo(x + width * 0.7, y + height * 0.15);
        ctx.lineTo(x + width * 0.6, y + height * 0.2);
        ctx.closePath();
        ctx.fill();
        
        // Faca
        ctx.fillStyle = '#757575';
        ctx.fillRect(x + width * 0.8, y + height * 0.4, width * 0.1, height * 0.02);
        
        // Olhos
        ctx.fillStyle = '#FF0000';
        ctx.beginPath();
        ctx.arc(x + width * 0.4, y + height * 0.3, 2, 0, Math.PI * 2);
        ctx.arc(x + width * 0.6, y + height * 0.3, 2, 0, Math.PI * 2);
        ctx.fill();
    }
    
    /**
     * Desenha coelho
     */
    drawRabbit(ctx, x, y, width, height, options) {
        // Corpo
        ctx.fillStyle = this.colors.get('mob_rabbit');
        ctx.beginPath();
        ctx.ellipse(x + width / 2, y + height / 2, width * 0.3, height * 0.25, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Cabeça
        ctx.beginPath();
        ctx.arc(x + width * 0.7, y + height * 0.4, width * 0.15, 0, Math.PI * 2);
        ctx.fill();
        
        // Orelhas
        ctx.beginPath();
        ctx.ellipse(x + width * 0.6, y + height * 0.2, width * 0.05, height * 0.15, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(x + width * 0.75, y + height * 0.2, width * 0.05, height * 0.15, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Rabo
        ctx.fillStyle = '#FFF';
        ctx.beginPath();
        ctx.arc(x + width * 0.1, y + height * 0.5, width * 0.08, 0, Math.PI * 2);
        ctx.fill();
        
        // Olhos
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(x + width * 0.75, y + height * 0.35, 2, 0, Math.PI * 2);
        ctx.fill();
    }
    
    /**
     * Desenha urso
     */
    drawBear(ctx, x, y, width, height, options) {
        // Corpo
        ctx.fillStyle = this.colors.get('mob_bear');
        ctx.beginPath();
        ctx.ellipse(x + width / 2, y + height / 2, width * 0.4, height * 0.35, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Cabeça
        ctx.beginPath();
        ctx.arc(x + width * 0.7, y + height * 0.4, width * 0.2, 0, Math.PI * 2);
        ctx.fill();
        
        // Orelhas
        ctx.beginPath();
        ctx.arc(x + width * 0.6, y + height * 0.25, width * 0.08, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + width * 0.8, y + height * 0.25, width * 0.08, 0, Math.PI * 2);
        ctx.fill();
        
        // Olhos
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(x + width * 0.65, y + height * 0.35, 3, 0, Math.PI * 2);
        ctx.arc(x + width * 0.75, y + height * 0.35, 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Focinho
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(x + width * 0.75, y + height * 0.45, 2, 0, Math.PI * 2);
        ctx.fill();
    }
    
    /**
     * Desenha imp
     */
    drawImp(ctx, x, y, width, height, options) {
        // Corpo
        ctx.fillStyle = this.colors.get('mob_imp');
        ctx.beginPath();
        ctx.ellipse(x + width / 2, y + height / 2, width * 0.3, height * 0.25, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Cabeça
        ctx.beginPath();
        ctx.arc(x + width / 2, y + height * 0.3, width * 0.15, 0, Math.PI * 2);
        ctx.fill();
        
        // Asas
        ctx.fillStyle = this.colors.get('mob_imp');
        ctx.globalAlpha = 0.7;
        ctx.beginPath();
        ctx.moveTo(x + width * 0.2, y + height * 0.4);
        ctx.lineTo(x + width * 0.1, y + height * 0.2);
        ctx.lineTo(x + width * 0.2, y + height * 0.1);
        ctx.lineTo(x + width * 0.3, y + height * 0.3);
        ctx.closePath();
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(x + width * 0.8, y + height * 0.4);
        ctx.lineTo(x + width * 0.9, y + height * 0.2);
        ctx.lineTo(x + width * 0.8, y + height * 0.1);
        ctx.lineTo(x + width * 0.7, y + height * 0.3);
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = 1;
        
        // Chifres
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.moveTo(x + width * 0.4, y + height * 0.25);
        ctx.lineTo(x + width * 0.35, y + height * 0.15);
        ctx.lineTo(x + width * 0.4, y + height * 0.2);
        ctx.closePath();
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(x + width * 0.6, y + height * 0.25);
        ctx.lineTo(x + width * 0.65, y + height * 0.15);
        ctx.lineTo(x + width * 0.6, y + height * 0.2);
        ctx.closePath();
        ctx.fill();
        
        // Olhos
        ctx.fillStyle = '#FF0000';
        ctx.beginPath();
        ctx.arc(x + width * 0.4, y + height * 0.3, 2, 0, Math.PI * 2);
        ctx.arc(x + width * 0.6, y + height * 0.3, 2, 0, Math.PI * 2);
        ctx.fill();
    }
    
    /**
     * Desenha sprite padrão (fallback)
     */
    drawDefaultSprite(ctx, x, y, width, height, options) {
        ctx.fillStyle = '#FF5722';
        ctx.fillRect(x, y, width, height);
        
        // Adicionar "X" para indicar sprite não encontrado
        ctx.strokeStyle = '#FFF';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x + 5, y + 5);
        ctx.lineTo(x + width - 5, y + height - 5);
        ctx.moveTo(x + width - 5, y + 5);
        ctx.lineTo(x + 5, y + height - 5);
        ctx.stroke();
    }
    
    /**
     * Obtém cor para sprite
     */
    getColor(colorName) {
        return this.colors.get(colorName) || '#999';
    }
    
    /**
     * Desenha sprite com animação simples
     */
    drawAnimatedSprite(ctx, type, x, y, width, height, frame = 0, options = {}) {
        // Adicionar deslocamento baseado no frame para animação
        const offset = Math.sin(frame * 0.1) * 2;
        
        if (type.includes('mob_') || type.includes('player_')) {
            // Animação de flutuação para mobs e players
            this.drawSprite(ctx, type, x, y + offset, width, height, options);
        } else {
            // Sprites estáticos não animam
            this.drawSprite(ctx, type, x, y, width, height, options);
        }
    }
}

// Exportar para uso global
window.SimpleSpriteSystem = SimpleSpriteSystem;
