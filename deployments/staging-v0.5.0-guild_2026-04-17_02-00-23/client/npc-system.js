// NPC System - Sistema de NPCs e Interação
class NPCSystem {
  constructor() {
    this.npcs = new Map();
    this.interactionRange = 80;
    this.activeDialog = null;
    this.dialogHistory = [];
    
    this.initializeNPCs();
  }

  initializeNPCs() {
    // NPCs da Vila de Korvien
    this.addNPC({
      id: 'captain_guard',
      name: 'Capitão Marcus',
      title: 'Capitão da Guarda',
      type: 'quest_giver',
      zone: 'korvien_village',
      position: { x: 500, y: 350 },
      appearance: {
        color: '#4169E1', // Royal blue
        size: 32,
        symbol: '🛡️'
      },
      dialog: {
        greeting: 'Bem-vindo, aventureiro! Sou o Capitão Marcus, responsável pela segurança desta vila.',
        quests: [
          {
            questId: 'q1_tutorial',
            text: 'Preciso de alguém para ajudar com uma tarefa simples. Você está interessado?',
            accept: 'Excelente! Fale comigo novamente quando estiver pronto.',
            decline: 'Uma pena. Volte quando mudar de ideia.'
          }
        ],
        farewell: 'Fique seguro nas suas jornadas!'
      },
      services: ['quest_giver', 'guard_info']
    });

    this.addNPC({
      id: 'merchant',
      name: 'Mercadora Elena',
      title: 'Comerciante',
      type: 'vendor',
      zone: 'korvien_village',
      position: { x: 700, y: 450 },
      appearance: {
        color: '#FFD700', // Gold
        size: 32,
        symbol: '🛒'
      },
      dialog: {
        greeting: 'Olá! Tenho os melhores itens da região! Que tal dar uma olhada?',
        shop: 'Aqui está o que tenho disponível:',
        farewell: 'Volte sempre! Tenho sempre novos produtos.'
      },
      services: ['vendor', 'buy', 'sell'],
      inventory: [
        { id: 'health_potion_small', name: 'Poção de Cura Pequena', price: 25, type: 'consumable', effect: { heal: 50 } },
        { id: 'mana_potion_small', name: 'Poção de Mana Pequena', price: 30, type: 'consumable', effect: { mana: 30 } },
        { id: 'basic_sword', name: 'Espada Básica', price: 100, type: 'weapon', damage: 15 },
        { id: 'leather_armor', name: 'Armadura de Couro', price: 150, type: 'armor', defense: 10 }
      ]
    });

    this.addNPC({
      id: 'herbalist',
      name: 'Ermitão Silas',
      title: 'Mestre das Ervas',
      type: 'quest_giver',
      zone: 'korvien_village',
      position: { x: 550, y: 500 },
      appearance: {
        color: '#228B22', // Forest green
        size: 32,
        symbol: '🌿'
      },
      dialog: {
        greeting: 'Ah, um jovem aventureiro! Eu estudo as propriedades mágicas das plantas destas florestas.',
        quests: [
          {
            questId: 'q3_woods_exploration',
            text: 'Estou pesquisando Ervas Antigas no Bosque. Você poderia me ajudar a coletar algumas?',
            accept: 'Perfeito! Traga-me 5 Ervas Antigas e eu recompensarei você.',
            decline: 'Entendo. É uma jornada perigosa.'
          }
        ],
        farewell: 'Que a natureza o guie em seu caminho.'
      },
      services: ['quest_giver', 'herbalism_info']
    });

    // NPCs da Floresta Antiga
    this.addNPC({
      id: 'forest_ranger',
      name: 'Guardião Theron',
      title: 'Guardião Florestal',
      type: 'quest_giver',
      zone: 'ancient_forest',
      position: { x: 700, y: 400 },
      appearance: {
        color: '#8B4513', // Saddle brown
        size: 32,
        symbol: '🏹'
      },
      dialog: {
        greeting: 'A floresta está inquiita ultimamente. Criaturas sombrias têm surgido das cavernas.',
        quests: [
          {
            questId: 'q4_cavern_boss',
            text: 'Preciso de um herói corajoso para enfrentar a ameaça nas Cavernas Sombrias.',
            accept: 'Sua coragem será lembrada! Cuidado, o Guardião das Cavernas é formidável.',
            decline: 'Entendo. Não é para qualquer um.'
          }
        ],
        farewell: 'Que a luz o proteja nas sombras.'
      },
      services: ['quest_giver', 'forest_info']
    });

    this.addNPC({
      id: 'mystic_merchant',
      name: 'Morgana',
      title: 'Mercadora Mística',
      type: 'vendor',
      zone: 'ancient_forest',
      position: { x: 900, y: 600 },
      appearance: {
        color: '#9400D3', // Violet
        size: 32,
        symbol: '🔮'
      },
      dialog: {
        greeting: 'Bem-vindo viajante! Eu vendo artefatos mágicos e itens encantados.',
        shop: 'Minha coleção contém objetos de grande poder:',
        farewell: 'Que as estrelas iluminem seu caminho.'
      },
      services: ['vendor', 'enchant', 'buy'],
      inventory: [
        { id: 'mana_potion', name: 'Poção de Mana', price: 50, type: 'consumable', effect: { mana: 50 } },
        { id: 'mystic_orb', name: 'Orbe Místico', price: 200, type: 'accessory', effect: { mana: 20, intelligence: 5 } },
        { id: 'enchanted_bow', name: 'Arco Encantado', price: 300, type: 'weapon', damage: 25, effect: { range: 150 } }
      ]
    });
  }

