/**
 * SessionManager Refactored - Gerenciador de Sessão Refatorado
 * Implementa STEP 2 - Fix Login System (parte 3)
 * Responsabilidades: Armazena session e selected character, sem lógica de UI
 */

class SessionManager_Refactored {
    constructor() {
        // Dados de sessão
        this.currentUser = null;
        this.currentCharacter = null;
        this.sessionData = {};
        
        // Estado da sessão
        this.isAuthenticated = false;
        this.sessionTimestamp = null;
        this.sessionTimeout = 24 * 60 * 60 * 1000; // 24 horas
        
        // Configurações
        this.config = {
            storageKey: 'legacy_of_komodo_session',
            charactersStorageKey: 'legacy_of_komodo_characters',
            autoSave: true,
            encryptionEnabled: false,
            maxCharactersPerUser: 4
        };
        
        // Event listeners
        this.eventListeners = new Map();
        
        this.initialize();
    }
    
    /**
     * Inicializa o SessionManager
     */
    initialize() {
        console.log('👤 Initializing SessionManager_Refactored...');
        this.loadFromStorage();
        this.validateSession();
        this.setupAutoSave();
        console.log('✅ SessionManager_Refactored initialized');
    }
    
    /**
     * Configura auto-save
     */
    setupAutoSave() {
        if (this.config.autoSave) {
            // Salvar a cada 30 segundos
            setInterval(() => {
                if (this.isAuthenticated) {
                    this.saveToStorage();
                }
            }, 30000);
            
            // Salvar quando página está fechando
            window.addEventListener('beforeunload', () => {
                if (this.isAuthenticated) {
                    this.saveToStorage();
                }
            });
            
            // Salvar quando página perde foco
            window.addEventListener('blur', () => {
                if (this.isAuthenticated) {
                    this.saveToStorage();
                }
            });
        }
    }
    
    /**
     * Define usuário atual
     * @param {object} userData - Dados do usuário
     */
    setCurrentUser(userData) {
        if (!userData || !userData.id || !userData.username) {
            console.error('❌ Invalid user data provided');
            return false;
        }
        
        this.currentUser = {
            id: userData.id,
            username: userData.username,
            email: userData.email || null,
            createdAt: userData.createdAt || new Date().toISOString(),
            lastLogin: new Date().toISOString(),
            ...userData
        };
        
        this.isAuthenticated = true;
        this.sessionTimestamp = Date.now();
        
        if (this.config.autoSave) {
            this.saveToStorage();
        }
        
        console.log('👤 Current user set:', this.currentUser.username);
        this.emit('user_set', this.currentUser);
        
        return true;
    }
    
    /**
     * Obtém usuário atual
     * @returns {object|null}
     */
    getCurrentUser() {
        return this.currentUser ? { ...this.currentUser } : null;
    }
    
    /**
     * Verifica se está autenticado
     * @returns {boolean}
     */
    isLoggedIn() {
        return this.isAuthenticated && this.currentUser !== null;
    }
    
    /**
     * Define personagem atual
     * @param {object} characterData - Dados do personagem
     */
    setCurrentCharacter(characterData) {
        if (!characterData || !characterData.id) {
            console.error('❌ Invalid character data provided');
            return false;
        }
        
        // Verificar se o personagem pertence ao usuário atual
        if (this.currentUser && characterData.userId !== this.currentUser.id) {
            console.error('❌ Character does not belong to current user');
            return false;
        }
        
        this.currentCharacter = {
            id: characterData.id,
            userId: characterData.userId,
            name: characterData.name,
            race: characterData.race,
            class: characterData.class,
            level: characterData.level || 1,
            hp: characterData.hp || 100,
            maxHp: characterData.maxHp || 100,
            x: characterData.x || 400,
            y: characterData.y || 300,
            createdAt: characterData.createdAt || new Date().toISOString(),
            lastPlayed: new Date().toISOString(),
            ...characterData
        };
        
        if (this.config.autoSave) {
            this.saveToStorage();
        }
        
        console.log('👥 Current character set:', this.currentCharacter.name);
        this.emit('character_set', this.currentCharacter);
        
        return true;
    }
    
