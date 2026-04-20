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

  renderNPCs(ctx, camera, playerX, playerY) {
    // Calcular tempo para animações
    const time = Date.now() / 1000;
    
    for (const [id, npc] of this.npcs) {
      const screenX = npc.position.x - camera.x + ctx.canvas.width / 2;
      const screenY = npc.position.y - camera.y + ctx.canvas.height / 2 + (npc.animation?.offset || 0);

      // Verificar se player está próximo
      const canInteract = playerX !== undefined && playerY !== undefined && 
                         this.canInteractWithNPC(playerX, playerY, npc);
      
      // Efeito de pulso se pode interagir
      let pulseScale = 1;
      let glowIntensity = 0;
      if (canInteract) {
        pulseScale = 1 + Math.sin(time * 4) * 0.05;
        glowIntensity = 0.3 + Math.sin(time * 4) * 0.2;
      }

      // Glow effect quando pode interagir
      if (canInteract) {
        ctx.save();
        ctx.shadowColor = '#FFD700';
        ctx.shadowBlur = 15 + Math.sin(time * 4) * 5;
        ctx.fillStyle = `rgba(255, 215, 0, ${glowIntensity})`;
        ctx.fillRect(
          screenX - (npc.appearance.size * pulseScale)/2 - 4, 
          screenY - (npc.appearance.size * pulseScale)/2 - 4, 
          npc.appearance.size * pulseScale + 8, 
          npc.appearance.size * pulseScale + 8
        );
        ctx.restore();
      }

      // Draw NPC (com escala de pulso)
      ctx.fillStyle = npc.appearance.color;
      ctx.fillRect(
        screenX - (npc.appearance.size * pulseScale)/2, 
        screenY - (npc.appearance.size * pulseScale)/2, 
        npc.appearance.size * pulseScale, 
        npc.appearance.size * pulseScale
      );
      
      // Draw border
      ctx.strokeStyle = canInteract ? '#FFD700' : '#000000';
      ctx.lineWidth = canInteract ? 3 : 2;
      ctx.strokeRect(
        screenX - (npc.appearance.size * pulseScale)/2, 
        screenY - (npc.appearance.size * pulseScale)/2, 
        npc.appearance.size * pulseScale, 
        npc.appearance.size * pulseScale
      );
      
      // Draw symbol
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(npc.appearance.symbol, screenX, screenY - npc.appearance.size/2 - 8);
      
      // Draw name
      ctx.fillStyle = canInteract ? '#FFD700' : '#FFFFFF';
      ctx.font = canInteract ? 'bold 12px Arial' : '12px Arial';
      ctx.fillText(npc.name, screenX, screenY + npc.appearance.size/2 + 15);
      
      // Draw title
      ctx.fillStyle = '#FFD700';
      ctx.font = '10px Arial';
      ctx.fillText(npc.title, screenX, screenY + npc.appearance.size/2 + 28);
      
      // Indicador "Pressione E" flutuante
      if (canInteract) {
        this.renderInteractionPrompt(ctx, screenX, screenY - npc.appearance.size/2 - 35, time);
      }
      
      // Renderizar speech bubble se NPC estiver falando
      if (npc.speechBubble) {
        this.renderSpeechBubble(ctx, screenX, screenY - npc.appearance.size/2 - 45, npc.speechBubble);
      }
    }
  }
  
  renderInteractionPrompt(ctx, x, y, time) {
    const bounce = Math.sin(time * 6) * 3;
    const text = 'Pressione E';
    
    ctx.font = 'bold 11px Arial';
    const metrics = ctx.measureText(text);
    const padding = 8;
    const width = metrics.width + padding * 2;
    const height = 22;
    
    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.beginPath();
    ctx.roundRect(x - width/2, y + bounce - height/2, width, height, 4);
    ctx.fill();
    
    // Border
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Seta para baixo
    ctx.beginPath();
    ctx.moveTo(x - 6, y + bounce + height/2);
    ctx.lineTo(x, y + bounce + height/2 + 6);
    ctx.lineTo(x + 6, y + bounce + height/2);
    ctx.closePath();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fill();
    ctx.stroke();
    
    // Texto
    ctx.fillStyle = '#FFD700';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x, y + bounce);
  }
  
  renderSpeechBubble(ctx, x, y, bubble) {
    const time = Date.now();
    const age = time - bubble.startTime;
    const maxAge = bubble.duration || 3000;
    
    // Fade out
    if (age > maxAge - 500) {
      ctx.globalAlpha = (maxAge - age) / 500;
    }
    
    ctx.font = '12px Arial';
    const lines = this.wrapText(ctx, bubble.text, 150);
    const lineHeight = 16;
    const padding = 10;
    const width = 160;
    const height = lines.length * lineHeight + padding * 2;
    
    const bubbleX = x - width/2;
    const bubbleY = y - height;
    
    // Background
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.beginPath();
    ctx.roundRect(bubbleX, bubbleY, width, height, 8);
    ctx.fill();
    
    // Border
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Seta
    ctx.beginPath();
    ctx.moveTo(x - 8, bubbleY + height);
    ctx.lineTo(x, bubbleY + height + 8);
    ctx.lineTo(x + 8, bubbleY + height);
    ctx.closePath();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.fill();
    ctx.stroke();
    
    // Texto
    ctx.fillStyle = '#333';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    lines.forEach((line, i) => {
      ctx.fillText(line, x, bubbleY + padding + lineHeight/2 + i * lineHeight);
    });
    
    ctx.globalAlpha = 1;
  }
  
  wrapText(ctx, text, maxWidth) {
    const words = text.split(' ');
    const lines = [];
    let currentLine = words[0];
    
    for (let i = 1; i < words.length; i++) {
      const width = ctx.measureText(currentLine + ' ' + words[i]).width;
      if (width < maxWidth) {
        currentLine += ' ' + words[i];
      } else {
        lines.push(currentLine);
        currentLine = words[i];
      }
    }
    lines.push(currentLine);
    return lines;
  }
  
  showNPCSpeech(npcId, text, duration = 3000) {
    const npc = this.npcs.get(npcId);
    if (npc) {
      npc.speechBubble = {
        text,
        startTime: Date.now(),
        duration
      };
      
      // Auto-remove após duração
      setTimeout(() => {
        if (npc.speechBubble && npc.speechBubble.text === text) {
          npc.speechBubble = null;
        }
      }, duration);
    }
  }
}

window.NPCSystem = NPCSystem;

export default NPCSystem;
