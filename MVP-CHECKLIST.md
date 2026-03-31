# MVP-CHECKLIST.md
# Checklist de Validação - Eldoria MMORPG MVP
# Data: Março 2026

## ✅ CRITÉRIOS DE ACEITAÇÃO DO MVP

Este documento define os critérios mínimos para declarar o MVP "fechado" e pronto para jogar.

---

## 📋 CHECKLIST PRINCIPAL

### 1. Autenticação e Contas

- [x] **Login com conta funciona**
  - Jogador pode criar conta com username único
  - Sistema aceita login com credenciais válidas
  - Rejeita senhas inválidas
  - Session funciona via socket.id

- [x] **Criação de personagem funciona**
  - Escolha de nome único
  - Seleção de classe (warrior, mage, archer, rogue)
  - Dados iniciais aplicados corretamente (stats por classe)
  - Spawn em posição inicial válida

### 2. Entrada no Mundo

- [x] **Entrada no mundo funciona**
  - `world:init` carrega todos os dados necessários
  - Jogador aparece no mapa correto (testing_zone)
  - Posição de spawn não colide com outros players/mobs
  - Dados salvos são carregados do JSON

- [x] **Dados persistem entre sessões**
  - Level, XP, inventário, equipamento salvos
  - Posição no mundo salva
  - Reiniciar servidor não perde progresso

### 3. Multiplayer

- [x] **Jogador A vê jogador B no mundo**
  - RemotePlayers aparecem no canvas
  - Movimentos sincronizados em tempo real
  - Nomes e levels visíveis acima dos personagens
  - Lista de jogadores online no painel

- [x] **Conexão estável**
  - Reconexão automática funciona
  - Cleanup de jogadores desconectados
  - Sem "zombie players" no mapa

### 4. Combate e Progressão

- [x] **Jogador mata mob → ganha XP**
  - Sistema de ataque funciona (tecla Espaço)
  - Dano calculado server-side
  - Mob morre quando HP <= 0
  - XP ganho aparece na tela
  - Barra de XP atualiza

- [x] **Jogador mata mob → ganha loot**
  - Drops aparecem no chão
  - Loot é coletável (aproximação)
  - Inventário atualiza
  - Mensagens de confirmação

- [x] **Level up funciona**
  - XP acumula corretamente
  - Level up ocorre ao atingir threshold
  - Stats aumentam no level up
  - Full heal no level up
  - Notificação visual de level up

### 5. Inventário e Equipamento

- [x] **Jogador coleta loot**
  - Auto-collect ao aproximar
  - Item aparece no inventário
  - Quantidade acumula se stackable

- [x] **Jogador equipa item → stats mudam**
  - Sistema de 3 slots: weapon, armor, accessory
  - Equipar atualiza stats em tempo real
  - Desequipar retorna ao inventário
  - Bônus de equipamento calculados corretamente

- [x] **Inventário simplificado funciona**
  - Máximo 15 itens diferentes
  - Slots visuais funcionam
  - Botões equipar/desequipar respondem

### 6. Mapa de Teste

- [x] **Mapa 1024x1024 funcional**
  - Boundaries funcionam (não dá para sair)
  - Zona segura para spawn inicial
  - 15 slimes spawnados corretamente
  - Respawn funciona após morte

### 7. Testes com 2+ Jogadores

- [ ] **Teste manual realizado**
  - 2 abas do navegador logadas simultaneamente
  - Ambos veem o mesmo mundo
  - Movimentos sincronizados
  - Combate funciona para ambos
  - Loot/XP funcionam individualmente

---

## 🎯 MÉTRICAS DE SUCESSO

| Métrica | Mínimo Aceitável | Status |
|---------|------------------|--------|
| Tempo de login → gameplay | < 2 minutos | ⏳ Testar |
| FPS com 1 jogador | > 50 FPS | ⏳ Testar |
| FPS com 2 jogadores | > 40 FPS | ⏳ Testar |
| Latência de movimento | < 200ms | ⏳ Testar |
| Tempo de respawn de mobs | 5-10 segundos | ✅ 5s |
| Limite de mobs no mapa | 15-20 | ✅ 15 |

---

## 🚫 FORA DO ESCOPO (NÃO INCLUÍDO)

Confirmar que NÃO estamos tentando implementar:

- [ ] Múltiplos mapas/zonas
- [ ] Sistema de guildas
- [ ] Party system
- [ ] Chat privado/whisper
- [ ] Trade entre players
- [ ] Crafting complexo
- [ ] Bosses ou dungeons
- [ ] PvP
- [ ] Sistema de amizades
- [ ] Loja/mercado
- [ ] Quests complexas
- [ ] Talentos/habilidades

---

## 📁 ARQUIVOS ENTREGÁVEIS

