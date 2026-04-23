/**
 * NotificationManager - Sistema de Notificações
 * 
 * Features:
 * - Notificações toast em tempo real
 * - Sistema de mail/mensagens offline
 * - Categorias de notificações
 * - Histórico de notificações
 * - Configurações de notificação
 */

class NotificationManager {
    constructor(game) {
        this.game = game;
        this.socket = game?.socket;
        this.notifications = [];
        this.unreadCount = 0;
        this.maxNotifications = 50;
        this.settings = this.loadSettings();
        
        this.categories = {
            system: { icon: '⚙️', color: '#64748b' },
            achievement: { icon: '🏆', color: '#ffd700' },
            reward: { icon: '🎁', color: '#22c55e' },
            social: { icon: '👥', color: '#3b82f6' },
            combat: { icon: '⚔️', color: '#ef4444' },
            trade: { icon: '🤝', color: '#f59e0b' },
            event: { icon: '🌍', color: '#8b5cf6' },
            warning: { icon: '⚠️', color: '#f97316' },
            error: { icon: '❌', color: '#dc2626' }
        };
        
        this.init();
    }
    
    init() {
        this.createToastContainer();
        this.registerSocketEvents();
        console.log('🔔 NotificationManager inicializado');
    }
    
    loadSettings() {
        const saved = localStorage.getItem('notification_settings');
        if (saved) {
            return JSON.parse(saved);
        }
        return {
            enabled: true,
            sound: true,
            duration: 5000,
            maxVisible: 3,
            categories: {
                system: true,
                achievement: true,
                reward: true,
                social: true,
                combat: true,
                trade: true,
                event: true,
                warning: true,
                error: true
            }
        };
    }
    
    saveSettings() {
        localStorage.setItem('notification_settings', JSON.stringify(this.settings));
    }
    
    createToastContainer() {
        this.toastContainer = document.createElement('div');
        this.toastContainer.id = 'notification-toasts';
        this.toastContainer.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            width: 350px;
            z-index: 10001;
            display: flex;
            flex-direction: column;
            gap: 10px;
            pointer-events: none;
        `;
        document.body.appendChild(this.toastContainer);
        
        // Notification bell icon
        this.bellIcon = document.createElement('div');
        this.bellIcon.id = 'notification-bell';
        this.bellIcon.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            width: 45px;
            height: 45px;
            background: linear-gradient(135deg, #3b82f6, #1d4ed8);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            z-index: 10000;
            box-shadow: 0 4px 15px rgba(59, 130, 246, 0.4);
            transition: all 0.3s;
        `;
        this.bellIcon.innerHTML = '🔔';
        this.bellIcon.onclick = () => this.toggleNotificationPanel();
        
        // Unread badge
        this.badge = document.createElement('div');
        this.badge.style.cssText = `
            position: absolute;
            top: -5px;
            right: -5px;
            background: #ef4444;
            color: white;
            font-size: 12px;
            font-weight: 700;
            padding: 2px 6px;
            border-radius: 10px;
            display: none;
        `;
        this.badge.textContent = '0';
        this.bellIcon.appendChild(this.badge);
        
        document.body.appendChild(this.bellIcon);
        
        // Create notification panel
        this.createNotificationPanel();
    }
    
