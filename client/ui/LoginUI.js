// === LOGIN UI ===

/**
 * Interface de Login
 * Gerencia apenas a UI de login, sem lógica de negócio
 */

export class LoginUI {
    constructor() {
        this.elements = {
            loginScreen: null,
            usernameInput: null,
            passwordInput: null,
            loginBtn: null,
            createAccountBtn: null,
            messageContainer: null
        };
        
        this.callbacks = {
            onLogin: null,
            onCreateAccount: null
        };
        
        this.initialize();
    }
    
    initialize() {
        console.log('🔐 Initializing LoginUI...');
        this.cacheElements();
        this.bindEvents();
        console.log('✅ LoginUI initialized');
    }
    
    cacheElements() {
        this.elements = {
            loginScreen: document.getElementById('loginScreen'),
            usernameInput: document.getElementById('username'),
            passwordInput: document.getElementById('password'),
            loginBtn: document.getElementById('loginBtn'),
            createAccountBtn: document.getElementById('createAccountBtn'),
            messageContainer: document.getElementById('loginMessage')
        };
        
        // Verificar elementos
        Object.entries(this.elements).forEach(([name, element]) => {
            if (!element) {
                console.warn(`⚠️ LoginUI element not found: ${name}`);
            }
        });
    }
    
    bindEvents() {
        if (this.elements.loginBtn) {
            this.elements.loginBtn.addEventListener('click', () => this.handleLogin());
        }
        
        if (this.elements.createAccountBtn) {
            this.elements.createAccountBtn.addEventListener('click', () => this.handleCreateAccount());
        }
        
        if (this.elements.usernameInput) {
            this.elements.usernameInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.handleLogin();
            });
        }
        
        if (this.elements.passwordInput) {
            this.elements.passwordInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.handleLogin();
            });
        }
    }
    
    handleLogin() {
        const username = this.getUsername();
        const password = this.getPassword();
        
        if (!username || !password) {
            this.showMessage('error', 'Por favor, preencha todos os campos');
            return;
        }
        
        if (this.callbacks.onLogin) {
            this.callbacks.onLogin(username, password);
        }
    }
    
    handleCreateAccount() {
        this.showAccountCreationModal();
    }
    
    getUsername() {
        return this.elements.usernameInput?.value?.trim() || '';
    }
    
    getPassword() {
        return this.elements.passwordInput?.value || '';
    }
    
    setUsername(username) {
        if (this.elements.usernameInput) {
            this.elements.usernameInput.value = username;
        }
    }
    
    setPassword(password) {
        if (this.elements.passwordInput) {
            this.elements.passwordInput.value = password;
        }
    }
    
    clearInputs() {
        this.setUsername('');
        this.setPassword('');
    }
    
    show() {
        if (this.elements.loginScreen) {
            this.elements.loginScreen.style.display = 'block';
        }
        this.clearInputs();
        this.clearMessage();
    }
    
    hide() {
        if (this.elements.loginScreen) {
            this.elements.loginScreen.style.display = 'none';
        }
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
    
    setLoading(loading) {
        if (this.elements.loginBtn) {
            this.elements.loginBtn.disabled = loading;
            this.elements.loginBtn.textContent = loading ? 'Conectando...' : 'Login';
        }
        
        if (this.elements.createAccountBtn) {
            this.elements.createAccountBtn.disabled = loading;
        }
    }
    
    showAccountCreationModal() {
        this.showModal('accountCreation');
    }
    
    showModal(type) {
        // Criar modal se não existir
        let modal = document.getElementById('modalOverlay');
        if (!modal) {
            modal = this.createModalOverlay();
        }
        
        let content;
        switch (type) {
            case 'accountCreation':
                content = this.createAccountCreationContent();
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
    
    createAccountCreationContent() {
        return `
            <div class="modal-content">
                <h3>Criar Nova Conta</h3>
                <div class="form-group">
                    <label>Nome de Usuário:</label>
                    <input type="text" id="modalUsername" placeholder="Digite seu nome de usuário">
                </div>
                <div class="form-group">
                    <label>Email:</label>
                    <input type="email" id="modalEmail" placeholder="Digite seu email">
                </div>
                <div class="form-group">
                    <label>Senha:</label>
                    <input type="password" id="modalPassword" placeholder="Digite sua senha">
                </div>
                <div class="form-group">
                    <label>Confirmar Senha:</label>
                    <input type="password" id="modalConfirmPassword" placeholder="Confirme sua senha">
                </div>
                <div class="form-buttons">
                    <button id="confirmCreateAccount" class="btn-primary">Criar Conta</button>
                    <button id="cancelCreateAccount" class="btn-secondary">Cancelar</button>
                </div>
            </div>
        `;
    }
    
    bindModalEvents(type) {
        switch (type) {
            case 'accountCreation':
                const confirmBtn = document.getElementById('confirmCreateAccount');
                const cancelBtn = document.getElementById('cancelCreateAccount');
                
                if (confirmBtn) {
                    confirmBtn.addEventListener('click', () => this.handleAccountCreation());
                }
                
                if (cancelBtn) {
                    cancelBtn.addEventListener('click', () => this.hideModal());
                }
                
                // Enter key
                ['modalUsername', 'modalEmail', 'modalPassword', 'modalConfirmPassword'].forEach(id => {
                    const input = document.getElementById(id);
                    if (input) {
                        input.addEventListener('keypress', (e) => {
                            if (e.key === 'Enter') this.handleAccountCreation();
                        });
                    }
                });
                break;
        }
    }
    
    handleAccountCreation() {
        const username = document.getElementById('modalUsername')?.value?.trim();
        const email = document.getElementById('modalEmail')?.value?.trim();
        const password = document.getElementById('modalPassword')?.value;
        const confirmPassword = document.getElementById('modalConfirmPassword')?.value;
        
        // Validação
        if (!username || !email || !password || !confirmPassword) {
            this.showModalMessage('Por favor, preencha todos os campos');
            return;
        }
        
        if (password !== confirmPassword) {
            this.showModalMessage('As senhas não coincidem');
            return;
        }
        
        if (password.length < 6) {
            this.showModalMessage('A senha deve ter pelo menos 6 caracteres');
            return;
        }
        
        if (!email.includes('@')) {
            this.showModalMessage('Email inválido');
            return;
        }
        
        // Chamar callback
        if (this.callbacks.onCreateAccount) {
            this.callbacks.onCreateAccount(username, email, password);
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
    
    onLogin(callback) {
        this.callbacks.onLogin = callback;
    }
    
    onCreateAccount(callback) {
        this.callbacks.onCreateAccount = callback;
    }
    
    // === UTILITY METHODS ===
    
    getElements() {
        return { ...this.elements };
    }
    
    isReady() {
        return this.elements.loginScreen && 
               this.elements.usernameInput && 
               this.elements.passwordInput;
    }
}

// Export for use
if (typeof window !== 'undefined') {
    window.LoginUI = LoginUI;
}
