/**
 * CharacterUI - Interface de Personagens Refatorada
 * Gerencia apenas a UI de seleção e criação de personagens
 * Parte do STEP 2 - Refatoração do Sistema de Login
 */

class CharacterUI {
    constructor() {
        this.elements = {
            characterScreen: null,
            characterNameInput: null,
            characterRaceSelect: null,
            characterClassSelect: null,
            characterList: null,
            createCharacterBtn: null,
            enterWorldBtn: null,
            messageContainer: null
        };
        
        this.callbacks = {
            onSelectCharacter: null,
            onCreateCharacter: null,
            onEnterWorld: null
        };
        
        this.selectedCharacter = null;
        this.characters = [];
        this.isVisible = false;
        this.isLoading = false;
        
        this.initialize();
    }
    
    /**
     * Inicializa a UI de personagens
     */
    initialize() {
        console.log('👤 Initializing CharacterUI...');
        this.cacheElements();
        this.bindEvents();
        console.log('✅ CharacterUI initialized');
    }
    
    /**
     * Cache dos elementos DOM
     */
    cacheElements() {
        this.elements = {
            characterScreen: document.getElementById('characterScreen'),
            characterNameInput: document.getElementById('characterName'),
            characterRaceSelect: document.getElementById('characterRace'),
            characterClassSelect: document.getElementById('characterClass'),
            characterList: document.getElementById('characterList'),
            createCharacterBtn: document.getElementById('createCharacterBtn'),
            enterWorldBtn: document.getElementById('enterWorldBtn'),
            messageContainer: document.getElementById('characterMessage')
        };
        
        // Verificar elementos
        Object.entries(this.elements).forEach(([name, element]) => {
            if (!element) {
                console.warn(`⚠️ CharacterUI element not found: ${name}`);
            }
        });
    }
    
    /**
     * Configura event listeners
     */
    bindEvents() {
        const { createCharacterBtn, enterWorldBtn } = this.elements;
        
        if (createCharacterBtn) {
            createCharacterBtn.addEventListener('click', () => this.handleCreateCharacter());
            console.log('✅ Create character button event bound');
        }
        
        if (enterWorldBtn) {
            enterWorldBtn.addEventListener('click', () => this.handleEnterWorld());
            console.log('✅ Enter world button event bound');
        }
    }
    
    /**
     * Manipula criação de personagem
     */
    handleCreateCharacter() {
        if (this.isLoading) {
            console.warn('⚠️ Character creation already in progress');
            return;
        }
        
        const characterData = this.getCharacterFormData();
        
        if (!this.validateCharacterData(characterData)) {
            return;
        }
        
        this.setLoading(true);
        
        // Notificar callback
        if (this.callbacks.onCreateCharacter) {
            this.callbacks.onCreateCharacter(characterData);
        } else {
            console.error('❌ Create character callback not set');
            this.setLoading(false);
        }
    }
    
    /**
     * Manipula entrada no mundo
     */
    handleEnterWorld() {
        if (this.isLoading) {
            console.warn('⚠️ Enter world already in progress');
            return;
        }
        
        if (!this.selectedCharacter) {
            this.showMessage('Selecione um personagem para entrar no mundo', 'error');
            return;
        }
        
        this.setLoading(true);
        
        // Notificar callback
        if (this.callbacks.onEnterWorld) {
            this.callbacks.onEnterWorld(this.selectedCharacter);
        } else {
            console.error('❌ Enter world callback not set');
            this.setLoading(false);
        }
    }
    
    /**
     * Obtém dados do formulário de personagem
     * @returns {object}
     */
    getCharacterFormData() {
        return {
            name: this.elements.characterNameInput?.value?.trim() || '',
            race: this.elements.characterRaceSelect?.value || '',
            class: this.elements.characterClassSelect?.value || ''
        };
    }
    
    /**
     * Valida dados do personagem
     * @param {object} characterData - Dados do personagem
     * @returns {boolean}
     */
    validateCharacterData(characterData) {
        const { name, race, class: characterClass } = characterData;
        
        if (!name || name.length < 3) {
            this.showMessage('Nome do personagem deve ter pelo menos 3 caracteres', 'error');
            return false;
        }
        
        if (name.length > 20) {
            this.showMessage('Nome do personagem deve ter no máximo 20 caracteres', 'error');
            return false;
        }
        
        // Validação de caracteres
        const validNameRegex = /^[a-zA-Z0-9_\p{L}\p{M}]+$/u;
        if (!validNameRegex.test(name)) {
            this.showMessage('Nome do personagem contém caracteres inválidos', 'error');
            return false;
        }
        
        if (!race) {
            this.showMessage('Selecione uma raça', 'error');
            return false;
        }
        
        if (!characterClass) {
            this.showMessage('Selecione uma classe', 'error');
            return false;
        }
        
        // Verificar se nome já existe
        if (this.characters.some(char => char.name.toLowerCase() === name.toLowerCase())) {
            this.showMessage('Este nome de personagem já está em uso', 'error');
            return false;
        }
        
        return true;
    }
    
