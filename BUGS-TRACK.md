# BUGS-TRACK.md
# Rastreamento de Bugs - MMORPG Browser MVP
# Criado em: Março 2026
# Status: Em andamento (Passo 1 do MVP Roadmap)

## Como Usar
- Novos bugs: Adicionar na seção "Não Resolvidos"
- Bugs corrigidos: Mover para "Resolvidos" com data e commit
- Prioridade: [CRÍTICO] [ALTO] [MÉDIO] [BAIXO]
- Status: [NOVO] [EM ANÁLISE] [EM CORREÇÃO] [TESTANDO] [RESOLVIDO]

---

## 🐛 NÃO RESOLVIDOS

### CRÍTICOS (Travam o jogo/impedem progresso)

| ID | Descrição | Fluxo Afetado | Status | Data Report |
|----|-----------|---------------|--------|-------------|
| -  | Nenhum bug crítico reportado | - | - | - |

### ALTOS (Impactam gameplay significativamente)

| ID | Descrição | Fluxo Afetado | Status | Data Report |
|----|-----------|---------------|--------|-------------|
| -  | Nenhum bug alto reportado | - | - | - |

### MÉDIOS (Inconvenientes mas não bloqueantes)

| ID | Descrição | Fluxo Afetado | Status | Data Report |
|----|-----------|---------------|--------|-------------|
| -  | Nenhum bug médio reportado | - | - | - |

### BAIXOS (Cosméticos/pequenas melhorias)

| ID | Descrição | Fluxo Afetado | Status | Data Report |
|----|-----------|---------------|--------|-------------|
| -  | Nenhum bug baixo reportado | - | - | - |

---

## ✅ RESOLVIDOS

| ID | Descrição | Fluxo Afetado | Data Resolução | Commit/Fix |
|----|-----------|---------------|----------------|------------|
| -  | Template exemplo | - | - | - |

---

## 📝 Notas de Teste

### Teste Manual - Fluxo Completo Solo

#### Login → Personagem → Mundo
- [ ] Login funciona sem erros
- [ ] Criação de conta persiste (localStorage)
- [ ] Seleção de personagem carrega classes corretamente
- [ ] Entrada no mundo sincroniza dados do jogador
- [ ] Transição de telas é suave (sem flickering)

#### Movimento e Combate
- [ ] WASD move o personagem suavemente
- [ ] Ataque com Espaço funciona e respeita cooldown
- [ ] Habilidades 1-3 funcionam corretamente
- [ ] Mobs aparecem no mapa e se movem
- [ ] Dano é calculado corretamente

#### XP e Progressão
- [ ] XP sobe ao matar mobs
- [ ] Barra de XP atualiza visualmente
- [ ] Level up ocorre ao atingir XP necessário
- [ ] Stats aumentam com level up

#### Loot e Inventário
- [ ] Loot aparece no chão ao matar mob
- [ ] Coleta automática funciona (ou tecla E)
- [ ] Item aparece no inventário
- [ ] Inventário persiste durante sessão

#### Equipamento
- [ ] Equipar item atualiza stats
- [ ] HUD reflete mudanças de stats
- [ ] Desequipar funciona corretamente

---

## 🔍 Checklist de Verificação Técnica

### Cliente
- [ ] Sem erros no console do navegador (F12)
- [ ] WebSocket conecta sem falhas
- [ ] Canvas renderiza a 60 FPS
- [ ] Memory leaks não detectados

### Servidor
- [ ] Sem erros no console Node.js
- [ ] Mobs são spawned corretamente
- [ ] Loot é sincronizado com clientes
- [ ] Disconnect limpa recursos corretamente

---

## 🎯 Próximas Verificações

### Passo 2: Refatoração
- Verificar se GameplayEngine.js > 1000 linhas
- Identificar funções que podem ser extraídas
- Documentar dependências entre módulos

### Passo 3: Persistência
- Testar salvamento JSON
- Testar carregamento de personagem existente
- Verificar integridade dos dados salvos

---

*Última atualização: Em andamento*
