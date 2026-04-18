/**
 * Spritesheet Manager - Sistema de Sprites Básicos
 * Gerencia sprites para player, mobs, NPCs e elementos do mapa
 */

class SpritesheetManager {
    constructor() {
        this.sprites = new Map();
        this.images = new Map();
        this.loaded = false;
        this.loadCount = 0;
        this.totalSprites = 0;
        
        // Definir sprites necessários
        this.requiredSprites = {
            // Player sprites por classe
            player: {
                warrior: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
                mage: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
                hunter: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
                rogue: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
                priest: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
                druid: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
            },
            // Mob sprites
            mobs: {
                goblin: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
                wolf: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
                orc: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
                slime: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
                skeleton: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
            },
            // NPC sprites
            npcs: {
                merchant: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
                guard: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
                villager: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
                quest_giver: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
            },
            // Tile sprites para mapa
            tiles: {
                grass: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
                stone: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
                water: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
                sand: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
                tree: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
                mountain: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
            },
            // Item sprites
            items: {
                sword: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
                shield: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
                potion: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
                coin: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
            }
        };
        
        this.createBasicSprites();
    }
    
    createBasicSprites() {
        console.log('🎨 Criando sprites básicos...');
        
        // Criar sprites programaticamente
        Object.keys(this.requiredSprites).forEach(category => {
            Object.keys(this.requiredSprites[category]).forEach(key => {
                this.createSprite(category, key);
            });
        });
        
        console.log('✅ Sprites básicos criados');
    }
    
    createSprite(category, key) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Tamanho padrão dos sprites
        canvas.width = 32;
        canvas.height = 32;
        
        // Criar sprites baseados na categoria
        switch(category) {
            case 'player':
                this.createPlayerSprite(ctx, key);
                break;
            case 'mobs':
                this.createMobSprite(ctx, key);
                break;
            case 'npcs':
                this.createNPCSprite(ctx, key);
                break;
            case 'tiles':
                this.createTileSprite(ctx, key);
                break;
            case 'items':
                this.createItemSprite(ctx, key);
                break;
        }
        
        // Salvar sprite
        const spriteKey = `${category}_${key}`;
        this.sprites.set(spriteKey, canvas);
        