    /**
     * Obtém personagem atual
     * @returns {object|null}
     */
    getCurrentCharacter() {
        return this.currentCharacter ? { ...this.currentCharacter } : null;
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
        const previousCharacter = this.currentCharacter;
        this.currentCharacter = null;
        
        if (this.config.autoSave) {
            this.saveToStorage();
        }
        
        console.log('👥 Selected character cleared:', previousCharacter?.name);
        this.emit('character_cleared', previousCharacter);
    }
    
    /**
     * Define dados da sessão
     * @param {string} key - Chave
     * @param {any} value - Valor
     */
    setSessionData(key, value) {
        if (typeof key !== 'string' || key.trim() === '') {
            console.error('❌ Invalid session data key');
            return false;
        }
        
        this.sessionData[key] = value;
        
        if (this.config.autoSave) {
            this.saveToStorage();
        }
        
        console.log('📝 Session data set:', key);
        this.emit('session_data_set', { key, value });
        
        return true;
    }
    
    /**
     * Obtém dados da sessão
     * @param {string} key - Chave
     * @param {any} defaultValue - Valor padrão
     * @returns {any}
     */
    getSessionData(key, defaultValue = null) {
        return this.sessionData.hasOwnProperty(key) ? this.sessionData[key] : defaultValue;
    }
    
    /**
     * Remove dados da sessão
     * @param {string} key - Chave
     */
    removeSessionData(key) {
        if (this.sessionData.hasOwnProperty(key)) {
            delete this.sessionData[key];
            
            if (this.config.autoSave) {
                this.saveToStorage();
            }
            
            console.log('🗑️ Session data removed:', key);
            this.emit('session_data_removed', key);
            
            return true;
        }
        
        return false;
    }
    
    /**
     * Limpa todos os dados da sessão
     */
    clearSessionData() {
        const previousData = { ...this.sessionData };
        this.sessionData = {};
        
        if (this.config.autoSave) {
            this.saveToStorage();
        }
        
        console.log('🗑️ All session data cleared');
        this.emit('session_data_cleared', previousData);
    }
    
    /**
     * Carrega dados do localStorage
     */
    loadFromStorage() {
        try {
            const sessionData = localStorage.getItem(this.config.storageKey);
            if (sessionData) {
                const parsed = JSON.parse(sessionData);
                
                // Validar estrutura
                if (this.isValidSessionData(parsed)) {
                    this.currentUser = parsed.currentUser || null;
                    this.currentCharacter = parsed.currentCharacter || null;
                    this.sessionData = parsed.sessionData || {};
                    this.sessionTimestamp = parsed.timestamp || Date.now();
                    this.isAuthenticated = !!parsed.currentUser;
                    
                    console.log('📦 Session data loaded from storage');
                    this.emit('session_loaded', this.getSessionInfo());
                } else {
                    console.warn('⚠️ Invalid session data format, clearing');
                    this.clearStorage();
                }
            } else {
                console.log('ℹ️ No session data found in storage');
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
                timestamp: this.sessionTimestamp || Date.now(),
                version: '1.0'
            };
            
            let dataToSave = JSON.stringify(sessionData);
            
            // Criptografia (se habilitada)
            if (this.config.encryptionEnabled) {
                dataToSave = this.encryptData(dataToSave);
            }
            
            localStorage.setItem(this.config.storageKey, dataToSave);
            console.log('💾 Session data saved to storage');
            this.emit('session_saved', this.getSessionInfo());
            
        } catch (error) {
            console.error('❌ Error saving session data:', error);
            this.emit('session_save_error', error);
        }
    }
    