    /**
     * Define a lista de personagens
     * @param {array} characters - Lista de personagens
     */
    setCharacters(characters) {
        this.characters = characters || [];
        this.renderCharacterList();
        console.log(`📋 Character list updated: ${this.characters.length} characters`);
    }
    
    /**
     * Renderiza a lista de personagens
     */
    renderCharacterList() {
        const { characterList } = this.elements;
        
        if (!characterList) return;
        
        if (this.characters.length === 0) {
            characterList.innerHTML = `
                <div class="no-characters">
                    <p>Nenhum personagem encontrado.</p>
                    <p>Crie um novo personagem para começar!</p>
                </div>
            `;
            return;
        }
        
        characterList.innerHTML = '';
        
        this.characters.forEach(character => {
            const characterCard = this.createCharacterCard(character);
            characterList.appendChild(characterCard);
        });
    }
    
    /**
     * Cria um card de personagem
     * @param {object} character - Dados do personagem
     * @returns {HTMLElement}
     */
    createCharacterCard(character) {
        const card = document.createElement('div');
        card.className = 'character-card';
        card.dataset.characterId = character.id;
        
        if (this.selectedCharacter?.id === character.id) {
            card.classList.add('selected');
        }
        
        card.innerHTML = `
            <div class="character-info">
                <h3 class="character-name">${character.name}</h3>
                <div class="character-details">
                    <span class="character-race">${this.getRaceDisplayName(character.race)}</span>
                    <span class="character-class">${this.getClassDisplayName(character.class)}</span>
                </div>
                <div class="character-stats">
                    <span class="character-level">Nível ${character.level || 1}</span>
                    <span class="character-hp">HP: ${character.hp || 100}/${character.maxHp || 100}</span>
                </div>
            </div>
        `;
        
        card.addEventListener('click', () => this.selectCharacter(character));
        
        return card;
    }
    
    /**
     * Seleciona um personagem
     * @param {object} character - Personagem selecionado
     */
    selectCharacter(character) {
        this.selectedCharacter = character;
        
        // Atualizar UI
        document.querySelectorAll('.character-card').forEach(card => {
            card.classList.remove('selected');
        });
        
        const selectedCard = document.querySelector(`[data-character-id="${character.id}"]`);
        if (selectedCard) {
            selectedCard.classList.add('selected');
        }
        
        // Habilitar botão de entrar no mundo
        if (this.elements.enterWorldBtn) {
            this.elements.enterWorldBtn.disabled = false;
        }
        
        console.log('👤 Character selected:', character.name);
        
        // Notificar callback
        if (this.callbacks.onSelectCharacter) {
            this.callbacks.onSelectCharacter(character);
        }
    }
    
    /**
     * Obtém nome display da raça
     * @param {string} race - Raça
     * @returns {string}
     */
    getRaceDisplayName(race) {
        const raceNames = {
            human: 'Humano',
            elf: 'Elfo',
            dwarf: 'Anão'
        };
        return raceNames[race] || race;
    }
    
    /**
     * Obtém nome display da classe
     * @param {string} characterClass - Classe
     * @returns {string}
     */
    getClassDisplayName(characterClass) {
        const classNames = {
            warrior: 'Guerreiro',
            mage: 'Mago',
            ranger: 'Rastreador'
        };
        return classNames[characterClass] || characterClass;
    }
    
    /**
     * Define estado de loading
     * @param {boolean} loading - Estado de loading
     */
    setLoading(loading) {
        this.isLoading = loading;
        
        const { createCharacterBtn, enterWorldBtn } = this.elements;
        
        if (createCharacterBtn) {
            createCharacterBtn.disabled = loading;
            createCharacterBtn.textContent = loading ? 'Criando...' : 'Criar Personagem';
        }
        
        if (enterWorldBtn) {
            enterWorldBtn.disabled = loading || !this.selectedCharacter;
            enterWorldBtn.textContent = loading ? 'Entrando...' : 'Entrar no Mundo';
        }
    }
    
