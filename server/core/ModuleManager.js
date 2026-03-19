/**
 * ModuleManager - Gerenciador Central de Módulos
 * Arquitetura estilo Blizzard/Riot - Feature Modules
 * Controla registro, inicialização e update de todos os módulos
 */

class ModuleManager {
    constructor() {
        this.modules = new Map();
        this.initialized = false;
        this.updateOrder = [];
        this.debugMode = true;
        
        console.log('🏗️ ModuleManager initialized');
    }
    
    /**
     * Registra um módulo no sistema
     * @param {string} name - Nome do módulo
     * @param {object} module - Instância do módulo
     * @param {number} priority - Prioridade de update (menor = primeiro)
     */
    register(name, module, priority = 100) {
        if (this.modules.has(name)) {
            console.warn(`⚠️ Module ${name} already registered, overwriting...`);
        }
        
        this.modules.set(name, {
            instance: module,
            name: name,
            priority: priority,
            initialized: false
        });
        
        // Atualizar ordem de update
        this.updateOrder = Array.from(this.modules.entries())
            .sort(([,a], [,b]) => a.priority - b.priority)
            .map(([name]) => name);
        
        console.log(`📦 Module registered: ${name} (priority: ${priority})`);
    }
    
    /**
     * Inicializa todos os módulos registrados
     * @param {object} server - Instância do servidor
     */
    async initAll(server) {
        if (this.initialized) {
            console.warn('⚠️ Modules already initialized');
            return;
        }
        
        console.log(`🚀 Initializing ${this.modules.size} modules...`);
        
        const initPromises = [];
        
        // Inicializar em ordem de prioridade
        for (const moduleName of this.updateOrder) {
            const moduleData = this.modules.get(moduleName);
            
            if (moduleData.instance.init) {
                const initPromise = this.initializeModule(moduleData, server);
                initPromises.push(initPromise);
            }
        }
        
        try {
            await Promise.all(initPromises);
            this.initialized = true;
            console.log('✅ All modules initialized successfully');
        } catch (error) {
            console.error('❌ Module initialization failed:', error);
            throw error;
        }
    }
    
    /**
     * Inicializa um módulo específico
     * @param {object} moduleData - Dados do módulo
     * @param {object} server - Instância do servidor
     */
    async initializeModule(moduleData, server) {
        const { instance, name } = moduleData;
        
        try {
            console.log(`🔧 Initializing module: ${name}`);
            
            if (typeof instance.init === 'function') {
                await instance.init(server);
            }
            
            moduleData.initialized = true;
            console.log(`✅ Module ${name} initialized`);
            
        } catch (error) {
            console.error(`❌ Failed to initialize module ${name}:`, error);
            throw error;
        }
    }
    
    /**
     * Update de todos os módulos
     * @param {number} delta - Delta time
     */
    updateAll(delta) {
        if (!this.initialized) {
            return;
        }
        
        // Update em ordem de prioridade
        for (const moduleName of this.updateOrder) {
            const moduleData = this.modules.get(moduleName);
            
            if (moduleData.initialized && moduleData.instance.update) {
                try {
                    moduleData.instance.update(delta);
                } catch (error) {
                    console.error(`❌ Error updating module ${moduleName}:`, error);
                }
            }
        }
    }
    
    /**
     * Obtém um módulo específico
     * @param {string} name - Nome do módulo
     * @returns {object|null}
     */
    getModule(name) {
        const moduleData = this.modules.get(name);
        return moduleData ? moduleData.instance : null;
    }
    
    /**
     * Verifica se um módulo existe
     * @param {string} name - Nome do módulo
     * @returns {boolean}
     */
    hasModule(name) {
        return this.modules.has(name);
    }
    
    /**
     * Remove um módulo
     * @param {string} name - Nome do módulo
     */
    unregister(name) {
        if (this.modules.has(name)) {
            const moduleData = this.modules.get(name);
            
            // Cleanup se tiver método
            if (moduleData.instance.cleanup) {
                try {
                    moduleData.instance.cleanup();
                } catch (error) {
                    console.error(`❌ Error cleaning up module ${name}:`, error);
                }
            }
            
            this.modules.delete(name);
            this.updateOrder = Array.from(this.modules.entries())
                .sort(([,a], [,b]) => a.priority - b.priority)
                .map(([name]) => name);
            
            console.log(`🗑️ Module unregistered: ${name}`);
        }
    }
    