    createNotificationPanel() {
        this.panel = document.createElement('div');
        this.panel.id = 'notification-panel';
        this.panel.style.cssText = `
            position: fixed;
            top: 70px;
            right: 20px;
            width: 400px;
            max-height: 600px;
            background: linear-gradient(135deg, #1e293b, #0f172a);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 16px;
            z-index: 9999;
            display: none;
            flex-direction: column;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8);
            overflow: hidden;
        `;
        
        // Header
        const header = document.createElement('div');
        header.style.cssText = `
            background: linear-gradient(90deg, #3b82f6, #1d4ed8);
            padding: 15px 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        `;
        
        const title = document.createElement('h3');
        title.innerHTML = '🔔 Notificações';
        title.style.cssText = 'margin: 0; font-size: 16px; color: white;';
        
        const actions = document.createElement('div');
        actions.style.cssText = 'display: flex; gap: 10px;';
        
        const markAllBtn = document.createElement('button');
        markAllBtn.innerHTML = '✓';
        markAllBtn.style.cssText = `
            background: rgba(255,255,255,0.2);
            border: none;
            border-radius: 6px;
            color: white;
            padding: 5px 10px;
            cursor: pointer;
            font-size: 14px;
        `;
        markAllBtn.onclick = () => this.markAllAsRead();
        
        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '✕';
        closeBtn.style.cssText = markAllBtn.style.cssText;
        closeBtn.onclick = () => this.hidePanel();
        
        actions.appendChild(markAllBtn);
        actions.appendChild(closeBtn);
        header.appendChild(title);
        header.appendChild(actions);
        
        // Filters
        const filters = document.createElement('div');
        filters.style.cssText = `
            display: flex;
            gap: 8px;
            padding: 12px 20px;
            border-bottom: 1px solid rgba(255,255,255,0.1);
            overflow-x: auto;
        `;
        
        ['Todas', 'Não lidas', 'Sistema', 'Social', 'Recompensas'].forEach((filter, idx) => {
            const btn = document.createElement('button');
            btn.textContent = filter;
            btn.style.cssText = `
                padding: 6px 12px;
                background: ${idx === 0 ? '#3b82f6' : 'rgba(255,255,255,0.1)'};
                border: none;
                border-radius: 6px;
                color: white;
                font-size: 12px;
                cursor: pointer;
                white-space: nowrap;
            `;
            filters.appendChild(btn);
        });
        
        // Notification list
        this.notificationList = document.createElement('div');
        this.notificationList.style.cssText = `
            flex: 1;
            overflow-y: auto;
            padding: 10px;
            max-height: 400px;
        `;
        
        this.panel.appendChild(header);
        this.panel.appendChild(filters);
        this.panel.appendChild(this.notificationList);
        document.body.appendChild(this.panel);
    }
    