    /**
     * Mostra mensagem para o usuário
     * @param {string} message - Mensagem
     * @param {string} type - Tipo (success, error, info)
     */
    showMessage(message, type = 'info') {
        const { messageContainer } = this.elements;
        
        if (messageContainer) {
            messageContainer.textContent = message;
            messageContainer.className = `message ${type}`;
            
            // Auto-clear para mensagens de sucesso
            if (type === 'success') {
                setTimeout(() => {
                    this.clearMessage();
                }, 3000);
            }
            
            console.log(`💬 CharacterUI message: ${message} (${type})`);
        }
    }
    
    /**
     * Limpa mensagem
     */
    clearMessage() {
        const { messageContainer } = this.elements;
        if (messageContainer) {
            messageContainer.textContent = '';
            messageContainer.className = 'message';
        }
    }
    
    /**
     * Limpa formulário de criação
     */
    clearCreateForm() {
        if (this.elements.characterNameInput) {
            this.elements.characterNameInput.value = '';
        }
        if (this.elements.characterRaceSelect) {
            this.elements.characterRaceSelect.selectedIndex = 0;
        }
        if (this.elements.characterClassSelect) {
            this.elements.characterClassSelect.selectedIndex = 0;
        }
        this.clearMessage();
    }
    
    /**
     * Mostra a UI de personagens
     */
    show() {
        if (this.elements.characterScreen) {
            this.elements.characterScreen.style.display = 'flex';
            this.isVisible = true;
            console.log('👁️ CharacterUI shown');
        }
    }
    
    /**
     * Esconde a UI de personagens
     */
    hide() {
        if (this.elements.characterScreen) {
            this.elements.characterScreen.style.display = 'none';
            this.isVisible = false;
            console.log('👁️‍🗨️ CharacterUI hidden');
        }
    }
    
    /**
     * Define callbacks
     * @param {object} callbacks - Callback functions
     */
    setCallbacks(callbacks) {
        this.callbacks = { ...this.callbacks, ...callbacks };
        console.log('🔧 CharacterUI callbacks set');
    }
    
    /**
     * Remove callbacks
     */
    removeCallbacks() {
        this.callbacks = {
            onSelectCharacter: null,
            onCreateCharacter: null,
            onEnterWorld: null
        };
    }
    
    /**
     * Reseta a UI
     */
    reset() {
        this.selectedCharacter = null;
        this.characters = [];
        this.clearCreateForm();
        this.setLoading(false);
        
        if (this.elements.enterWorldBtn) {
            this.elements.enterWorldBtn.disabled = true;
        }
        
        console.log('🔄 CharacterUI reset');
    }
    
    /**
     * Destrói a UI
     */
    destroy() {
        this.removeCallbacks();
        this.reset();
        
        // Remover event listeners (simplificado)
        const { createCharacterBtn, enterWorldBtn } = this.elements;
        if (createCharacterBtn) {
            createCharacterBtn.replaceWith(createCharacterBtn.cloneNode(true));
        }
        if (enterWorldBtn) {
            enterWorldBtn.replaceWith(enterWorldBtn.cloneNode(true));
        }
        
        console.log('🗑️ CharacterUI destroyed');
    }
    
    /**
     * Obtém informações de debug
     * @returns {object}
     */
    getDebugInfo() {
        return {
            isVisible: this.isVisible,
            isLoading: this.isLoading,
            charactersCount: this.characters.length,
            hasSelectedCharacter: !!this.selectedCharacter,
            selectedCharacterName: this.selectedCharacter?.name || null,
            hasCallbacks: Object.values(this.callbacks).some(cb => !!cb)
        };
    }
}

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.CharacterUI = CharacterUI;
}