    /**
     * Limpa localStorage
     */
    clearStorage() {
        try {
            localStorage.removeItem(this.config.storageKey);
            localStorage.removeItem(this.config.charactersStorageKey);
            console.log('🗑️ Session storage cleared');
            this.emit('storage_cleared');
        } catch (error) {
            console.error('❌ Error clearing storage:', error);
        }
    }
    
    /**
     * Valida dados da sessão
     * @param {object} data - Dados a validar
     * @returns {boolean}
     */
    isValidSessionData(data) {
        if (!data || typeof data !== 'object') {
            return false;
        }
        
        // Verificar campos obrigatórios
        if (!data.hasOwnProperty('currentUser') && !data.hasOwnProperty('currentCharacter') && !data.hasOwnProperty('sessionData')) {
            return false;
        }
        
        // Validar timestamp se existir
        if (data.timestamp && typeof data.timestamp !== 'number') {
            return false;
        }
        
        return true;
    }
    
    /**
     * Valida sessão atual
     * @returns {boolean}
     */
    validateSession() {
        if (!this.isLoggedIn()) {
            console.log('ℹ️ No active session to validate');
            return false;
        }
        
        // Validar timestamp
        if (this.sessionTimestamp) {
            const sessionAge = Date.now() - this.sessionTimestamp;
            
            if (sessionAge > this.sessionTimeout) {
                console.warn('⚠️ Session expired, logging out');
                this.logout();
                return false;
            }
        }
        
        // Validar dados do usuário
        if (!this.currentUser || !this.currentUser.id || !this.currentUser.username) {
            console.warn('⚠️ Invalid user data in session, logging out');
            this.logout();
            return false;
        }
        
        // Validar personagem se selecionado
        if (this.currentCharacter) {
            if (!this.currentCharacter.id || !this.currentCharacter.name) {
                console.warn('⚠️ Invalid character data, clearing selection');
                this.clearSelectedCharacter();
            }
        }
        
        console.log('✅ Session validated successfully');
        return true;
    }
    
    /**
     * Renova sessão
     */
    refreshSession() {
        if (this.isLoggedIn()) {
            this.sessionTimestamp = Date.now();
            
            if (this.config.autoSave) {
                this.saveToStorage();
            }
            
            console.log('🔄 Session refreshed');
            this.emit('session_refreshed', this.getSessionInfo());
        }
    }
    
