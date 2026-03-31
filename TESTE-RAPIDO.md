# TESTE-RAPIDO.md
# Guia de Teste Rápido - Eldoria MMORPG MVP

## 🚀 Iniciar o Servidor

```bash
cd "e:\app e jogos criados\MMORPG de browser"
node server/server.js
```

**Aguardar mensagem:**
```
🎮 MMORPG Server running on port 3000
📊 Dashboard: http://localhost:3000
🕹️ Game: http://localhost:3000/index.html
```

---

## 🧪 Teste em 2 Passos

### Passo 1: Primeiro Jogador

1. Abrir navegador em **http://localhost:3000**
2. Criar conta:
   - Username: `player1`
   - Password: `senha123`
3. Criar personagem:
   - Nome: `Hero1`
   - Classe: **Warrior**
4. Verificar:
   - [ ] Apareceu no mapa (zona segura)
   - [ ] HUD mostra HP, XP, Level
   - [ ] Consegue andar com WASD

### Passo 2: Segundo Jogador

1. Abrir **nova aba anônima** (Ctrl+Shift+N)
2. Acessar **http://localhost:3000**
3. Criar conta:
   - Username: `player2`
   - Password: `senha123`
4. Criar personagem:
   - Nome: `Hero2`
   - Classe: **Mage**

---

## ✅ Checklist de Validação

### Multiplayer
- [ ] **Ambos jogadores aparecem online**
  - Painel "👥 Online: 2" visível
  - Nomes acima dos personagens

- [ ] **Movimento sincronizado**
  - Mover Hero1 → Hero2 vê movimento
  - Mover Hero2 → Hero1 vê movimento

### Combate
- [ ] **Hero1 encontra Slime**
- [ ] **Apertar ESPAÇO para atacar**
- [ ] **Slime morre**
  - Desaparece para ambos os jogadores
  - Hero1 ganha XP (+20)
  - Loot aparece no chão

### Progressão
- [ ] **XP acumula na barra**
- [ ] **Matando 5 slimes = Level Up**
  - Notificação "LEVEL UP!"
  - HP máximo aumenta
  - Stats aumentam

### Loot e Inventário
- [ ] **Aproximar do loot para coletar**
- [ ] **Inventário atualiza (I para abrir)**
- [ ] **Equipar item (se tiver weapon/armor)**
- [ ] **Stats mudam após equipar**

### Persistência
- [ ] **Hero1 faz F5 (refresh)**
- [ ] **Loga novamente**
- [ ] **Level, XP, Inventário persistiram**

---

## ⌨️ Controles

| Tecla | Ação |
|-------|------|
| `W A S D` | Movimento |
| `Shift` | Correr (segurar) |
| `Espaço` | Atacar |
| `I` | Inventário |
| `C` | Stats/Character |
| `Enter` | Chat |

---

## 🐛 Troubleshooting

### "Não consigo criar conta"
- Verificar se servidor está rodando
- Ver console do navegador (F12)

### "Não vejo o outro jogador"
- Verificar se ambos estão em http://localhost:3000
- Checar painel "👥 Online"
- Ver console do servidor

### "Mobs não aparecem"
- Verificar mensagens no console do servidor
- Recarregar página (F5)

### "Erro de connection"
- Verificar se porta 3000 está livre
- Reiniciar servidor

---

## 📊 Critérios de Sucesso

✅ **MVP FUNCIONA SE:**
- 2 jogadores se veem no mapa
- Combate funciona para ambos
- XP/Loot funcionam
- Persistência funciona após F5

---

*Teste criado em: Março 2026*
*Versão MVP 1.0*
