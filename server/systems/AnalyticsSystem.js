/**
 * AnalyticsSystem.js
 * Sistema de Analytics e Monitoramento
 * Legacy of Komodo MMORPG v0.5.0 - Nível 9
 */

class AnalyticsSystem {
    constructor(database, redis) {
        this.db = database;
        this.redis = redis;
        
        // Métricas em tempo real
        this.realtimeMetrics = {
            activePlayers: new Map(),
            peakPlayers: 0,
            totalSessions: 0,
            serverStartTime: Date.now()
        };
        
        // Configurações
        this.config = {
            flushInterval: 60000, // 1 minuto
            retentionDays: 90,
            sampleRate: 1.0 // 100% dos eventos
        };
        
        // Inicia coleta
        this.startCollection();
        
        console.log('📊 AnalyticsSystem initialized');
    }

    /**
     * Registra evento
     */
    async track(event, data = {}) {
        if (Math.random() > this.config.sampleRate) return;
        
        const eventData = {
            type: event,
            timestamp: Date.now(),
            sessionId: data.sessionId,
            playerId: data.playerId,
            zone: data.zone,
            data: data
        };
        
        // Armazena em memória temporariamente
        await this.queueEvent(eventData);
        
        // Métricas em tempo real
        this.updateRealtimeMetrics(event, data);
    }

    /**
     * Player login
     */
    async trackLogin(playerId, sessionId, metadata = {}) {
        const loginData = {
            playerId,
            sessionId,
            timestamp: Date.now(),
            ip: metadata.ip,
            userAgent: metadata.userAgent,
            platform: metadata.platform,
            screenResolution: metadata.screenResolution
        };
        
        // Registra sessão
        this.realtimeMetrics.activePlayers.set(playerId, {
            sessionId,
            loginTime: Date.now(),
            zone: null,
            lastActivity: Date.now()
        });
        
        // Atualiza peak
        const currentActive = this.realtimeMetrics.activePlayers.size;
        if (currentActive > this.realtimeMetrics.peakPlayers) {
            this.realtimeMetrics.peakPlayers = currentActive;
        }
        
        this.realtimeMetrics.totalSessions++;
        
        await this.track('player:login', loginData);
        
        console.log(`📊 Login tracked: ${playerId} (${currentActive} active)`);
    }

    /**
     * Player logout
     */
    async trackLogout(playerId, sessionId) {
        const session = this.realtimeMetrics.activePlayers.get(playerId);
        if (!session) return;
        
        const duration = Date.now() - session.loginTime;
        
        await this.track('player:logout', {
            playerId,
            sessionId,
            duration,
            zone: session.zone
        });
        
        // Remove da lista
        this.realtimeMetrics.activePlayers.delete(playerId);
        
        // Salva sessão no banco
        await this.db.saveSession({
            playerId,
            sessionId,
            loginTime: new Date(session.loginTime).toISOString(),
            logoutTime: new Date().toISOString(),
            duration,
            zonesVisited: session.zonesVisited || []
        });
    }

    /**
     * Track gameplay events
     */
    async trackGameplay(event, playerId, data = {}) {
        await this.track(`gameplay:${event}`, {
            playerId,
            ...data
        });
    }

    /**
     * Track combat
     */
    async trackCombat(playerId, data) {
        await this.track('combat:event', {
            playerId,
            damage: data.damage,
            target: data.targetType,
            ability: data.ability,
            isCritical: data.isCritical,
            zone: data.zone
        });
    }

    /**
     * Track economy
     */
    async trackEconomy(playerId, transaction) {
        await this.track('economy:transaction', {
            playerId,
            type: transaction.type, // earn, spend, trade
            amount: transaction.amount,
            currency: transaction.currency, // gold, gems
            source: transaction.source,
            item: transaction.item
        });
    }

    /**
     * Track progression
     */
    async trackProgression(playerId, event, data) {
        await this.track(`progression:${event}`, {
            playerId,
            level: data.level,
            xp: data.xp,
            timeToLevel: data.timeToLevel
        });
    }

    /**
     * Track social
     */
    async trackSocial(playerId, event, data) {
        await this.track(`social:${event}`, {
            playerId,
            ...data
        });
    }