    /**
     * Obtém personagens do usuário
     * @returns {array}
     */
    getUserCharacters() {
        if (!this.isLoggedIn()) {
            console.warn('⚠️ Cannot get characters: user not logged in');
            return [];
        }
        
        try {
            const charactersData = localStorage.getItem(this.config.charactersStorageKey);
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
            return false;
        }
        
        if (!Array.isArray(characters)) {
            console.error('❌ Characters must be an array');
            return false;
        }
        
        try {
            const allCharactersData = localStorage.getItem(this.config.charactersStorageKey) || '{}';
            const parsed = JSON.parse(allCharactersData);
            
            parsed[this.currentUser.username] = characters || [];
            
            localStorage.setItem(this.config.charactersStorageKey, JSON.stringify(parsed));
            
            console.log(`💾 Saved ${characters.length} characters for user ${this.currentUser.username}`);
            this.emit('characters_saved', { username: this.currentUser.username, count: characters.length });
            
            return true;
        } catch (error) {
            console.error('❌ Error saving user characters:', error);
            return false;
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
        
        if (!character || !character.id || !character.name) {
            console.error('❌ Invalid character data');
            return false;
        }
        
        const characters = this.getUserCharacters();
        
        // Verificar limite de personagens
        if (characters.length >= this.config.maxCharactersPerUser) {
            console.warn('⚠️ Maximum character limit reached');
            return false;
        }
        
        // Verificar nome duplicado
        if (characters.some(char => char.name.toLowerCase() === character.name.toLowerCase())) {
            console.warn('⚠️ Character name already exists');
            return false;
        }
        
        // Adicionar dados padrão
        const newCharacter = {
            id: character.id,
            userId: this.currentUser.id,
            name: character.name,
            race: character.race,
            class: character.class,
            level: 1,
            hp: 100,
            maxHp: 100,
            x: 400,
            y: 300,
            createdAt: new Date().toISOString(),
            lastPlayed: new Date().toISOString(),
            ...character
        };
        
        characters.push(newCharacter);
        return this.saveUserCharacters(characters);
    }
    
    /**
     * Remove personagem do usuário
     * @param {string} characterId - ID do personagem
     */
    removeCharacter(characterId) {
        if (!this.isLoggedIn()) {
            console.warn('⚠️ Cannot remove character: user not logged in');
            return false;
        }
        
        const characters = this.getUserCharacters();
        const index = characters.findIndex(char => char.id === characterId);
        
        if (index === -1) {
            console.warn('⚠️ Character not found');
            return false;
        }
        
        const removedCharacter = characters.splice(index, 1)[0];
        
        // Limpar seleção se for o personagem atual
        if (this.currentCharacter?.id === characterId) {
            this.clearSelectedCharacter();
        }
        
        const success = this.saveUserCharacters(characters);
        
        if (success) {
            console.log('🗑️ Character removed:', removedCharacter.name);
            this.emit('character_removed', removedCharacter);
        }
        
        return success;
    }
    
    /**
     * Atualiza personagem
     * @param {string} characterId - ID do personagem
     * @param {object} updates - Dados a atualizar
     */
    updateCharacter(characterId, updates) {
        if (!this.isLoggedIn()) {
            console.warn('⚠️ Cannot update character: user not logged in');
            return false;
        }
        
        const characters = this.getUserCharacters();
        const character = characters.find(char => char.id === characterId);
        
        if (!character) {
            console.warn('⚠️ Character not found');
            return false;
        }
        
        // Atualizar dados
        Object.assign(character, updates, {
            lastPlayed: new Date().toISOString()
        });
        
        // Atualizar personagem atual se for o mesmo
        if (this.currentCharacter?.id === characterId) {
            this.setCurrentCharacter(character);
        }
        
        const success = this.saveUserCharacters(characters);
        
        if (success) {
            console.log('🔄 Character updated:', character.name);
            this.emit('character_updated', character);
        }
        
        return success;
    }
    
    /**
     * Realiza logout
     */
    logout() {
        const previousUser = this.currentUser;
        const previousCharacter = this.currentCharacter;
        
        console.log('👤 Logging out user:', previousUser?.username);
        
        this.currentUser = null;
        this.currentCharacter = null;
        this.sessionData = {};
        this.isAuthenticated = false;
        this.sessionTimestamp = null;
        
        this.clearStorage();
        
        this.emit('logged_out', { previousUser, previousCharacter });
    }
    
    /**
     * Criptografa dados (placeholder)
     * @param {string} data - Dados a criptografar
     * @returns {string}
     */
    encryptData(data) {
        // Implementação básica - em produção usar criptografia real
        return btoa(data);
    }
    
    /**
     * Descriptografa dados (placeholder)
     * @param {string} data - Dados a descriptografar
     * @returns {string}
     */
    decryptData(data) {
        // Implementação básica - em produção usar criptografia real
        try {
            return atob(data);
        } catch {
            return '{}';
        }
    }
    
    /**
     * Obtém informações da sessão
     * @returns {object}
     */
    getSessionInfo() {
        return {
            isAuthenticated: this.isAuthenticated,
            currentUser: this.getCurrentUser(),
            currentCharacter: this.getCurrentCharacter(),
            sessionTimestamp: this.sessionTimestamp,
            sessionAge: this.sessionTimestamp ? Date.now() - this.sessionTimestamp : 0,
            charactersCount: this.getUserCharacters().length,
            sessionDataKeys: Object.keys(this.sessionData)
        };
    }
    
    /**
     * Exporta dados da sessão
     * @returns {object}
     */
    exportSession() {
        return {
            user: this.getCurrentUser(),
            character: this.getCurrentCharacter(),
            characters: this.getUserCharacters(),
            sessionData: { ...this.sessionData },
            timestamp: this.sessionTimestamp,
            exportedAt: new Date().toISOString()
        };
    }
    
    /**
     * Importa dados da sessão
     * @param {object} sessionData - Dados da sessão
     */
    importSession(sessionData) {
        if (!sessionData || typeof sessionData !== 'object') {
            console.error('❌ Invalid session data for import');
            return false;
        }
        
        try {
            if (sessionData.user) {
                this.setCurrentUser(sessionData.user);
            }
            
            if (sessionData.character) {
                this.setCurrentCharacter(sessionData.character);
            }
            
            if (sessionData.sessionData) {
                this.sessionData = { ...this.sessionData, ...sessionData.sessionData };
            }
            
            if (sessionData.characters && Array.isArray(sessionData.characters)) {
                this.saveUserCharacters(sessionData.characters);
            }
            
            console.log('📥 Session data imported successfully');
            this.emit('session_imported', this.getSessionInfo());
            
            return true;
        } catch (error) {
            console.error('❌ Error importing session data:', error);
            return false;
        }
    }
    
    /**
     * Adiciona event listener
     * @param {string} event - Nome do evento
     * @param {function} callback - Função callback
     */
    addEventListener(event, callback) {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, []);
        }
        this.eventListeners.get(event).push(callback);
    }
    
    /**
     * Remove event listener
     * @param {string} event - Nome do evento
     * @param {function} callback - Função callback
     */
    removeEventListener(event, callback) {
        const listeners = this.eventListeners.get(event);
        if (listeners) {
            const index = listeners.indexOf(callback);
            if (index > -1) {
                listeners.splice(index, 1);
            }
        }
    }
    
    /**
     * Emite evento
     * @param {string} event - Nome do evento
     * @param {object} data - Dados do evento
     */
    emit(event, data) {
        const listeners = this.eventListeners.get(event);
        if (listeners) {
            listeners.forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`❌ Error in session event listener for ${event}:`, error);
                }
            });
        }
        
        // Evento global
        const globalEvent = new CustomEvent(`session_${event}`, { detail: data });
        window.dispatchEvent(globalEvent);
    }
    
    /**
     * Destrói o SessionManager
     */
    destroy() {
        console.log('🗑️ Destroying SessionManager');
        
        // Salvar dados finais
        if (this.isLoggedIn() && this.config.autoSave) {
            this.saveToStorage();
        }
        
        // Limpar listeners
        this.eventListeners.clear();
        
        // Limpar dados
        this.currentUser = null;
        this.currentCharacter = null;
        this.sessionData = {};
        this.isAuthenticated = false;
        this.sessionTimestamp = null;
        
        console.log('✅ SessionManager destroyed');
    }
    
    /**
     * Obtém informações de debug
     * @returns {object}
     */
    getDebugInfo() {
        return {
            isAuthenticated: this.isAuthenticated,
            currentUser: this.currentUser ? {
                id: this.currentUser.id,
                username: this.currentUser.username
            } : null,
            currentCharacter: this.currentCharacter ? {
                id: this.currentCharacter.id,
                name: this.currentCharacter.name
            } : null,
            sessionTimestamp: this.sessionTimestamp,
            sessionAge: this.sessionTimestamp ? Date.now() - this.sessionTimestamp : 0,
            sessionDataKeys: Object.keys(this.sessionData),
            charactersCount: this.getUserCharacters().length,
            eventListenersCount: Array.from(this.eventListeners.values())
                .reduce((total, listeners) => total + listeners.length, 0),
            storageKeys: {
                session: !!localStorage.getItem(this.config.storageKey),
                characters: !!localStorage.getItem(this.config.charactersStorageKey)
            }
        };
    }
}

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.SessionManager_Refactored = SessionManager_Refactored;
}

// Exportar para módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SessionManager_Refactored;
}
