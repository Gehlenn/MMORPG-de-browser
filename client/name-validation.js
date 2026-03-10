// Funções para tratamento de nomes e validação

// Função para gerar sugestões de nomes
function generateNameSuggestions(baseName) {
    const suggestions = [];
    const prefixes = ['Super', 'Mega', 'Ultra', 'Pro', 'Master', 'Legend', 'Shadow', 'Fire', 'Ice', 'Storm'];
    const suffixes = ['X', 'Z', 'Pro', 'Max', 'Gamer', 'Hero', 'Warrior', 'Mage', 'Knight', 'Legend'];
    const numbers = ['01', '77', '99', '123', '420', '666', '777', '999'];
    
    // Adicionar número ao final
    suggestions.push(baseName + numbers[Math.floor(Math.random() * numbers.length)]);
    
    // Adicionar prefixo
    if (baseName.length < 12) {
        suggestions.push(prefixes[Math.floor(Math.random() * prefixes.length)] + baseName);
    }
    
    // Adicionar sufixo
    if (baseName.length < 12) {
        suggestions.push(baseName + suffixes[Math.floor(Math.random() * suffixes.length)]);
    }
    
    // Substituir letras por números (leetspeak)
    const leetName = baseName
        .replace(/a/gi, '4')
        .replace(/e/gi, '3')
        .replace(/i/gi, '1')
        .replace(/o/gi, '0')
        .replace(/s/gi, '5');
    if (leetName !== baseName) {
        suggestions.push(leetName);
    }
    
    // Misturar maiúsculas
    suggestions.push(baseName.charAt(0).toUpperCase() + baseName.slice(1).toLowerCase());
    
    return suggestions.slice(0, 3); // Retornar apenas 3 sugestões
}

// Função para mostrar sugestões na interface
function showNameSuggestions(suggestions) {
    // Remover sugestões anteriores
    const oldSuggestions = document.getElementById('nameSuggestions');
    if (oldSuggestions) {
        oldSuggestions.remove();
    }
    
    if (suggestions.length === 0) return;
    
    // Criar container de sugestões
    const suggestionDiv = document.createElement('div');
    suggestionDiv.id = 'nameSuggestions';
    suggestionDiv.className = 'name-suggestions';
    suggestionDiv.innerHTML = `
        <div class="suggestions-title">💡 Sugestões disponíveis:</div>
        <div class="suggestions-list">
            ${suggestions.map(name => 
                `<button class="suggestion-btn" onclick="selectSuggestedName('${name}')">${name}</button>`
            ).join('')}
        </div>
    `;
    
    // Adicionar após o campo de nome
    const nameInput = document.getElementById('heroName');
    if (nameInput && nameInput.parentNode) {
        nameInput.parentNode.insertBefore(suggestionDiv, nameInput.nextSibling);
    }
}

// Função para selecionar nome sugerido
function selectSuggestedName(name) {
    const nameInput = document.getElementById('heroName');
    if (nameInput) {
        nameInput.value = name;
        nameInput.focus();
        
        // Remover sugestões
        const suggestions = document.getElementById('nameSuggestions');
        if (suggestions) {
            suggestions.remove();
        }
        
        // Limpar status de erro
        const statusDiv = document.getElementById("registerStatus");
        if (statusDiv) {
            statusDiv.textContent = '';
            statusDiv.className = 'login-status';
        }
    }
}

// Configurar validação em tempo real
function setupNameValidation() {
    const nameInput = document.getElementById('heroName');
    if (!nameInput) return;
    
    let checkTimeout;
    
    nameInput.addEventListener('input', (e) => {
        const name = e.target.value.trim();
        
        // Limpar timeout anterior
        if (checkTimeout) {
            clearTimeout(checkTimeout);
        }
        
        // Remover sugestões anteriores
        const suggestions = document.getElementById('nameSuggestions');
        if (suggestions) {
            suggestions.remove();
        }
        
        // Limpar status
        const statusDiv = document.getElementById("registerStatus");
        if (statusDiv && name.length < 3) {
            statusDiv.textContent = '';
            statusDiv.className = 'login-status';
        }
        
        // Só verificar se tiver pelo menos 3 caracteres
        if (name.length >= 3) {
            checkTimeout = setTimeout(() => {
                checkNameAvailability(name);
            }, 500); // Esperar 500ms após parar de digitar
        }
    });
}

// Simular verificação de disponibilidade
function checkNameAvailability(name) {
    const statusDiv = document.getElementById("registerStatus");
    if (!statusDiv) return;
    
    statusDiv.className = 'login-status checking';
    statusDiv.textContent = '🔍 Verificando disponibilidade...';
    
    // Simular delay de rede
    setTimeout(() => {
        statusDiv.className = 'login-status success';
        statusDiv.textContent = '✅ Nome disponível!';
    }, 300);
}

// Adicionar estilos CSS
const suggestionStyles = `
.name-suggestions {
    margin-top: 8px;
    padding: 12px;
    background: rgba(69, 196, 134, 0.1);
    border: 1px solid var(--accent);
    border-radius: 8px;
    animation: slideDown 0.3s ease;
}

.suggestions-title {
    font-size: 0.9rem;
    color: var(--text);
    margin-bottom: 8px;
    font-weight: 600;
}

.suggestions-list {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
}

.suggestion-btn {
    background: var(--accent);
    border: none;
    border-radius: 6px;
    padding: 6px 12px;
    color: white;
    cursor: pointer;
    font-size: 0.8rem;
    transition: all 0.3s ease;
}

.suggestion-btn:hover {
    background: #3ba572;
    transform: translateY(-1px);
}

.login-status.checking {
    color: var(--warn);
}

@keyframes slideDown {
    from {
        opacity: 0;
        transform: translateY(-10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}
`;

// Adicionar estilos ao documento quando carregar
document.addEventListener('DOMContentLoaded', () => {
    const styleSheet = document.createElement('style');
    styleSheet.textContent = suggestionStyles;
    document.head.appendChild(styleSheet);
    
    // Configurar validação quando o formulário de registro estiver disponível
    setTimeout(() => {
        setupNameValidation();
    }, 100);
});

// Tornar funções globais para uso no onclick
window.generateNameSuggestions = generateNameSuggestions;
window.showNameSuggestions = showNameSuggestions;
window.selectSuggestedName = selectSuggestedName;
window.setupNameValidation = setupNameValidation;
window.checkNameAvailability = checkNameAvailability;
