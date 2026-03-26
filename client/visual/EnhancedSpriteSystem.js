/**
 * Enhanced Sprite System - Legacy of Komodo
 * Sistema de sprites aprimorado com NPCs, mobs e player detalhados
 */

class EnhancedSpriteSystem {
    constructor(assetManager) {
        this.assetManager = assetManager;
        this.sprites = new Map(); // Inicializar sprites Map
        this.initializeEnhancedSprites();
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
        this.colors.set('player', '#4169E1');
        this.colors.set('mob_common', '#8B4513');
        this.colors.set('mob_rare', '#9C27B0');
        this.colors.set('mob_elite', '#FF5722');
        this.colors.set('mob_boss', '#F44336');
        
        // === CORES PARA ITENS ===
        this.colors.set('item_common', '#FFFFFF');
        this.colors.set('item_uncommon', '#1EFF00');
        this.colors.set('item_rare', '#0070DD');
        this.colors.set('item_epic', '#A335EE');
        this.colors.set('item_legendary', '#FF8000');
        
        // === CORES PARA UI ===
        this.colors.set('ui_health', '#FF0000');
        this.colors.set('ui_mana', '#0000FF');
        this.colors.set('ui_exp', '#FFD700');
        this.colors.set('ui_stamina', '#FFFF00');
        this.colors.set('ui_energy', '#00FF00');
    }
    
    initializeEnhancedSprites() {
        console.log('🎨 Inicializando sprites aprimorados...');
        
        // === SPRITES DE NPC ===
        this.enhancedSprites.set('merchant', {
            body: '#8B4513',      // Marrom (roupa de mercador)
            accent: '#FFD700',     // Dourado (detalhes)
            skin: '#FDBCB4',       // Pele clara
            hair: '#654321'        // Marrom escuro (cabelo)
        });
        
        this.enhancedSprites.set('guard', {
            body: '#708090',       // Cinza azulado (armadura)
            accent: '#C0C0C0',     // Prata (detalhes)
            skin: '#FDBCB4',       // Pele clara
            hair: '#000000'        // Preto (cabelo)
        });
        
        this.enhancedSprites.set('blacksmith', {
            body: '#2F4F4F',       // Cinza escuro (avental)
            accent: '#FF6347',     // Vermelho (fogo)
            skin: '#FDBCB4',       // Pele clara
            hair: '#8B4513'        // Marrom (cabelo)
        });
        
        this.enhancedSprites.set('healer', {
            body: '#FFFFFF',       // Branco (túnica)
            accent: '#4169E1',     // Azul (detalhes mágicos)
            skin: '#FDBCB4',       // Pele clara
            hair: '#FFD700'        // Dourado (aura)
        });
        
        this.enhancedSprites.set('elder', {
            body: '#8B4513',       // Marrom (túnica)
            accent: '#DAA520',     // Dourado antigo
            skin: '#F5DEB3',       // Pele mais clara
            hair: '#F0E68C'        // Bege (cabelo grisalho)
        });
        
        // === SPRITES DE MOB MELHORADOS ===
        this.enhancedSprites.set('rat', {
            body: '#696969',       // Cinza médio
            accent: '#2F4F4F',     // Cinza escuro
            eyes: '#FF0000'        // Olhos vermelhos
        });
        
        this.enhancedSprites.set('slime', {
            body: '#32CD32',       // Verde lima
            accent: '#228B22',     // Verde floresta
            core: '#00FF00'        // Centro brilhante
        });
        
        this.enhancedSprites.set('wolf', {
            body: '#696969',       // Cinza
            accent: '#2F4F4F',     // Cinza escuro
            eyes: '#FFD700'        // Olhos dourados
        });
        
        this.enhancedSprites.set('goblin', {
            body: '#228B22',       // Verde floresta
            accent: '#8B4513',     // Marrom (equipamento)
            eyes: '#FF0000'        // Olhos vermelhos
        });
        
        this.enhancedSprites.set('bear', {
            body: '#8B4513',       // Marrom
            accent: '#654321',     // Marrom escuro
            eyes: '#000000'        // Olhos pretos
        });
        
        // === SPRITES DE PLAYER ===
        this.enhancedSprites.set('apprentice', {
            robe: '#4169E1',       // Azul real (túnica de aprendiz)
            trim: '#FFD700',       // Dourado (detalhes)
            skin: '#FDBCB4',       // Pele clara
            hair: '#8B4513'        // Marrom (cabelo)
        });
        
        this.enhancedSprites.set('warrior', {
            armor: '#C0C0C0',      // Prata (armadura)
            trim: '#B22222',       // Vermelho (detalhes)
            skin: '#FDBCB4',       // Pele clara
            hair: '#8B4513'        // Marrom (cabelo)
        });
        
        this.enhancedSprites.set('mage', {
            robe: '#4B0082',       // Índigo (túnica de mago)
            trim: '#FFD700',       // Dourado (detalhes mágicos)
            skin: '#FDBCB4',       // Pele clara
            hair: '#9370DB'        // Roxo (cabelo mágico)
        });
        
        // === ANIMAÇÃO FRAMES ===
        this.setupAnimationFrames();
        
        console.log('✅ Sprites aprimorados inicializados');
    }
    
