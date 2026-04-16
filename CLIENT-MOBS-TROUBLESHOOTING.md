# Client Mobs Troubleshooting Guide

## 🚨 Problema: Mobs Não Aparecem no Cliente

### ✅ **O Que Está Funcionando:**

#### **Servidor**: ✅
- **Status**: Online e respondendo (HTTP 200)
- **Mobs Spawnados**: 4 mobs ativos no servidor
- **WebSocket**: Conexões estabelecidas
- **Eventos**: mobSpawn sendo emitidos

#### **Cliente**: ✅  
- **Servidor**: Acessível em http://localhost:3000
- **Login**: Funcionando
- **HUD**: Oculto no login, visível no gameplay
- **Personagem**: Movimentando no mapa

### 🔍 **Diagnóstico do Problema:**

O problema está na **comunicação entre servidor e cliente** para eventos de mobs.

### 🛠️ **Soluções Possíveis:**

#### **1. Verificar Console do Navegador**
1. Abra o jogo: http://localhost:3000
2. Pressione **F12** para abrir o console
3. Faça login e entre no mundo
4. Procure por **erros de JavaScript**
5. Procure por **mensagens de WebSocket**

#### **2. Verificar Eventos de Mobs**
No console, procure por:
- `mobSpawn` - Deve aparecer quando mobs spawnam
- `mobUpdate` - Deve aparecer quando mobs se movem
- `currentMobs` - Deve aparecer na conexão

#### **3. Verificar Código do Cliente**
Verifique se o cliente está ouvindo os eventos:

```javascript
// No IntegratedGameplayEngine.js ou similar
socket.on('mobSpawn', (mob) => {
    console.log('Mob spawned:', mob);
    // Renderizar mob no mapa
});

socket.on('mobUpdate', (mob) => {
    console.log('Mob updated:', mob);
    // Atualizar posição do mob
});

socket.on('currentMobs', (mobs) => {
    console.log('Current mobs:', mobs);
    // Renderizar todos os mobs
});
```

#### **4. Limpar Cache do Navegador**
1. Pressione **Ctrl+F5** para recarregar
2. Pressione **Ctrl+Shift+R** para hard reload
3. Limpe cache: **F12 → Application → Storage → Clear**

#### **5. Testar em Outro Navegador**
- **Chrome**: Abrir em janela anônima
- **Firefox**: Abrir em janela privada
- **Edge**: Testar como alternativa

### 🎯 **Passos para Debug:**

#### **Passo 1: Verificar Conexão WebSocket**
```javascript
// No console do navegador
console.log('Socket status:', socket.readyState);
console.log('Socket connected:', socket.connected);
```

#### **Passo 2: Forçar Eventos**
```javascript
// No console do navegador
socket.emit('requestMobs', {});
```

#### **Passo 3: Verificar Renderização**
```javascript
// Verificar se mobs estão sendo renderizados
console.log('Mobs in game:', window.mobs || window.gameMobs);
```

### 📋 **Checklist Completa:**

- [ ] Servidor online (✅)
- [ ] Mobs spawnando no servidor (✅)
- [ ] Cliente conectado via WebSocket (?)
- [ ] Evento mobSpawn recebido (?)
- [ ] Evento mobUpdate recebido (?)
- [ ] Mobs renderizados no mapa (?)
- [ ] Sem erros no console (?)

### 🚀 **Solução Provável:**

O problema mais provável é que o **cliente não está implementando os handlers** para eventos de mobs.

**Arquivos para verificar:**
- `client/IntegratedGameplayEngine.js`
- `client/game/engine/GameEngine.js`
- `client/entities/Mob.js`

**Handlers necessários:**
```javascript
socket.on('mobSpawn', (mob) => { /* renderizar mob */ });
socket.on('mobUpdate', (mob) => { /* atualizar mob */ });
socket.on('mobRemove', (mobId) => { /* remover mob */ });
socket.on('currentMobs', (mobs) => { /* renderizar todos */ });
```

### 📞 **Se Nada Funcionar:**

1. **Reinicie o servidor completamente**:
   ```bash
   taskkill /f /im node.exe
   node server/server-simple.js
   ```

2. **Use o servidor simples** que já está funcionando

3. **Verifique o código-fonte do cliente** para implementar os handlers

---
*Status: Aguardando feedback do cliente*
