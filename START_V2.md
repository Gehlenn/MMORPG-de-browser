# MMORPG de Browser v0.3 - Instruções de Início

## 🚀 Como Iniciar o Jogo Versão 0.3

### 🆕 NOVIDADES DA VERSÃO 0.3
- **Multiplayer Real-time**: Conecte-se com outros jogadores
- **Sistema de Chat**: Múltiplos canais de comunicação
- **Party System**: Forme grupos de até 6 jogadores
- **Guild System**: Crie e gerencie guildas de até 50 membros
- **Eventos Dinâmicos**: Invasões, bosses mundiais e eventos sazonais
- **Integração Social**: Completamente integrado com sistemas existentes

### Pré-requisitos
- Node.js 14.0 ou superior
- Navegador moderno com suporte a ES6 Modules
- Servidor local (para testes)
- Conexão com internet (para multiplayer)

---

## 📋 Passo a Passo

### 1. Iniciar o Servidor Backend
```bash
# No diretório raiz do projeto
npm start
```
O servidor irá iniciar em `http://localhost:3000`

### 2. Abrir o Jogo no Navegador
- Abra `http://localhost:3000` no navegador
- O jogo irá carregar automaticamente a nova arquitetura v0.3
- Aguarde a conexão com o servidor multiplayer

### 3. Verificar se Tudo Está Funcionando
- Abra o console do navegador (F12)
- Execute `window.runSystemTests()` para testes básicos
- Execute `window.runVersion3Tests()` para testes sociais/multiplayer
- Todos os testes devem passar ✅

### 4. Explorar as Novas Funcionalidades
- **Chat**: Use a interface de chat no canto inferior esquerdo
- **Party**: Clique no botão "+" para criar uma party
- **Guild**: Crie sua guild quando alcançar nível 10
- **Eventos**: Participe de eventos mundiais dinâmicos

---

## 🏗️ Sistema de Arquivos v0.3

### Novos Arquivos Principais
```
client/
├── main.js                  # Ponto de entrada v0.3 (atualizado)
├── config.js                # Configurações centralizadas
├── test.js                  # Testes básicos v0.2
├── test_v3.js              # Testes sociais/multiplayer (NOVO)
├── engine/                  # Sistema de engine (5 arquivos)
├── world/                   # Sistema de mundo (4 arquivos)
├── entities/                # Sistema de entidades (5 arquivos)
├── social/                  # 🆕 Sistemas sociais (4 arquivos)
│   ├── ChatSystem.js       # Chat multi-canal
│   ├── PartySystem.js      # Sistema de party
│   ├── GuildSystem.js      # Sistema de guildas
│   └── FriendSystem.js     # Sistema de amigos (futuro)
├── multiplayer/             # 🆕 Sistemas de rede (1 arquivo)
│   └── NetworkManager.js   # Gerenciamento de conexão
├── events/                  # 🆕 Eventos dinâmicos (1 arquivo)
│   └── WorldEventManager.js # Gerenciador de eventos
├── game.js                  # Legado v0.1 (mantido)
└── index.html               # Atualizado para v0.3
```

### Fluxo de Inicialização v0.3
1. `index.html` carrega `main.js` como módulo ES6
2. `main.js` inicializa sistemas v0.2 + sistemas sociais v0.3
3. `NetworkManager` estabelece conexão WebSocket
4. Sistemas sociais se integram com UI existente
5. Jogo começa com multiplayer ativado

---

## 🎮 Recursos da Versão 0.3

### ✅ Sistemas v0.2 (Mantidos)
- **Engine Modular**: 5 sistemas principais independentes
- **Mundo Procedural**: 8 biomas únicos com geração infinita
- **Sistema de Entidades**: Player, Monster, NPC, Item avançados
- **IA de Monstros**: 6 estados de comportamento
- **Sistema de Classes**: 6 classes com progressão em 6 tiers
- **Sistema de Itens**: 6 raridades com upgrade e encantamento
- **Economia Dinâmica**: Mercado com oferta e demanda
- **Sistema de Craft**: 7 profissões com 5 níveis de qualidade

