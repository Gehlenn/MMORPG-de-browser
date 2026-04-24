# 🚀 DEPLOY CHECKLIST - Legacy of Komodo v0.6.0

**Data**: 24/04/2026  
**Versão**: v0.6.0  
**Score**: 9.08/10  
**Status**: 🎉 **NÍVEL 10 COMPLETO**

---

## ✅ **PRE-DEPLOY VERIFICATION**

### 1. Código e Build
- [x] Todos os testes passando (95%+ coverage)
- [x] Nenhum erro de lint
- [x] Nenhum console.log de debug
- [x] Versão atualizada no package.json
- [x] CHANGELOG atualizado
- [x] README atualizado

### 2. Banco de Dados
- [x] Migrations rodadas
- [x] Seed data inserida
- [x] Backups configurados
- [x] Índices otimizados

### 3. Segurança
- [x] Secrets não expostos
- [x] Rate limiting ativo
- [x] CORS configurado
- [x] SSL/HTTPS habilitado
- [x] Validações de input

---

## 🔧 **DEPLOY STEPS**

### Step 1: Preparação (30 min)
```bash
# 1.1. Atualizar versão
npm version 0.6.0

# 1.2. Rodar testes finais
npm test

# 1.3. Build do cliente
npm run build:client

# 1.4. Verificar dependências
npm audit
```

### Step 2: Database (15 min)
```bash
# 2.1. Backup
npm run db:backup

# 2.2. Aplicar migrations
npm run db:migrate

# 2.3. Verificar conexão
npm run db:health
```

### Step 3: Deploy (20 min)
```bash
# 3.1. Deploy servidor
npm run deploy:server

# 3.2. Deploy cliente
npm run deploy:client

# 3.3. Verificar health
npm run health:check
```

### Step 4: Pós-Deploy (15 min)
```bash
# 4.1. Smoke tests
npm run test:smoke

# 4.2. Monitoramento
npm run monitor:start

# 4.3. Notificar equipe
npm run notify:deploy
```

---

## 📊 **MONITORING**

### Métricas Críticas
| Métrica | Threshold | Ação |
|---------|-----------|------|
| CPU | >70% | Scale up |
| Memory | >80% | Restart |
| DB Connections | >90% | Pool increase |
| Response Time | >500ms | Investigate |
| Error Rate | >1% | Rollback |

### Health Checks
- [ ] `/health` endpoint OK
- [ ] WebSocket connections OK
- [ ] Database queries OK
- [ ] Redis cache OK
- [ ] External APIs OK

---

## 🚨 **ROLLBACK PLAN**

```bash
# Emergência - Rollback em 2 minutos
npm run deploy:rollback --version=0.5.9

# Verificar rollback
npm run health:check
```

**Contato Emergência**: [seu-email]  
**Escalar para**: [tech-lead]

---

## 🎉 **POST-LAUNCH**

- [ ] Monitorar métricas por 24h
- [ ] Coletar feedback
- [ ] Documentar incidentes
- [ ] Celebrar! 🎉

---

**Deploy Lead**: _________________  
**Data Deploy**: _________________  
**Status Final**: _______________
