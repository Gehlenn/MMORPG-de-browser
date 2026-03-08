#!/usr/bin/env node

/**
 * GitIgnore Manager
 * Garante que .gitignore sempre esteja presente e atualizado
 */

const fs = require('fs');
const path = require('path');

class GitIgnoreManager {
    constructor() {
        this.projectRoot = __dirname;
        this.gitignorePath = path.join(this.projectRoot, '.gitignore');
        this.templatePath = path.join(__dirname, 'templates', '.gitignore.template');
    }

    /**
     * Verifica se .gitignore existe e está completo
     */
    ensureGitIgnore() {
        console.log('🔍 Verificando .gitignore...');
        
        // Se não existe, cria do template
        if (!fs.existsSync(this.gitignorePath)) {
            console.log('❌ .gitignore não encontrado, criando...');
            this.createGitIgnore();
        } else {
            console.log('✅ .gitignore encontrado, verificando integridade...');
            this.updateGitIgnore();
        }
        
        // Adiciona ao git se não estiver trackeado
        this.addToGit();
    }

    /**
     * Cria .gitignore completo
     */
    createGitIgnore() {
        const gitignoreContent = `# Dependencies
node_modules/

# Logs
*.log
logs/

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/

# nyc test coverage
.nyc_output

# Dependency directories
node_modules/
jspm_packages/

# Optional npm cache directory
.npm

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# dotenv environment variables file
.env
.env.test

# parcel-bundler cache (https://parceljs.org/)
.cache
.parcel-cache

# next.js build output
.next

# nuxt.js build output
.nuxt

# vuepress build output
.vuepress/dist

# Serverless directories
.serverless

# FuseBox cache
.fusebox/

# DynamoDB Local files
.dynamodb/

# TernJS port file
.tern-port

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Build outputs
dist/
build/

# Test outputs
test-results/
coverage/

# Temporary files
tmp/
temp/

# Database files
*.db
*.sqlite
*.sqlite3

# Backup files
*.backup
*.bak

# Error logs
ERROR_LOG.md
BUGLOG-*.md

# MMORPG Specific
output/
screenshots/
*.png
*.jpg
*.jpeg
*.gif
*.webp
*.svg

# ZIP files (exceto releases)
!MMORPG-de-browser-v*.zip
*.zip

# Release artifacts
releases/
deploy/

# Node.js specific
npm-debug.log*
yarn-debug.log*
yarn-error.log*
`;

        fs.writeFileSync(this.gitignorePath, gitignoreContent);
        console.log('✅ .gitignore criado com sucesso!');
    }

    /**
     * Atualiza .gitignore existente
     */
    updateGitIgnore() {
        const currentContent = fs.readFileSync(this.gitignorePath, 'utf8');
        
        // Verifica se tem as seções essenciais
        const essentialSections = [
            'node_modules/',
            '*.log',
            'output/',
            '*.db',
            'ERROR_LOG.md',
            '!MMORPG-de-browser-v*.zip'
        ];

        const missingSections = essentialSections.filter(section => !currentContent.includes(section));
        
        if (missingSections.length > 0) {
            console.log('⚠️ Seções faltando no .gitignore:');
            missingSections.forEach(section => console.log(`   - ${section}`));
            
            // Adiciona seções faltantes
            const updatedContent = currentContent + '\n\n# Missing sections added automatically\n' + missingSections.join('\n');
            fs.writeFileSync(this.gitignorePath, updatedContent);
            console.log('✅ .gitignore atualizado!');
        } else {
            console.log('✅ .gitignore está completo!');
        }
    }

    /**
     * Adiciona .gitignore ao controle de versão
     */
    addToGit() {
        const { execSync } = require('child_process');
        
        try {
            // Verifica se está no repositório git
            execSync('git rev-parse --git-dir', { stdio: 'ignore' });
            
            // Verifica se .gitignore está trackeado
            const gitCheck = execSync('git ls-files .gitignore', { encoding: 'utf8' });
            
            if (!gitCheck.trim()) {
                console.log('📦 Adicionando .gitignore ao controle de versão...');
                execSync('git add .gitignore', { stdio: 'inherit' });
                console.log('✅ .gitignore adicionado ao git!');
            } else {
                console.log('✅ .gitignore já está no controle de versão!');
            }
        } catch (error) {
            console.log('⚠️ Não está em um repositório git');
        }
    }

    /**
     * Executa o gerenciador
     */
    run() {
        console.log('🚀 GitIgnore Manager - Iniciando...');
        this.ensureGitIgnore();
        console.log('✅ GitIgnore Manager - Concluído!');
    }
}

// Executa se chamado diretamente
if (require.main === module) {
    const manager = new GitIgnoreManager();
    manager.run();
}

module.exports = GitIgnoreManager;
