// Refactor Login Modes Script
// Adiciona suporte a modos de jogo configuráveis no login

const fs = require('fs');
const path = require('path');

console.log('🔧 Refatorando Login para Modos Configuráveis\n');

function refactorLoginModes() {
    const loginManagerPath = path.join(__dirname, '../client/SimpleLoginManager.js');
    
    if (!fs.existsSync(loginManagerPath)) {
        console.error('❌ SimpleLoginManager.js não encontrado');
        return false;
    }
    
    let loginContent = fs.readFileSync(loginManagerPath, 'utf8');
    
    // 1. Adicionar método login() com suporte a modos
    console.log('📝 Adicionando método login() com modo configurável...');
    
    const loginMethod = `login() {
    console.log('🔍 Iniciando login...');
    
    const username = this.username?.value?.trim();
    const password = this.password?.value?.trim();
    
    if (!username || !password) {
      this.showMessage('loginMessage', 'Preencha usuário e senha', 'error');
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
    
    try {
      const users = JSON.parse(localStorage.getItem('users') || '{}');
      const user = users[username];
      
      if (user && user.password === password) {
        console.log('✅ Login sucesso:', username);
        this.currentUser = { username, email: user.email };
        localStorage.setItem('current_user', JSON.stringify(this.currentUser));
        this.showMessage('loginMessage', 'Login realizado!', 'success');
        
        // Transição para seleção de personagem
        setTimeout(() => {
          this.showCharacterSelection();
        }, 1000);
        
        return;
      }
    } catch (error) {
      console.error('Erro login:', error);
    }
    
    this.showMessage('loginMessage', 'Usuário ou senha incorretos', 'error');
  }
  
  loginViaServer(username, password) {
    console.log('🔐 Login via servidor (Socket.IO) - ainda não implementado');
    this.showMessage('loginMessage', 'Login online em desenvolvimento...', 'info');
    
    // TODO: Implementar conexão com servidor
    // if (window.networkManager) {
    //   window.networkManager.sendLogin(username, password);
    // }
  }`;

    // Substituir método handleLogin existente
    const handleLoginPattern = /handleLogin\(\) \{[\s\S]*?this\.showMessage\('loginMessage', 'Usuário ou senha incorretos', 'error'\);\s*\}/;
    
    if (handleLoginPattern.test(loginContent)) {
        loginContent = loginContent.replace(handleLoginPattern, loginMethod);
        console.log('✅ Método login() atualizado com suporte a modos');
    }
    
    // 2. Adicionar método createAccount() com suporte a modos
    console.log('📝 Adicionando método createAccount() com modo configurável...');
    
    const createAccountMethod = `createAccount() {
    console.log('👤 Criando conta...');
    
    const username = this.username?.value?.trim();
    const password = this.password?.value?.trim();
    const email = this.email?.value?.trim();
    const confirmPassword = this.confirmPassword?.value?.trim();
    
    if (!username || !password || !email || !confirmPassword) {
      this.showMessage('loginMessage', 'Preencha todos os campos', 'error');
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
    
    try {
      const users = JSON.parse(localStorage.getItem('users') || '{}');
      
      if (users[username]) {
        this.showMessage('loginMessage', 'Usuário já existe', 'error');
        return;
      }
      
      users[username] = {
        username, email, password,
        createdAt: new Date().toISOString()
      };
      
      localStorage.setItem('users', JSON.stringify(users));
      this.showMessage('loginMessage', 'Conta criada com sucesso!', 'success');
      
      setTimeout(() => this.showLoginForm(), 1500);
      
    } catch (error) {
      console.error('Erro criar conta:', error);
      this.showMessage('loginMessage', 'Erro ao criar conta', 'error');
    }
  }
  
  createAccountViaServer(username, password, email) {
    console.log('👤 Criando conta via servidor - ainda não implementado');
    this.showMessage('loginMessage', 'Criação de conta online em desenvolvimento...', 'info');
    
    // TODO: Implementar criação de conta no servidor
    // if (window.networkManager) {
    //   window.networkManager.sendCreateAccount(username, password, email);
    // }
  }`;

    // Substituir método handleCreateAccount existente
    const handleCreateAccountPattern = /handleCreateAccount\(\) \{[\s\S]*?this\.showMessage\('loginMessage', 'Erro ao criar conta', 'error'\);\s*\}/;
    
    if (handleCreateAccountPattern.test(loginContent)) {
        loginContent = loginContent.replace(handleCreateAccountPattern, createAccountMethod);
        console.log('✅ Método createAccount() atualizado com suporte a modos');
    }
    
    // 3. Adicionar inicialização do NetworkManager se modo online
    console.log('📝 Adicionando inicialização condicional do NetworkManager...');
    
    const initNetworkManager = `// Inicializar NetworkManager se modo online
    if (typeof Config !== 'undefined' && Config.GAME_MODE === 'SERVER_ONLINE') {
      if (typeof NetworkManager !== 'undefined') {
        window.networkManager = new NetworkManager();
        window.networkManager.connect(Config.SERVER_ADDRESS());
        console.log('📡 NetworkManager inicializado para modo online');
      }
    }`;
    
    // Adicionar no construtor
    const constructorPattern = /constructor\(\) \{[\s\S]*?this\.logoutBtn = document\.getElementById\('logoutBtn'\);/;
    
    if (constructorPattern.test(loginContent)) {
        loginContent = loginContent.replace(constructorPattern, 
            constructorPattern.exec(loginContent)[0] + '\n\n    ' + initNetworkManager);
        console.log('✅ Inicialização do NetworkManager adicionada');
    }
    
    // Salvar arquivo
    fs.writeFileSync(loginManagerPath, loginContent);
    console.log('✅ Arquivo SimpleLoginManager.js salvo com sucesso');
    
    return true;
}

// Executar
console.log('🎯 Refactor Login Modes v0.1.0');
console.log('===============================\n');

const success = refactorLoginModes();

if (success) {
    console.log('\n🎮 Login refatorado para modos configuráveis!');
    console.log('📝 Método login() com suporte a CLIENT_OFFLINE/SERVER_ONLINE');
    console.log('📝 Método createAccount() com suporte a CLIENT_OFFLINE/SERVER_ONLINE');
    console.log('📝 NetworkManager inicializado condicionalmente');
    console.log('📝 Preparado para migração para servidor');
} else {
    console.log('\n❌ Falha ao refatorar login');
}

console.log('\n✅ Script concluído!');
