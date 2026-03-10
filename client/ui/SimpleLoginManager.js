// === LOGIN UI ===
export class LoginUI {
    constructor() {
        this.loginScreen = document.getElementById("loginScreen");
        this.characterScreen = document.getElementById("characterScreen");
        this.gameScreen = document.getElementById("gameScreen");
        
        // Botões
        this.loginBtn = document.getElementById("loginBtn");
        this.createAccountBtn = document.getElementById("createAccountBtn");
        this.enterWorldBtn = document.getElementById("enterWorldBtn");
        this.createCharacterBtn = document.getElementById("createCharacterBtn");
        this.backToLoginBtn = document.getElementById("backToLoginBtn");
        
        // Mensagens
        this.loginMessage = document.getElementById("loginMessage");
        this.characterMessage = document.getElementById("characterMessage");
        
        console.log('🔑 LoginUI initialized');
    }
    
    setupEvents(callbacks) {
        // Login screen
        this.loginBtn.addEventListener('click', () => callbacks.onLogin());
        this.createAccountBtn.addEventListener('click', () => callbacks.onCreateAccount());
        
        // Character screen
        this.enterWorldBtn.addEventListener('click', () => callbacks.onEnterWorld());
        this.createCharacterBtn.addEventListener('click', () => callbacks.onCreateCharacter());
        this.backToLoginBtn.addEventListener('click', () => callbacks.onBackToLogin());
        
        console.log('✅ LoginUI events configured');
    }
    
    // === CONTROLE DE TELAS ===
    
    showLogin() {
        console.log('🔑 Showing login screen');
        this.loginScreen.style.display = "block";
        this.characterScreen.style.display = "none";
        this.gameScreen.style.display = "none";
        this.clearMessages();
    }
    
    showCharacter() {
        console.log('👥 Showing character screen');
        this.loginScreen.style.display = "none";
        this.characterScreen.style.display = "block";
        this.gameScreen.style.display = "none";
        this.clearMessages();
    }
    
    showGame() {
        console.log('🎮 Showing game screen');
        this.loginScreen.style.display = "none";
        this.characterScreen.style.display = "none";
        this.gameScreen.style.display = "block";
        this.clearMessages();
    }
    
    // === UTILITÁRIOS ===
    
    showMessage(type, message) {
        if (this.loginMessage) {
            this.loginMessage.textContent = message;
            this.loginMessage.className = `message ${type}`;
        }
    }
    
    showCharacterMessage(type, message) {
        if (this.characterMessage) {
            this.characterMessage.textContent = message;
            this.characterMessage.className = `message ${type}`;
        }
    }
    
    clearMessages() {
        if (this.loginMessage) this.loginMessage.textContent = '';
        if (this.characterMessage) this.characterMessage.textContent = '';
    }
}

// === CHARACTER UI ===
export class CharacterUI {
    constructor() {
        this.characterList = document.getElementById("characterList");
        this.characterMessage = document.getElementById("characterMessage");
        
        console.log('👥 CharacterUI initialized');
    }
    
    loadCharacters(characters) {
        this.characterList.innerHTML = '';
        
        if (characters.length === 0) {
            this.characterList.innerHTML = '<p class="no-characters">Nenhum personagem criado ainda</p>';
            return;
        }
        
        characters.forEach(character => {
            const charDiv = document.createElement('div');
            charDiv.className = 'character-slot';
            charDiv.innerHTML = `
                <div class="character-info">
                    <h3>${character.name}</h3>
                    <p>Level ${character.level} - ${character.class}</p>
                </div>
            `;
            charDiv.addEventListener('click', () => this.onCharacterSelect(character));
            this.characterList.appendChild(charDiv);
        });
    }
    
    selectCharacter(character) {
        console.log('👤 Character selected:', character.name);
        
        // Highlight selected
        document.querySelectorAll('.character-slot').forEach(slot => {
            slot.classList.remove('selected');
        });
        event.currentTarget.classList.add('selected');
        
        return character;
    }
    
    createCharacter() {
        // Mostrar formulário de criação de personagem
        this.showCharacterCreationModal();
    }
    