  addNPC(npc) {
    this.npcs.set(npc.id, npc);
  }

  getNPC(npcId) {
    return this.npcs.get(npcId);
  }

  getNPCsInZone(zoneId) {
    const zoneNPCs = [];
    for (const [id, npc] of this.npcs) {
      if (npc.zone === zoneId) {
        zoneNPCs.push(npc);
      }
    }
    return zoneNPCs;
  }

  getNearestNPC(playerX, playerY, zoneId) {
    const zoneNPCs = this.getNPCsInZone(zoneId);
    let nearestNPC = null;
    let nearestDistance = Infinity;

    zoneNPCs.forEach(npc => {
      const distance = this.calculateDistance(playerX, playerY, npc.position.x, npc.position.y);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestNPC = npc;
      }
    });

    return nearestNPC ? { npc: nearestNPC, distance: nearestDistance } : null;
  }

  canInteractWithNPC(playerX, playerY, npc) {
    const distance = this.calculateDistance(playerX, playerY, npc.position.x, npc.position.y);
    return distance <= this.interactionRange;
  }

  calculateDistance(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  }

  startInteraction(npc, player) {
    if (!npc || !player) return null;

    this.activeDialog = {
      npc,
      player,
      phase: 'greeting',
      currentQuest: null
    };

    // Log interaction
    this.dialogHistory.push({
      npcId: npc.id,
      timestamp: Date.now(),
      phase: 'start'
    });

    return this.getDialogResponse();
  }

  getDialogResponse() {
    if (!this.activeDialog) return null;

    const { npc, phase } = this.activeDialog;
    const dialog = npc.dialog;

    switch (phase) {
      case 'greeting':
        return {
          text: dialog.greeting,
          options: this.generateGreetingOptions(npc)
        };
      
      case 'quests':
        return this.handleQuestDialog();
      
      case 'shop':
        return this.handleShopDialog();
      
      case 'farewell':
        return {
          text: dialog.farewell,
          options: [{ text: 'Adeus', action: 'close' }]
        };
      
      default:
        return {
          text: '...',
          options: [{ text: 'Adeus', action: 'close' }]
        };
    }
  }

  generateGreetingOptions(npc) {
    const options = [];

    // Quest options
    if (npc.type === 'quest_giver' && npc.dialog.quests) {
      npc.dialog.quests.forEach(quest => {
        options.push({
          text: quest.text,
          action: 'quest',
          questId: quest.questId
        });
      });
    }

    // Shop options
    if (npc.type === 'vendor') {
      options.push({
        text: 'Ver sua loja',
        action: 'shop'
      });
    }

    // Service options
    if (npc.services) {
      npc.services.forEach(service => {
        if (service === 'guard_info') {
          options.push({
            text: 'Informações sobre a área',
            action: 'info'
          });
        }
      });
    }

    options.push({
      text: 'Adeus',
      action: 'farewell'
    });

    return options;
  }

  handleQuestDialog() {
    const { npc, currentQuest } = this.activeDialog;
    const quest = npc.dialog.quests.find(q => q.questId === currentQuest);

    if (!quest) {
      this.activeDialog.phase = 'greeting';
      return this.getDialogResponse();
    }

    return {
      text: quest.text,
      options: [
        {
          text: 'Aceitar',
          action: 'accept_quest',
          questId: quest.questId
        },
        {
          text: 'Recusar',
          action: 'decline_quest',
          questId: quest.questId
        },
        {
          text: 'Voltar',
          action: 'greeting'
        }
      ]
    };
  }

  handleShopDialog() {
    const { npc } = this.activeDialog;
    
    return {
      text: npc.dialog.shop,
      options: [
        {
          text: 'Comprar',
          action: 'buy',
          inventory: npc.inventory
        },
        {
          text: 'Vender',
          action: 'sell'
        },
        {
          text: 'Voltar',
          action: 'greeting'
        }
      ]
    };
  }

  handleDialogAction(action, data = {}) {
    if (!this.activeDialog) return null;

    const { npc } = this.activeDialog;

    switch (action) {
      case 'quest':
        this.activeDialog.phase = 'quests';
        this.activeDialog.currentQuest = data.questId;
        break;
      
      case 'accept_quest':
        this.activeDialog.phase = 'greeting';
        this.activeDialog.currentQuest = null;
        
        // Trigger quest start
        if (window.QuestSystem) {
          window.QuestSystem.startQuest(data.questId);
        }
        
        return {
          text: npc.dialog.quests.find(q => q.questId === data.questId).accept,
          options: [{ text: 'Entendido', action: 'close' }]
        };
      
      case 'decline_quest':
        this.activeDialog.phase = 'greeting';
        this.activeDialog.currentQuest = null;
        
        return {
          text: npc.dialog.quests.find(q => q.questId === data.questId).decline,
          options: [{ text: 'Entendido', action: 'close' }]
        };
      
      case 'shop':
        this.activeDialog.phase = 'shop';
        break;
      
      case 'farewell':
        this.activeDialog.phase = 'farewell';
        break;
      
      case 'close':
        this.endInteraction();
        return null;
      
      default:
        this.activeDialog.phase = 'greeting';
        break;
    }

    return this.getDialogResponse();
  }

  endInteraction() {
    if (this.activeDialog) {
      this.dialogHistory.push({
        npcId: this.activeDialog.npc.id,
        timestamp: Date.now(),
        phase: 'end'
      });
    }
    
    this.activeDialog = null;
  }

  updateNPCs(deltaTime) {
    // Simple idle animations for NPCs
    for (const [id, npc] of this.npcs) {
      if (!npc.animation) {
        npc.animation = {
          time: 0,
          offset: 0
        };
      }
      
      npc.animation.time += deltaTime;
      npc.animation.offset = Math.sin(npc.animation.time * 2) * 2;
    }
  }

  renderNPCs(ctx, camera) {
    for (const [id, npc] of this.npcs) {
      const screenX = npc.position.x - camera.x + ctx.canvas.width / 2;
      const screenY = npc.position.y - camera.y + ctx.canvas.height / 2 + (npc.animation?.offset || 0);

      // Draw NPC
      ctx.fillStyle = npc.appearance.color;
      ctx.fillRect(screenX - npc.appearance.size/2, screenY - npc.appearance.size/2, npc.appearance.size, npc.appearance.size);
      
      // Draw border
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.strokeRect(screenX - npc.appearance.size/2, screenY - npc.appearance.size/2, npc.appearance.size, npc.appearance.size);
      
      // Draw symbol
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(npc.appearance.symbol, screenX, screenY - npc.appearance.size/2 - 5);
      
      // Draw name
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '12px Arial';
      ctx.fillText(npc.name, screenX, screenY + npc.appearance.size/2 + 15);
      
      // Draw title
      ctx.fillStyle = '#FFD700';
      ctx.font = '10px Arial';
      ctx.fillText(npc.title, screenX, screenY + npc.appearance.size/2 + 28);
    }
  }
}

window.NPCSystem = NPCSystem;

export default NPCSystem;
