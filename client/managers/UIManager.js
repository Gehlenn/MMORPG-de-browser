/**
 * UIManager.js
 * Centraliza todas as atualizações de interface (MVP - Passo 2)
 * Responsabilidade: HUD, painéis, inventário, equipamento, XP
 */

class UIManager {
  constructor() {
    // Referências aos elementos DOM
    this.elements = {};
    
    // Cache de valores para evitar atualizações desnecessárias
    this.cache = {};
    
    // Throttle para atualizações
    this.lastUpdate = 0;
    this.updateInterval = 100; // ms
    
    this.initializeElements();
  }

  /**
   * Inicializa referências aos elementos DOM
   */
  initializeElements() {
    // Info do jogador
    this.elements.playerName = document.getElementById('playerName');
    this.elements.playerLevel = document.getElementById('playerLevel');
    
    // Barras
    this.elements.healthFill = document.getElementById('healthFill');
    this.elements.hpText = document.getElementById('hpText');
    this.elements.xpFill = document.getElementById('xpFill');
    this.elements.xpText = document.getElementById('xpText');
    this.elements.manaFill = document.getElementById('manaFill');
    this.elements.manaText = document.getElementById('manaText');
    
    // Info geral
    this.elements.positionText = document.getElementById('positionText');
    this.elements.mobCount = document.getElementById('mobCount');
    this.elements.fpsText = document.getElementById('fpsText');
    this.elements.playerCount = document.getElementById('playerCount');
    
    // Painéis
    this.elements.inventoryList = document.getElementById('inventoryList');
    this.elements.equipmentWeapon = document.getElementById('equipmentWeapon');
    this.elements.equipmentArmor = document.getElementById('equipmentArmor');
    this.elements.equipmentAccessory = document.getElementById('equipmentAccessory');
    this.elements.statsPanel = document.getElementById('statsPanel');
    this.elements.questList = document.getElementById('questList');
    
    // Chat
    this.elements.chatMessages = document.getElementById('chatMessages');
    this.elements.chatInput = document.getElementById('chatInput');
  }

  /**
   * Atualização principal do UI - chamada no game loop
   */
  update(playerData, worldData) {
    const now = Date.now();
    if (now - this.lastUpdate < this.updateInterval) return;
    this.lastUpdate = now;
    
    if (!playerData) return;
    
    this.updatePlayerInfo(playerData);
    this.updateBars(playerData);
    this.updateWorldInfo(worldData);
  }

  /**
   * Atualiza informações básicas do jogador
   */
  updatePlayerInfo(player) {
    if (!player) return;
    
    // Nome
    if (this.elements.playerName && this.cache.name !== player.name) {
      this.elements.playerName.textContent = player.name || 'Unknown';
      this.cache.name = player.name;
    }
    
    // Level
    const levelText = `Lv. ${player.level || 1}`;
    if (this.elements.playerLevel && this.cache.levelText !== levelText) {
      this.elements.playerLevel.textContent = levelText;
      this.cache.levelText = levelText;
    }
    
    // Posição
    if (this.elements.positionText && player.x !== undefined) {
      const posText = `${Math.round(player.x)}, ${Math.round(player.y)}`;
      if (this.cache.posText !== posText) {
        this.elements.positionText.textContent = posText;
        this.cache.posText = posText;
      }
    }
  }

