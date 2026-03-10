// Catálogo de Erros do MMORPG Browser
// Sistema inteligente para identificar e explicar erros

class ErrorCatalog {
    constructor() {
        this.errorCodes = {
            // Database Errors
            'DATABASE_CONNECTION_FAILED': {
                message: 'Falha na conexão com banco de dados',
                shortExplanation: 'Banco de dados offline ou corrompido',
                userMessage: 'Servidor com problemas técnicos. Tente novamente em alguns minutos.',
                technicalDetails: 'SQLite não conseguiu conectar ou inicializar o banco de dados'
            },
            
            'TABLE_NOT_FOUND': {
                message: 'Tabela não encontrada no banco de dados',
                shortExplanation: 'Estrutura do banco de dados incompleta',
                userMessage: 'Sistema de dados em manutenção. Tente novamente mais tarde.',
                technicalDetails: 'Tabela necessária não existe no banco SQLite'
            },
            
            'DUPLICATE_KEY': {
                message: 'Registro duplicado',
                shortExplanation: 'Informação já está em uso',
                userMessage: 'Este valor já está cadastrado. Escolha outra opção.',
                technicalDetails: 'Constraint UNIQUE violada no banco de dados',
                suggestion: 'Use um valor diferente para este campo'
            },
            
            'EMAIL_DUPLICATE': {
                message: 'Email já cadastrado',
                shortExplanation: 'Este email já está em uso',
                userMessage: 'Este email já foi cadastrado. Use outro email.',
                technicalDetails: 'Constraint UNIQUE do campo email violada',
                suggestion: 'Tente usar outro endereço de email'
            },
            
            'FOREIGN_KEY_CONSTRAINT': {
                message: 'Violação de chave estrangeira',
                shortExplanation: 'Referência de dados inválida',
                userMessage: 'Erro de relacionamento entre dados. Contate o suporte.',
                technicalDetails: 'Chave estrangeira não encontrada ou inválida'
            },
            
            // Network Errors
            'SOCKET_CONNECTION_FAILED': {
                message: 'Falha na conexão WebSocket',
                shortExplanation: 'Problema de conexão com servidor',
                userMessage: 'Não foi possível conectar ao servidor. Verifique sua internet.',
                technicalDetails: 'Socket.IO não conseguiu estabelecer conexão'
            },
            
            'TIMEOUT_ERROR': {
                message: 'Timeout da operação',
                shortExplanation: 'Operação demorou demais',
                userMessage: 'Operação demorou demais. Tente novamente.',
                technicalDetails: 'Timeout excedido na operação de banco ou rede'
            },
            
            // Validation Errors
            'INVALID_INPUT': {
                message: 'Dados inválidos',
                shortExplanation: 'Informações preenchidas incorretamente',
                userMessage: 'Verifique os dados informados e tente novamente.',
                technicalDetails: 'Validação de input falhou - formato ou conteúdo inválido'
            },
            
            'MISSING_REQUIRED_FIELD': {
                message: 'Campo obrigatório faltando',
                shortExplanation: 'Informações incompletas',
                userMessage: 'Preencha todos os campos obrigatórios.',
                technicalDetails: 'Campo required não fornecido na requisição'
            },
            
            // Authentication Errors
            'INVALID_CREDENTIALS': {
                message: 'Credenciais inválidas',
                shortExplanation: 'Usuário ou senha incorretos',
                userMessage: 'Usuário ou senha incorretos. Verifique e tente novamente.',
                technicalDetails: 'Autenticação falhou - credenciais não correspondem'
            },
            
            'SESSION_EXPIRED': {
                message: 'Sessão expirada',
                shortExplanation: 'Tempo de login esgotado',
                userMessage: 'Sua sessão expirou. Faça login novamente.',
                technicalDetails: 'Token de sessão inválido ou expirado'
            },
            
            // Character Errors
            'CHARACTER_NOT_FOUND': {
                message: 'Personagem não encontrado',
                shortExplanation: 'Personagem não existe no banco',
                userMessage: 'Personagem não encontrado. Crie um novo personagem.',
                technicalDetails: 'Query de personagem retornou null/undefined'
            },
            
            'CHARACTER_CREATION_FAILED': {
                message: 'Falha ao criar personagem',
                shortExplanation: 'Erro no processo de criação',
                userMessage: 'Não foi possível criar personagem. Tente novamente.',
                technicalDetails: 'INSERT na tabela characters falhou'
            },
            
            // System Errors
            'MEMORY_ERROR': {
                message: 'Erro de memória',
                shortExplanation: 'Servidor com pouca memória',
                userMessage: 'Servidor sobrecarregado. Tente novamente em alguns minutos.',
                technicalDetails: 'Memory limit exceeded ou allocation failed'
            },
            
            'FILE_SYSTEM_ERROR': {
                message: 'Erro no sistema de arquivos',
                shortExplanation: 'Problema ao acessar arquivos',
                userMessage: 'Erro ao salvar dados. Tente novamente.',
                technicalDetails: 'File system não conseguiu ler/escrever arquivo'
            },
            
            'UNKNOWN_ERROR': {
                message: 'Erro desconhecido',
                shortExplanation: 'Problema não identificado',
                userMessage: 'Ocorreu um erro inesperado. Tente novamente.',
                technicalDetails: 'Erro não categorizado pelo sistema'
            }
        };
    }
    
