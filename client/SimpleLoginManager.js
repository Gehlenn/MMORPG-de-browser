// SimpleLoginManager - Extraído para coverage
class SimpleLoginManager {
  constructor() {
    this.currentUser = null;
    this.currentCharacter = null;
    this.lastFrameTime = 0;
    
    // Inicializar elementos DOM
    this.initializeElements();
    
    // Configurar event listeners
    this.initializeEventListeners();
  }
  
  initializeElements() {
    // Obter elementos DOM
    this.loginScreen = document.getElementById('loginScreen');
    this.characterScreen = document.getElementById('characterScreen');
    this.gameScreen = document.getElementById('gameScreen');
    this.username = document.getElementById('username');
    this.password = document.getElementById('password');
    this.loginBtn = document.getElementById('loginBtn');
    this.createAccountBtn = document.getElementById('createAccountBtn');
    this.enterWorldBtn = document.getElementById('enterWorldBtn');
    this.characterList = document.getElementById('characterList');
    this.loginMessage = document.getElementById('loginMessage');
    this.characterMessage = document.getElementById('characterMessage');
    
    // Elementos do gameplay
    this.playerName = document.getElementById('playerName');
    this.playerLevel = document.getElementById('playerLevel');
    this.healthFill = document.getElementById('healthFill');
    this.hpText = document.getElementById('hpText');
    this.positionText = document.getElementById('positionText');
    this.mobCount = document.getElementById('mobCount');
    this.fpsText = document.getElementById('fpsText');
    
    console.log('🔍 Elementos DOM inicializados:', {
      loginScreen: !!this.loginScreen,
      characterScreen: !!this.characterScreen,
      gameScreen: !!this.gameScreen,
      loginBtn: !!this.loginBtn,
      createAccountBtn: !!this.createAccountBtn,
      enterWorldBtn: !!this.enterWorldBtn
    });
  }

  login() {
    console.log('🔍 Iniciando login...');
    
    const username = this.username?.value?.trim();
    const password = this.password?.value?.trim();
    
    console.log('📝 Dados do login:', { username, password: password ? '***' : 'vazio' });
    
    if (!username) {
      console.log('❌ Nome de usuário vazio');
      this.showMessage('loginMessage', 'Digite um nome de usuário', 'error');
      return;
    }
    
    const accounts = JSON.parse(localStorage.getItem('eldoria_accounts') || '{}');
    console.log('📚 Contas encontradas:', Object.keys(accounts));
    
    if (accounts[username]) {
      console.log('✅ Usuário encontrado:', username);
      this.currentUser = accounts[username];
      console.log('👤 Usuário atual definido:', this.currentUser);
      this.showCharacter();
    } else {
      console.log('❌ Usuário não encontrado:', username);
      this.showMessage('loginMessage', 'Usuário não encontrado', 'error');
    }
  }

  createAccount() {
    console.log('👤 Iniciando criação de conta...');
    
    const username = this.username?.value?.trim();
    const password = this.password?.value?.trim();
    
    console.log('📝 Dados da conta:', { username, password: password ? '***' : 'vazio' });
    
    if (!username) {
      console.log('❌ Nome de usuário vazio');
      this.showMessage('loginMessage', 'Digite um nome de usuário', 'error');
      return;
    }
    
    const accounts = JSON.parse(localStorage.getItem('eldoria_accounts') || '{}');
    console.log('📚 Contas existentes:', Object.keys(accounts));
    
    if (accounts[username]) {
      console.log('❌ Usuário já existe:', username);
      this.showMessage('loginMessage', 'Usuário já existe', 'error');
      return;
    }
    
    const user = {
      username,
      password,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };
    
    accounts[username] = user;
    localStorage.setItem('eldoria_accounts', JSON.stringify(accounts));
    
    console.log('✅ Conta criada com sucesso:', username);
    this.showMessage('loginMessage', 'Conta criada com sucesso!', 'success');
  }

  showCharacter() {
    console.log('👥 Exibindo tela de personagens...');
    
    if (this.loginScreen) this.loginScreen.style.display = 'none';
    if (this.characterScreen) this.characterScreen.style.display = 'flex';
    if (this.gameScreen) this.gameScreen.style.display = 'none';
    this.clearMessages();
    this.loadCharacters();
    
    console.log('✅ Tela de personagens exibida');
  }

  showLogin() {
    if (this.loginScreen) this.loginScreen.style.display = 'flex';
    if (this.characterScreen) this.characterScreen.style.display = 'none';
    if (this.gameScreen) this.gameScreen.style.display = 'none';
    this.clearMessages();
  }