    /**
     * Track errors
     */
    async trackError(error, context = {}) {
        await this.track('system:error', {
            error: error.message,
            stack: error.stack,
            ...context
        });
        
        // Alerta se erro crítico
        if (this.isCriticalError(error)) {
            this.alertDevelopers(error, context);
        }
    }

    /**
     * Track performance
     */
    async trackPerformance(metrics) {
        await this.track('system:performance', {
            cpu: metrics.cpu,
            memory: metrics.memory,
            fps: metrics.fps,
            latency: metrics.latency,
            activeConnections: metrics.activeConnections,
            tickRate: metrics.tickRate
        });
    }

    /**
     * Queue event
     */
    async queueEvent(eventData) {
        // Usa Redis para buffer
        const key = `analytics:events:${Math.floor(Date.now() / 60000)}`;
        await this.redis.lpush(key, JSON.stringify(eventData));
        await this.redis.expire(key, 3600); // 1 hora
    }

    /**
     * Flush events para banco
     */
    async flushEvents() {
        const keys = await this.redis.keys('analytics:events:*');
        
        for (const key of keys) {
            const events = await this.redis.lrange(key, 0, -1);
            if (events.length === 0) continue;
            
            // Processa e salva
            const parsed = events.map(e => JSON.parse(e));
            await this.db.saveAnalyticsBatch(parsed);
            
            // Limpa
            await this.redis.del(key);
        }
    }

    /**
     * Update realtime metrics
     */
    updateRealtimeMetrics(event, data) {
        // Atualiza última atividade
        if (data.playerId) {
            const player = this.realtimeMetrics.activePlayers.get(data.playerId);
            if (player) {
                player.lastActivity = Date.now();
            }
        }
    }

    /**
     * Start collection loop
     */
    startCollection() {
        // Flush a cada minuto
        setInterval(() => this.flushEvents(), this.config.flushInterval);
        
        // Performance tracking a cada 5 minutos
        setInterval(() => this.collectPerformanceMetrics(), 300000);
        
        // Cleanup sessões inativas a cada 10 minutos
        setInterval(() => this.cleanupInactiveSessions(), 600000);
    }

    /**
     * Collect performance metrics
     */
    async collectPerformanceMetrics() {
        const metrics = {
            timestamp: Date.now(),
            activePlayers: this.realtimeMetrics.activePlayers.size,
            peakPlayers: this.realtimeMetrics.peakPlayers,
            totalSessions: this.realtimeMetrics.totalSessions,
            uptime: Date.now() - this.realtimeMetrics.serverStartTime
        };
        
        await this.trackPerformance(metrics);
        
        // Reset peak
        this.realtimeMetrics.peakPlayers = this.realtimeMetrics.activePlayers.size;
    }

    /**
     * Cleanup inactive sessions
     */
    cleanupInactiveSessions() {
        const now = Date.now();
        const timeout = 900000; // 15 minutos
        
        for (const [playerId, session] of this.realtimeMetrics.activePlayers) {
            if (now - session.lastActivity > timeout) {
                this.trackLogout(playerId, session.sessionId);
            }
        }
    }

    /**
     * Check critical error
     */
    isCriticalError(error) {
        const criticalTypes = [
            'DatabaseError',
            'SocketError',
            'MemoryError',
            'SecurityBreach'
        ];
        return criticalTypes.some(type => error.name?.includes(type));
    }

    /**
     * Alert developers
     */
    alertDevelopers(error, context) {
        console.error(`🚨 CRITICAL ERROR: ${error.message}`, context);
        // Envia para sistema de alertas (Discord, Email, PagerDuty)
    }

    /**
     * Get dashboard metrics
     */
    async getDashboardMetrics(timeRange = '24h') {
        const endTime = Date.now();
        const startTime = endTime - this.parseTimeRange(timeRange);
        
        return {
            activeNow: this.realtimeMetrics.activePlayers.size,
            peakToday: this.realtimeMetrics.peakPlayers,
            totalSessions: this.realtimeMetrics.totalSessions,
            newPlayers: await this.db.getNewPlayersCount(startTime, endTime),
            retention: await this.calculateRetention(startTime, endTime),
            avgSessionTime: await this.db.getAverageSessionTime(startTime, endTime),
            topZones: await this.db.getTopZones(startTime, endTime, 5),
            economy: await this.getEconomyMetrics(startTime, endTime),
            progression: await this.getProgressionMetrics(startTime, endTime)
        };
    }

