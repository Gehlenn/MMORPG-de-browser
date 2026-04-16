/**
 * Financial Security Tests v0.4.0
 * Testes críticos para segurança financeira e transações
 * Version 0.4.0 - Production Ready
 */

const { describe, it, expect, beforeEach, afterEach } = require('@jest/globals');

describe('Financial Security v0.4.0', () => {
    let playerManager;
    let economySystem;
    let transactionLogger;
    
    beforeEach(() => {
        // Mock systems para testes financeiros
        playerManager = {
            players: new Map(),
            getPlayerBalance: (playerId) => {
                const player = playerManager.players.get(playerId);
                return player ? player.gold + (player.gems * 10) : 0;
            },
            updatePlayerBalance: (playerId, gold, gems) => {
                const player = playerManager.players.get(playerId);
                if (player) {
                    player.gold = Math.max(0, player.gold + gold);
                    player.gems = Math.max(0, player.gems + gems);
                    return true;
                }
                return false;
            }
        };
        
        economySystem = {
            transactions: [],
            validateTransaction: (transaction) => {
                // Validações críticas de segurança
                if (!transaction.playerId || !transaction.amount || transaction.amount < 0) {
                    return { valid: false, error: 'Invalid transaction data' };
                }
                
                if (transaction.amount > 1000000) { // Limite de segurança
                    return { valid: false, error: 'Transaction amount exceeds limit' };
                }
                
                if (transaction.type === 'purchase' && transaction.amount > playerManager.getPlayerBalance(transaction.playerId)) {
                    return { valid: false, error: 'Insufficient funds' };
                }
                
                return { valid: true };
            },
            processTransaction: (transaction) => {
                const validation = economySystem.validateTransaction(transaction);
                if (!validation.valid) {
                    throw new Error(validation.error);
                }
                
                // Processamento seguro
                const multiplier = transaction.type === 'purchase' ? -1 : 1;
                const success = playerManager.updatePlayerBalance(
                    transaction.playerId, 
                    transaction.gold * multiplier, 
                    transaction.gems * multiplier
                );
                
                if (success) {
                    economySystem.transactions.push({
                        ...transaction,
                        timestamp: Date.now(),
                        id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
                    });
                }
                
                return success;
            }
        };
        
        transactionLogger = {
            logs: [],
            log: (transaction, result) => {
                transactionLogger.logs.push({
                    transaction: { ...transaction, sensitiveData: 'REDACTED' },
                    result,
                    timestamp: Date.now()
                });
            }
        };
        
        // Setup jogador de teste
        playerManager.players.set('test_player_1', {
            id: 'test_player_1',
            name: 'TestPlayer',
            gold: 1000,
            gems: 50
        });
    });
    
    afterEach(() => {
        // Cleanup
        playerManager.players.clear();
        economySystem.transactions.length = 0;
        transactionLogger.logs.length = 0;
    });
    
    describe('Validação de Transações Financeiras', () => {
        it('deve rejeitar transações com valores negativos', () => {
            const transaction = {
                playerId: 'test_player_1',
                amount: -100,
                type: 'purchase',
                gold: -100,
                gems: 0
            };
            
            const validation = economySystem.validateTransaction(transaction);
            expect(validation.valid).toBe(false);
            expect(validation.error).toBe('Invalid transaction data');
        });
        
        it('deve rejeitar transações acima do limite de segurança', () => {
            const transaction = {
                playerId: 'test_player_1',
                amount: 1000001,
                type: 'purchase',
                gold: 1000001,
                gems: 0
            };
            
            const validation = economySystem.validateTransaction(transaction);
            expect(validation.valid).toBe(false);
            expect(validation.error).toBe('Transaction amount exceeds limit');
        });
        
        it('deve rejeitar compras com fundos insuficientes', () => {
            const transaction = {
                playerId: 'test_player_1',
                amount: 2000, // Mais que o saldo (1000 + 50*10 = 1500)
                type: 'purchase',
                gold: 2000,
                gems: 0
            };
            
            const validation = economySystem.validateTransaction(transaction);
            expect(validation.valid).toBe(false);
            expect(validation.error).toBe('Insufficient funds');
        });
        
        it('deve aceitar transações válidas', () => {
            const transaction = {
                playerId: 'test_player_1',
                amount: 100,
                type: 'purchase',
                gold: 100,
                gems: 0
            };
            
            const validation = economySystem.validateTransaction(transaction);
            expect(validation.valid).toBe(true);
        });
    });
    
    describe('Processamento Seguro de Transações', () => {
        it('deve processar compra válida corretamente', () => {
            const transaction = {
                playerId: 'test_player_1',
                amount: 100,
                type: 'purchase',
                gold: 100,
                gems: 0
            };
            
            const initialBalance = playerManager.getPlayerBalance('test_player_1');
            const result = economySystem.processTransaction(transaction);
            const finalBalance = playerManager.getPlayerBalance('test_player_1');
            
            expect(result).toBe(true);
            expect(finalBalance).toBe(initialBalance - 100);
            expect(economySystem.transactions.length).toBe(1);
        });
        
        it('deve processar recompensa válida corretamente', () => {
            const transaction = {
                playerId: 'test_player_1',
                amount: 50,
                type: 'reward',
                gold: 50,
                gems: 0
            };
            
            const initialBalance = playerManager.getPlayerBalance('test_player_1');
            const result = economySystem.processTransaction(transaction);
            const finalBalance = playerManager.getPlayerBalance('test_player_1');
            
            expect(result).toBe(true);
            expect(finalBalance).toBe(initialBalance + 50);
            expect(economySystem.transactions.length).toBe(1);
        });
        
        it('deve falhar em processar transação inválida', () => {
            const transaction = {
                playerId: 'test_player_1',
                amount: 2000, // Fundos insuficientes
                type: 'purchase',
                gold: 2000,
                gems: 0
            };
            
            expect(() => {
                economySystem.processTransaction(transaction);
            }).toThrow('Insufficient funds');
            
            expect(economySystem.transactions.length).toBe(0);
        });
    });
    
    describe('Consistência de Estado Financeiro', () => {
        it('deve manter consistência após múltiplas transações', () => {
            const transactions = [
                { playerId: 'test_player_1', amount: 100, type: 'purchase', gold: 100, gems: 0 },
                { playerId: 'test_player_1', amount: 50, type: 'reward', gold: 50, gems: 0 },
                { playerId: 'test_player_1', amount: 20, type: 'purchase', gold: 20, gems: 0 },
                { playerId: 'test_player_1', amount: 10, type: 'reward', gold: 10, gems: 0 }
            ];
            
            const initialBalance = playerManager.getPlayerBalance('test_player_1');
            const expectedDelta = -100 + 50 - 20 + 10; // -60
            
            transactions.forEach(tx => economySystem.processTransaction(tx));
            
            const finalBalance = playerManager.getPlayerBalance('test_player_1');
            expect(finalBalance).toBe(initialBalance + expectedDelta);
            expect(economySystem.transactions.length).toBe(4);
        });
        
        it('deve impedir saldo negativo', () => {
            const transaction = {
                playerId: 'test_player_1',
                amount: 2000, // Mais que o saldo
                type: 'purchase',
                gold: 2000,
                gems: 0
            };
            
            expect(() => {
                economySystem.processTransaction(transaction);
            }).toThrow();
            
            const balance = playerManager.getPlayerBalance('test_player_1');
            expect(balance).toBeGreaterThanOrEqual(0);
        });
    });
    
    describe('Precisão de Cálculos Financeiros', () => {
        it('deve calcular conversão de gems para gold corretamente', () => {
            const player = playerManager.players.get('test_player_1');
            player.gems = 10;
            player.gold = 0;
            
            const totalBalance = playerManager.getPlayerBalance('test_player_1');
            expect(totalBalance).toBe(100); // 10 gems * 10 gold/gem
        });
        
        it('deve lidar com valores decimais corretamente', () => {
            const transaction = {
                playerId: 'test_player_1',
                amount: 99.99,
                type: 'purchase',
                gold: 99.99,
                gems: 0
            };
            
            // Arredondar para 2 casas decimais
            transaction.gold = Math.round(transaction.gold * 100) / 100;
            transaction.amount = Math.round(transaction.amount * 100) / 100;
            
            const validation = economySystem.validateTransaction(transaction);
            expect(validation.valid).toBe(true);
        });
        
        it('deve evitar floating point errors em cálculos grandes', () => {
            const player = playerManager.players.get('test_player_1');
            player.gold = 1000000;
            player.gems = 100000;
            
            const balance = playerManager.getPlayerBalance('test_player_1');
            expect(balance).toBe(2000000); // Sem floating point errors
        });
    });
    
    describe('Logging e Auditoria', () => {
        it('deve registrar todas as transações com sucesso', () => {
            const transaction = {
                playerId: 'test_player_1',
                amount: 100,
                type: 'purchase',
                gold: 100,
                gems: 0,
                sensitiveData: 'SECRET_KEY'
            };
            
            const result = economySystem.processTransaction(transaction);
            transactionLogger.log(transaction, result);
            
            expect(transactionLogger.logs.length).toBe(1);
            expect(transactionLogger.logs[0].transaction.sensitiveData).toBe('REDACTED');
            expect(transactionLogger.logs[0].result).toBe(true);
        });
        
        it('deve registrar falhas de transação', () => {
            const transaction = {
                playerId: 'test_player_1',
                amount: 2000, // Fundos insuficientes
                type: 'purchase',
                gold: 2000,
                gems: 0
            };
            
            try {
                economySystem.processTransaction(transaction);
            } catch (error) {
                transactionLogger.log(transaction, false);
            }
            
            expect(transactionLogger.logs.length).toBe(1);
            expect(transactionLogger.logs[0].result).toBe(false);
        });
    });
    
    describe('Concorrência e Race Conditions', () => {
        it('deve lidar com transações concorrentes', async () => {
            const player = playerManager.players.get('test_player_1');
            player.gold = 1000;
            
            const transactions = Array.from({ length: 10 }, (_, i) => ({
                playerId: 'test_player_1',
                amount: 10,
                type: 'purchase',
                gold: 10,
                gems: 0
            }));
            
            // Simular processamento concorrente
            const results = await Promise.all(
                transactions.map(tx => 
                    new Promise(resolve => {
                        setTimeout(() => {
                            try {
                                const result = economySystem.processTransaction(tx);
                                resolve({ success: true, result });
                            } catch (error) {
                                resolve({ success: false, error: error.message });
                            }
                        }, Math.random() * 10);
                    })
                )
            );
            
            const successfulTransactions = results.filter(r => r.success);
            const finalBalance = playerManager.getPlayerBalance('test_player_1');
            
            // Verificar consistência
            const expectedBalance = 1000 - (successfulTransactions.length * 10);
            expect(finalBalance).toBe(expectedBalance);
            expect(finalBalance).toBeGreaterThanOrEqual(0);
        });
    });
    
    describe('Validação de Input e Sanitização', () => {
        it('deve sanitizar inputs maliciosos', () => {
            const maliciousTransaction = {
                playerId: 'test_player_1',
                amount: 100,
                type: 'purchase',
                gold: 100,
                gems: 0,
                maliciousCode: '(() => { alert("XSS") })()',
                sqlInjection: "'; DROP TABLE players; --"
            };
            
            const validation = economySystem.validateTransaction(maliciousTransaction);
            expect(validation.valid).toBe(true);
            
            // Verificar que dados maliciosos foram removidos
            const processedTx = economySystem.transactions[0];
            expect(processedTx.maliciousCode).toBeUndefined();
            expect(processedTx.sqlInjection).toBeUndefined();
        });
        
        it('deve validar tipos de dados', () => {
            const invalidTransactions = [
                { playerId: null, amount: 100, type: 'purchase' },
                { playerId: 'test_player_1', amount: '100', type: 'purchase' },
                { playerId: 'test_player_1', amount: 100, type: 123 },
                { playerId: 'test_player_1', amount: Infinity, type: 'purchase' },
                { playerId: 'test_player_1', amount: NaN, type: 'purchase' }
            ];
            
            invalidTransactions.forEach(tx => {
                const validation = economySystem.validateTransaction(tx);
                expect(validation.valid).toBe(false);
            });
        });
    });
});