### 🆕 Sistemas v0.3 (Novos)

#### 🌐 Multiplayer Foundation
- **WebSocket Connection**: Conexão real-time com servidor
- **Network Manager**: Gerenciamento de conexão e reconexão automática
- **Message Protocol**: Sistema de mensagens estruturado
- **Latency Compensation**: Previsão client-side (futuro)
- **State Synchronization**: Sincronização de estado do jogo

#### 💬 Sistema de Chat Avançado
- **Múltiplos Canais**: Global, Local, Party, Guild, Comércio, Ajuda
- **Comandos de Chat**: /help, /whisper, /mute, /block, /report
- **Sistema de Emotes**: /dance, /wave, /bow, /laugh, /cry, /angry
- **Moderação**: Mute, block, report automático
- **Histórico**: Persistência de mensagens por canal

#### 👥 Sistema de Party
- **Formação de Grupos**: Até 6 jogadores por party
- **Sistema de Convites**: Convites com timeout e notificações
- **Loot Distribution**: Need Before Greed, Free for All, Master Loot
- **Compartilhamento de XP**: XP dividido entre membros
- **Interface Completa**: UI de gerenciamento de party

#### 🏰 Sistema de Guildas
- **Criação de Guildas**: Nível mínimo 10, taxas de criação
- **Hierarquia**: Leader, Officer, Veteran, Member, Initiate
- **Guild Hall**: Salão privativo com armazenamento
- **Guild Chat**: Canal exclusivo para membros
- **Sistema de Permissões**: Controle de acesso granular

#### 🎭 Sistema de Eventos Dinâmicos
- **Invasões**: Eventos de invasão por bioma
- **World Bosses**: Bosses mundiais com recompensas épicas
- **Bônus de Recursos**: Eventos de coleta com multiplicadores
- **Eventos Sazonais**: Festivais e atividades especiais
- **Sistema de Participação**: Join/leave com recompensas baseadas em contribuição

### 🔄 Melhorias de Performance v0.3
- **Network Optimization**: Mensagens compactadas e batch
- **UI Responsiva**: Interfaces sociais otimizadas
- **Memory Management**: Cleanup automático de sistemas sociais
- **Event Scheduling**: Agendamento eficiente de eventos

---

## 🧪 Testes e Validação v0.3

### Executar Testes Automáticos
```javascript
// No console do navegador
window.runSystemTests()     // Testes básicos v0.2
window.runVersion3Tests()   // Testes sociais/multiplayer
```

### Testes Disponíveis v0.3
- ✅ **Network Manager**: Conexão e gerenciamento de mensagens
- ✅ **Chat System**: Canais, comandos, moderação
- ✅ **Party System**: Criação, convites, gerenciamento
- ✅ **Guild System**: Criação, permissões, hierarquia
- ✅ **Event Manager**: Criação e gerenciamento de eventos
- ✅ **Integração**: Comunicação entre todos os sistemas
- ✅ **Performance**: Processamento de mensagens e eventos

### Verificação Manual v0.3
1. **Conexão Multiplayer**: Verifique status "Online" no topo
2. **Chat Funcionando**: Envie mensagens no chat global
3. **Party Creation**: Crie uma party e convide amigos
4. **Guild Creation**: Crie uma guild (nível 10+)
5. **Event Participation**: Participe de eventos ativos

---

## 🔍 Debug e Troubleshooting v0.3

### Problemas Comuns v0.3

#### ❌ "Falha na conexão multiplayer"
- **Causa**: Servidor offline ou problemas de rede
- **Solução**: Verifique se `npm start` está rodando

#### ❌ "Chat não aparece"
- **Causa**: Sistema de chat não inicializado
- **Solução**: Recarregue página e verifique console

