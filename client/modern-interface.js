// Funções para a Nova Interface Moderna do MMORPG Browser

// Helper function para pegar elementos por ID
function byId(id) {
    return document.getElementById(id);
}

// Helper function para log de mensagens
function logMessage(message) {
    const logEl = byId('log');
    if (logEl) {
        const time = new Date().toLocaleTimeString('pt-BR', { 
            hour: '2-digit', 
            minute: '2-digit',
            second: '2-digit'
        });
        logEl.innerHTML += `<div>${time} ${message}</div>`;
        logEl.scrollTop = logEl.scrollHeight;
    }
    // Também adiciona ao chat
    addChatMessage(message, 'system');
}

// Função de movimento (compatibilidade com sistema antigo)
function move(direction) {
    logMessage(`Movendo-se para ${direction}`);
    // Aqui podemos adicionar a lógica de movimento real
    updateCoordinates(direction);
}

function updateGameUI(character) {
    const playerNameEl = byId("playerName");
    const playerLevelEl = byId("playerLevel");
    const playerAvatarEl = byId("playerAvatar");
    
    if (playerNameEl) playerNameEl.textContent = character.name || "Herói";
    if (playerLevelEl) playerLevelEl.textContent = character.level || 1;
    if (playerAvatarEl) {
        const avatarMap = {
            'warrior': '⚔️',
            'mage': '🔮',
            'archer': '🏹',
            'rogue': '🗡️'
        };
        playerAvatarEl.textContent = avatarMap[character.class] || '👤';
    }
    
    updateAttributes(character);
    updateStatusBars(character);
}

function updateCoordinates(direction) {
    let x = 0, y = 0;
    
    // Simula movimento simples
    const currentX = parseInt(byId('coordX').textContent) || 0;
    const currentY = parseInt(byId('coordY').textContent) || 0;
    
    switch(direction) {
        case 'north': y = currentY - 1; x = currentX; break;
        case 'south': y = currentY + 1; x = currentX; break;
        case 'east': x = currentX + 1; y = currentY; break;
        case 'west': x = currentX - 1; y = currentY; break;
    }
    
    byId('coordX').textContent = x;
    byId('coordY').textContent = y;
    
    // Atualiza localização baseada nas coordenadas
    updateLocation(x, y);
}

function updateLocation(x, y) {
    const locations = [
        { name: "🏰 Cidade Inicial", x: 0, y: 0 },
        { name: "🌳 Floresta Misteriosa", x: 1, y: 0 },
        { name: "⛰️ Montanhas Geladas", x: 0, y: 1 },
        { name: "🏜️ Deserto Perdido", x: -1, y: 0 },
        { name: "🌊 Praia Azul", x: 0, y: -1 }
    ];
    
    const location = locations.find(loc => loc.x === x && loc.y === y) || locations[0];
    const locationEl = byId('currentLocation');
    if (locationEl) {
        locationEl.textContent = location.name;
    }
}

function updateAttributes(character) {
    const attrs = ['strength', 'defense', 'speed', 'magic'];
    const attrMap = {
        'strength': 'attrStrength',
        'defense': 'attrDefense', 
        'speed': 'attrSpeed',
        'magic': 'attrMagic'
    };
    
    attrs.forEach(attr => {
        const el = byId(attrMap[attr]);
        if (el) {
            el.textContent = character[attr] || Math.floor(Math.random() * 20) + 5;
        }
    });
}

function updateStatusBars(character) {
    updateStatusBar('health', character.health || 100, character.maxHealth || 100);
    updateStatusBar('mana', character.mana || 50, character.maxMana || 50);
    updateStatusBar('exp', character.exp || 0, character.expToNext || 100);
}

function updateStatusBar(type, current, max) {
    const bars = document.querySelectorAll('.bar-fill.' + type);
    const percentage = Math.max(0, Math.min(100, (current / max) * 100));
    
    bars.forEach(bar => {
        if (bar.classList.contains(type)) {
            bar.style.width = percentage + '%';
            // Atualiza texto da barra
            const parentBar = bar.closest('.stat-bar');
            if (parentBar) {
                const textEl = parentBar.querySelector('.bar-text');
                if (textEl) {
                    textEl.textContent = `${current}/${max}`;
                }
            }
        }
    });
}

