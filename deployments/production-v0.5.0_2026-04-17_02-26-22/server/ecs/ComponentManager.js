/**
 * Component Manager
 * Handles storage and retrieval of entity components
 * Uses Map for optimal performance with entity lookups
 */

class ComponentManager {
    constructor() {
        // Map<componentName, Map<entityId, componentData>>
        this.components = new Map();
        
        // Component type definitions for validation
        this.componentTypes = new Map();
        
        // Performance tracking
        this.stats = {
            totalComponents: 0,
            componentTypes: 0
        };
    }

    /**
     * Register a component type
     * @param {string} componentName - Name of component
     * @param {object} schema - Component schema for validation
     */
    register(componentName, schema = {}) {
        if (!this.components.has(componentName)) {
            this.components.set(componentName, new Map());
            this.componentTypes.set(componentName, schema);
            this.stats.componentTypes++;
        }
    }

    /**
     * Add component to entity
     * @param {number} entityId - Entity ID
     * @param {string} componentName - Component name
     * @param {object} data - Component data
     * @returns {boolean} - True if component was added
     */
    add(entityId, componentName, data) {
        const componentMap = this.components.get(componentName);
        if (!componentMap) {
            console.warn(`Component ${componentName} not registered`);
            return false;
        }

        // Validate against schema if provided
        const schema = this.componentTypes.get(componentName);
        if (schema && !this.validateSchema(data, schema)) {
            console.warn(`Component ${componentName} data validation failed`);
            return false;
        }

        componentMap.set(entityId, data);
        this.updateStats();
        return true;
    }

    /**
     * Get component from entity
     * @param {number} entityId - Entity ID
     * @param {string} componentName - Component name
     * @returns {object|null} - Component data or null
     */
    get(entityId, componentName) {
        const componentMap = this.components.get(componentName);
        if (!componentMap) return null;
        
        return componentMap.get(entityId) || null;
    }

    /**
     * Remove component from entity
     * @param {number} entityId - Entity ID
     * @param {string} componentName - Component name
     * @returns {boolean} - True if component was removed
     */
    remove(entityId, componentName) {
        const componentMap = this.components.get(componentName);
        if (!componentMap) return false;
        
        const removed = componentMap.delete(entityId);
        this.updateStats();
        return removed;
    }

    /**
     * Check if entity has component
     * @param {number} entityId - Entity ID
     * @param {string} componentName - Component name
     * @returns {boolean} - True if entity has component
     */
    has(entityId, componentName) {
        const componentMap = this.components.get(componentName);
        if (!componentMap) return false;
        
        return componentMap.has(entityId);
    }

    /**
     * Get all entities with specific component
     * @param {string} componentName - Component name
     * @returns {Map<number, object>} - Map of entity IDs to component data
     */
    getAllWith(componentName) {
        return this.components.get(componentName) || new Map();
    }

    /**
     * Get entities with multiple components
     * @param {string[]} componentNames - Array of component names
     * @returns {number[]} - Array of entity IDs with all components
     */
    getEntitiesWithComponents(componentNames) {
        if (componentNames.length === 0) return [];
        
        // Start with entities having first component
        const firstComponent = this.getAllWith(componentNames[0]);
        const result = [];
        
        for (const [entityId] of firstComponent) {
            // Check if entity has all other components
            const hasAll = componentNames.slice(1).every(name => this.has(entityId, name));
            if (hasAll) {
                result.push(entityId);
            }
        }
        
        return result;
    }

    /**
     * Remove all components for entity
     * @param {number} entityId - Entity ID
     */
    removeAll(entityId) {
        for (const componentMap of this.components.values()) {
            componentMap.delete(entityId);
        }
        this.updateStats();
    }

    /**
     * Validate component data against schema
     * @param {object} data - Component data
     * @param {object} schema - Component schema
     * @returns {boolean} - True if valid
     */
    validateSchema(data, schema) {
        // Simple validation - can be expanded
        for (const [key, type] of Object.entries(schema)) {
            if (!(key in data) || typeof data[key] !== type) {
                return false;
            }
        }
        return true;
    }

    /**
     * Update performance statistics
     */
    updateStats() {
        let totalComponents = 0;
        for (const componentMap of this.components.values()) {
            totalComponents += componentMap.size;
        }
        this.stats.totalComponents = totalComponents;
    }

    /**
     * Get performance statistics
     * @returns {object} - Performance stats
     */
    getStats() {
        return { ...this.stats };
    }

    /**
     * Get component type information
     * @returns {object} - Component type info
     */
    getComponentTypes() {
        const types = {};
        for (const [name, map] of this.components.entries()) {
            types[name] = {
                count: map.size,
                schema: this.componentTypes.get(name) || {}
            };
        }
        return types;
    }

    /**
     * Clear all components (for testing/world reset)
     */
    clear() {
        for (const componentMap of this.components.values()) {
            componentMap.clear();
        }
        this.updateStats();
    }
}

module.exports = ComponentManager;
