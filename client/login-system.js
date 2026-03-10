/**
 * Sistema de Login Simplificado e Funcional
 * Com localStorage para testes
 */

class LoginSystem {
    constructor() {
        this.currentScreen = 'login';
        this.currentUser = null;
        this.characters = [];
        
        console.log('🔐 Initializing simplified login system...');
        this.init();
    }
    
    init() {
        console.log('🔐 Initializing simplified login system...');
        
        // Aguardar DOM carregar
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                console.log('📄 DOM loaded, setting up events...');
                this.setupEventListeners();
            });
        } else {
            console.log('📄 DOM already loaded, setting up events immediately...');
            this.setupEventListeners();
        }
        
        console.log('🔐 Login system initialized');
    }
    
    setupEventListeners() {
        console.log('🔧 Setting up event listeners...');
        
        // Botões principais
        const createAccountLink = document.getElementById('createAccountLink');
        const backToLoginButton = document.getElementById('backToLoginButton');
        const createCharacterButton = document.getElementById('createCharacterButton');
        
        console.log('🔍 Elements found:', {
            createAccountLink: !!createAccountLink,
            backToLoginButton: !!backToLoginButton,
            createCharacterButton: !!createCharacterButton
        });
        
        // Link para criar conta
        if (createAccountLink) {
            createAccountLink.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('🔗 Create account link clicked');
                this.showCreateAccountScreen();
            });
            console.log('✅ Create account link event added');
        } else {
            console.error('❌ Create account link not found');
            
            // Tentar novamente após um pequeno delay
            setTimeout(() => {
                console.log('🔄 Retrying to setup create account link...');
                const retryLink = document.getElementById('createAccountLink');
                if (retryLink) {
                    retryLink.addEventListener('click', (e) => {
                        e.preventDefault();
                        console.log('🔗 Create account link clicked (retry)');
                        this.showCreateAccountScreen();
                    });
                    console.log('✅ Create account link event added (retry)');
                } else {
                    console.error('❌ Create account link still not found');
                }
            }, 1000);
        }
        
        // Botão voltar para login
        if (backToLoginButton) {
            backToLoginButton.addEventListener('click', () => {
                console.log('🔙 Back to login clicked');
                this.showLoginScreen();
            });
        }
        
        // Botão criar personagem
        if (createCharacterButton) {
            createCharacterButton.addEventListener('click', () => {
                console.log('👥 Create character clicked');
                this.showCharacterSelectionScreen();
            });
        }
    }
    
    // === TELA DE LOGIN ===
    showLoginScreen() {
        console.log('🔑 Showing login screen...');
        this.currentScreen = 'login';
        
        // Remover telas dinâmicas
        const dynamicScreens = document.querySelectorAll('.login-container, .character-selection');
        dynamicScreens.forEach((screen, index) => {
            screen.remove();
            console.log(`🧹 Removed dynamic screen ${index + 1}`);
        });
        
        
        // Mostrar tela de login
        const loginScreen = document.getElementById('loginScreen');
        if (loginScreen) {
            loginScreen.style.display = 'flex';
            loginScreen.style.visibility = 'visible';
            loginScreen.style.opacity = '1';
            loginScreen.style.zIndex = '1000';
            console.log('✅ Login screen shown');
        } else {
            console.error('❌ Login screen not found');
        }
        
        // Configurar formulário de login (só se existir)
        this.setupLoginForm();
    }
    
    setupLoginForm() {
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            // Remover eventos anteriores
            loginForm.removeEventListener('submit', this.handleLogin);
            
            // Adicionar novo evento com prevenção de reload
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('🔑 Login form submitted');
                this.handleLogin(e);
            });
            
            console.log('✅ Login form event configured');
        } else {
            console.log('ℹ️ Login form not found - will be configured by global event');
        }
    }
    
    // === TELA DE CRIAÇÃO DE CONTA ===
    showCreateAccountScreen() {
        console.log('👤 Showing create account screen...');
        this.currentScreen = 'createAccount';
        
        // NÃO esconder tela de login - apenas sobrepor
        
        // Criar HTML dinâmico
        const createAccountHTML = `
            <div class="login-container" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.9); z-index: 2000;">
                <div class="login-box">
                    <div class="login-title">👥 Criar Nova Conta</div>
                    <div class="login-subtitle">Junte-se ao mundo de Eldoria</div>
                    
                    <div id="createAccountMessage"></div>
                    
                    <form id="createAccountForm">
                        <div class="form-group">
                            <label class="form-label" for="newUsername">Nome de Usuário</label>
                            <input type="text" id="newUsername" class="form-input" placeholder="Escolha um nome de usuário" required>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label" for="newEmail">Email</label>
                            <input type="email" id="newEmail" class="form-input" placeholder="Digite seu email" required>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label" for="newPassword">Senha</label>
                            <input type="password" id="newPassword" class="form-input" placeholder="Crie uma senha (mínimo 6 caracteres)" required>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label" for="confirmPassword">Confirmar Senha</label>
                            <input type="password" id="confirmPassword" class="form-input" placeholder="Confirme sua senha" required>
                        </div>
                        
                        <button type="submit" class="login-button" id="createAccountButton">Criar Conta</button>
                        <button type="button" class="login-button" id="cancelCreateButton">← Voltar</button>
                    </form>
                </div>
            </div>
        `;
        
        // Adicionar ao body
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = createAccountHTML;
        document.body.appendChild(tempDiv.firstElementChild);
        
        // Configurar eventos
        setTimeout(() => {
            this.setupCreateAccountEvents();
        }, 100);
    }
    
    setupCreateAccountEvents() {
        console.log('🔧 Setting up create account events...');
        
        const createAccountForm = document.getElementById('createAccountForm');
        const cancelCreateButton = document.getElementById('cancelCreateButton');
        
        console.log('🔍 Create account elements:', {
            form: !!createAccountForm,
            cancel: !!cancelCreateButton
        });
        
        if (createAccountForm) {
            createAccountForm.addEventListener('submit', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('📝 Create account form submitted');
                this.handleCreateAccount(e);
            });
            console.log('✅ Create account form event added');
        } else {
            console.error('❌ Create account form not found');
        }
        
        if (cancelCreateButton) {
            cancelCreateButton.addEventListener('click', () => {
                console.log('🔙 Cancel create account clicked');
                this.removeCreateAccountScreen();
                this.showLoginScreen();
            });
        }
    }
    
    // === HANDLERS ===
    
    async handleLogin(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        console.log('🔑 Attempting login:', username);
        this.updateMessage('info', 'Conectando...');
        
        try {
            // Validação simples
            if (username.length < 3) {
                this.updateMessage('error', 'O nome de usuário deve ter pelo menos 3 caracteres');
                return;
            }
            
            if (password.length < 6) {
                this.updateMessage('error', 'A senha deve ter pelo menos 6 caracteres');
                return;
            }
            
            // Verificar no localStorage
            const accounts = window.storage.getAccounts();
            const account = accounts[username];
            
            if (!account) {
                this.updateMessage('error', 'Usuário não encontrado');
                return;
            }
            
            if (account.password !== password) {
                this.updateMessage('error', 'Senha incorreta');
                return;
            }
            
            // Login successful
            this.currentUser = account;
            window.storage.setCurrentUser(account);
            
            console.log('✅ Login successful:', username);
            this.updateMessage('success', 'Login successful!');
            
            // Ir para seleção de personagem
            setTimeout(() => {
                this.showCharacterSelectionScreen();
            }, 1000);
            
        } catch (error) {
            console.error('❌ Login error:', error);
            this.updateMessage('error', 'Erro ao fazer login');
        }
    }
    
    async handleCreateAccount(e) {
        console.log('🚀 handleCreateAccount called!');
        e.preventDefault();
        e.stopPropagation();
        
        const username = document.getElementById('newUsername');
        const email = document.getElementById('newEmail');
        const password = document.getElementById('newPassword');
        const confirmPassword = document.getElementById('confirmPassword');
        
        console.log('🔍 Form elements:', {
            username: !!username,
            email: !!email,
            password: !!password,
            confirmPassword: !!confirmPassword
        });
        
        if (!username || !email || !password || !confirmPassword) {
            console.error('❌ Form elements not found!');
            this.updateCreateAccountMessage('error', 'Formulário incompleto');
            return;
        }
        
        const usernameValue = username.value;
        const emailValue = email.value;
        const passwordValue = password.value;
        const confirmPasswordValue = confirmPassword.value;
        
        console.log('👤 Creating account:', usernameValue);
        console.log('📧 Email:', emailValue);
        console.log('🔑 Password length:', passwordValue.length);
        
        this.updateCreateAccountMessage('info', 'Criando conta...');
        
        try {
            // Validação de senha
            if (passwordValue !== confirmPasswordValue) {
                this.updateCreateAccountMessage('error', 'As senhas não coincidem');
                return;
            }
            
            // Validação de email
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(emailValue)) {
                this.updateCreateAccountMessage('error', 'Por favor, digite um email válido');
                return;
            }
            
            // Verificar se conta já existe
            const accounts = window.storage.getAccounts();
            if (accounts[usernameValue]) {
                this.updateCreateAccountMessage('error', 'Nome de usuário já existe');
                return;
            }
            
            // Criar nova conta
            const newAccount = {
                username: usernameValue,
                email: emailValue,
                password: passwordValue,
                createdAt: new Date().toISOString(),
                id: Date.now().toString()
            };
            
            console.log('💾 Saving account:', newAccount);
            
            // Salvar no localStorage
            const saved = window.storage.saveAccount(newAccount);
            console.log('💾 Save result:', saved);
            
            console.log('✅ Account created successfully');
            this.updateCreateAccountMessage('success', 'Conta criada com sucesso!');
            
            // Voltar para login
            setTimeout(() => {
                this.removeCreateAccountScreen();
                this.showLoginScreen();
            }, 2000);
            
        } catch (error) {
            console.error('❌ Create account error:', error);
            this.updateCreateAccountMessage('error', 'Erro ao criar conta: ' + error.message);
        }
    }
    
    // === TELA DE SELEÇÃO DE PERSONAGEM ===
    showCharacterSelectionScreen() {
        console.log('👥 Showing character selection screen...');
        this.currentScreen = 'characterSelection';
        
        // Esconder outras telas
        const loginScreen = document.getElementById('loginScreen');
        if (loginScreen) {
            loginScreen.style.display = 'none';
        }
        
        const gameScreen = document.getElementById('gameScreen');
        if (gameScreen) {
            gameScreen.style.display = 'none';
        }
        
        // Mostrar tela de seleção
        const characterScreen = document.getElementById('characterScreen');
        if (characterScreen) {
            characterScreen.style.display = 'flex';
            this.loadCharacters();
        }
    }
    
    loadCharacters() {
        if (!this.currentUser) return;
        
        this.characters = window.storage.getCharacters(this.currentUser.username);
        
        const characterList = document.getElementById('characterList');
        if (characterList) {
            characterList.innerHTML = '';
            
            // Mostrar 3 slots
            for (let i = 0; i < 3; i++) {
                const character = this.characters[i];
                const slotHtml = character ? 
                    this.createCharacterCard(character, i) : 
                    this.createEmptySlot(i);
                
                characterList.innerHTML += slotHtml;
            }
            
            // Adicionar eventos
            this.setupCharacterEvents();
        }
    }
    
    createCharacterCard(character, index) {
        return `
            <div class="character-card" data-index="${index}">
                <div class="character-name">${character.name}</div>
                <div class="character-level">Level ${character.level}</div>
                <div class="character-race">${character.race}</div>
                <div class="character-class">${character.class}</div>
            </div>
        `;
    }
    
    createEmptySlot(index) {
        return `
            <div class="character-card empty-slot" data-index="${index}">
                <div class="character-name">Slot Vazio</div>
                <div class="character-level">Clique para criar</div>
            </div>
        `;
    }
    
    setupCharacterEvents() {
        const characterCards = document.querySelectorAll('.character-card');
        characterCards.forEach((card, index) => {
            card.addEventListener('click', () => {
                const character = this.characters[index];
                if (character) {
                    this.enterGameWithCharacter(character);
                } else {
                    this.showCreateCharacterScreen(index);
                }
            });
        });
    }
    
    // === ENTRAR NO JOGO ===
    enterGameWithCharacter(character) {
        console.log('🎮 Entering game with character:', character);
        
        // Inicializar jogo
        if (window.game) {
            const playerData = {
                id: character.id,
                username: character.name,
                name: character.name,
                level: character.level || 1,
                x: 400,
                y: 300,
                hp: 100,
                maxHp: 100,
                xp: 0,
                xpToNext: 100,
                race: character.race,
                class: character.class,
                city: character.city || 'Starter Plains',
                type: "player"
            };
            
            window.game.onWorldInit({
                player: playerData,
                entities: [],
                map: null
            });
        }
        
        // Mostrar tela de jogo
        const gameScreen = document.getElementById('gameScreen');
        if (gameScreen) {
            gameScreen.style.display = 'block';
        }
        
        // Esconder outras telas
        const characterScreen = document.getElementById('characterScreen');
        if (characterScreen) {
            characterScreen.style.display = 'none';
        }
    }
    
    // === UTILITÁRIOS ===
    
    removeCreateAccountScreen() {
        // Remover apenas a tela de criação de conta (com z-index 2000)
        const createAccountScreen = document.querySelector('.login-container[style*="z-index: 2000"]');
        if (createAccountScreen) {
            createAccountScreen.remove();
            console.log('🧹 Create account screen removed');
        } else {
            // Fallback: remover todos os .login-container que não são o #loginScreen
            const allContainers = document.querySelectorAll('.login-container');
            allContainers.forEach(container => {
                if (container.id !== 'loginScreen') {
                    container.remove();
                    console.log('🧹 Extra login container removed');
                }
            });
        }
    }
    
    updateMessage(type, message) {
        const messageDiv = document.getElementById('loginMessage');
        if (messageDiv) {
            messageDiv.className = `${type}-message`;
            messageDiv.textContent = message;
        }
    }
    
    updateCreateAccountMessage(type, message) {
        const messageDiv = document.getElementById('createAccountMessage');
        if (messageDiv) {
            messageDiv.className = `${type}-message`;
            messageDiv.textContent = message;
        }
    }
    
    clearMessages() {
        this.updateMessage('', '');
        this.updateCreateAccountMessage('', '');
    }
}

