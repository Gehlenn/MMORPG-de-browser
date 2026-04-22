/**
 * SettingsUI - Interface do Painel de Configurações
 *
 * Responsabilidades:
 * - Renderizar painel de configurações
 * - Controles interativos (sliders, toggles, selects)
 * - Preview em tempo real das mudanças
 * - Importar/exportar configurações
 * - Atalho de teclado (O)
 */

class SettingsUI {
    constructor(settingsManager) {
        this.settingsManager = settingsManager;
        this.visible = false;
        this.elements = {};
        this.currentTab = 'general';
        this.initialized = false;
    }

    init() {
        if (this.initialized) return;

        this.createStyles();
        this.createPanel();
        this.bindKeys();

        this.initialized = true;
        console.log('⚙️ SettingsUI inicializada');
    }

    createStyles() {
        const styles = document.createElement('style');
        styles.id = 'settings-ui-styles';
        styles.textContent = `
            .settings-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.7);
                backdrop-filter: blur(5px);
                z-index: 100000;
                display: none;
                justify-content: center;
                align-items: center;
                opacity: 0;
                transition: opacity 0.3s ease;
            }

            .settings-overlay.visible {
                display: flex;
                opacity: 1;
            }

            .settings-panel {
                width: 90%;
                max-width: 800px;
                height: 90%;
                max-height: 600px;
                background: linear-gradient(145deg, #1a1a2e 0%, #16213e 100%);
                border: 1px solid rgba(255, 215, 0, 0.3);
                border-radius: 16px;
                box-shadow: 0 20px 60px rgba(0,0,0,0.5), 0 0 30px rgba(255, 215, 0, 0.1);
                display: flex;
                flex-direction: column;
                overflow: hidden;
                transform: scale(0.9);
                transition: transform 0.3s ease;
            }

            .settings-overlay.visible .settings-panel {
                transform: scale(1);
            }

            .settings-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 20px 25px;
                border-bottom: 1px solid rgba(255,255,255,0.1);
                background: rgba(0,0,0,0.2);
            }

            .settings-title {
                font-family: 'Cinzel', serif;
                font-size: 24px;
                color: #ffd700;
                margin: 0;
                text-shadow: 0 2px 4px rgba(0,0,0,0.3);
            }

            .settings-close {
                background: none;
                border: none;
                color: rgba(255,255,255,0.7);
                font-size: 28px;
                cursor: pointer;
                padding: 0;
                width: 40px;
                height: 40px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                transition: all 0.2s ease;
            }

            .settings-close:hover {
                background: rgba(255,255,255,0.1);
                color: #fff;
            }

            .settings-body {
                display: flex;
                flex: 1;
                overflow: hidden;
            }

            .settings-tabs {
                width: 200px;
                background: rgba(0,0,0,0.2);
                border-right: 1px solid rgba(255,255,255,0.1);
                padding: 15px 0;
            }

            .settings-tab {
                padding: 12px 20px;
                cursor: pointer;
                color: rgba(255,255,255,0.7);
                font-size: 14px;
                transition: all 0.2s ease;
                border-left: 3px solid transparent;
                display: flex;
                align-items: center;
                gap: 10px;
            }

            .settings-tab:hover {
                background: rgba(255,255,255,0.05);
                color: #fff;
            }

            .settings-tab.active {
                background: rgba(255, 215, 0, 0.1);
                color: #ffd700;
                border-left-color: #ffd700;
            }

            .settings-tab-icon {
                font-size: 18px;
            }

            .settings-content {
                flex: 1;
                padding: 25px;
                overflow-y: auto;
            }

            .settings-section {
                display: none;
            }

            .settings-section.active {
                display: block;
            }

            .settings-section-title {
                font-family: 'Cinzel', serif;
                font-size: 18px;
                color: #ffd700;
                margin-bottom: 20px;
                padding-bottom: 10px;
                border-bottom: 1px solid rgba(255,215,0,0.3);
            }

            .setting-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 15px 0;
                border-bottom: 1px solid rgba(255,255,255,0.05);
            }

            .setting-item:last-child {
                border-bottom: none;
            }

            .setting-info {
                flex: 1;
            }

            .setting-label {
                font-weight: 600;
                color: #fff;
                margin-bottom: 4px;
            }

            .setting-description {
                font-size: 12px;
                color: rgba(255,255,255,0.5);
            }

            .setting-control {
                margin-left: 20px;
            }

            /* Toggle Switch */
            .setting-toggle {
                position: relative;
                width: 50px;
                height: 26px;
                background: rgba(255,255,255,0.1);
                border-radius: 13px;
                cursor: pointer;
                transition: background 0.3s ease;
            }

            .setting-toggle.active {
                background: #4caf50;
            }

            .setting-toggle::after {
                content: '';
                position: absolute;
                top: 3px;
                left: 3px;
                width: 20px;
                height: 20px;
                background: #fff;
                border-radius: 50%;
                transition: transform 0.3s ease;
            }

            .setting-toggle.active::after {
                transform: translateX(24px);
            }

            /* Slider */
            .setting-slider {
                display: flex;
                align-items: center;
                gap: 10px;
            }

            .setting-slider input[type="range"] {
                width: 150px;
                height: 6px;
                background: rgba(255,255,255,0.1);
                border-radius: 3px;
                outline: none;
                -webkit-appearance: none;
            }

            .setting-slider input[type="range"]::-webkit-slider-thumb {
                -webkit-appearance: none;
                width: 18px;
                height: 18px;
                background: #ffd700;
                border-radius: 50%;
                cursor: pointer;
            }

            .setting-slider-value {
                min-width: 50px;
                text-align: right;
                color: #ffd700;
                font-weight: 600;
            }

            /* Select */
            .setting-select {
                padding: 8px 15px;
                background: rgba(0,0,0,0.3);
                border: 1px solid rgba(255,255,255,0.2);
                border-radius: 8px;
                color: #fff;
                font-size: 14px;
                cursor: pointer;
                min-width: 150px;
            }

            .setting-select:focus {
                outline: none;
                border-color: #ffd700;
            }

            .setting-select option {
                background: #1a1a2e;
            }

            /* Color Buttons */
            .color-options {
                display: flex;
                gap: 10px;
            }

            .color-btn {
                width: 32px;
                height: 32px;
                border-radius: 50%;
                border: 3px solid transparent;
                cursor: pointer;
                transition: all 0.2s ease;
            }

            .color-btn:hover {
                transform: scale(1.1);
            }

            .color-btn.active {
                border-color: #fff;
                box-shadow: 0 0 10px currentColor;
            }

            .color-btn.gold { background: #ffd700; color: #ffd700; }
            .color-btn.blue { background: #2196f3; color: #2196f3; }
            .color-btn.purple { background: #9c27b0; color: #9c27b0; }
            .color-btn.red { background: #f44336; color: #f44336; }
            .color-btn.green { background: #4caf50; color: #4caf50; }

            /* Preset Buttons */
            .preset-buttons {
                display: flex;
                gap: 10px;
                margin-bottom: 20px;
            }

            .preset-btn {
                padding: 10px 20px;
                border: 1px solid rgba(255,255,255,0.2);
                background: rgba(0,0,0,0.2);
                color: rgba(255,255,255,0.8);
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.2s ease;
                font-size: 13px;
            }

            .preset-btn:hover {
                background: rgba(255,255,255,0.1);
                color: #fff;
            }

            .preset-btn.active {
                background: rgba(255, 215, 0, 0.2);
                border-color: #ffd700;
                color: #ffd700;
            }

            /* Footer */
            .settings-footer {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 15px 25px;
                border-top: 1px solid rgba(255,255,255,0.1);
                background: rgba(0,0,0,0.2);
            }

            .settings-actions {
                display: flex;
                gap: 10px;
            }

            .settings-btn {
                padding: 10px 20px;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                font-size: 13px;
                transition: all 0.2s ease;
                font-family: inherit;
            }

            .settings-btn-secondary {
                background: rgba(255,255,255,0.1);
                color: #fff;
            }

            .settings-btn-secondary:hover {
                background: rgba(255,255,255,0.2);
            }

            .settings-btn-primary {
                background: linear-gradient(135deg, #ffd700 0%, #ffaa00 100%);
                color: #1a1a2e;
                font-weight: 600;
            }

            .settings-btn-primary:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(255, 215, 0, 0.4);
            }

            .settings-version {
                font-size: 12px;
                color: rgba(255,255,255,0.4);
            }

            /* Scrollbar */
            .settings-content::-webkit-scrollbar {
                width: 8px;
            }

            .settings-content::-webkit-scrollbar-track {
                background: rgba(0,0,0,0.1);
                border-radius: 4px;
            }

            .settings-content::-webkit-scrollbar-thumb {
                background: rgba(255, 215, 0, 0.3);
                border-radius: 4px;
            }

            .settings-content::-webkit-scrollbar-thumb:hover {
                background: rgba(255, 215, 0, 0.5);
            }

            /* Responsive */
            @media (max-width: 768px) {
                .settings-panel {
                    width: 100%;
                    height: 100%;
                    max-height: none;
                    border-radius: 0;
                }

                .settings-body {
                    flex-direction: column;
                }

                .settings-tabs {
                    width: 100%;
                    display: flex;
                    overflow-x: auto;
                    border-right: none;
                    border-bottom: 1px solid rgba(255,255,255,0.1);
                    padding: 10px;
                }

                .settings-tab {
                    white-space: nowrap;
                    border-left: none;
                    border-bottom: 3px solid transparent;
                }

                .settings-tab.active {
                    border-left-color: transparent;
                    border-bottom-color: #ffd700;
                }
            }
        `;

        if (!document.getElementById('settings-ui-styles')) {
            document.head.appendChild(styles);
        }
    }