    /**
     * Parse time range
     */
    parseTimeRange(range) {
        const map = {
            '1h': 3600000,
            '24h': 86400000,
            '7d': 604800000,
            '30d': 2592000000
        };
        return map[range] || 86400000;
    }

    /**
     * Calculate retention
     */
    async calculateRetention(startTime, endTime) {
        // D1, D7, D30 retention
        return {
            d1: await this.db.calculateRetention(startTime, 1),
            d7: await this.db.calculateRetention(startTime, 7),
            d30: await this.db.calculateRetention(startTime, 30)
        };
    }

    /**
     * Get economy metrics
     */
    async getEconomyMetrics(startTime, endTime) {
        return {
            totalGoldEarned: await this.db.getTotalGoldEarned(startTime, endTime),
            totalGoldSpent: await this.db.getTotalGoldSpent(startTime, endTime),
            topEarners: await this.db.getTopGoldEarners(startTime, endTime, 10),
            marketActivity: await this.db.getMarketActivity(startTime, endTime)
        };
    }

    /**
     * Get progression metrics
     */
    async getProgressionMetrics(startTime, endTime) {
        return {
            levelUps: await this.db.getLevelUpsCount(startTime, endTime),
            questsCompleted: await this.db.getQuestsCompletedCount(startTime, endTime),
            bossesKilled: await this.db.getBossesKilledCount(startTime, endTime),
            avgTimeToLevel: await this.db.getAvgTimeToLevel(startTime, endTime)
        };
    }

    /**
     * Get player journey
     */
    async getPlayerJourney(playerId, days = 30) {
        const startTime = Date.now() - (days * 86400000);
        
        return {
            sessions: await this.db.getPlayerSessions(playerId, startTime),
            progression: await this.db.getPlayerProgression(playerId, startTime),
            activity: await this.db.getPlayerActivityHeatmap(playerId, startTime),
            achievements: await this.db.getPlayerAchievementsInPeriod(playerId, startTime)
        };
    }

    /**
     * Generate report
     */
    async generateReport(type, timeRange) {
        const metrics = await this.getDashboardMetrics(timeRange);
        
        return {
            generatedAt: new Date().toISOString(),
            type: type,
            timeRange: timeRange,
            metrics: metrics,
            insights: this.generateInsights(metrics)
        };
    }

    /**
     * Generate insights
     */
    generateInsights(metrics) {
        const insights = [];
        
        if (metrics.retention?.d1 < 30) {
            insights.push({
                type: 'warning',
                message: 'D1 retention is below 30%. Consider improving onboarding.',
                metric: 'retention'
            });
        }
        
        if (metrics.avgSessionTime < 300000) { // < 5 min
            insights.push({
                type: 'warning',
                message: 'Average session time is low. Add more engaging content.',
                metric: 'session_time'
            });
        }
        
        return insights;
    }

    /**
     * A/B Test tracking
     */
    async trackABTest(testId, variant, playerId, conversion = false) {
        await this.track('abtest:conversion', {
            testId,
            variant,
            playerId,
            converted: conversion,
            timestamp: Date.now()
        });
    }

    /**
     * Funnel tracking
     */
    async trackFunnelStep(funnelId, step, playerId) {
        await this.track('funnel:step', {
            funnelId,
            step,
            playerId,
            timestamp: Date.now()
        });
    }

    getRealtimeStats() {
        return {
            activePlayers: this.realtimeMetrics.activePlayers.size,
            peakPlayers: this.realtimeMetrics.peakPlayers,
            totalSessions: this.realtimeMetrics.totalSessions,
            uptime: Date.now() - this.realtimeMetrics.serverStartTime
        };
    }
}

// Exporta
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AnalyticsSystem;
} else {
    window.AnalyticsSystem = AnalyticsSystem;
}
