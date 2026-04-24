/**
 * SettingsManager - Painel de Configurações UI
 *
 * Responsabilidades:
 * - Configurações de tema (claro/escuro)
 * - Tamanho de fonte e UI scale
 * - Ativar/desativar animações
 * - Configurações de acessibilidade
 * - Configurações de som (placeholder)
 * - Persistência no localStorage
 */

class SettingsManager {
    constructor() {
        this.settings = {
            // Tema
            theme: 'dark', // dark, light, auto
            accentColor: 'gold', // gold, blue, purple, red, green

            // UI Scale
            uiScale: 100, // 75, 100, 125, 150
            fontSize: 'medium', // small, medium, large

            // Animações
            enableAnimations: true,
            reducedMotion: false,
            particleEffects: true,

            // Notificações
            toastPosition: 'top-right',
            enableToasts: true,
            toastDuration: 5000,

            // Acessibilidade
            highContrast: false,
            colorBlindMode: 'none', // none, deuteranopia, protanopia, tritanopia
            screenReader: false,

            // Gameplay
            autoLoot: true,
            showDamageNumbers: true,
            showPlayerNames: true,
            showGuildTags: true,
            cameraShake: true,

            // Performance
            shadowQuality: 'high', // low, medium, high
            particleDensity: 100, // 0, 50, 100
            maxFPS: 60 // 30, 60, 120, unlimited
        };

        this.presets = {
            performance: {
                enableAnimations: false,
                particleEffects: false,
                shadowQuality: 'low',
                particleDensity: 0,
                maxFPS: 30
            },
            balanced: {
                enableAnimations: true,
                particleEffects: true,
                shadowQuality: 'medium',
                particleDensity: 50,
                maxFPS: 60
            },
            quality: {
                enableAnimations: true,
                particleEffects: true,
                shadowQuality: 'high',
                particleDensity: 100,
                maxFPS: 60
            }
        };

        this.onSettingsChange = null;
        this.initialized = false;
    }

    init() {
        if (this.initialized) return;

        this.loadSettings();
        this.applySettings();
        this.initialized = true;

        console.log('⚙️ SettingsManager inicializado');
        console.log('   - Tema:', this.settings.theme);
        console.log('   - UI Scale:', this.settings.uiScale + '%');
    }

    loadSettings() {
        try {
            const saved = localStorage.getItem('game_settings');
            if (saved) {
                const parsed = JSON.parse(saved);
                this.settings = { ...this.settings, ...parsed };
            }
        } catch (e) {
            console.warn('Erro ao carregar configurações:', e);
        }
    }

    saveSettings() {
        try {
            localStorage.setItem('game_settings', JSON.stringify(this.settings));
        } catch (e) {
            console.warn('Erro ao salvar configurações:', e);
        }
    }

    get(key) {
        return this.settings[key];
    }

    set(key, value) {
        const oldValue = this.settings[key];
        this.settings[key] = value;
        this.saveSettings();
        this.applySetting(key, value);

        if (this.onSettingsChange) {
            this.onSettingsChange(key, value, oldValue);
        }

        // Emit event
        if (window.eventBus) {
            window.eventBus.emit('settingChanged', { key, value, oldValue });
        }

        return value;
    }

    applySettings() {
        Object.keys(this.settings).forEach(key => {
            this.applySetting(key, this.settings[key]);
        });
    }

    applySetting(key, value) {
        const root = document.documentElement;

        switch (key) {
            case 'theme':
                document.body.classList.remove('theme-light', 'theme-dark');
                document.body.classList.add(`theme-${value}`);
                break;

            case 'accentColor':
                const colors = {
                    gold: '#ffd700',
                    blue: '#2196f3',
                    purple: '#9c27b0',
                    red: '#f44336',
                    green: '#4caf50'
                };
                root.style.setProperty('--accent-color', colors[value] || colors.gold);
                break;

            case 'uiScale':
                root.style.setProperty('--ui-scale', value / 100);
                break;

            case 'fontSize':
                const sizes = { small: '14px', medium: '16px', large: '18px' };
                root.style.setProperty('--font-size-base', sizes[value] || sizes.medium);
                break;

            case 'reducedMotion':
                if (value) {
                    document.body.classList.add('reduced-motion');
                } else {
                    document.body.classList.remove('reduced-motion');
                }
                break;

            case 'highContrast':
                if (value) {
                    document.body.classList.add('high-contrast');
                } else {
                    document.body.classList.remove('high-contrast');
                }
                break;

            case 'colorBlindMode':
                document.body.classList.remove('colorblind-deuteranopia', 'colorblind-protanopia', 'colorblind-tritanopia');
                if (value !== 'none') {
                    document.body.classList.add(`colorblind-${value}`);
                }
                break;
        }
    }

    applyPreset(presetName) {
        const preset = this.presets[presetName];
        if (!preset) {
            console.warn('Preset não encontrado:', presetName);
            return false;
        }

        Object.keys(preset).forEach(key => {
            this.set(key, preset[key]);
        });

        console.log('✅ Preset aplicado:', presetName);
        return true;
    }

    resetToDefaults() {
        this.settings = {
            theme: 'dark',
            accentColor: 'gold',
            uiScale: 100,
            fontSize: 'medium',
            enableAnimations: true,
            reducedMotion: false,
            particleEffects: true,
            toastPosition: 'top-right',
            enableToasts: true,
            toastDuration: 5000,
            highContrast: false,
            colorBlindMode: 'none',
            screenReader: false,
            autoLoot: true,
            showDamageNumbers: true,
            showPlayerNames: true,
            showGuildTags: true,
            cameraShake: true,
            shadowQuality: 'high',
            particleDensity: 100,
            maxFPS: 60
        };

        this.saveSettings();
        this.applySettings();

        if (window.eventBus) {
            window.eventBus.emit('settingsReset');
        }

        console.log('🔄 Configurações resetadas para padrão');
    }

    exportSettings() {
        return JSON.stringify(this.settings, null, 2);
    }

    importSettings(jsonString) {
        try {
            const imported = JSON.parse(jsonString);
            this.settings = { ...this.settings, ...imported };
            this.saveSettings();
            this.applySettings();
            return true;
        } catch (e) {
            console.error('Erro ao importar configurações:', e);
            return false;
        }
    }

    getAllSettings() {
        return { ...this.settings };
    }
}

window.SettingsManager = SettingsManager;
