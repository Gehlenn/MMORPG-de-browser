/**
 * SessionManager - Gerenciador de Sessão Refatorado
 * Armazena dados do usuário e personagem selecionado
 * Parte do STEP 2 - Refatoração do Sistema de Login
 */

class SessionManager {
    constructor() {
        this.currentUser = null;
        this.currentCharacter = null;
        this.sessionData = {};
        this.isAuthenticated = false;
        
        this.initialize();
    }
    
    /**
     * Inicializa o SessionManager
     */
    initialize() {
        console.log('👤 Initializing SessionManager...');
        this.loadFromStorage();
        console.log('✅ SessionManager initialized');
    }
    
    // === USER MANAGEMENT ===
    
    /**
     * Define o usuário atual
     * @param {object} userData - Dados do usuário
     */
    setCurrentUser(userData) {
        this.currentUser = userData;
        this.isAuthenticated = !!userData;
        this.saveToStorage();
        console.log('👤 Current user set:', userData?.username);
    }
    
    /**
     * Obtém o usuário atual
     * @returns {object|null}
     */
    getCurrentUser() {
        return this.currentUser;
    }
    
    /**
     * Verifica se está autenticado
     * @returns {boolean}
     */
    isLoggedIn() {
        return this.isAuthenticated && this.currentUser !== null;
    }
    
    /**
     * Realiza logout
     */
    logout() {
        console.log('👤 Logging out user:', this.currentUser?.username);
        this.currentUser = null;
        this.currentCharacter = null;
        this.sessionData = {};
        this.isAuthenticated = false;
        this.clearStorage();
    }
    
    // === CHARACTER MANAGEMENT ===
    
    /**
     * Define o personagem atual
     * @param {object} characterData - Dados do personagem
     */
    setCurrentCharacter(characterData) {
        this.currentCharacter = characterData;
        this.saveToStorage();
        console.log('👥 Current character set:', characterData?.name);
    }
    
    /**
     * Obtém o personagem atual
     * @returns {object|null}
     */
    getCurrentCharacter() {
        return this.currentCharacter;
    }
    
    /**
     * Verifica se tem personagem selecionado
     * @returns {boolean}
     */
    hasSelectedCharacter() {
        return this.currentCharacter !== null;
    }
    
    /**
     * Limpa personagem selecionado
     */
    clearSelectedCharacter() {
        console.log('👥 Clearing selected character:', this.currentCharacter?.name);
        this.currentCharacter = null;
        this.saveToStorage();
    }
    
    // === SESSION DATA MANAGEMENT ===
    
    /**
     * Define dados da sessão
     * @param {string} key - Chave
     * @param {any} value - Valor
     */
    setSessionData(key, value) {
        this.sessionData[key] = value;
        this.saveToStorage();
    }
    
    /**
     * Obtém dados da sessão
     * @param {string} key - Chave
     * @param {any} defaultValue - Valor padrão
     * @returns {any}
     */
    getSessionData(key, defaultValue = null) {
        return this.sessionData[key] ?? defaultValue;
    }
    
    /**
     * Remove dados da sessão
     * @param {string} key - Chave
     */
    removeSessionData(key) {
        delete this.sessionData[key];
        this.saveToStorage();
    }
    
    /**
     * Limpa todos os dados da sessão
     */
    clearSessionData() {
        this.sessionData = {};
        this.saveToStorage();
    }
    
    // === STORAGE MANAGEMENT ===
    
    /**
     * Carrega dados do localStorage
     */
    loadFromStorage() {
        try {
            const sessionData = localStorage.getItem('mmorpg_session');
            if (sessionData) {
                const parsed = JSON.parse(sessionData);
                this.currentUser = parsed.currentUser || null;
                this.currentCharacter = parsed.currentCharacter || null;
                this.sessionData = parsed.sessionData || {};
                this.isAuthenticated = !!parsed.currentUser;
                console.log('📦 Session data loaded from storage');
            }
        } catch (error) {
            console.error('❌ Error loading session data:', error);
            this.clearStorage();
        }
    }
    
