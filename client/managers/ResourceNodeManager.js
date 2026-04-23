/**
 * ResourceNodeManager - Gerenciador de Nodes de Recursos no Mapa
 * 
 * Features:
 * - Renderização de nodes de recursos no canvas
 * - Diferentes tipos: mineração, corte, coleta, pesca, rastreamento
 * - Tier system (T1-T5) com cores diferentes
 * - Interação ao clicar próximo
 * - Respawn timer visual
 * - Tooltips informativos
 */

class ResourceNodeManager {
    constructor(game, canvas, ctx) {
        this.game = game;
        this.canvas = canvas;
        this.ctx = ctx;
        this.socket = game?.socket;
        
        // Lista de nodes ativos
        this.nodes = new Map();
        
        // Configurações de renderização
        this.NODE_SIZE = 24;
        this.INTERACTION_RANGE = 60; // pixels
        
        // Definições de nodes
        this.NODE_TYPES = {
            // Mineração
            iron_vein: { 
                id: 'iron_vein', 
                name: 'Veio de Ferro', 
                profession: 'mining', 
                tier: 1, 
                icon: '⛏️',
                color: '#8B7355',
                glow: '#A0522D'
            },
            silver_vein: { 
                id: 'silver_vein', 
                name: 'Veio de Prata', 
                profession: 'mining', 
                tier: 2, 
                icon: '⛏️',
                color: '#C0C0C0',
                glow: '#E8E8E8'
            },
            gold_vein: { 
                id: 'gold_vein', 
                name: 'Veio de Ouro', 
                profession: 'mining', 
                tier: 3, 
                icon: '⛏️',
                color: '#FFD700',
                glow: '#FFA500'
            },
            
            // Corte de madeira
            young_tree: { 
                id: 'young_tree', 
                name: 'Árvore Jovem', 
                profession: 'logging', 
                tier: 1, 
                icon: '🪓',
                color: '#8FBC8F',
                glow: '#228B22'
            },
            mature_tree: { 
                id: 'mature_tree', 
                name: 'Árvore Madura', 
                profession: 'logging', 
                tier: 2, 
                icon: '🪓',
                color: '#556B2F',
                glow: '#6B8E23'
            },
            ironwood_tree: { 
                id: 'ironwood_tree', 
                name: 'Árvore de Ferro', 
                profession: 'logging', 
                tier: 4, 
                icon: '🪓',
                color: '#4A4A4A',
                glow: '#696969'
            },
            
            // Coleta
            fiber_plant: { 
                id: 'fiber_plant', 
                name: 'Planta de Fibra', 
                profession: 'harvesting', 
                tier: 1, 
                icon: '🌿',
                color: '#90EE90',
                glow: '#32CD32'
            },
            herb_bush: { 
                id: 'herb_bush', 
                name: 'Arbusto de Ervas', 
                profession: 'harvesting', 
                tier: 2, 
                icon: '🌿',
                color: '#3CB371',
                glow: '#2E8B57'
            },
            magical_flower: { 
                id: 'magical_flower', 
                name: 'Flor Mágica', 
                profession: 'harvesting', 
                tier: 4, 
                icon: '🌿',
                color: '#9370DB',
                glow: '#BA55D3'
            },
            
            // Pesca
            fishing_spot_fresh: { 
                id: 'fishing_spot_fresh', 
                name: 'Ponto de Pesca (Água Doce)', 
                profession: 'fishing', 
                tier: 1, 
                icon: '🎣',
                color: '#87CEEB',
                glow: '#4682B4'
            },
            fishing_spot_salt: { 
                id: 'fishing_spot_salt', 
                name: 'Ponto de Pesca (Água Salgada)', 
                profession: 'fishing', 
                tier: 3, 
                icon: '🎣',
                color: '#1E90FF',
                glow: '#0000CD'
            },
            
            // Rastreamento (animais)
            rabbit_nest: { 
                id: 'rabbit_nest', 
                name: 'Ninho de Coelhos', 
                profession: 'tracking', 
                tier: 1, 
                icon: '👣',
                color: '#D2B48C',
                glow: '#8B7355'
            },
            deer_trail: { 
                id: 'deer_trail', 
                name: 'Trilha de Cervos', 
                profession: 'tracking', 
                tier: 2, 
                icon: '👣',
                color: '#DEB887',
                glow: '#CD853F'
            },
            wolf_den: { 
                id: 'wolf_den', 
                name: 'Toca de Lobos', 
                profession: 'tracking', 
                tier: 3, 
                icon: '👣',
                color: '#808080',
                glow: '#696969'
            },
            bear_cave: { 
                id: 'bear_cave', 
                name: 'Caverna de Ursos', 
                profession: 'tracking', 
                tier: 4, 
                icon: '👣',
                color: '#8B4513',
                glow: '#A0522D'
            }
        };
        
        // Tier colors
        this.TIER_COLORS = {
            1: '#9CA3AF', // Cinza - Tier 1
            2: '#10B981', // Verde - Tier 2
            3: '#3B82F6', // Azul - Tier 3
            4: '#8B5CF6', // Roxo - Tier 4
            5: '#F59E0B'  // Dourado - Tier 5
        };
        
        this.hoveredNode = null;
        this.playerPosition = { x: 0, y: 0 };
        
        this.init();
    }
    
