# MMORPG Browser - Versão 0.3.5

## 📋 Visão Geral
MMORPG baseado em browser com sistema completo de login, seleção de personagem e gameplay em tempo real.

## 🚀 Tecnologias Utilizadas

### Frontend
- **JavaScript ES5/ES6** - Lógica do jogo
- **HTML5 Canvas** - Renderização do jogo
- **CSS3** - Interface moderna e responsiva
- **Socket.io Client** - Comunicação em tempo real

### Backend
- **Node.js** - Servidor principal
- **Express.js** - API REST
- **Socket.io** - WebSocket para multiplayer
- **SQLite** - Banco de dados

### Assets
- **Estrutura modular** em `/client/assets/`
- **Mapas** - `/assets/maps/`
- **Personagens** - `/assets/characters/`
- **NPCs** - `/assets/npcs/`
- **Monstros** - `/assets/monsters/`
- **UI** - `/assets/ui/`

## 🛠️ Instalação

### Pré-requisitos
- Node.js 16+
- NPM ou Yarn

### Passos
```bash
# Clonar repositório
git clone <repository-url>
cd MMORPG-de-browser

# Instalar dependências
npm install

# Iniciar servidor
npm start
```

### Variáveis de Ambiente
```env
PORT=3002
NODE_ENV=development
```

## 🎮 Funcionalidades Implementadas

### v0.3.5 - Sistema Completo
- ✅ **Login System** - Autenticação com WebSocket
- ✅ **Character Selection** - 2 slots por usuário
- ✅ **Character Creation** - Nome + raça + classe aprendiz
- ✅ **Asset Management** - Sistema centralizado
- ✅ **Real-time Gameplay** - Multiplayer funcional
- ✅ **HUD Interface** - Interface de jogo moderna
- ✅ **Map System** - Carregamento dinâmico de mapas

## 🏗️ Arquitetura

### Frontend Structure
```
client/
├── assets/           # Assets do jogo
├── entities/         # Renderers
├── systems/          # Sistemas do jogo
├── ui/              # Interface components
├── world/           # Mapas e assets
├── login-system.js  # Sistema de login
├── character-selection.js # Seleção de personagem
└── main_new.js      # Motor do jogo
```

### Backend Structure
```
server/
├── server.js        # Servidor principal
├── database/        # Database handlers
└── routes/          # API endpoints
```

## 🧪 Testes

### Executar Testes
```bash
# Abrir no navegador
http://localhost:3002

# Executar suíte de testes
console.log(runTests())
```

### Cobertura
- **Target:** 98% de cobertura
- **Testes Unitários:** 10 testes críticos
- **Testes de Integração:** Fluxo completo

## 📊 Performance

### Métricas
- **Asset Loading:** < 5s
- **Login Response:** < 1s
- **Game Loop:** 60 FPS
- **Memory Usage:** < 100MB

## 🔧 Configuração

### Servidor
```javascript
// server/server.js
const server = new GameServer({
    port: 3002,
    database: './database/mmorpg.db'
});
```

### Client
```javascript
// client/config.js
const config = {
    serverUrl: 'http://localhost:3002',
    assetPath: '/assets/',
    debug: true
};
```

## 🐛 Debug

### Logs Importantes
```javascript
// Ativar debug
localStorage.debug = 'mmorpg:*';

// Verificar sistemas
console.log(window.gameEngine);
console.log(window.assetManager);
console.log(window.spriteManager);
```

## 📝 Contribuição

### Standards
- **Code Style:** ES5/ES6 compatível
- **Commits:** Semântico
- **Branches:** feature/nome-da-feature

### Pull Requests
1. Fork do repositório
2. Criar branch
3. Implementar com testes
4. Submeter PR

## 📄 Licença
MIT License - Ver arquivo LICENSE

---

**Versão 0.3.5** - Sistema completo funcional
