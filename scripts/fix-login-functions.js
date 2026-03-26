// Fix Login Functions Script
// Corrige funções de login que não estão sendo encontradas

const fs = require('fs');
const path = require('path');

console.log('🔧 Corrigindo Funções de Login\n');

function fixLoginFunctions() {
    const indexPath = path.join(__dirname, '../client/index.html');
    
    if (!fs.existsSync(indexPath)) {
        console.error('❌ index.html não encontrado');
        return false;
    }
    
    let indexContent = fs.readFileSync(indexPath, 'utf8');
    
    // 1. Verificar se as funções existem no script
    const hasHandleLogin = indexContent.includes('function handleLogin()');
    const hasShowCreateAccount = indexContent.includes('function showCreateAccount()');
    
    console.log('📊 Status das funções:');
    console.log('   handleLogin:', hasHandleLogin ? '✅' : '❌');
    console.log('   showCreateAccount:', hasShowCreateAccount ? '✅' : '❌');
    
    // 2. Se as funções não existirem, adicioná-las antes do fechamento do script
    if (!hasHandleLogin || !hasShowCreateAccount) {
        console.log('🔧 Adicionando funções de login...');
        
        const loginFunctions = `
    // Funções de Login
    function handleLogin() {
        console.log('🔐 Botão de login clicado');
        
        const username = document.getElementById('username')?.value?.trim();
        const password = document.getElementById('password')?.value?.trim();
        
        if (!username || !password) {
            showMessage('Preencha usuário e senha', 'error');
            return;
        }
        
        // Login local
        try {
            const users = JSON.parse(localStorage.getItem('users') || '{}');
            const user = users[username];
            
            if (user && user.password === password) {
                console.log('✅ Login sucesso:', username);
                currentUser = username;
                localStorage.setItem('currentUser', username);
                showMessage('Login realizado! Redirecionando...', 'success');
                
                // Transição para seleção de personagem
                setTimeout(() => {
                    const loginScreen = document.getElementById('loginScreen');
                    const characterScreen = document.getElementById('characterScreen');
                    
                    if (loginScreen) {
                        loginScreen.style.opacity = '0';
                        setTimeout(() => {
                            loginScreen.style.display = 'none';
                        }, 300);
                    }
                    
                    if (characterScreen) {
                        characterScreen.style.display = 'flex';
                        characterScreen.style.opacity = '0';
                        setTimeout(() => {
                            characterScreen.style.opacity = '1';
                        }, 100);
                    }
                }, 1000);
                
                return;
            }
        } catch (error) {
            console.error('Erro login:', error);
        }
        
        showMessage('Usuário ou senha incorretos', 'error');
    }
    
    function showCreateAccount() {
        console.log('📝 Criar conta');
        
        const loginForm = document.getElementById('loginForm');
        const createForm = document.getElementById('createAccountForm');
        
        if (loginForm && createForm) {
            loginForm.style.opacity = '0';
            setTimeout(() => {
                loginForm.style.display = 'none';
                createForm.style.display = 'block';
                createForm.style.opacity = '0';
                setTimeout(() => {
                    createForm.style.opacity = '1';
                }, 100);
            }, 300);
        }
    }
    
    function handleCreateAccount() {
        const username = document.getElementById('newUsername')?.value?.trim();
        const email = document.getElementById('newEmail')?.value?.trim();
        const password = document.getElementById('newPassword')?.value;
        const confirmPassword = document.getElementById('confirmPassword')?.value;
        
        if (!username || !email || !password || !confirmPassword) {
            showMessage('Preencha todos os campos', 'error');
            return;
        }
        
        if (password !== confirmPassword) {
            showMessage('As senhas não coincidem', 'error');
            return;
        }
        
        try {
            const users = JSON.parse(localStorage.getItem('users') || '{}');
            
            if (users[username]) {
                showMessage('Usuário já existe', 'error');
                return;
            }
            
            users[username] = {
                username, email, password,
                createdAt: new Date().toISOString()
            };
            
            localStorage.setItem('users', JSON.stringify(users));
            showMessage('Conta criada com sucesso!', 'success');
            
            setTimeout(() => backToLogin(), 1500);
            
        } catch (error) {
            console.error('Erro criar conta:', error);
            showMessage('Erro ao criar conta', 'error');
        }
    }
    
    function backToLogin() {
        const loginForm = document.getElementById('loginForm');
        const createForm = document.getElementById('createAccountForm');
        
        if (createForm && loginForm) {
            createForm.style.opacity = '0';
            setTimeout(() => {
                createForm.style.display = 'none';
                loginForm.style.display = 'block';
                loginForm.style.opacity = '0';
                setTimeout(() => {
                    loginForm.style.opacity = '1';
                }, 100);
            }, 300);
        }
    }`;
        
        // Adicionar funções antes do fechamento do script
        const scriptEndPattern = /<\/script>/;
        if (scriptEndPattern.test(indexContent)) {
            const beforeScriptEnd = indexContent.substring(0, indexContent.lastIndexOf('</script>'));
            const afterScriptEnd = indexContent.substring(indexContent.lastIndexOf('</script>') + 9);
            
            const updatedContent = beforeScriptEnd + loginFunctions + '\n    </script>' + afterScriptEnd;
            
            fs.writeFileSync(indexPath, updatedContent);
            console.log('✅ Funções de login adicionadas');
            return true;
        }
    } else {
        console.log('✅ Funções de login já existem');
        
        // Verificar se estão dentro das tags script
        const scriptStart = indexContent.indexOf('<script>');
        const scriptEnd = indexContent.lastIndexOf('</script>');
        
        if (scriptStart !== -1 && scriptEnd !== -1) {
            const scriptContent = indexContent.substring(scriptStart, scriptEnd);
            const functionsInScript = scriptContent.includes('function handleLogin()') && scriptContent.includes('function showCreateAccount()');
            
            if (!functionsInScript) {
                console.log('❌ Funções existem mas estão fora das tags script');
                return false;
            } else {
                console.log('✅ Funções estão corretamente posicionadas');
                return true;
            }
        }
    }
    
    return false;
}

// Executar
console.log('🎯 Fix Login Functions v0.1.0');
console.log('===============================\n');

const success = fixLoginFunctions();

if (success) {
    console.log('\n🔄 Limpe o cache do navegador:');
    console.log('   Ctrl+F5 ou Ctrl+Shift+R');
    
    console.log('\n🎮 Funções de login corrigidas!');
    console.log('📝 handleLogin() disponível');
    console.log('📝 showCreateAccount() disponível');
    console.log('📝 Botões funcionando corretamente');
} else {
    console.log('\n❌ Falha ao corrigir funções de login');
    console.log('📝 Verifique o console para mais detalhes');
}

console.log('\n✅ Script concluído!');
