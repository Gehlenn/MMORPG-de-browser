# Eldoria MMORPG - Browser-Based MMORPG

## 🎮 Visão Geral
Eldoria é um MMORPG baseado em navegador desenvolvido com JavaScript vanilla, HTML5 Canvas e Node.js. Atualmente na versão 0.3.5.1v com foco em mecânicas de RPG e interação em tempo real.

## 🚀 Stack Tecnológica
- **Frontend**: HTML5, CSS3, JavaScript ES6+, Canvas API
- **Backend**: Node.js, Express.js, Socket.IO
- **Database**: SQLite (com integração futura para PostgreSQL)
- **Testing**: Vitest, JSDOM, Playwright
- **Build**: Vite (planejado para v0.4.0)

## 🏗️ Arquitetura
```
client/
├── index.html          # Aplicação principal
├── style.css          # Estilos globais
├── game.js            # Lógica do jogo
└── map.js             # Sistema de mapas

server/
├── server.js          # Servidor principal
├── database/          # Camada de dados
└── routes/            # Endpoints da API

tests/
├── unit/              # Testes unitários
├── integration/       # Testes de integração
└── e2e/              # Testes end-to-end
```

## 🔧 Configuração do Ambiente

### Pré-requisitos
- Node.js 18+
- npm 9+
- Navegador moderno com suporte a Canvas API

### Instalação
```bash
# Clonar repositório
git clone https://github.com/eldoria/mmorpg.git
cd mmorpg

# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev

# Iniciar servidor de produção
npm start
```

### Variáveis de Ambiente
```bash
NODE_ENV=development
PORT=3000
DATABASE_URL=./database/mmorpg.db
JWT_SECRET=sua-chave-secreta
```

## 🎮 Gameplay

### Controles
- **W/A/S/D**: Movimento do personagem
- **Espaço**: Ataque
- **Enter**: Focar no chat
- **Click**: Interagir com objetos/NPCs

### Sistema de Personagens
- Máximo 4 personagens por conta
- 6 raças disponíveis: Humano, Elfo, Anão, Orc, Morto-Vivo, Fada
- Classes: Aprendiz (inicial), Guerreiro, Mago, Arqueiro, Ladino
- Sistema de level e experiência

### Mecânicas Principais
- Combate em tempo real
- Sistema de chat global
- Minimapa com posição dos jogadores
- Inventário e equipamentos
- Missões e quests

## 🔐 Segurança

### Validações Implementadas
- Sanitização de input do usuário
- Validação de dados em localStorage
- Prevenção de XSS
- Rate limiting em ações críticas

### Vulnerabilidades Conhecidas
- [P0] Context loss em game loop
- [P1] Memory leaks em event listeners
- [P1] Race conditions em localStorage

## 📊 Performance

### Métricas Alvo
- FPS: 60 estável
- Latência: <100ms
- Memory usage: <50MB
- Coverage: >98%

### Otimizações
- Canvas pooling
- Event delegation
- Lazy loading de assets
- Debounce em inputs

## 🧪 Testes

### Executar Testes
```bash
# Todos os testes
npm test

# Testes unitários
npm run test:unit

# Testes de integração
npm run test:integration

# Testes E2E
npm run test:e2e

# Coverage
npm run test:coverage
```

### Estrutura de Testes
- Unit: Lógica de negócio isolada
- Integration: Comunicação entre componentes
- E2E: Fluxos completos do usuário

## 🚀 Deploy

### Produção
```bash
# Build para produção
npm run build

# Deploy em produção
npm run deploy
```

### Variáveis de Produção
```bash
NODE_ENV=production
PORT=80
DATABASE_URL=postgresql://user:pass@host:5432/eldoria
REDIS_URL=redis://host:6379
```

## 📝 Roadmap

### v0.4.0 (Próximo)
- [ ] Sistema de classes avançado
- [ ] Inventário completo
- [ ] Sistema de guildas
- [ ] Chat por canais

### v0.5.0
- [ ] Sistema de economia
- [ ] Lojas e NPCs
- [ ] Sistema de craft

### v1.0.0 (Lançamento)
- [ ] Multiplayer real-time
- [ ] Sistema de instâncias
- [ ] Balanceamento completo

## 🤝 Contribuição

### Guidelines
1. Fork do repositório
2. Branch feature/nome-da-feature
3. Commit com mensagens claras
4. Pull request com descrição detalhada
5. Code review obrigatório

### Code Style
- ESLint + Prettier
- Convenção de nomes: camelCase
- Máximo 80 caracteres por linha
- Comentários em português

## 📄 Licença
MIT License - Ver arquivo LICENSE para detalhes

## 🆘 Suporte
- Discord: https://discord.gg/eldoria
- Issues: https://github.com/eldoria/mmorpg/issues
- Wiki: https://github.com/eldoria/mmorpg/wiki

## 📊 Status do Projeto
- **Versão**: 0.3.5.1v
- **Status**: Instável ⚠️
- **Coverage**: 87% (abaixo da meta)
- **Próximo Release**: v0.4.0-RC1

---

**Última atualização**: 2026-03-09
**Responsável**: Game Director & Lead Software Engineer
