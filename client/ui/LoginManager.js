export default class LoginManager {
    constructor(game) {
        this.game = game;
        
        // Elementos das telas
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
        
        // Setup eventos
        this.setupEvents();
        
        // Estado atual
        this.currentUser = null;
        this.currentCharacter = null;
        
        console.log('🔐 LoginManager initialized');
    }
    
    setupEvents() {
        // Login screen
        this.loginBtn.addEventListener('click', () => this.login());
        this.createAccountBtn.addEventListener('click', () => this.showCreateAccountForm());
        
        // Character screen
        this.enterWorldBtn.addEventListener('click', () => this.enterWorld());
        this.createCharacterBtn.addEventListener('click', () => this.createCharacter());
        this.backToLoginBtn.addEventListener('click', () => this.showLogin());
        
        console.log('✅ LoginManager events configured');
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
        this.loadCharacters();
    }
    
    showGame() {
        console.log('🎮 Showing game screen');
        this.loginScreen.style.display = "none";
        this.characterScreen.style.display = "none";
        this.gameScreen.style.display = "block";
        this.clearMessages();
    }
    
    // === LOGIN ===
    
    login() {
        const username = document.getElementById("username").value.trim();
        const password = document.getElementById("password").value.trim();
        
        if (!username) {
            this.showMessage('error', 'Por favor, digite um nome de usuário');
            return;
        }
        
        if (!password) {
            this.showMessage('error', 'Por favor, digite uma senha');
            return;
        }
        
        console.log('🔑 Attempting login:', username);
        this.showMessage('info', 'Conectando...');
        
        // Verificar no localStorage primeiro
        this.checkLocalAccount(username, password);
    }
    
    checkLocalAccount(username, password) {
        const accounts = JSON.parse(localStorage.getItem('eldoria_accounts') || '{}');
        
        if (accounts[username] && accounts[username].password === password) {
            console.log('✅ Local login successful');
            this.currentUser = accounts[username];
            localStorage.setItem('eldoria_current_user', JSON.stringify(this.currentUser));
            this.showMessage('success', 'Login successful!');
            
            setTimeout(() => {
                this.showCharacter();
            }, 1000);
        } else {
            // Tentar login no servidor
            if (this.game && this.game.network) {
                this.game.network.login(username, password);
            } else {
                this.showMessage('error', 'Usuário ou senha incorretos');
            }
        }
    }
    
    // === CRIAÇÃO DE CONTA ===
    
    showCreateAccountForm() {
        // Simples prompt por enquanto
        const username = prompt('Digite o nome de usuário:');
        const password = prompt('Digite a senha:');
        const email = prompt('Digite o email:');
        
        if (!username || !password || !email) {
            this.showMessage('error', 'Todos os campos são obrigatórios');
            return;
        }
        
        this.createAccount(username, password, email);
    }
    
    createAccount(username, password, email) {
        console.log('👤 Creating account:', username);
        this.showMessage('info', 'Criando conta...');
        
        try {
            // Verificar no localStorage
            const accounts = JSON.parse(localStorage.getItem('eldoria_accounts') || '{}');
            
            if (accounts[username]) {
                this.showMessage('error', 'Nome de usuário já existe');
                return;
            }
            
            // Criar nova conta
            const newAccount = {
                username: username,
                password: password,
                email: email,
                createdAt: new Date().toISOString(),
                id: Date.now().toString()
            };
            
            accounts[username] = newAccount;
            localStorage.setItem('eldoria_accounts', JSON.stringify(accounts));
            
            console.log('✅ Account created successfully');
            this.showMessage('success', 'Conta criada com sucesso!');
            
            setTimeout(() => {
                this.showLogin();
            }, 2000);
            
        } catch (error) {
            console.error('❌ Create account error:', error);
            this.showMessage('error', 'Erro ao criar conta');
        }
    }
    
    // === PERSONAGENS ===
    
    loadCharacters() {
        const characters = JSON.parse(localStorage.getItem('eldoria_characters') || '{}');
        const userCharacters = characters[this.currentUser?.username] || [];
        
        const characterList = document.getElementById("characterList");
        characterList.innerHTML = '';
        
        if (userCharacters.length === 0) {
            characterList.innerHTML = '<p class="no-characters">Nenhum personagem criado ainda</p>';
            return;
        }
        
        userCharacters.forEach(character => {
            const charDiv = document.createElement('div');
            charDiv.className = 'character-slot';
            charDiv.innerHTML = `
                <div class="character-info">
                    <h3>${character.name}</h3>
                    <p>Level ${character.level} - ${character.class}</p>
                </div>
            `;
            charDiv.addEventListener('click', () => this.selectCharacter(character));
            characterList.appendChild(charDiv);
        });
    }
    
    selectCharacter(character) {
        this.currentCharacter = character;
        console.log('👤 Character selected:', character.name);
        
        // Highlight selected
        document.querySelectorAll('.character-slot').forEach(slot => {
            slot.classList.remove('selected');
        });
        event.currentTarget.classList.add('selected');
    }
    
    createCharacter() {
        const name = prompt('Nome do personagem:');
        if (!name) return;
        
        const character = {
            id: Date.now().toString(),
            name: name,
            level: 1,
            class: 'Guerreiro',
            hp: 100,
            maxHp: 100,
            x: 400,
            y: 300
        };
        
        // Salvar personagem
        const characters = JSON.parse(localStorage.getItem('eldoria_characters') || '{}');
        if (!characters[this.currentUser.username]) {
            characters[this.currentUser.username] = [];
        }
        characters[this.currentUser.username].push(character);
        localStorage.setItem('eldoria_characters', JSON.stringify(characters));
        
        console.log('✅ Character created:', name);
        this.loadCharacters();
    }
    
    // === ENTRAR NO MUNDO ===
    
    enterWorld() {
        if (!this.currentCharacter) {
            this.showMessage('error', 'Selecione um personagem primeiro');
            return;
        }
        
        console.log('🌍 Entering world with:', this.currentCharacter.name);
        this.showGame();
        
        if (this.game) {
            this.game.startGame(this.currentCharacter);
        }
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
    
    // Network callbacks
    onLoginSuccess(player) {
        console.log('✅ Network login successful');
        this.currentUser = player;
        this.showMessage('success', 'Login successful!');
        setTimeout(() => this.showCharacter(), 1000);
    }
    
    onLoginError(error) {
        console.error('❌ Network login error:', error);
        this.showMessage('error', error);
    }
}