    init() {
        this.registerSocketEvents();
        this.registerInputHandlers();
        console.log('[ResourceNodeManager] Inicializado');
    }
    
    registerSocketEvents() {
        // Receber nodes do servidor
        if (this.socket) {
            this.socket.on('resource:spawn_nodes', (data) => {
                this.spawnNodes(data.nodes);
            });
            
            this.socket.on('resource:node_collected', (data) => {
                this.removeNode(data.nodeId);
            });
            
            this.socket.on('resource:node_respawn', (data) => {
                this.addNode(data.node);
            });
            
            // Pedir nodes ao entrar em uma zona
            this.socket.on('world:zone_changed', (data) => {
                this.socket.emit('resource:request_nodes', { zone: data.zone });
            });
        }
    }
    
    registerInputHandlers() {
        // Clique no canvas para interagir com nodes
        this.canvas.addEventListener('click', (e) => {
            this.handleClick(e);
        });
        
        // Hover para tooltips
        this.canvas.addEventListener('mousemove', (e) => {
            this.handleMouseMove(e);
        });
    }
    
    spawnNodes(nodesData) {
        this.nodes.clear();
        
        for (const nodeData of nodesData) {
            this.addNode(nodeData);
        }
        
        console.log(`[ResourceNodeManager] ${this.nodes.size} nodes spawnados`);
    }
    
    addNode(nodeData) {
        const nodeType = this.NODE_TYPES[nodeData.type];
        if (!nodeType) return;
        
        const node = {
            id: nodeData.id || `node_${Date.now()}_${Math.random()}`,
            type: nodeData.type,
            x: nodeData.x,
            y: nodeData.y,
            tier: nodeData.tier || nodeType.tier,
            profession: nodeType.profession,
            name: nodeType.name,
            icon: nodeType.icon,
            color: nodeType.color,
            glow: nodeType.glow,
            available: nodeData.available !== false,
            respawnTime: nodeData.respawnTime || null,
            skillRequired: this.getSkillRequired(nodeData.tier || nodeType.tier)
        };
        
        this.nodes.set(node.id, node);
    }
    
    removeNode(nodeId) {
        this.nodes.delete(nodeId);
    }
    
    getSkillRequired(tier) {
        const requirements = {
            1: 0,
            2: 50,
            3: 100,
            4: 150,
            5: 175
        };
        return requirements[tier] || 0;
    }
    
    update(playerX, playerY) {
        this.playerPosition.x = playerX;
        this.playerPosition.y = playerY;
        
        // Atualizar timer de respawn
        const now = Date.now();
        for (const node of this.nodes.values()) {
            if (!node.available && node.respawnTime && now >= node.respawnTime) {
                node.available = true;
            }
        }
    }
    
    render(ctx) {
        for (const node of this.nodes.values()) {
            this.renderNode(ctx, node);
        }
        
        // Renderizar tooltip se houver node em hover
        if (this.hoveredNode) {
            this.renderTooltip(ctx, this.hoveredNode);
        }
    }
    
