/**
 * BagSystem.test.js - Testes para o sistema de bags estilo WoW
 * @version 1.0.0
 */

const BagSystem = require('../server/systems/BagSystem');

describe('BagSystem', () => {
    let bagSystem;
    let inventory;

    beforeEach(() => {
        bagSystem = new BagSystem();
        inventory = bagSystem.initializePlayerInventory('player_123');
    });

    describe('Inicialização', () => {
        test('deve inicializar inventário com backpack de 20 slots', () => {
            expect(inventory.backpack.slots).toHaveLength(20);
            expect(inventory.backpack.type).toBe('backpack');
        });

        test('deve ter 4 slots para bags', () => {
            expect(inventory.bagSlots).toHaveLength(4);
        });

        test('primeiros 3 slots de bag devem estar desbloqueados', () => {
            expect(inventory.bagSlots[0].unlocked).toBe(true);
            expect(inventory.bagSlots[1].unlocked).toBe(true);
            expect(inventory.bagSlots[2].unlocked).toBe(true);
        });

        test('4º slot de bag deve estar bloqueado', () => {
            expect(inventory.bagSlots[3].unlocked).toBe(false);
        });

        test('banco deve iniciar com 24 slots', () => {
            expect(inventory.bank.slots).toHaveLength(24);
            expect(inventory.bank.unlockedSlots).toBe(24);
        });

        test('estatísticas devem refletir slots iniciais', () => {
            expect(inventory.totalSlots).toBe(20);
            expect(inventory.usedSlots).toBe(0);
            expect(inventory.freeSlots).toBe(20);
        });
    });

    describe('Equipar Bags', () => {
        test('deve equipar uma bag de pano com sucesso', () => {
            const result = bagSystem.equipBag(inventory, 0, 'CLOTH_BAG');
            
            expect(result.success).toBe(true);
            expect(inventory.bagSlots[0].bag).not.toBeNull();
            expect(inventory.bagSlots[0].bag.type).toBe('CLOTH_BAG');
            expect(inventory.totalSlots).toBe(26); // 20 + 6
        });

        test('deve equipar múltiplas bags', () => {
            bagSystem.equipBag(inventory, 0, 'CLOTH_BAG');      // +6 slots
            bagSystem.equipBag(inventory, 1, 'LEATHER_BAG');   // +8 slots
            bagSystem.equipBag(inventory, 2, 'REINFORCED_BAG'); // +10 slots
            
            expect(inventory.totalSlots).toBe(44); // 20 + 6 + 8 + 10
        });

        test('deve falhar ao equipar em slot bloqueado', () => {
            const result = bagSystem.equipBag(inventory, 3, 'CLOTH_BAG');
            
            expect(result.success).toBe(false);
            expect(result.error).toContain('bloqueado');
        });

        test('deve falhar ao equipar em slot ocupado', () => {
            bagSystem.equipBag(inventory, 0, 'CLOTH_BAG');
            const result = bagSystem.equipBag(inventory, 0, 'LEATHER_BAG');
            
            expect(result.success).toBe(false);
            expect(result.error).toContain('já possui');
        });

        test('deve falhar com tipo de bag inválido', () => {
            const result = bagSystem.equipBag(inventory, 0, 'INVALID_BAG');
            
            expect(result.success).toBe(false);
            expect(result.error).toContain('inválido');
        });
    });

    describe('Desequipar Bags', () => {
        test('deve desequipar bag vazia com sucesso', () => {
            bagSystem.equipBag(inventory, 0, 'CLOTH_BAG');
            const result = bagSystem.unequipBag(inventory, 0);
            
            expect(result.success).toBe(true);
            expect(inventory.bagSlots[0].bag).toBeNull();
            expect(inventory.totalSlots).toBe(20);
        });

        test('deve mover itens ao desequipar', () => {
            // Equipar bag
            bagSystem.equipBag(inventory, 0, 'CLOTH_BAG');
            
            // Encher backpack para forçar item a ir para a bag
            for (let i = 0; i < 20; i++) {
                bagSystem.addItem(inventory, { 
                    id: `filler_${i}`, 
                    name: `Filler ${i}`, 
                    icon: '📦',
                    quality: 'common'
                });
            }
            
            // Adicionar item que vai para a bag (backpack cheia)
            const item = { id: 'potion', name: 'Poção', icon: '🧪', quality: 'common' };
            bagSystem.addItem(inventory, item);
            
            // Verificar que foi para a bag
            expect(inventory.bagSlots[0].bag.slots[0].item).not.toBeNull();
            expect(inventory.bagSlots[0].bag.slots[0].item.name).toBe('Poção');
            
            // Remover um item da backpack para liberar slot
            bagSystem.removeItem(inventory, -1, 0, 1);
            
            // Desequipar
            const result = bagSystem.unequipBag(inventory, 0);
            
            expect(result.success).toBe(true);
            // Item deve ter sido movido para backpack slot 0 (agora vazio)
            expect(inventory.backpack.slots[0].item).not.toBeNull();
            expect(inventory.backpack.slots[0].item.name).toBe('Poção');
        });

        test('deve falhar se não houver espaço na backpack', () => {
            // Encher a backpack
            for (let i = 0; i < 20; i++) {
                bagSystem.addItem(inventory, { 
                    id: `item_${i}`, 
                    name: `Item ${i}`, 
                    icon: '📦',
                    quality: 'common'
                });
            }
            
            bagSystem.equipBag(inventory, 0, 'CLOTH_BAG');
            bagSystem.addItem(inventory, { id: 'extra', name: 'Extra', icon: '📦', quality: 'common' });
            
            const result = bagSystem.unequipBag(inventory, 0);
            
            expect(result.success).toBe(false);
            expect(result.error).toContain('Espaço insuficiente');
        });

        test('deve falhar ao desequipar slot vazio', () => {
            const result = bagSystem.unequipBag(inventory, 0);
            
            expect(result.success).toBe(false);
            expect(result.error).toContain('equipada');
        });
    });

    describe('Adicionar Itens', () => {
        test('deve adicionar item a slot vazio', () => {
            const item = { id: 'sword', name: 'Espada', icon: '⚔️', quality: 'common' };
            const result = bagSystem.addItem(inventory, item);
            
            expect(result.success).toBe(true);
            expect(inventory.backpack.slots[0].item).not.toBeNull();
            expect(inventory.backpack.slots[0].item.name).toBe('Espada');
        });

        test('deve stackar itens iguais', () => {
            const item = { 
                id: 'potion', 
                name: 'Poção de Vida', 
                icon: '🧪', 
                quality: 'common',
                stackable: true
            };
            
            bagSystem.addItem(inventory, item, 10);
            bagSystem.addItem(inventory, item, 15);
            
            expect(inventory.backpack.slots[0].count).toBe(25);
        });

        test('deve respeitar limite de stack de 99', () => {
            const item = { 
                id: 'arrow', 
                name: 'Flecha', 
                icon: '🏹', 
                quality: 'common',
                stackable: true
            };
            
            bagSystem.addItem(inventory, item, 90);
            bagSystem.addItem(inventory, item, 20);
            
            // Deve criar novo stack
            expect(inventory.backpack.slots[0].count).toBe(99);
            expect(inventory.backpack.slots[1].count).toBe(11);
        });

        test('deve falhar quando inventário cheio', () => {
            // Encher inventário
            for (let i = 0; i < 20; i++) {
                bagSystem.addItem(inventory, { 
                    id: `item_${i}`, 
                    name: `Item ${i}`, 
                    icon: '📦',
                    quality: 'common'
                });
            }
            
            const result = bagSystem.addItem(inventory, { 
                id: 'extra', 
                name: 'Extra', 
                icon: '📦',
                quality: 'common'
            });
            
            expect(result.success).toBe(false);
            expect(result.inventoryFull).toBe(true);
        });

        test('deve marcar item como bound ao adicionar (BoP)', () => {
            const item = { 
                id: 'legendary_sword', 
                name: 'Espada Lendária', 
                icon: '⚔️', 
                quality: 'legendary',
                bindOnPickup: true
            };
            
            bagSystem.addItem(inventory, item);
            
            expect(inventory.backpack.slots[0].item.bound).toBe(true);
            expect(inventory.backpack.slots[0].item.boundTo).toBe('player_123');
        });
    });

    describe('Remover Itens', () => {
        test('deve remover item completamente', () => {
            const item = { id: 'sword', name: 'Espada', icon: '⚔️', quality: 'common' };
            bagSystem.addItem(inventory, item);
            
            const result = bagSystem.removeItem(inventory, -1, 0, 1);
            
            expect(result.success).toBe(true);
            expect(inventory.backpack.slots[0].item).toBeNull();
        });

        test('deve remover quantidade parcial de stack', () => {
            const item = { 
                id: 'potion', 
                name: 'Poção', 
                icon: '🧪', 
                quality: 'common',
                stackable: true
            };
            bagSystem.addItem(inventory, item, 50);
            
            const result = bagSystem.removeItem(inventory, -1, 0, 10);
            
            expect(result.success).toBe(true);
            expect(result.remaining).toBe(40);
            expect(inventory.backpack.slots[0].count).toBe(40);
        });

        test('deve falhar ao remover mais que o disponível', () => {
            const item = { id: 'sword', name: 'Espada', icon: '⚔️', quality: 'common' };
            bagSystem.addItem(inventory, item);
            
            const result = bagSystem.removeItem(inventory, -1, 0, 5);
            
            expect(result.success).toBe(false);
            expect(result.error).toContain('Quantidade insuficiente');
        });

        test('deve falhar ao remover de slot vazio', () => {
            const result = bagSystem.removeItem(inventory, -1, 0, 1);
            
            expect(result.success).toBe(false);
            expect(result.error).toContain('Slot vazio');
        });
    });

    describe('Mover Itens', () => {
        test('deve mover item entre slots', () => {
            const item = { id: 'sword', name: 'Espada', icon: '⚔️', quality: 'common' };
            bagSystem.addItem(inventory, item);
            
            const result = bagSystem.moveItem(inventory, -1, 0, -1, 5);
            
            expect(result.success).toBe(true);
            expect(inventory.backpack.slots[0].item).toBeNull();
            expect(inventory.backpack.slots[5].item).not.toBeNull();
            expect(inventory.backpack.slots[5].item.name).toBe('Espada');
        });

        test('deve stackar ao mover para slot com item igual', () => {
            const item = { 
                id: 'potion', 
                name: 'Poção', 
                icon: '🧪', 
                quality: 'common',
                stackable: true
            };
            
            // Adicionar primeiro stack no slot 0 (cheio com 99)
            bagSystem.addItem(inventory, item, 99);
            // Segundo stack vai para slot 1 com 15
            bagSystem.addItem(inventory, item, 15);
            
            // Verificar configuração inicial
            expect(inventory.backpack.slots[0].count).toBe(99);
            expect(inventory.backpack.slots[1].count).toBe(15);
            
            // Mover 15 do slot 1 para slot 0 (stackar 99 + 0, mas slot 0 já está cheio)
            // Na verdade, vamos mover do slot 1 para um slot vazio 2
            // E depois testar stack entre slot 1 e 2
            const item2 = {
                id: 'potion2',
                name: 'Poção2',
                icon: '🧪',
                quality: 'common',
                stackable: true
            };
            // Limpar slots primeiro para garantir estado limpo
            inventory.backpack.slots[2].item = null;
            inventory.backpack.slots[2].count = 0;
            inventory.backpack.slots[3].item = null;
            inventory.backpack.slots[3].count = 0;
            
            // Usar IDs diferentes para garantir que não stackem automaticamente
            const item3 = {
                id: 'potion3',
                name: 'Poção3',
                icon: '🧪',
                quality: 'common',
                stackable: true
            };
            
            // Adicionar itens em slots específicos manualmente para garantir controle
            inventory.backpack.slots[2].item = { ...item2 };
            inventory.backpack.slots[2].count = 10;
            inventory.backpack.slots[3].item = { ...item2 };
            inventory.backpack.slots[3].count = 5;
            
            // Verificar configuração inicial
            expect(inventory.backpack.slots[2].count).toBe(10);
            expect(inventory.backpack.slots[3].count).toBe(5);
            
            // Verificar itens antes de mover
            expect(inventory.backpack.slots[2].item.id).toBe('potion2');
            expect(inventory.backpack.slots[3].item.id).toBe('potion2');
            
            // Mover do slot 3 para slot 2 (stackar 10 + 5 = 15)
            const result = bagSystem.moveItem(inventory, -1, 3, -1, 2);
            
            // Se não stackou, verificar o que aconteceu
            if (!result.success || inventory.backpack.slots[2].count !== 15) {
                console.log('Move result:', result);
                console.log('Slot 2:', inventory.backpack.slots[2]);
                console.log('Slot 3:', inventory.backpack.slots[3]);
            }
            
            expect(result.success).toBe(true);
            expect(inventory.backpack.slots[2].count).toBe(15);
            expect(inventory.backpack.slots[3].item).toBeNull();
        });

        test('deve trocar itens entre slots', () => {
            const item1 = { id: 'sword', name: 'Espada', icon: '⚔️', quality: 'common' };
            const item2 = { id: 'shield', name: 'Escudo', icon: '🛡️', quality: 'common' };
            
            bagSystem.addItem(inventory, item1);
            inventory.backpack.slots[1].item = { ...item2 };
            inventory.backpack.slots[1].count = 1;
            
            const result = bagSystem.moveItem(inventory, -1, 0, -1, 1);
            
            expect(result.success).toBe(true);
            expect(inventory.backpack.slots[0].item.name).toBe('Escudo');
            expect(inventory.backpack.slots[1].item.name).toBe('Espada');
        });
    });

    describe('Equipar/Desequipar Itens', () => {
        test('deve equipar item', () => {
            const item = { 
                id: 'sword', 
                name: 'Espada', 
                icon: '⚔️', 
                quality: 'rare',
                equipSlot: 'weapon'
            };
            bagSystem.addItem(inventory, item);
            
            const result = bagSystem.equipItem(inventory, -1, 0);
            
            expect(result.success).toBe(true);
            expect(inventory.equipment.weapon).not.toBeNull();
            expect(inventory.equipment.weapon.name).toBe('Espada');
        });

        test('deve marcar BoE como bound ao equipar', () => {
            const item = { 
                id: 'rare_sword', 
                name: 'Espada Rara', 
                icon: '⚔️', 
                quality: 'rare',
                equipSlot: 'weapon',
                bindOnEquip: true
            };
            bagSystem.addItem(inventory, item);
            
            bagSystem.equipItem(inventory, -1, 0);
            
            expect(inventory.equipment.weapon.bound).toBe(true);
            expect(inventory.equipment.weapon.boundTo).toBe('player_123');
        });

        test('deve desequipar item para slot vazio', () => {
            const item = { 
                id: 'sword', 
                name: 'Espada', 
                icon: '⚔️', 
                quality: 'common',
                equipSlot: 'weapon'
            };
            inventory.equipment.weapon = { ...item };
            
            const result = bagSystem.unequipItem(inventory, 'weapon');
            
            expect(result.success).toBe(true);
            expect(inventory.equipment.weapon).toBeNull();
            // Verificar que item foi para algum slot vazio na backpack
            const itemInBackpack = inventory.backpack.slots.some(s => s.item && s.item.id === 'sword');
            expect(itemInBackpack).toBe(true);
        });

        test('deve falhar ao desequipar sem espaço', () => {
            // Encher inventário
            for (let i = 0; i < 20; i++) {
                bagSystem.addItem(inventory, { 
                    id: `item_${i}`, 
                    name: `Item ${i}`, 
                    icon: '📦',
                    quality: 'common'
                });
            }
            
            inventory.equipment.weapon = { 
                id: 'sword', 
                name: 'Espada', 
                icon: '⚔️', 
                quality: 'common',
                equipSlot: 'weapon'
            };
            
            const result = bagSystem.unequipItem(inventory, 'weapon');
            
            expect(result.success).toBe(false);
            expect(result.error).toBe('Inventário cheio');
        });
    });

    describe('Banco', () => {
        test('deve expandir banco com sucesso', () => {
            const result = bagSystem.expandBank(inventory, 12);
            
            expect(result.success).toBe(true);
            expect(inventory.bank.slots).toHaveLength(36);
            expect(inventory.bank.unlockedSlots).toBe(36);
        });

        test('deve respeitar limite máximo de 48 slots', () => {
            const result = bagSystem.expandBank(inventory, 30); // Tentar ir para 54
            
            expect(result.success).toBe(false);
            expect(result.error).toContain('48');
        });
    });

    describe('Gold', () => {
        test('deve adicionar copper corretamente', () => {
            const result = bagSystem.addGold(inventory, 150);
            
            expect(result.copper).toBe(50);
            expect(result.silver).toBe(1);
        });

        test('deve converter silver para gold', () => {
            bagSystem.addGold(inventory, 15000); // 1 gold, 50 silver
            
            expect(inventory.gold).toBe(1);
            expect(inventory.silver).toBe(50);
            expect(inventory.copper).toBe(0);
        });

        test('deve remover gold corretamente', () => {
            bagSystem.addGold(inventory, 150); // 1 silver, 50 copper
            const result = bagSystem.removeGold(inventory, 50);
            
            expect(result.success).toBe(true);
            expect(result.copper).toBe(0);
            expect(result.silver).toBe(1);
        });

        test('deve falhar ao remover mais gold que disponível', () => {
            bagSystem.addGold(inventory, 50);
            const result = bagSystem.removeGold(inventory, 100);
            
            expect(result.success).toBe(false);
            expect(result.error).toBe('Gold insuficiente');
        });
    });

    describe('Serialização', () => {
        test('deve serializar inventário corretamente', () => {
            const item = { id: 'sword', name: 'Espada', icon: '⚔️', quality: 'common' };
            bagSystem.addItem(inventory, item);
            bagSystem.equipBag(inventory, 0, 'CLOTH_BAG');
            
            const serialized = bagSystem.serializeForClient(inventory);
            
            expect(serialized.backpack.slots).toHaveLength(20);
            expect(serialized.bagSlots).toHaveLength(4);
            expect(serialized.stats.totalSlots).toBe(26);
        });

        test('deve serializar item sem dados internos', () => {
            const item = { 
                id: 'sword', 
                name: 'Espada', 
                icon: '⚔️', 
                quality: 'common',
                internalData: 'should not appear'
            };
            
            const serialized = bagSystem.serializeItem(item);
            
            expect(serialized.id).toBe('sword');
            expect(serialized.internalData).toBeUndefined();
        });
    });
});
