/**
 * LocalDataManager - Sistema de Dados Locais para Desenvolvimento
 * Gerencia persistência de dados em localStorage para desenvolvimento offline
 */

class LocalDataManager {
    constructor() {
        this.prefix = 'eldoria_';
        this.version = 'v0.3.7v';
        this.isDevelopmentMode = true;
        
        // Estrutura de dados
        this.dataStructure = {
            accounts: {},
            characters: {},
            gameSettings: {
                soundEnabled: true,
                musicVolume: 0.5,
                graphicsQuality: 'medium',
                showFPS: false
            },
            playerProgress: {},
            worldState: {
                lastLoginTime: null,
                totalPlayTime: 0,
                achievements: []
            }
        };
        
        this.initializeData();
    }
    
    /**
     * Inicializa estrutura de dados se não existir
     */
    initializeData() {
        // Verificar se dados existem
        const existingData = this.getData('accounts');
        
        if (!existingData) {
            // Criar estrutura inicial
            this.setData('accounts', {});
            this.setData('characters', {});
            this.setData('gameSettings', this.dataStructure.gameSettings);
            this.setData('worldState', this.dataStructure.worldState);
            this.setData('playerProgress', {});
            
            console.log('🏠 Estrutura de dados local inicializada');
        }
        
        // Verificar versão e migrar se necessário
        this.checkAndMigrateData();
    }
    
    /**
     * Verifica versão dos dados e migra se necessário
     */
    checkAndMigrateData() {
        const currentVersion = this.getData('version');
        
        if (!currentVersion || currentVersion !== this.version) {
            console.log('🔄 Migrando dados para versão', this.version);
            this.migrateData(currentVersion);
            this.setData('version', this.version);
        }
    }
    
    /**
     * Migra dados entre versões
     */
    migrateData(fromVersion) {
        if (!fromVersion) {
            // Primeira instalação - criar dados de exemplo
            this.createSampleData();
        }
        
        // Lógica de migração específica pode ser adicionada aqui
        console.log(`✅ Dados migrados de ${fromVersion || 'nenhuma'} para ${this.version}`);
    }
    
    /**
     * Cria dados de exemplo para teste
     */
    createSampleData() {
        const sampleAccount = {
            username: 'testuser',
            password: 'password123',
            email: 'testuser@eldoria.com',
            createdAt: new Date().toISOString(),
            id: Date.now().toString(),
            isLocal: true
        };
        
        const sampleCharacter = {
            id: `char_${Date.now()}_sample`,
            name: 'Aragorn',
            race: 'human',
            class: 'warrior',
            level: 1,
            hp: 120,
            maxHp: 120,
            attack: 15,
            defense: 10,
            mana: 20,
            maxMana: 20,
            x: 400,
            y: 300,
            inventory: [
                { id: 'potion_hp', name: 'Poção de Cura', quantity: 5 },
                { id: 'sword_basic', name: 'Espada Básica', quantity: 1 }
            ],
            equipment: {
                weapon: 'sword_basic',
                armor: 'armor_basic'
            },
            exp: 0,
            maxExp: 100,
            gold: 50,
            createdAt: new Date().toISOString()
        };
        
        this.setData('accounts.testuser', sampleAccount);
        this.setData('characters.testuser', [sampleCharacter]);
        
        console.log('📝 Dados de exemplo criados para teste');
    }
    
