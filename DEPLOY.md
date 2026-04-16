# DEPLOY.md
# Guia de Deploy para Teste Externo - Eldoria MMORPG MVP
# Data: Março 2026

## 🎯 Objetivo

Este guia permite subir o servidor MMORPG em um ambiente acessível externamente para testes com 1-3 pessoas reais.

---

## ☁️ Opção 1: Deploy Gratuito (Recomendado)

### Railway.app (Gratuito)

**Vantagens:**
- 500 horas/mês gratuitas
- Deploy automático via GitHub
- URL pública automática
- Não precisa de cartão de crédito

**Passos:**

1. **Criar conta:**
   ```
   https://railway.app
   ```

2. **Criar projeto:**
   - New Project → Deploy from GitHub repo
   - Ou: Empty Project

3. **Configurar variáveis:**
   ```env
   PORT=3000
   NODE_ENV=production
   ```

4. **Deploy:**
   - Railway fornece URL automática: `https://seu-projeto.up.railway.app`
   - Compartilhar esta URL com testers

---

## 🖥️ Opção 2: Deploy em VPS (Digital Ocean, Linode, etc)

### Requisitos Mínimos:
- 1 vCPU
- 1 GB RAM
- 10 GB SSD
- Ubuntu 20.04+

### Instalação:

```bash
# 1. Conectar ao servidor
ssh root@seu-ip

# 2. Atualizar sistema
apt update && apt upgrade -y

# 3. Instalar Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt-get install -y nodejs

# 4. Instalar Git
apt install git -y

# 5. Clonar repositório (ou fazer upload via SCP)
git clone https://github.com/seu-user/mmorpg.git /opt/mmorpg
cd /opt/mmorpg

# 6. Instalar dependências
npm install

# 7. Criar diretório de dados
mkdir -p server/data/players

# 8. Testar
node server/server.js
```

### Configurar como Serviço (Systemd):

```bash
# Criar arquivo de serviço
cat > /etc/systemd/system/mmorpg.service << 'EOF'
[Unit]
Description=Eldoria MMORPG Server
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/mmorpg
ExecStart=/usr/bin/node server/server.js
Restart=on-failure
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
EOF

# Ativar serviço
systemctl daemon-reload
systemctl enable mmorpg
systemctl start mmorpg

# Verificar status
systemctl status mmorpg
```

### Firewall:

```bash
# Permitir porta 3000
ufw allow 3000/tcp
ufw allow 22/tcp
ufw enable
```

---

## 🏠 Opção 3: Port Forwarding (Teste Local Externo)

Se quiser testar de casa com amigos sem pagar servidor:

### Requisitos:
- IP externo fixo (ou usar no-ip/ddns)
- Acesso ao roteador

### Configuração:

1. **Descobrir IP externo:**
   ```
   https://whatismyipaddress.com
   ```

2. **Configurar Port Forwarding no roteador:**
   - Acessar roteador (geralmente 192.168.1.1)
   - Port Forwarding → Novo
   - Port: 3000
   - IP Interno: IP do seu PC (ex: 192.168.1.100)
   - Protocol: TCP

3. **Liberar Firewall do Windows:**
   ```powershell
   # PowerShell como Admin
   New-NetFirewallRule -DisplayName "MMORPG Server" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow
   ```

4. **Iniciar servidor:**
   ```bash
   node server/server.js
   ```

5. **Compartilhar IP:**
   ```
   http://SEU-IP-EXTERNO:3000
   ```

**Nota:** IP externo muda quando reinicia modem (a menos que tenha IP fixo).

---

## 🔧 Configurações de Produção

### 1. Atualizar CORS no servidor:

```javascript
// server/server.js - adicionar na config do Socket.IO
const io = socketIo(server, {
  cors: {
    origin: "*", // Em produção, especificar domínio
    methods: ["GET", "POST"]
  }
});
```

### 2. Configurar Rate Limiting (anti-spam):

```bash
npm install express-rate-limit
```

```javascript
// Adicionar no server.js
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100 // limite por IP
});

app.use(limiter);
```

### 3. Logs de Produção:

