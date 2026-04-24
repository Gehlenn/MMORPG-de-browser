/**
 * LoginManager - Sistema de Login inspirado no WoW
 * Simplificado, robusto e auto-contido
 */
class LoginManager {
    constructor() {
        console.log('🔐 LoginManager inicializando...');
        
        this.currentUser = null;
        this.selectedCharacter = null;
        this.characters = {};
        
        this.init();
    }
    
    init() {
        this.loadElements();
        this.setupEventListeners();
        this.checkExistingSession();
        console.log('✅ LoginManager pronto');
    }
    
    loadElements() {
        // Telas
        this.loginScreen = document.getElementById('loginScreen');
        this.characterScreen = document.getElementById('characterScreen');
        this.gameContainer = document.getElementById('gameContainer');
        
        // Login
        this.loginUsername = document.getElementById('loginUsername');
        this.loginPassword = document.getElementById('loginPassword');
        this.loginMessage = document.getElementById('loginMessage');
        
        // Criar conta
        this.createAccountForm = document.getElementById('createAccountForm');
        this.newUsername = document.getElementById('newUsername');
        this.newPassword = document.getElementById('newPassword');
        this.confirmPassword = document.getElementById('confirmPassword');
        
        // Criação de personagem
        this.characterCreation = document.getElementById('characterCreation');
        this.characterName = document.getElementById('characterName');
        this.characterRace = document.getElementById('characterRace');
        this.characterClass = document.getElementById('characterClass');
        
        console.log('📦 Elementos carregados');
    }
    
    setupEventListeners() {
        // Botões de login
        const loginBtn = document.getElementById('loginBtn');
        const createAccountBtn = document.getElementById('createAccountBtn');
        const backToLoginBtn = document.getElementById('backToLoginBtn');
        const doCreateAccountBtn = document.getElementById('doCreateAccountBtn');
        
        if (loginBtn) loginBtn.onclick = () => this.handleLogin();
        if (createAccountBtn) createAccountBtn.onclick = () => this.showCreateAccount();
        if (backToLoginBtn) backToLoginBtn.onclick = () => this.showLogin();
        if (doCreateAccountBtn) doCreateAccountBtn.onclick = () => this.handleCreateAccount();
        
        // Botões de personagem
        const enterWorldBtn = document.getElementById('enterWorldBtn');
        const createNewCharacterBtn = document.getElementById('createNewCharacterBtn');
        const logoutBtn = document.getElementById('logoutBtn');
        const cancelCreationBtn = document.getElementById('cancelCreationBtn');
        const createCharacterBtn = document.getElementById('createCharacterBtn');
        
        if (enterWorldBtn) enterWorldBtn.onclick = () => this.enterWorld();
        if (createNewCharacterBtn) createNewCharacterBtn.onclick = () => this.showCharacterCreation();
        if (logoutBtn) logoutBtn.onclick = () => this.logout();
        if (cancelCreationBtn) cancelCreationBtn.onclick = () => this.cancelCharacterCreation();
        if (createCharacterBtn) createCharacterBtn.onclick = () => this.createCharacter();
        
        // Cards de personagem - apenas 3 slots
        const cards = document.querySelectorAll('.character-card');
        cards.forEach((card, index) => {
            if (index < 3) {
                card.onclick = (e) => this.selectSlot(index);
                card.setAttribute('data-slot', index);
            } else {
                card.style.display = 'none'; // Esconder slots extras
            }
        });
        
        console.log('🎯 Event listeners configurados');
    }
    
    checkExistingSession() {
        console.log('🔍 Verificando sessão existente...');
        const savedUser = localStorage.getItem('currentUser');
        console.log('📦 Dados no localStorage:', savedUser);
        
        if (savedUser) {
            try {
                this.currentUser = JSON.parse(savedUser);
                console.log('👤 Sessão existente encontrada:', this.currentUser.username);
                console.log('✅ currentUser setado:', this.currentUser);
                this.showCharacterSelect();
            } catch (e) {
                console.error('Erro ao carregar sessão:', e);
                localStorage.removeItem('currentUser');
            }
        } else {
            console.log('ℹ️ Nenhuma sessão encontrada no localStorage');
        }
    }
    