    renderNode(ctx, node) {
        if (!node.available) {
            // Node coletado - mostrar indicador de respawn
            this.renderRespawnIndicator(ctx, node);
            return;
        }
        
        const size = this.NODE_SIZE;
        const halfSize = size / 2;
        
        // Glow effect
        const gradient = ctx.createRadialGradient(
            node.x, node.y, 0,
            node.x, node.y, size * 1.5
        );
        gradient.addColorStop(0, node.glow + '66'); // 40% opacity
        gradient.addColorStop(0.5, node.glow + '33'); // 20% opacity
        gradient.addColorStop(1, 'transparent');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(node.x, node.y, size * 1.5, 0, Math.PI * 2);
        ctx.fill();
        
        // Tier indicator (border)
        const tierColor = this.TIER_COLORS[node.tier];
        ctx.strokeStyle = tierColor;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(node.x, node.y, halfSize + 4, 0, Math.PI * 2);
        ctx.stroke();
        
        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.beginPath();
        ctx.arc(node.x, node.y, halfSize, 0, Math.PI * 2);
        ctx.fill();
        
        // Icon
        ctx.font = `${size * 0.6}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(node.icon, node.x, node.y);
        
        // Verificar proximidade do jogador
        const distance = this.getDistance(this.playerPosition, node);
        if (distance <= this.INTERACTION_RANGE) {
            // Indicador de interação disponível
            ctx.strokeStyle = '#00ff00';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.arc(node.x, node.y, halfSize + 8, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
            
            // Texto "E para coletar"
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 11px Arial';
            ctx.fillText('[E]', node.x, node.y - halfSize - 15);
        }
    }
    
    renderRespawnIndicator(ctx, node) {
        const size = this.NODE_SIZE;
        const halfSize = size / 2;
        
        // Círculo mais opaco
        ctx.fillStyle = 'rgba(50, 50, 50, 0.5)';
        ctx.beginPath();
        ctx.arc(node.x, node.y, halfSize, 0, Math.PI * 2);
        ctx.fill();
        
        // Timer de respawn
        if (node.respawnTime) {
            const remaining = Math.max(0, node.respawnTime - Date.now());
            const seconds = Math.ceil(remaining / 1000);
            
            ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`${seconds}s`, node.x, node.y);
        }
    }
    
    renderTooltip(ctx, node) {
        const padding = 10;
        const lineHeight = 18;
        const tooltipWidth = 180;
        
        // Calcular altura baseada no conteúdo
        let tooltipHeight = 70;
        
        const x = node.x + 30;
        const y = node.y - 50;
        
        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        ctx.strokeStyle = this.TIER_COLORS[node.tier];
        ctx.lineWidth = 2;
        
        // Sombra
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 3;
        ctx.shadowOffsetY = 3;
        
        ctx.fillRect(x, y, tooltipWidth, tooltipHeight);
        ctx.strokeRect(x, y, tooltipWidth, tooltipHeight);
        
        // Reset shadow
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        
        // Texto
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 13px Arial';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        
        // Nome
        ctx.fillText(node.name, x + padding, y + padding);
        
        // Tier
        ctx.fillStyle = this.TIER_COLORS[node.tier];
        ctx.font = '11px Arial';
        ctx.fillText(`Tier ${node.tier}`, x + padding, y + padding + lineHeight);
        
        // Skill necessária
        ctx.fillStyle = node.skillRequired > 0 ? '#ffaa00' : '#aaa';
        ctx.fillText(`Req: Nível ${node.skillRequired}`, x + padding, y + padding + lineHeight * 2);
        
        // Status
        if (!node.available) {
            ctx.fillStyle = '#ff6666';
            ctx.fillText('⏳ Respawning...', x + padding, y + padding + lineHeight * 3);
        }
    }
    
    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        // Encontrar node sob o mouse
        let found = null;
        for (const node of this.nodes.values()) {
            const distance = this.getDistance({ x: mouseX, y: mouseY }, node);
            if (distance <= this.NODE_SIZE) {
                found = node;
                break;
            }
        }
        
        this.hoveredNode = found;
        
        // Mudar cursor se hover em node interativo
        if (found && found.available) {
            const playerDist = this.getDistance(this.playerPosition, found);
            if (playerDist <= this.INTERACTION_RANGE) {
                this.canvas.style.cursor = 'pointer';
            } else {
                this.canvas.style.cursor = 'default';
            }
        } else {
            this.canvas.style.cursor = 'default';
        }
    }
    
    handleClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;
        
        // Verificar se clicou em um node
        for (const node of this.nodes.values()) {
            if (!node.available) continue;
            
            const distance = this.getDistance({ x: clickX, y: clickY }, node);
            if (distance <= this.NODE_SIZE) {
                const playerDist = this.getDistance(this.playerPosition, node);
                
                if (playerDist <= this.INTERACTION_RANGE) {
                    this.interactWithNode(node);
                } else {
                    // Feedback de muito longe
                    this.game?.showFloatingText?.('Muito longe!', 0, -30, '#ff6666');
                }
                break;
            }
        }
    }
    
    interactWithNode(node) {
        console.log(`[ResourceNodeManager] Interagindo com ${node.name}`);
        
        // Enviar pedido de gather para o servidor
        if (this.socket) {
            this.socket.emit('profession:gather', {
                nodeId: node.id,
                position: { x: node.x, y: node.y }
            });
        }
        
        // Feedback visual
        this.game?.showFloatingText?.(`Coletando ${node.name}...`, 0, -40, '#4ade80');
    }
    
    handleKeyPress(key) {
        if (key === 'e' || key === 'E') {
            // Encontrar node mais próximo
            let closestNode = null;
            let closestDistance = Infinity;
            
            for (const node of this.nodes.values()) {
                if (!node.available) continue;
                
                const distance = this.getDistance(this.playerPosition, node);
                if (distance <= this.INTERACTION_RANGE && distance < closestDistance) {
                    closestDistance = distance;
                    closestNode = node;
                }
            }
            
            if (closestNode) {
                this.interactWithNode(closestNode);
            }
        }
    }
    
    getDistance(pos1, pos2) {
        const dx = pos1.x - pos2.x;
        const dy = pos1.y - pos2.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    // Debug: spawn nodes aleatórios para teste
    spawnDebugNodes(count = 10) {
        const types = Object.keys(this.NODE_TYPES);
        const nodes = [];
        
        for (let i = 0; i < count; i++) {
            const type = types[Math.floor(Math.random() * types.length)];
            const nodeType = this.NODE_TYPES[type];
            
            nodes.push({
                id: `debug_${i}`,
                type: type,
                x: 200 + Math.random() * 600,
                y: 200 + Math.random() * 400,
                tier: nodeType.tier,
                available: true
            });
        }
        
        this.spawnNodes(nodes);
    }
    
    clear() {
        this.nodes.clear();
        this.hoveredNode = null;
    }
}

// Exportar
if (typeof window !== 'undefined') {
    window.ResourceNodeManager = ResourceNodeManager;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = ResourceNodeManager;
}