  showGame() {
    if (this.loginScreen) this.loginScreen.style.display = 'none';
    if (this.characterScreen) this.characterScreen.style.display = 'none';
    if (this.gameScreen) this.gameScreen.style.display = 'flex';
    this.clearMessages();
    this.startGame();
  }

  loadCharacters() {
    if (!this.currentUser) return;
    
    try {
      const characters = JSON.parse(localStorage.getItem('eldoria_characters') || '{}');
      const userCharacters = characters[this.currentUser.username] || [];
      
      this.characterList.innerHTML = '';
      
      if (userCharacters.length === 0) {
        this.characterList.innerHTML = '<p>Nenhum personagem encontrado. Crie um novo personagem!</p>';
        return;
      }
      
      userCharacters.forEach(character => {
        const card = this.createCharacterCard(character);
        this.characterList.appendChild(card);
      });
    } catch (error) {
      this.characterList.innerHTML = '<p>Erro ao carregar personagens.</p>';
    }
  }

  createCharacterCard(character) {
    const card = document.createElement('div');
    card.className = 'character-card';
    card.innerHTML = `
      <h3>${character.name}</h3>
      <p>Level: ${character.level}</p>
      <p>Class: ${character.class}</p>
      <p>Race: ${character.race || 'Humano'}</p>
      <p>HP: ${character.hp}/${character.maxHp}</p>
    `;
    
    card.addEventListener('click', () => {
      this.currentCharacter = character;
      this.enterWorld();
    });
    
    return card;
  }

  enterWorld() {
    if (!this.currentCharacter) {
      this.showMessage('characterMessage', 'Selecione um personagem', 'error');
      return;
    }
    
    this.showGame();
  }

  createCharacter(name, race, characterClass) {
    if (!this.currentUser) return;
    
    const characters = JSON.parse(localStorage.getItem('eldoria_characters') || '{}');
    const userCharacters = characters[this.currentUser.username] || [];
    
    if (userCharacters.length >= 4) {
      this.showMessage('characterMessage', 'Limite de 4 personagens atingido', 'error');
      return;
    }
    
    const character = {
      id: Date.now().toString(),
      name,
      race,
      class: characterClass,
      level: 1,
      hp: 100,
      maxHp: 100,
      x: 400,
      y: 300,
      createdAt: new Date().toISOString()
    };
    
    userCharacters.push(character);
    characters[this.currentUser.username] = userCharacters;
    localStorage.setItem('eldoria_characters', JSON.stringify(characters));
    
    this.showMessage('characterMessage', 'Personagem criado!', 'success');
    this.loadCharacters();
  }

  startGame() {
    console.log('Game started with character:', this.currentCharacter);
  }

  showMessage(elementId, message, type) {
    console.log('💬 Exibindo mensagem:', { elementId, message, type });
    
    const element = document.getElementById(elementId);
    if (element) {
      element.textContent = message;
      element.className = `message ${type}`;
      console.log('✅ Mensagem exibida no elemento:', elementId);
    } else {
      console.error('❌ Elemento não encontrado para mensagem:', elementId);
    }
  }

  clearMessages() {
    if (this.loginMessage) this.loginMessage.textContent = '';
    if (this.characterMessage) this.characterMessage.textContent = '';
  }

  validateCharacter(character) {
    return character && 
           typeof character === 'object' &&
           typeof character.name === 'string' &&
           character.name.trim().length > 0 &&
           typeof character.race === 'string'
           ? true : false;
  }

  saveCharacter(characterData) {
    if (!this.currentUser) throw new Error('User not logged in');
    
    const characters = JSON.parse(localStorage.getItem('eldoria_characters') || '{}');
    const userCharacters = characters[this.currentUser.username] || [];
    
    if (userCharacters.length >= 4) {
      throw new Error('Limite de 4 personagens por conta atingido');
    }
    
    const character = {
      id: Date.now().toString(),
      ...characterData,
      level: characterData.level || 1,
      hp: characterData.hp || 100,
      maxHp: characterData.maxHp || 100,
      createdAt: new Date().toISOString()
    };
    
    userCharacters.push(character);
    characters[this.currentUser.username] = userCharacters;
    localStorage.setItem('eldoria_characters', JSON.stringify(characters));
    
    return character;
  }

  getRaceIcon(race) {
    const icons = {
      'Humano': '👤',
      'Elfo': '🧝',
      'Anão': '⛏️',
      'Orc': '👹',
      'Morto-Vivo': '🧟',
      'Fada': '🧚'
    };
    return icons[race] || icons['Humano'];
  }

