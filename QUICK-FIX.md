# Quick Fix - Gameplay Issues

## 🚨 Problemas Identificados:

1. **UI HUD aparece no login** - Canvas ainda visível
2. **Personagem não anda** - Sistema de movimento não funcionando
3. **Sem mobs no mapa** - Spawn não está funcionando

## 🔧 Solução Imediata:

### Passo 1: Forçar Spawn de Mobs
```bash
node scripts/force-spawn-mobs.js
```

### Passo 2: Verificar Movimentação
- Abra o console do navegador (F12)
- Procure por erros de JavaScript
- Verifique se os eventos de teclado estão funcionando

### Passo 3: Testar Manualmente
1. Acesse: http://localhost:3000
2. Login: teste / 123456
3. Entre no mundo
4. Pressione WASD para mover
5. Verifique se mobs aparecem

## 🎯 Commands para Teste:

```bash
# Reiniciar servidor completamente
taskkill /f /im node.exe
npm start

# Forçar spawn de mobs
node scripts/force-spawn-mobs.js

# Verificar status
curl -s http://localhost:3000
```

## 📋 Checklist:

- [ ] Servidor online
- [ ] Login funcionando
- [ ] Personagem aparece
- [ ] Movimentação WASD
- [ ] Mobs spawnando
- [ ] HUD oculto no login
- [ ] HUD visível no gameplay

## 🚀 Se nada funcionar:

1. **Verifique o console** do navegador
2. **Recarregue a página** (Ctrl+F5)
3. **Limpe o cache** do navegador
4. **Tente outro navegador** (Chrome/Firefox)

---
*Status: Em progresso*
