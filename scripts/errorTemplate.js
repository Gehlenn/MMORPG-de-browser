/**
 * Error Template - Template para adicionar novos erros ao log
 * Copie e modifique este template para documentar novos erros
 */

const ErrorLogGenerator = require('./generateErrorLog');

// Criar instância do gerador de log
const errorLog = new ErrorLogGenerator();

// ========================================
// TEMPLATE PARA NOVO ERRO
// ========================================
errorLog.addError({
    id: 'TEMPLATE_ID',           // Número único do erro (ex: 7, 8, 9...)
    title: 'Título do Erro',     // Descrição breve do erro
    location: 'arquivo.js:linha:coluna',  // Onde ocorreu o erro
    cause: 'Causa detalhada do erro',     // Por que aconteceu
    date: new Date().toISOString(),       // Data do erro (automático)
    status: 'OPEN',             // 'OPEN' ou 'RESOLVED'
    solution: null,             // Solução (null se não resolvido)
    impact: 'MEDIUM'            // 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'
});

// ========================================
// EXEMPLOS DE ERROS JÁ RESOLVIDOS
// ========================================

/*
// Exemplo 1: Erro de módulo não encontrado
errorLog.addError({
    id: 'MODULE_NOT_FOUND',
    title: 'Module is not a constructor',
    location: 'server/server.js:404:37',
    cause: 'Arquivo usando export default em vez de module.exports',
    status: 'RESOLVED',
    solution: `// ANTES:
export default WorldManager;

// DEPOIS:
module.exports = WorldManager;`,
    impact: 'CRITICAL'
});

// Exemplo 2: Erro de database undefined
errorLog.addError({
    id: 'DATABASE_UNDEFINED',
    title: 'Cannot read properties of undefined (reading get)',
    location: 'server/world/worldManager.js:73:53',
    cause: 'Variável database não definida no escopo',
    status: 'RESOLVED',
    solution: `// ANTES:
constructor(server) {
    this.database = database; // ❌ undefined
}

// DEPOIS:
constructor(server) {
    this.database = server.database; // ✅ referência correta
}`,
    impact: 'CRITICAL'
});
*/

// ========================================
// COMO USAR
// ========================================
/*
1. Copie o template acima
2. Modifique os campos com as informações do erro
3. Execute: npm run error:log
4. O erro será adicionado automaticamente ao ERROR_LOG.md

Para marcar um erro como resolvido:
errorLog.resolveError('ERROR_ID', 'Solução detalhada');

Para atualizar versão:
errorLog.updateVersion('0.3.5');
*/

console.log('Error template ready! Modify and run npm run error:log to add errors.');
