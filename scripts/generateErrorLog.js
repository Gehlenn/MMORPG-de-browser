/**
 * Error Log Generator Script
 * Automatically generates and updates ERROR_LOG.md with new errors and resolutions
 * Version 0.3.4 - Dynamic World Events and MMO Game Loop
 */

const fs = require('fs');
const path = require('path');

class ErrorLogGenerator {
    constructor() {
        this.errorLogPath = path.join(__dirname, '..', 'ERROR_LOG.md');
        this.currentVersion = '0.3.4';
        this.errorCount = 0;
        this.resolvedCount = 0;
    }

    /**
     * Add a new error to the log
     */
    addError(errorData) {
        const {
            id,
            title,
            location,
            cause,
            date = new Date().toISOString(),
            status = 'OPEN',
            solution = null,
            impact = 'UNKNOWN'
        } = errorData;

        this.errorCount++;
        if (status === 'RESOLVED') {
            this.resolvedCount++;
        }

        const errorEntry = this.formatErrorEntry({
            id,
            title,
            location,
            cause,
            date,
            status,
            solution,
            impact
        });

        this.appendToLog(errorEntry);
        console.log(`Error ${id} added to log: ${title}`);
    }

    /**
     * Format error entry for markdown
     */
    formatErrorEntry(error) {
        const statusIcon = error.status === 'RESOLVED' ? '✅' : '❌';
        const solutionSection = error.solution ? `\n**✅ RESOLUÇÃO:**\n\`\`\`javascript\n${error.solution}\n\`\`\`` : '';

        return `
---

### 🚨 **ERRO #${error.id}: ${error.title}**
\`\`\`bash
${statusIcon} ERRO: ${error.title}
📍 Localização: ${error.location}
🔍 Causa: ${error.cause}
📅 Data: ${error.date}
\`\`\`

**Impacto:** ${error.impact}
**Status:** ${error.status}
${solutionSection}
`;
    }

    /**
     * Append error to log file
     */
    appendToLog(errorEntry) {
        try {
            let content = '';
            
            // Read existing content if file exists
            if (fs.existsSync(this.errorLogPath)) {
                content = fs.readFileSync(this.errorLogPath, 'utf8');
            } else {
                // Create new file with header
                content = this.createHeader();
            }

            // Find where to insert the new error (after version header)
            const versionHeaderIndex = content.indexOf(`## 📋 Version ${this.currentVersion}`);
            if (versionHeaderIndex !== -1) {
                // Find the next version header or end of file
                const nextVersionIndex = content.indexOf('\n---\n\n## 📋 Version', versionHeaderIndex + 1);
                const insertIndex = nextVersionIndex !== -1 ? nextVersionIndex : content.length;
                
                // Insert the new error
                content = content.slice(0, insertIndex) + errorEntry + content.slice(insertIndex);
            } else {
                // If no version header found, append to end
                content += errorEntry;
            }

            // Update summary table
            content = this.updateSummaryTable(content);

            fs.writeFileSync(this.errorLogPath, content, 'utf8');
        } catch (error) {
            console.error('Error writing to error log:', error);
        }
    }

    /**
     * Create header for new error log file
     */
    createHeader() {
        return `# MMORPG Browser - Error Log

Este documento registra todos os erros encontrados durante o desenvolvimento e suas resoluções.

---

## 📋 Version ${this.currentVersion} - Dynamic World Events and MMO Game Loop

### 📊 **RESUMO DE ERROS - VERSÃO ${this.currentVersion}**

| # | Erro | Status | Solução | Impacto | Data |
|---|------|--------|---------|---------|------|

`;
    }

    /**
     * Update summary table with new error
     */
    updateSummaryTable(content) {
        const tableRegex = /\| # \| Erro \| Status \| Solução \| Impacto \| Data \|\n\|---\|---\|---\|---\|---\|---\|\n([\s\S]*?)(?=\n---\n\n##|$)/;
        const match = content.match(tableRegex);
        
        if (match) {
            const tableContent = match[1];
            const newTableRow = `| ${this.errorCount} | ERRO #${this.errorCount} | ${this.resolvedCount === this.errorCount ? '✅ RESOLVIDO' : '❌ ABERTO'} | ${this.resolvedCount}/${this.errorCount} | TBD | ${new Date().toISOString().split('T')[0]} |\n`;
            
            const updatedTable = match[0] + newTableRow;
            content = content.replace(tableRegex, updatedTable);
        }

        return content;
    }

    /**
     * Mark an error as resolved
     */
    resolveError(errorId, solution) {
        try {
            let content = fs.readFileSync(this.errorLogPath, 'utf8');
            
            // Find and update the error status
            const errorRegex = new RegExp(`(❌ ERRO:.*ERRO #${errorId}:[^\\n]*\\n)([^\\n]*\\n)([^\\n]*\\n)([^\\n]*\\n)(📅 Data: [^\\n]*\\n)([^\\n]*\\n)(\\*\\*Status:\\*\\* )OPEN`, 'g');
            
            const updatedContent = content.replace(errorRegex, (match, p1, p2, p3, p4, p5, p6, p7) => {
                this.resolvedCount++;
                return `${p1}${p2}${p3}${p4}${p5}${p6}${p7}RESOLVED\n\n**✅ RESOLUÇÃO:**\n\`\`\`javascript\n${solution}\n\`\`\``;
            });

            fs.writeFileSync(this.errorLogPath, updatedContent, 'utf8');
            console.log(`Error ${errorId} marked as resolved`);
        } catch (error) {
            console.error('Error resolving error in log:', error);
        }
    }

    /**
     * Generate statistics report
     */
    generateStats() {
        const resolutionRate = this.errorCount > 0 ? ((this.resolvedCount / this.errorCount) * 100).toFixed(1) : '0';
        
        return {
            totalErrors: this.errorCount,
            resolvedErrors: this.resolvedCount,
            openErrors: this.errorCount - this.resolvedCount,
            resolutionRate: `${resolutionRate}%`,
            version: this.currentVersion
        };
    }

    /**
     * Update version in error log
     */
    updateVersion(newVersion) {
        this.currentVersion = newVersion;
        this.errorCount = 0;
        this.resolvedCount = 0;
        
        try {
            let content = fs.readFileSync(this.errorLogPath, 'utf8');
            
            // Add new version header
            const newVersionHeader = `
---

## 📋 Version ${newVersion} - [TÍTULO DA VERSÃO]

### 📊 **RESUMO DE ERROS - VERSÃO ${newVersion}**

| # | Erro | Status | Solução | Impacto | Data |
|---|------|--------|---------|---------|------|

`;
            
            content += newVersionHeader;
            fs.writeFileSync(this.errorLogPath, content, 'utf8');
            
            console.log(`Error log updated to version ${newVersion}`);
        } catch (error) {
            console.error('Error updating version in log:', error);
        }
    }
}

// Export for use in other scripts
module.exports = ErrorLogGenerator;

// CLI usage
if (require.main === module) {
    const errorLog = new ErrorLogGenerator();
    
    // Example usage
    errorLog.addError({
        id: 'EXAMPLE',
        title: 'Example Error',
        location: 'file.js:123:45',
        cause: 'Example cause',
        impact: 'MEDIUM',
        status: 'OPEN'
    });
    
    console.log('Error Log Generator ready!');
    console.log('Usage: require("./scripts/generateErrorLog.js")');
}