// Exportar para módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CharacterUI;
}
    }
    
    bindEvents() {
        if (this.elements.createCharacterBtn) {
            this.elements.createCharacterBtn.addEventListener('click', () => this.handleCreateCharacter());
        }
        
        if (this.elements.enterWorldBtn) {
            this.elements.enterWorldBtn.addEventListener('click', () => this.handleEnterWorld());
        }
    }
    
    handleCreateCharacter() {
        this.showCharacterCreationModal();
    }
    
    handleEnterWorld() {
        if (!this.selectedCharacter) {
            this.showMessage('error', 'Por favor, selecione um personagem');
            return;
        }
        
        if (this.callbacks.onEnterWorld) {
            this.callbacks.onEnterWorld(this.selectedCharacter);
        }
    }
    
    setCharacters(characters) {
        this.characters = characters || [];
        this.renderCharacterList();
    }
    
    getSelectedCharacter() {
        return this.selectedCharacter;
    }
    
    selectCharacter(character) {
        this.selectedCharacter = character;
        this.updateSelectionUI();
        
        if (this.callbacks.onSelectCharacter) {
            this.callbacks.onSelectCharacter(character);
        }
    }
    
    renderCharacterList() {
        if (!this.elements.characterList) return;
        
        if (this.characters.length === 0) {
            this.elements.characterList.innerHTML = `
                <div class="no-characters">
                    <p>Nenhum personagem criado ainda</p>
                    <button class="btn-primary" onclick="characterUI.handleCreateCharacter()">
                        Criar Personagem
                    </button>
                </div>
            `;
            this.updateEnterWorldButton();
            return;
        }
        
        const listHTML = this.characters.map(character => `
            <div class="character-slot ${this.selectedCharacter?.id === character.id ? 'selected' : ''}" 
                 data-character-id="${character.id}">
                <div class="character-info">
                    <h3>${character.name}</h3>
                    <div class="character-stats">
                        <span class="level">Nível ${character.level || 1}</span>
                        <span class="class">${character.class || 'Guerreiro'}</span>
                    </div>
                    <div class="character-health">
                        <span>HP: ${character.hp || 100}/${character.maxHp || 100}</span>
                    </div>
                </div>
                <div class="character-actions">
                    <button class="btn-select" onclick="characterUI.selectCharacterById('${character.id}')">
                        Selecionar
                    </button>
                </div>
            </div>
        `).join('');
        
        this.elements.characterList.innerHTML = listHTML;
        this.updateEnterWorldButton();
    }
    
    selectCharacterById(characterId) {
        const character = this.characters.find(c => c.id === characterId);
        if (character) {
            this.selectCharacter(character);
        }
    }
    
    updateSelectionUI() {
        const slots = this.elements.characterList?.querySelectorAll('.character-slot');
        if (slots) {
            slots.forEach(slot => {
                const slotId = slot.dataset.characterId;
                if (slotId === this.selectedCharacter?.id) {
                    slot.classList.add('selected');
                } else {
                    slot.classList.remove('selected');
                }
            });
        }
        
        this.updateEnterWorldButton();
    }
    
    updateEnterWorldButton() {
        if (this.elements.enterWorldBtn) {
            this.elements.enterWorldBtn.disabled = !this.selectedCharacter;
            this.elements.enterWorldBtn.textContent = this.selectedCharacter ? 
                `Entrar no Mundo com ${this.selectedCharacter.name}` : 
                'Selecione um Personagem';
        }
    }
    
    show() {
        if (this.elements.characterScreen) {
            this.elements.characterScreen.style.display = 'block';
        }
        this.clearMessage();
        this.renderCharacterList();
    }
    
    hide() {
        if (this.elements.characterScreen) {
            this.elements.characterScreen.style.display = 'none';
        }
        this.selectedCharacter = null;
    }
    
    showMessage(type, message) {
        if (this.elements.messageContainer) {
            this.elements.messageContainer.textContent = message;
            this.elements.messageContainer.className = `message ${type}`;
            
            // Auto-clear after 5 seconds
            setTimeout(() => this.clearMessage(), 5000);
        }
    }
    
    clearMessage() {
        if (this.elements.messageContainer) {
            this.elements.messageContainer.textContent = '';
            this.elements.messageContainer.className = 'message';
        }
    }
    
    showCharacterCreationModal() {
        this.showModal('characterCreation');
    }
    
    showModal(type) {
        // Criar modal se não existir
        let modal = document.getElementById('modalOverlay');
        if (!modal) {
            modal = this.createModalOverlay();
        }
        
        let content;
        switch (type) {
            case 'characterCreation':
                content = this.createCharacterCreationContent();
                break;
            default:
                return;
        }
        
        modal.innerHTML = content;
        modal.style.display = 'flex';
        
        // Bind events
        this.bindModalEvents(type);
    }
    
    hideModal() {
        const modal = document.getElementById('modalOverlay');
        if (modal) {
            modal.style.display = 'none';
        }
    }
    
    createModalOverlay() {
        const modal = document.createElement('div');
        modal.id = 'modalOverlay';
        modal.className = 'modal-overlay';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: none;
            justify-content: center;
            align-items: center;
            z-index: 1000;
        `;
        
        document.body.appendChild(modal);
        return modal;
    }
    
    createCharacterCreationContent() {
        return `
            <div class="modal-content">
                <h3>Criar Novo Personagem</h3>
                <div class="form-group">
                    <label>Nome do Personagem:</label>
                    <input type="text" id="modalCharacterName" placeholder="Digite o nome do personagem" maxlength="20">
                </div>
                <div class="form-group">
                    <label>Classe:</label>
                    <select id="modalCharacterClass">
                        <option value="Guerreiro">Guerreiro</option>
                        <option value="Mago">Mago</option>
                        <option value="Arqueiro">Arqueiro</option>
                        <option value="Ladino">Ladino</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Aparência:</label>
                    <div class="character-appearance">
                        <div class="color-options">
                            <label>Cor:</label>
                            <input type="color" id="modalCharacterColor" value="#4CAF50">
                        </div>
                    </div>
                </div>
                <div class="form-buttons">
                    <button id="confirmCreateCharacter" class="btn-primary">Criar Personagem</button>
                    <button id="cancelCreateCharacter" class="btn-secondary">Cancelar</button>
                </div>
            </div>
        `;
    }
    
    bindModalEvents(type) {
        switch (type) {
            case 'characterCreation':
                const confirmBtn = document.getElementById('confirmCreateCharacter');
                const cancelBtn = document.getElementById('cancelCreateCharacter');
                
                if (confirmBtn) {
                    confirmBtn.addEventListener('click', () => this.handleCharacterCreation());
                }
                
                if (cancelBtn) {
                    cancelBtn.addEventListener('click', () => this.hideModal());
                }
                
                // Enter key
                const nameInput = document.getElementById('modalCharacterName');
                if (nameInput) {
                    nameInput.addEventListener('keypress', (e) => {
                        if (e.key === 'Enter') this.handleCharacterCreation();
                    });
                }
                break;
        }
    }
    
    handleCharacterCreation() {
        const name = document.getElementById('modalCharacterName')?.value?.trim();
        const characterClass = document.getElementById('modalCharacterClass')?.value;
        const color = document.getElementById('modalCharacterColor')?.value;
        
        // Validação
        if (!name) {
            this.showModalMessage('Por favor, digite um nome para o personagem');
            return;
        }
        
        if (name.length < 3) {
            this.showModalMessage('O nome deve ter pelo menos 3 caracteres');
            return;
        }
        
        if (name.length > 20) {
            this.showModalMessage('O nome deve ter no máximo 20 caracteres');
            return;
        }
        
        // Verificar se já existe personagem com mesmo nome
        if (this.characters.some(c => c.name.toLowerCase() === name.toLowerCase())) {
            this.showModalMessage('Já existe um personagem com este nome');
            return;
        }
        
        // Criar dados do personagem
        const characterData = {
            name: name,
            class: characterClass,
            color: color,
            level: 1,
            hp: 100,
            maxHp: 100,
            x: 400,
            y: 300,
            size: 32,
            speed: 150,
            atk: 10,
            def: 5,
            id: Date.now().toString()
        };
        
        // Chamar callback
        if (this.callbacks.onCreateCharacter) {
            this.callbacks.onCreateCharacter(characterData);
        }
        
        this.hideModal();
    }
    
    showModalMessage(message) {
        const modal = document.getElementById('modalOverlay');
        if (modal) {
            const existingMessage = modal.querySelector('.modal-message');
            if (existingMessage) {
                existingMessage.textContent = message;
            } else {
                const messageEl = document.createElement('div');
                messageEl.className = 'modal-message';
                messageEl.style.cssText = `
                    background: #f44336;
                    color: white;
                    padding: 10px;
                    margin: 10px 0;
                    border-radius: 4px;
                    text-align: center;
                `;
                messageEl.textContent = message;
                
                const content = modal.querySelector('.modal-content');
                if (content) {
                    content.insertBefore(messageEl, content.firstChild);
                }
            }
        }
    }
    
    // === CALLBACK REGISTRATION ===
    
    onSelectCharacter(callback) {
        this.callbacks.onSelectCharacter = callback;
    }
    
    onCreateCharacter(callback) {
        this.callbacks.onCreateCharacter = callback;
    }
    
    onEnterWorld(callback) {
        this.callbacks.onEnterWorld = callback;
    }
    
    // === UTILITY METHODS ===
    
    getElements() {
        return { ...this.elements };
    }
    
    isReady() {
        return this.elements.characterScreen && 
               this.elements.characterList;
    }
    
    addCharacter(character) {
        this.characters.push(character);
        this.renderCharacterList();
    }
    
    removeCharacter(characterId) {
        this.characters = this.characters.filter(c => c.id !== characterId);
        if (this.selectedCharacter?.id === characterId) {
            this.selectedCharacter = null;
        }
        this.renderCharacterList();
    }
    
    updateCharacter(characterId, updates) {
        const character = this.characters.find(c => c.id === characterId);
        if (character) {
            Object.assign(character, updates);
            this.renderCharacterList();
        }
    }
}

// Export for use
if (typeof window !== 'undefined') {
    window.CharacterUI = CharacterUI;
}
