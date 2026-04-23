/**
 * ProfessionUI - Interface de Profissões (New World Style)
 * 
 * Features:
 * - Lista de 15 profissões com ícones
 * - Barras de progresso (nível 1-200)
 * - XP Rested para profissões
 * - Painel de Gathering (coleta)
 * - Painel de Crafting
 * - Visualização de recipes
 */

class ProfessionUI {
    constructor(game) {
        this.game = game;
        this.socket = game.socket;
        this.isVisible = false;
        this.selectedProfession = null;
        this.professionData = {};
        this.restedData = {};
        
        // Definições das profissões
        this.PROFESSIONS = {
            // Gathering
            mining: { id: 'mining', name: 'Mineração', icon: '⛏️', type: 'gathering', color: '#8B4513' },
            logging: { id: 'logging', name: 'Corte de Madeira', icon: '🪓', type: 'gathering', color: '#228B22' },
            harvesting: { id: 'harvesting', name: 'Coleta', icon: '🌿', type: 'gathering', color: '#32CD32' },
            fishing: { id: 'fishing', name: 'Pesca', icon: '🎣', type: 'gathering', color: '#1E90FF' },
            tracking: { id: 'tracking', name: 'Rastreamento', icon: '👣', type: 'gathering', color: '#D2691E' },
            // Refining
            smelting: { id: 'smelting', name: 'Fundição', icon: '🔥', type: 'refining', color: '#FF4500' },
            weaving: { id: 'weaving', name: 'Tecelagem', icon: '🧵', type: 'refining', color: '#FF69B4' },
            carpentry: { id: 'carpentry', name: 'Carpintaria', icon: '🪚', type: 'refining', color: '#DEB887' },
            tanning: { id: 'tanning', name: 'Curtição', icon: '🛡️', type: 'refining', color: '#8B4513' },
            stonecutting: { id: 'stonecutting', name: 'Lapidaria', icon: '💎', type: 'refining', color: '#00CED1' },
            // Crafting
            weaponsmithing: { id: 'weaponsmithing', name: 'Armaria', icon: '⚔️', type: 'crafting', color: '#DC143C' },
            armoring: { id: 'armoring', name: 'Armaduraria', icon: '🛡️', type: 'crafting', color: '#4682B4' },
            engineering: { id: 'engineering', name: 'Engenharia', icon: '⚙️', type: 'crafting', color: '#696969' },
            alchemy: { id: 'alchemy', name: 'Alquimia', icon: '⚗️', type: 'crafting', color: '#9370DB' },
            cooking: { id: 'cooking', name: 'Culinária', icon: '🍳', type: 'crafting', color: '#FF8C00' }
        };
        
        this.TIER_COLORS = {
            1: '#9CA3AF', // Cinza
            2: '#10B981', // Verde
            3: '#3B82F6', // Azul
            4: '#8B5CF6', // Roxo
            5: '#F59E0B'  // Laranja/Dourado
        };
        
        this.TIER_NAMES = {
            1: 'Iniciante',
            2: 'Aprendiz',
            3: 'Especialista',
            4: 'Mestre',
            5: 'Grão-Mestre'
        };
        
        this.init();
    }
    
    init() {
        this.createUI();
        this.registerSocketEvents();
        this.registerKeyboardShortcuts();
    }
    
