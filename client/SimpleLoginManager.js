// Legacy of Komodo - Sistema de Login e Personagens
// Mundo: Aethelgard - Fragmentos de Komodo

class SimpleLoginManager {
  constructor() {
    this.currentUser = null;
    this.currentCharacter = null;
    this.gameplayEngine = null;
    
    // Configurações do mundo
    this.gameWorld = {
      name: 'Aethelgard',
      title: 'Legacy of Komodo',
      lore: 'Mundo de fantasia medieval com Fragmentos de Komodo'
    };
    this.dataManager = window.dataManager || null; // LocalDataManager
    
    // Elementos DOM
    this.loginScreen = null;
    this.characterScreen = null;
    this.gameScreen = null;
    
    // Login Form
    this.loginForm = null;
    this.createAccountForm = null;
    this.username = null;
    this.password = null;
    this.loginBtn = null;
    this.showCreateAccountBtn = null;
    
    // Create Account Form
    this.newUsername = null;
    this.newEmail = null;
    this.newPassword = null;
    this.confirmPassword = null;
    this.createAccountBtn = null;
    this.backToLoginBtn = null;
    
    // Character Screen
    this.characterList = null;
    this.characterCreation = null;
    this.characterName = null;
    this.characterRace = null;
    this.characterClass = null;
    this.createNewCharacterBtn = null;
    this.createCharacterBtn = null;
    this.cancelCreationBtn = null;
    this.enterWorldBtn = null;
    this.logoutBtn = null;
    
    // Messages
    this.loginMessage = null;
    this.characterMessage = null;
    
    this.initializeElements();
    this.setupEventListeners();
  }
  
  initializeElements() {
    // Screens
    this.loginScreen = document.getElementById('loginScreen');
    this.characterScreen = document.getElementById('characterScreen');
    this.gameScreen = document.getElementById('gameScreen');
    
    // Login Form
    this.loginForm = document.getElementById('loginForm');
    this.createAccountForm = document.getElementById('createAccountForm');
    this.username = document.getElementById('username');
    this.password = document.getElementById('password');
    this.loginBtn = document.getElementById('loginBtn');
    this.showCreateAccountBtn = document.getElementById('showCreateAccountBtn');
    
    // Create Account Form
    this.newUsername = document.getElementById('newUsername');
    this.newEmail = document.getElementById('newEmail');
    this.newPassword = document.getElementById('newPassword');
    this.confirmPassword = document.getElementById('confirmPassword');
    this.createAccountBtn = document.getElementById('createAccountBtn');
    this.backToLoginBtn = document.getElementById('backToLoginBtn');
    
    // Character Screen
    this.characterList = document.getElementById('characterList');
    this.characterCreation = document.getElementById('characterCreation');
    this.characterName = document.getElementById('characterName');
    this.characterRace = document.getElementById('characterRace');
    this.createNewCharacterBtn = document.getElementById('createNewCharacterBtn');
    this.createCharacterBtn = document.getElementById('createCharacterBtn');
    this.cancelCreationBtn = document.getElementById('cancelCreationBtn');
    this.enterWorldBtn = document.getElementById('enterWorldBtn');
    this.logoutBtn = document.getElementById('logoutBtn');
    
    // Messages
    this.loginMessage = document.getElementById('loginMessage');
    this.characterMessage = document.getElementById('characterMessage');
  }
  