// Exportar para uso global
window.LoginSystem = LoginSystem;

// Instanciar imediatamente
window.loginSystem = new LoginSystem();

// Função global para testar manualmente
window.testCreateAccountButton = function() {
    const link = document.getElementById('createAccountLink');
    console.log('🔍 Create account link:', link);
    if (link) {
        console.log('🖱️ Simulando clique...');
        link.click();
    } else {
        console.error('❌ Link não encontrado');
    }
};

// Função para testar elementos do formulário
window.testCreateAccountForm = function() {
    console.log('🔍 Testando elementos do formulário de criação de conta:');
    
    const form = document.getElementById('createAccountForm');
    const username = document.getElementById('newUsername');
    const email = document.getElementById('newEmail');
    const password = document.getElementById('newPassword');
    const confirmPassword = document.getElementById('confirmPassword');
    const submitButton = document.querySelector('#createAccountForm button[type="submit"]');
    const cancelButton = document.getElementById('cancelCreateButton');
    
    console.log('📋 Elementos encontrados:');
    console.log('  - Formulário:', !!form);
    console.log('  - Username:', !!username);
    console.log('  - Email:', !!email);
    console.log('  - Password:', !!password);
    console.log('  - Confirm Password:', !!confirmPassword);
    console.log('  - Submit Button:', !!submitButton);
    console.log('  - Cancel Button:', !!cancelButton);
    
    if (form) {
        console.log('📝 Formulário HTML:', form.outerHTML.substring(0, 200) + '...');
    }
    
    if (submitButton) {
        console.log('🖱️ Botão submit HTML:', submitButton.outerHTML);
        // Simular clique no botão
        console.log('🖱️ Simulando clique no botão submit...');
        submitButton.click();
    }
    
    if (cancelButton) {
        console.log('🔙 Botão cancelar HTML:', cancelButton.outerHTML);
    }
};