    /**
     * Salva dados no localStorage
     */
    saveToStorage() {
        try {
            const sessionData = {
                currentUser: this.currentUser,
                currentCharacter: this.currentCharacter,
                sessionData: this.sessionData,
                timestamp: Date.now()
            };
            localStorage.setItem('mmorpg_session', JSON.stringify(sessionData));
        } catch (error) {
            console.error('❌ Error saving session data:', error);
        }
    }
    
    /**
     * Limpa localStorage
     */
    clearStorage() {
        try {
            localStorage.removeItem('mmorpg_session');
            console.log('🗑️ Session storage cleared');
        } catch (error) {
            console.error('❌ Error clearing session storage:', error);
        }
    }
    
    // === VALIDATION ===
    
    /**
     * Valida sessão atual
     * @returns {boolean}
     */
    validateSession() {
        if (!this.isLoggedIn()) {
            return false;
        }
        
        if (!this.currentUser || !this.currentUser.id) {
            console.warn('⚠️ Invalid user data in session');
            return false;
        }
        
        // Validar timestamp (sessão expira em 24h)
        const sessionData = localStorage.getItem('mmorpg_session');
        if (sessionData) {
            try {
                const parsed = JSON.parse(sessionData);
                const sessionAge = Date.now() - (parsed.timestamp || 0);
                const maxAge = 24 * 60 * 60 * 1000; // 24 horas
                
                if (sessionAge > maxAge) {
                    console.warn('⚠️ Session expired');
                    this.logout();
                    return false;
                }
            } catch (error) {
                console.error('❌ Error validating session timestamp:', error);
                return false;
            }
        }
        
        return true;
    }
    
    /**
     * Renova sessão
     */
    refreshSession() {
        if (this.isLoggedIn()) {
            this.saveToStorage();
            console.log('🔄 Session refreshed');
        }
    }
    
    // === CHARACTER OPERATIONS ===
    
    /**
     * Obtém todos os personagens do usuário
     * @returns {array}
     */
    getUserCharacters() {
        if (!this.isLoggedIn()) {
            return [];
        }
        
        try {
            const charactersData = localStorage.getItem('mmorpg_characters');
            if (charactersData) {
                const parsed = JSON.parse(charactersData);
                return parsed[this.currentUser.username] || [];
            }
        } catch (error) {
            console.error('❌ Error loading user characters:', error);
        }
        
        return [];
    }
    
    /**
     * Salva personagens do usuário
     * @param {array} characters - Lista de personagens
     */
    saveUserCharacters(characters) {
        if (!this.isLoggedIn()) {
            console.warn('⚠️ Cannot save characters: user not logged in');
            return;
        }
        
        try {
            const charactersData = localStorage.getItem('mmorpg_characters') || '{}';
            const parsed = JSON.parse(charactersData);
            parsed[this.currentUser.username] = characters || [];
            localStorage.setItem('mmorpg_characters', JSON.stringify(parsed));
            console.log(`💾 Saved ${characters?.length || 0} characters for user ${this.currentUser.username}`);
        } catch (error) {
            console.error('❌ Error saving user characters:', error);
        }
    }
    
    /**
     * Adiciona personagem ao usuário
     * @param {object} character - Dados do personagem
     */
    addCharacter(character) {
        if (!this.isLoggedIn()) {
            console.warn('⚠️ Cannot add character: user not logged in');
            return false;
        }
        
        const characters = this.getUserCharacters();
        
        // Verificar limite de personagens
        if (characters.length >= 4) {
            console.warn('⚠️ Maximum character limit reached');
            return false;
        }
        
        // Verificar nome duplicado
        if (characters.some(char => char.name.toLowerCase() === character.name.toLowerCase())) {
            console.warn('⚠️ Character name already exists');
            return false;
        }
        
        characters.push(character);
        this.saveUserCharacters(characters);
        return true;
    }
    
    // === DEBUG INFO ===
    
    /**
     * Obtém informações de debug
     * @returns {object}
     */
    getDebugInfo() {
        return {
            isAuthenticated: this.isAuthenticated,
            currentUser: this.currentUser ? {
                username: this.currentUser.username,
                id: this.currentUser.id
            } : null,
            currentCharacter: this.currentCharacter ? {
                name: this.currentCharacter.name,
                id: this.currentCharacter.id
            } : null,
            sessionDataKeys: Object.keys(this.sessionData),
            userCharactersCount: this.getUserCharacters().length
        };
    }
    