    // ===== LOGIN =====
    handleLogin() {
        const username = this.loginUsername?.value?.trim();
        const password = this.loginPassword?.value;
        
        console.log('🔑 Tentando login:', username);
        
        if (!username || !password) {
            this.showMessage('loginMessage', 'Preencha usuário e senha', 'error');
            return;
        }
        
        // Verificar no localStorage
        const users = JSON.parse(localStorage.getItem('users') || '{}');
        const user = users[username];
        
        if (!user || user.password !== password) {
            this.showMessage('loginMessage', 'Usuário ou senha incorretos', 'error');
            return;
        }
        
        // Login bem-sucedido
        this.currentUser = { username: user.username, id: user.id || Date.now() };
        console.log('✅ Login bem-sucedido, salvando usuário:', this.currentUser);
        
        localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
        console.log('💾 currentUser salvo no localStorage');
        
        // Verificar se salvou
        const saved = localStorage.getItem('currentUser');
        console.log('🔍 Verificação localStorage:', saved);
        
        // Carregar personagens do usuário
        this.loadUserCharacters();
        
        this.showMessage('loginMessage', 'Login bem-sucedido!', 'success');
        
        setTimeout(() => {
            this.showCharacterSelect();
        }, 500);
    }
    
    // ===== CRIAR CONTA =====
    showCreateAccount() {
        console.log('📝 Mostrando formulário de criação');
        if (this.createAccountForm) {
            this.createAccountForm.style.display = 'block';
            this.createAccountForm.style.opacity = '0';
            setTimeout(() => this.createAccountForm.style.opacity = '1', 50);
        }
        if (this.loginMessage) this.loginMessage.style.display = 'none';
    }
    
    showLogin() {
        console.log('🔙 Voltando para login');
        if (this.createAccountForm) {
            this.createAccountForm.style.opacity = '0';
            setTimeout(() => this.createAccountForm.style.display = 'none', 300);
        }
        if (this.loginMessage) this.loginMessage.style.display = 'none';
    }
    
    handleCreateAccount() {
        const username = this.newUsername?.value?.trim();
        const password = this.newPassword?.value;
        const confirm = this.confirmPassword?.value;
        
        console.log('📝 Criando conta:', username);
        
        if (!username || !password) {
            this.showMessage('loginMessage', 'Preencha todos os campos', 'error');
            return;
        }
        
        if (password !== confirm) {
            this.showMessage('loginMessage', 'Senhas não coincidem', 'error');
            return;
        }
        
        if (password.length < 4) {
            this.showMessage('loginMessage', 'Senha deve ter pelo menos 4 caracteres', 'error');
            return;
        }
        
        // Verificar se usuário existe
        const users = JSON.parse(localStorage.getItem('users') || '{}');
        if (users[username]) {
            this.showMessage('loginMessage', 'Usuário já existe', 'error');
            return;
        }
        
        // Criar usuário
        users[username] = {
            username,
            password,
            id: Date.now(),
            createdAt: new Date().toISOString()
        };
        
        localStorage.setItem('users', JSON.stringify(users));
        
        this.showMessage('loginMessage', 'Conta criada com sucesso!', 'success');
        
        setTimeout(() => {
            this.showLogin();
            if (this.loginUsername) this.loginUsername.value = username;
            if (this.loginPassword) this.loginPassword.value = '';
        }, 1500);
    }
    
    // ===== SELEÇÃO DE PERSONAGEM =====
    showCharacterSelect() {
        console.log('🎭 Mostrando seleção de personagem');
        
        if (this.loginScreen) {
            this.loginScreen.style.opacity = '0';
            setTimeout(() => {
                this.loginScreen.style.display = 'none';
                if (this.characterScreen) {
                    this.characterScreen.classList.add('active');
                    console.log('✅ Tela de seleção ativada');
                }
            }, 300);
        }
        
        // Atualizar lista de personagens
        this.updateCharacterList();
    }
    