    createPanel() {
        this.elements.overlay = document.createElement('div');
        this.elements.overlay.className = 'settings-overlay';
        this.elements.overlay.innerHTML = `
            <div class="settings-panel">
                <div class="settings-header">
                    <h2 class="settings-title">⚙️ Configurações</h2>
                    <button class="settings-close">×</button>
                </div>

                <div class="settings-body">
                    <div class="settings-tabs">
                        <div class="settings-tab active" data-tab="general">
                            <span class="settings-tab-icon">🎨</span>
                            Geral
                        </div>
                        <div class="settings-tab" data-tab="display">
                            <span class="settings-tab-icon">🖥️</span>
                            Display
                        </div>
                        <div class="settings-tab" data-tab="notifications">
                            <span class="settings-tab-icon">🔔</span>
                            Notificações
                        </div>
                        <div class="settings-tab" data-tab="accessibility">
                            <span class="settings-tab-icon">♿</span>
                            Acessibilidade
                        </div>
                        <div class="settings-tab" data-tab="gameplay">
                            <span class="settings-tab-icon">🎮</span>
                            Gameplay
                        </div>
                        <div class="settings-tab" data-tab="performance">
                            <span class="settings-tab-icon">⚡</span>
                            Performance
                        </div>
                    </div>

                    <div class="settings-content">
                        <!-- Geral -->
                        <div class="settings-section active" data-section="general">
                            <h3 class="settings-section-title">Configurações Gerais</h3>

                            <div class="preset-buttons">
                                <button class="preset-btn" data-preset="performance">Performance</button>
                                <button class="preset-btn active" data-preset="balanced">Balanceado</button>
                                <button class="preset-btn" data-preset="quality">Qualidade</button>
                            </div>

                            <div class="setting-item">
                                <div class="setting-info">
                                    <div class="setting-label">Tema</div>
                                    <div class="setting-description">Escolha o tema visual do jogo</div>
                                </div>
                                <div class="setting-control">
                                    <select class="setting-select" data-setting="theme">
                                        <option value="dark">Escuro</option>
                                        <option value="light">Claro</option>
                                        <option value="auto">Automático</option>
                                    </select>
                                </div>
                            </div>

                            <div class="setting-item">
                                <div class="setting-info">
                                    <div class="setting-label">Cor de Destaque</div>
                                    <div class="setting-description">Cor principal da interface</div>
                                </div>
                                <div class="setting-control">
                                    <div class="color-options">
                                        <div class="color-btn gold active" data-color="gold"></div>
                                        <div class="color-btn blue" data-color="blue"></div>
                                        <div class="color-btn purple" data-color="purple"></div>
                                        <div class="color-btn red" data-color="red"></div>
                                        <div class="color-btn green" data-color="green"></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Display -->
                        <div class="settings-section" data-section="display">
                            <h3 class="settings-section-title">Configurações de Display</h3>

                            <div class="setting-item">
                                <div class="setting-info">
                                    <div class="setting-label">Escala da UI</div>
                                    <div class="setting-description">Tamanho dos elementos da interface</div>
                                </div>
                                <div class="setting-control setting-slider">
                                    <input type="range" min="75" max="150" step="25" value="100" data-setting="uiScale">
                                    <span class="setting-slider-value">100%</span>
                                </div>
                            </div>

                            <div class="setting-item">
                                <div class="setting-info">
                                    <div class="setting-label">Tamanho da Fonte</div>
                                    <div class="setting-description">Tamanho do texto no jogo</div>
                                </div>
                                <div class="setting-control">
                                    <select class="setting-select" data-setting="fontSize">
                                        <option value="small">Pequeno</option>
                                        <option value="medium" selected>Médio</option>
                                        <option value="large">Grande</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <!-- Notificações -->
                        <div class="settings-section" data-section="notifications">
                            <h3 class="settings-section-title">Configurações de Notificações</h3>

                            <div class="setting-item">
                                <div class="setting-info">
                                    <div class="setting-label">Habilitar Toasts</div>
                                    <div class="setting-description">Mostrar notificações popup</div>
                                </div>
                                <div class="setting-control">
                                    <div class="setting-toggle active" data-setting="enableToasts"></div>
                                </div>
                            </div>

                            <div class="setting-item">
                                <div class="setting-info">
                                    <div class="setting-label">Posição dos Toasts</div>
                                    <div class="setting-description">Onde as notificações aparecem</div>
                                </div>
                                <div class="setting-control">
                                    <select class="setting-select" data-setting="toastPosition">
                                        <option value="top-left">Superior Esquerdo</option>
                                        <option value="top-right" selected>Superior Direito</option>
                                        <option value="bottom-left">Inferior Esquerdo</option>
                                        <option value="bottom-right">Inferior Direito</option>
                                    </select>
                                </div>
                            </div>

                            <div class="setting-item">
                                <div class="setting-info">
                                    <div class="setting-label">Duração dos Toasts</div>
                                    <div class="setting-description">Tempo que as notificações ficam visíveis</div>
                                </div>
                                <div class="setting-control setting-slider">
                                    <input type="range" min="2000" max="10000" step="1000" value="5000" data-setting="toastDuration">
                                    <span class="setting-slider-value">5s</span>
                                </div>
                            </div>
                        </div>

                        <!-- Acessibilidade -->
                        <div class="settings-section" data-section="accessibility">
                            <h3 class="settings-section-title">Configurações de Acessibilidade</h3>

                            <div class="setting-item">
                                <div class="setting-info">
                                    <div class="setting-label">Reduzir Movimento</div>
                                    <div class="setting-description">Desativar animações para quem tem problemas de movimento</div>
                                </div>
                                <div class="setting-control">
                                    <div class="setting-toggle" data-setting="reducedMotion"></div>
                                </div>
                            </div>

                            <div class="setting-item">
                                <div class="setting-info">
                                    <div class="setting-label">Alto Contraste</div>
                                    <div class="setting-description">Aumentar contraste entre elementos</div>
                                </div>
                                <div class="setting-control">
                                    <div class="setting-toggle" data-setting="highContrast"></div>
                                </div>
                            </div>

                            <div class="setting-item">
                                <div class="setting-info">
                                    <div class="setting-label">Modo Daltônico</div>
                                    <div class="setting-description">Ajustar cores para diferentes tipos de daltonismo</div>
                                </div>
                                <div class="setting-control">
                                    <select class="setting-select" data-setting="colorBlindMode">
                                        <option value="none">Nenhum</option>
                                        <option value="deuteranopia">Deuteranopia</option>
                                        <option value="protanopia">Protanopia</option>
                                        <option value="tritanopia">Tritanopia</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <!-- Gameplay -->
                        <div class="settings-section" data-section="gameplay">
                            <h3 class="settings-section-title">Configurações de Gameplay</h3>

                            <div class="setting-item">
                                <div class="setting-info">
                                    <div class="setting-label">Loot Automático</div>
                                    <div class="setting-description">Coletar itens automaticamente ao passar por cima</div>
                                </div>
                                <div class="setting-control">
                                    <div class="setting-toggle active" data-setting="autoLoot"></div>
                                </div>
                            </div>

                            <div class="setting-item">
                                <div class="setting-info">
                                    <div class="setting-label">Números de Dano</div>
                                    <div class="setting-description">Mostrar valores de dano flutuantes</div>
                                </div>
                                <div class="setting-control">
                                    <div class="setting-toggle active" data-setting="showDamageNumbers"></div>
                                </div>
                            </div>

                            <div class="setting-item">
                                <div class="setting-info">
                                    <div class="setting-label">Nomes dos Jogadores</div>
                                    <div class="setting-description">Mostrar nomes acima dos personagens</div>
                                </div>
                                <div class="setting-control">
                                    <div class="setting-toggle active" data-setting="showPlayerNames"></div>
                                </div>
                            </div>

                            <div class="setting-item">
                                <div class="setting-info">
                                    <div class="setting-label">Tags de Guilda</div>
                                    <div class="setting-description">Mostrar nome da guilda nos jogadores</div>
                                </div>
                                <div class="setting-control">
                                    <div class="setting-toggle active" data-setting="showGuildTags"></div>
                                </div>
                            </div>

                            <div class="setting-item">
                                <div class="setting-info">
                                    <div class="setting-label">Tremor de Câmera</div>
                                    <div class="setting-description">Efeito de tremor ao receber dano</div>
                                </div>
                                <div class="setting-control">
                                    <div class="setting-toggle active" data-setting="cameraShake"></div>
                                </div>
                            </div>
                        </div>

                        <!-- Performance -->
                        <div class="settings-section" data-section="performance">
                            <h3 class="settings-section-title">Configurações de Performance</h3>

                            <div class="setting-item">
                                <div class="setting-info">
                                    <div class="setting-label">Habilitar Animações</div>
                                    <div class="setting-description">Animações de UI e efeitos visuais</div>
                                </div>
                                <div class="setting-control">
                                    <div class="setting-toggle active" data-setting="enableAnimations"></div>
                                </div>
                            </div>

                            <div class="setting-item">
                                <div class="setting-info">
                                    <div class="setting-label">Efeitos de Partículas</div>
                                    <div class="setting-description">Explosões de partículas e efeitos especiais</div>
                                </div>
                                <div class="setting-control">
                                    <div class="setting-toggle active" data-setting="particleEffects"></div>
                                </div>
                            </div>

                            <div class="setting-item">
                                <div class="setting-info">
                                    <div class="setting-label">Qualidade das Sombras</div>
                                    <div class="setting-description">Nível de detalhe das sombras</div>
                                </div>
                                <div class="setting-control">
                                    <select class="setting-select" data-setting="shadowQuality">
                                        <option value="low">Baixa</option>
                                        <option value="medium">Média</option>
                                        <option value="high" selected>Alta</option>
                                    </select>
                                </div>
                            </div>

                            <div class="setting-item">
                                <div class="setting-info">
                                    <div class="setting-label">Densidade de Partículas</div>
                                    <div class="setting-description">Quantidade de partículas renderizadas</div>
                                </div>
                                <div class="setting-control setting-slider">
                                    <input type="range" min="0" max="100" step="50" value="100" data-setting="particleDensity">
                                    <span class="setting-slider-value">100%</span>
                                </div>
                            </div>

                            <div class="setting-item">
                                <div class="setting-info">
                                    <div class="setting-label">Limite de FPS</div>
                                    <div class="setting-description">Máximo de frames por segundo</div>
                                </div>
                                <div class="setting-control">
                                    <select class="setting-select" data-setting="maxFPS">
                                        <option value="30">30 FPS</option>
                                        <option value="60" selected>60 FPS</option>
                                        <option value="120">120 FPS</option>
                                        <option value="0">Ilimitado</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="settings-footer">
                    <div class="settings-actions">
                        <button class="settings-btn settings-btn-secondary" id="settings-import">📥 Importar</button>
                        <button class="settings-btn settings-btn-secondary" id="settings-export">📤 Exportar</button>
                        <button class="settings-btn settings-btn-secondary" id="settings-reset">🔄 Resetar</button>
                    </div>
                    <button class="settings-btn settings-btn-primary" id="settings-close-btn">Fechar (O)</button>
                </div>
            </div>
        `;

        document.body.appendChild(this.elements.overlay);

        // Cache elements
        this.elements.panel = this.elements.overlay.querySelector('.settings-panel');
        this.elements.closeBtn = this.elements.overlay.querySelector('.settings-close');
        this.elements.closeBtnFooter = this.elements.overlay.querySelector('#settings-close-btn');
        this.elements.tabs = this.elements.overlay.querySelectorAll('.settings-tab');
        this.elements.sections = this.elements.overlay.querySelectorAll('.settings-section');
        this.elements.toggles = this.elements.overlay.querySelectorAll('.setting-toggle');
        this.elements.sliders = this.elements.overlay.querySelectorAll('input[type="range"]');
        this.elements.selects = this.elements.overlay.querySelectorAll('.setting-select');
        this.elements.colorBtns = this.elements.overlay.querySelectorAll('.color-btn');
        this.elements.presetBtns = this.elements.overlay.querySelectorAll('.preset-btn');

        this.bindEvents();
    }

