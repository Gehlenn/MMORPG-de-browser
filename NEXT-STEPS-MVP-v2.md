# 🎯 NEXT-STEPS-MVP.md - Eldoria MMORPG
## Roadmap Técnico Completo para MVP Core

**Versão:** 2.0 (Atualizado)  
**Data:** Março 2026  
**Objetivo:** Definir escopo mínimo viável (MVP) com especificações técnicas detalhadas

---

## 📋 ESCOPO DO MVP CORE

### ✅ O que ESTÁ INCLUÍDO no MVP:

1. **Login/Account** - Sistema de autenticação simples
2. **Criação de Personagem** - Escolha de classe base (8 classes)
3. **Entrada no Mundo 2D** - Mapa top-down básico
4. **Movimento WASD** - Controle fluido de personagem
5. **Inimigos Visíveis** - Mobs spawnados no mundo
6. **Combate Básico** - Ataque próximo (melee/ranged)
7. **Skill Bar** - Visualização de skills (8 slots)
8. **XP e Level Up** - Progressão até nível 10

### ❌ O que NÃO ESTÁ INCLUÍDO no MVP:

- ❌ Especializações de classe (Lv 40+)
- ❌ Dungeons instanciadas
- ❌ PvP/Arenas
- ❌ Guilds
- ❌ Auction House
- ❌ Profissões crafting
- ❌ Battle Pass
- ❌ World Events

---

## 🖥️ 1. TELAS DO MVP (WIREFRAMES)

### **Tela 1: Login**
```
┌─────────────────────────────────────┐
│                                     │
│      🌍 ELDORIA MMORPG              │
│      Continente de Eldoria          │
│                                     │
│  ┌─────────────────────────┐       │
│  │ Username: [____________] │       │
│  │ Password: [____________] │       │
│  └─────────────────────────┘       │
│                                     │
│     [        ENTRAR        ]        │
│                                     │
│  [Criar Nova Conta]  [Offline]      │
│                                     │
└─────────────────────────────────────┘
```

**Sistemas Mínimos:**
- Campos username/password
- Validação básica (não vazio, min 3 chars)
- Socket event: `auth:login`
- Resposta: sucesso/erro
- Armazenar token/jogador local (localStorage)
- Botão Offline para testes sem servidor

**Critério de Aceitação:**
- ✅ Player consegue logar com credenciais válidas
- ✅ Mensagem de erro se credenciais inválidas
- ✅ Redireciona para Character Selection
- ✅ Modo offline funciona sem servidor

---

### **Tela 2: Account/Character Selection**
```
┌─────────────────────────────────────┐
│  SELECIONE SEU PERSONAGEM           │
│                                     │
│  ┌─────┐  ┌─────┐  ┌─────┐         │
│  │ 👤  │  │ 👤  │  │  +  │         │
│  │Lv 5 │  │Lv 1 │  │ Novo│         │
│  │War  │  │Mage │  │     │         │
│  └─────┘  └─────┘  └─────┘         │
│  Guerreiro Mago   Criar            │
│                                     │
│  [Entrar no Mundo]  [Deletar]      │
│  [Voltar ao Login]                  │
└─────────────────────────────────────┘
```

**Sistemas Mínimos:**
- Lista de personagens da conta (até 3)
- Slot "Novo Personagem" (máx 3)
- Socket event: `account:characters` (get)
- Mostra: classe, nível, nome
- Delete com confirmação (modal)
- Seleção highlight visual

**Critério de Aceitação:**
- ✅ Lista personagens existentes
- ✅ Mostra classe/level/nome de cada um
- ✅ Botão "Novo" leva para Character Create
- ✅ Deletar pede confirmação
- ✅ Selecionado fica destacado

---

### **Tela 3: Character Create**
```
┌─────────────────────────────────────┐
│  CRIAR NOVO PERSONAGEM              │
│                                     │
│  Nome: [________________]           │
│                                     │
│  Escolha sua Classe:                │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐       │
│  │ ⚔️ │ │ 🔮 │ │ 🏹 │ │ ⭐ │       │
│  │War │ │Mage│ │Arch│ │Pri │       │
│  └────┘ └────┘ └────┘ └────┘       │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐       │
│  │ 🌿 │ │ 🗡️ │ │ 💀 │ │ 👊 │       │
│  │Dru │ │Rog │ │War │ │Fig │       │
│  └────┘ └────┘ └────┘ └────┘       │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ Guerreiro                   │   │
│  │ Melee DPS/Tank              │   │
│  │                             │   │
│  │ Stats Base:                 │   │
│  │ STR 20 | AGI 10 | VIT 15    │   │
│  │ INT 5  | SAB 8  | FIS 12    │   │
│  └─────────────────────────────┘   │
│                                     │
│  [    CRIAR PERSONAGEM    ]        │
│  [        VOLTAR          ]        │
└─────────────────────────────────────┘
```