    showCharacterCreationModal() {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <h2>Criar Novo Personagem</h2>
                <div class="form-group">
                    <label>Nome do Personagem:</label>
                    <input type="text" id="characterName" placeholder="Digite o nome do personagem">
                </div>
                <div class="form-group">
                    <label>Classe:</label>
                    <select id="characterClass">
                        <option value="Guerreiro">Guerreiro</option>
                        <option value="Mago">Mago</option>
                        <option value="Arqueiro">Arqueiro</option>
                    </select>
                </div>
                <div class="form-buttons">
                    <button id="confirmCreateCharacter">Criar Personagem</button>
                    <button id="cancelCreateCharacter">Cancelar</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Event listeners
        document.getElementById('confirmCreateCharacter').addEventListener('click', () => {
            const name = document.getElementById('characterName').value.trim();
            const characterClass = document.getElementById('characterClass').value;
            
            if (!name) {
                this.showMessage('error', 'Nome do personagem é obrigatório');
                return;
            }
            
            this.onCharacterCreate({ name, class: characterClass });
            this.hideModal();
        });
        
        document.getElementById('cancelCreateCharacter').addEventListener('click', () => {
            this.hideModal();
        });
    }
    
    hideModal() {
        const modal = document.querySelector('.modal-overlay');
        if (modal) {
            modal.remove();
        }
    }
    
    showMessage(type, message) {
        if (this.characterMessage) {
            this.characterMessage.textContent = message;
            this.characterMessage.className = `message ${type}`;
        }
    }
    
    // Callbacks a serem configurados externamente
    onCharacterSelect(character) {
        console.log('Character selected in UI:', character);
    }
    
    onCharacterCreate(characterData) {
        console.log('Character created in UI:', characterData);
    }
}

// === SESSION MANAGER ===
export class SessionManager {
    constructor() {
        this.currentUser = null;
        this.currentCharacter = null;
        this.sessionData = {};
        
        console.log('🗄️ SessionManager initialized');
    }
    
    // === GERENCIAMENTO DE SESSÃO ===
    
    setCurrentUser(user) {
        this.currentUser = user;
        this.sessionData.user = user;
        
        // Salvar em localStorage
        localStorage.setItem('eldoria_current_user', JSON.stringify(user));
        
        console.log('✅ Current user set:', user.username);
    }
    
    setCurrentCharacter(character) {
        this.currentCharacter = character;
        this.sessionData.character = character;
        
        console.log('✅ Current character set:', character.name);
    }
    
    getCurrentUser() {
        return this.currentUser;
    }
    
    getCurrentCharacter() {
        return this.currentCharacter;
    }
    
    getSessionData() {
        return {
            user: this.currentUser,
            character: this.currentCharacter,
            isLoggedIn: !!this.currentUser,
            hasCharacter: !!this.currentCharacter
        };
    }
    
    // === VALIDAÇÃO ===
    
    validateLoginState() {
        if (!this.currentUser) {
            console.warn('⚠️ No user in session');
            return false;
        }
        
        if (!this.currentCharacter) {
            console.warn('⚠️ No character selected');
            return false;
        }
        
        return true;
    }
    
    clearSession() {
        this.currentUser = null;
        this.currentCharacter = null;
        this.sessionData = {};
        
        // Limpar localStorage
        localStorage.removeItem('eldoria_current_user');
        
        console.log('🧹 Session cleared');
    }
}

// === SIMPLE LOGIN MANAGER (LEGACY) ===
export default class SimpleLoginManager {
    constructor() {
        this.loginUI = new LoginUI();
        this.characterUI = new CharacterUI();
        this.sessionManager = new SessionManager();
        
        // Configurar callbacks
        this.loginUI.setupEvents({
            onLogin: () => this.handleLogin(),
            onCreateAccount: () => this.handleCreateAccount(),
            onEnterWorld: () => this.handleEnterWorld(),
            onCreateCharacter: () => this.handleCreateCharacter(),
            onBackToLogin: () => this.handleBackToLogin()
        });
        
        // Configurar character UI callbacks
        this.characterUI.onCharacterSelect = (character) => this.handleCharacterSelect(Character);
        this.characterUI.onCharacterCreate = (CharacterData) => this.handleCharacterCreate(CharacterData);
        
        console.log('🔐 SimpleLoginManager initialized with refactored components');
    }
    