    bindEvents() {
        // Close buttons
        this.elements.closeBtn.addEventListener('click', () => this.hide());
        this.elements.closeBtnFooter.addEventListener('click', () => this.hide());

        // Close on overlay click
        this.elements.overlay.addEventListener('click', (e) => {
            if (e.target === this.elements.overlay) {
                this.hide();
            }
        });

        // Tab switching
        this.elements.tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const targetTab = tab.dataset.tab;
                this.switchTab(targetTab);
            });
        });

        // Toggle switches
        this.elements.toggles.forEach(toggle => {
            toggle.addEventListener('click', () => {
                const setting = toggle.dataset.setting;
                const isActive = toggle.classList.contains('active');
                toggle.classList.toggle('active');
                this.settingsManager.set(setting, !isActive);
            });
        });

        // Sliders
        this.elements.sliders.forEach(slider => {
            slider.addEventListener('input', () => {
                const setting = slider.dataset.setting;
                const value = parseInt(slider.value);

                // Update display
                const display = slider.parentElement.querySelector('.setting-slider-value');
                if (display) {
                    if (setting === 'toastDuration') {
                        display.textContent = (value / 1000) + 's';
                    } else if (setting === 'uiScale') {
                        display.textContent = value + '%';
                    } else {
                        display.textContent = value + '%';
                    }
                }

                this.settingsManager.set(setting, value);
            });
        });

        // Selects
        this.elements.selects.forEach(select => {
            select.addEventListener('change', () => {
                const setting = select.dataset.setting;
                this.settingsManager.set(setting, select.value);
            });
        });

        // Color buttons
        this.elements.colorBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const color = btn.dataset.color;

                this.elements.colorBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                this.settingsManager.set('accentColor', color);
            });
        });

        // Preset buttons
        this.elements.presetBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const preset = btn.dataset.preset;
                this.applyPreset(preset);
            });
        });

        // Footer buttons
        document.getElementById('settings-import').addEventListener('click', () => this.importSettings());
        document.getElementById('settings-export').addEventListener('click', () => this.exportSettings());
        document.getElementById('settings-reset').addEventListener('click', () => this.resetSettings());
    }

    bindKeys() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'o' || e.key === 'O') {
                if (!this.visible && !e.ctrlKey && !e.altKey && !e.metaKey) {
                    this.show();
                } else if (this.visible) {
                    this.hide();
                }
            } else if (e.key === 'Escape' && this.visible) {
                this.hide();
            }
        });
    }

    show() {
        if (this.visible) return;

        this.visible = true;
        this.elements.overlay.classList.add('visible');
        this.syncUIWithSettings();

        if (window.toastManager) {
            window.toastManager.info('Use as abas para navegar entre as configurações', 'Dica', 3000);
        }
    }

    hide() {
        if (!this.visible) return;

        this.visible = false;
        this.elements.overlay.classList.remove('visible');
    }

    toggle() {
        if (this.visible) {
            this.hide();
        } else {
            this.show();
        }
    }

    switchTab(tabName) {
        this.currentTab = tabName;

        // Update tabs
        this.elements.tabs.forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });

        // Update sections
        this.elements.sections.forEach(section => {
            section.classList.toggle('active', section.dataset.section === tabName);
        });
    }

    syncUIWithSettings() {
        const settings = this.settingsManager.getAllSettings();

        // Toggles
        this.elements.toggles.forEach(toggle => {
            const setting = toggle.dataset.setting;
            if (settings[setting]) {
                toggle.classList.add('active');
            } else {
                toggle.classList.remove('active');
            }
        });

        // Sliders
        this.elements.sliders.forEach(slider => {
            const setting = slider.dataset.setting;
            if (settings[setting] !== undefined) {
                slider.value = settings[setting];

                const display = slider.parentElement.querySelector('.setting-slider-value');
                if (display) {
                    if (setting === 'toastDuration') {
                        display.textContent = (settings[setting] / 1000) + 's';
                    } else if (setting === 'uiScale') {
                        display.textContent = settings[setting] + '%';
                    } else {
                        display.textContent = settings[setting] + '%';
                    }
                }
            }
        });

        // Selects
        this.elements.selects.forEach(select => {
            const setting = select.dataset.setting;
            if (settings[setting]) {
                select.value = settings[setting];
            }
        });

        // Color buttons
        this.elements.colorBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.color === settings.accentColor);
        });
    }

    applyPreset(presetName) {
        this.settingsManager.applyPreset(presetName);
        this.syncUIWithSettings();

        // Update preset buttons
        this.elements.presetBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.preset === presetName);
        });

        if (window.toastManager) {
            window.toastManager.success(`Preset "${presetName}" aplicado!`, 'Configurações');
        }
    }

    importSettings() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';

        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    if (this.settingsManager.importSettings(event.target.result)) {
                        this.syncUIWithSettings();
                        if (window.toastManager) {
                            window.toastManager.success('Configurações importadas!', 'Sucesso');
                        }
                    }
                } catch (err) {
                    if (window.toastManager) {
                        window.toastManager.error('Arquivo inválido', 'Erro');
                    }
                }
            };
            reader.readAsText(file);
        };

        input.click();
    }

    exportSettings() {
        const data = this.settingsManager.exportSettings();
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = 'eldoria-settings.json';
        a.click();

        URL.revokeObjectURL(url);

        if (window.toastManager) {
            window.toastManager.success('Configurações exportadas!', 'Sucesso');
        }
    }

    resetSettings() {
        if (confirm('Tem certeza que deseja resetar todas as configurações para o padrão?')) {
            this.settingsManager.resetToDefaults();
            this.syncUIWithSettings();

            if (window.toastManager) {
                window.toastManager.info('Configurações resetadas', 'Reset');
            }
        }
    }
}

window.SettingsUI = SettingsUI;
