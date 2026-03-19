#!/bin/bash

# Deploy Gratuito - MMORPG Bootstrap
# Version 1.0.0 - Zero Budget Deployment

echo "🚀 Iniciando Deploy Gratuito - MMORPG Bootstrap"

# Verificar se Docker está instalado
if ! command -v docker &> /dev/null; then
    echo "❌ Docker não encontrado. Instale Docker primeiro."
    exit 1
fi

# Verificar se Docker Compose está instalado
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose não encontrado. Instale Docker Compose primeiro."
    exit 1
fi

# Criar diretórios necessários
echo "📁 Criando diretórios..."
mkdir -p infrastructure/grafana/dashboards
mkdir -p infrastructure/grafana/datasources
mkdir -p logs
mkdir -p database
mkdir -p cache

# Criar configuração do Nginx
echo "🌐 Criando configuração Nginx..."
cat > infrastructure/nginx.conf << 'EOF'
events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
    
    # Cache estático
    location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    server {
        listen 80;
        server_name localhost;
        root /usr/share/nginx/html;
        index index.html;
        
        # SPA fallback
        location / {
            try_files $uri $uri/ /index.html;
        }
        
        # API proxy
        location /api/ {
            proxy_pass http://backend:8080;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
        
        # Socket.io proxy
        location /socket.io/ {
            proxy_pass http://backend:8080;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
EOF

# Criar configuração do Prometheus
echo "📊 Criando configuração Prometheus..."
cat > infrastructure/prometheus.yml << 'EOF'
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  # - "first_rules.yml"
  # - "second_rules.yml"

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']
      
  - job_name: 'eldoria-backend'
    static_configs:
      - targets: ['backend:8080']
    metrics_path: '/metrics'
    scrape_interval: 5s
EOF

# Criar datasource do Grafana
echo "📈 Criando datasource Grafana..."
cat > infrastructure/grafana/datasources/prometheus.yml << 'EOF'
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
    editable: true
EOF

# Criar dashboard do Grafana
echo "📊 Criando dashboard Grafana..."
cat > infrastructure/grafana/dashboards/eldoria-dashboard.json << 'EOF'
{
  "dashboard": {
    "id": null,
    "title": "Eldoria MMORPG Dashboard",
    "tags": ["eldoria", "mmorpg"],
    "timezone": "browser",
    "panels": [
      {
        "id": 1,
        "title": "Players Online",
        "type": "stat",
        "targets": [
          {
            "expr": "eldoria_players_online",
            "legendFormat": "Players"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "color": {
              "mode": "palette-classic"
            },
            "custom": {
              "displayMode": "list",
              "orientation": "horizontal"
            },
            "mappings": [],
            "thresholds": {
              "steps": [
                {
                  "color": "green",
                  "value": null
                },
                {
                  "color": "red",
                  "value": 80
                }
              ]
            }
          },
          "overrides": []
        },
        "gridPos": {
          "h": 8,
          "w": 12,
          "x": 0,
          "y": 0
        }
      },
      {
        "id": 2,
        "title": "Response Time",
        "type": "graph",
        "targets": [
          {
            "expr": "eldoria_response_time_seconds",
            "legendFormat": "Response Time"
          }
        ],
        "gridPos": {
          "h": 8,
          "w": 12,
          "x": 12,
          "y": 0
        }
      }
    ],
    "time": {
      "from": "now-1h",
      "to": "now"
    },
    "refresh": "5s"
  }
}
EOF

# Criar Dockerfile gratuito para backend
echo "🐳 Criando Dockerfile gratuito..."
cat > server/Dockerfile.free << 'EOF'
FROM node:18-alpine

WORKDIR /app

# Copiar package.json e instalar dependências
COPY package*.json ./
RUN npm ci --only=production

# Copiar código fonte
COPY . .

# Criar diretórios necessários
RUN mkdir -p logs database cache

# Expor porta
EXPOSE 8080

# Iniciar aplicação
CMD ["npm", "start"]
EOF

# Criar script de inicialização do banco
echo "🗄️ Criando script de inicialização do banco..."
cat > infrastructure/init.sql << 'EOF'
-- Database initialization for Eldoria MMORPG
-- Version 1.0.0 - Free Tier Setup

-- Criar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Criar tabelas básicas
CREATE TABLE IF NOT EXISTS players (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    level INTEGER DEFAULT 1,
    experience INTEGER DEFAULT 0,
    gold INTEGER DEFAULT 100,
    class VARCHAR(20) DEFAULT 'warrior'
);

CREATE TABLE IF NOT EXISTS characters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID REFERENCES players(id),
    name VARCHAR(50) NOT NULL,
    class VARCHAR(20) NOT NULL,
    level INTEGER DEFAULT 1,
    experience INTEGER DEFAULT 0,
    hp INTEGER DEFAULT 100,
    max_hp INTEGER DEFAULT 100,
    mana INTEGER DEFAULT 50,
    max_mana INTEGER DEFAULT 50,
    strength INTEGER DEFAULT 10,
    dexterity INTEGER DEFAULT 10,
    intelligence INTEGER DEFAULT 10,
    agility INTEGER DEFAULT 10,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_played TIMESTAMP,
    x REAL DEFAULT 400,
    y REAL DEFAULT 300,
    map_id VARCHAR(50) DEFAULT 'starting_area'
);

CREATE TABLE IF NOT EXISTS game_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    character_id UUID REFERENCES characters(id),
    session_token VARCHAR(255) UNIQUE NOT NULL,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP,
    duration INTEGER,
    experience_gained INTEGER DEFAULT 0,
    gold_gained INTEGER DEFAULT 0
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_players_username ON players(username);
CREATE INDEX IF NOT EXISTS idx_players_email ON players(email);
CREATE INDEX IF NOT EXISTS idx_characters_player_id ON characters(player_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_character_id ON game_sessions(character_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_session_token ON game_sessions(session_token);

-- Inserir dados iniciais
INSERT INTO players (username, email, password_hash) VALUES 
('admin', 'admin@eldoria.com', '$2b$10$placeholder'),
('testuser', 'test@eldoria.com', '$2b$10$placeholder')
ON CONFLICT (username) DO NOTHING;

-- Criar usuário admin para testes
INSERT INTO characters (player_id, name, class) VALUES 
((SELECT id FROM players WHERE username = 'admin'), 'AdminWarrior', 'warrior'),
((SELECT id FROM players WHERE username = 'testuser'), 'TestPlayer', 'warrior')
ON CONFLICT DO NOTHING;
EOF

# Build e deploy
echo "🔨 Build e deploy..."
docker-compose -f infrastructure/docker-compose-free.yml build

echo "🚀 Iniciando serviços..."
docker-compose -f infrastructure/docker-compose-free.yml up -d

# Aguardar serviços iniciarem
echo "⏳ Aguardando serviços iniciarem..."
sleep 10

# Verificar status dos serviços
echo "📊 Verificando status dos serviços..."
docker-compose -f infrastructure/docker-compose-free.yml ps

# Testar conexões
echo "🧪 Testando conexões..."

# Testar frontend
echo "🌐 Testando frontend..."
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ Frontend está online"
else
    echo "❌ Frontend não está respondendo"
fi

# Testar backend
echo "🔧 Testando backend..."
if curl -s http://localhost:8080/health > /dev/null; then
    echo "✅ Backend está online"
else
    echo "❌ Backend não está respondendo"
fi

# Testar database
echo "🗄️ Testando database..."
if docker exec eldoria-postgres pg_isready -U postgres > /dev/null; then
    echo "✅ Database está online"
else
    echo "❌ Database não está respondendo"
fi

# Testar Redis
echo "🔴 Testando Redis..."
if docker exec eldoria-redis redis-cli ping > /dev/null; then
    echo "✅ Redis está online"
else
    echo "❌ Redis não está respondendo"
fi

# Mostrar URLs de acesso
echo ""
echo "🎉 Deploy concluído! URLs de acesso:"
echo "🌐 Jogo: http://localhost:3000"
echo "📊 Grafana: http://localhost:3001 (admin/admin)"
echo "📈 Prometheus: http://localhost:9090"
echo "🔧 Backend API: http://localhost:8080/health"
echo ""
echo "📋 Comandos úteis:"
echo "📊 Ver logs: docker-compose -f infrastructure/docker-compose-free.yml logs -f"
echo "🛑 Parar serviços: docker-compose -f infrastructure/docker-compose-free.yml down"
echo "🔄 Reiniciar: docker-compose -f infrastructure/docker-compose-free.yml restart"
echo ""
echo "🎮 Para jogar, acesse: http://localhost:3000"
echo "📊 Para monitorar, acesse: http://localhost:3001"
echo ""
echo "✅ Deploy Gratuito concluído com sucesso!"
