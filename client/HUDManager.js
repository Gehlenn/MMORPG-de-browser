// HUDManager - Gerenciador de Interface do Jogo
class HUDManager {
  constructor() {
    this.elements = {
      playerName: document.getElementById('playerName'),
      playerLevel: document.getElementById('playerLevel'),
      healthFill: document.getElementById('healthFill'),
      hpText: document.getElementById('hpText'),
      xpFill: document.getElementById('xpFill'),
      xpText: document.getElementById('xpText'),
      positionText: document.getElementById('positionText'),
      mobCount: document.getElementById('mobCount'),
      fpsText: document.getElementById('fpsText'),
      chatMessages: document.getElementById('chatMessages'),
      chatInput: document.getElementById('chatInput'),
      chatSend: document.getElementById('chatSend')
    };
    
    this.lastUpdate = 0;
    this.updateInterval = 100; // ms
  }

  update(player, mobCount, fps) {
    const now = Date.now();
    if (now - this.lastUpdate < this.updateInterval) return;
    
    if (!player) return;
    
    try {
      // Informações do jogador
      if (this.elements.playerName) {
        this.elements.playerName.textContent = player.name || 'Player';
      }
      
      if (this.elements.playerLevel) {
        this.elements.playerLevel.textContent = `Lv. ${player.level || 1}`;
      }
      
      // Barra de vida
      if (this.elements.healthFill) {
        const maxHealth = player.maxHealth || 100;
        const health = player.health || 0;
        const percentage = Math.max(0, Math.min(100, (health / maxHealth) * 100));
        this.elements.healthFill.style.width = `${percentage}%`;
      }
      
      if (this.elements.hpText) {
        this.elements.hpText.textContent = `${player.health || 0}/${player.maxHealth || 0}`;
      }
      
      // Barra de XP
      if (this.elements.xpFill) {
        const maxXp = player.xpToNextLevel || 100;
        const xp = player.xp || 0;
        const percentage = Math.max(0, Math.min(100, (xp / maxXp) * 100));
        this.elements.xpFill.style.width = `${percentage}%`;
      }
      
      if (this.elements.xpText) {
        const xp = player.xp || 0;
        const maxXp = player.xpToNextLevel || 100;
        this.elements.xpText.textContent = `XP: ${xp}/${maxXp}`;
      }
      
      // Posição
      if (this.elements.positionText) {
        const x = Math.round(player.x || 0);
        const y = Math.round(player.y || 0);
        this.elements.positionText.textContent = `${x}, ${y}`;
      }
      
      // Contadores
      if (this.elements.mobCount) {
        this.elements.mobCount.textContent = `${mobCount || 0} mobs`;
      }
      
      if (this.elements.fpsText) {
        this.elements.fpsText.textContent = `${Math.round(fps || 0)} FPS`;
      }
      
      this.lastUpdate = now;
      
    } catch (error) {
      console.error('❌ Erro ao atualizar HUD:', error);
    }
  }

  addChatMessage(message, color = '#FFFFFF') {
    if (!this.elements.chatMessages) return;
    
    try {
      const msg = document.createElement('div');
      msg.textContent = message;
      msg.style.color = color;
      msg.style.marginBottom = '4px';
      msg.style.fontSize = '12px';
      
      this.elements.chatMessages.appendChild(msg);
      
      // Auto-scroll para última mensagem
      this.elements.chatMessages.scrollTop = this.elements.chatMessages.scrollHeight;
      
      // Limitar número de mensagens
      const maxMessages = 50;
      while (this.elements.chatMessages.children.length > maxMessages) {
        this.elements.chatMessages.removeChild(this.elements.chatMessages.firstChild);
      }
      
    } catch (error) {
      console.error('❌ Erro ao adicionar mensagem ao chat:', error);
    }
  }

  clearChat() {
    if (this.elements.chatMessages) {
      this.elements.chatMessages.innerHTML = '';
    }
  }

  show() {
    // Mostrar todos os elementos do HUD
    Object.values(this.elements).forEach(element => {
      if (element) {
        element.style.display = element.style.display === 'none' ? 'block' : element.style.display;
      }
    });
  }

  hide() {
    // Esconder todos os elementos do HUD
    Object.values(this.elements).forEach(element => {
      if (element) {
        element.style.display = 'none';
      }
    });
  }

