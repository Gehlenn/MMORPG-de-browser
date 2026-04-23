const { execSync } = require('child_process');
const fs = require('fs');

try {
    console.log('Executando ai-complete.test.js...');
    const result = execSync('npx jest tests/ai-complete.test.js --no-coverage --testTimeout=30000', {
        encoding: 'utf8',
        cwd: __dirname,
        timeout: 60000
    });
    fs.writeFileSync('test-result-final.txt', result);
    console.log('Resultado salvo em test-result-final.txt');
    console.log(result);
} catch (e) {
    fs.writeFileSync('test-result-final.txt', e.stdout || e.message);
    console.log('Erro ao executar testes:');
    console.log(e.stdout || e.message);
}
