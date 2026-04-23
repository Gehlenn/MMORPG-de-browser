/**
 * LoginManager - Sistema de Login inspirado no WoW
 * Simplificado, robusto e auto-contido
 */
class LoginManager {
    constructor() {
        console.log('🔐 LoginManager inicializando...');
        
        this.currentUser = null;
        this.selectedCharacter = null;
        this.characters = {};
        
        this.init();
    }
    
    init() {
        this.loadElements();
        this.setupEventListeners();
        this.checkExistingSession();
        console.log('✅ LoginManager pronto');
    }
    
    loadElements() {
        // Telas
        this.loginScreen = document.getElementById('loginScreen');
        this.characterScreen = document.getElementById('characterScreen');
        this.gameContainer = document.getElementById('gameContainer');
        
        // Login
        this.loginUsername = document.getElementById('loginUsername');
        this.loginPassword = document.getElementById('loginPassword');
        this.loginMessage = document.getElementById('loginMessage');
        
        // Criar conta
        this.createAccountForm = document.getElementById('createAccountForm');
        this.newUsername = document.getElementById('newUsername');
        this.newPassword = document.getElementById('newPassword');
        this.confirmPassword = document.getElementById('confirmPassword');
        
        // Criação de personagem
        this.characterCreation = document.getElementById('characterCreation');
        this.characterName = document.getElementById('characterName');
        this.characterRace = document.getElementById('characterRace');
        this.characterClass = document.getElementById('characterClass');
        
        console.log('📦 Elementos carregados');
    }
    
    setupEventListeners() {
        // Botões de login
        const loginBtn = document.getElementById('loginBtn');
        const createAccountBtn = document.getElementById('createAccountBtn');
        const backToLoginBtn = document.getElementById('backToLoginBtn');
        const doCreateAccountBtn = document.getElementById('doCreateAccountBtn');
        
        if (loginBtn) loginBtn.onclick = () => this.handleLogin();
        if (createAccountBtn) createAccountBtn.onclick = () => this.showCreateAccount();
        if (backToLoginBtn) backToLoginBtn.onclick = () => this.showLogin();
        if (doCreateAccountBtn) doCreateAccountBtn.onclick = () => this.handleCreateAccount();
        
        // Botões de personagem
        const enterWorldBtn = document.getElementById('enterWorldBtn');
        const createNewCharacterBtn = document.getElementById('createNewCharacterBtn');
        const logoutBtn = document.getElementById('logoutBtn');
        const cancelCreationBtn = document.getElementById('cancelCreationBtn');
        const createCharacterBtn = document.getElementById('createCharacterBtn');
        
        if (enterWorldBtn) enterWorldBtn.onclick = () => this.enterWorld();
        if (createNewCharacterBtn) createNewCharacterBtn.onclick = () => this.showCharacterCreation();
        if (logoutBtn) logoutBtn.onclick = () => this.logout();
        if (cancelCreationBtn) cancelCreationBtn.onclick = () => this.cancelCharacterCreation();
        if (createCharacterBtn) createCharacterBtn.onclick = () => this.createCharacter();
        
        // Cards de personagem
        const cards = document.querySelectorAll('.character-card');
        cards.forEach(card => {
            card.onclick = (e) => this.selectCharacter(card.dataset.class, card);
        });
        
        console.log('🎯 Event listeners configurados');
    }
    