  handleKeyDown(event, keys) {
    const key = event.key.toLowerCase();
    
    // Check if we're in an input field - if so, don't handle game keys
    const activeElement = document.activeElement;
    const isInputField = activeElement && (
        activeElement.tagName === 'INPUT' || 
        activeElement.tagName === 'TEXTAREA' || 
        activeElement.tagName === 'SELECT'
    );
    
    if (isInputField) {
      return; // Allow normal typing in input fields
    }
    
    if (['w', 'a', 's', 'd', ' '].includes(key)) {
      keys[key] = true;
      event.preventDefault();
    }
  }

  calculateFPS() {
    if (!global.performance || !global.performance.now) return 0;
    
    const now = global.performance.now();
    const delta = now - (this.lastFrameTime || now);
    this.lastFrameTime = now;
    
    return delta > 0 ? Math.round(1000 / delta) : 0;
  }

  sanitizeInput(input) {
    if (typeof input !== 'string') return '';
    
    // Remover tags HTML e protocolos javascript
    return input.replace(/<[^>]*>/g, '').replace(/javascript:/gi, '');
  }

  // Métodos adicionais para coverage
  initializeEventListeners() {
    console.log('🔧 Configurando event listeners...');
    
    if (this.loginBtn) {
      this.loginBtn.addEventListener('click', () => {
        console.log('🔑 Botão login clicado');
        this.login();
      });
      console.log('✅ Login button listener adicionado');
    } else {
      console.error('❌ Login button não encontrado');
    }
    
    if (this.createAccountBtn) {
      this.createAccountBtn.addEventListener('click', () => {
        console.log('👤 Botão criar conta clicado');
        this.createAccount();
      });
      console.log('✅ Create account button listener adicionado');
    } else {
      console.error('❌ Create account button não encontrado');
    }
    
    if (this.enterWorldBtn) {
      this.enterWorldBtn.addEventListener('click', () => {
        console.log('🌍 Botão entrar no mundo clicado');
        this.enterWorld();
      });
      console.log('✅ Enter world button listener adicionado');
    } else {
      console.error('❌ Enter world button não encontrado');
    }
    
    // Botão criar personagem
    const createCharacterBtn = document.getElementById('createCharacterBtn');
    if (createCharacterBtn) {
      createCharacterBtn.addEventListener('click', () => {
        console.log('👥 Botão criar personagem clicado');
        this.handleCreateCharacter();
      });
      console.log('✅ Create character button listener adicionado');
    } else {
      console.error('❌ Create character button não encontrado');
    }
  }
  
  handleCreateCharacter() {
    const nameInput = document.getElementById('characterName');
    const raceSelect = document.getElementById('characterRace');
    const classSelect = document.getElementById('characterClass');
    
    if (!nameInput || !raceSelect || !classSelect) {
      console.error('❌ Elementos de criação de personagem não encontrados');
      return;
    }
    
    const name = nameInput.value.trim();
    const race = raceSelect.value;
    const characterClass = classSelect.value;
    
    if (!name) {
      this.showMessage('characterMessage', 'Digite um nome para o personagem', 'error');
      return;
    }
    
    this.createCharacter(name, race, characterClass);
  }
  
  setupEvents() {
    // Método alternativo para compatibilidade
    this.initializeEventListeners();
  }

  showCharacterCreation() {
    if (this.currentUser) {
      this.createCharacter('TestChar', 'Humano');
    }
  }

  // Métodos de utilidade
  clampPosition(x, y, size, canvasWidth, canvasHeight) {
    const clampedX = Math.max(size/2, Math.min(canvasWidth - size/2, x));
    const clampedY = Math.max(size/2, Math.min(canvasHeight - size/2, y));
    return { x: clampedX, y: clampedY };
  }

  updateHUD(character, position, mobCount, fps) {
    if (this.playerName) this.playerName.textContent = character.name;
    if (this.playerLevel) this.playerLevel.textContent = `Lv. ${character.level}`;
    if (this.hpText) this.hpText.textContent = `${character.hp}/${character.maxHp} HP`;
    if (this.positionText) this.positionText.textContent = `${Math.round(position.x)}, ${Math.round(position.y)}`;
    if (this.mobCount) this.mobCount.textContent = mobCount;
    if (this.fpsText) this.fpsText.textContent = fps;
  }

  updateHealthBar(hp, maxHp) {
    if (this.healthFill) {
      const hpPercent = hp / maxHp;
      this.healthFill.style.width = `${hpPercent * 100}%`;
    }
  }
}

// Exportar para uso nos testes
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SimpleLoginManager;
} else if (typeof window !== 'undefined') {
  window.SimpleLoginManager = SimpleLoginManager;
}