    /**
     * Salva dados no localStorage
     */
    setData(key, value) {
        try {
            const fullKey = this.prefix + key;
            const data = {
                value: value,
                timestamp: Date.now(),
                version: this.version
            };
            localStorage.setItem(fullKey, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('❌ Erro ao salvar dados:', error);
            return false;
        }
    }
    
    /**
     * Recupera dados do localStorage
     */
    getData(key) {
        try {
            const fullKey = this.prefix + key;
            const item = localStorage.getItem(fullKey);
            
            if (!item) return null;
            
            const data = JSON.parse(item);
            
            // Verificar se dados são válidos
            if (data && data.value !== undefined) {
                return data.value;
            }
            
            return null;
        } catch (error) {
            console.error('❌ Erro ao carregar dados:', error);
            return null;
        }
    }
    
    /**
     * Remove dados do localStorage
     */
    removeData(key) {
        try {
            const fullKey = this.prefix + key;
            localStorage.removeItem(fullKey);
            return true;
        } catch (error) {
            console.error('❌ Erro ao remover dados:', error);
            return false;
        }
    }
    
    /**
     * Verifica se conta existe
     */
    accountExists(username) {
        const accounts = this.getData('accounts');
        return accounts && accounts[username];
    }
    
    /**
     * Cria nova conta
     */
    createAccount(username, password, email = null) {
        if (this.accountExists(username)) {
            return { success: false, error: 'Usuário já existe' };
        }
        
        const accounts = this.getData('accounts');
        const newAccount = {
            username: username,
            password: password,
            email: email || `${username}@eldoria.com`,
            createdAt: new Date().toISOString(),
            id: Date.now().toString(),
            isLocal: true,
            lastLogin: null,
            loginCount: 0
        };
        
        accounts[username] = newAccount;
        this.setData('accounts', accounts);
        
        // Criar lista de personagens vazia
        const characters = this.getData('characters') || {};
        characters[username] = [];
        this.setData('characters', characters);
        
        return { success: true, account: newAccount };
    }
    
    /**
     * Autentica usuário
     */
    authenticateUser(username, password) {
        const accounts = this.getData('accounts');
        const account = accounts[username];
        
        if (!account) {
            return { success: false, error: 'Usuário não encontrado' };
        }
        
        if (account.password !== password) {
            return { success: false, error: 'Senha incorreta' };
        }
        
        // Atualizar informações de login
        account.lastLogin = new Date().toISOString();
        account.loginCount = (account.loginCount || 0) + 1;
        this.setData('accounts', accounts);
        
        return { success: true, account: account };
    }
    
    /**
     * Obtém personagens de um usuário
     */
    getCharacters(username) {
        const characters = this.getData('characters');
        return characters[username] || [];
    }
    
    /**
     * Cria novo personagem
     */
    createCharacter(username, characterData) {
        if (!this.accountExists(username)) {
            return { success: false, error: 'Usuário não encontrado' };
        }
        
        const characters = this.getData('characters');
        const userCharacters = characters[username] || [];
        
        // Verificar limite de personagens
        if (userCharacters.length >= 3) {
            return { success: false, error: 'Limite de 3 personagens por conta atingido' };
        }
        
        // Criar personagem com dados completos
        const newCharacter = {
            id: `char_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: characterData.name,
            race: characterData.race,
            class: characterData.class,
            level: 1,
            x: 400,
            y: 300,
            inventory: [],
            equipment: {},
            createdAt: new Date().toISOString(),
            ...this.getClassStats(characterData.class)
        };
        
        userCharacters.push(newCharacter);
        characters[username] = userCharacters;
        this.setData('characters', characters);
        
        return { success: true, character: newCharacter };
    }
    
    /**
     * Remove personagem
     */
    deleteCharacter(username, characterId) {
        const characters = this.getData('characters');
        const userCharacters = characters[username] || [];
        
        const index = userCharacters.findIndex(c => c.id === characterId);
        if (index === -1) {
            return { success: false, error: 'Personagem não encontrado' };
        }
        
        userCharacters.splice(index, 1);
        characters[username] = userCharacters;
        this.setData('characters', characters);
        
        return { success: true };
    }
    
    /**
     * Obtém stats base por classe
     */
    getClassStats(characterClass) {
        const classStats = {
            warrior: { hp: 120, maxHp: 120, attack: 15, defense: 10, mana: 20, maxMana: 20 },
            mage: { hp: 80, maxHp: 80, attack: 8, defense: 5, mana: 100, maxMana: 100 },
            hunter: { hp: 100, maxHp: 100, attack: 12, defense: 7, mana: 50, maxMana: 50 },
            rogue: { hp: 90, maxHp: 90, attack: 14, defense: 6, mana: 30, maxMana: 30 },
            priest: { hp: 85, maxHp: 85, attack: 6, defense: 8, mana: 80, maxMana: 80 },
            druid: { hp: 95, maxHp: 95, attack: 10, defense: 8, mana: 70, maxMana: 70 },
            apprentice: { hp: 100, maxHp: 100, attack: 10, defense: 8, mana: 50, maxMana: 50 }
        };
        
        return classStats[characterClass] || classStats.apprentice;
    }
    
    /**
     * Salva progresso do jogador
     */
    savePlayerProgress(username, characterId, progress) {
        const playerProgress = this.getData('playerProgress') || {};
        const userProgress = playerProgress[username] || {};
        
        userProgress[characterId] = {
            ...userProgress[characterId],
            ...progress,
            lastSaved: new Date().toISOString()
        };
        
        playerProgress[username] = userProgress;
        this.setData('playerProgress', playerProgress);
        
        return { success: true };
    }
    
    /**
     * Carrega progresso do jogador
     */
    loadPlayerProgress(username, characterId) {
        const playerProgress = this.getData('playerProgress') || {};
        const userProgress = playerProgress[username] || {};
        
        return userProgress[characterId] || null;
    }
    
    /**
     * Obtém configurações do jogo
     */
    getGameSettings() {
        return this.getData('gameSettings') || this.dataStructure.gameSettings;
    }
    
    /**
     * Salva configurações do jogo
     */
    saveGameSettings(settings) {
        const currentSettings = this.getGameSettings();
        const newSettings = { ...currentSettings, ...settings };
        this.setData('gameSettings', newSettings);
        return { success: true, settings: newSettings };
    }
    
    /**
     * Limpa todos os dados (para desenvolvimento)
     */
    clearAllData() {
        try {
            const keys = Object.keys(localStorage);
            const eldoriaKeys = keys.filter(key => key.startsWith(this.prefix));
            
            eldoriaKeys.forEach(key => {
                localStorage.removeItem(key);
            });
            
            this.initializeData();
            console.log('🧹 Todos os dados locais limpos e reinicializados');
            return { success: true };
        } catch (error) {
            console.error('❌ Erro ao limpar dados:', error);
            return { success: false, error: error.message };
        }
    }
    
    /**
     * Exporta todos os dados para backup
     */
    exportData() {
        try {
            const keys = Object.keys(localStorage);
            const eldoriaKeys = keys.filter(key => key.startsWith(this.prefix));
            
            const exportData = {};
            eldoriaKeys.forEach(key => {
                const shortKey = key.replace(this.prefix, '');
                exportData[shortKey] = this.getData(shortKey);
            });
            
            exportData.exportInfo = {
                version: this.version,
                timestamp: new Date().toISOString(),
                isDevelopmentMode: this.isDevelopmentMode
            };
            
            return {
                success: true,
                data: exportData,
                json: JSON.stringify(exportData, null, 2)
            };
        } catch (error) {
            console.error('❌ Erro ao exportar dados:', error);
            return { success: false, error: error.message };
        }
    }
    
    /**
     * Importa dados de backup
     */
    importData(jsonData) {
        try {
            const data = JSON.parse(jsonData);
            
            // Validar estrutura
            if (!data.exportInfo) {
                return { success: false, error: 'Formato de backup inválido' };
            }
            
            // Limpar dados atuais
            this.clearAllData();
            
            // Importar dados
            Object.keys(data).forEach(key => {
                if (key !== 'exportInfo') {
                    this.setData(key, data[key]);
                }
            });
            
            console.log('📥 Dados importados com sucesso');
            return { success: true };
        } catch (error) {
            console.error('❌ Erro ao importar dados:', error);
            return { success: false, error: error.message };
        }
    }
    
    /**
     * Obtém estatísticas do sistema
     */
    getStatistics() {
        const accounts = this.getData('accounts') || {};
        const characters = this.getData('characters') || {};
        const playerProgress = this.getData('playerProgress') || {};
        
        const totalAccounts = Object.keys(accounts).length;
        const totalCharacters = Object.values(characters).reduce((sum, chars) => sum + chars.length, 0);
        const activeAccounts = Object.values(accounts).filter(acc => acc.lastLogin).length;
        
        return {
            version: this.version,
            isDevelopmentMode: this.isDevelopmentMode,
            totalAccounts,
            totalCharacters,
            activeAccounts,
            averageCharactersPerAccount: totalAccounts > 0 ? (totalCharacters / totalAccounts).toFixed(1) : 0,
            storageSize: this.getStorageSize(),
            lastDataUpdate: this.getLastDataUpdate()
        };
    }
    
    /**
     * Calcula tamanho do storage
     */
    getStorageSize() {
        try {
            const keys = Object.keys(localStorage);
            const eldoriaKeys = keys.filter(key => key.startsWith(this.prefix));
            
            let totalSize = 0;
            eldoriaKeys.forEach(key => {
                totalSize += localStorage.getItem(key).length;
            });
            
            return (totalSize / 1024).toFixed(2) + ' KB';
        } catch (error) {
            return 'N/A';
        }
    }
    
    /**
     * Obtém última atualização dos dados
     */
    getLastDataUpdate() {
        try {
            const keys = Object.keys(localStorage);
            const eldoriaKeys = keys.filter(key => key.startsWith(this.prefix));
            
            let latestUpdate = 0;
            eldoriaKeys.forEach(key => {
                const item = localStorage.getItem(key);
                const data = JSON.parse(item);
                if (data.timestamp > latestUpdate) {
                    latestUpdate = data.timestamp;
                }
            });
            
            return latestUpdate > 0 ? new Date(latestUpdate).toISOString() : 'N/A';
        } catch (error) {
            return 'N/A';
        }
    }
}

// Exportar para uso global
window.LocalDataManager = LocalDataManager;
