# AI Tests - Documentação

## 📋 Resumo

Suite de testes completa para os módulos de IA do MMORPG.

**Status:** ✅ 21/21 testes passando  
**Cobertura:** AIMobController, PathfindingSystem, AIBossController  
**Arquivo:** `tests/ai-core.test.js`

---

## 🚀 Execução

```bash
# Executar apenas testes de IA
npx jest tests/ai-core.test.js --no-coverage

# Executar com cobertura
npx jest tests/ai-core.test.js --coverage

# Modo watch
npx jest tests/ai-core.test.js --watch
```

---

## 📊 Testes por Módulo

### AIMobController (6 testes)

| Teste | Descrição |
|-------|-----------|
| `should initialize with correct properties` | Verifica inicialização correta das propriedades |
| `should setup behavior profiles` | Testa configuração de perfis de comportamento |
| `should add and remove mob` | CRUD básico de mobs |
| `should transition state` | Transições de estado da máquina de estados |
| `should get statistics` | Retorno de estatísticas do sistema |
| `should evaluate decision tree` | Avaliação da árvore de decisões |

### PathfindingSystem (6 testes)

| Teste | Descrição |
|-------|-----------|
| `should initialize grid` | Inicialização do grid de pathfinding |
| `should convert world to grid` | Conversão coordenadas mundo → grid |
| `should validate positions` | Validação de posições no grid |
| `should find simple path` | Pathfinding básico A* |
| `should check line of sight` | Verificação de linha de visão |
| `should get statistics` | Estatísticas do sistema de pathfinding |

### AIBossController (9 testes)

| Teste | Descrição |
|-------|-----------|
| `should initialize correctly` | Inicialização do controller |
| `should setup tactical profiles` | Perfis táticos (aggressive, defensive, etc) |
| `should setup ability patterns` | Padrões de habilidades |
| `should add and remove boss` | CRUD de bosses |
| `should get tactical profile` | Recuperação de perfil tático |
| `should evaluate direct assault` | Avaliação de táticas de ataque |
| `should update boss` | Ciclo de update do boss |
| `should create pattern memory` | Memória de padrões do jogador |
| `should get statistics` | Estatísticas do sistema |

---

## 🏗️ Estrutura

```
tests/
├── ai-core.test.js           # Suite principal (21 testes) ✅
├── AI_TEST_README.md         # Esta documentação
└── setup.js                  # Configurações globais de teste
```

---

## 📝 Notas

- Testes antigos removidos: `enhanced-ai-system-*.test.js`, `ai-system.test.js`
- Cache do Jest limpo para evitar resultados obsoletos
- Testes atuais são estáveis e isolados

---

## 🔧 Manutenção

Para adicionar novos testes:

1. Editar `tests/ai-core.test.js`
2. Seguir padrão existente (describe → test)
3. Executar: `npx jest tests/ai-core.test.js --no-coverage`
4. Verificar: todos devem passar ✅

---

## 📈 CI/CD

Os testes são executados automaticamente em:
- Push para `main`
- Pull requests
- Releases

Ver workflow: `.github/workflows/ci-cd.yml`
