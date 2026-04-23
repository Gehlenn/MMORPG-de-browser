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

    // Inicializar NetworkManager global (sempre disponível)
    if (typeof window.networkManager !== 'undefined') {
      window.networkManager.connect();
      this.setupNetworkHandlers();
      console.log('📡 NetworkManager conectado');
    }
    
    // Modo online legado (remover quando migrar completamente)
    if (typeof Config !== 'undefined' && Config.GAME_MODE === 'SERVER_ONLINE') {
      console.log('📡 Modo SERVER_ONLINE ativado');
    }
    
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
    if (this.enterWorldBtn) {
      this.enterWorldBtn.addEventListener('click', () => {
        console.log('🌍 Botão entrar no mundo clicado');
        // Se não houver currentCharacter, pegar o último personagem do usuário
        if (!this.currentCharacter && this.currentUser) {
          const chars = JSON.parse(localStorage.getItem('eldoria_characters') || '{}');
          const userChars = chars[this.currentUser.username] || [];
          if (userChars.length > 0) {
            this.currentCharacter = userChars[userChars.length - 1];
            console.log('✅ Personagem atual definido a partir da lista:', this.currentCharacter);
          }
        }
        this.enterWorld();
      });
    }
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
  
  setupNetworkHandlers() {
    if (!window.networkManager) return;
    
    // Login handlers
    window.networkManager.on('loginSuccess', (data) => {
      console.log('✅ Login via servidor:', data.username);
      this.currentUser = data;
      
      if (window.gameState) {
        window.gameState.setUser(data);
        window.gameState.setScreen('character');
      }
      
      this.showMessage('loginMessage', 'Login realizado com sucesso!', 'success');
      setTimeout(() => this.showCharacter(), 1000);
    });
    
    window.networkManager.on('loginError', (data) => {
      console.error('❌ Erro no login:', data.error);
      this.showMessage('loginMessage', data.error || 'Erro no login', 'error');
    });
    
    // Account handlers
    window.networkManager.on('accountCreateSuccess', (data) => {
      console.log('✅ Conta criada:', data.username);
      this.showMessage('loginMessage', 'Conta criada! Faça login.', 'success');
      setTimeout(() => this.showLoginForm(), 1500);
    });
    
    window.networkManager.on('accountCreateError', (data) => {
      console.error('❌ Erro ao criar conta:', data.error);
      this.showMessage('loginMessage', data.error || 'Erro ao criar conta', 'error');
    });
    
    // Character handlers
    window.networkManager.on('characterCreateSuccess', (data) => {
      console.log('✅ Personagem criado:', data.character?.name);
      this.currentCharacter = data.character;
      this.handleCancelCreation();
      this.loadCharacters();
      this.showMessage('characterMessage', 'Personagem criado!', 'success');
    });
    
    window.networkManager.on('characterCreateError', (data) => {
      console.error('❌ Erro ao criar personagem:', data.error);
      this.showMessage('characterMessage', data.error || 'Erro ao criar personagem', 'error');
    });
    
    window.networkManager.on('characterSelected', (data) => {
      console.log('✅ Personagem selecionado:', data.character?.name);
      this.currentCharacter = data.character;
      
      if (window.gameState) {
        window.gameState.setCharacter(data.character);
      }
      
      // Solicitar world init
      window.networkManager.requestWorldInit({
        characterId: data.character?.id
      });
    });
    
    // World handlers
    window.networkManager.on('worldInit', (data) => {
      console.log('🌍 World init:', data);
      
      if (window.gameState) {
        window.gameState.setWorldLoaded(true);
      }
      
      // Atualizar GameplayEngine com dados do servidor
      if (this.gameplayEngine && data.entities) {
        this.gameplayEngine.remotePlayers = data.entities.filter(e => e.type === 'player');
        this.gameplayEngine.mobs = data.entities.filter(e => e.type === 'mob');
      }
      
      // Entrar no mundo
      this.enterWorld();
    });
    
    // Player movement updates
    window.networkManager.on('playerMoved', (data) => {
      if (this.gameplayEngine && data.id !== window.networkManager.getSocketId()) {
        // Atualizar posição de player remoto
        const remotePlayer = this.gameplayEngine.remotePlayers.find(p => p.id === data.id);
        if (remotePlayer) {
          remotePlayer.x = data.x;
          remotePlayer.y = data.y;
        }
      }
    });
    
    // Connection handlers
    window.networkManager.on('connected', (data) => {
      console.log('🔌 Conectado ao servidor:', data.socketId);
    });
    
    window.networkManager.on('disconnected', () => {
      console.log('🔌 Desconectado do servidor');
    });
  }
  
  handleLogin() {
    const username = this.sanitizeInput(this.username.value.trim());
    const password = this.sanitizeInput(this.password.value);
    
    if (!username || !password) {
      this.showMessage('loginMessage', 'Preencha todos os campos', 'error');
      return;
    }
    
    // Se estiver em modo de servidor, envia para o servidor
    if (typeof Config !== 'undefined' && Config.GAME_MODE === 'SERVER_ONLINE') {
      this.loginViaServer(username, password);
      return;
    }
    
    // Se não, continua com o login local
    this.loginLocal(username, password);
  }
  
  loginLocal(username, password) {
    console.log('🔐 Login local (localStorage)');
    this.authenticateUser(username, password);
  }
  
  loginViaServer(username, password) {
    console.log('🔐 Login via servidor (Socket.IO) - ainda não implementado');
    this.showMessage('loginMessage', 'Login online em desenvolvimento...', 'info');
    
    // TODO: Implementar conexão com servidor
    // if (window.networkManager) {
    //   window.networkManager.sendLogin(username, password);
    // }
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
    
    if (!this.validateEmail(email)) {
      this.showMessage('loginMessage', 'E-mail inválido', 'error');
      return;
    }
    
    if (password !== confirmPassword) {
      this.showMessage('loginMessage', 'As senhas não coincidem', 'error');
      return;
    }
    
    // Se estiver em modo de servidor, envia para o servidor
    if (typeof Config !== 'undefined' && Config.GAME_MODE === 'SERVER_ONLINE') {
      this.createAccountViaServer(username, password, email);
      return;
    }
    
    // Se não, continua com a criação local
    this.createAccountLocal(username, password, email);
  }
  
  createAccountLocal(username, password, email) {
    console.log('👤 Criando conta local');
    this.createAccount(username, password, email);
  }
  
  createAccountViaServer(username, password, email) {
    console.log('👤 Criando conta via servidor - ainda não implementado');
    this.showMessage('loginMessage', 'Criação de conta online em desenvolvimento...', 'info');
    
    // TODO: Implementar criação de conta no servidor
    // if (window.networkManager) {
    //   window.networkManager.sendCreateAccount(username, password, email);
    // }
  }

  handleEnterWorld() {
    if (!this.currentCharacter) {
      this.showMessage('characterMessage', 'Selecione um personagem', 'error');
      return;
    }
    
    console.log('🚀 Iniciando mundo com personagem:', this.currentCharacter);
    
    // Atualizar GameState global
    if (window.gameState) {
      window.gameState.setCharacter(this.currentCharacter);
      window.gameState.setScreen('game');
      window.gameState.setWorldLoaded(true);
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
    
    // Iniciar o jogo com o personagem
    this.startGame(this.currentCharacter);
  }
  
  initializeVisualSystems() {
    console.log('🎨 Inicializando sistemas visuais...');
    
    // Ativar Visual Manager
    if (window.visualManager) {
      window.visualManager.activate();
      console.log('✅ Visual Manager ativado');
    }
    
    console.log('✅ Sistemas visuais inicializados');
  }
  
  initializeHUDs() {
    console.log('🎮 Inicializando HUD...');
    
    // Usar HUDManager consolidado
    if (window.hudManager) {
      window.hudManager.show();
      console.log('✅ HUDManager ativado');
    }
    
    // Preparar dados para HUD
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
      
      // Atualizar HUD
      if (window.hudManager) {
        window.hudManager.update(playerData, 0, 0);
      }
      
      console.log('✅ Estado do jogador atualizado no HUD');
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
      
      // Atualizar GameState global
      if (window.gameState) {
        window.gameState.setUser(result.account);
        window.gameState.setScreen('character');
      }
      
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
    
    // Atualizar GameState
    if (window.gameState) {
      window.gameState.setScreen('character');
    }
    
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
      
      // Definir personagem atual após criação
      const characters = JSON.parse(localStorage.getItem('eldoria_characters') || '{}');
      const userCharacters = characters[this.currentUser?.username] || [];
      if (userCharacters.length > 0) {
        this.currentCharacter = userCharacters[userCharacters.length - 1];
        console.log('✅ Personagem atual definido:', this.currentCharacter);
      }
      
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
    
    const character = this.currentCharacter;
    if (!character) {
      console.error('❌ Nenhum personagem para iniciar o jogo');
      this.showMessage('characterMessage', 'Selecione um personagem primeiro', 'error');
      return;
    }
    
    try {
      // Trocar telas
      if (this.loginScreen) this.loginScreen.style.display = 'none';
      if (this.characterScreen) this.characterScreen.style.display = 'none';
      if (this.gameScreen) this.gameScreen.style.display = 'flex';
      
      // Inicializar GameplayEngine com dados do personagem
      this.gameplayEngine = new window.IntegratedGameplayEngine('gameCanvas', character);
      
      // Garantir que window.gameplayEngine aponte para a instância correta
      window.gameplayEngine = this.gameplayEngine;
      window._gameplayEngine = this.gameplayEngine; // Compatibilidade
      
      // Preparar dados para HUD
      const characterData = {
        name: character.name,
        level: character.level,
        health: character.hp,
        maxHealth: character.maxHp,
        mana: character.mana,
        maxMana: character.maxMana,
        exp: character.exp || 0,
        maxExp: character.maxExp || 100,
        gold: character.gold || 0,
        position: { x: character.x, y: character.y }
      };
      
      // Atualizar HUD se disponível
      if (window.hudManager) {
        window.hudManager.update(characterData, 0, 0);
        window.hudManager.addChatMessage(`Bem-vindo ao mundo, ${character.name}!`, '#4CAF50');
        window.hudManager.show();
      }
      
      // Iniciar gameplay
      this.gameplayEngine.start();
      
      console.log(`🎮 Gameplay iniciado para ${character.name}`);
      
    } catch (error) {
      console.error('❌ Erro ao inicializar gameplay:', error);
      this.showMessage('characterMessage', 'Erro ao iniciar jogo. Tente novamente.', 'error');
    }
  }
  
  // startGame removido - funcionalidade consolidada em initializeGameplay
  
  updatePlayerUI(character) {
    if (window.hudManager) {
      window.hudManager.update({
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
      }, 0, 0);
      return;
    }
    
    // Fallback para elementos DOM diretos
    const playerName = document.getElementById('playerName');
    const playerLevel = document.getElementById('playerLevel');
    const hpText = document.getElementById('hpText');
    const healthFill = document.getElementById('healthFill');
    
    if (playerName) playerName.textContent = character.name;
    if (playerLevel) playerLevel.textContent = `Lv. ${character.level}`;
    if (hpText) hpText.textContent = `${character.hp}/${character.maxHp}`;
    if (healthFill) healthFill.style.width = `${(character.hp / character.maxHp) * 100}%`;
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
  
  logout() {
    this.currentUser = null;
    this.currentCharacter = null;
    
    // Resetar GameState global
    if (window.gameState) {
      window.gameState.reset();
    }
    
    // Limpar localStorage do usuário atual (opcional - descomente se quiser)
    // localStorage.removeItem('current_user');
    
    // Voltar para tela de login
    this.showLoginForm();
    
    // Limpar mensagens
    this.clearMessage('loginMessage');
    this.clearMessage('characterMessage');
    
    // Resetar estados visuais
    if (this.gameScreen) this.gameScreen.style.display = 'none';
    if (this.characterScreen) this.characterScreen.style.display = 'none';
    if (this.loginScreen) {
      this.loginScreen.style.display = 'flex';
      this.loginScreen.style.opacity = '1';
    }
    
    // Remover classe de gameplay ativo
    document.body.classList.remove('gameplay-active');
    
    console.log('👋 Usuário deslogado');
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
  
  // Métodos para criação de personagem e entrada no mundo
  enterWorld() {
    this.handleEnterWorld();
  }
  
  handleCreateNewCharacter() {
    console.log('👤 Mostrando formulário de criação de personagem');
    if (this.characterList) this.characterList.style.display = 'none';
    if (this.characterCreation) this.characterCreation.style.display = 'block';
    if (this.enterWorldBtn) this.enterWorldBtn.style.display = 'none';
    if (this.createNewCharacterBtn) this.createNewCharacterBtn.style.display = 'none';
    if (this.logoutBtn) this.logoutBtn.style.display = 'none';
  }
  
  handleCreateCharacter() {
    const name = this.characterName ? this.characterName.value.trim() : '';
    const race = this.characterRace ? this.characterRace.value : 'human';
    
    if (!name) {
      this.showMessage('characterMessage', 'Digite um nome para o personagem', 'error');
      return;
    }
    
    if (name.length < 2 || name.length > 20) {
      this.showMessage('characterMessage', 'Nome deve ter entre 2 e 20 caracteres', 'error');
      return;
    }
    
    // Classe padrão se não houver seleção
    const characterClass = 'warrior';
    
    console.log('🎭 Criando personagem:', { name, race, class: characterClass });
    this.createCharacter(name, race, characterClass);
  }
  
  handleCancelCreation() {
    console.log('❌ Cancelando criação de personagem');
    if (this.characterList) this.characterList.style.display = 'block';
    if (this.characterCreation) this.characterCreation.style.display = 'none';
    if (this.createNewCharacterBtn) this.createNewCharacterBtn.style.display = 'inline-block';
    if (this.logoutBtn) this.logoutBtn.style.display = 'inline-block';
    
    // Limpar campos
    if (this.characterName) this.characterName.value = '';
    
    this.clearMessage('characterMessage');
  }

  getFPS() {
    const now = global.performance.now();
    const delta = now - (this.lastFrameTime || now);
    this.lastFrameTime = now;
    return delta > 0 ? Math.round(1000 / delta) : 0;
  }
}

window.SimpleLoginManager = SimpleLoginManager;