    showToast(notification) {
        if (!this.settings.enabled) return;
        if (!this.settings.categories[notification.category]) return;
        
        const category = this.categories[notification.category] || this.categories.system;
        
        const toast = document.createElement('div');
        toast.style.cssText = `
            background: linear-gradient(135deg, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.95));
            border: 1px solid ${category.color}40;
            border-left: 4px solid ${category.color};
            border-radius: 12px;
            padding: 15px;
            pointer-events: auto;
            cursor: pointer;
            transform: translateX(120%);
            transition: transform 0.3s ease;
            backdrop-filter: blur(10px);
        `;
        
        toast.innerHTML = `
            <div style="display: flex; align-items: flex-start; gap: 12px;">
                <div style="font-size: 24px;">${category.icon}</div>
                <div style="flex: 1; min-width: 0;">
                    <div style="font-weight: 600; color: white; margin-bottom: 4px; font-size: 14px;">${notification.title}</div>
                    <div style="color: rgba(255,255,255,0.7); font-size: 13px; line-height: 1.4;">${notification.message}</div>
                    <div style="color: rgba(255,255,255,0.4); font-size: 11px; margin-top: 6px;">${this.formatTime(notification.timestamp)}</div>
                </div>
                ${notification.actions ? `
                    <div style="display: flex; gap: 5px;">
                        ${notification.actions.map(a => `
                            <button class="toast-action" data-action="${a.id}" style="
                                padding: 6px 12px;
                                background: ${category.color}30;
                                border: 1px solid ${category.color};
                                border-radius: 6px;
                                color: ${category.color};
                                font-size: 12px;
                                cursor: pointer;
                                font-weight: 600;
                            ">${a.label}</button>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
        `;
        
        // Handle actions
        if (notification.actions) {
            toast.querySelectorAll('.toast-action').forEach(btn => {
                btn.onclick = (e) => {
                    e.stopPropagation();
                    const action = notification.actions.find(a => a.id === btn.dataset.action);
                    if (action) {
                        action.handler();
                    }
                    this.removeToast(toast);
                };
            });
        }
        
        toast.onclick = () => {
            if (notification.onClick) {
                notification.onClick();
            }
            this.hidePanel();
            this.removeToast(toast);
        };
        
        this.toastContainer.appendChild(toast);
        
        // Animate in
        setTimeout(() => {
            toast.style.transform = 'translateX(0)';
        }, 10);
        
        // Play sound if enabled
        if (this.settings.sound) {
            this.playNotificationSound(notification.category);
        }
        
        // Auto remove
        setTimeout(() => {
            this.removeToast(toast);
        }, this.settings.duration);
        
        // Limit visible toasts
        while (this.toastContainer.children.length > this.settings.maxVisible) {
            this.removeToast(this.toastContainer.firstChild);
        }
    }
    
    removeToast(toast) {
        if (!toast) return;
        toast.style.transform = 'translateX(120%)';
        setTimeout(() => {
            toast.remove();
        }, 300);
    }
    
    addNotification(notification) {
        const notif = {
            id: Date.now() + Math.random(),
            title: notification.title || 'Notificação',
            message: notification.message || '',
            category: notification.category || 'system',
            timestamp: Date.now(),
            read: false,
            actions: notification.actions || null,
            onClick: notification.onClick || null,
            data: notification.data || null
        };
        
        this.notifications.unshift(notif);
        
        // Limit stored notifications
        if (this.notifications.length > this.maxNotifications) {
            this.notifications.pop();
        }
        
        // Update unread count
        this.unreadCount++;
        this.updateBadge();
        
        // Show toast
        this.showToast(notif);
        
        // Add to panel
        this.renderNotificationList();
        
        return notif;
    }
    
    renderNotificationList() {
        if (!this.notificationList) return;
        
        this.notificationList.innerHTML = '';
        
        if (this.notifications.length === 0) {
            this.notificationList.innerHTML = `
                <div style="text-align: center; padding: 40px; color: rgba(255,255,255,0.5);">
                    <div style="font-size: 48px; margin-bottom: 15px;">📭</div>
                    <div>Nenhuma notificação</div>
                </div>
            `;
            return;
        }
        
        this.notifications.forEach(notif => {
            const category = this.categories[notif.category] || this.categories.system;
            
            const item = document.createElement('div');
            item.style.cssText = `
                display: flex;
                align-items: flex-start;
                gap: 12px;
                padding: 12px;
                background: ${notif.read ? 'rgba(0,0,0,0.2)' : 'rgba(59, 130, 246, 0.1)'};
                border-left: 3px solid ${notif.read ? 'transparent' : category.color};
                border-radius: 8px;
                margin-bottom: 8px;
                cursor: pointer;
                transition: all 0.2s;
            `;
            
            item.innerHTML = `
                <div style="font-size: 20px;">${category.icon}</div>
                <div style="flex: 1; min-width: 0;">
                    <div style="font-weight: ${notif.read ? '400' : '600'}; color: white; font-size: 13px; margin-bottom: 3px;">${notif.title}</div>
                    <div style="color: rgba(255,255,255,0.7); font-size: 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${notif.message}</div>
                    <div style="color: rgba(255,255,255,0.4); font-size: 10px; margin-top: 4px;">${this.formatTime(notif.timestamp)}</div>
                </div>
                ${notif.read ? '' : `<div style="width: 8px; height: 8px; background: ${category.color}; border-radius: 50%; flex-shrink: 0;"></div>`}
            `;
            
            item.onclick = () => {
                this.markAsRead(notif.id);
                if (notif.onClick) {
                    notif.onClick();
                }
            };
            
            this.notificationList.appendChild(item);
        });
    }
    
    markAsRead(id) {
        const notif = this.notifications.find(n => n.id === id);
        if (notif && !notif.read) {
            notif.read = true;
            this.unreadCount = Math.max(0, this.unreadCount - 1);
            this.updateBadge();
            this.renderNotificationList();
        }
    }
    
    markAllAsRead() {
        this.notifications.forEach(n => n.read = true);
        this.unreadCount = 0;
        this.updateBadge();
        this.renderNotificationList();
    }
    
    updateBadge() {
        if (this.unreadCount > 0) {
            this.badge.textContent = this.unreadCount > 99 ? '99+' : this.unreadCount;
            this.badge.style.display = 'block';
            this.bellIcon.style.animation = 'pulse 2s infinite';
        } else {
            this.badge.style.display = 'none';
            this.bellIcon.style.animation = 'none';
        }
    }
    
    toggleNotificationPanel() {
        if (this.panel.style.display === 'none' || !this.panel.style.display) {
            this.showPanel();
        } else {
            this.hidePanel();
        }
    }
    
    showPanel() {
        this.panel.style.display = 'flex';
        this.renderNotificationList();
    }
    
    hidePanel() {
        this.panel.style.display = 'none';
    }
    
    playNotificationSound(category) {
        // Would play sound based on category
        // const audio = new Audio(`/sounds/notification_${category}.mp3`);
        // audio.play().catch(() => {});
    }
    
    formatTime(timestamp) {
        const diff = Date.now() - timestamp;
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        if (seconds < 60) return 'Agora';
        if (minutes < 60) return `${minutes}min`;
        if (hours < 24) return `${hours}h`;
        return `${days}d`;
    }
    
    // ===== SOCKET EVENTS =====
    
    registerSocketEvents() {
        if (!this.socket) return;
        
        this.socket.on('notification', (data) => {
            this.addNotification(data);
        });
        
        this.socket.on('achievement:unlocked', (data) => {
            this.addNotification({
                title: 'Conquista Desbloqueada!',
                message: data.name,
                category: 'achievement',
                onClick: () => {
                    // Open achievements UI
                }
            });
        });
        
        this.socket.on('trade:request_received', (data) => {
            this.addNotification({
                title: 'Solicitação de Troca',
                message: `${data.fromPlayerName} quer trocar com você`,
                category: 'trade',
                actions: [
                    { id: 'accept', label: 'Aceitar', handler: () => {
                        this.socket.emit('trade:accept', { fromPlayerId: data.fromPlayerId });
                    }},
                    { id: 'decline', label: 'Recusar', handler: () => {
                        this.socket.emit('trade:decline', { fromPlayerId: data.fromPlayerId });
                    }}
                ]
            });
        });
        
        this.socket.on('guild:invite_received', (data) => {
            this.addNotification({
                title: 'Convite de Guilda',
                message: `Você foi convidado para ${data.guildName}`,
                category: 'social',
                actions: [
                    { id: 'accept', label: 'Aceitar', handler: () => {
                        this.socket.emit('guild:accept_invite', { guildId: data.guildId });
                    }},
                    { id: 'decline', label: 'Recusar', handler: () => {
                        this.socket.emit('guild:decline_invite', { guildId: data.guildId });
                    }}
                ]
            });
        });
        
        this.socket.on('party:invite_received', (data) => {
            this.addNotification({
                title: 'Convite de Grupo',
                message: `${data.fromPlayerName} te convidou para um grupo`,
                category: 'social',
                actions: [
                    { id: 'accept', label: 'Aceitar', handler: () => {
                        this.socket.emit('party:accept_invite', { partyId: data.partyId });
                    }},
                    { id: 'decline', label: 'Recusar', handler: () => {
                        this.socket.emit('party:decline_invite', { partyId: data.partyId });
                    }}
                ]
            });
        });
        
        this.socket.on('reputation:reward_available', (data) => {
            this.addNotification({
                title: 'Recompensa Disponível',
                message: `Você tem recompensas para resgatar em ${data.factionName}`,
                category: 'reward',
                onClick: () => {
                    // Open reputation UI
                }
            });
        });
        
        this.socket.on('worldevent:started', (data) => {
            this.addNotification({
                title: '⚔️ Evento de Mundo Iniciado!',
                message: `${data.eventName} começou! Participe agora!`,
                category: 'event',
                onClick: () => {
                    // Open world events UI
                }
            });
        });
    }
    
    // ===== PUBLIC API =====
    
    notify(title, message, category = 'system', options = {}) {
        return this.addNotification({
            title,
            message,
            category,
            ...options
        });
    }
    
    success(message, title = 'Sucesso!') {
        return this.notify(title, message, 'reward');
    }
    
    error(message, title = 'Erro') {
        return this.notify(title, message, 'error');
    }
    
    warning(message, title = 'Atenção') {
        return this.notify(title, message, 'warning');
    }
    
    info(message, title = 'Informação') {
        return this.notify(title, message, 'system');
    }
}

window.NotificationManager = NotificationManager;

if (typeof module !== 'undefined' && module.exports) {
    module.exports = NotificationManager;
}