// Função para forçar criação de conta
window.forceCreateAccount = function() {
    console.log('🚀 Forçando criação de conta...');
    
    // Preencher formulário com dados de teste
    const username = document.getElementById('newUsername');
    const email = document.getElementById('newEmail');
    const password = document.getElementById('newPassword');
    const confirmPassword = document.getElementById('confirmPassword');
    
    if (username && email && password && confirmPassword) {
        username.value = `testuser_${Date.now()}`;
        email.value = `test_${Date.now()}@test.com`;
        password.value = 'test123456';
        confirmPassword.value = 'test123456';
        
        console.log('📝 Formulário preenchido automaticamente');
        
        // Simular submit
        const form = document.getElementById('createAccountForm');
        if (form) {
            console.log('🚀 Simulando submit do formulário...');
            form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
        }
    } else {
        console.error('❌ Elementos do formulário não encontrados');
    }
};

// Função para testar login com última conta criada
window.testLoginWithCreatedAccount = function() {
    console.log('🔑 Testando login com conta criada...');
    
    // Obter última conta criada
    const accounts = window.storage.getAccounts();
    const accountKeys = Object.keys(accounts);
    
    if (accountKeys.length === 0) {
        console.error('❌ Nenhuma conta encontrada');
        return;
    }
    
    const lastAccount = accounts[accountKeys[accountKeys.length - 1]];
    console.log('👤 Usando última conta:', lastAccount.username);
    
    // Preencher formulário de login
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    
    if (usernameInput && passwordInput) {
        usernameInput.value = lastAccount.username;
        passwordInput.value = lastAccount.password;
        
        console.log('📝 Formulário de login preenchido');
        
        // Simular submit
        const form = document.getElementById('loginForm');
        if (form) {
            console.log('🚀 Simulando submit do login...');
            form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
        } else {
            console.log('ℹ️ Formulário não encontrado, usando evento global...');
        }
    } else {
        console.error('❌ Elementos do formulário de login não encontrados');
    }
};