function initializeModernGameInterface() {
    console.log('Inicializando interface moderna compacta do jogo...');
    
    // Remover botões direcionais antigos
    const oldDirButtons = document.querySelectorAll('.dir-btn');
    oldDirButtons.forEach(btn => btn.remove());
    
    // Conectar botões de ação sobre o jogo
    const interactBtn = byId('interactBtn');
    const attackBtn = byId('attackBtn');
    const inventoryBtn = byId('inventoryBtn');
    
    if (interactBtn) {
        interactBtn.addEventListener('click', () => {
            logMessage('🤝 Procurando NPCs e objetos para interagir...');
            simulateInteraction();
        });
    }
    
    if (attackBtn) {
        attackBtn.addEventListener('click', () => {
            logMessage('⚔️ Modo combate ativado!');
            simulateCombat();
        });
    }
    
    if (inventoryBtn) {
        inventoryBtn.addEventListener('click', () => {
            openModal('inventoryModal');
        });
    }
    
    // Conectar botões flutuantes
    const statusBtn = byId('statusBtn');
    const equipmentBtn = byId('equipmentBtn');
    const questsBtn = byId('questsBtn');
    const mapBtn = byId('mapBtn');
    
    if (statusBtn) {
        statusBtn.addEventListener('click', () => {
            openModal('statusModal');
        });
    }
    
    if (equipmentBtn) {
        equipmentBtn.addEventListener('click', () => {
            openModal('equipmentModal');
        });
    }
    
    if (questsBtn) {
        questsBtn.addEventListener('click', () => {
            openModal('questsModal');
        });
    }
    
    if (mapBtn) {
        mapBtn.addEventListener('click', () => {
            logMessage('🗺️ Abrindo mapa do mundo...');
        });
    }
    
    // Conectar chat
    const messageInput = byId('messageInput');
    const sendBtn = byId('sendMessageBtn');
    
    if (messageInput && sendBtn) {
        const sendMessage = () => {
            const message = messageInput.value.trim();
            if (message) {
                addChatMessage(message, 'player');
                messageInput.value = '';
            }
        };
        
        sendBtn.addEventListener('click', sendMessage);
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
    }
    
    // Botão de minimizar chat
    const toggleChatBtn = byId('toggleChatBtn');
    if (toggleChatBtn) {
        toggleChatBtn.addEventListener('click', () => {
            const chatContent = byId('chatContent') || byId('chatMessages').closest('.chat-content-compact');
            if (chatContent) {
                chatContent.style.display = chatContent.style.display === 'none' ? 'flex' : 'none';
                toggleChatBtn.textContent = chatContent.style.display === 'none' ? '+' : '−';
            }
        });
    }
    
    // Conectar botões de fechar modais
    const modalCloseButtons = document.querySelectorAll('.modal-close');
    modalCloseButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const modal = btn.closest('.modal');
            if (modal) {
                modal.classList.add('hidden');
            }
        });
    });
    
    // Fechar modal clicando fora
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.add('hidden');
            }
        });
    });
    
    // Adicionar controles de teclado (WASD e setas)
    setupKeyboardControls();
    
    // Inicializar dados do jogador
    initializePlayerData();
    
    // Atualizar tempo do jogo
    updateGameTime();
    
    // Iniciar loop de atualização
    startGameLoop();
    
    logMessage('✅ Interface compacta inicializada com sucesso! Use WASD para mover.');
}

function setupKeyboardControls() {
    document.addEventListener('keydown', (e) => {
        const key = e.key.toLowerCase();
        
        // Movimento WASD e setas
        switch(key) {
            case 'w':
            case 'arrowup':
                e.preventDefault();
                move('north');
                break;
            case 's':
            case 'arrowdown':
                e.preventDefault();
                move('south');
                break;
            case 'a':
            case 'arrowleft':
                e.preventDefault();
                move('west');
                break;
            case 'd':
            case 'arrowright':
                e.preventDefault();
                move('east');
                break;
            case 'e':
                e.preventDefault();
                logMessage('🤝 Interagindo...');
                simulateInteraction();
                break;
            case 'q':
                e.preventDefault();
                logMessage('⚔️ Atacando...');
                simulateCombat();
                break;
            case 'i':
                e.preventDefault();
                openModal('inventoryModal');
                break;
            case 'c':
                e.preventDefault();
                openModal('statusModal');
                break;
            case 'escape':
                e.preventDefault();
                closeAllModals();
                break;
        }
    });
}

function openModal(modalId) {
    closeAllModals();
    const modal = byId(modalId);
    if (modal) {
        modal.classList.remove('hidden');
        logMessage(`📂 Abrindo ${modalId.replace('Modal', '')}...`);
    }
}