    /**
     * Obtém informações de todos os módulos
     * @returns {object}
     */
    getModuleInfo() {
        const info = {};
        
        for (const [name, moduleData] of this.modules) {
            info[name] = {
                name: name,
                priority: moduleData.priority,
                initialized: moduleData.initialized,
                hasInit: typeof moduleData.instance.init === 'function',
                hasUpdate: typeof moduleData.instance.update === 'function',
                hasCleanup: typeof moduleData.instance.cleanup === 'function'
            };
        }
        
        return info;
    }
    
    /**
     * Obtém estatísticas do ModuleManager
     * @returns {object}
     */
    getStats() {
        const modules = Array.from(this.modules.values());
        
        return {
            totalModules: modules.length,
            initializedModules: modules.filter(m => m.initialized).length,
            updateOrder: [...this.updateOrder],
            isInitialized: this.initialized,
            debugMode: this.debugMode
        };
    }
    
    /**
     * Habilita/desabilita modo debug
     * @param {boolean} enabled - Estado do debug
     */
    setDebugMode(enabled) {
        this.debugMode = enabled;
        console.log(`🔧 Debug mode ${enabled ? 'enabled' : 'disabled'}`);
    }
    
    /**
     * Reinicializa todos os módulos
     * @param {object} server - Instância do servidor
     */
    async reinitializeAll(server) {
        console.log('🔄 Reinitializing all modules...');
        
        // Cleanup
        await this.cleanupAll();
        
        // Reset estado
        this.initialized = false;
        
        // Reinicializar
        await this.initAll(server);
    }
    
    /**
     * Cleanup de todos os módulos
     */
    async cleanupAll() {
        console.log('🧹 Cleaning up all modules...');
        
        const cleanupPromises = [];
        
        for (const [name, moduleData] of this.modules) {
            if (moduleData.instance.cleanup) {
                const cleanupPromise = this.cleanupModule(moduleData);
                cleanupPromises.push(cleanupPromise);
            }
            
            moduleData.initialized = false;
        }
        
        try {
            await Promise.all(cleanupPromises);
            this.initialized = false;
            console.log('✅ All modules cleaned up successfully');
        } catch (error) {
            console.error('❌ Module cleanup failed:', error);
            throw error;
        }
    }
    
    /**
     * Cleanup de um módulo específico
     * @param {object} moduleData - Dados do módulo
     */
    async cleanupModule(moduleData) {
        const { instance, name } = moduleData;
        
        try {
            console.log(`🧹 Cleaning up module: ${name}`);
            
            if (typeof instance.cleanup === 'function') {
                await instance.cleanup();
            }
            
            console.log(`✅ Module ${name} cleaned up`);
            
        } catch (error) {
            console.error(`❌ Failed to cleanup module ${name}:`, error);
            throw error;
        }
    }
    
    /**
     * Executa uma função em todos os módulos
     * @param {string} methodName - Nome do método
     * @param {...any} args - Argumentos
     */
    executeOnAll(methodName, ...args) {
        const results = {};
        
        for (const [name, moduleData] of this.modules) {
            if (moduleData.initialized && typeof moduleData.instance[methodName] === 'function') {
                try {
                    results[name] = moduleData.instance[methodName](...args);
                } catch (error) {
                    console.error(`❌ Error executing ${methodName} on module ${name}:`, error);
                    results[name] = null;
                }
            }
        }
        
        return results;
    }
    
    /**
     * Destrói o ModuleManager
     */
    destroy() {
        console.log('🗑️ Destroying ModuleManager...');
        
        this.cleanupAll().then(() => {
            this.modules.clear();
            this.updateOrder = [];
            this.initialized = false;
            console.log('✅ ModuleManager destroyed');
        }).catch(error => {
            console.error('❌ Error destroying ModuleManager:', error);
        });
    }
}

module.exports = ModuleManager;
