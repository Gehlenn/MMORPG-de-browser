/**
 * AudioManager - Sistema de Áudio do MMORPG
 * 
 * Gerencia efeitos sonoros, música de fundo e controle de volume
 * Usa pooling de objetos Audio para performance
 */

class AudioManager {
    constructor() {
        this.initialized = false;
        this.enabled = true;
        this.muted = false;
        
        // Configurações de volume (0-1)
        this.volume = {
            master: 0.7,
            sfx: 0.8,
            music: 0.5,
            ambient: 0.6
        };
        
        // Pools de áudio para reutilização
        this.pools = {
            sfx: [],
            music: null,
            ambient: null
        };
        
        // Sons carregados
        this.sounds = new Map();
        
        // Música atual
        this.currentMusic = null;
        this.musicFadeInterval = null;
        
        // Efeitos ativos
        this.activeSounds = new Set();
        
        // Limites para evitar spam de som
        this.lastPlayTime = new Map();
        this.minIntervals = {
            'attack': 150,
            'hit': 100,
            'step': 200,
            'collect': 100,
            'ui': 50
        };
        
        // Analisador de áudio para visualização (opcional)
        this.audioContext = null;
        this.analyser = null;
        
        // Sons sintetizados (fallback quando não há arquivos)
        this.synthesizedSounds = true;
    }
    
