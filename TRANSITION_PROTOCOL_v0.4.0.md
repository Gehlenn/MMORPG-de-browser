# Protocolo de Transição v0.4.0 - Gehlenn MMORPG

## 🎯 Objetivo

Transição segura e controlada do ambiente local/desenvolvimento para produção na versão 0.4.0.

## 📋 Status Atual

- **Versão**: 0.3.7v → 0.4.0
- **Ambiente**: Local → Produção
- **Stack**: Free Tier (Supabase + Railway + Vercel)
- **Status**: 🔄 Em Execução

## 🚀 Fases do Protocolo

### Fase 1: Preparação ✅
- [x] Configurar ambiente de produção
- [x] Criar variáveis de ambiente
- [x] Setup Docker produção
- [x] Configurar monitoring
- [x] Documentar processo

### Fase 2: Backup e Validação 🔄
- [ ] Validar backup de dados local
- [ ] Testar integridade dos dados
- [ ] Exportar configurações
- [ ] Validar versão 0.4.0

### Fase 3: Migração de Infraestrutura ⏳
- [ ] Configurar Supabase
- [ ] Migrar database
- [ ] Configurar Redis Cloud
- [ ] Setup Railway backend
- [ ] Setup Vercel frontend

### Fase 4: Deploy Produção ⏳
- [ ] Deploy backend
- [ ] Deploy frontend
- [ ] Configurar DNS/SSL
- [ ] Testar endpoints

### Fase 5: Validação Final ⏳
- [ ] Health checks
- [ ] Testes de integração
- [ ] Performance validation
- [ ] Security validation

### Fase 6: Beta Pública ⏳
- [ ] Iniciar beta pública
- [ ] Monitorar métricas
- [ ] Coletar feedback
- [ ] Ajustes finais

## 📊 Checklist Técnico

### Database (Supabase)
- [ ] Criar projeto Supabase
- [ ] Configurar connection string
- [ ] Migrar schemas
- [ ] Importar dados
- [ ] Configurar backups automáticos
- [ ] Testar conexões

### Backend (Railway)
- [ ] Criar projeto Railway
- [ ] Configurar variáveis ambiente
- [ ] Deploy aplicação
- [ ] Configurar health checks
- [ ] Testar API endpoints
- [ ] Configurar auto-scaling

### Frontend (Vercel)
- [ ] Criar projeto Vercel
- [ ] Configurar build settings
- [ ] Deploy aplicação
- [ ] Configurar domínio
- [ ] Testar navegação
- [ ] Validar performance

### Cache (Redis Cloud)
- [ ] Criar cluster Redis
- [ ] Configurar conexão
- [ ] Testar cache operations
- [ ] Configurar TTL
- [ ] Monitorar usage

### Monitoring (Sentry)
- [ ] Criar projeto Sentry
- [ ] Configurar SDK
- [ ] Testar error tracking
- [ ] Configurar alerts
- [ ] Validar dashboards

## 🔧 Scripts de Transição

### 1. Backup Validation
```bash
node scripts/validate-backup.js
```

### 2. Database Migration
```bash
node scripts/migrate-database.js
```

### 3. Production Deployment
```bash
chmod +x scripts/deploy-production.sh
./scripts/deploy-production.sh
```

### 4. Health Validation
```bash
node scripts/validate-deployment.js
```

## 📈 Métricas de Sucesso

### Performance
- Backend response time < 200ms
- Frontend load time < 3s
- Database query time < 100ms
- Cache hit rate > 80%

### Availability
- Uptime > 99.5%
- Error rate < 1%
- Health checks passing
- Auto-scaling functional

### Security
- HTTPS enforced
- CORS configured
- Rate limiting active
- No exposed secrets

## 🚨 Rollback Plan

### Triggers
- Uptime < 95% por 1h
- Error rate > 5% por 30min
- Performance degradation > 50%
- Security breach detected

### Actions
1. **Immediate**: Switch to maintenance mode
2. **Database**: Restore from backup (Supabase)
3. **Backend**: Deploy previous version (Railway)
4. **Frontend**: Deploy previous version (Vercel)
5. **Cache**: Clear and restart (Redis)
6. **Monitor**: Investigate root cause

## 📝 Comandos Rápidos

### Status Check
```bash
# Verificar status de todos os serviços
curl -s https://backend.railway.app/health
curl -s https://frontend.vercel.app
redis-cli -u $REDIS_URL ping
```

### Logs
```bash
# Backend logs
railway logs

# Frontend logs
vercel logs

# Database status
supabase db status
```

### Emergency
```bash
# Emergency rollback
./scripts/emergency-rollback.sh

# Maintenance mode
node scripts/enable-maintenance.js
```

## 📞 Contingency

### Team Communication
- **Primary**: Discord channel
- **Backup**: Email thread
- **Emergency**: Phone call

### Service Status
- **Supabase**: https://status.supabase.com
- **Railway**: https://status.railway.app
- **Vercel**: https://www.vercel-status.com
- **Redis**: https://status.redis.com

## ⏰ Timeline Estimado

- **Fase 2**: 2-4 horas
- **Fase 3**: 4-6 horas
- **Fase 4**: 2-3 horas
- **Fase 5**: 1-2 horas
- **Fase 6**: Contínuo

**Total**: 9-15 horas para transição completa

## 🎯 Next Steps

1. **Executar Fase 2**: Backup e validação
2. **Iniciar Fase 3**: Migração infraestrutura
3. **Monitorar progresso**: Dashboard em tempo real
4. **Documentar aprendizados**: Post-mortem analysis

---

**Protocol Version**: v0.4.0  
**Execution Start**: 2026-03-19 10:18 UTC-03:00  
**Expected Completion**: 2026-03-19 23:00 UTC-03:00  
**Status**: 🔄 Em Execução