  setupEventListeners() {
    // Login Form Events
    if (this.loginBtn) this.loginBtn.addEventListener('click', () => this.handleLogin());
    if (this.showCreateAccountBtn) this.showCreateAccountBtn.addEventListener('click', () => this.showCreateAccountForm());
    
    // Create Account Form Events
    if (this.createAccountBtn) this.createAccountBtn.addEventListener('click', () => this.handleCreateAccount());
    if (this.backToLoginBtn) this.backToLoginBtn.addEventListener('click', () => this.showLoginForm());
    
    // Character Screen Events
    if (this.createNewCharacterBtn) this.createNewCharacterBtn.addEventListener('click', () => this.handleCreateNewCharacter());
    if (this.createCharacterBtn) this.createCharacterBtn.addEventListener('click', () => this.handleCreateCharacter());
    if (this.cancelCreationBtn) this.cancelCreationBtn.addEventListener('click', () => this.handleCancelCreation());
    if (this.enterWorldBtn) this.enterWorldBtn.addEventListener('click', () => this.handleEnterWorld());
    if (this.logoutBtn) this.logoutBtn.addEventListener('click', () => this.handleLogout());
    
    // Enter key events
    if (this.username) {
      this.username.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') this.handleLogin();
      });
    }
    
    if (this.password) {
      this.password.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') this.handleLogin();
      });
    }
    
    if (this.newPassword) {
      this.newPassword.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') this.handleCreateAccount();
      });
    }
    
    if (this.confirmPassword) {
      this.confirmPassword.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') this.handleCreateAccount();
      });
    }
  }
  
  handleLogin() {
    const username = this.sanitizeInput(this.username.value.trim());
    const password = this.sanitizeInput(this.password.value);
    
    if (!username || !password) {
      this.showMessage('loginMessage', 'Preencha todos os campos', 'error');
      return;
    }
    
    this.authenticateUser(username, password);
  }
  
  handleCreateAccount() {
    const username = this.sanitizeInput(this.newUsername.value.trim());
    const email = this.sanitizeInput(this.newEmail.value.trim());
    const password = this.sanitizeInput(this.newPassword.value);
    const confirmPassword = this.sanitizeInput(this.confirmPassword.value);
    
    if (!username || !email || !password || !confirmPassword) {
      this.showMessage('loginMessage', 'Preencha todos os campos', 'error');
      return;
    }
    
    if (username.length < 3) {
      this.showMessage('loginMessage', 'Nome de usuário deve ter pelo menos 3 caracteres', 'error');
      return;
    }
    
    if (password.length < 6) {
      this.showMessage('loginMessage', 'Senha deve ter pelo menos 6 caracteres', 'error');
      return;
    }
    
    if (password !== confirmPassword) {
      this.showMessage('loginMessage', 'As senhas não coincidem', 'error');
      return;
    }
    
    if (!this.validateEmail(email)) {
      this.showMessage('loginMessage', 'E-mail inválido', 'error');
      return;
    }
    
    this.createAccount(username, password, email);
  }
  
  handleEnterWorld() {
    if (!this.currentCharacter) {
      this.showMessage('characterMessage', 'Selecione um personagem', 'error');
      return;
    }
    
    // Mostrar tela de jogo
    if (this.characterScreen) this.characterScreen.style.display = 'none';
    if (this.gameScreen) this.gameScreen.style.display = 'flex';
    
    // Adicionar classe para escurecer tela
    document.body.classList.add('gameplay-active');
    
    // Inicializar novas HUDs se disponíveis
    this.initializeHUDs();
    
    // Ativar sistemas visuais
    this.initializeVisualSystems();
    
    // Inicializar GameplayEngine
    this.initializeGameplay();
  }
  
  initializeVisualSystems() {
    console.log('🎨 Inicializando sistemas visuais...');
    
    // Ativar Visual Manager
    if (window.visualManager) {
      window.visualManager.activate();
      console.log('✅ Visual Manager ativado');
    }
    
    // Ativar Visual HUD Integration
    if (window.visualHUDIntegration) {
      window.visualHUDIntegration.activate();
      console.log('✅ Visual HUD Integration ativada');
    }
    
    // Substituir sprite system pelo enhanced
    if (window.enhancedSpriteSystem && window.visualManager) {
      window.visualManager.spriteSystem = window.enhancedSpriteSystem;
      console.log('✅ Enhanced Sprite System ativado');
    }
    
    console.log('✅ Sistemas visuais inicializados');
  }
  
  initializeHUDs() {
    console.log('🎮 Inicializando HUDs para gameplay...');
    
    // Mostrar HUD melhorada se disponível
    if (window.improvedHUD) {
      window.improvedHUD.show();
      console.log('✅ Improved HUD ativada');
    }
    
    // Alternar para WoW Style HUD se disponível
    if (window.wowHUDIntegration) {
      setTimeout(() => {
        window.wowHUDIntegration.switchToWoWHUD();
        console.log('✅ WoW Style HUD ativada');
      }, 1000);
    }
    
    // Atualizar estado do jogador em todas as HUDs
    if (this.currentCharacter) {
      const playerData = {
        name: this.currentCharacter.name,
        level: this.currentCharacter.level,
        health: this.currentCharacter.hp,
        maxHealth: this.currentCharacter.maxHp,
        mana: this.currentCharacter.mana,
        maxMana: this.currentCharacter.maxMana,
        exp: this.currentCharacter.exp || 0,
        maxExp: this.currentCharacter.maxExp || 100,
        gold: this.currentCharacter.gold || 0,
        position: { x: this.currentCharacter.x || 400, y: this.currentCharacter.y || 300 }
      };
      
      // Atualizar em todas as HUDs
      if (window.hudIntegration) {
        window.hudIntegration.updatePlayerState(playerData);
      }
      if (window.wowHUDIntegration) {
        window.wowHUDIntegration.updatePlayerState(playerData);
      }
      if (window.improvedHUD) {
        window.improvedHUD.updatePlayerState(playerData);
      }
      
      console.log('✅ Estado do jogador atualizado em todas as HUDs');
    }
  }
  
  hideAllHUDs() {
    // Esconder todas as HUDs disponíveis
    if (window.hudSystem) {
      window.hudSystem.hide();
    }
    if (window.improvedHUD) {
      window.improvedHUD.hide();
    }
    if (window.wowStyleHUD) {
      window.wowStyleHUD.hide();
    }
    
    // Desativar sistemas visuais
    if (window.visualManager) {
      window.visualManager.deactivate();
    }
    if (window.visualHUDIntegration) {
      window.visualHUDIntegration.deactivate();
    }
    
    console.log('🎮 Todas as HUDs e sistemas visuais escondidos');
  }
  
  handleCreateNewCharacter() {
    if (!this.dataManager) {
      console.error('❌ LocalDataManager não disponível');
      this.showMessage('characterMessage', 'Erro no sistema de dados', 'error');
      return;
    }
    
    const userCharacters = this.dataManager.getCharacters(this.currentUser.username);
    
    if (userCharacters.length >= 3) {
      this.showMessage('characterMessage', 'Limite de 3 personagens por conta atingido', 'error');
      return;
    }
    
    if (this.characterCreation) this.characterCreation.style.display = 'block';
    if (this.characterList) this.characterList.style.display = 'none';
    if (this.createNewCharacterBtn) this.createNewCharacterBtn.style.display = 'none';
    if (this.enterWorldBtn) this.enterWorldBtn.style.display = 'none';
    
    // Limpar campos
    if (this.characterName) this.characterName.value = '';
    if (this.characterRace) this.characterRace.value = '';
    
    // Focar no nome
    setTimeout(() => this.characterName.focus(), 100);
  }
  
  handleCancelCreation() {
    if (this.characterCreation) this.characterCreation.style.display = 'none';
    if (this.characterList) this.characterList.style.display = 'grid';
    if (this.createNewCharacterBtn) this.createNewCharacterBtn.style.display = 'inline-block';
    if (this.enterWorldBtn) this.enterWorldBtn.style.display = 'inline-block';
  }
  
  handleCreateCharacter() {
    if (!this.characterName || !this.characterRace) {
      console.error('❌ Elementos de criação de personagem não encontrados');
      return;
    }
    
    const name = this.characterName.value.trim();
    const race = this.characterRace.value;
    
    if (!name || name.length < 3) {
      this.showMessage('characterMessage', 'Nome deve ter pelo menos 3 caracteres', 'error');
      return;
    }
    
    if (!race) {
      this.showMessage('characterMessage', 'Selecione uma raça', 'error');
      return;
    }
    
    // Todos personagens começam como aprendiz
    const characterClass = 'apprentice';
    
    this.createCharacter(name, race, characterClass);
  }
  
  handleDeleteCharacter() {
    if (!this.currentCharacter) {
      this.showMessage('characterMessage', 'Nenhum personagem selecionado', 'error');
      return;
    }
    
    if (!this.dataManager) {
      console.error('❌ LocalDataManager não disponível');
      this.showMessage('characterMessage', 'Erro no sistema de dados', 'error');
      return;
    }
    
    if (confirm(`Tem certeza que deseja excluir "${this.currentCharacter.name}"? Esta ação não pode ser desfeita.`)) {
      const result = this.dataManager.deleteCharacter(this.currentUser.username, this.currentCharacter.id);
      
      if (result.success) {
        this.currentCharacter = null;
        if (this.enterWorldBtn) this.enterWorldBtn.disabled = true;
        if (this.deleteCharacterBtn) this.deleteCharacterBtn.style.display = 'none';
        
        this.loadCharacters();
        
        this.showMessage('characterMessage', 'Personagem excluído com sucesso', 'success');
        console.log(`🗑️ Personagem excluído com sucesso`);
      } else {
        this.showMessage('characterMessage', result.error || 'Erro ao excluir personagem', 'error');
        console.error('❌ Erro ao excluir personagem:', result.error);
      }
    }
  }
  
  authenticateUser(username, password) {
    // Usar LocalDataManager para gerenciar dados locais
    if (!this.dataManager) {
      console.error('❌ LocalDataManager não disponível');
      this.showMessage('loginMessage', 'Erro no sistema de dados', 'error');
      return;
    }
    
    const result = this.dataManager.authenticateUser(username, password);
    
    if (result.success) {
      this.currentUser = result.account;
      this.showMessage('loginMessage', 'Login realizado com sucesso!', 'success');
      setTimeout(() => this.showCharacter(), 1000);
      
      console.log(`👤 Usuário ${username} logado com sucesso`);
    } else {
      this.showMessage('loginMessage', result.error || 'Erro no login', 'error');
      console.error('❌ Erro no login:', result.error);
    }
  }
  
  createAccount(username, password, email) {
    // Usar LocalDataManager para criar conta
    if (!this.dataManager) {
      console.error('❌ LocalDataManager não disponível');
      this.showMessage('loginMessage', 'Erro no sistema de dados', 'error');
      return;
    }
    
    const result = this.dataManager.createAccount(username, password, email);
    
    if (result.success) {
      this.showMessage('loginMessage', 'Conta criada com sucesso! Faça login para continuar.', 'success');
      
      // Limpar campos após criação
      this.newUsername.value = '';
      this.newEmail.value = '';
      this.newPassword.value = '';
      this.confirmPassword.value = '';
      
      // Voltar para tela de login
      setTimeout(() => this.showLoginForm(), 1500);
      
      console.log(`👤 Conta ${username} criada com sucesso`);
    } else {
      this.showMessage('loginMessage', result.error || 'Erro ao criar conta', 'error');
      console.error('❌ Erro ao criar conta:', result.error);
    }
  }
  
  showCharacter() {
    if (this.loginScreen) this.loginScreen.style.display = 'none';
    if (this.characterScreen) this.characterScreen.style.display = 'flex';
    
    this.loadCharacters();
  }
  
  loadCharacters() {
    if (!this.currentUser || !this.dataManager) return;
    
    const userCharacters = this.dataManager.getCharacters(this.currentUser.username);
    
    if (this.characterList) this.characterList.innerHTML = '';
    
    if (userCharacters.length === 0) {
      if (this.characterList) {
        this.characterList.innerHTML = '<div class="empty-state">Nenhum personagem encontrado. Crie um novo personagem para começar!</div>';
      }
      if (this.enterWorldBtn) this.enterWorldBtn.style.display = 'none';
      return;
    }
    
    userCharacters.forEach(character => {
      const card = this.createCharacterCard(character);
      if (this.characterList) this.characterList.appendChild(card);
    });
    
    if (this.enterWorldBtn) this.enterWorldBtn.disabled = true;
    if (this.enterWorldBtn) this.enterWorldBtn.style.display = 'none';
    
    console.log(`🎭 Carregados ${userCharacters.length} personagens para ${this.currentUser.username}`);
  }
  
  createCharacterCard(character) {
    const card = document.createElement('div');
    card.className = 'character-card';
    
    const classIcons = {
      warrior: '⚔️', mage: '🔮', hunter: '🏹', rogue: '🗡️', priest: '✨', druid: '🌿', apprentice: '🎓'
    };
    
    const classColors = {
      warrior: '#f44336', mage: '#2196F3', hunter: '#4CAF50', rogue: '#9C27B0', priest: '#FFD700', druid: '#8BC34A', apprentice: '#9E9E9E'
    };
    
    const icon = classIcons[character.class] || '🎓';
    const color = classColors[character.class] || '#9E9E9E';
    
    card.innerHTML = `
      <div class="character-avatar" style="background: linear-gradient(135deg, ${color} 0%, ${color}88 100%);">
        ${icon}
      </div>
      <div class="character-name">${character.name}</div>
      <div class="character-info">
        <div class="character-level">Level ${character.level}</div>
        <div class="character-class">${this.getClassName(character.class)}</div>
        <div class="character-race">${this.getRaceName(character.race)}</div>
        <div class="character-stats">
          <div class="character-hp">❤️ ${character.hp}/${character.maxHp}</div>
          <div>⚔️ ${character.attack || 10} ATK</div>
          <div>🛡️ ${character.defense || 5} DEF</div>
        </div>
      </div>
    `;
    
    card.addEventListener('click', () => {
      document.querySelectorAll('.character-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      this.currentCharacter = character;
      
      if (this.enterWorldBtn) {
        this.enterWorldBtn.disabled = false;
        this.enterWorldBtn.style.display = 'inline-block';
      }
      
      if (this.characterCreation) this.characterCreation.style.display = 'none';
    });
    
    return card;
  }
  
  getClassName(classKey) {
    const classNames = {
      warrior: 'Guerreiro', mage: 'Mago', hunter: 'Caçador', rogue: 'Ladino', priest: 'Sacerdote', druid: 'Druida', apprentice: 'Aprendiz'
    };
    return classNames[classKey] || 'Aprendiz';
  }
  
  getRaceName(raceKey) {
    const raceNames = {
      human: 'Humano', elf: 'Elfo', dwarf: 'Anão', orc: 'Orc', undead: 'Morto-Vivo'
    };
    return raceNames[raceKey] || raceKey || 'Humano';
  }
  
  createCharacter(name, race, characterClass) {
    if (!this.currentUser || !this.dataManager) {
      console.error('❌ Usuário ou DataManager não disponível');
      this.showMessage('characterMessage', 'Erro no sistema de dados', 'error');
      return;
    }
    
    const characterData = { name, race, class: characterClass };
    const result = this.dataManager.createCharacter(this.currentUser.username, characterData);
    
    if (result.success) {
      this.handleCancelCreation();
      this.loadCharacters();
      
      this.showMessage('characterMessage', 'Personagem criado com sucesso!', 'success');
      console.log(`🎭 Personagem ${name} criado para ${this.currentUser.username}`);
    } else {
      this.showMessage('characterMessage', result.error || 'Erro ao criar personagem', 'error');
      console.error('❌ Erro ao criar personagem:', result.error);
    }
  }
  
  initializeGameplay() {
    if (!window.IntegratedGameplayEngine) {
      console.error('❌ IntegratedGameplayEngine não encontrado');
      this.showMessage('characterMessage', 'Erro ao carregar sistema de jogo', 'error');
      return;
    }
    
    try {
      // Inicializar GameplayEngine com dados do personagem
      this.gameplayEngine = new window.IntegratedGameplayEngine('gameCanvas', this.currentCharacter);
      
      // Garantir que window.gameplayEngine aponte para a instância correta
      window.gameplayEngine = this.gameplayEngine;
      
      // Preparar dados para HUD
      const characterData = {
        name: this.currentCharacter.name,
        level: this.currentCharacter.level,
        health: this.currentCharacter.hp,
        maxHealth: this.currentCharacter.maxHp,
        mana: this.currentCharacter.mana,
        maxMana: this.currentCharacter.maxMana,
        exp: this.currentCharacter.exp || 0,
        maxExp: this.currentCharacter.maxExp || 100,
        gold: this.currentCharacter.gold || 0,
        position: { x: this.currentCharacter.x, y: this.currentCharacter.y }
      };
      
      // Atualizar HUD se disponível
      if (window.hudSystem) {
        window.hudSystem.updatePlayerState(characterData);
        window.hudSystem.showNotification(`Bem-vindo ao mundo, ${this.currentCharacter.name}!`, 'success');
        // Mostrar HUD do gameplay
        window.hudSystem.show();
      }
      
      // Iniciar gameplay
      this.gameplayEngine.start();
      
      console.log(`🎮 Gameplay iniciado para ${this.currentCharacter.name}`);
      
    } catch (error) {
      console.error('❌ Erro ao inicializar gameplay:', error);
      this.showMessage('characterMessage', 'Erro ao iniciar jogo. Tente novamente.', 'error');
    }
  }
  
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
  
  updatePlayerUI(character) {
    if (window.hudSystem) {
      window.hudSystem.updatePlayerState({
        name: character.name,
        level: character.level,
        health: character.hp,
        maxHealth: character.maxHp,
        mana: character.mana || 0,
        maxMana: character.maxMana || 0,
        exp: character.exp || 0,
        maxExp: character.maxExp || 100,
        gold: character.gold || 0,
        position: { x: character.x || 400, y: character.y || 300 }
      });
      return;
    }
    
    // Fallback para HUD antigo
    if (this.playerName) this.playerName.textContent = character.name;
    if (this.playerLevel) this.playerLevel.textContent = `Lv. ${character.level}`;
    if (this.hpText) this.hpText.textContent = `${character.hp}/${character.maxHp}`;
    if (this.healthFill) this.healthFill.style.width = `${(character.hp / character.maxHp) * 100}%`;
  }
  
  showMessage(elementId, message, type = 'info') {
    const element = document.getElementById(elementId);
    if (element) {
      element.textContent = message;
      element.className = `message ${type}`;
      
      setTimeout(() => {
        element.textContent = '';
        element.className = 'message';
      }, 3000);
    }
  }
  
  sanitizeInput(input) {
    if (typeof input !== 'string') return '';
    return input.replace(/<[^>]*>/g, '').replace(/javascript:/gi, '');
  }
  
  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
  
  showLoginForm() {
    if (this.loginForm) this.loginForm.style.display = 'block';
    if (this.createAccountForm) this.createAccountForm.style.display = 'none';
    this.clearMessage('loginMessage');
  }
  
  showCreateAccountForm() {
    if (this.loginForm) this.loginForm.style.display = 'none';
    if (this.createAccountForm) this.createAccountForm.style.display = 'block';
    this.clearMessage('loginMessage');
    
    // Focar no primeiro campo
    setTimeout(() => this.newUsername.focus(), 100);
  }
  
  handleLogout() {
    this.currentUser = null;
    this.currentCharacter = null;
    
    // Parar gameplay se estiver rodando
    if (this.gameplayEngine) {
      this.gameplayEngine.stop();
      this.gameplayEngine = null;
    }
    
    // Esconder todas as HUDs
    this.hideAllHUDs();
    
    // Remover classe de escurecimento
    document.body.classList.remove('gameplay-active');
    
    // Voltar para tela de login
    if (this.characterScreen) this.characterScreen.style.display = 'none';
    if (this.gameScreen) this.gameScreen.style.display = 'none';
    if (this.loginScreen) this.loginScreen.style.display = 'flex';
    
    // Limpar campos
    if (this.username) this.username.value = '';
    if (this.password) this.password.value = '';
    
    // Mostrar formulário de login
    this.showLoginForm();
    
    this.showMessage('loginMessage', 'Você saiu da conta com sucesso', 'info');
    console.log('👋 Logout realizado');
  }
  
  clearMessage(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
      element.textContent = '';
      element.className = 'message';
    }
  }
  
  getFPS() {
    const now = global.performance.now();
    const delta = now - (this.lastFrameTime || now);
    this.lastFrameTime = now;
    return delta > 0 ? Math.round(1000 / delta) : 0;
  }
}

window.SimpleLoginManager = SimpleLoginManager;
