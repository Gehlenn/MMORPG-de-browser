// === SESSION MANAGER ===

/**
 * Gerenciador de Sessão
 * Armazena dados do usuário e personagem selecionado
 */

export class SessionManager {
    constructor() {
        this.currentUser = null;
        this.currentCharacter = null;
        this.sessionData = {};
        
        this.initialize();
    }
    
    initialize() {
        console.log('👤 Initializing SessionManager...');
        this.loadFromStorage();
        console.log('✅ SessionManager initialized');
    }
    
    // === USER MANAGEMENT ===
    
    setCurrentUser(userData) {
        this.currentUser = userData;
        this.saveToStorage();
        console.log('👤 Current user set:', userData?.username);
    }
    
    getCurrentUser() {
        return this.currentUser;
    }
    
    isLoggedIn() {
        return this.currentUser !== null;
    }
    
    logout() {
        console.log('👤 Logging out user:', this.currentUser?.username);
        this.currentUser = null;
        this.currentCharacter = null;
        this.sessionData = {};
        this.clearStorage();
    }
    
    // === CHARACTER MANAGEMENT ===
    
    setCurrentCharacter(characterData) {
        this.currentCharacter = characterData;
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