// Função para mostrar status atual
window.showLoginStatus = function() {
    console.log('📊 Status do Sistema:');
    console.log('🔑 LoginSystem disponível:', !!window.loginSystem);
    console.log('💾 Storage disponível:', !!window.storage);
    
    const currentUser = window.storage.getCurrentUser();
    console.log('👤 Usuário atual:', currentUser ? currentUser.username : 'Nenhum');
    
    const accounts = window.storage.getAccounts();
    console.log('📋 Total de contas:', Object.keys(accounts).length);
    
    if (Object.keys(accounts).length > 0) {
        console.log('📝 Contas criadas:');
        Object.keys(accounts).forEach(username => {
            console.log(`  - ${username}`);
        });
    }
};

// Função global para reconfigurar eventos
window.reconfigureEvents = function() {
    console.log('🔄 Reconfigurando eventos...');
    if (window.loginSystem) {
        window.loginSystem.setupEventListeners();
    }
};

// Evento global como fallback final
document.addEventListener('click', function(e) {
    if (e.target && e.target.id === 'createAccountLink') {
        e.preventDefault();
        console.log('🔗 Create account link clicked (global fallback)');
        if (window.loginSystem) {
            window.loginSystem.showCreateAccountScreen();
        } else {
            console.error('❌ LoginSystem not available - criando novo...');
            window.loginSystem = new LoginSystem();
            setTimeout(() => {
                window.loginSystem.showCreateAccountScreen();
            }, 100);
        }
    }
}, true); // Use capture para garantir que execute primeiro