    createUI() {
        // Container principal
        this.container = document.createElement('div');
        this.container.id = 'profession-ui';
        this.container.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 900px;
            height: 600px;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            border: 2px solid #e94560;
            border-radius: 12px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8);
            display: none;
            flex-direction: column;
            z-index: 10000;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            color: #fff;
            overflow: hidden;
        `;
        
        // Header
        const header = document.createElement('div');
        header.style.cssText = `
            background: linear-gradient(90deg, #e94560, #ff6b6b);
            padding: 15px 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        `;
        
        const title = document.createElement('h2');
        title.textContent = '⚒️ Profissões';
        title.style.cssText = `
            margin: 0;
            font-size: 20px;
            font-weight: 600;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        `;
        
        const closeBtn = document.createElement('button');
        closeBtn.textContent = '✕';
        closeBtn.style.cssText = `
            background: rgba(255, 255, 255, 0.2);
            border: none;
            color: white;
            width: 32px;
            height: 32px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 16px;
            transition: all 0.2s;
        `;
        closeBtn.onmouseover = () => closeBtn.style.background = 'rgba(255, 255, 255, 0.3)';
        closeBtn.onmouseout = () => closeBtn.style.background = 'rgba(255, 255, 255, 0.2)';
        closeBtn.onclick = () => this.hide();
        
        header.appendChild(title);
        header.appendChild(closeBtn);
        this.container.appendChild(header);
        
        // Content area
        const content = document.createElement('div');
        content.style.cssText = `
            display: flex;
            flex: 1;
            overflow: hidden;
        `;
        
        // Sidebar com lista de profissões
        this.sidebar = document.createElement('div');
        this.sidebar.style.cssText = `
            width: 300px;
            background: rgba(0, 0, 0, 0.3);
            border-right: 1px solid rgba(255, 255, 255, 0.1);
            overflow-y: auto;
            padding: 10px;
        `;
        
        this.createProfessionList();
        content.appendChild(this.sidebar);
        
        // Main panel
        this.mainPanel = document.createElement('div');
        this.mainPanel.style.cssText = `
            flex: 1;
            padding: 20px;
            overflow-y: auto;
            background: rgba(0, 0, 0, 0.2);
        `;
        
        this.createMainPanel();
        content.appendChild(this.mainPanel);
        
        this.container.appendChild(content);
        
        // Footer com XP Rested
        const footer = document.createElement('div');
        footer.style.cssText = `
            background: rgba(0, 0, 0, 0.4);
            padding: 12px 20px;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 13px;
        `;
        
        this.restedInfo = document.createElement('div');
        this.restedInfo.innerHTML = '💤 XP Rested: Carregando...';
        this.restedInfo.style.cssText = `
            color: #60a5fa;
            font-weight: 500;
        `;
        
        footer.appendChild(this.restedInfo);
        this.container.appendChild(footer);
        
        document.body.appendChild(this.container);
    }
    
    createProfessionList() {
        const categories = {
            gathering: { title: '⛏️ Coleta', professions: [] },
            refining: { title: '🔨 Refinamento', professions: [] },
            crafting: { title: '⚒️ Fabricação', professions: [] }
        };
        
        // Organizar profissões por categoria
        for (const [id, prof] of Object.entries(this.PROFESSIONS)) {
            categories[prof.type].professions.push(prof);
        }
        
        for (const [type, category] of Object.entries(categories)) {
            const catHeader = document.createElement('div');
            catHeader.textContent = category.title;
            catHeader.style.cssText = `
                padding: 12px 10px 8px;
                font-size: 12px;
                font-weight: 600;
                text-transform: uppercase;
                color: rgba(255, 255, 255, 0.6);
                letter-spacing: 0.5px;
            `;
            this.sidebar.appendChild(catHeader);
            
            for (const prof of category.professions) {
                const item = this.createProfessionItem(prof);
                this.sidebar.appendChild(item);
            }
        }
    }
    
    createProfessionItem(prof) {
        const item = document.createElement('div');
        item.className = 'profession-item';
        item.dataset.profession = prof.id;
        item.style.cssText = `
            display: flex;
            align-items: center;
            padding: 12px;
            margin: 4px 0;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.2s;
            border: 1px solid transparent;
        `;
        
        item.onmouseover = () => {
            item.style.background = 'rgba(255, 255, 255, 0.1)';
            item.style.borderColor = prof.color;
        };
        
        item.onmouseout = () => {
            if (this.selectedProfession !== prof.id) {
                item.style.background = 'rgba(255, 255, 255, 0.05)';
                item.style.borderColor = 'transparent';
            }
        };
        
        item.onclick = () => this.selectProfession(prof.id);
        
        const icon = document.createElement('span');
        icon.textContent = prof.icon;
        icon.style.cssText = `
            font-size: 24px;
            margin-right: 12px;
        `;
        
        const info = document.createElement('div');
        info.style.cssText = 'flex: 1;';
        
        const name = document.createElement('div');
        name.textContent = prof.name;
        name.style.cssText = `
            font-weight: 500;
            font-size: 14px;
            margin-bottom: 4px;
        `;
        
        const levelInfo = document.createElement('div');
        levelInfo.id = `prof-level-${prof.id}`;
        levelInfo.style.cssText = `
            font-size: 12px;
            color: rgba(255, 255, 255, 0.7);
        `;
        levelInfo.textContent = 'Nível 1 - Iniciante';
        
        const progressBar = document.createElement('div');
        progressBar.style.cssText = `
            width: 100%;
            height: 4px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 2px;
            margin-top: 6px;
            overflow: hidden;
        `;
        
        const progressFill = document.createElement('div');
        progressFill.id = `prof-progress-${prof.id}`;
        progressFill.style.cssText = `
            width: 0%;
            height: 100%;
            background: ${prof.color};
            border-radius: 2px;
            transition: width 0.3s;
        `;
        
        progressBar.appendChild(progressFill);
        info.appendChild(name);
        info.appendChild(levelInfo);
        info.appendChild(progressBar);
        
        item.appendChild(icon);
        item.appendChild(info);
        
        return item;
    }
    
    createMainPanel() {
        this.mainPanel.innerHTML = `
            <div style="text-align: center; padding: 60px 20px; color: rgba(255,255,255,0.5);">
                <div style="font-size: 48px; margin-bottom: 20px;">⚒️</div>
                <h3 style="margin: 0 0 10px 0;">Selecione uma Profissão</h3>
                <p style="margin: 0; font-size: 14px;">Clique em uma profissão na lista para ver detalhes</p>
            </div>
        `;
    }
    
    selectProfession(profId) {
        this.selectedProfession = profId;
        
        // Update visual selection
        document.querySelectorAll('.profession-item').forEach(item => {
            if (item.dataset.profession === profId) {
                item.style.background = 'rgba(255, 255, 255, 0.15)';
                item.style.borderColor = this.PROFESSIONS[profId].color;
            } else {
                item.style.background = 'rgba(255, 255, 255, 0.05)';
                item.style.borderColor = 'transparent';
            }
        });
        
        this.updateMainPanel(profId);
    }
    
    updateMainPanel(profId) {
        const prof = this.PROFESSIONS[profId];
        const data = this.professionData[profId] || { level: 1, xp: 0, maxXp: 100, restedXp: 0 };
        const tier = this.getTierFromLevel(data.level);
        const tierColor = this.TIER_COLORS[tier];
        const tierName = this.TIER_NAMES[tier];
        
        this.mainPanel.innerHTML = '';
        this.mainPanel.style.cssText = `
            flex: 1;
            padding: 20px;
            overflow-y: auto;
            background: rgba(0, 0, 0, 0.2);
        `;
        
        // Header da profissão
        const header = document.createElement('div');
        header.style.cssText = `
            display: flex;
            align-items: center;
            margin-bottom: 24px;
            padding-bottom: 20px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        `;
        
        const profIcon = document.createElement('div');
        profIcon.textContent = prof.icon;
        profIcon.style.cssText = `
            font-size: 48px;
            margin-right: 20px;
            filter: drop-shadow(0 0 10px ${prof.color});
        `;
        
        const profInfo = document.createElement('div');
        profInfo.innerHTML = `
            <h2 style="margin: 0 0 8px 0; color: ${prof.color};">${prof.name}</h2>
            <div style="display: flex; gap: 12px; align-items: center;">
                <span style="
                    background: ${tierColor};
                    color: white;
                    padding: 4px 12px;
                    border-radius: 12px;
                    font-size: 12px;
                    font-weight: 600;
                ">${tierName}</span>
                <span style="color: rgba(255,255,255,0.6); font-size: 14px;">
                    Nível ${data.level}/200
                </span>
            </div>
        `;
        
        header.appendChild(profIcon);
        header.appendChild(profInfo);
        this.mainPanel.appendChild(header);
        
        // Progresso principal
        const progressSection = document.createElement('div');
        progressSection.style.cssText = `
            background: rgba(0, 0, 0, 0.3);
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 20px;
        `;
        
        const xpPercent = (data.xp / data.maxXp * 100).toFixed(1);
        
        progressSection.innerHTML = `
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <span style="font-weight: 500;">Experiência</span>
                <span style="color: rgba(255,255,255,0.7); font-size: 14px;">
                    ${data.xp} / ${data.maxXp} XP (${xpPercent}%)
                </span>
            </div>
            <div style="
                width: 100%;
                height: 12px;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 6px;
                overflow: hidden;
            ">
                <div style="
                    width: ${xpPercent}%;
                    height: 100%;
                    background: linear-gradient(90deg, ${prof.color}, ${this.lightenColor(prof.color, 20)});
                    border-radius: 6px;
                    transition: width 0.5s;
                "></div>
            </div>
            ${data.restedXp > 0 ? `
                <div style="margin-top: 12px; padding: 10px; background: rgba(96, 165, 250, 0.2); border-radius: 8px; border-left: 3px solid #60a5fa;">
                    <span style="color: #60a5fa; font-size: 13px;">
                        💤 XP Rested: ${data.restedXp} (2x XP bônus ativo!)
                    </span>
                </div>
            ` : ''}
        `;
        
        this.mainPanel.appendChild(progressSection);
        
        // Descrição
        const descSection = document.createElement('div');
        descSection.style.cssText = `
            background: rgba(0, 0, 0, 0.3);
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 20px;
        `;
        
        descSection.innerHTML = `
            <h4 style="margin: 0 0 12px 0; color: ${prof.color};">Sobre</h4>
            <p style="margin: 0; color: rgba(255,255,255,0.8); line-height: 1.6; font-size: 14px;">
                ${this.getProfessionDescription(profId)}
            </p>
        `;
        
        this.mainPanel.appendChild(descSection);
        
        // Ações baseadas no tipo
        const actionsSection = document.createElement('div');
        actionsSection.style.cssText = `
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 12px;
        `;
        
        if (prof.type === 'gathering') {
            actionsSection.appendChild(this.createActionCard('⛏️ Coletar Recursos', 'Encontre nodes no mundo para coletar', () => this.openGatheringUI(profId)));
            actionsSection.appendChild(this.createActionCard('📊 Seus Recursos', 'Ver materiais coletados', () => this.showInventory()));
        } else if (prof.type === 'refining') {
            actionsSection.appendChild(this.createActionCard('🔨 Refinar Materiais', 'Converter materiais brutos em refinados', () => this.openRefiningUI(profId)));
            actionsSection.appendChild(this.createActionCard('📋 Recipes', 'Ver recipes de refinamento disponíveis', () => this.showRecipes(profId)));
        } else if (prof.type === 'crafting') {
            actionsSection.appendChild(this.createActionCard('⚒️ Craftar Item', 'Criar novos itens', () => this.openCraftingUI(profId)));
            actionsSection.appendChild(this.createActionCard('📋 Recipes', 'Ver recipes de crafting disponíveis', () => this.showRecipes(profId)));
        }
        
        this.mainPanel.appendChild(actionsSection);
    }
    
    createActionCard(title, description, onClick) {
        const card = document.createElement('div');
        card.style.cssText = `
            background: rgba(233, 69, 96, 0.1);
            border: 1px solid rgba(233, 69, 96, 0.3);
            border-radius: 10px;
            padding: 16px;
            cursor: pointer;
            transition: all 0.2s;
        `;
        
        card.onmouseover = () => {
            card.style.background = 'rgba(233, 69, 96, 0.2)';
            card.style.borderColor = 'rgba(233, 69, 96, 0.5)';
            card.style.transform = 'translateY(-2px)';
        };
        
        card.onmouseout = () => {
            card.style.background = 'rgba(233, 69, 96, 0.1)';
            card.style.borderColor = 'rgba(233, 69, 96, 0.3)';
            card.style.transform = 'translateY(0)';
        };
        
        card.onclick = onClick;
        
        card.innerHTML = `
            <h4 style="margin: 0 0 8px 0; color: #e94560;">${title}</h4>
            <p style="margin: 0; font-size: 13px; color: rgba(255,255,255,0.7);">${description}</p>
        `;
        
        return card;
    }
    
    getProfessionDescription(profId) {
        const descriptions = {
            mining: 'Mineração permite extrair minérios de veins de pedra espalhados pelo mundo. Use uma picareta para coletar ferro, prata, ouro e materiais raros.',
            logging: 'Corte de Madeira permite derrubar árvores para obter madeira. Use um machado para coletar madeira de diferentes qualidades.',
            harvesting: 'Coleta permite extrair plantas e vegetais do mundo. Use uma foice para coletar fibras, ervas e materiais alquímicos.',
            fishing: 'Pesca permite pegar peixes em rios, lagos e oceanos. Use uma vara de pesca para coletar diferentes tipos de peixes.',
            tracking: 'Rastreamento permite caçar animais e coletar couros. Use uma faca de caça para obter couros de diferentes qualidades.',
            smelting: 'Fundição permite refinar minérios em barras de metal. Use uma fornalha para criar lingotes de ferro, prata, ouro e platina.',
            weaving: 'Tecelagem permite refinar fibras em tecidos. Use um tear para criar linho, cetim e outros tecidos.',
            carpentry: 'Carpintaria permite refinar madeira em tábuas. Use uma carpintaria para criar tábuas de diferentes madeiras.',
            tanning: 'Curtição permite refinar couros crus em couros trabalhados. Use uma curtume para preparar couros para armaduras.',
            stonecutting: 'Lapidaria permite cortar pedras preciosas e refinar materiais de pedra. Use uma lapidaria para criar gemas.',
            weaponsmithing: 'Armaria permite criar armas corpo a corpo. Use uma forja para criar espadas, machados, martelos e lanças.',
            armoring: 'Armaduraria permite criar armaduras pesadas, médias e leves. Use uma forja para criar proteção para o corpo.',
            engineering: 'Engenharia permite criar armas de fogo, munição e ferramentas. Use uma oficina para criar mosquetes e engenhocas.',
            alchemy: 'Alquimia permite criar poções, tônicos e encantamentos. Use uma mesa de alquimia para criar itens consumíveis.',
            cooking: 'Culinária permite preparar comidas que dão buffs. Use uma cozinha para criar refeições nutritivas.'
        };
        return descriptions[profId] || '';
    }
    
    getTierFromLevel(level) {
        if (level >= 200) return 5;
        if (level >= 150) return 4;
        if (level >= 100) return 3;
        if (level >= 50) return 2;
        return 1;
    }
    
    lightenColor(color, percent) {
        // Simple color lightening for gradients
        return color;
    }
    
    // ===== SOCKET EVENTS =====
    
    registerSocketEvents() {
        // Receber dados de profissões
        this.socket.on('profession:info', (data) => {
            if (data.success) {
                this.professionData = data.playerProfessions || {};
                this.updateProfessionList();
            }
        });
        
        // Resultado de gather
        this.socket.on('profession:gather_result', (result) => {
            this.showGatherResult(result);
        });
        
        // Resultado de craft
        this.socket.on('profession:craft_result', (result) => {
            this.showCraftResult(result);
        });
        
        // Level up!
        this.socket.on('profession:level_up', (data) => {
            this.showLevelUpNotification(data);
        });
        
        // XP Rested status
        this.socket.on('rested_xp:status', (data) => {
            this.restedData = data;
            this.updateRestedInfo();
        });
        
        // Notificação de login com XP rested
        this.socket.on('rested_xp:login_notification', (data) => {
            this.showRestedLoginNotification(data);
        });
    }
    
    registerKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'p' && !e.ctrlKey && !e.altKey && !e.metaKey) {
                if (document.activeElement.tagName !== 'INPUT' && 
                    document.activeElement.tagName !== 'TEXTAREA') {
                    e.preventDefault();
                    this.toggle();
                }
            }
            if (e.key === 'Escape' && this.isVisible) {
                this.hide();
            }
        });
    }
    
    // ===== UI UPDATES =====
    
    updateProfessionList() {
        for (const [profId, data] of Object.entries(this.professionData)) {
            const levelEl = document.getElementById(`prof-level-${profId}`);
            const progressEl = document.getElementById(`prof-progress-${profId}`);
            
            if (levelEl && progressEl) {
                const tier = this.getTierFromLevel(data.level);
                const tierName = this.TIER_NAMES[tier];
                levelEl.textContent = `Nível ${data.level} - ${tierName}`;
                
                const percent = (data.xp / data.maxXp * 100).toFixed(1);
                progressEl.style.width = `${percent}%`;
            }
        }
        
        // Atualizar painel principal se uma profissão estiver selecionada
        if (this.selectedProfession) {
            this.updateMainPanel(this.selectedProfession);
        }
    }
    
    updateRestedInfo() {
        const combat = this.restedData?.combat;
        if (combat && combat.hasBonus) {
            this.restedInfo.innerHTML = `
                💤 <strong>XP Rested Ativo!</strong> 
                Combat: ${combat.percentage}% | 
                Bônus: 2x XP
            `;
            this.restedInfo.style.color = '#60a5fa';
        } else {
            this.restedInfo.innerHTML = '💤 XP Rested: Descanse em uma town para acumular';
            this.restedInfo.style.color = 'rgba(255,255,255,0.5)';
        }
    }
    
    // ===== NOTIFICATIONS =====
    
    showLevelUpNotification(data) {
        const notif = document.createElement('div');
        notif.style.cssText = `
            position: fixed;
            top: 100px;
            left: 50%;
            transform: translateX(-50%);
            background: linear-gradient(135deg, #f59e0b, #d97706);
            color: white;
            padding: 16px 24px;
            border-radius: 12px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.5);
            z-index: 20000;
            animation: slideDown 0.5s ease;
            font-weight: 600;
            text-align: center;
        `;
        
        notif.innerHTML = `
            <div style="font-size: 32px; margin-bottom: 8px;">${data.icon || '⭐'}</div>
            <div>${data.professionName} - Nível ${data.newLevel}!</div>
            <div style="font-size: 12px; opacity: 0.9; margin-top: 4px;">
                ${this.TIER_NAMES[data.tier] || 'Novo Tier'}
            </div>
        `;
        
        document.body.appendChild(notif);
        
        setTimeout(() => {
            notif.style.animation = 'slideUp 0.5s ease';
            setTimeout(() => notif.remove(), 500);
        }, 4000);
    }
    
    showRestedLoginNotification(data) {
        const notif = document.createElement('div');
        notif.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: linear-gradient(135deg, #3b82f6, #1d4ed8);
            color: white;
            padding: 16px 20px;
            border-radius: 12px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.5);
            z-index: 20000;
            max-width: 300px;
            animation: slideIn 0.5s ease;
        `;
        
        notif.innerHTML = `
            <div style="font-weight: 600; margin-bottom: 8px;">💤 Bem Descansado!</div>
            <div style="font-size: 13px; opacity: 0.9; line-height: 1.5;">
                Você descansou por ${data.hoursOffline}h.<br>
                XP Rested acumulado: ${data.combatXp || 0}
            </div>
        `;
        
        document.body.appendChild(notif);
        
        setTimeout(() => {
            notif.style.animation = 'slideOut 0.5s ease';
            setTimeout(() => notif.remove(), 500);
        }, 6000);
    }
    