    // Analisa erro e retorna informações detalhadas
    analyzeError(error, context = {}) {
        const errorString = error.toString().toLowerCase();
        const errorMessage = error.message || '';
        
        // Database Connection Errors
        if (errorString.includes('database') || errorString.includes('sqlite') || errorString.includes('no such table')) {
            if (errorString.includes('no such table')) {
                return {
                    code: 'TABLE_NOT_FOUND',
                    ...this.errorCodes['TABLE_NOT_FOUND'],
                    originalError: error.message,
                    context,
                    suggestion: this.getTableCreationSuggestion(errorString)
                };
            }
            
            if (errorString.includes('connection') || errorString.includes('connect')) {
                return {
                    code: 'DATABASE_CONNECTION_FAILED',
                    ...this.errorCodes['DATABASE_CONNECTION_FAILED'],
                    originalError: error.message,
                    context
                };
            }
        }
        
        // Duplicate Key/Constraint Errors
        if (errorString.includes('unique') || errorString.includes('constraint') || 
            errorString.includes('duplicate') || errorMessage.includes('UNIQUE constraint failed')) {
            
            // Check if it's specifically an email duplicate
            if (errorMessage.includes('Email already taken') || 
                (context.operation === 'createAccount' && context.email)) {
                return {
                    code: 'EMAIL_DUPLICATE',
                    ...this.errorCodes['EMAIL_DUPLICATE'],
                    originalError: error.message,
                    context,
                    suggestion: 'Tente usar outro endereço de email'
                };
            }
            
            return {
                code: 'DUPLICATE_KEY',
                ...this.errorCodes['DUPLICATE_KEY'],
                originalError: error.message,
                context,
                suggestion: this.getDuplicateKeySuggestion(context)
            };
        }
        
        // Network/Socket Errors
        if (errorString.includes('socket') || errorString.includes('connection') || 
            errorString.includes('network') || errorString.includes('timeout')) {
            if (errorString.includes('timeout')) {
                return {
                    code: 'TIMEOUT_ERROR',
                    ...this.errorCodes['TIMEOUT_ERROR'],
                    originalError: error.message,
                    context
                };
            }
            
            return {
                code: 'SOCKET_CONNECTION_FAILED',
                ...this.errorCodes['SOCKET_CONNECTION_FAILED'],
                originalError: error.message,
                context
            };
        }
        
        // Validation Errors
        if (errorString.includes('validation') || errorString.includes('required') || 
            errorString.includes('invalid') || errorString.includes('missing')) {
            if (errorString.includes('required') || errorString.includes('missing')) {
                return {
                    code: 'MISSING_REQUIRED_FIELD',
                    ...this.errorCodes['MISSING_REQUIRED_FIELD'],
                    originalError: error.message,
                    context
                };
            }
            
            return {
                code: 'INVALID_INPUT',
                ...this.errorCodes['INVALID_INPUT'],
                originalError: error.message,
                context
            };
        }
        
        // Authentication Errors
        if (errorString.includes('auth') || errorString.includes('login') || 
            errorString.includes('credential') || errorString.includes('session')) {
            if (errorString.includes('session') || errorString.includes('expired')) {
                return {
                    code: 'SESSION_EXPIRED',
                    ...this.errorCodes['SESSION_EXPIRED'],
                    originalError: error.message,
                    context
                };
            }
            
            return {
                code: 'INVALID_CREDENTIALS',
                ...this.errorCodes['INVALID_CREDENTIALS'],
                originalError: error.message,
                context
            };
        }
        
        // Character Errors
        if (errorString.includes('character') || errorString.includes('player')) {
            if (errorString.includes('not found') || errorString.includes('null')) {
                return {
                    code: 'CHARACTER_NOT_FOUND',
                    ...this.errorCodes['CHARACTER_NOT_FOUND'],
                    originalError: error.message,
                    context
                };
            }
            
            if (errorString.includes('creation') || errorString.includes('create')) {
                return {
                    code: 'CHARACTER_CREATION_FAILED',
                    ...this.errorCodes['CHARACTER_CREATION_FAILED'],
                    originalError: error.message,
                    context
                };
            }
        }
        
        // System Errors
        if (errorString.includes('memory') || errorString.includes('heap')) {
            return {
                code: 'MEMORY_ERROR',
                ...this.errorCodes['MEMORY_ERROR'],
                originalError: error.message,
                context
            };
        }
        
        if (errorString.includes('file') || errorString.includes('fs') || 
            errorString.includes('enoent') || errorString.includes('eacces')) {
            return {
                code: 'FILE_SYSTEM_ERROR',
                ...this.errorCodes['FILE_SYSTEM_ERROR'],
                originalError: error.message,
                context
            };
        }
        
        // Default Unknown Error
        return {
            code: 'UNKNOWN_ERROR',
            ...this.errorCodes['UNKNOWN_ERROR'],
            originalError: error.message,
            context
        };
    }
    