function closeAllModals() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => modal.classList.add('hidden'));
}

function simulateInteraction() {
    const interactions = [
        '💬 Guarda: "Bem-vindo à cidade, aventureiro!"',
        '🏪 Mercador: "Tenho poções e equipamentos à venda!"',
        '📜 Tabuleiro: "Novas missões disponíveis!"',
        '🌳 Árvore: "Você encontrou uma maçã!"',
        '🗝️ Baú: "O baú está trancado..."'
    ];
    
    const randomInteraction = interactions[Math.floor(Math.random() * interactions.length)];
    setTimeout(() => {
        logMessage(randomInteraction);
    }, 1000);
}

function simulateCombat() {
    logMessage('👹 Um monstro selvagem apareceu!');
    setTimeout(() => {
        const damage = Math.floor(Math.random() * 20) + 10;
        logMessage(`⚔️ Você causou ${damage} de dano!`);
        
        setTimeout(() => {
            const receivedDamage = Math.floor(Math.random() * 10) + 5;
            logMessage(`💔 Você recebeu ${receivedDamage} de dano!`);
            
            // Atualiza barra de vida
            const healthBar = document.querySelector('.bar-fill.health');
            if (healthBar) {
                const currentWidth = parseInt(healthBar.style.width) || 100;
                const newWidth = Math.max(0, currentWidth - receivedDamage);
                healthBar.style.width = newWidth + '%';
            }
        }, 1000);
    }, 1500);
}

function toggleInventory() {
    const slots = document.querySelectorAll('.inventory-slot');
    slots.forEach((slot, index) => {
        if (slot.classList.contains('empty') && Math.random() > 0.5) {
            const items = ['🗡️', '🛡️', '🧪', '🍎', '💰', '📜'];
            const randomItem = items[Math.floor(Math.random() * items.length)];
            slot.textContent = randomItem;
            slot.classList.remove('empty');
            slot.title = `Item ${index + 1}`;
        }
    });
}

function initializePlayerData() {
    // Dados iniciais do jogador
    const playerData = {
        name: 'Herói',
        level: 1,
        health: 100,
        maxHealth: 100,
        mana: 50,
        maxMana: 50,
        exp: 0,
        expToNext: 100,
        strength: 10,
        defense: 5,
        speed: 8,
        magic: 3,
        class: 'warrior'
    };
    
    updateGameUI(playerData);
}

function addChatMessage(message, type = 'system') {
    const chatMessages = byId('chatMessages');
    if (!chatMessages) return;
    
    const messageEl = document.createElement('div');
    messageEl.className = `message ${type}`;
    
    const time = new Date().toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
    
    messageEl.innerHTML = `
        <span class="message-time">${time}</span>
        <span class="message-text">${message}</span>
    `;
    
    chatMessages.appendChild(messageEl);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function updateGameTime() {
    const gameTimeEl = byId('gameTime');
    if (gameTimeEl) {
        const now = new Date();
        gameTimeEl.textContent = now.toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }
}

function startGameLoop() {
    setInterval(() => {
        updateGameTime();
    }, 1000);
}

// Inicializar quando o documento estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM carregado, verificando tela do jogo...');
    
    // Verificar se estamos na tela do jogo
    if (byId('gameScreen') && byId('gameScreen').classList.contains('visible')) {
        console.log('Tela do jogo visível, inicializando interface...');
        initializeModernGameInterface();
    } else {
        console.log('Tela do jogo não visível, aguardando login...');
        
        // Observar mudanças na tela do jogo
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.target.id === 'gameScreen' && 
                    mutation.target.classList.contains('visible')) {
                    console.log('Tela do jogo ficou visível, inicializando interface...');
                    initializeModernGameInterface();
                    observer.disconnect();
                }
            });
        });
        
        const gameScreen = byId('gameScreen');
        if (gameScreen) {
            observer.observe(gameScreen, { 
                attributes: true, 
                attributeFilter: ['class'] 
            });
        }
    }
});

// Também inicializar se o window.game estiver disponível
window.addEventListener('load', () => {
    setTimeout(() => {
        if (byId('gameScreen') && byId('gameScreen').classList.contains('visible')) {
            if (!window.modernInterfaceInitialized) {
                console.log('Inicialização fallback da interface...');
                initializeModernGameInterface();
                window.modernInterfaceInitialized = true;
            }
        }
    }, 1000);
});