```javascript
// Instalar winston para logs
npm install winston

// Configurar logs estruturados
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

---

## 📋 Checklist Pré-Deploy

### Antes de subir:

- [ ] Testar localmente com 2 abas
- [ ] Verificar se todos os managers estão carregados
- [ ] Confirmar que persistência JSON funciona
- [ ] Testar fluxo completo: login → criar char → jogar
- [ ] Verificar se porta 3000 está disponível
- [ ] Confirmar que Node.js >= 16 instalado

### Arquivos necessários:

```
server/
  ├── server.js          ✅
  ├── PlayerDataManager.js ✅
  ├── TestWorld.js       ✅
  └── data/              (será criado automaticamente)
      └── players/

client/
  ├── index.html         ✅
  ├── managers/
  │   ├── PlayerManager.js ✅
  │   ├── UIManager.js   ✅
  │   ├── MobManager.js  ✅
  │   ├── LootManager.js ✅
  │   └── EquipmentManager.js ✅
  └── ui/
      └── CharacterPanel.js ✅
```

---

## 🧪 Roteiro de Teste Externo

### Preparação:
1. Subir servidor usando uma das opções acima
2. Obter URL pública
3. Criar 1-3 contas de teste

### Convite para Testers:

```
🎮 TESTE MMORPG BROWSER 🎮

Link: http://SEU-LINK-AQUI

O que testar:
1. Criar conta
2. Criar personagem
3. Andar no mapa (WASD)
4. Achar e matar slimes (ESPAÇO)
5. Coletar loot
6. Ver se XP sobe

Reportar:
- Travamentos
- Bugs visuais
- Problemas de conexão
- Erros no console (F12)

Tempo estimado: 10 minutos
```

### Coletar Feedback:

Criar formulário simples (Google Forms):

```
1. Conseguiu criar conta? [ ] Sim [ ] Não
2. Conseguiu entrar no mundo? [ ] Sim [ ] Não
3. Movimentação funcionou? [ ] Sim [ ] Não
4. Conseguiu matar um mob? [ ] Sim [ ] Não
5. XP subiu corretamente? [ ] Sim [ ] Não
6. Inventário funcionou? [ ] Sim [ ] Não
7. Notou algum bug? (descrever)
8. FPS ficou estável? [ ] Sim [ ] Não [ ] Trava
9. Recomendaria jogar? [1-5 estrelas]
```

---

## 📊 Monitoramento

### Verificar logs em tempo real:

```bash
# SSH no servidor
tail -f /var/log/syslog | grep mmorpg

# Ou se usando systemd
journalctl -u mmorpg -f
```

### Métricas importantes:

```javascript
// Adicionar endpoint de health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    players: players.size,
    mobs: mobs.size,
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});
```

Acessar: `http://seu-link/health`

---

## 🚨 Troubleshooting Deploy

### "Não conecta":
- Verificar se porta 3000 está aberta no firewall
- Verificar se servidor está rodando: `netstat -tlnp | grep 3000`
- Testar localmente primeiro: `curl http://localhost:3000/health`

### "CORS error":
- Adicionar `cors: { origin: "*" }` no socket.io
- Ou especificar domínio exato

### "Arquivos não carregam":
- Verificar se `express.static` está configurado
- Confirmar que pasta `client` existe
- Checar permissões: `chmod -R 755 client/`

### "Dados não persistem":
- Verificar se pasta `server/data` existe e tem permissão de escrita
- Testar: `touch server/data/test.txt`
- Ver logs do servidor para erros de file system

---

## 💰 Custo Estimado

| Opção | Custo/Mês | Ideal para |
|-------|-----------|------------|
| Railway (grátis) | $0 | Testes < 500h/mês |
| Railway (hobby) | $5 | Testes contínuos |
| Digital Ocean | $5-10 | Produção pequena |
| AWS/GCP | $10-20 | Escalar depois |
| Casa (port forwarding) | $0 | Testes rápidos com amigos |

---

## ✅ Declaração de Deploy

**Data do Deploy:** ___/___/______

**URL Pública:** _______________

**Método:** ⬜ Railway ⬜ VPS ⬜ Port Forwarding

**Testers Convidados:**
1. _____________
2. _____________
3. _____________

**Resultado:** ⬜ Sucesso ⬜ Problemas (descrever)

**Próximos Passos:**
- [ ] Coletar feedback
- [ ] Corrigir bugs críticos
- [ ] Decidir: expandir ou refinar MVP?

---

## 📞 Suporte

Se precisar de ajuda:
1. Verificar logs: `journalctl -u mmorpg -n 100`
2. Testar localmente primeiro
3. Verificar README.md do projeto

---

*Guia v1.0 - Deploy MVP Eldoria MMORPG*