    // === HANDLERS ===
    
    handleLogin() {
        const username = document.getElementById("username").value.trim();
        const password = document.getElementById("password").value.trim();
        
        if (!username) {
            this.loginUI.showMessage('error', 'Por favor, digite um nome de usuário');
            return;
        }
        
        if (!password) {
            this.loginUI.showMessage('error', 'Por favor, digite uma senha');
            return;
        }
        
        console.log('🔑 Attempting login:', username);
        this.loginUI.showMessage('info', 'Conectando...');
        
        // Verificar no localStorage primeiro
        this.checkLocalAccount(username, password);
    }
    
    handleCreateAccount() {
        this.loginUI.showMessage('info', 'Criar conta via UI modal');
        // A criação real é feita pela CharacterUI
        this.characterUI.createCharacter();
    }
    
    handleEnterWorld() {
        if (!this.sessionManager.getCurrentCharacter()) {
            this.loginUI.showMessage('error', 'Selecione um personagem primeiro');
            return;
        }
        
        console.log('🌍 Entering world');
        this.loginUI.showGame();
        
        // Notificar o pipeline que o mundo foi solicitado
        if (window.gamePipeline && window.gamePipeline.onEnterWorld) {
            window.gamePipeline.onEnterWorld(this.sessionManager.getCurrentCharacter());
        }
    }
    
    handleCreateCharacter() {
        this.characterUI.createCharacter();
    }
    
    handleCharacterSelect(character) {
        this.sessionManager.setCurrentCharacter(character);
        this.loginUI.showMessage('success', 'Personagem selecionado!');
    }
    
    handleCharacterCreate(characterData) {
        // Salvar personagem
        const characters = JSON.parse(localStorage.getItem('eldoria_characters') || '{}');
        const currentUser = this.sessionManager.getCurrentUser();
        
        if (!characters[currentUser.username]) {
            characters[currentUser.username] = [];
        }
        
        characters[currentUser.username].push(characterData);
        localStorage.setItem('eldoria_characters', JSON.stringify(characters));
        
        console.log('✅ Character created:', characterData.name);
        
        // Recarregar lista
        const allCharacters = characters[currentUser.username];
        this.characterUI.loadCharacters(allCharacters);
    }
    
    handleBackToLogin() {
        this.sessionManager.clearSession();
        this.loginUI.showLogin();
    }
    
    // === MÉTODOS LEGADOS ===
    
    checkLocalAccount(username, password) {
        const accounts = JSON.parse(localStorage.getItem('eldoria_accounts') || '{}');
        
        if (accounts[username] && accounts[username].password === password) {
            console.log('✅ Local login successful');
            this.sessionManager.setCurrentUser(accounts[username]);
            this.loginUI.showMessage('success', 'Login successful!');
            
            setTimeout(() => {
                this.loginUI.showCharacter();
                this.loadCharacters();
            }, 1000);
        } else {
            // Tentar login no servidor
            this.loginUI.showMessage('error', 'Usuário ou senha incorretos');
        }
    }
    
    loadCharacters() {
        const characters = JSON.parse(localStorage.getItem('eldoria_characters') || '{}');
        const currentUser = this.sessionManager.getCurrentUser();
        const userCharacters = characters[currentUser?.username] || [];
        
        this.characterUI.loadCharacters(userCharacters);
    }
    
    // === NETWORK CALLBACKS ===
    
    onLoginSuccess(player) {
        console.log('✅ Network login successful');
        this.sessionManager.setCurrentUser(player);
        this.loginUI.showMessage('success', 'Login successful!');
        setTimeout(() => this.loginUI.showCharacter(), 1000);
    }
    
    onLoginError(error) {
        console.error('❌ Network login error:', error);
        this.loginUI.showMessage('error', error);
    }
}
