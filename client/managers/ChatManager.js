/**
 * ChatManager.js
 * Sistema centralizado de chat e log de eventos (ROADMAP - Passo 9)
 * Responsabilidade: Gerenciar mensagens de combate, loot, XP, entrada/saída
 */

class ChatManager {
  constructor() {
    this.messages = [];
    this.maxMessages = 50;
    this.container = null;
    this.input = null;
    this.isVisible = true;
    
    this.createChatUI();
  }

  createChatUI() {
    // Container principal do chat
    this.container = document.createElement('div');
    this.container.id = 'chatManager';
    this.container.style.cssText = `
      position: fixed;
      bottom: 10px;
      left: 10px;
      width: 380px;
      height: 200px;
      background: rgba(0, 0, 0, 0.85);
      border: 2px solid #34495e;
      border-radius: 8px;
      display: flex;
      flex-direction: column;
      z-index: 1000;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    `;

    // Área de mensagens
    this.messagesArea = document.createElement('div');
    this.messagesArea.id = 'chatMessages';
    this.messagesArea.style.cssText = `
      flex: 1;
      overflow-y: auto;
      padding: 10px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    `;

    // Input area
    const inputArea = document.createElement('div');
    inputArea.style.cssText = `
      display: flex;
      padding: 8px;
      border-top: 1px solid #34495e;
      gap: 8px;
    `;

    this.input = document.createElement('input');
    this.input.type = 'text';
    this.input.placeholder = 'Pressione Enter para chat...';
    this.input.style.cssText = `
      flex: 1;
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid #34495e;
      border-radius: 4px;
      padding: 6px 10px;
      color: #fff;
      font-size: 13px;
      outline: none;
    `;

    const sendBtn = document.createElement('button');
    sendBtn.textContent = 'Enviar';
    sendBtn.style.cssText = `
      background: #3498db;
      border: none;
      border-radius: 4px;
      padding: 6px 12px;
      color: #fff;
      font-size: 12px;
      cursor: pointer;
      transition: background 0.2s;
    `;
    sendBtn.onmouseenter = () => sendBtn.style.background = '#2980b9';
    sendBtn.onmouseleave = () => sendBtn.style.background = '#3498db';

    inputArea.appendChild(this.input);
    inputArea.appendChild(sendBtn);

    this.container.appendChild(this.messagesArea);
    this.container.appendChild(inputArea);

    document.body.appendChild(this.container);

    // Event listeners
    this.input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.sendMessage(this.input.value);
        this.input.value = '';
      }
    });

    sendBtn.addEventListener('click', () => {
      this.sendMessage(this.input.value);
      this.input.value = '';
    });

    // Toggle com Enter quando não está focado no input
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && document.activeElement !== this.input) {
        this.input.focus();
      }
    });
  }

  /**
   * Adiciona mensagem ao chat
   */
  addMessage(text, type = 'normal', sender = null) {
    const message = {
      id: Date.now() + Math.random(),
      text,
      type,
      sender,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };

    this.messages.push(message);
    
    // Limitar número de mensagens
    if (this.messages.length > this.maxMessages) {
      this.messages.shift();
      if (this.messagesArea.firstChild) {
        this.messagesArea.removeChild(this.messagesArea.firstChild);
      }
    }

    this.renderMessage(message);
    this.scrollToBottom();
  }

  renderMessage(message) {
    const el = document.createElement('div');
    
    // Estilos por tipo
    const styles = {
      normal: { color: '#ecf0f1', prefix: '' },
      system: { color: '#f39c12', prefix: '[Sistema] ' },
      combat: { color: '#e74c3c', prefix: '⚔️ ' },
      loot: { color: '#2ecc71', prefix: '💰 ' },
      xp: { color: '#3498db', prefix: '⭐ ' },
      levelup: { color: '#f1c40f', prefix: '🎉 ' },
      join: { color: '#2ecc71', prefix: '👤 ' },
      leave: { color: '#e74c3c', prefix: '👋 ' },
      death: { color: '#95a5a6', prefix: '💀 ' },
      whisper: { color: '#9b59b6', prefix: '💬 ' }
    };

    const style = styles[message.type] || styles.normal;

    el.style.cssText = `
      color: ${style.color};
      font-size: 13px;
      word-break: break-word;
      line-height: 1.4;
      animation: fadeIn 0.2s ease-out;
    `;

    if (message.sender) {
      el.innerHTML = `
        <span style="color: #7f8c8d; font-size: 11px;">[${message.timestamp}]</span>
        <span style="color: #3498db; font-weight: bold;">${message.sender}:</span>
        <span>${style.prefix}${message.text}</span>
      `;
    } else {
      el.innerHTML = `
        <span style="color: #7f8c8d; font-size: 11px;">[${message.timestamp}]</span>
        <span>${style.prefix}${message.text}</span>
      `;
    }

    this.messagesArea.appendChild(el);
  }

  /**
   * Eventos de combate
   */
  logCombat(message) {
    this.addMessage(message, 'combat');
  }

  /**
   * Eventos de loot
   */
  logLoot(itemName, quantity = 1) {
    const text = quantity > 1 
      ? `Você coletou ${itemName} x${quantity}` 
      : `Você coletou ${itemName}`;
    this.addMessage(text, 'loot');
  }

  /**
   * Eventos de XP
   */
  logXp(amount, isLevelUp = false) {
    if (isLevelUp) {
      this.addMessage(`LEVEL UP! Você alcançou o nível ${amount}!`, 'levelup');
    } else {
      this.addMessage(`+${amount} XP`, 'xp');
    }
  }

  /**
   * Eventos de jogador
   */
  logPlayerJoin(playerName) {
    this.addMessage(`${playerName} entrou no mundo`, 'join');
  }

  logPlayerLeave(playerName) {
    this.addMessage(`${playerName} saiu do mundo`, 'leave');
  }

  logPlayerDeath(playerName) {
    this.addMessage(`${playerName} morreu`, 'death');
  }

  /**
   * Eventos de sistema
   */
  logSystem(message) {
    this.addMessage(message, 'system');
  }

  /**
   * Enviar mensagem de chat
   */
  sendMessage(text) {
    if (!text || text.trim() === '') return;
    
    const trimmed = text.trim();
    
    // Verificar se é whisper (/w nome mensagem)
    if (trimmed.startsWith('/w ')) {
      const parts = trimmed.substring(3).split(' ');
      const target = parts[0];
      const message = parts.slice(1).join(' ');
      
      if (target && message) {
        this.addMessage(`Para ${target}: ${message}`, 'whisper', 'Você');
        // Emitir evento para servidor
        this.emit('whisper', { target, message });
      }
      return;
    }

    // Mensagem normal
    this.addMessage(trimmed, 'normal', 'Você');
    
    // Emitir evento para servidor
    this.emit('chat', { message: trimmed });
  }

  /**
   * Receber mensagem de outro jogador
   */
  receiveMessage(text, sender, type = 'normal') {
    this.addMessage(text, type, sender);
  }

  /**
   * Limpar chat
   */
  clear() {
    this.messages = [];
    this.messagesArea.innerHTML = '';
  }

  /**
   * Scroll para última mensagem
   */
  scrollToBottom() {
    this.messagesArea.scrollTop = this.messagesArea.scrollHeight;
  }

  /**
   * Toggle visibilidade
   */
  toggle() {
    this.isVisible = !this.isVisible;
    this.container.style.display = this.isVisible ? 'flex' : 'none';
  }

  /**
   * Esconder chat
   */
  hide() {
    this.isVisible = false;
    this.container.style.display = 'none';
  }

  /**
   * Mostrar chat
   */
  show() {
    this.isVisible = true;
    this.container.style.display = 'flex';
  }

  /**
   * Event emitter simples
   */
  emit(event, data) {
    // Disparar evento para quem estiver ouvindo
    if (this.onEvent) {
      this.onEvent(event, data);
    }
  }

  /**
   * Configurar callback de eventos
   */
  onEventCallback(callback) {
    this.onEvent = callback;
  }
}

// CSS para animações
const style = document.createElement('style');
style.textContent = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-5px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  #chatMessages::-webkit-scrollbar {
    width: 6px;
  }
  
  #chatMessages::-webkit-scrollbar-track {
    background: rgba(0,0,0,0.2);
    border-radius: 3px;
  }
  
  #chatMessages::-webkit-scrollbar-thumb {
    background: #34495e;
    border-radius: 3px;
  }
  
  #chatMessages::-webkit-scrollbar-thumb:hover {
    background: #4a5f7f;
  }
`;
document.head.appendChild(style);

window.ChatManager = ChatManager;