    checkExistingSession() {
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            try {
                this.currentUser = JSON.parse(savedUser);
                console.log('👤 Sessão existente encontrada:', this.currentUser.username);
                this.showCharacterSelect();
            } catch (e) {
                console.error('Erro ao carregar sessão:', e);
                localStorage.removeItem('currentUser');
            }
        }
    }
    
    // ===== LOGIN =====
    handleLogin() {
        const username = this.loginUsername?.value?.trim();
        const password = this.loginPassword?.value;
        
        console.log('🔑 Tentando login:', username);
        
        if (!username || !password) {
            this.showMessage('loginMessage', 'Preencha usuário e senha', 'error');
            return;
        }
        
        // Verificar no localStorage
        const users = JSON.parse(localStorage.getItem('users') || '{}');
        const user = users[username];
        
        if (!user || user.password !== password) {
            this.showMessage('loginMessage', 'Usuário ou senha incorretos', 'error');
            return;
        }
        
        // Login bem-sucedido
        this.currentUser = { username: user.username, id: user.id || Date.now() };
        localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
        
        // Carregar personagens do usuário
        this.loadUserCharacters();
        
        this.showMessage('loginMessage', 'Login bem-sucedido!', 'success');
        
        setTimeout(() => {
            this.showCharacterSelect();
        }, 500);
    }
    
    // ===== CRIAR CONTA =====
    showCreateAccount() {
        console.log('📝 Mostrando formulário de criação');
        if (this.createAccountForm) {
            this.createAccountForm.style.display = 'block';
            this.createAccountForm.style.opacity = '0';
            setTimeout(() => this.createAccountForm.style.opacity = '1', 50);
        }
        if (this.loginMessage) this.loginMessage.style.display = 'none';
    }
    
    showLogin() {
        console.log('🔙 Voltando para login');
        if (this.createAccountForm) {
            this.createAccountForm.style.opacity = '0';
            setTimeout(() => this.createAccountForm.style.display = 'none', 300);
        }
        if (this.loginMessage) this.loginMessage.style.display = 'none';
    }
    
    handleCreateAccount() {
        const username = this.newUsername?.value?.trim();
        const password = this.newPassword?.value;
        const confirm = this.confirmPassword?.value;
        
        console.log('📝 Criando conta:', username);
        
        if (!username || !password) {
            this.showMessage('loginMessage', 'Preencha todos os campos', 'error');
            return;
        }
        
        if (password !== confirm) {
            this.showMessage('loginMessage', 'Senhas não coincidem', 'error');
            return;
        }
        
        if (password.length < 4) {
            this.showMessage('loginMessage', 'Senha deve ter pelo menos 4 caracteres', 'error');
            return;
        }
        
        // Verificar se usuário existe
        const users = JSON.parse(localStorage.getItem('users') || '{}');
        if (users[username]) {
            this.showMessage('loginMessage', 'Usuário já existe', 'error');
            return;
        }
        
        // Criar usuário
        users[username] = {
            username,
            password,
            id: Date.now(),
            createdAt: new Date().toISOString()
        };
        
        localStorage.setItem('users', JSON.stringify(users));
        
        this.showMessage('loginMessage', 'Conta criada com sucesso!', 'success');
        
        setTimeout(() => {
            this.showLogin();
            if (this.loginUsername) this.loginUsername.value = username;
            if (this.loginPassword) this.loginPassword.value = '';
        }, 1500);
    }
    
    // ===== SELEÇÃO DE PERSONAGEM =====
    showCharacterSelect() {
        console.log('🎭 Mostrando seleção de personagem');
        
        if (this.loginScreen) {
            this.loginScreen.style.opacity = '0';
            setTimeout(() => {
                this.loginScreen.style.display = 'none';
                if (this.characterScreen) {
                    this.characterScreen.style.display = 'flex';
                    this.characterScreen.style.opacity = '0';
                    setTimeout(() => this.characterScreen.style.opacity = '1', 50);
                }
            }, 300);
        }
        
        // Atualizar lista de personagens
        this.updateCharacterList();
    }
    
    loadUserCharacters() {
        const allCharacters = JSON.parse(localStorage.getItem('characters') || '{}');
        this.characters = allCharacters[this.currentUser?.username] || {};
        console.log('📋 Personagens carregados:', Object.keys(this.characters));
    }
    
    updateCharacterList() {
        // Resetar cards
        const cards = document.querySelectorAll('.character-card');
        cards.forEach(card => {
            const className = card.dataset.class;
            const charData = this.characters[className];
            
            // Atualizar visual do card
            const existingBadge = card.querySelector('.char-level');
            if (existingBadge) existingBadge.remove();
            
            if (charData) {
                // Personagem existe
                card.classList.add('has-character');
                card.classList.remove('empty');
                
                // Adicionar info
                const info = document.createElement('div');
                info.className = 'char-info';
                info.innerHTML = `
                    <div class="char-name">${charData.name}</div>
                    <div class="char-level">Nv. ${charData.level}</div>
                `;
                
                // Limpar info antiga se existir
                const oldInfo = card.querySelector('.char-info');
                if (oldInfo) oldInfo.remove();
                
                card.appendChild(info);
            } else {
                // Slot vazio
                card.classList.remove('has-character');
                card.classList.add('empty');
                
                const oldInfo = card.querySelector('.char-info');
                if (oldInfo) oldInfo.remove();
            }
        });
        
        // Resetar seleção
        this.selectedCharacter = null;
        const enterBtn = document.getElementById('enterWorldBtn');
        if (enterBtn) {
            enterBtn.disabled = true;
            enterBtn.style.opacity = '0.5';
        }
    }
    
    selectCharacter(className, cardElement) {
        console.log('🎯 Personagem selecionado:', className);
        
        // Verificar se existe personagem neste slot
        if (!this.characters[className]) {
            console.log('Slot vazio, abrindo criação...');
            this.showCharacterCreation(className);
            return;
        }
        
        // Selecionar personagem existente
        this.selectedCharacter = { ...this.characters[className], class: className };
        
        // Destacar card
        const cards = document.querySelectorAll('.character-card');
        cards.forEach(c => c.classList.remove('selected'));
        if (cardElement) cardElement.classList.add('selected');
        
        // Habilitar botão entrar
        const enterBtn = document.getElementById('enterWorldBtn');
        if (enterBtn) {
            enterBtn.disabled = false;
            enterBtn.style.opacity = '1';
        }
        
        // Salvar seleção
        localStorage.setItem('selectedCharacter', className);
    }
    
    // ===== CRIAÇÃO DE PERSONAGEM =====
    showCharacterCreation(preselectedClass) {
        console.log('👤 Mostrando criação de personagem:', preselectedClass);
        
        if (preselectedClass && this.characterClass) {
            this.characterClass.value = preselectedClass;
        }
        
        const characterList = document.getElementById('characterList');
        
        if (characterList) {
            characterList.style.opacity = '0';
            setTimeout(() => {
                characterList.style.display = 'none';
                if (this.characterCreation) {
                    this.characterCreation.style.display = 'block';
                    this.characterCreation.style.opacity = '0';
                    setTimeout(() => this.characterCreation.style.opacity = '1', 50);
                }
            }, 300);
        }
    }
    
    cancelCharacterCreation() {
        console.log('❌ Cancelando criação');
        
        if (this.characterCreation) {
            this.characterCreation.style.opacity = '0';
            setTimeout(() => {
                this.characterCreation.style.display = 'none';
                const characterList = document.getElementById('characterList');
                if (characterList) {
                    characterList.style.display = 'grid';
                    characterList.style.opacity = '0';
                    setTimeout(() => characterList.style.opacity = '1', 50);
                }
            }, 300);
        }
        
        // Limpar campos
        if (this.characterName) this.characterName.value = '';
    }
    
    createCharacter() {
        console.log('🔍 Debug createCharacter - currentUser:', this.currentUser);
        
        // Verificar se usuário está logado
        if (!this.currentUser) {
            console.error('❌ Nenhum usuário logado, tentando recuperar do localStorage...');
            const savedUser = localStorage.getItem('currentUser');
            if (savedUser) {
                try {
                    this.currentUser = JSON.parse(savedUser);
                    console.log('✅ Usuário recuperado:', this.currentUser.username);
                } catch (e) {
                    console.error('❌ Erro ao recuperar usuário:', e);
                    this.showMessage('characterMessage', 'Erro: Faça login novamente', 'error');
                    setTimeout(() => this.logout(), 2000);
                    return;
                }
            } else {
                console.error('❌ Nenhum usuário em localStorage');
                this.showMessage('characterMessage', 'Erro: Faça login novamente', 'error');
                setTimeout(() => this.logout(), 2000);
                return;
            }
        }
        
        const name = this.characterName?.value?.trim();
        const race = this.characterRace?.value;
        const charClass = this.characterClass?.value || 'warrior';
        
        console.log('🎭 Criando personagem:', { name, race, class: charClass });
        
        if (!name || !race) {
            this.showMessage('characterMessage', 'Preencha nome e raça', 'error');
            return;
        }
        
        if (name.length < 2 || name.length > 20) {
            this.showMessage('characterMessage', 'Nome deve ter 2-20 caracteres', 'error');
            return;
        }
        
        // Verificar se já existe personagem nesta classe
        if (this.characters[charClass]) {
            this.showMessage('characterMessage', 'Já existe personagem nesta classe', 'error');
            return;
        }
        
        // Criar personagem
        this.characters[charClass] = {
            name,
            race,
            class: charClass,
            level: 1,
            xp: 0,
            hp: 100,
            maxHp: 100,
            createdAt: new Date().toISOString()
        };
        
        // Salvar
        const allCharacters = JSON.parse(localStorage.getItem('characters') || '{}');
        allCharacters[this.currentUser.username] = this.characters;
        localStorage.setItem('characters', JSON.stringify(allCharacters));
        
        this.showMessage('characterMessage', 'Personagem criado!', 'success');
        
        setTimeout(() => {
            this.cancelCharacterCreation();
            this.updateCharacterList();
            
            // Auto-selecionar o personagem criado
            const card = document.querySelector(`[data-class="${charClass}"]`);
            if (card) this.selectCharacter(charClass, card);
        }, 1000);
    }
    
    // ===== ENTRAR NO JOGO =====
    enterWorld() {
        console.log('🌍 Entrando no mundo...', this.selectedCharacter);
        
        if (!this.selectedCharacter) {
            this.showMessage('characterMessage', 'Selecione um personagem', 'error');
            return;
        }
        
        // Salvar personagem atual
        localStorage.setItem('currentCharacter', JSON.stringify(this.selectedCharacter));
        
        // Transição para o jogo
        if (this.characterScreen) {
            this.characterScreen.style.opacity = '0';
            setTimeout(() => {
                this.characterScreen.style.display = 'none';
                if (this.gameContainer) {
                    this.gameContainer.style.display = 'block';
                    this.gameContainer.style.opacity = '0';
                    setTimeout(() => {
                        this.gameContainer.style.opacity = '1';
                        this.startGameplay();
                    }, 50);
                }
            }, 300);
        }
    }
    
    startGameplay() {
        console.log('🎮 Iniciando gameplay...');
        
        // Inicializar GameplayEngine se disponível
        if (typeof IntegratedGameplayEngine !== 'undefined') {
            try {
                window._gameplayEngine = new IntegratedGameplayEngine('gameCanvas', {
                    class: this.selectedCharacter.class,
                    name: this.selectedCharacter.name,
                    race: this.selectedCharacter.race,
                    level: this.selectedCharacter.level
                });
                window._gameplayEngine.start();
                console.log('✅ GameplayEngine iniciado');
            } catch (e) {
                console.error('❌ Erro ao iniciar GameplayEngine:', e);
                // Fallback - mostrar mensagem mas não travar
                this.showMessage('characterMessage', 'Erro ao iniciar jogo, recarregue a página', 'error');
            }
        } else {
            console.warn('⚠️ IntegratedGameplayEngine não disponível');
        }
    }
    
    // ===== LOGOUT =====
    logout() {
        console.log('🚪 Fazendo logout...');
        
        // Limpar dados da sessão
        this.currentUser = null;
        this.selectedCharacter = null;
        this.characters = {};
        
        localStorage.removeItem('currentUser');
        localStorage.removeItem('selectedCharacter');
        localStorage.removeItem('currentCharacter');
        
        // Parar gameplay se estiver rodando
        if (window._gameplayEngine && window._gameplayEngine.stop) {
            window._gameplayEngine.stop();
        }
        window._gameplayEngine = null;
        
        // Esconder telas de personagem e jogo imediatamente
        if (this.characterScreen) {
            this.characterScreen.style.display = 'none';
            this.characterScreen.style.opacity = '0';
        }
        if (this.gameContainer) {
            this.gameContainer.style.display = 'none';
            this.gameContainer.classList.remove('active');
        }
        
        // Mostrar tela de login
        if (this.loginScreen) {
            this.loginScreen.style.display = 'flex';
            this.loginScreen.style.opacity = '1';
        }
        
        // Limpar campos de login
        if (this.loginPassword) this.loginPassword.value = '';
        
        console.log('✅ Logout completo');
    }
    
    // ===== UTILIDADES =====
    showMessage(elementId, message, type = 'info') {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = message;
            element.className = `message ${type}`;
            element.style.display = 'block';
            
            setTimeout(() => {
                element.style.display = 'none';
            }, 5000);
        }
    }
}

// Exportar para uso global
window.LoginManager = LoginManager;