### Cliente
- [x] `client/index.html` - Interface principal
- [x] `client/managers/PlayerManager.js` - Gerenciamento de jogador
- [x] `client/managers/UIManager.js` - Interface unificada
- [x] `client/managers/MobManager.js` - Gerenciamento de mobs
- [x] `client/managers/LootManager.js` - Gerenciamento de loot
- [x] `client/managers/EquipmentManager.js` - Sistema de equipamento
- [x] `client/modes/offline/GameplayEngine.js` - Engine principal

### Servidor
- [x] `server/server.js` - Servidor principal
- [x] `server/PlayerDataManager.js` - Persistência JSON
- [x] `server/TestWorld.js` - Mapa de teste
- [x] `server/systems/MobSystem.js` - Sistema de mobs

### Documentação
- [x] `MVP-FLOW.md` - Fluxo do jogador
- [x] `MVP-CHECKLIST.md` - Este arquivo
- [x] `BUGS-TRACK.md` - Rastreamento de bugs

---

## 🧪 ROTEIRO DE TESTE FINAL

### Preparação
1. Iniciar servidor: `node server/server.js`
2. Abrir 2 abas anônimas do Chrome
3. Acessar `http://localhost:3000` em ambas

### Teste 1: Login e Criação
- [ ] Criar conta "player1"
- [ ] Criar personagem "Hero1" (Warrior)
- [ ] Verificar entrada no mundo
- [ ] Verificar posição inicial (zona segura)

### Teste 2: Segundo Jogador
- [ ] Na aba 2, criar conta "player2"
- [ ] Criar personagem "Hero2" (Mage)
- [ ] Verificar se ambos aparecem online
- [ ] Verificar lista de jogadores online

### Teste 3: Movimento Sincronizado
- [ ] Mover Hero1 → Hero2 deve ver movimento
- [ ] Mover Hero2 → Hero1 deve ver movimento
- [ ] Verificar que posições estão corretas

### Teste 4: Combate
- [ ] Hero1 encontra um Slime
- [ ] Hero1 ataca e mata o Slime
- [ ] Verificar:
  - [ ] Slime desaparece para ambos
  - [ ] Hero1 ganha XP
  - [ ] Hero1 ganha loot
  - [ ] Loot aparece no chão

### Teste 5: Loot e Inventário
- [ ] Hero1 coleta loot
- [ ] Verificar inventário atualizado
- [ ] Equipar item (se houver)
- [ ] Verificar stats atualizados

### Teste 6: Level Up
- [ ] Matar mobs até level up
- [ ] Verificar notificação de level up
- [ ] Verificar stats aumentados
- [ ] Verificar full heal

### Teste 7: Persistência
- [ ] Hero1 faz logout (F5)
- [ ] Hero1 loga novamente
- [ ] Verificar:
  - [ ] Level persistiu
  - [ ] XP persistiu
  - [ ] Inventário persistiu
  - [ ] Equipamento persistiu
  - [ ] Posição persistiu

### Teste 8: Estresse
- [ ] Ambos jogadores matando mobs por 5 minutos
- [ ] Verificar FPS permanece > 40
- [ ] Verificar sem memory leaks
- [ ] Verificar sem erros no console

---

## ✅ DECLARAÇÃO DE MVP FECHADO

**Data de Conclusão:** ___/___/______

**Testado por:** _______________

**Resultado:** ⬜ APROVADO / ⬜ REPROVADO

**Observações:**
```
[Escrever observações sobre bugs encontrados, performance, etc.]
```

**Próximos Passos Pós-MVP:**
1. Adicionar mais tipos de mobs
2. Implementar sistema de quests básico
3. Adicionar crafting simples
4. Expandir mapa
5. Adicionar talentos
6. Implementar guildas

---

## 📊 RESUMO DO ESCOPO

| Funcionalidade | Status |
|----------------|--------|
| Login/Criação de Conta | ✅ Completo |
| Criação de Personagem | ✅ Completo |
| Persistência JSON | ✅ Completo |
| Movimento WASD | ✅ Completo |
| Multiplayer Básico | ✅ Completo |
| Combate Simples | ✅ Completo |
| Sistema de XP/Level | ✅ Completo |
| Loot Drops | ✅ Completo |
| Inventário (15 slots) | ✅ Completo |
| Equipamento (3 slots) | ✅ Completo |
| Mapa de Teste 1024x1024 | ✅ Completo |
| 15 Slimes com IA | ✅ Completo |
| Respawn de Mobs | ✅ Completo |
| Painel de Jogadores Online | ✅ Completo |

**Total:** 14/14 funcionalidades MVP implementadas

---

*Documento v1.0 - MVP Eldoria MMORPG*
*Status: ✅ Pronto para Testes Finais*