        return canvas;
    }
    
    createPlayerSprite(ctx, playerClass) {
        // Limpar canvas
        ctx.clearRect(0, 0, 32, 32);
        
        // Cores por classe
        const classColors = {
            warrior: '#8B4513',    // Marrom
            mage: '#4B0082',       // Roxo
            hunter: '#228B22',      // Verde
            rogue: '#2F4F4F',       // Cinza escuro
            priest: '#FFD700',      // Dourado
            druid: '#008080'       // Verde-água
        };
        
        const color = classColors[playerClass] || '#FF0000';
        
        // Desenhar corpo do player
        ctx.fillStyle = color;
        ctx.fillRect(12, 8, 8, 16);  // Corpo
        ctx.fillRect(10, 6, 12, 6);   // Cabeça
        
        // Desenhar pernas
        ctx.fillRect(13, 22, 2, 8);   // Perna esquerda
        ctx.fillRect(17, 22, 2, 8);   // Perna direita
        
        // Desenhar braços
        ctx.fillRect(8, 10, 3, 8);    // Braço esquerdo
        ctx.fillRect(21, 10, 3, 8);   // Braço direito
        
        // Detalhes por classe
        if (playerClass === 'warrior') {
            // Elmo
            ctx.fillStyle = '#C0C0C0';
            ctx.fillRect(9, 4, 14, 4);
            // Espada
            ctx.fillStyle = '#C0C0C0';
            ctx.fillRect(24, 12, 2, 8);
        } else if (playerClass === 'mage') {
            // Chapéu
            ctx.fillStyle = '#4B0082';
            ctx.beginPath();
            ctx.moveTo(16, 2);
            ctx.lineTo(8, 8);
            ctx.lineTo(24, 8);
            ctx.closePath();
            ctx.fill();
            // Cajado
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(24, 8, 2, 12);
        } else if (playerClass === 'hunter') {
            // Arco
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(24, 10, 1, 10);
            ctx.fillRect(22, 15, 5, 1);
        } else if (playerClass === 'priest') {
            // Auréola
            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(16, 6, 8, 0, Math.PI * 2);
            ctx.stroke();
        }
    }
    
    createMobSprite(ctx, mobType) {
        ctx.clearRect(0, 0, 32, 32);
        
        // Cores por tipo de mob
        const mobColors = {
            goblin: '#228B22',    // Verde
            wolf: '#696969',      // Cinza
            orc: '#8B4513',      // Marrom
            slime: '#90EE90',      // Verde claro
            skeleton: '#F5F5F5'    // Branco
        };
        
        const color = mobColors[mobType] || '#FF0000';
        
        switch(mobType) {
            case 'goblin':
                // Corpo pequeno e verde
                ctx.fillStyle = color;
                ctx.fillRect(12, 12, 8, 12);  // Corpo
                ctx.fillRect(13, 8, 6, 6);    // Cabeça
                ctx.fillRect(11, 22, 2, 6);   // Perna esquerda
                ctx.fillRect(19, 22, 2, 6);   // Perna direita
                // Orelhas pontudas
                ctx.fillRect(11, 6, 2, 3);
                ctx.fillRect(19, 6, 2, 3);
                break;
                
            case 'wolf':
                // Corpo de lobo
                ctx.fillStyle = color;
                ctx.fillRect(8, 14, 16, 10);  // Corpo
                ctx.fillRect(12, 8, 8, 8);    // Cabeça
                // Pernas
                ctx.fillRect(10, 22, 2, 6);
                ctx.fillRect(20, 22, 2, 6);
                // Cauda
                ctx.fillRect(6, 16, 4, 8);
                break;
                
            case 'orc':
                // Corpo grande e forte
                ctx.fillStyle = color;
                ctx.fillRect(10, 10, 12, 16);  // Corpo
                ctx.fillRect(12, 6, 8, 6);     // Cabeça
                ctx.fillRect(9, 24, 3, 6);     // Perna esquerda
                ctx.fillRect(20, 24, 3, 6);    // Perna direita
                // Braços fortes
                ctx.fillRect(6, 12, 4, 8);
                ctx.fillRect(22, 12, 4, 8);
                break;
                
            case 'slime':
                // Forma de slime
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.ellipse(16, 18, 10, 8, 0, 0, Math.PI * 2);
                ctx.fill();
                // Olhos
                ctx.fillStyle = '#000';
                ctx.fillRect(12, 16, 2, 2);
                ctx.fillRect(18, 16, 2, 2);
                break;
                
            case 'skeleton':
                // Esqueleto
                ctx.fillStyle = color;
                ctx.fillRect(12, 10, 8, 14);  // Corpo
                ctx.fillRect(13, 6, 6, 6);    // Cabeça
                ctx.strokeStyle = color;
                ctx.lineWidth = 2;
                // Pernas
                ctx.beginPath();
                ctx.moveTo(13, 24);
                ctx.lineTo(13, 30);
                ctx.moveTo(19, 24);
                ctx.lineTo(19, 30);
                ctx.stroke();
                // Braços
                ctx.beginPath();
                ctx.moveTo(12, 12);
                ctx.lineTo(8, 20);
                ctx.moveTo(20, 12);
                ctx.lineTo(24, 20);
                ctx.stroke();
                break;
        }
    }
    
    createNPCSprite(ctx, npcType) {
        ctx.clearRect(0, 0, 32, 32);
        
        const npcColors = {
            merchant: '#4169E1',    // Azul
            guard: '#696969',       // Cinza
            villager: '#8B4513',     // Marrom
            quest_giver: '#FFD700'    // Dourado
        };
        
        const color = npcColors[npcType] || '#FF0000';
        
        switch(npcType) {
            case 'merchant':
                // Roupa de mercador
                ctx.fillStyle = color;
                ctx.fillRect(11, 8, 10, 16);  // Corpo
                ctx.fillRect(12, 4, 8, 6);    // Cabeça
                ctx.fillRect(10, 22, 2, 6);    // Perna esquerda
                ctx.fillRect(20, 22, 2, 6);    // Perna direita
                // Chapéu
                ctx.fillStyle = '#FFD700';
                ctx.fillRect(10, 2, 12, 3);
                break;
                
            case 'guard':
                // Armadura de guarda
                ctx.fillStyle = color;
                ctx.fillRect(10, 8, 12, 16);  // Corpo
                ctx.fillRect(11, 4, 10, 6);    // Cabeça
                ctx.fillRect(9, 22, 3, 6);     // Perna esquerda
                ctx.fillRect(20, 22, 3, 6);    // Perna direita
                // Elmo
                ctx.fillStyle = '#C0C0C0';
                ctx.fillRect(9, 2, 14, 4);
                break;
                
            case 'villager':
                // Roupa simples
                ctx.fillStyle = color;
                ctx.fillRect(12, 8, 8, 16);   // Corpo
                ctx.fillRect(13, 4, 6, 6);    // Cabeça
                ctx.fillRect(11, 22, 2, 6);    // Perna esquerda
                ctx.fillRect(19, 22, 2, 6);    // Perna direita
                break;
                
            case 'quest_giver':
                // Roupa especial
                ctx.fillStyle = color;
                ctx.fillRect(11, 8, 10, 16);  // Corpo
                ctx.fillRect(12, 4, 8, 6);    // Cabeça
                ctx.fillRect(10, 22, 2, 6);    // Perna esquerda
                ctx.fillRect(20, 22, 2, 6);    // Perna direita
                // Símbolo de exclamação
                ctx.fillStyle = '#FF0000';
                ctx.fillRect(15, 0, 2, 2);
                break;
        }
    }
    
    createTileSprite(ctx, tileType) {
        ctx.clearRect(0, 0, 32, 32);
        
        const tileColors = {
            grass: '#228B22',      // Verde
            stone: '#696969',      // Cinza
            water: '#4682B4',      // Azul
            sand: '#F4A460',       // Areia
            tree: '#8B4513',       // Marrom
            mountain: '#696969'      // Cinza escuro
        };
        
        const color = tileColors[tileType] || '#FF0000';
        
        switch(tileType) {
            case 'grass':
                ctx.fillStyle = color;
                ctx.fillRect(0, 0, 32, 32);
                // Textura de grama
                ctx.fillStyle = '#32CD32';
                for(let i = 0; i < 20; i++) {
                    const x = Math.random() * 32;
                    const y = Math.random() * 32;
                    ctx.fillRect(x, y, 1, 1);
                }
                break;
                
            case 'stone':
                ctx.fillStyle = color;
                ctx.fillRect(0, 0, 32, 32);
                // Textura de pedra
                ctx.fillStyle = '#808080';
                for(let i = 0; i < 10; i++) {
                    const x = Math.random() * 32;
                    const y = Math.random() * 32;
                    ctx.fillRect(x, y, 2, 2);
                }
                break;
                
            case 'water':
                ctx.fillStyle = color;
                ctx.fillRect(0, 0, 32, 32);
                // Ondas
                ctx.strokeStyle = '#87CEEB';
                ctx.lineWidth = 1;
                for(let i = 0; i < 3; i++) {
                    ctx.beginPath();
                    ctx.moveTo(0, 8 + i * 8);
                    ctx.lineTo(32, 8 + i * 8);
                    ctx.stroke();
                }
                break;
                
            case 'sand':
                ctx.fillStyle = color;
                ctx.fillRect(0, 0, 32, 32);
                // Textura de areia
                ctx.fillStyle = '#DEB887';
                for(let i = 0; i < 30; i++) {
                    const x = Math.random() * 32;
                    const y = Math.random() * 32;
                    ctx.fillRect(x, y, 1, 1);
                }
                break;
                
            case 'tree':
                // Tronco
                ctx.fillStyle = '#8B4513';
                ctx.fillRect(12, 16, 8, 16);
                // Folhas
                ctx.fillStyle = '#228B22';
                ctx.beginPath();
                ctx.arc(16, 16, 12, 0, Math.PI * 2);
                ctx.fill();
                break;
                
            case 'mountain':
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.moveTo(0, 32);
                ctx.lineTo(16, 8);
                ctx.lineTo(32, 32);
                ctx.closePath();
                ctx.fill();
                // Neve no topo
                ctx.fillStyle = '#FFFFFF';
                ctx.beginPath();
                ctx.moveTo(10, 12);
                ctx.lineTo(16, 8);
                ctx.lineTo(22, 12);
                ctx.closePath();
                ctx.fill();
                break;
        }
    }
    
    createItemSprite(ctx, itemType) {
        ctx.clearRect(0, 0, 32, 32);
        
        const itemColors = {
            sword: '#C0C0C0',      // Prata
            shield: '#8B4513',     // Marrom
            potion: '#FF0000',      // Vermelho
            coin: '#FFD700'         // Dourado
        };
        
        const color = itemColors[itemType] || '#FF0000';
        
        switch(itemType) {
            case 'sword':
                // Lâmina
                ctx.fillStyle = color;
                ctx.fillRect(14, 4, 4, 20);
                // Guarda
                ctx.fillStyle = '#8B4513';
                ctx.fillRect(12, 8, 8, 4);
                // Cabo
                ctx.fillStyle = '#654321';
                ctx.fillRect(15, 20, 2, 8);
                break;
                
            case 'shield':
                // Escudo redondo
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.arc(16, 16, 10, 0, Math.PI * 2);
                ctx.fill();
                // Detalhe
                ctx.strokeStyle = '#C0C0C0';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(16, 16, 8, 0, Math.PI * 2);
                ctx.stroke();
                break;
                
            case 'potion':
                // Frasco
                ctx.fillStyle = color;
                ctx.fillRect(12, 12, 8, 12);
                // Líquido
                ctx.fillStyle = '#FF69B4';
                ctx.fillRect(13, 14, 6, 8);
                // Tampa
                ctx.fillStyle = '#C0C0C0';
                ctx.fillRect(12, 10, 8, 3);
                break;
                
            case 'coin':
                // Moeda redonda
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.arc(16, 16, 8, 0, Math.PI * 2);
                ctx.fill();
                // Símbolo $
                ctx.fillStyle = '#B8860B';
                ctx.font = 'bold 8px Arial';
                ctx.fillText('$', 13, 19);
                break;
        }
    }
    
    getSprite(category, key) {
        const spriteKey = `${category}_${key}`;
        return this.sprites.get(spriteKey);
    }
    
    drawSprite(ctx, category, key, x, y, width = 32, height = 32) {
        const sprite = this.getSprite(category, key);
        if (sprite) {
            ctx.drawImage(sprite, x, y, width, height);
        }
    }
    
    isLoaded() {
        return this.loaded;
    }
}

// Exportar para uso global
window.SpritesheetManager = SpritesheetManager;