**Sistemas Mínimos:**
- Input de nome (max 12 chars, alfanumérico)
- Grid de 8 classes selecionáveis
- Preview de stats base ao selecionar
- Socket event: `character:create`
- Validação nome único
- Dados: name, classId

**Critério de Aceitação:**
- ✅ Consegue selecionar qualquer classe
- ✅ Mostra preview de stats atualizado
- ✅ Cria personagem no servidor
- ✅ Redireciona para Character Selection
- ✅ Valida nome (não vazio, único)

---

### **Tela 4: World (Gameplay Principal)**
```
┌──────────────────────────────────────────────────────────┐
│ 👤 Arthur    Lv 5  ████████████████████░░ 100/120 HP     │
│ Class: Guerreiro  ██████████████░░░░░░░░░ 250/500 MP    │
│                                                      🗺️ │
│                                                          │
│         🌲                                               │
│              👹 Goblin Lv 3                              │
│                   HP: ████████░░░ 80/100                │
│                                                          │
│                      🧙‍♂️  ← Player                      │
│                        🐺 Lobo Lv 5                      │
│                              🌲                          │
│                                                          │
│  [Chat]                          [Combat Log]           │
│  > Olá mundo                      -15 Slime               │
│                                  +10 XP                 │
│                                                          │
│  ╔═══════════════════════════════════════════════════╗  │
│  ║  [1⚔️] [2🛡️] [3❔] [4❔] [5❔] [6❔] [7❔] [8❔]  ║  │
│  ║   0s     2s    ready  ready  ready  ready  ready  ║  │
│  ╚═══════════════════════════════════════════════════╝  │
│  HP/MP BARS | XP: ████████████░░░░░░ 1200/2000         │
└──────────────────────────────────────────────────────────┘
```

**Sistemas Mínimos:**
- Canvas 2D top-down (full screen)
- Player renderizado no centro (animação idle)
- Mobs renderizados nas posições (com nome/level)
- Movimento WASD fluido (8 direções)
- Ataque com barra de espaço ou clique
- Skill bar com 8 slots (teclas 1-8)
- HP/MP/XP bars no canto superior
- Chat básico (enter para abrir)
- Combat log (dano/cura/xp)

**Critério de Aceitação:**
- ✅ Player se move suavemente (60fps)
- ✅ Mobs aparecem no mundo com nome/level
- ✅ Consegue atacar mob próximo (dentro range)
- ✅ Dano aparece como floating text
- ✅ XP ganho ao matar (barra preenche)
- ✅ Level up funciona (stats aumentam)

---

## 📁 2. ESTRUTURA DE ARQUIVOS RECOMENDADA

```
client/
├── index.html
├── css/
│   └── game.css
├── core/
│   ├── GameplayEngine.js      [NOVO] State + Render
│   ├── InputManager.js        [NOVO] Teclado/Mouse
│   └── AssetManager.js        [FUTURO] Sprites/Sons
├── entities/
│   ├── Character.js           [NOVO] Player/Mobs base
│   ├── Player.js              [FUTURO] Extensão
│   └── Mob.js                 [FUTURO] Extensão
├── skills/
│   ├── SkillDB.js             [NOVO] Database
│   └── SkillSystem.js         [NOVO] Aplicação
├── ui/
│   ├── HUDManager.js          [NOVO] Interface
│   ├── UIManager.js           [FUTURO] Menus
│   └── ChatManager.js         [FUTURO] Chat
├── network/
│   ├── NetworkManager.js      [EXISTE] Socket
│   └── NetworkEvents.js       [EXISTE] Constantes
└── utils/
    ├── Logger.js              [EXISTE]
    └── MathUtils.js           [NOVO]

server/
├── server.js                  [ATUALIZAR]
├── systems/
│   ├── ClassSystem.js         [✅]
│   ├── StatSystem.js          [✅]
│   ├── SkillSystem.js         [✅]
│   ├── MobSystem.js           [✅]
│   ├── CombatSystem.js        [✅]
│   └── TalentSystem.js        [✅]
└── handlers/
    ├── AuthHandler.js         [FUTURO]
    ├── GameHandler.js         [FUTURO]
    └── CombatHandler.js       [FUTURO]
```

---

## ✅ 3. CHECKLIST DE IMPLEMENTAÇÃO

### **Fase 1: Core Engine (Semana 1)**
- [ ] Criar `client/core/GameplayEngine.js`
- [ ] Implementar State management
- [ ] Implementar Render loop (60fps)
- [ ] Implementar Input handling (WASD)
- [ ] Testar movimento básico