  /**
   * Atualiza barras de HP, XP e Mana
   */
  updateBars(player) {
    if (!player) return;
    
    // HP
    if (this.elements.healthFill && this.elements.hpText) {
      const maxHp = player.maxHp || 100;
      const hp = Math.max(0, Math.min(maxHp, player.hp || 0));
      const hpPercent = (hp / maxHp) * 100;
      const hpText = `${hp}/${maxHp}`;
      
      if (this.cache.hpPercent !== hpPercent) {
        this.elements.healthFill.style.width = `${hpPercent}%`;
        this.cache.hpPercent = hpPercent;
      }
      
      if (this.cache.hpText !== hpText) {
        this.elements.hpText.textContent = hpText;
        this.cache.hpText = hpText;
      }
    }
    
    // XP
    if (this.elements.xpFill && this.elements.xpText) {
      const xpToNext = player.xpToNext || 100;
      const xp = Math.max(0, Math.min(xpToNext, player.xp || 0));
      const xpPercent = (xp / xpToNext) * 100;
      const xpText = `XP: ${xp}/${xpToNext}`;
      
      if (this.cache.xpPercent !== xpPercent) {
        this.elements.xpFill.style.width = `${xpPercent}%`;
        this.cache.xpPercent = xpPercent;
      }
      
      if (this.cache.xpText !== xpText) {
        this.elements.xpText.textContent = xpText;
        this.cache.xpText = xpText;
      }
    }
    
    // Mana
    if (this.elements.manaFill && this.elements.manaText) {
      const maxMana = player.maxMana || 50;
      const mana = Math.max(0, Math.min(maxMana, player.mana || 0));
      const manaPercent = (mana / maxMana) * 100;
      const manaText = `${mana}/${maxMana}`;
      
      if (this.cache.manaPercent !== manaPercent) {
        this.elements.manaFill.style.width = `${manaPercent}%`;
        this.cache.manaPercent = manaPercent;
      }
      
      if (this.cache.manaText !== manaText) {
        this.elements.manaText.textContent = manaText;
        this.cache.manaText = manaText;
      }
    }
  }

  /**
   * Atualiza informações do mundo
   */
  updateWorldInfo(worldData) {
    if (!worldData) return;
    
    // Contador de mobs
    if (this.elements.mobCount && worldData.mobCount !== undefined) {
      const mobText = `${worldData.mobCount} mobs`;
      if (this.cache.mobText !== mobText) {
        this.elements.mobCount.textContent = mobText;
        this.cache.mobText = mobText;
      }
    }
    
    // Contador de jogadores
    if (this.elements.playerCount && worldData.playerCount !== undefined) {
      const playerText = `${worldData.playerCount} online`;
      if (this.cache.playerText !== playerText) {
        this.elements.playerCount.textContent = playerText;
        this.cache.playerText = playerText;
      }
    }
    
    // FPS
    if (this.elements.fpsText && worldData.fps !== undefined) {
      const fpsText = `${Math.round(worldData.fps)} FPS`;
      if (this.cache.fpsText !== fpsText) {
        this.elements.fpsText.textContent = fpsText;
        this.cache.fpsText = fpsText;
      }
    }
  }

  /**
   * Atualiza painel de stats
   */
  updateStatsPanel(stats) {
    if (!stats || !this.elements.statsPanel) return;
    
    const content = `
      <div class="stat-row">Level: ${stats.level || 1}</div>
      <div class="stat-row">HP: ${stats.maxHp || 100}</div>
      <div class="stat-row">Attack: ${stats.attack || 10}</div>
      <div class="stat-row">Defense: ${stats.defense || 5}</div>
      <div class="stat-row">Speed: ${stats.speed || 1}</div>
    `;
    
    this.elements.statsPanel.innerHTML = content;
  }

  /**
   * Atualiza lista de inventário
   */
  updateInventory(inventory, onItemClick) {
    const list = this.elements.inventoryList;
    if (!list) return;
    
    list.innerHTML = '';
    
    if (!inventory || inventory.length === 0) {
      list.innerHTML = '<div style="color: #888; font-style: italic; padding: 8px;">Inventário vazio</div>';
      return;
    }
    
    inventory.forEach(item => {
      const el = document.createElement('div');
      el.className = 'inventory-item';
      el.style.cssText = `
        padding: 6px 8px;
        background: rgba(255,255,255,0.08);
        border: 1px solid rgba(255,255,255,0.1);
        border-radius: 6px;
        font-size: 13px;
        color: #fff;
        margin-bottom: 4px;
        cursor: pointer;
        display: flex;
        justify-content: space-between;
        align-items: center;
      `;
      
      const nameSpan = document.createElement('span');
      nameSpan.textContent = `${item.name} x${item.quantity || 1}`;
      
      el.appendChild(nameSpan);
      
      // Botão equipar se for equipável
      if (item.equippable && onItemClick) {
        const btn = document.createElement('button');
        btn.textContent = 'Equip';
        btn.style.cssText = `
          padding: 2px 6px;
          background: #4CAF50;
          border: none;
          border-radius: 3px;
          color: white;
          font-size: 10px;
          cursor: pointer;
        `;
        btn.onclick = () => onItemClick(item);
        el.appendChild(btn);
      }
      
      list.appendChild(el);
    });
  }