  setChatInput(callback) {
    if (this.elements.chatInput && this.elements.chatSend) {
      this.elements.chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          const message = this.elements.chatInput.value.trim();
          if (message) {
            callback(message);
            this.elements.chatInput.value = '';
          }
        }
      });
      
      this.elements.chatSend.addEventListener('click', () => {
        const message = this.elements.chatInput.value.trim();
        if (message) {
          callback(message);
          this.elements.chatInput.value = '';
        }
      });
    }
  }

  getPlayerStats() {
    return {
      name: this.elements.playerName?.textContent || 'Player',
      level: parseInt(this.elements.playerLevel?.textContent?.replace('Lv. ', '') || 1),
      health: parseInt(this.elements.hpText?.textContent?.split('/')[0] || 0),
      maxHealth: parseInt(this.elements.hpText?.textContent?.split('/')[1] || 100)
    };
  }

  /**
   * NOVO: Atualiza painel de jogadores online (MVP - Passo 6)
   * @param {Array} players - Lista de jogadores online [{ id, name, level }]
   * @param {number} maxPlayers - Máximo de jogadores a mostrar na lista (default: 10)
   */
  updateOnlinePlayersPanel(players, maxPlayers = 10) {
    // Criar painel se não existir
    let onlinePanel = document.getElementById('onlinePlayersPanel');
    if (!onlinePanel) {
      onlinePanel = document.createElement('div');
      onlinePanel.id = 'onlinePlayersPanel';
      onlinePanel.className = 'ui-panel online-players-panel';
      onlinePanel.style.cssText = `
        position: fixed;
        top: 80px;
        right: 16px;
        width: 180px;
        max-height: 300px;
        overflow-y: auto;
        background: rgba(0, 0, 0, 0.85);
        border: 2px solid #4CAF50;
        border-radius: 8px;
        padding: 12px;
        z-index: 1000;
        backdrop-filter: blur(8px);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
      `;
      document.body.appendChild(onlinePanel);
    }

    const playerCount = players?.length || 0;
    
    onlinePanel.innerHTML = `
      <div class="panel-title" style="color: #4CAF50; font-weight: bold; font-size: 14px; margin-bottom: 8px; text-align: center; text-shadow: 0 1px 3px rgba(0,0,0,0.7);">
        👥 Online: ${playerCount}
      </div>
    `;

    if (!players || players.length === 0) {
      onlinePanel.innerHTML += '<div style="color: #888; font-size: 12px; text-align: center;">Nenhum jogador online</div>';
      return;
    }

    // Mostrar apenas os primeiros maxPlayers jogadores
    const displayPlayers = players.slice(0, maxPlayers);
    
    displayPlayers.forEach(player => {
      const el = document.createElement('div');
      el.style.cssText = `
        padding: 6px 8px;
        background: rgba(255,255,255,0.08);
        border: 1px solid rgba(255,255,255,0.1);
        border-radius: 6px;
        font-size: 12px;
        color: #fff;
        margin-bottom: 4px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      `;
      
      const nameSpan = document.createElement('span');
      nameSpan.textContent = player.name || 'Unknown';
      nameSpan.style.cssText = 'overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 100px;';
      
      const levelSpan = document.createElement('span');
      levelSpan.textContent = `Lv.${player.level || 1}`;
      levelSpan.style.cssText = 'color: #FFD54F; font-size: 10px;';
      
      el.appendChild(nameSpan);
      el.appendChild(levelSpan);
      onlinePanel.appendChild(el);
    });

    // Indicar se há mais jogadores
    if (players.length > maxPlayers) {
      const moreEl = document.createElement('div');
      moreEl.textContent = `+${players.length - maxPlayers} mais...`;
      moreEl.style.cssText = 'color: #888; font-size: 11px; text-align: center; margin-top: 4px;';
      onlinePanel.appendChild(moreEl);
    }

    Logger.info('HUD: Online players atualizado', players.length);
  }

  /**
   * NOVO: Renderiza jogadores remotos no canvas (MVP - Passo 6)
   * @param {CanvasRenderingContext2D} ctx - Contexto do canvas
   * @param {Array} remotePlayers - Lista de jogadores remotos
   * @param {Object} camera - Posição da câmera { x, y }
   * @param {Object} options - Opções de renderização
   */
  renderRemotePlayers(ctx, remotePlayers, camera, options = {}) {
    if (!ctx || !remotePlayers || remotePlayers.length === 0) return;
    
    const { 
      showNames = true, 
      showHealthBars = true,
      nameRange = 500,  // Só mostra nome se estiver dentro desta distância
      maxPlayersToRender = 20  // Limite para performance
    } = options;

    let renderedCount = 0;

    remotePlayers.forEach(player => {
      // Limitar número de jogadores renderizados para performance
      if (renderedCount >= maxPlayersToRender) return;

      const screenX = player.x - camera.x;
      const screenY = player.y - camera.y;

      // Verificar se está dentro da tela
      if (screenX < -50 || screenX > ctx.canvas.width + 50 || 
          screenY < -50 || screenY > ctx.canvas.height + 50) {
        return;
      }

      renderedCount++;

      ctx.save();

      // Sombra
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath();
      ctx.ellipse(screenX + 16, screenY + 28, 12, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      // Corpo do jogador (cor diferente do jogador local)
      ctx.fillStyle = player.color || '#2196F3'; // Azul para outros jogadores
      ctx.fillRect(screenX, screenY, 32, 32);

      // Borda para identificar como jogador remoto
      ctx.strokeStyle = '#4CAF50';
      ctx.lineWidth = 2;
      ctx.strokeRect(screenX, screenY, 32, 32);

      // Barra de HP
      if (showHealthBars && player.hp !== undefined && player.maxHp) {
        const barWidth = 32;
        const barHeight = 4;
        const hpPercent = Math.max(0, Math.min(1, player.hp / player.maxHp));
        
        // Fundo
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(screenX, screenY - 8, barWidth, barHeight);
        
        // HP
        ctx.fillStyle = hpPercent > 0.5 ? '#4CAF50' : hpPercent > 0.25 ? '#FFC107' : '#F44336';
        ctx.fillRect(screenX, screenY - 8, barWidth * hpPercent, barHeight);
      }

      // Nome do jogador
      if (showNames) {
        ctx.fillStyle = '#FFF';
        ctx.font = '11px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        
        // Sombra do texto
        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        ctx.shadowBlur = 2;
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 1;
        
        const displayName = player.name || `Player ${player.id?.substr(0, 4) || '???'}`;
        ctx.fillText(displayName, screenX + 16, screenY - 12);
        
        // Reset shadow
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        
        // Nível
        ctx.font = '9px Arial';
        ctx.fillStyle = '#FFD54F';
        ctx.fillText(`Lv.${player.level || 1}`, screenX + 16, screenY - 2);
      }

      ctx.restore();
    });

    if (renderedCount > 0) {
      Logger.info('HUD: Renderizados', renderedCount, 'jogadores remotos');
    }
  }

  /**
   * NOVO: Adiciona mensagem de sistema para chat (join/leave)
   * @param {string} message - Mensagem do sistema
   * @param {string} type - Tipo: 'join', 'leave', 'info'
   */
  addSystemMessage(message, type = 'info') {
    const colors = {
      join: '#4CAF50',   // Verde para entrar
      leave: '#F44336',  // Vermelho para sair
      info: '#2196F3'    // Azul para info
    };
    
    this.addChatMessage(`[Sistema] ${message}`, colors[type] || colors.info);
  }

  /**
   * Mostra dano flutuante na tela
   * @param {number} x - Posição X
   * @param {number} y - Posição Y
   * @param {number} damage - Valor do dano
   * @param {boolean} isCrit - Se foi crítico
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
   * Atualiza barra de mana (se existir)
   * @param {number} mana - Mana atual
   * @param {number} maxMana - Mana máxima
   */
  updateMana(mana, maxMana) {
    const manaFill = document.getElementById('manaFill');
    const manaText = document.getElementById('manaText');
    
    if (manaFill) {
      const pct = (mana || 0) / (maxMana || 1);
      manaFill.style.width = `${Math.max(0, Math.min(100, pct * 100))}%`;
    }
    
    if (manaText) {
      manaText.textContent = `${Math.round(mana || 0)}/${maxMana || 0}`;
    }
  }

  /**
   * Mostra mensagem de cura flutuante
   * @param {number} x - Posição X
   * @param {number} y - Posição Y
   * @param {number} amount - Valor da cura
   */
  showHeal(x, y, amount) {
    const container = document.getElementById('gameCanvas') || document.body;
    const rect = container.getBoundingClientRect ? container.getBoundingClientRect() : { left: 0, top: 0 };
    
    const el = document.createElement('div');
    el.textContent = `+${amount}`;
    el.style.cssText = `
      position: fixed;
      left: ${rect.left + x}px;
      top: ${rect.top + y}px;
      color: #4CAF50;
      font-size: 18px;
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
   * Atualiza lista de inventário no HUD
   * @param {Array} items - Array de itens { id, name, quantity }
   */
  updateInventory(items) {
    const inventoryList = document.getElementById('inventoryList');
    if (!inventoryList) return;

    inventoryList.innerHTML = '';

    if (!Array.isArray(items) || items.length === 0) {
      const emptyMsg = document.createElement('div');
      emptyMsg.textContent = 'Inventário vazio';
      emptyMsg.style.cssText = 'color: #888; font-style: italic; padding: 8px;';
      inventoryList.appendChild(emptyMsg);
      return;
    }

    items.forEach(item => {
      const el = document.createElement('div');
      el.textContent = `${item.name} x${item.quantity || 1}`;
      el.className = 'inventory-item';
      el.style.cssText = `
        padding: 6px 8px;
        background: rgba(255,255,255,0.08);
        border: 1px solid rgba(255,255,255,0.1);
        border-radius: 6px;
        font-size: 13px;
        color: #fff;
        margin-bottom: 4px;
      `;
      inventoryList.appendChild(el);
    });

    Logger.info('HUD: Inventário atualizado', items.length, 'itens');
  }

  /**
   * Atualiza painel de equipamento
   * @param {Object} equipment - Objeto com weapon, armor, accessory
   */
  updateEquipment(equipment) {
    const eqWeapon = document.getElementById('equipmentWeapon');
    const eqArmor = document.getElementById('equipmentArmor');
    const eqAccessory = document.getElementById('equipmentAccessory');

    if (eqWeapon) {
      eqWeapon.textContent = `Weapon: ${equipment.weapon?.name || 'Empty'}`;
    }

    if (eqArmor) {
      eqArmor.textContent = `Armor: ${equipment.armor?.name || 'Empty'}`;
    }

    if (eqAccessory) {
      eqAccessory.textContent = `Accessory: ${equipment.accessory?.name || 'Empty'}`;
    }

    Logger.info('HUD: Equipamento atualizado', equipment);
  }

  /**
   * Atualiza painel de stats
   * @param {Object} stats - Objeto com level, maxHealth, attack, defense, speed
   */
  updateStatsPanel(stats) {
    const statLevel = document.getElementById('statLevel');
    const statHP = document.getElementById('statHP');
    const statAttack = document.getElementById('statAttack');
    const statDefense = document.getElementById('statDefense');
    const statSpeed = document.getElementById('statSpeed');

    if (statLevel) statLevel.textContent = `Level: ${stats.level ?? 1}`;
    if (statHP) statHP.textContent = `HP Max: ${stats.maxHealth ?? 100}`;
    if (statAttack) statAttack.textContent = `Attack: ${stats.attack ?? 0}`;
    if (statDefense) statDefense.textContent = `Defense: ${stats.defense ?? 0}`;
    if (statSpeed) statSpeed.textContent = `Speed: ${stats.speed ?? 1}`;

    Logger.info('HUD: Stats atualizados', stats);
  }

  /**
   * Atualiza inventário com botão de equipar
   * @param {Array} items - Array de itens
   * @param {Function} onEquip - Callback ao clicar em equipar
   */
  updateInventoryWithEquip(items, onEquip) {
    const inventoryList = document.getElementById('inventoryList');
    if (!inventoryList) return;

    inventoryList.innerHTML = '';

    if (!Array.isArray(items) || items.length === 0) {
      const emptyMsg = document.createElement('div');
      emptyMsg.textContent = 'Inventário vazio';
      emptyMsg.style.cssText = 'color: #888; font-style: italic; padding: 8px;';
      inventoryList.appendChild(emptyMsg);
      return;
    }

    items.forEach(item => {
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
        display: flex;
        justify-content: space-between;
        align-items: center;
      `;

      const text = document.createElement('span');
      text.textContent = `${item.name} x${item.quantity || 1}`;
      el.appendChild(text);

      if (item.equippable) {
        const btn = document.createElement('button');
        btn.textContent = 'Equipar';
        btn.className = 'inventory-equip-btn';
        btn.style.cssText = `
          padding: 2px 8px;
          background: #4CAF50;
          border: none;
          border-radius: 4px;
          color: white;
          font-size: 11px;
          cursor: pointer;
        `;
        btn.addEventListener('click', () => {
          if (typeof onEquip === 'function') {
            onEquip(item.id);
          }
        });
        el.appendChild(btn);
      }

      inventoryList.appendChild(el);
    });

    Logger.info('HUD: Inventário atualizado com botões', items.length, 'itens');
  }

  /**
   * Atualiza painel de quests ativas
   * @param {Array} quests - Lista de quests ativas
   */
  updateQuests(quests) {
    const questList = document.getElementById('questList');
    if (!questList) return;

    questList.innerHTML = '';

    if (!quests || quests.length === 0) {
      questList.innerHTML = '<div style="color: #888; text-align: center; padding: 10px;">Nenhuma quest ativa</div>';
      return;
    }

    quests.forEach(quest => {
      const isCompleted = quest.completed || quest.progress >= quest.required;
      const questEl = document.createElement('div');
      questEl.className = `quest-item ${isCompleted ? 'completed' : 'active'}`;
      
      questEl.innerHTML = `
        <div class="quest-title">${quest.title}</div>
        <div class="quest-desc">${quest.description}</div>
        <div class="quest-progress">Progresso: ${quest.progress || 0}/${quest.required}</div>
        ${quest.rewards ? `
          <div class="quest-rewards">
            ${quest.rewards.xp ? `+${quest.rewards.xp} XP` : ''}
            ${quest.rewards.gold ? ` +${quest.rewards.gold} Gold` : ''}
          </div>
        ` : ''}
        ${isCompleted ? '<div style="color: #4CAF50; font-size: 11px; margin-top: 4px;">✓ Pronto para entregar!</div>' : ''}
      `;
      
      questList.appendChild(questEl);
    });

    Logger.info('HUD: Quests atualizadas', quests.length);
  }

  /**
   * Atualiza barra de XP e informações de progressão
   * @param {Object} progression - Objeto com level, xp, xpToNextLevel
   */
  updateProgression(progression) {
    if (!progression) return;

    const xpLabel = document.getElementById('xpText');
    const xpFill = document.getElementById('xpFill');

    const xp = progression.xp ?? 0;
    const xpToNextLevel = progression.xpToNextLevel ?? 100;
    const pct = xpToNextLevel > 0 ? Math.max(0, Math.min(100, (xp / xpToNextLevel) * 100)) : 0;

    if (xpLabel) {
      xpLabel.textContent = `XP: ${xp} / ${xpToNextLevel}`;
    }

    if (xpFill) {
      xpFill.style.width = `${pct}%`;
    }

    // Atualizar level no player-info também
    const playerLevelEl = document.getElementById('playerLevel');
    if (playerLevelEl && progression.level) {
      playerLevelEl.textContent = `Lv. ${progression.level}`;
    }

    Logger.info('HUD: Progressão atualizada', progression);
  }

  /**
   * Atualiza o quest log com quests ativas
   * @param {Array} quests - Lista de quests ativas
   */
  updateQuestLog(quests) {
    if (!quests) return;

    const questLog = document.getElementById('questLog');
    if (!questLog) return;

    questLog.innerHTML = '';

    if (quests.length === 0) {
      const emptyMsg = document.createElement('div');
      emptyMsg.textContent = 'Nenhuma quest ativa';
      emptyMsg.style.cssText = 'color: #888; font-style: italic; padding: 8px; font-size: 12px;';
      questLog.appendChild(emptyMsg);
      return;
    }

    quests.forEach(quest => {
      const el = document.createElement('div');
      el.className = 'quest-entry';

      const title = document.createElement('div');
      title.className = 'quest-entry-title';
      title.textContent = quest.title || 'Quest';

      const progress = document.createElement('div');
      progress.className = 'quest-entry-progress';
      progress.textContent = quest.progressText || `${quest.currentCount || 0} / ${quest.requiredCount || 1}`;

      el.appendChild(title);
      el.appendChild(progress);

      questLog.appendChild(el);
    });

    Logger.info('HUD: Quest log atualizado', quests.length, 'quests');
  }

  /**
   * Atualiza painel de quest v2 (quest atual do tipo "mate X mobs")
   * @param {Object} quest - Dados da quest atual
   * @param {Object} progress - Progresso da quest { currentCount, targetCount }
   */
  updateQuestPanel(quest, progress) {
    const questV2Title = document.getElementById('questV2Title');
    const questV2Progress = document.getElementById('questV2Progress');
    const questV2Description = document.getElementById('questV2Description');

    if (questV2Title) {
      questV2Title.textContent = quest?.title ?? 'Nenhuma ativa';
    }

    if (questV2Progress && progress) {
      questV2Progress.textContent = `${progress.currentCount ?? 0} / ${progress.targetCount ?? 0}`;
    } else if (questV2Progress) {
      questV2Progress.textContent = '';
    }

    if (questV2Description) {
      questV2Description.textContent = quest?.description || '';
    }

    Logger.info('HUD: Quest panel atualizado', quest?.title, progress);
  }

  /**
   * Mostra lista de quests disponíveis do NPC
   * @param {Array} quests - Lista de quests disponíveis
   */
  showQuestList(quests) {
    // Criar painel de quests se não existir
    let questOfferPanel = document.getElementById('questOfferPanel');
    if (!questOfferPanel) {
      questOfferPanel = document.createElement('div');
      questOfferPanel.id = 'questOfferPanel';
      questOfferPanel.className = 'ui-panel quest-offer-panel';
      questOfferPanel.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 320px;
        max-height: 400px;
        overflow-y: auto;
        background: rgba(0, 0, 0, 0.9);
        border: 2px solid #9C27B0;
        border-radius: 12px;
        padding: 16px;
        z-index: 10000;
        display: none;
      `;
      document.body.appendChild(questOfferPanel);
    }

    questOfferPanel.innerHTML = '<div class="panel-title" style="color: #9C27B0; font-weight: bold; font-size: 16px; margin-bottom: 12px; text-align: center;">Quests Disponíveis</div>';

    if (!Array.isArray(quests) || quests.length === 0) {
      questOfferPanel.innerHTML += '<div style="color: #888; text-align: center; padding: 20px;">Nenhuma quest disponível</div>';
      questOfferPanel.style.display = 'block';
      return;
    }

    quests.forEach(quest => {
      const el = document.createElement('div');
      el.className = 'quest-offer-item';
      el.style.cssText = `
        padding: 12px;
        background: rgba(255,255,255,0.08);
        border: 1px solid rgba(255,255,255,0.1);
        border-radius: 8px;
        margin-bottom: 10px;
      `;

      const title = document.createElement('div');
      title.textContent = quest.title;
      title.style.cssText = 'font-weight: bold; color: #E1BEE7; margin-bottom: 4px;';

      const desc = document.createElement('div');
      desc.textContent = quest.description || '';
      desc.style.cssText = 'font-size: 12px; color: #ccc; margin-bottom: 8px;';

      const objective = document.createElement('div');
      objective.style.cssText = 'font-size: 12px; color: #9C27B0; margin-bottom: 8px;';
      if (quest.type === 'kill') {
        objective.textContent = `Objetivo: matar ${quest.requiredCount}x ${quest.targetMobType}`;
      } else if (quest.type === 'collect') {
        objective.textContent = `Objetivo: coletar ${quest.requiredCount}x ${quest.targetItemId}`;
      }

      const btn = document.createElement('button');
      btn.textContent = 'Aceitar';
      btn.style.cssText = `
        width: 100%;
        padding: 8px;
        background: #4CAF50;
        border: none;
        border-radius: 6px;
        color: white;
        font-size: 13px;
        cursor: pointer;
        margin-top: 8px;
      `;
      btn.addEventListener('click', () => {
        if (window.gameplayEngine && typeof window.gameplayEngine.acceptQuestFromHUD === 'function') {
          window.gameplayEngine.acceptQuestFromHUD(quest.id);
        }
        questOfferPanel.style.display = 'none';
      });

      el.appendChild(title);
      el.appendChild(desc);
      el.appendChild(objective);
      el.appendChild(btn);

      questOfferPanel.appendChild(el);
    });

    // Botão fechar
    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'Fechar';
    closeBtn.style.cssText = `
      width: 100%;
      padding: 8px;
      background: #555;
      border: none;
      border-radius: 6px;
      color: white;
      font-size: 13px;
      cursor: pointer;
      margin-top: 12px;
    `;
    closeBtn.addEventListener('click', () => {
      questOfferPanel.style.display = 'none';
    });
    questOfferPanel.appendChild(closeBtn);

    questOfferPanel.style.display = 'block';
    Logger.info('HUD: Lista de quests exibida', quests.length);
  }

  /**
   * Atualiza painel de profissões
   * @param {Object} professions - Objeto com profissões { mining: { level, xp, xpToNext } }
   */
  updateProfessionsPanel(professions) {
    const professionsList = document.getElementById('professionsList');
    if (!professionsList) return;

    professionsList.innerHTML = '';

    Object.entries(professions || {}).forEach(([name, data]) => {
      const el = document.createElement('div');
      el.className = 'profession-item';

      const level = data.level ?? 1;
      const xp = data.xp ?? 0;
      const xpToNext = data.xpToNext ?? 50;

      el.textContent = `${name} Lv.${level} - ${xp}/${xpToNext} XP`;

      professionsList.appendChild(el);
    });

    Logger.info('HUD: Profissões atualizadas', Object.keys(professions || {}).length);
  }

  /**
   * Inicializa painel de crafting
   * @param {Array} recipes - Lista de recipes disponíveis
   * @param {Function} onCraft - Callback quando clicar em craft
   */
  initCrafting(recipes, onCraft) {
    const craftRecipeSelect = document.getElementById('craftRecipeSelect');
    const craftExecuteBtn = document.getElementById('craftExecuteBtn');

    if (!craftRecipeSelect || !craftExecuteBtn) return;

    craftRecipeSelect.innerHTML = '';

    recipes.forEach(recipe => {
      const opt = document.createElement('option');
      opt.value = recipe.id;
      opt.textContent = recipe.name;
      craftRecipeSelect.appendChild(opt);
    });

    craftExecuteBtn.onclick = () => {
      const recipeId = craftRecipeSelect.value;
      if (recipeId && typeof onCraft === 'function') {
        onCraft(recipeId);
      }
    };

    Logger.info('HUD: Crafting inicializado', recipes.length, 'recipes');
  }

  /**
   * Mostra mensagem de crafting
   * @param {string} text - Mensagem a exibir
   * @param {boolean} success - Se foi sucesso ou falha
   */
  showCraftMessage(text, success = true) {
    const craftMessage = document.getElementById('craftMessage');
    if (!craftMessage) return;

    craftMessage.textContent = text;
    craftMessage.style.color = success ? '#A5D6A7' : '#EF9A9A';
  }

  /**
   * Atualiza a barra de XP
   * @param {Object} stats - Objeto com xp, xpToNext
   */
  updateXpBar(stats) {
    if (!stats) return;

    const xpBarFill = document.getElementById('xpBarFill');
    const xpText = document.getElementById('xpText');

    const xp = stats.xp ?? 0;
    const xpToNext = stats.xpToNext ?? 1;
    const pct = Math.max(0, Math.min(1, xp / xpToNext));

    if (xpBarFill) {
      xpBarFill.style.width = `${pct * 100}%`;
    }

    if (xpText) {
      xpText.textContent = `${xp} / ${xpToNext} XP`;
    }

    Logger.info('HUD: XP bar atualizada', xp, '/', xpToNext);
  }

  /**
   * Mostra texto flutuante de XP ganho
   * @param {number} amount - Quantidade de XP
   */
  addFloatingXp(amount) {
    const container = document.body;

    const el = document.createElement('div');
    el.textContent = `+${amount} XP`;
    el.className = 'floating-xp';
    el.style.cssText = `
      position: fixed;
      left: 40px;
      bottom: 60px;
      color: #90caf9;
      font-weight: bold;
      font-size: 14px;
      text-shadow: 0 1px 3px rgba(0,0,0,0.8);
      animation: floating-xp 0.8s ease-out forwards;
      pointer-events: none;
      z-index: 10000;
    `;

    container.appendChild(el);

    setTimeout(() => {
      if (el.parentNode) {
        el.remove();
      }
    }, 800);
  }
}

window.HUDManager = HUDManager;

// CSS para animação de floating text
if (!document.getElementById('hud-animations')) {
  const style = document.createElement('style');
  style.id = 'hud-animations';
  style.textContent = `
    @keyframes floatUp {
      0% { transform: translateY(0) scale(1); opacity: 1; }
      100% { transform: translateY(-40px) scale(1.2); opacity: 0; }
    }
  `;
  document.head.appendChild(style);
}

export default HUDManager;