    loadUserCharacters() {
        const allCharacters = JSON.parse(localStorage.getItem('characters') || '{}');
        let userCharacters = allCharacters[this.currentUser?.username] || {};
        
        console.log('📋 Personagens brutos:', Object.keys(userCharacters));
        
        // Limpar e normalizar personagens
        const normalizedChars = {};
        let slotAssignment = 0;
        
        Object.entries(userCharacters).forEach(([key, char]) => {
            // Pular personagens inválidos
            if (!char || !char.name) return;
            
            // Garantir que tenha um ID
            if (!char.id) {
                char.id = `char_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            }
            
            // Se não tem slot, atribuir um disponível (máximo 3)
            if (char.slot === undefined || char.slot === null) {
                if (slotAssignment < 3) {
                    // Verificar se este slot já está ocupado
                    const existingSlot = Object.values(normalizedChars).find(c => c.slot === slotAssignment);
                    if (!existingSlot) {
                        char.slot = slotAssignment;
                        slotAssignment++;
                    } else {
                        // Procurar próximo slot livre
                        for (let i = 0; i < 3; i++) {
                            if (!Object.values(normalizedChars).find(c => c.slot === i)) {
                                char.slot = i;
                                slotAssignment = i + 1;
                                break;
                            }
                        }
                    }
                } else {
                    // Mais de 3 personagens, pular (não mostrar)
                    console.log(`⚠️ Personagem ${char.name} ignorado (limite de 3 atingido)`);
                    return;
                }
            }
            
            normalizedChars[char.id] = char;
        });
        
        this.characters = normalizedChars;
        
        // Salvar se houve mudanças
        if (Object.keys(userCharacters).length !== Object.keys(normalizedChars).length) {
            allCharacters[this.currentUser.username] = normalizedChars;
            localStorage.setItem('characters', JSON.stringify(allCharacters));
            console.log('💾 Personagens normalizados e salvos');
        }
        
        console.log('📋 Personagens carregados:', Object.keys(this.characters), 
            Object.values(this.characters).map(c => `${c.name}(slot:${c.slot})`));
    }
    
    updateCharacterList() {
        // Resetar cards
        const cards = document.querySelectorAll('.character-card');
        
        cards.forEach((card, index) => {
            // Buscar personagem neste slot específico
            const charData = Object.values(this.characters).find(c => c.slot === index);
            
            // Atualizar visual do card
            const existingBadge = card.querySelector('.char-level');
            if (existingBadge) existingBadge.remove();
            
            // Limpar conteúdo antigo
            const oldInfo = card.querySelector('.char-info');
            if (oldInfo) oldInfo.remove();
            
            if (charData) {
                // Personagem existe - mostrar info do personagem com botão de deletar
                card.classList.add('has-character');
                card.classList.remove('empty', 'empty-slot');
                card.innerHTML = `
                    <h3>👤 ${charData.name}</h3>
                    <p>${charData.race} • Nv. ${charData.level}</p>
                    <div class="character-stats">
                        <span>❤️ ${charData.hp}/${charData.maxHp}</span>
                        <span>⚔️ ${charData.class}</span>
                    </div>
                    <button class="delete-btn" onclick="event.stopPropagation(); deleteCharacter(${index})" style="
                        position: absolute;
                        top: 5px;
                        right: 5px;
                        background: #ff4444;
                        color: white;
                        border: none;
                        border-radius: 50%;
                        width: 25px;
                        height: 25px;
                        cursor: pointer;
                        font-size: 12px;
                        z-index: 10;
                    " title="Excluir personagem">✕</button>
                `;
            } else {
                // Slot vazio
                card.classList.remove('has-character');
                card.classList.add('empty', 'empty-slot');
                card.innerHTML = `
                    <h3>📭 Slot Vazio</h3>
                    <p>Clique para criar um personagem</p>
                    <div class="character-stats">
                        <span>-</span>
                    </div>
                `;
            }
        });
        
        // Resetar seleção
        this.selectedCharacter = null;
        const enterBtn = document.getElementById('enterWorldBtn');
        if (enterBtn) {
            enterBtn.disabled = true;
            enterBtn.style.opacity = '0.5';
        }
    }
    
    selectSlot(slotIndex) {
        console.log('🎲 Slot selecionado:', slotIndex);
        
        if (slotIndex >= 3) return; // Segurança: máximo 3 slots
        
        // Verificar se existe personagem neste slot específico
        const charInSlot = Object.values(this.characters).find(c => c.slot === slotIndex);
        
        if (charInSlot) {
            // Selecionar personagem existente
            this.selectedCharacter = charInSlot;
            this.selectedSlot = slotIndex;
            console.log('✅ Personagem selecionado:', charInSlot.name);
            
            // Destacar card
            const cards = document.querySelectorAll('.character-card');
            cards.forEach(c => c.classList.remove('selected'));
            const selectedCard = document.querySelector(`[data-slot="${slotIndex}"]`);
            if (selectedCard) selectedCard.classList.add('selected');
            
            // Habilitar botão entrar
            const enterBtn = document.getElementById('enterWorldBtn');
            if (enterBtn) {
                enterBtn.disabled = false;
                enterBtn.style.opacity = '1';
            }
            
            // Mostrar botão deletar
            this.showDeleteButton(true, charInSlot);
            
            // Salvar seleção
            localStorage.setItem('selectedCharacter', JSON.stringify(charInSlot));
        } else {
            // Slot vazio - abrir criação
            console.log('📭 Slot vazio, abrindo criação...');
            this.selectedSlot = slotIndex;
            this.showDeleteButton(false); // Esconder botão deletar
            this.showCharacterCreation('warrior'); // Classe padrão
        }
    }
    
    showDeleteButton(show, character = null) {
        let deleteBtn = document.getElementById('deleteCharacterBtn');
        
        if (!deleteBtn) {
            // Criar botão se não existir
            deleteBtn = document.createElement('button');
            deleteBtn.id = 'deleteCharacterBtn';
            deleteBtn.className = 'btn btn-danger';
            deleteBtn.innerHTML = '🗑️ Deletar Personagem';
            deleteBtn.style.cssText = 'margin-top: 10px; background: #d32f2f;';
            
            const container = document.querySelector('.character-actions');
            if (container) {
                container.appendChild(deleteBtn);
            }
        }
        
        if (deleteBtn) {
            deleteBtn.style.display = show ? 'inline-block' : 'none';
            deleteBtn.onclick = () => {
                if (character && confirm(`Tem certeza que deseja deletar ${character.name}?`)) {
                    this.deleteCharacter(character.id || character.slot);
                }
            };
        }
    }
    
    deleteCharacter(charIdOrSlot) {
        console.log('🗑️ Deletando personagem:', charIdOrSlot);
        
        // Encontrar personagem por ID ou slot
        let charId = charIdOrSlot;
        const charBySlot = Object.values(this.characters).find(c => c.slot === charIdOrSlot);
        if (charBySlot) {
            charId = charBySlot.id;
        }
        
        if (!charId || !this.characters[charId]) {
            console.error('Personagem não encontrado:', charIdOrSlot);
            return;
        }
        
        // Remover personagem
        delete this.characters[charId];
        
        // Salvar
        const allCharacters = JSON.parse(localStorage.getItem('characters') || '{}');
        allCharacters[this.currentUser.username] = this.characters;
        localStorage.setItem('characters', JSON.stringify(allCharacters));
        
        // Resetar seleção
        this.selectedCharacter = null;
        localStorage.removeItem('selectedCharacter');
        
        // Atualizar UI
        this.showDeleteButton(false);
        this.updateCharacterList();
        
        this.showMessage('characterMessage', 'Personagem deletado!', 'success');
    }
    
    selectCharacter(className, cardElement) {
        console.log('🎯 Personagem selecionado:', className);
        
        // Verificar se existe personagem neste slot
        if (!this.characters[className]) {
            console.log('Slot vazio, abrindo criação...');
            this.showCharacterCreation(className);
            return;
        }
        
        // Selecionar personagem existente
        this.selectedCharacter = { ...this.characters[className], class: className };
        
        // Destacar card
        const cards = document.querySelectorAll('.character-card');
        cards.forEach(c => c.classList.remove('selected'));
        if (cardElement) cardElement.classList.add('selected');
        
        // Habilitar botão entrar
        const enterBtn = document.getElementById('enterWorldBtn');
        if (enterBtn) {
            enterBtn.disabled = false;
            enterBtn.style.opacity = '1';
        }
        
        // Salvar seleção
        localStorage.setItem('selectedCharacter', className);
    }
    
    // ===== CRIAÇÃO DE PERSONAGEM =====
    showCharacterCreation(preselectedClass) {
        console.log('👤 Mostrando criação de personagem:', preselectedClass);
        
        if (preselectedClass && this.characterClass) {
            this.characterClass.value = preselectedClass;
        }
        
        const characterList = document.getElementById('characterList');
        
        if (characterList) {
            characterList.style.opacity = '0';
            setTimeout(() => {
                characterList.style.display = 'none';
                if (this.characterCreation) {
                    this.characterCreation.style.display = 'block';
                    this.characterCreation.style.opacity = '0';
                    setTimeout(() => this.characterCreation.style.opacity = '1', 50);
                }
            }, 300);
        }
    }
    
    cancelCharacterCreation() {
        console.log('❌ Cancelando criação');
        
        if (this.characterCreation) {
            this.characterCreation.style.opacity = '0';
            setTimeout(() => {
                this.characterCreation.style.display = 'none';
                const characterList = document.getElementById('characterList');
                if (characterList) {
                    characterList.style.display = 'grid';
                    characterList.style.opacity = '0';
                    setTimeout(() => characterList.style.opacity = '1', 50);
                }
            }, 300);
        }
        
        // Limpar campos
        if (this.characterName) this.characterName.value = '';
    }
    
    deleteCharacter(slotIndex) {
        console.log('🗑️ Deletando personagem do slot:', slotIndex);
        
        // Confirmar com o usuário
        if (!confirm('Tem certeza que deseja excluir este personagem? Esta ação não pode ser desfeita.')) {
            return;
        }
        
        // Encontrar personagem neste slot
        const charToDelete = Object.values(this.characters).find(c => c.slot === slotIndex);
        
        if (!charToDelete) {
            console.log('ℹ️ Nenhum personagem neste slot');
            return;
        }
        
        console.log('🗑️ Deletando:', charToDelete.name, 'ID:', charToDelete.id);
        
        // Remover personagem pelo ID
        if (charToDelete.id && this.characters[charToDelete.id]) {
            delete this.characters[charToDelete.id];
        } else {
            // Fallback: procurar pela chave
            const keyToDelete = Object.keys(this.characters).find(key => this.characters[key].slot === slotIndex);
            if (keyToDelete) delete this.characters[keyToDelete];
        }
        
        // Salvar no localStorage
        const allCharacters = JSON.parse(localStorage.getItem('characters') || '{}');
        allCharacters[this.currentUser.username] = this.characters;
        localStorage.setItem('characters', JSON.stringify(allCharacters));
        
        console.log('✅ Personagem deletado:', charToDelete.name);
        console.log('📋 Personagens restantes:', Object.keys(this.characters));
        this.showMessage('characterMessage', `Personagem ${charToDelete.name} excluído`, 'success');
        
        // Resetar seleção se era o personagem selecionado
        if (this.selectedCharacter && this.selectedCharacter.slot === slotIndex) {
            this.selectedCharacter = null;
            const enterBtn = document.getElementById('enterWorldBtn');
            if (enterBtn) {
                enterBtn.disabled = true;
                enterBtn.style.opacity = '0.5';
            }
        }
        
        // Atualizar lista
        this.updateCharacterList();
    }
    
    createCharacter() {
        console.log('🔍 Debug createCharacter - currentUser:', this.currentUser);
        
        // Verificar se usuário está logado
        if (!this.currentUser) {
            console.error('❌ Nenhum usuário logado, tentando recuperar do localStorage...');
            const savedUser = localStorage.getItem('currentUser');
            if (savedUser) {
                try {
                    this.currentUser = JSON.parse(savedUser);
                    console.log('✅ Usuário recuperado:', this.currentUser.username);
                } catch (e) {
                    console.error('❌ Erro ao recuperar usuário:', e);
                    this.showMessage('characterMessage', 'Erro: Faça login novamente', 'error');
                    setTimeout(() => this.logout(), 2000);
                    return;
                }
            } else {
                console.error('❌ Nenhum usuário em localStorage');
                this.showMessage('characterMessage', 'Erro: Faça login novamente', 'error');
                setTimeout(() => this.logout(), 2000);
                return;
            }
        }
        
        const name = this.characterName?.value?.trim();
        const race = this.characterRace?.value;
        const charClass = this.characterClass?.value || 'warrior';
        
        console.log('🎭 Criando personagem:', { name, race, class: charClass });
        
        if (!name || !race) {
            this.showMessage('characterMessage', 'Preencha nome e raça', 'error');
            return;
        }
        
        if (name.length < 2 || name.length > 20) {
            this.showMessage('characterMessage', 'Nome deve ter 2-20 caracteres', 'error');
            return;
        }
        
        // Verificar limite de 3 slots
        const charCount = Object.keys(this.characters).length;
        if (charCount >= 3) {
            this.showMessage('characterMessage', 'Limite máximo de 3 personagens atingido', 'error');
            return;
        }
        
        // Verificar se slot está ocupado
        const slotToUse = this.selectedSlot !== undefined ? this.selectedSlot : this.findFirstEmptySlot();
        const charInSlot = Object.values(this.characters).find(c => c.slot === slotToUse);
        if (charInSlot) {
            this.showMessage('characterMessage', 'Slot já ocupado', 'error');
            return;
        }
        
        // Criar personagem com ID único baseado no slot
        const charId = `char_${slotToUse}_${Date.now()}`;
        const newCharacter = {
            id: charId,
            name,
            race,
            class: charClass,
            slot: slotToUse,
            level: 1,
            xp: 0,
            hp: 100,
            maxHp: 100,
            createdAt: new Date().toISOString()
        };
        
        // Adicionar ao objeto de personagens
        this.characters[charId] = newCharacter;
        
        // Salvar no localStorage
        const allCharacters = JSON.parse(localStorage.getItem('characters') || '{}');
        allCharacters[this.currentUser.username] = this.characters;
        localStorage.setItem('characters', JSON.stringify(allCharacters));
        console.log('💾 Personagem salvo:', newCharacter);
        
        this.showMessage('characterMessage', 'Personagem criado!', 'success');
        
        setTimeout(() => {
            this.cancelCharacterCreation();
            this.updateCharacterList();
            
            // Auto-selecionar o personagem criado no slot correto
            const createdChar = Object.values(this.characters).find(c => c.name === name);
            if (createdChar) {
                this.selectSlot(createdChar.slot);
            }
        }, 500);
    }
    
    // ===== ENTRAR NO JOGO =====
    enterWorld() {
        console.log('🌍 Entrando no mundo...', this.selectedCharacter);
        
        if (!this.selectedCharacter) {
            this.showMessage('characterMessage', 'Selecione um personagem', 'error');
            return;
        }
        
        // Verificar se personagem ainda existe (por ID ou por slot)
        const charId = this.selectedCharacter.id;
        const charExists = this.characters[charId] || 
                          Object.values(this.characters).find(c => c.slot === this.selectedCharacter.slot);
        
        if (!charExists) {
            console.error('❌ Personagem não encontrado:', charId);
            this.showMessage('characterMessage', 'Erro: personagem não encontrado', 'error');
            this.selectedCharacter = null;
            this.updateCharacterList();
            return;
        }
        
        // Atualizar selectedCharacter se necessário (caso o ID tenha mudado)
        if (!this.characters[charId] && charExists) {
            this.selectedCharacter = charExists;
        }
        
        // Salvar personagem atual
        localStorage.setItem('currentCharacter', JSON.stringify(this.selectedCharacter));
        
        // Esconder tela de seleção
        if (this.characterScreen) {
            this.characterScreen.style.display = 'none';
            this.characterScreen.classList.remove('active');
        }
        
        // Mostrar tela do jogo
        if (this.gameContainer) {
            this.gameContainer.style.display = 'block';
            this.gameContainer.classList.add('active');
            
            // Iniciar gameplay com delay para garantir renderização
            setTimeout(() => {
                this.startGameplay();
            }, 100);
        }
    }
    
    findFirstEmptySlot() {
        const slots = [0, 1, 2];
        for (const slot of slots) {
            const charInSlot = Object.values(this.characters).find(c => c.slot === slot);
            if (!charInSlot) return slot;
        }
        return -1;
    }
    
    startGameplay() {
        console.log('🎮 Iniciando gameplay...');
        
        // Inicializar GameplayEngine se disponível
        if (typeof IntegratedGameplayEngine !== 'undefined') {
            try {
                window._gameplayEngine = new IntegratedGameplayEngine('gameCanvas', {
                    class: this.selectedCharacter.class,
                    name: this.selectedCharacter.name,
                    race: this.selectedCharacter.race,
                    level: this.selectedCharacter.level
                });
                window._gameplayEngine.start();
                console.log('✅ GameplayEngine iniciado');
            } catch (e) {
                console.error('❌ Erro ao iniciar GameplayEngine:', e);
                // Fallback - mostrar mensagem mas não travar
                this.showMessage('characterMessage', 'Erro ao iniciar jogo, recarregue a página', 'error');
            }
        } else {
            console.warn('⚠️ IntegratedGameplayEngine não disponível');
        }
    }
    
    // ===== LOGOUT =====
    logout() {
        console.log('🚪 Fazendo logout...');
        
        // Limpar dados da sessão
        this.currentUser = null;
        this.selectedCharacter = null;
        this.characters = {};
        
        localStorage.removeItem('currentUser');
        localStorage.removeItem('selectedCharacter');
        localStorage.removeItem('currentCharacter');
        
        // Parar gameplay se estiver rodando
        if (window._gameplayEngine && window._gameplayEngine.stop) {
            window._gameplayEngine.stop();
        }
        window._gameplayEngine = null;
        
        // Esconder telas de personagem e jogo imediatamente
        if (this.characterScreen) {
            this.characterScreen.classList.remove('active');
            console.log('🙈 Tela de seleção escondida');
        }
        if (this.gameContainer) {
            this.gameContainer.classList.remove('active');
        }
        
        // Mostrar tela de login
        if (this.loginScreen) {
            this.loginScreen.style.display = 'flex';
            this.loginScreen.style.opacity = '1';
            console.log('👁️ Tela de login mostrada');
        }
        
        // Limpar campos de login
        if (this.loginPassword) this.loginPassword.value = '';
        
        console.log('✅ Logout completo');
    }
    
    // ===== UTILIDADES =====
    showMessage(elementId, message, type = 'info') {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = message;
            element.className = `message ${type}`;
            element.style.display = 'block';
            
            setTimeout(() => {
                element.style.display = 'none';
            }, 5000);
        }
    }
}

// Exportar para uso global
window.LoginManager = LoginManager;