  /**
   * Atualiza painel de equipamento (3 slots simplificados)
   */
  updateEquipment(equipment, onUnequip) {
    const slots = {
      weapon: this.elements.equipmentWeapon,
      armor: this.elements.equipmentArmor,
      accessory: this.elements.equipmentAccessory
    };
    
    for (const [slot, element] of Object.entries(slots)) {
      if (!element) continue;
      
      const item = equipment?.[slot];
      
      if (item) {
        element.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span>${item.name}</span>
            ${onUnequip ? `<button onclick="${onUnequip('${slot}')}" style="padding: 2px 6px; background: #f44336; border: none; border-radius: 3px; color: white; font-size: 10px; cursor: pointer;">X</button>` : ''}
          </div>
          ${item.bonuses ? `
            <div style="font-size: 10px; color: #4CAF50; margin-top: 2px;">
              ${item.bonuses.attack ? `+${item.bonuses.attack} ATK ` : ''}
              ${item.bonuses.defense ? `+${item.bonuses.defense} DEF ` : ''}
              ${item.bonuses.maxHp ? `+${item.bonuses.maxHp} HP` : ''}
            </div>
          ` : ''}
        `;
      } else {
        element.innerHTML = `<span style="color: #666;">Empty (${slot})</span>`;
      }
    }
  }

  /**
   * Atualiza lista de quests
   */
  updateQuests(quests) {
    const list = this.elements.questList;
    if (!list) return;
    
    list.innerHTML = '';
    
    if (!quests || quests.length === 0) {
      list.innerHTML = '<div style="color: #888; text-align: center; padding: 10px;">Nenhuma quest ativa</div>';
      return;
    }
    
    quests.forEach(quest => {
      const isCompleted = quest.currentCount >= quest.requiredCount;
      
      const el = document.createElement('div');
      el.style.cssText = `
        padding: 8px;
        background: ${isCompleted ? 'rgba(76, 175, 80, 0.15)' : 'rgba(255,255,255,0.08)'};
        border: 1px solid ${isCompleted ? '#4CAF50' : 'rgba(255,255,255,0.1)'};
        border-radius: 6px;
        font-size: 12px;
        color: #fff;
        margin-bottom: 6px;
      `;
      
      el.innerHTML = `
        <div style="font-weight: bold; margin-bottom: 4px;">${quest.title}</div>
        <div style="font-size: 11px; color: #ccc; margin-bottom: 4px;">${quest.description}</div>
        <div style="font-size: 11px; color: ${isCompleted ? '#4CAF50' : '#9C27B0'};">
          ${isCompleted ? '✓ Completado!' : `Progresso: ${quest.currentCount}/${quest.requiredCount}`}
        </div>
      `;
      
      list.appendChild(el);
    });
  }

  /**
   * Adiciona mensagem ao chat
   */
  addChatMessage(message, color = '#FFFFFF', sender = null) {
    const chat = this.elements.chatMessages;
    if (!chat) return;
    
    const msg = document.createElement('div');
    msg.style.cssText = `
      color: ${color};
      margin-bottom: 4px;
      font-size: 12px;
      word-break: break-word;
    `;
    
    if (sender) {
      msg.innerHTML = `<span style="color: #4CAF50;">${sender}:</span> ${message}`;
    } else {
      msg.textContent = message;
    }
    
    chat.appendChild(msg);
    chat.scrollTop = chat.scrollHeight;
    
    // Limitar número de mensagens
    while (chat.children.length > 50) {
      chat.removeChild(chat.firstChild);
    }
  }

  /**
   * Mostra dano flutuante na tela
   */
  showDamage(x, y, damage, isCrit = false) {
    const container = document.getElementById('gameCanvas') || document.body;
    const rect = container.getBoundingClientRect ? container.getBoundingClientRect() : { left: 0, top: 0 };
    
    const el = document.createElement('div');
    el.textContent = damage;
    el.style.cssText = `
      position: fixed;
      left: ${rect.left + x}px;
      top: ${rect.top + y}px;
      color: ${isCrit ? '#ff4444' : '#ffaa00'};
      font-size: ${isCrit ? '24px' : '18px'};
      font-weight: bold;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
      pointer-events: none;
      z-index: 9999;
      animation: floatUp 1s ease-out forwards;
    `;
    
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1000);
  }

  /**
   * Mostra XP ganho flutuante
   */
  showXpGain(amount, isShared = false) {
    const el = document.createElement('div');
    el.textContent = isShared ? `+${amount} XP (shared)` : `+${amount} XP`;
    el.style.cssText = `
      position: fixed;
      left: 40px;
      bottom: 80px;
      color: #90caf9;
      font-weight: bold;
      font-size: 16px;
      text-shadow: 0 1px 3px rgba(0,0,0,0.8);
      animation: floatUp 1.5s ease-out forwards;
      pointer-events: none;
      z-index: 9999;
    `;
    
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1500);
  }

  /**
   * Mostra notificação de level up
   */
  showLevelUp(level) {
    const el = document.createElement('div');
    el.innerHTML = `
      <div style="font-size: 24px; font-weight: bold; color: #FFD700;">LEVEL UP!</div>
      <div style="font-size: 18px; color: #FFF;">Você alcançou o nível ${level}!</div>
    `;
    el.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(0,0,0,0.9);
      border: 3px solid #FFD700;
      border-radius: 12px;
      padding: 30px 50px;
      text-align: center;
      z-index: 10000;
      animation: pulse 0.5s ease-in-out 3;
    `;
    
    document.body.appendChild(el);
    
    setTimeout(() => {
      el.style.transition = 'opacity 0.5s';
      el.style.opacity = '0';
      setTimeout(() => el.remove(), 500);
    }, 2000);
  }

  /**
   * Mostra mensagem de sistema (join/leave)
   */
  showSystemMessage(message, type = 'info') {
    const colors = {
      join: '#4CAF50',
      leave: '#f44336',
      info: '#2196F3',
      error: '#ff5722'
    };
    
    this.addChatMessage(`[Sistema] ${message}`, colors[type] || colors.info);
  }

  /**
   * Cria painel de jogadores online se não existir
   */
  createOnlinePlayersPanel() {
    if (document.getElementById('onlinePlayersPanel')) return;
    
    const panel = document.createElement('div');
    panel.id = 'onlinePlayersPanel';
    panel.style.cssText = `
      position: fixed;
      top: 80px;
      right: 16px;
      width: 160px;
      max-height: 250px;
      overflow-y: auto;
      background: rgba(0,0,0,0.85);
      border: 2px solid #4CAF50;
      border-radius: 8px;
      padding: 10px;
      z-index: 1000;
    `;
    
    document.body.appendChild(panel);
    return panel;
  }

  /**
   * Atualiza painel de jogadores online
   */
  updateOnlinePlayers(players) {
    let panel = document.getElementById('onlinePlayersPanel');
    if (!panel) {
      panel = this.createOnlinePlayersPanel();
    }
    
    const count = players?.length || 0;
    
    let html = `
      <div style="color: #4CAF50; font-weight: bold; font-size: 13px; text-align: center; margin-bottom: 8px;">
        👥 Online: ${count}
      </div>
    `;
    
    if (players && players.length > 0) {
      players.slice(0, 8).forEach(p => {
        html += `
          <div style="
            padding: 4px 6px;
            background: rgba(255,255,255,0.08);
            border-radius: 4px;
            font-size: 11px;
            color: #fff;
            margin-bottom: 3px;
            display: flex;
            justify-content: space-between;
          ">
            <span>${p.name || 'Unknown'}</span>
            <span style="color: #FFD54F;">Lv.${p.level || 1}</span>
          </div>
        `;
      });
      
      if (players.length > 8) {
        html += `<div style="color: #888; font-size: 10px; text-align: center;">+${players.length - 8} mais...</div>`;
      }
    }
    
    panel.innerHTML = html;
  }

  /**
   * Limpa cache forçando atualização na próxima vez
   */
  clearCache() {
    this.cache = {};
  }
}

// Adicionar CSS para animações
if (!document.getElementById('ui-animations')) {
  const style = document.createElement('style');
  style.id = 'ui-animations';
  style.textContent = `
    @keyframes floatUp {
      0% { transform: translateY(0) scale(1); opacity: 1; }
      100% { transform: translateY(-30px) scale(1.1); opacity: 0; }
    }
    
    @keyframes pulse {
      0%, 100% { transform: translate(-50%, -50%) scale(1); }
      50% { transform: translate(-50%, -50%) scale(1.05); }
    }
  `;
  document.head.appendChild(style);
}

window.UIManager = UIManager;