#### ❌ "Party/Guild não funciona"
- **Causa**: Permissões ou nível insuficiente
- **Solução**: Verifique requisitos (nível 10+ para guild)

#### ❌ "Eventos não aparecem"
- **Causa**: Sem eventos ativos no servidor
- **Solução**: Aguarde eventos programados ou crie manualmente

### Logs Úteis v0.3
```javascript
// Verificar estado dos sistemas sociais
console.log(window.networkManager);
console.log(window.chatSystem);
console.log(window.partySystem);
console.log(window.guildSystem);
console.log(window.eventManager);

// Verificar conexão
console.log('Connection state:', window.networkManager.getConnectionState());
console.log('Player ID:', window.networkManager.playerId);
```

---

## 🎯 Guia Rápido v0.3

### Para Novos Jogadores
1. **Conecte-se**: Aguarde conexão "Online"
2. **Explore**: Use o chat global para socializar
3. **Forme Grupo**: Crie party para dungeons
4. **Entre em Guild**: Participe de guilda ativa
5. **Eventos**: Junte-se a eventos mundiais

### Para Líderes de Guild
1. **Crie Guild**: Alcance nível 10 e crie guild
2. **Recrute**: Use convites para adicionar membros
3. **Gerencie**: Defina oficiais e permissões
4. **Organize**: Crie eventos para guild
5. **Expanda**: Participe de guerras de território (futuro)

### Para Desenvolvedores
1. **Estude Sistemas**: Analise arquivos em `/social/` e `/multiplayer/`
2. **Extenda Funcionalidades**: Adicione novos comandos de chat
3. **Crie Eventos**: Desenvolva novos tipos de eventos
4. **Otimize Performance**: Melhore sincronização de rede
5. **Teste Integração**: Use suítes de teste disponíveis

---

## 📊 Comparação v0.2 vs v0.3

| Característica | v0.2 | v0.3 |
|----------------|------|------|
| Linhas de Código | ~15,000 | ~25,000 |
| Sistemas | 15 básicos | 20 + sociais |
| Multiplayer | ❌ Não | ✅ WebSocket real-time |
| Chat | ❌ Não | ✅ Multi-canal |
| Party | ❌ Não | ✅ Sistema completo |
| Guild | ❌ Não | ✅ Hierarquia + permissões |
| Eventos | ❌ Não | ✅ Dinâmicos + sazonais |
| Social Features | ❌ Não | ✅ Completos |
| Testes | Básicos | Sociais + integração |

---

## 🆘 Suporte v0.3

### Canais de Ajuda
- **Console do Navegador**: Verifique erros em tempo real
- **Testes Automáticos**: `window.runVersion3Tests()`
- **Documentação**: Leia arquivos em `/social/` e `/multiplayer/`
- **Código Fonte**: Comentários detalhados em todos os sistemas

### Comandos Úteis v0.3
```javascript
// Reiniciar conexão multiplayer
window.networkManager.disconnect();
window.networkManager.connect();

// Testar chat
window.chatSystem.addSystemMessage('Test message', 'info');

// Verificar party
console.log(window.partySystem.isInParty());

// Verificar guild
console.log(window.guildSystem.isInGuild());

// Listar eventos ativos
console.log(window.eventManager.getActiveEvents());
```

---

## 🚀 Próximos Passos (v0.4)

### Planejado para Versão 0.4
- **Territory Control**: Sistema de controle de território
- **Castle Sieges**: Batalhas de cerco em grande escala
- **PvP Arenas**: Arenas competitivas
- **Housing System**: Casas personalizáveis
- **Mount System**: Montarias e veículos
- **Advanced Raids**: Raids de 40+ jogadores

---

**Versão**: 0.3.0  
**Data**: 6 de Março de 2026  
**Status**: ✅ Estável e Multiplayer  

Divirta-se explorando o mundo multiplayer do MMORPG de Browser v0.3! 🎮✨🌐