    // Sugestões específicas para tabela não encontrada
    getTableCreationSuggestion(errorString) {
        if (errorString.includes('characters')) {
            return 'Execute: CREATE TABLE characters (id INTEGER PRIMARY KEY, name TEXT UNIQUE, ...)';
        }
        if (errorString.includes('accounts')) {
            return 'Execute: CREATE TABLE accounts (id INTEGER PRIMARY KEY, username TEXT UNIQUE, ...)';
        }
        return 'Verifique estrutura do banco de dados';
    }
    
    // Sugestões para chave duplicada
    getDuplicateKeySuggestion(context) {
        if (context.field === 'name') {
            return 'Tente: "SuperHero123", "DragonX", "MegaPlayer77"';
        }
        if (context.field === 'username') {
            return 'Tente adicionar números ou usar variação do nome';
        }
        return 'Use um valor diferente para este campo';
    }
    
    // Formata erro para envio ao cliente
    formatForClient(errorAnalysis) {
        return {
            code: errorAnalysis.code,
            message: errorAnalysis.userMessage,
            shortExplanation: errorAnalysis.shortExplanation,
            suggestion: errorAnalysis.suggestion,
            timestamp: new Date().toISOString()
        };
    }
    
    // Formata erro para logs do servidor
    formatForLogging(errorAnalysis) {
        return {
            code: errorAnalysis.code,
            technicalMessage: errorAnalysis.message,
            technicalDetails: errorAnalysis.technicalDetails,
            originalError: errorAnalysis.originalError,
            context: errorAnalysis.context,
            timestamp: new Date().toISOString()
        };
    }
}

module.exports = ErrorCatalog;