    /**
     * Inicializa o sistema de áudio
     */
    init() {
        if (this.initialized) return;
        
        try {
            // Criar contexto de áudio para análise/visualização
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                this.audioContext = new AudioContext();
                this.analyser = this.audioContext.createAnalyser();
                this.analyser.fftSize = 256;
            }
            
            // Criar pool de áudio para SFX
            this.createSFXPool(10);
            
            // Inicializar sons sintetizados
            this.initSynthesizedSounds();
            
            this.initialized = true;
            console.log('🎵 AudioManager inicializado');
            
            // Carregar preferências do localStorage
            this.loadPreferences();
            
        } catch (error) {
            console.warn('⚠️ Erro ao inicializar AudioManager:', error);
            this.enabled = false;
        }
    }
    
    /**
     * Cria pool de objetos de áudio para SFX
     */
    createSFXPool(size) {
        for (let i = 0; i < size; i++) {
            const audio = new Audio();
            audio.preload = 'none';
            this.pools.sfx.push({
                audio,
                inUse: false,
                type: null
            });
        }
    }
    
    /**
     * Inicializa sons sintetizados usando Web Audio API
     */
    initSynthesizedSounds() {
        // Criar sons proceduralmente usando OscillatorNode
        this.synthSounds = {
            attack: () => this.createSynthSound('attack'),
            hit: () => this.createSynthSound('hit'),
            collect: () => this.createSynthSound('collect'),
            step: () => this.createSynthSound('step'),
            levelup: () => this.createSynthSound('levelup'),
            crit: () => this.createSynthSound('crit'),
            death: () => this.createSynthSound('death'),
            heal: () => this.createSynthSound('heal')
        };
    }
    
    /**
     * Cria um som sintetizado
     */
    createSynthSound(type) {
        if (!this.audioContext) return null;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.analyser);
        this.analyser.connect(this.audioContext.destination);
        
        const now = this.audioContext.currentTime;
        
        switch (type) {
            case 'attack':
                oscillator.type = 'square';
                oscillator.frequency.setValueAtTime(800, now);
                oscillator.frequency.exponentialRampToValueAtTime(200, now + 0.15);
                gainNode.gain.setValueAtTime(this.volume.sfx * 0.3, now);
                gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
                oscillator.start(now);
                oscillator.stop(now + 0.15);
                break;
                
            case 'hit':
                oscillator.type = 'sawtooth';
                oscillator.frequency.setValueAtTime(200, now);
                oscillator.frequency.exponentialRampToValueAtTime(50, now + 0.1);
                gainNode.gain.setValueAtTime(this.volume.sfx * 0.4, now);
                gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
                oscillator.start(now);
                oscillator.stop(now + 0.1);
                break;
                
            case 'crit':
                oscillator.type = 'square';
                oscillator.frequency.setValueAtTime(1200, now);
                oscillator.frequency.exponentialRampToValueAtTime(400, now + 0.2);
                gainNode.gain.setValueAtTime(this.volume.sfx * 0.5, now);
                gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
                oscillator.start(now);
                oscillator.stop(now + 0.2);
                break;
                
            case 'collect':
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(800, now);
                oscillator.frequency.setValueAtTime(1200, now + 0.05);
                gainNode.gain.setValueAtTime(this.volume.sfx * 0.3, now);
                gainNode.gain.linearRampToValueAtTime(0.01, now + 0.2);
                oscillator.start(now);
                oscillator.stop(now + 0.2);
                break;
                
            case 'step':
                oscillator.type = 'triangle';
                oscillator.frequency.setValueAtTime(100, now);
                gainNode.gain.setValueAtTime(this.volume.sfx * 0.15, now);
                gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
                oscillator.start(now);
                oscillator.stop(now + 0.08);
                break;
                
            case 'levelup':
                // Arpeggio ascendente
                const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
                notes.forEach((freq, i) => {
                    const osc = this.audioContext.createOscillator();
                    const gain = this.audioContext.createGain();
                    osc.connect(gain);
                    gain.connect(this.analyser);
                    this.analyser.connect(this.audioContext.destination);
                    
                    osc.type = 'sine';
                    osc.frequency.value = freq;
                    gain.gain.setValueAtTime(this.volume.sfx * 0.2, now + i * 0.1);
                    gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.15);
                    
                    osc.start(now + i * 0.1);
                    osc.stop(now + i * 0.1 + 0.15);
                });
                break;
                
            case 'death':
                oscillator.type = 'sawtooth';
                oscillator.frequency.setValueAtTime(200, now);
                oscillator.frequency.exponentialRampToValueAtTime(50, now + 0.5);
                gainNode.gain.setValueAtTime(this.volume.sfx * 0.4, now);
                gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
                oscillator.start(now);
                oscillator.stop(now + 0.5);
                break;
                
            case 'heal':
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(400, now);
                oscillator.frequency.exponentialRampToValueAtTime(600, now + 0.3);
                gainNode.gain.setValueAtTime(this.volume.sfx * 0.25, now);
                gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
                oscillator.start(now);
                oscillator.stop(now + 0.3);
                break;
        }
        
        return { oscillator, gainNode };
    }
    
    /**
     * Reproduz um efeito sonoro
     */
    playSFX(type, options = {}) {
        if (!this.enabled || this.muted) return;
        if (!this.initialized) this.init();
        
        // Verificar rate limiting
        const now = Date.now();
        const lastTime = this.lastPlayTime.get(type) || 0;
        const minInterval = this.minIntervals[type] || 50;
        
        if (now - lastTime < minInterval) return;
        this.lastPlayTime.set(type, now);
        
        // Usar som sintetizado
        if (this.synthesizedSounds && this.synthSounds[type]) {
            // Resume contexto se suspenso (navegadores bloqueiam autoplay)
            if (this.audioContext && this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }
            
            this.synthSounds[type]();
            return;
        }
        
        // Fallback: tentar tocar arquivo de som
        const soundUrl = this.getSoundUrl(type);
        if (!soundUrl) return;
        
        this.playSoundFile(soundUrl, options);
    }
    
    /**
     * Retorna URL do arquivo de som (placeholder para assets reais)
     */
    getSoundUrl(type) {
        // Mapeamento de tipos para arquivos (quando houver assets)
        const soundMap = {
            'attack': 'assets/sounds/attack.mp3',
            'hit': 'assets/sounds/hit.mp3',
            'crit': 'assets/sounds/crit.mp3',
            'collect': 'assets/sounds/collect.mp3',
            'step': 'assets/sounds/step.mp3',
            'levelup': 'assets/sounds/levelup.mp3',
            'death': 'assets/sounds/death.mp3',
            'heal': 'assets/sounds/heal.mp3',
            'ui_click': 'assets/sounds/ui_click.mp3',
            'ui_hover': 'assets/sounds/ui_hover.mp3',
            'open_inventory': 'assets/sounds/open_bag.mp3',
            'equip': 'assets/sounds/equip.mp3'
        };
        
        return soundMap[type] || null;
    }
    
    /**
     * Reproduz arquivo de som
     */
    playSoundFile(url, options = {}) {
        // Pegar item do pool
        const poolItem = this.pools.sfx.find(item => !item.inUse);
        if (!poolItem) return; // Pool esgotado
        
        poolItem.inUse = true;
        poolItem.type = options.type || 'sfx';
        
        const audio = poolItem.audio;
        audio.src = url;
        audio.volume = (options.volume || 1) * this.volume.sfx * this.volume.master;
        audio.playbackRate = options.playbackRate || 1;
        
        audio.onended = () => {
            poolItem.inUse = false;
            poolItem.type = null;
            this.activeSounds.delete(audio);
        };
        
        audio.onerror = () => {
            console.warn(`⚠️ Erro ao carregar som: ${url}`);
            poolItem.inUse = false;
            poolItem.type = null;
        };
        
        audio.play().catch(e => {
            // Ignorar erros de autoplay policy
            poolItem.inUse = false;
            poolItem.type = null;
        });
        
        this.activeSounds.add(audio);
    }
    
    /**
     * Inicia música de fundo
     */
    playMusic(trackName, options = {}) {
        if (!this.enabled || this.muted) return;
        if (!this.initialized) this.init();
        
        // Fade out da música atual
        if (this.currentMusic) {
            this.fadeOutMusic(() => {
                this.startNewMusic(trackName, options);
            });
        } else {
            this.startNewMusic(trackName, options);
        }
    }
    
    /**
     * Inicia nova música
     */
    startNewMusic(trackName, options = {}) {
        const musicUrl = `assets/music/${trackName}.mp3`;
        
        this.currentMusic = new Audio(musicUrl);
        this.currentMusic.loop = options.loop !== false;
        this.currentMusic.volume = 0;
        
        this.currentMusic.play().then(() => {
            // Fade in
            this.fadeInMusic(options.volume || 1);
        }).catch(e => {
            console.warn('⚠️ Erro ao tocar música:', e);
            this.currentMusic = null;
        });
    }
    
    /**
     * Fade in na música
     */
    fadeInMusic(targetVolume, duration = 2000) {
        if (!this.currentMusic) return;
        
        const startTime = Date.now();
        const startVolume = 0;
        const finalVolume = targetVolume * this.volume.music * this.volume.master;
        
        clearInterval(this.musicFadeInterval);
        
        this.musicFadeInterval = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            this.currentMusic.volume = startVolume + (finalVolume - startVolume) * progress;
            
            if (progress >= 1) {
                clearInterval(this.musicFadeInterval);
            }
        }, 50);
    }
    
    /**
     * Fade out na música
     */
    fadeOutMusic(callback, duration = 1000) {
        if (!this.currentMusic) {
            if (callback) callback();
            return;
        }
        
        const startTime = Date.now();
        const startVolume = this.currentMusic.volume;
        
        clearInterval(this.musicFadeInterval);
        
        this.musicFadeInterval = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            this.currentMusic.volume = startVolume * (1 - progress);
            
            if (progress >= 1) {
                clearInterval(this.musicFadeInterval);
                this.currentMusic.pause();
                this.currentMusic = null;
                if (callback) callback();
            }
        }, 50);
    }
    
    /**
     * Para a música
     */
    stopMusic() {
        this.fadeOutMusic();
    }
    
    /**
     * Pausa a música
     */
    pauseMusic() {
        if (this.currentMusic) {
            this.currentMusic.pause();
        }
    }
    
    /**
     * Resume a música
     */
    resumeMusic() {
        if (this.currentMusic && this.enabled && !this.muted) {
            this.currentMusic.play().catch(() => {});
        }
    }
    
    /**
     * Define volume master
     */
    setMasterVolume(value) {
        this.volume.master = Math.max(0, Math.min(1, value));
        this.updateVolumes();
        this.savePreferences();
    }
    
    /**
     * Define volume de SFX
     */
    setSFXVolume(value) {
        this.volume.sfx = Math.max(0, Math.min(1, value));
        this.savePreferences();
    }
    
    /**
     * Define volume de música
     */
    setMusicVolume(value) {
        this.volume.music = Math.max(0, Math.min(1, value));
        if (this.currentMusic) {
            this.currentMusic.volume = this.volume.music * this.volume.master;
        }
        this.savePreferences();
    }
    
    /**
     * Atualiza volumes de todos os sons ativos
     */
    updateVolumes() {
        if (this.currentMusic) {
            this.currentMusic.volume = this.volume.music * this.volume.master;
        }
    }
    
    /**
     * Muta/desmuta todos os sons
     */
    toggleMute() {
        this.muted = !this.muted;
        
        if (this.muted) {
            if (this.currentMusic) {
                this.currentMusic.pause();
            }
        } else {
            this.resumeMusic();
        }
        
        this.savePreferences();
        return this.muted;
    }
    
    /**
     * Habilita/desabilita áudio
     */
    toggleEnabled() {
        this.enabled = !this.enabled;
        
        if (!this.enabled) {
            this.stopAllSounds();
        }
        
        this.savePreferences();
        return this.enabled;
    }
    
    /**
     * Para todos os sons
     */
    stopAllSounds() {
        // Parar música
        if (this.currentMusic) {
            this.currentMusic.pause();
            this.currentMusic = null;
        }
        
        // Parar SFX ativos
        this.activeSounds.forEach(audio => {
            audio.pause();
            audio.currentTime = 0;
        });
        
        // Liberar pool
        this.pools.sfx.forEach(item => {
            item.inUse = false;
            item.type = null;
        });
        
        this.activeSounds.clear();
    }
    
    /**
     * Carrega preferências do localStorage
     */
    loadPreferences() {
        try {
            const prefs = localStorage.getItem('audioPreferences');
            if (prefs) {
                const parsed = JSON.parse(prefs);
                this.volume = { ...this.volume, ...parsed.volume };
                this.muted = parsed.muted ?? false;
                this.enabled = parsed.enabled ?? true;
            }
        } catch (e) {
            console.warn('⚠️ Erro ao carregar preferências de áudio:', e);
        }
    }
    
    /**
     * Salva preferências no localStorage
     */
    savePreferences() {
        try {
            const prefs = {
                volume: this.volume,
                muted: this.muted,
                enabled: this.enabled
            };
            localStorage.setItem('audioPreferences', JSON.stringify(prefs));
        } catch (e) {
            console.warn('⚠️ Erro ao salvar preferências de áudio:', e);
        }
    }
    
    /**
     * Cria UI de controle de volume
     */
    createVolumeUI() {
        const container = document.createElement('div');
        container.id = 'audio-controls';
        container.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: rgba(0, 0, 0, 0.8);
            padding: 15px;
            border-radius: 10px;
            color: white;
            font-family: Arial, sans-serif;
            z-index: 1000;
            display: none;
            min-width: 200px;
        `;
        
        container.innerHTML = `
            <div style="margin-bottom: 10px; font-weight: bold; text-align: center;">🔊 Áudio</div>
            <div style="margin-bottom: 8px;">
                <label style="display: block; font-size: 12px; margin-bottom: 4px;">Master</label>
                <input type="range" id="volume-master" min="0" max="100" value="${this.volume.master * 100}" 
                    style="width: 100%; cursor: pointer;">
            </div>
            <div style="margin-bottom: 8px;">
                <label style="display: block; font-size: 12px; margin-bottom: 4px;">SFX</label>
                <input type="range" id="volume-sfx" min="0" max="100" value="${this.volume.sfx * 100}" 
                    style="width: 100%; cursor: pointer;">
            </div>
            <div style="margin-bottom: 8px;">
                <label style="display: block; font-size: 12px; margin-bottom: 4px;">Música</label>
                <input type="range" id="volume-music" min="0" max="100" value="${this.volume.music * 100}" 
                    style="width: 100%; cursor: pointer;">
            </div>
            <div style="text-align: center; margin-top: 10px;">
                <button id="mute-toggle" style="cursor: pointer; padding: 5px 15px; border-radius: 5px; border: none;">
                    ${this.muted ? '🔇 Desmutar' : '🔊 Mutar'}
                </button>
            </div>
        `;
        
        document.body.appendChild(container);
        
        // Event listeners
        container.querySelector('#volume-master').addEventListener('input', (e) => {
            this.setMasterVolume(e.target.value / 100);
        });
        
        container.querySelector('#volume-sfx').addEventListener('input', (e) => {
            this.setSFXVolume(e.target.value / 100);
        });
        
        container.querySelector('#volume-music').addEventListener('input', (e) => {
            this.setMusicVolume(e.target.value / 100);
        });
        
        container.querySelector('#mute-toggle').addEventListener('click', () => {
            const isMuted = this.toggleMute();
            container.querySelector('#mute-toggle').textContent = isMuted ? '🔇 Desmutar' : '🔊 Mutar';
        });
        
        this.volumeUI = container;
        
        // Botão de toggle
        this.createAudioToggleButton();
        
        return container;
    }
    
    /**
     * Cria botão de toggle para audio controls
     */
    createAudioToggleButton() {
        const button = document.createElement('button');
        button.id = 'audio-toggle-btn';
        button.innerHTML = '🔊';
        button.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            border: none;
            background: rgba(0, 0, 0, 0.7);
            color: white;
            font-size: 20px;
            cursor: pointer;
            z-index: 1001;
            transition: transform 0.2s;
        `;
        
        button.addEventListener('mouseenter', () => button.style.transform = 'scale(1.1)');
        button.addEventListener('mouseleave', () => button.style.transform = 'scale(1)');
        button.addEventListener('click', () => {
            if (this.volumeUI) {
                const isVisible = this.volumeUI.style.display !== 'none';
                this.volumeUI.style.display = isVisible ? 'none' : 'block';
            }
        });
        
        document.body.appendChild(button);
        
        // Mostrar UI inicialmente por 3 segundos
        setTimeout(() => {
            if (this.volumeUI) {
                this.volumeUI.style.display = 'block';
                setTimeout(() => {
                    if (this.volumeUI) {
                        this.volumeUI.style.display = 'none';
                    }
                }, 3000);
            }
        }, 1000);
    }
    
    /**
     * Retorna dados de análise de áudio para visualização
     */
    getAudioData() {
        if (!this.analyser) return null;
        
        const bufferLength = this.analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        this.analyser.getByteFrequencyData(dataArray);
        
        return {
            data: dataArray,
            average: dataArray.reduce((a, b) => a + b) / bufferLength,
            bufferLength
        };
    }
}

// Exportar para uso global
window.AudioManager = AudioManager;

// Criar instância global
window.audioManager = new AudioManager();
