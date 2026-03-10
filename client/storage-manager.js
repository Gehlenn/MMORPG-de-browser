/**
 * Sistema de Storage Local para Teste
 * Salva contas e personagens no localStorage
 */

class LocalStorageManager {
    constructor() {
        this.STORAGE_KEYS = {
            ACCOUNTS: 'eldoria_accounts',
            CHARACTERS: 'eldoria_characters',
            CURRENT_USER: 'eldoria_current_user'
        };
    }
    
    // === CONTA ===
    
    saveAccount(account) {
        try {
            const accounts = this.getAccounts();
            accounts[account.username] = account;
            localStorage.setItem(this.STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));
            console.log('💾 Account saved:', account.username);
            return true;
        } catch (error) {
            console.error('❌ Error saving account:', error);
            return false;
        }
    }
    
    getAccounts() {
        try {
            const accounts = localStorage.getItem(this.STORAGE_KEYS.ACCOUNTS);
            return accounts ? JSON.parse(accounts) : {};
        } catch (error) {
            console.error('❌ Error getting accounts:', error);
            return {};
        }
    }
    
    getAccount(username) {
        const accounts = this.getAccounts();
        return accounts[username] || null;
    }
    
    accountExists(username) {
        const accounts = this.getAccounts();
        return !!accounts[username];
    }
    
    // === PERSONAGENS ===
    
    saveCharacters(username, characters) {
        try {
            const allCharacters = this.getAllCharacters();
            allCharacters[username] = characters;
            localStorage.setItem(this.STORAGE_KEYS.CHARACTERS, JSON.stringify(allCharacters));
            console.log('💾 Characters saved for:', username);
            return true;
        } catch (error) {
            console.error('❌ Error saving characters:', error);
            return false;
        }
    }
    
    getCharacters(username) {
        try {
            const allCharacters = this.getAllCharacters();
            return allCharacters[username] || [];
        } catch (error) {
            console.error('❌ Error getting characters:', error);
            return [];
        }
    }
    
    getAllCharacters() {
        try {
            const characters = localStorage.getItem(this.STORAGE_KEYS.CHARACTERS);
            return characters ? JSON.parse(characters) : {};
        } catch (error) {
            console.error('❌ Error getting all characters:', error);
            return {};
        }
    }
    
    // === USUÁRIO ATUAL ===
    
    getCurrentUser() {
        try {
            const user = localStorage.getItem(this.STORAGE_KEYS.CURRENT_USER);
            return user ? JSON.parse(user) : null;
        } catch (error) {
            console.error('❌ Error getting current user:', error);
            return null;
        }
    }
    
    setCurrentUser(user) {
        try {
            localStorage.setItem(this.STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
            console.log('💾 Current user saved:', user.username);
            return true;
        } catch (error) {
            console.error('❌ Error saving current user:', error);
            return false;
        }
    }
    
    // === UTILITÁRIOS ===
    
    clearStorage() {
        try {
            localStorage.removeItem(this.STORAGE_KEYS.ACCOUNTS);
            localStorage.removeItem(this.STORAGE_KEYS.CHARACTERS);
            localStorage.removeItem(this.STORAGE_KEYS.CURRENT_USER);
            console.log('🗑️ LocalStorage cleared');
            return true;
        } catch (error) {
            console.error('❌ Error clearing storage:', error);
            return false;
        }
    }
    
    getStorageInfo() {
        try {
            const accounts = this.getAccounts();
            const characters = this.getAllCharacters();
            const currentUser = this.getCurrentUser();
            
            return {
                totalAccounts: Object.keys(accounts).length,
                totalCharacters: Object.values(characters).reduce((sum, chars) => sum + chars.length, 0),
                currentUser: currentUser ? currentUser.username : null,
                accounts: Object.keys(accounts),
                storageKeys: Object.values(this.STORAGE_KEYS)
            };
        } catch (error) {
            console.error('❌ Error getting storage info:', error);
            return null;
        }
    }
    
    // === DEBUG ===
    
    debug() {
        const info = this.getStorageInfo();
        console.log('🔍 LocalStorage Debug:', info);
        return info;
    }
}

// Exportar para uso global
window.LocalStorageManager = LocalStorageManager;

// Instância global
window.storage = new LocalStorageManager();

console.log('💾 LocalStorage Manager initialized');