// Evento global para formulário de login
document.addEventListener('submit', function(e) {
    if (e.target && e.target.id === 'loginForm') {
        e.preventDefault();
        e.stopPropagation();
        console.log('🔑 Login form submitted (global fallback)');
        if (window.loginSystem) {
            window.loginSystem.handleLogin(e);
        } else {
            console.error('❌ LoginSystem not available for login - criando novo...');
            window.loginSystem = new LoginSystem();
            setTimeout(() => {
                window.loginSystem.handleLogin(e);
            }, 100);
        }
    }
}, true);

// Evento global para formulário de criação de conta
document.addEventListener('submit', function(e) {
    if (e.target && e.target.id === 'createAccountForm') {
        e.preventDefault();
        e.stopPropagation();
        console.log('📝 Create account form submitted (global fallback)');
        if (window.loginSystem) {
            window.loginSystem.handleCreateAccount(e);
        } else {
            console.error('❌ LoginSystem not available for create account - criando novo...');
            window.loginSystem = new LoginSystem();
            setTimeout(() => {
                window.loginSystem.handleCreateAccount(e);
            }, 100);
        }
    }
}, true);

// Evento global para botão voltar
document.addEventListener('click', function(e) {
    if (e.target && e.target.id === 'cancelCreateButton') {
        e.preventDefault();
        e.stopPropagation();
        console.log('🔙 Cancel button clicked (global fallback)');
        if (window.loginSystem) {
            window.loginSystem.removeCreateAccountScreen();
            window.loginSystem.showLoginScreen();
        } else {
            console.error('❌ LoginSystem not available for cancel - criando novo...');
            window.loginSystem = new LoginSystem();
            setTimeout(() => {
                window.loginSystem.removeCreateAccountScreen();
                window.loginSystem.showLoginScreen();
            }, 100);
        }
    }
}, true);

// Evento global para botão criar conta (fallback de clique)
document.addEventListener('click', function(e) {
    if (e.target && e.target.type === 'submit' && e.target.form && e.target.form.id === 'createAccountForm') {
        e.preventDefault();
        e.stopPropagation();
        console.log('🖱️ Create account button clicked (global fallback)');
        if (window.loginSystem) {
            window.loginSystem.handleCreateAccount(e);
        } else {
            console.error('❌ LoginSystem not available for create account button - criando novo...');
            window.loginSystem = new LoginSystem();
            setTimeout(() => {
                window.loginSystem.handleCreateAccount(e);
            }, 100);
        }
    }
}, true);