    // Métodos básicos necessários
    drawTile(ctx, tileType, x, y, width = 32, height = 32) {
        const color = this.colors.get(tileType) || '#808080';
        ctx.fillStyle = color;
        ctx.fillRect(x, y, width, height);
        
        // Adicionar textura ou detalhes
        if (tileType.includes('grass')) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
            for (let i = 0; i < 5; i++) {
                const px = x + Math.random() * width;
                const py = y + Math.random() * height;
                ctx.fillRect(px, py, 1, 1);
            }
        }
    }
    
    drawDecoration(ctx, decorationType, x, y, width = 32, height = 32) {
        switch(decorationType) {
            case 'tree_oak':
                this.drawTree(ctx, x, y, width, height);
                break;
            case 'bush_small':
                this.drawBush(ctx, x, y, width, height);
                break;
            case 'rock_small':
                this.drawRock(ctx, x, y, width, height);
                break;
            case 'flower_red':
            case 'flower_yellow':
            case 'flower_blue':
            case 'flower_purple':
                this.drawFlower(ctx, x, y, decorationType);
                break;
            default:
                this.drawGenericDecoration(ctx, x, y, width, height);
        }
    }
    
    drawTree(ctx, x, y, width, height) {
        // Tronco
        ctx.fillStyle = this.colors.get('tree_trunk');
        ctx.fillRect(x + width/3, y + height/2, width/3, height/2);
        
        // Folhas
        ctx.fillStyle = this.colors.get('leaf');
        ctx.beginPath();
        ctx.arc(x + width/2, y + height/3, width/3, 0, Math.PI * 2);
        ctx.fill();
    }
    
    drawBush(ctx, x, y, width, height) {
        ctx.fillStyle = this.colors.get('bush');
        ctx.beginPath();
        ctx.ellipse(x + width/2, y + height/2, width/2, height/3, 0, 0, Math.PI * 2);
        ctx.fill();
    }
    
    drawRock(ctx, x, y, width, height) {
        ctx.fillStyle = this.colors.get('rock');
        ctx.beginPath();
        ctx.ellipse(x + width/2, y + height/2, width/2, height/3, 0, 0, Math.PI * 2);
        ctx.fill();
    }
    
    drawFlower(ctx, x, y, flowerType) {
        // Caule
        ctx.strokeStyle = '#228B22';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x + 16, y + 20);
        ctx.lineTo(x + 16, y + 30);
        ctx.stroke();
        
        // Pétalas
        const colors = {
            'flower_red': '#F44336',
            'flower_yellow': '#FFEB3B',
            'flower_blue': '#2196F3',
            'flower_purple': '#9C27B0'
        };
        
        ctx.fillStyle = colors[flowerType] || '#FFFFFF';
        for (let i = 0; i < 5; i++) {
            const angle = (Math.PI * 2 * i) / 5;
            const px = x + 16 + Math.cos(angle) * 8;
            const py = y + 16 + Math.sin(angle) * 8;
            ctx.beginPath();
            ctx.arc(px, py, 3, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Centro
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(x + 16, y + 16, 3, 0, Math.PI * 2);
        ctx.fill();
    }
    
    drawGenericDecoration(ctx, x, y, width, height) {
        ctx.fillStyle = '#808080';
        ctx.fillRect(x, y, width, height);
    }
    
    drawMob(ctx, mobType, x, y, frame = 0) {
        this.drawEnhancedMob(ctx, mobType, x, y, frame);
    }
    
    drawPlayer(ctx, classType, x, y, frame = 0) {
        this.drawEnhancedPlayer(ctx, classType, x, y, frame);
    }
    
    drawNPC(ctx, npcType, x, y, frame = 0) {
        this.drawEnhancedNPC(ctx, npcType, x, y, frame);
    }
    
    setupAnimationFrames() {
        // Frames para animação de andar
        this.animationFrames.set('walk', [
            { frame: 0, offsetX: 0, offsetY: 0 },
            { frame: 1, offsetX: -2, offsetY: 1 },
            { frame: 2, offsetX: 0, offsetY: 0 },
            { frame: 3, offsetX: 2, offsetY: 1 }
        ]);
        
        // Frames para animação de ataque
        this.animationFrames.set('attack', [
            { frame: 0, offsetX: 0, offsetY: 0, scale: 1.0 },
            { frame: 1, offsetX: 5, offsetY: -2, scale: 1.1 },
            { frame: 2, offsetX: 8, offsetY: -4, scale: 1.2 },
            { frame: 3, offsetX: 5, offsetY: -2, scale: 1.1 }
        ]);
        
        // Frames para animação de idle
        this.animationFrames.set('idle', [
            { frame: 0, offsetY: 0 },
            { frame: 1, offsetY: 1 },
            { frame: 2, offsetY: 0 },
            { frame: 3, offsetY: -1 }
        ]);
    }
    
    /**
     * Desenha sprite de NPC
     */
    drawNPC(ctx, npcType, x, y, frame = 0) {
        const colors = this.enhancedSprites.get(npcType);
        if (!colors) {
            // Fallback para sprite genérico
            this.drawGenericNPC(ctx, x, y, frame);
            return;
        }
        
        const animFrame = this.animationFrames.get('walk')[frame] || { offsetX: 0, offsetY: 0 };
        const finalX = x + animFrame.offsetX;
        const finalY = y + animFrame.offsetY;
        
        ctx.save();
        
        switch(npcType) {
            case 'merchant':
                this.drawMerchant(ctx, finalX, finalY, colors);
                break;
            case 'guard':
                this.drawGuard(ctx, finalX, finalY, colors);
                break;
            case 'blacksmith':
                this.drawBlacksmith(ctx, finalX, finalY, colors);
                break;
            case 'healer':
                this.drawHealer(ctx, finalX, finalY, colors);
                break;
            case 'elder':
                this.drawElder(ctx, finalX, finalY, colors);
                break;
            default:
                this.drawGenericNPC(ctx, finalX, finalY, frame);
        }
        
        ctx.restore();
    }
    
    /**
     * Desenha sprite de mob aprimorado
     */
    drawEnhancedMob(ctx, mobType, x, y, frame = 0) {
        const colors = this.enhancedSprites.get(mobType);
        if (!colors) {
            // Fallback para sprite genérico
            this.drawGenericMob(ctx, x, y, frame);
            return;
        }
        
        const animFrame = this.animationFrames.get('walk')[frame] || { offsetX: 0, offsetY: 0 };
        const finalX = x + animFrame.offsetX;
        const finalY = y + animFrame.offsetY;
        
        ctx.save();
        
        switch(mobType) {
            case 'rat':
                this.drawRat(ctx, finalX, finalY, colors);
                break;
            case 'slime':
                this.drawSlime(ctx, finalX, finalY, colors, frame);
                break;
            case 'wolf':
                this.drawWolf(ctx, finalX, finalY, colors);
                break;
            case 'goblin':
                this.drawGoblin(ctx, finalX, finalY, colors);
                break;
            case 'bear':
                this.drawBear(ctx, finalX, finalY, colors);
                break;
            default:
                super.drawMob(ctx, mobType, finalX, finalY, frame);
        }
        
        ctx.restore();
    }
    
    /**
     * Desenha sprite de player aprimorado
     */
    drawEnhancedPlayer(ctx, classType, x, y, frame = 0) {
        const colors = this.enhancedSprites.get(classType);
        if (!colors) {
            // Fallback para sprite genérico
            this.drawGenericPlayer(ctx, x, y, frame);
            return;
        }
        
        const animFrame = this.animationFrames.get('walk')[frame] || { offsetX: 0, offsetY: 0 };
        const finalX = x + animFrame.offsetX;
        const finalY = y + animFrame.offsetY;
        
        ctx.save();
        
        switch(classType) {
            case 'apprentice':
                this.drawApprentice(ctx, finalX, finalY, colors);
                break;
            case 'warrior':
                this.drawWarrior(ctx, finalX, finalY, colors);
                break;
            case 'mage':
                this.drawMage(ctx, finalX, finalY, colors);
                break;
            default:
                this.drawGenericPlayer(ctx, finalX, finalY, frame);
        }
        
        ctx.restore();
    }
    
    // === MÉTODOS GENÉRICOS ===
    
    drawGenericMob(ctx, x, y, frame) {
        const animFrame = this.animationFrames.get('walk')[frame] || { offsetX: 0, offsetY: 0 };
        const finalX = x + animFrame.offsetX;
        const finalY = y + animFrame.offsetY;
        
        // Corpo simples
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(finalX - 6, finalY - 3, 12, 6);
        
        // Cabeça
        ctx.fillStyle = '#FDBCB4';
        ctx.beginPath();
        ctx.arc(finalX, finalY - 8, 4, 0, Math.PI * 2);
        ctx.fill();
        
        // Olhos
        ctx.fillStyle = '#000';
        ctx.fillRect(finalX - 2, finalY - 9, 1, 1);
        ctx.fillRect(finalX + 1, finalY - 9, 1, 1);
        
        // Patas
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(finalX - 4, finalY + 3, 2, 2);
        ctx.fillRect(finalX - 1, finalY + 3, 2, 2);
        ctx.fillRect(finalX + 2, finalY + 3, 2, 2);
    }
    
    drawGenericPlayer(ctx, x, y, frame) {
        const animFrame = this.animationFrames.get('walk')[frame] || { offsetX: 0, offsetY: 0 };
        const finalX = x + animFrame.offsetX;
        const finalY = y + animFrame.offsetY;
        
        // Corpo simples
        ctx.fillStyle = '#4169E1';
        ctx.fillRect(finalX - 6, finalY - 3, 12, 10);
        
        // Cabeça
        ctx.fillStyle = '#FDBCB4';
        ctx.beginPath();
        ctx.arc(finalX, finalY - 10, 5, 0, Math.PI * 2);
        ctx.fill();
        
        // Olhos
        ctx.fillStyle = '#000';
        ctx.fillRect(finalX - 2, finalY - 11, 2, 2);
        
        // Braços
        ctx.fillStyle = '#4169E1';
        ctx.fillRect(finalX - 8, finalY - 3, 2, 8);
        ctx.fillRect(finalX + 6, finalY - 3, 2, 8);
        
        // Pernas
        ctx.fillRect(finalX - 4, finalY + 7, 2, 5);
        ctx.fillRect(finalX + 2, finalY + 7, 2, 5);
    }
    
    drawGenericNPC(ctx, x, y, frame) {
        const animFrame = this.animationFrames.get('walk')[frame] || { offsetX: 0, offsetY: 0 };
        const finalX = x + animFrame.offsetX;
        const finalY = y + animFrame.offsetY;
        
        // Corpo simples
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(finalX - 8, finalY - 5, 16, 20);
        
        // Cabeça
        ctx.fillStyle = '#FDBCB4';
        ctx.beginPath();
        ctx.arc(finalX, finalY - 10, 6, 0, Math.PI * 2);
        ctx.fill();
        
        // Olhos
        ctx.fillStyle = '#000';
        ctx.fillRect(finalX - 3, finalY - 11, 2, 2);
        ctx.fillRect(finalX + 1, finalY - 11, 2, 2);
        
        // Braços
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(finalX - 12, finalY - 3, 4, 12);
        ctx.fillRect(finalX + 8, finalY - 3, 4, 12);
        
        // Pernas
        ctx.fillRect(finalX - 6, finalY + 15, 4, 8);
        ctx.fillRect(finalX + 2, finalY + 15, 4, 8);
    }
    
    // === MÉTODOS DE DESENHO ESPECÍFICOS ===
    
    drawMerchant(ctx, x, y, colors) {
        // Corpo (túnica marrom)
        ctx.fillStyle = colors.body;
        ctx.fillRect(x - 8, y - 5, 16, 20);
        
        // Detalhes dourados
        ctx.fillStyle = colors.accent;
        ctx.fillRect(x - 6, y - 3, 12, 2);
        ctx.fillRect(x - 6, y + 2, 12, 2);
        ctx.fillRect(x - 6, y + 7, 12, 2);
        
        // Cabeça
        ctx.fillStyle = colors.skin;
        ctx.beginPath();
        ctx.arc(x, y - 10, 6, 0, Math.PI * 2);
        ctx.fill();
        
        // Cabelo
        ctx.fillStyle = colors.hair;
        ctx.fillRect(x - 6, y - 16, 12, 8);
        
        // Olhos
        ctx.fillStyle = '#000';
        ctx.fillRect(x - 3, y - 11, 2, 2);
        ctx.fillRect(x + 1, y - 11, 2, 2);
        
        // Barba
        ctx.fillStyle = colors.hair;
        ctx.fillRect(x - 3, y - 7, 6, 4);
        
        // Braços
        ctx.fillStyle = colors.body;
        ctx.fillRect(x - 12, y - 3, 4, 12);
        ctx.fillRect(x + 8, y - 3, 4, 12);
        
        // Pernas
        ctx.fillRect(x - 6, y + 15, 4, 8);
        ctx.fillRect(x + 2, y + 15, 4, 8);
    }
    
    drawGuard(ctx, x, y, colors) {
        // Armadura
        ctx.fillStyle = colors.body;
        ctx.fillRect(x - 10, y - 5, 20, 22);
        
        // Detalhes prateados
        ctx.fillStyle = colors.accent;
        ctx.fillRect(x - 8, y - 3, 16, 2);
        ctx.fillRect(x - 8, y + 5, 16, 2);
        
        // Elmo
        ctx.fillStyle = colors.body;
        ctx.fillRect(x - 8, y - 18, 16, 10);
        
        // Visor do elmo
        ctx.fillStyle = colors.accent;
        ctx.fillRect(x - 4, y - 15, 8, 4);
        
        // Corpo (visível)
        ctx.fillStyle = colors.skin;
        ctx.beginPath();
        ctx.arc(x, y - 8, 4, 0, Math.PI * 2);
        ctx.fill();
        
        // Espada
        ctx.fillStyle = '#C0C0C0';
        ctx.fillRect(x + 12, y - 10, 2, 20);
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(x + 10, y + 8, 6, 8);
        
        // Braços com armadura
        ctx.fillStyle = colors.body;
        ctx.fillRect(x - 14, y - 3, 4, 14);
        ctx.fillRect(x + 10, y - 3, 4, 14);
        
        // Pernas com armadura
        ctx.fillRect(x - 8, y + 17, 5, 8);
        ctx.fillRect(x + 3, y + 17, 5, 8);
    }
    
    drawBlacksmith(ctx, x, y, colors) {
        // Avental
        ctx.fillStyle = colors.body;
        ctx.fillRect(x - 10, y - 5, 20, 20);
        
        // Detalhes de fogo
        ctx.fillStyle = colors.accent;
        ctx.fillRect(x - 8, y + 5, 16, 4);
        
        // Cabeça
        ctx.fillStyle = colors.skin;
        ctx.beginPath();
        ctx.arc(x, y - 10, 6, 0, Math.PI * 2);
        ctx.fill();
        
        // Cabelo
        ctx.fillStyle = colors.hair;
        ctx.fillRect(x - 6, y - 16, 12, 8);
        
        // Olhos
        ctx.fillStyle = '#000';
        ctx.fillRect(x - 3, y - 11, 2, 2);
        ctx.fillRect(x + 1, y - 11, 2, 2);
        
        // Bigode
        ctx.fillStyle = colors.hair;
        ctx.fillRect(x - 4, y - 7, 8, 2);
        
        // Martelo
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(x + 10, y - 15, 3, 25);
        ctx.fillStyle = '#696969';
        ctx.fillRect(x + 8, y - 18, 7, 5);
        
        // Braços fortes
        ctx.fillStyle = colors.skin;
        ctx.fillRect(x - 12, y - 3, 4, 12);
        ctx.fillRect(x + 8, y - 3, 4, 12);
        
        // Pernas
        ctx.fillRect(x - 6, y + 15, 4, 8);
        ctx.fillRect(x + 2, y + 15, 4, 8);
    }
    
    drawHealer(ctx, x, y, colors) {
        // Túnica branca
        ctx.fillStyle = colors.body;
        ctx.fillRect(x - 9, y - 5, 18, 22);
        
        // Detalhes azuis mágicos
        ctx.fillStyle = colors.accent;
        ctx.fillRect(x - 7, y - 3, 14, 2);
        ctx.fillRect(x - 7, y + 8, 14, 2);
        
        // Símbolo mágico no peito
        ctx.fillStyle = colors.accent;
        ctx.beginPath();
        ctx.arc(x, y + 2, 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Cabeça
        ctx.fillStyle = colors.skin;
        ctx.beginPath();
        ctx.arc(x, y - 10, 6, 0, Math.PI * 2);
        ctx.fill();
        
        // Aura dourada
        ctx.fillStyle = colors.hair;
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.arc(x, y - 10, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
        
        // Cabelo loiro
        ctx.fillStyle = colors.hair;
        ctx.fillRect(x - 6, y - 16, 12, 8);
        
        // Olhos gentis
        ctx.fillStyle = '#4169E1';
        ctx.fillRect(x - 3, y - 11, 2, 2);
        ctx.fillRect(x + 1, y - 11, 2, 2);
        
        // Cajado mágico
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(x + 12, y - 20, 2, 30);
        
        // Cristal no topo
        ctx.fillStyle = colors.accent;
        ctx.beginPath();
        ctx.arc(x + 13, y - 22, 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Braços
        ctx.fillStyle = colors.body;
        ctx.fillRect(x - 11, y - 3, 4, 14);
        ctx.fillRect(x + 7, y - 3, 4, 14);
        
        // Pernas
        ctx.fillRect(x - 6, y + 17, 4, 8);
        ctx.fillRect(x + 2, y + 17, 4, 8);
    }
    
    drawElder(ctx, x, y, colors) {
        // Túnica marrom
        ctx.fillStyle = colors.body;
        ctx.fillRect(x - 9, y - 5, 18, 22);
        
        // Detalhes dourados antigos
        ctx.fillStyle = colors.accent;
        ctx.fillRect(x - 7, y - 3, 14, 2);
        ctx.fillRect(x - 7, y + 8, 14, 2);
        
        // Cabeça
        ctx.fillStyle = colors.skin;
        ctx.beginPath();
        ctx.arc(x, y - 10, 6, 0, Math.PI * 2);
        ctx.fill();
        
        // Cabelo grisalho
        ctx.fillStyle = colors.hair;
        ctx.fillRect(x - 7, y - 16, 14, 8);
        
        // Rugas
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x - 4, y - 8);
        ctx.lineTo(x - 2, y - 6);
        ctx.moveTo(x + 4, y - 8);
        ctx.lineTo(x + 2, y - 6);
        ctx.stroke();
        
        // Olhos sábios
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(x - 3, y - 11, 2, 2);
        ctx.fillRect(x + 1, y - 11, 2, 2);
        
        // Barba longa
        ctx.fillStyle = colors.hair;
        ctx.fillRect(x - 4, y - 7, 8, 8);
        
        // Cajado
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(x + 12, y - 18, 2, 28);
        
        // Cristal antigo
        ctx.fillStyle = colors.accent;
        ctx.beginPath();
        ctx.arc(x + 13, y - 20, 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Braços
        ctx.fillStyle = colors.body;
        ctx.fillRect(x - 11, y - 3, 4, 14);
        ctx.fillRect(x + 7, y - 3, 4, 14);
        
        // Pernas
        ctx.fillRect(x - 6, y + 17, 4, 8);
        ctx.fillRect(x + 2, y + 17, 4, 8);
    }
    
    // === MOBS MELHORADOS ===
    
    drawRat(ctx, x, y, colors) {
        // Corpo alongado
        ctx.fillStyle = colors.body;
        ctx.fillRect(x - 8, y - 3, 16, 6);
        
        // Cabeça
        ctx.fillRect(x - 12, y - 4, 6, 8);
        
        // Cauda
        ctx.fillRect(x + 8, y - 1, 12, 2);
        
        // Olhos vermelhos
        ctx.fillStyle = colors.eyes;
        ctx.fillRect(x - 10, y - 2, 2, 2);
        
        // Orelhas
        ctx.fillStyle = colors.accent;
        ctx.fillRect(x - 13, y - 6, 2, 3);
        ctx.fillRect(x - 7, y - 6, 2, 3);
        
        // Patas
        ctx.fillStyle = colors.body;
        ctx.fillRect(x - 6, y + 3, 2, 3);
        ctx.fillRect(x - 2, y + 3, 2, 3);
        ctx.fillRect(x + 2, y + 3, 2, 3);
        ctx.fillRect(x + 6, y + 3, 2, 3);
    }
    
    drawSlime(ctx, x, y, colors, frame) {
        // Animação de pulso
        const pulse = Math.sin(frame * Math.PI / 2) * 2;
        const size = 10 + pulse;
        
        // Corpo gelatinoso
        ctx.fillStyle = colors.body;
        ctx.beginPath();
        ctx.ellipse(x, y, size, size - 2, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Centro brilhante
        ctx.fillStyle = colors.core;
        ctx.beginPath();
        ctx.arc(x, y, size / 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Olhos
        ctx.fillStyle = '#000';
        ctx.fillRect(x - 4, y - 2, 2, 2);
        ctx.fillRect(x + 2, y - 2, 2, 2);
        
        // Brilho
        ctx.fillStyle = colors.body;
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.ellipse(x, y + 2, size + 4, 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
    }
    
    drawWolf(ctx, x, y, colors) {
        // Corpo
        ctx.fillStyle = colors.body;
        ctx.fillRect(x - 10, y - 4, 20, 8);
        
        // Cabeça
        ctx.fillRect(x - 16, y - 6, 8, 10);
        
        // Cauda
        ctx.fillRect(x + 10, y - 2, 12, 3);
        
        // Olhos dourados
        ctx.fillStyle = colors.eyes;
        ctx.fillRect(x - 14, y - 3, 2, 2);
        
        // Orelhas
        ctx.fillStyle = colors.accent;
        ctx.fillRect(x - 17, y - 8, 3, 4);
        ctx.fillRect(x - 11, y - 8, 3, 4);
        
        // Patas
        ctx.fillStyle = colors.body;
        ctx.fillRect(x - 8, y + 4, 3, 4);
        ctx.fillRect(x - 3, y + 4, 3, 4);
        ctx.fillRect(x + 2, y + 4, 3, 4);
        ctx.fillRect(x + 7, y + 4, 3, 4);
    }
    
    drawGoblin(ctx, x, y, colors) {
        // Corpo pequeno
        ctx.fillStyle = colors.body;
        ctx.fillRect(x - 6, y - 3, 12, 8);
        
        // Cabeça grande
        ctx.fillRect(x - 8, y - 8, 10, 8);
        
        // Orelhas pontudas
        ctx.fillStyle = colors.accent;
        ctx.fillRect(x - 9, y - 10, 2, 4);
        ctx.fillRect(x + 1, y - 10, 2, 4);
        
        // Olhos vermelhos
        ctx.fillStyle = colors.eyes;
        ctx.fillRect(x - 6, y - 5, 2, 2);
        ctx.fillRect(x - 2, y - 5, 2, 2);
        
        // Nariz grande
        ctx.fillStyle = colors.accent;
        ctx.fillRect(x - 4, y - 2, 3, 2);
        
        // Arma
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(x + 8, y - 8, 2, 12);
        
        // Patas
        ctx.fillStyle = colors.body;
        ctx.fillRect(x - 5, y + 5, 2, 3);
        ctx.fillRect(x - 1, y + 5, 2, 3);
        ctx.fillRect(x + 3, y + 5, 2, 3);
    }
    
    drawBear(ctx, x, y, colors) {
        // Corpo grande
        ctx.fillStyle = colors.body;
        ctx.fillRect(x - 12, y - 6, 24, 12);
        
        // Cabeça
        ctx.fillRect(x - 18, y - 8, 10, 12);
        
        // Cauda
        ctx.fillRect(x + 12, y - 2, 8, 4);
        
        // Olhos pretos
        ctx.fillStyle = colors.eyes;
        ctx.fillRect(x - 16, y - 5, 2, 2);
        
        // Orelhas
        ctx.fillStyle = colors.accent;
        ctx.fillRect(x - 19, y - 10, 4, 6);
        ctx.fillRect(x - 11, y - 10, 4, 6);
        
        // Focinho
        ctx.fillStyle = colors.accent;
        ctx.fillRect(x - 20, y - 2, 6, 4);
        
        // Garras
        ctx.fillStyle = '#000';
        ctx.fillRect(x - 10, y + 6, 2, 2);
        ctx.fillRect(x - 5, y + 6, 2, 2);
        ctx.fillRect(x, y + 6, 2, 2);
        ctx.fillRect(x + 5, y + 6, 2, 2);
    }
    
    // === PLAYER CLASSES ===
    
    drawApprentice(ctx, x, y, colors) {
        // Túnica azul
        ctx.fillStyle = colors.robe;
        ctx.fillRect(x - 8, y - 5, 16, 20);
        
        // Detalhes dourados
        ctx.fillStyle = colors.trim;
        ctx.fillRect(x - 6, y - 3, 12, 2);
        ctx.fillRect(x - 6, y + 5, 12, 2);
        
        // Símbolo de aprendiz
        ctx.fillStyle = colors.trim;
        ctx.beginPath();
        ctx.arc(x, y + 2, 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Cabeça
        ctx.fillStyle = colors.skin;
        ctx.beginPath();
        ctx.arc(x, y - 10, 6, 0, Math.PI * 2);
        ctx.fill();
        
        // Cabelo
        ctx.fillStyle = colors.hair;
        ctx.fillRect(x - 6, y - 16, 12, 8);
        
        // Olhos
        ctx.fillStyle = '#000';
        ctx.fillRect(x - 3, y - 11, 2, 2);
        ctx.fillRect(x + 1, y - 11, 2, 2);
        
        // Varinha mágica
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(x + 10, y - 15, 1, 15);
        
        // Cristal na varinha
        ctx.fillStyle = colors.trim;
        ctx.beginPath();
        ctx.arc(x + 10.5, y - 16, 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Braços
        ctx.fillStyle = colors.robe;
        ctx.fillRect(x - 10, y - 3, 4, 12);
        ctx.fillRect(x + 6, y - 3, 4, 12);
        
        // Pernas
        ctx.fillRect(x - 6, y + 15, 4, 8);
        ctx.fillRect(x + 2, y + 15, 4, 8);
    }
    
    drawWarrior(ctx, x, y, colors) {
        // Armadura
        ctx.fillStyle = colors.armor;
        ctx.fillRect(x - 10, y - 5, 20, 22);
        
        // Detalhes vermelhos
        ctx.fillStyle = colors.trim;
        ctx.fillRect(x - 8, y - 3, 16, 2);
        ctx.fillRect(x - 8, y + 8, 16, 2);
        
        // Elmo
        ctx.fillStyle = colors.armor;
        ctx.fillRect(x - 8, y - 18, 16, 10);
        
        // Cabeça (visível)
        ctx.fillStyle = colors.skin;
        ctx.beginPath();
        ctx.arc(x, y - 8, 4, 0, Math.PI * 2);
        ctx.fill();
        
        // Espada grande
        ctx.fillStyle = '#C0C0C0';
        ctx.fillRect(x + 12, y - 12, 3, 25);
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(x + 10, y + 10, 7, 10);
        
        // Escudo
        ctx.fillStyle = colors.trim;
        ctx.fillRect(x - 18, y - 8, 6, 12);
        
        // Braços com armadura
        ctx.fillStyle = colors.armor;
        ctx.fillRect(x - 14, y - 3, 4, 14);
        ctx.fillRect(x + 10, y - 3, 4, 14);
        
        // Pernas com armadura
        ctx.fillRect(x - 8, y + 17, 5, 8);
        ctx.fillRect(x + 3, y + 17, 5, 8);
    }
    
    drawMage(ctx, x, y, colors) {
        // Túnica roxa
        ctx.fillStyle = colors.robe;
        ctx.fillRect(x - 9, y - 5, 18, 24);
        
        // Detalhes dourados mágicos
        ctx.fillStyle = colors.trim;
        ctx.fillRect(x - 7, y - 3, 14, 2);
        ctx.fillRect(x - 7, y + 10, 14, 2);
        
        // Símbolo mágico
        ctx.fillStyle = colors.trim;
        ctx.beginPath();
        ctx.moveTo(x, y - 2);
        ctx.lineTo(x - 3, y + 3);
        ctx.lineTo(x + 3, y + 3);
        ctx.closePath();
        ctx.fill();
        
        // Cabeça
        ctx.fillStyle = colors.skin;
        ctx.beginPath();
        ctx.arc(x, y - 10, 6, 0, Math.PI * 2);
        ctx.fill();
        
        // Cabelo mágico roxo
        ctx.fillStyle = colors.hair;
        ctx.fillRect(x - 7, y - 18, 14, 10);
        
        // Olhos mágicos
        ctx.fillStyle = colors.hair;
        ctx.fillRect(x - 3, y - 11, 2, 2);
        ctx.fillRect(x + 1, y - 11, 2, 2);
        
        // Cajado mágico
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(x + 12, y - 20, 2, 32);
        
        // Orbe mágico
        ctx.fillStyle = colors.trim;
        ctx.beginPath();
        ctx.arc(x + 13, y - 22, 4, 0, Math.PI * 2);
        ctx.fill();
        
        // Aura mágica
        ctx.fillStyle = colors.hair;
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.arc(x, y - 10, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
        
        // Braços
        ctx.fillStyle = colors.robe;
        ctx.fillRect(x - 11, y - 3, 4, 14);
        ctx.fillRect(x + 7, y - 3, 4, 14);
        
        // Pernas
        ctx.fillRect(x - 6, y + 19, 4, 8);
        ctx.fillRect(x + 2, y + 19, 4, 8);
    }
    
    /**
     * Desenha NPC genérico (fallback)
     */
    drawGenericNPC(ctx, x, y, frame) {
        const animFrame = this.animationFrames.get('walk')[frame] || { offsetX: 0, offsetY: 0 };
        const finalX = x + animFrame.offsetX;
        const finalY = y + animFrame.offsetY;
        
        // Corpo simples
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(finalX - 8, finalY - 5, 16, 20);
        
        // Cabeça
        ctx.fillStyle = '#FDBCB4';
        ctx.beginPath();
        ctx.arc(finalX, finalY - 10, 6, 0, Math.PI * 2);
        ctx.fill();
        
        // Olhos
        ctx.fillStyle = '#000';
        ctx.fillRect(finalX - 3, finalY - 11, 2, 2);
        ctx.fillRect(finalX + 1, finalY - 11, 2, 2);
        
        // Braços
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(finalX - 12, finalY - 3, 4, 12);
        ctx.fillRect(finalX + 8, finalY - 3, 4, 12);
        
        // Pernas
        ctx.fillRect(finalX - 6, finalY + 15, 4, 8);
        ctx.fillRect(finalX + 2, finalY + 15, 4, 8);
    }
}

// Exportar para uso global
window.EnhancedSpriteSystem = EnhancedSpriteSystem;
