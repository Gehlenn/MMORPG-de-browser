# MVP-1.0-SCOPE.md
# Escopo do MVP 1.0 - Eldoria MMORPG
# Criado em: Março 2026
# Status: Em desenvolvimento

## 🎯 Visão do MVP 1.0

O MVP 1.0 tem como objetivo entregar uma experiência de jogo MMORPG browser **estável e jogável** para múltiplos jogadores, com foco em:
- **Login e criação de contas** funcionando sem falhas
- **Gameplay básico** fluido (movimento, combate, loot)
- **Multiplayer leve** sem travamentos
- **Persistência de dados** entre sessões

---

## ✅ INCLUSO NO MVP 1.0

### 1. Sistema de Conta e Autenticação
- [x] Criação de contas com localStorage
- [x] Login com validação de credenciais
- [x] Persistência de sessão
- [x] Seleção de personagem (4 classes: Guerreiro, Mago, Arqueiro, Ladino)

### 2. Criação e Persistência de Personagem
- [x] Criação de personagem com nome, classe e stats base
- [x] **Persistência JSON no servidor** (Passo 3) - player-{id}.json
- [x] Carregamento de personagem ao logar
- [x] Salvamento automático de progresso (XP, level, inventário, equipamento)

### 3. Mundo e Gameplay Básico
- [x] Movimento WASD fluido
- [x] Câmera seguindo o jogador
- [x] Mapa com obstáculos e bordas
- [x] Sistema de ataque com cooldown
- [x] Habilidades numéricas (1-3)

### 4. Sistema de Mobs
- [x] Spawn de mobs (Slime, Goblin, Lobo, Orc)
- [x] **Limite máximo de mobs** (20-30 por mapa) - Passo 4
- [x] **Respawn controlado** com delay após morte
- [x] AI básica (movimento em direção ao jogador)
- [x] Mobs sync entre todos os jogadores

### 5. Sistema de Loot e Inventário
- [x] Drops ao matar mobs (gold, potions, itens básicos)
- [x] Coleta automática de loot próximo
- [x] Inventário persistente
- [x] **Shared loot** (múltiplos jogadores podem receber XP/loot) - Passo 5

### 6. Equipamento e Stats
- [x] Slots de equipamento: arma, armadura, capacete, escudo, acessório, botas
- [x] Cálculo de bônus de stats baseado no equipamento
- [x] Equipar/desequipar itens
- [x] Sincronização de equipamento entre cliente-servidor

### 7. Progressão (XP/Level)
- [x] Ganho de XP ao matar mobs
- [x] Level up com aumento de stats
- [x] Fórmula de XP: 50 * level^2
- [x] Barra de XP visual no HUD

### 8. Sistema de Quests Básico
- [x] Quests do tipo "mate X mobs de tipo Y"
- [x] NPC quest giver estático
- [x] Progresso de quest em tempo real
- [x] Recompensas de XP e loot ao completar

### 9. Multiplayer e Networking
- [x] Visualização de outros jogadores no mapa
- [x] Nomes acima dos jogadores
- [x] **Shared XP/loot** para grupo próximo - Passo 5
- [x] **Culling por distância** para performance - Passo 6
- [x] **Cleanup de zombie players** no disconnect - Passo 8

### 10. Interface (HUD)
- [x] Barra de vida e mana
- [x] Barra de XP
- [x] Painel de inventário
- [x] Painel de equipamento
- [x] Painel de stats
- [x] Painel de quests
- [x] Minimapa
- [x] Chat básico
- [x] Indicador de FPS

---

## ❌ NÃO INCLUSO NO MVP 1.0 (Futuro MVP 2.0+)

### Não Incluso - Sistemas Avançados
- [ ] Talentos (BLOCO 13 já implementado, mas fora do escopo MVP 1.0)
- [ ] Crafting complexo
- [ ] Profissões avançadas (mining, blacksmith, etc.)
- [ ] Guildas
- [ ] Housing
- [ ] Sistema de amizades
- [ ] Chat privado / whisper
- [ ] Emotes

### Não Incluso - Conteúdo
- [ ] Bosses complexos com fases
- [ ] Dungeons/instâncias
- [ ] Zonas múltiplas (apenas uma zona inicial)
- [ ] Mapa grande/mundo aberto (apenas 2400x1600)
- [ ] Eventos dinâmicos do mundo

### Não Incluso - Técnico
- [ ] Banco de dados SQL (usando JSON files)
- [ ] Servidor dedicado/cluster
- [ ] Anti-cheat avançado
- [ ] Sistema de rollback

---

## 📊 Métricas de Sucesso do MVP 1.0

### Performance
- [ ] 60 FPS estável com 10 jogadores no mapa
- [ ] 30+ FPS com 20 jogadores no mapa
- [ ] Tempo de resposta do servidor < 100ms
- [ ] Nenhum memory leak detectado em 1 hora de gameplay

### Estabilidade
- [ ] Zero crashes do servidor em 24h
- [ ] 99% uptime do servidor
- [ ] Reconexão automática funciona 100%
- [ ] Dados do jogador nunca corrompidos/perdidos

### Usabilidade
- [ ] Novo jogador consegue jogar em < 2 minutos (login → gameplay)
- [ ] Tutorial não necessário para jogar
- [ ] Interface intuitiva (teste com usuário novato)

---

## 🗓️ Cronograma Estimado

| Fase | Tempo Estimado | Status |
|------|----------------|--------|
| Passo 1-2: Fechar loop solo + Refatorar | 1 dia | ✅ Concluído |
| Passo 3: Persistência JSON | 4-6 horas | 🔄 Em andamento |
| Passo 4: Sistema de mobs | 4-6 horas | ⏳ Pendente |
| Passo 5: Shared XP/Loot | 4-6 horas | ⏳ Pendente |
| Passo 6: HUD multiplayer | 4-6 horas | ⏳ Pendente |
| Passo 7: Quests kill NPC | 4-6 horas | ⏳ Pendente |
| Passo 8: Conexão estável | 4-6 horas | ⏳ Pendente |
| Passo 9: Teste de estresse | 4-6 horas | ⏳ Pendente |
| Passo 10: Documentação | 2 horas | ⏳ Pendente |
| **Total Estimado** | **3-4 dias** | |

---

## 🚀 Próximos Passos Após MVP 1.0

1. **MVP 2.0**: Talentos, crafting básico, múltiplas zonas
2. **MVP 3.0**: Guildas, bosses, dungeons simples
3. **Beta**: Otimização, balanceamento, bug fixes
4. **Release**: Marketing, servidores dedicados

---

## 📝 Notas de Decisão

### Por que JSON files em vez de SQL?
- MVP precisa ser rápido de implementar
- JSON é suficiente para < 1000 jogadores
- Fácil de debugar e modificar
- Migração para SQL futura é simples

### Por que 20-30 mobs máximo?
- Balanceia entre "mundo vivo" e performance
- Evita spam de entidades
- Pode ser ajustado via config

### Por que shared loot simples?
- Não precisa de sistema complexo de grupo ainda
- Todos ganham XP se participaram do dano
- Loot é individual por jogador (menos conflito)

---

## 📁 Arquivos Relacionados

- `BUGS-TRACK.md` - Rastreamento de bugs
- `PERFORMANCE-REVIEW.md` - (será criado no Passo 9)
- `client/managers/` - MobManager, LootManager, EquipmentManager
- `server/data/players/` - Persistência JSON de personagens

---

*Última atualização: Em andamento - Passo 3*
*Responsável: Equipe de Desenvolvimento Eldoria*