    /**
     * Exporta dados da sessão
     * @returns {object}
     */
    exportSession() {
        return {
            currentUser: this.currentUser,
            currentCharacter: this.currentCharacter,
            sessionData: this.sessionData,
            userCharacters: this.getUserCharacters(),
            timestamp: Date.now()
        };
    }
    
    /**
     * Importa dados da sessão
     * @param {object} sessionData - Dados da sessão
     */
    importSession(sessionData) {
        if (sessionData.currentUser) {
            this.setCurrentUser(sessionData.currentUser);
        }
        
        if (sessionData.currentCharacter) {
            this.setCurrentCharacter(sessionData.currentCharacter);
        }
        
        if (sessionData.sessionData) {
            this.sessionData = { ...this.sessionData, ...sessionData.sessionData };
        }
        
        if (sessionData.userCharacters) {
            this.saveUserCharacters(sessionData.userCharacters);
        }
        
        console.log('📥 Session data imported');
    }
}

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.SessionManager = SessionManager;
}

// Exportar para módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SessionManager;
}
        this.saveToStorage();
        console.log('👥 Current character set:', characterData?.name);
    }
    
    getCurrentCharacter() {
        return this.currentCharacter;
    }
    
    hasSelectedCharacter() {
        return this.currentCharacter !== null;
    }
    
    clearCurrentCharacter() {
        this.currentCharacter = null;
        this.saveToStorage();
    }
    
    // === SESSION DATA ===
    
    setSessionData(key, value) {
        this.sessionData[key] = value;
        this.saveToStorage();
    }
    
    getSessionData(key) {
        return this.sessionData[key];
    }
    
    removeSessionData(key) {
        delete this.sessionData[key];
        this.saveToStorage();
    }
    
    clearSessionData() {
        this.sessionData = {};
        this.saveToStorage();
    }
    
    // === STORAGE MANAGEMENT ===
    
    saveToStorage() {
        const session = {
            currentUser: this.currentUser,
            currentCharacter: this.currentCharacter,
            sessionData: this.sessionData,
            timestamp: Date.now()
        };
        
        try {
            localStorage.setItem('legacyOfKomodo_session', JSON.stringify(session));
        } catch (error) {
            console.error('❌ Failed to save session to storage:', error);
        }
    }
    
    loadFromStorage() {
        try {
            const stored = localStorage.getItem('legacyOfKomodo_session');
            if (stored) {
                const session = JSON.parse(stored);
                
                // Verificar se a sessão não expirou (24 horas)
                const maxAge = 24 * 60 * 60 * 1000; // 24 horas
                if (Date.now() - session.timestamp < maxAge) {
                    this.currentUser = session.currentUser;
                    this.currentCharacter = session.currentCharacter;
                    this.sessionData = session.sessionData || {};
                    
                    console.log('📦 Session loaded from storage');
                } else {
                    console.log('⏰ Session expired, clearing storage');
                    this.clearStorage();
                }
            }
        } catch (error) {
            console.error('❌ Failed to load session from storage:', error);
            this.clearStorage();
        }
    }
    
    clearStorage() {
        try {
            localStorage.removeItem('legacyOfKomodo_session');
        } catch (error) {
            console.error('❌ Failed to clear storage:', error);
        }
    }
    
    // === UTILITY METHODS ===
    
    isValid() {
        return this.isLoggedIn() && this.hasSelectedCharacter();
    }
    
    getSessionInfo() {
        return {
            currentUser: this.getCurrentUser(),
            currentCharacter: this.getCurrentCharacter(),
            isLoggedIn: this.isLoggedIn(),
            hasSelectedCharacter: this.hasSelectedCharacter(),
            isValid: this.isValid(),
            sessionDataKeys: Object.keys(this.sessionData)
        };
    }
    
    reset() {
        console.log('🔄 Resetting SessionManager');
        this.currentUser = null;
        this.currentCharacter = null;
        this.sessionData = {};
        this.clearStorage();
    }
    
    // === USER DATA MANAGEMENT ===
    
    saveUserData(userData) {
        // Salvar dados do usuário no localStorage
        try {
            const users = JSON.parse(localStorage.getItem('legacyOfKomodo_users') || '{}');
            users[userData.username] = userData;
            localStorage.setItem('legacyOfKomodo_users', JSON.stringify(users));
            console.log('💾 User data saved:', userData.username);
        } catch (error) {
            console.error('❌ Failed to save user data:', error);
        }
    }
    
    loadUserData(username) {
        try {
            const users = JSON.parse(localStorage.getItem('legacyOfKomodo_users') || '{}');
            return users[username] || null;
        } catch (error) {
            console.error('❌ Failed to load user data:', error);
            return null;
        }
    }
    
    userExists(username) {
        return this.loadUserData(username) !== null;
    }
    
    validateUser(username, password) {
        const userData = this.loadUserData(username);
        if (!userData) return false;
        
        return userData.password === password;
    }
    
    // === CHARACTER DATA MANAGEMENT ===
    
    saveCharacterData(username, characterData) {
        try {
            const characters = JSON.parse(localStorage.getItem('legacyOfKomodo_characters') || '{}');
            if (!characters[username]) {
                characters[username] = [];
            }
            
            // Verificar se personagem já existe
            const existingIndex = characters[username].findIndex(c => c.id === characterData.id);
            if (existingIndex >= 0) {
                characters[username][existingIndex] = characterData;
            } else {
                characters[username].push(characterData);
            }
            
            localStorage.setItem('legacyOfKomodo_characters', JSON.stringify(characters));
            console.log('💾 Character data saved:', characterData.name);
        } catch (error) {
            console.error('❌ Failed to save character data:', error);
        }
    }
    
    loadCharacters(username) {
        try {
            const characters = JSON.parse(localStorage.getItem('legacyOfKomodo_characters') || '{}');
            return characters[username] || [];
        } catch (error) {
            console.error('❌ Failed to load characters:', error);
            return [];
        }
    }
    
    deleteCharacter(username, characterId) {
        try {
            const characters = JSON.parse(localStorage.getItem('legacyOfKomodo_characters') || '{}');
            if (characters[username]) {
                characters[username] = characters[username].filter(c => c.id !== characterId);
                localStorage.setItem('legacyOfKomodo_characters', JSON.stringify(characters));
                console.log('🗑️ Character deleted:', characterId);
                
                // Limpar personagem selecionado se for o deletado
                if (this.currentCharacter?.id === characterId) {
                    this.clearCurrentCharacter();
                }
                
                return true;
            }
        } catch (error) {
            console.error('❌ Failed to delete character:', error);
        }
        return false;
    }
    
    characterExists(username, characterName) {
        const characters = this.loadCharacters(username);
        return characters.some(c => c.name.toLowerCase() === characterName.toLowerCase());
    }
    
    // === SESSION VALIDATION ===
    
    validateSession() {
        if (!this.currentUser) {
            return { valid: false, reason: 'No user logged in' };
        }
        
        if (!this.currentCharacter) {
            return { valid: false, reason: 'No character selected' };
        }
        
        // Verificar se o usuário ainda existe
        if (!this.userExists(this.currentUser.username)) {
            return { valid: false, reason: 'User no longer exists' };
        }
        
        // Verificar se o personagem ainda existe
        const characters = this.loadCharacters(this.currentUser.username);
        if (!characters.find(c => c.id === this.currentCharacter.id)) {
            return { valid: false, reason: 'Character no longer exists' };
        }
        
        return { valid: true };
    }
    
    repairSession() {
        const validation = this.validateSession();
        if (!validation.valid) {
            console.warn('⚠️ Session invalid:', validation.reason);
            
            // Tentar reparar
            if (this.currentUser && !this.userExists(this.currentUser.username)) {
                console.log('🔧 User no longer exists, logging out');
                this.logout();
                return false;
            }
            
            if (this.currentCharacter && this.currentUser) {
                const characters = this.loadCharacters(this.currentUser.username);
                if (!characters.find(c => c.id === this.currentCharacter.id)) {
                    console.log('🔧 Character no longer exists, clearing selection');
                    this.clearCurrentCharacter();
                }
            }
            
            return false;
        }
        
        return true;
    }
}

// Export for use
if (typeof window !== 'undefined') {
    window.SessionManager = SessionManager;
}
