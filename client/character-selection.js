/**
 * Character Selection Manager
 * Gerencia a tela de seleção e criação de personagens
 */

class CharacterSelectionManager {
    constructor() {
        this.selectedSlot = null;
        this.modal = null;
        this.form = null;
        this.characterSlots = [null, null]; // 2 slots disponíveis
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.loadUserCharacters();
        console.log('🎮 Character Selection Manager inicializado');
    }
    
    setupEventListeners() {
        // Botões de criar personagem
        document.querySelectorAll('.btn-create-character').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const slot = parseInt(e.target.dataset.slot);
                this.openCreateCharacterModal(slot);
            });
        });
        
        // Botão de entrar no jogo
        const enterBtn = document.getElementById('enterGameBtn');
        if (enterBtn) {
            enterBtn.addEventListener('click', () => {
                this.enterGame();
            });
        }
        
        // Modal de criação
        this.modal = document.getElementById('createCharacterModal');
        this.form = document.getElementById('newCharacterForm');
        
        if (this.form) {
            this.form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.createCharacter();
            });
        }
        
        // Botão cancelar do modal
        const cancelBtn = document.getElementById('cancelCreateBtn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                this.closeModal();
            });
        }
        
        // Botão fechar do modal
        const closeBtn = this.modal?.querySelector('.modal-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.closeModal();
            });
        }
        
        // Clicar fora do modal para fechar
        this.modal?.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.closeModal();
            }
        });
    }
    
    loadUserCharacters() {
        // Simular carregamento de personagens (vazio no início)
        this.updateCharacterSlots();
    }
    
    updateCharacterSlots() {
        const slots = document.querySelectorAll('.character-slot');
        
        slots.forEach((slot, index) => {
            const character = this.characterSlots[index];
            const slotContent = slot.querySelector('.slot-empty') || slot.querySelector('.slot-filled');
            
            if (character) {
                // Mostrar personagem existente
                this.showCharacterInSlot(slot, character);
            } else {
                // Mostrar slot vazio
                this.showEmptySlot(slot);
            }
        });
        
        this.updateEnterButton();
    }
    
    showEmptySlot(slot) {
        slot.innerHTML = `
            <div class="slot-empty">
                <div class="empty-icon">➕</div>
                <div class="empty-text">Vaga Disponível</div>
                <button class="btn-create-character" data-slot="${slot.dataset.slot}">Criar Personagem</button>
            </div>
        `;
        
        // Re-adicionar event listener
        const createBtn = slot.querySelector('.btn-create-character');
        createBtn.addEventListener('click', (e) => {
            const slotIndex = parseInt(e.target.dataset.slot);
            this.openCreateCharacterModal(slotIndex);
        });
    }
    
    showCharacterInSlot(slot, character) {
        slot.innerHTML = `
            <div class="slot-filled">
                <div class="character-info">
                    <div class="character-avatar">${character.avatar || '👤'}</div>
                    <div class="character-details">
                        <div class="character-name">${character.name}</div>
                        <div class="character-class">${character.class || 'Aprendiz'}</div>
                        <div class="character-level">Nível ${character.level || 1}</div>
                    </div>
                </div>
                <button class="btn-select-character" data-slot="${slot.dataset.slot}">Selecionar</button>
            </div>
        `;
        
        // Adicionar event listener para seleção
        const selectBtn = slot.querySelector('.btn-select-character');
        selectBtn.addEventListener('click', (e) => {
            const slotIndex = parseInt(e.target.dataset.slot);
            this.selectCharacter(slotIndex);
        });
    }
    
    openCreateCharacterModal(slot) {
        this.selectedSlot = slot;
        
        if (this.modal) {
            this.modal.classList.remove('hidden');
            this.modal.style.display = 'flex';
            
            // Limpar formulário
            if (this.form) {
                this.form.reset();
            }
            
            // Focar no primeiro campo
            const nameInput = document.getElementById('newHeroName');
            if (nameInput) {
                setTimeout(() => nameInput.focus(), 100);
            }
        }
    }
    
    closeModal() {
        if (this.modal) {
            this.modal.classList.add('hidden');
            this.modal.style.display = 'none';
            this.selectedSlot = null;
        }
    }
    
    async createCharacter() {
        if (!this.form || this.selectedSlot === null) return;
        
        const formData = new FormData(this.form);
        const characterData = {
            name: formData.get('name') || document.getElementById('newHeroName').value,
            race: formData.get('race') || document.getElementById('newRaceSelect').value,
            class: 'Aprendiz', // Classe fixa
            slot: this.selectedSlot
        };
        
        // Validação básica
        if (!characterData.name || characterData.name.length < 3) {
            this.showStatus('error', '❌ Nome deve ter pelo menos 3 caracteres');
            return;
        }
        
        if (!characterData.race) {
            this.showStatus('error', '❌ Selecione uma raça');
            return;
        }
        
        this.showStatus('info', '🔄 Criando personagem...');
        
        try {
            // Simular criação bem-sucedida
            setTimeout(() => {
                this.characterSlots[this.selectedSlot] = {
                    name: characterData.name,
                    race: characterData.race,
                    class: characterData.class,
                    level: 1,
                    avatar: this.getRaceAvatar(characterData.race)
                };
                
                this.updateCharacterSlots();
                this.closeModal();
                this.showStatus('success', '✅ Personagem criado com sucesso!');
            }, 1000);
            
        } catch (error) {
            console.error('Erro ao criar personagem:', error);
            this.showStatus('error', '❌ Erro ao criar personagem');
        }
    }
    
    selectCharacter(slotIndex) {
        this.selectedSlot = slotIndex;
        this.updateEnterButton();
        
        // Visual feedback
        document.querySelectorAll('.character-slot').forEach((slot, index) => {
            if (index === slotIndex) {
                slot.classList.add('selected');
            } else {
                slot.classList.remove('selected');
            }
        });
    }
    
    enterGame() {
        if (this.selectedSlot === null || !this.characterSlots[this.selectedSlot]) {
            this.showStatus('error', '❌ Selecione um personagem');
            return;
        }
        
        const character = this.characterSlots[this.selectedSlot];
        this.showStatus('info', '🔄 Entrando no jogo...');
        
        // Simular entrada no jogo
        setTimeout(() => {
            console.log('🎮 Entrando no jogo com:', character);
            this.showGameScreen();
        }, 1000);
    }
    
    updateEnterButton() {
        const enterBtn = document.getElementById('enterGameBtn');
        if (enterBtn) {
            const hasSelection = this.selectedSlot !== null && this.characterSlots[this.selectedSlot];
            enterBtn.disabled = !hasSelection;
        }
    }
    
    showGameScreen() {
        // Ocultar tela de seleção
        const characterScreen = document.getElementById('characterScreen');
        const gameScreen = document.getElementById('gameScreen');
        
        if (characterScreen) characterScreen.style.display = 'none';
        if (gameScreen) gameScreen.style.display = 'block';
    }
    
    getRaceAvatar(race) {
        const avatars = {
            human: '👤',
            elf: '🧝',
            dwarf: '⛏️',
            orc: '👹'
        };
        return avatars[race] || '👤';
    }
    
    showStatus(type, message) {
        const statusDiv = document.getElementById('characterStatus');
        if (statusDiv) {
            statusDiv.className = `login-status ${type}`;
            statusDiv.textContent = message;
            statusDiv.style.display = 'block';
            
            // Auto-esconder após 3 segundos para sucesso/info
            if (type === 'success' || type === 'info') {
                setTimeout(() => {
                    statusDiv.style.display = 'none';
                }, 3000);
            }
        }
        console.log('Character Status:', message);
    }
}

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    window.characterSelection = new CharacterSelectionManager();
});

console.log('Character Selection script carregado!');