    showGatherResult(result) {
        if (result.success) {
            this.game?.showFloatingText?.(`+${result.quantity} ${result.resource}`, 0, -50, '#4ade80');
            if (result.levelUp) {
                this.showLevelUpNotification({
                    professionName: this.PROFESSIONS[result.profession]?.name,
                    newLevel: result.newLevel,
                    icon: this.PROFESSIONS[result.profession]?.icon,
                    tier: this.getTierFromLevel(result.newLevel)
                });
            }
        } else {
            this.game?.showFloatingText?.(result.error || 'Falha na coleta', 0, -50, '#ef4444');
        }
    }
    
    showCraftResult(result) {
        if (result.success) {
            this.game?.showFloatingText?.(`Craftado: ${result.name}`, 0, -50, '#f59e0b');
        } else {
            this.game?.showFloatingText?.(result.error || 'Crafting falhou', 0, -50, '#ef4444');
        }
    }
    
    // ===== ACTIONS =====
    
    openGatheringUI(profId) {
        // Enviar pedido de gather para o servidor
        // O jogador precisa estar próximo de um node
        this.socket.emit('profession:gather', {
            professionId: profId,
            // position será obtida do jogador no servidor
        });
    }
    
    openCraftingUI(profId) {
        // Mostrar UI de crafting (implementar futuramente)
        this.game?.showFloatingText?.('Interface de Crafting em desenvolvimento', 0, -50, '#f59e0b');
    }
    
    openRefiningUI(profId) {
        this.socket.emit('profession:get_refine_recipes', { professionId: profId });
    }
    
    showRecipes(profId) {
        // Mostrar recipes disponíveis
        this.game?.showFloatingText?.('Recipes em desenvolvimento', 0, -50, '#f59e0b');
    }
    
    showInventory() {
        // Mostrar inventário de recursos
        this.game?.showFloatingText?.('Inventário de Recursos em desenvolvimento', 0, -50, '#f59e0b');
    }
    
    // ===== SHOW/HIDE =====
    
    show() {
        this.isVisible = true;
        this.container.style.display = 'flex';
        
        // Pedir dados atualizados
        this.socket.emit('profession:get_info');
        this.socket.emit('rested_xp:get_status');
        
        if (this.game?.pause) {
            this.game.pause();
        }
    }
    
    hide() {
        this.isVisible = false;
        this.container.style.display = 'none';
        
        if (this.game?.resume) {
            this.game.resume();
        }
    }
    
    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }
}

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.ProfessionUI = ProfessionUI;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProfessionUI;
}