### **Fase 2: HUD (Semana 1)**
- [ ] Criar `client/ui/HUDManager.js`
- [ ] Criar elementos DOM
- [ ] Implementar HP/MP/XP bars
- [ ] Implementar Skill bar (8 slots)
- [ ] Implementar Minimap
- [ ] Implementar Combat Log
- [ ] Testar integração com Engine

### **Fase 3: Character (Semana 2)**
- [ ] Criar `client/entities/Character.js`
- [ ] Implementar stats base
- [ ] Implementar cálculo de stats
- [ ] Implementar HP/MP management
- [ ] Implementar XP/Level system
- [ ] Implementar serialization

### **Fase 4: Skills (Semana 2)**
- [ ] Criar `client/skills/SkillDB.js`
- [ ] Definir todas as skills base
- [ ] Criar `client/skills/SkillSystem.js`
- [ ] Implementar uso de skills
- [ ] Implementar cooldowns visuais
- [ ] Conectar teclas 1-8

### **Fase 5: Network (Semana 3)**
- [ ] Atualizar `NetworkManager.js`
- [ ] Implementar envio de movimento
- [ ] Implementar recebimento de entities
- [ ] Implementar sync de combate
- [ ] Testar multiplayer básico

### **Fase 6: Polish (Semana 4)**
- [ ] Floating text (dano/xp)
- [ ] Animações básicas
- [ ] Efeitos visuais (partículas)
- [ ] Som básico
- [ ] Bug fixes
- [ ] Performance optimization

---

## 🎯 4. DEFINIÇÃO DE "PRONTO" (DONE)

O MVP está **PRONTO** quando:

✅ **Player consegue:**
1. Logar (online ou offline)
2. Criar personagem (8 classes)
3. Entrar no mundo
4. Mover com WASD (suave, 60fps)
5. Ver mobs (mínimo 3 tipos)
6. Atacar (espaço ou click)
7. Ver dano (floating text)
8. Matar mob e ganhar XP
9. Subir de nível
10. Ver XP/HP/MP na HUD
11. Usar skills (1-8)
12. Ver cooldowns

✅ **Técnico:**
- FPS estável > 30
- Sem memory leaks
- Sem crashes em troca de tela
- Código organizado (Engine/HUD separados)

---

## 🚀 5. PRÓXIMOS PASSOS IMEDIATOS

**Hoje:**
1. Criar `client/core/GameplayEngine.js`
2. Criar `client/ui/HUDManager.js`
3. Testar em `index.html`

**Amanhã:**
4. Criar `client/entities/Character.js`
5. Criar `client/skills/SkillDB.js`
6. Integrar com servidor existente

---

## 📊 PRIORIDADES DE IMPLEMENTAÇÃO

| Prioridade | Sistema | Complexidade | Impacto |
|------------|---------|--------------|---------|
| P0 | GameplayEngine (state+render) | Média | ⭐⭐⭐⭐⭐ |
| P0 | Character Class | Baixa | ⭐⭐⭐⭐⭐ |
| P0 | Movement WASD | Baixa | ⭐⭐⭐⭐⭐ |
| P1 | Combat básico | Média | ⭐⭐⭐⭐ |
| P1 | HUD Manager | Média | ⭐⭐⭐⭐ |
| P1 | Skill System | Média | ⭐⭐⭐⭐ |
| P2 | XP/Level Up | Baixa | ⭐⭐⭐ |
| P2 | Floating Text | Baixa | ⭐⭐⭐ |
| P3 | Minimap | Baixa | ⭐⭐ |
| P3 | Partículas | Alta | ⭐ |

---

## 🗺️ MAPA DE DEPENDÊNCIAS

```
┌─────────────┐
│   Login     │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Character   │
│ Selection   │
└──────┬──────┘
       │
       ▼
┌─────────────┐     ┌─────────────┐
│    World    │◄────│    Mobs     │
│   (Canvas)  │     │   (Server)  │
└──────┬──────┘     └─────────────┘
       │
       ▼
┌─────────────┐     ┌─────────────┐
│   Movement  │     │   Combat    │
│    WASD     │     │   (Space)   │
└─────────────┘     └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
        ┌─────────┐   ┌─────────┐   ┌─────────┐
        │  Skills │   │   HUD   │   │    XP   │
        │  (1-8)  │   │ Manager │   │  System │
        └─────────┘   └─────────┘   └─────────┘
```

---

**Documento atualizado para guiar desenvolvimento do MVP Core**  
**Status:** 🚧 Pronto para implementação  
**Versão:** 2.0 (Expandido)
