/**
 * PvPManager - Sistema de Player vs Player
 *
 * Responsabilidades:
 * - Duelos 1v1 entre jogadores
 * - Arenas (FFA e Team)
 * - Ranking e sistema ELO
 * - Recompensas de PvP
 * - Estados de duelo
 * - Convites de duelo
 */

class PvPManager {
    constructor(playerId) {
        this.playerId = playerId;
        this.playerName = 'Jogador';

        // Duelos ativos
        this.activeDuels = new Map(); // duelId -> duel data
        this.myDuel = null; // duelo atual do jogador

        // Convites pendentes
        this.pendingInvites = new Map(); // playerId -> invite data
        this.sentInvites = new Map(); // playerId -> invite data

        // Dados do ranking
        this.myRank = {
            rating: 1000,
            wins: 0,
            losses: 0,
            draws: 0,
            streak: 0,
            bestStreak: 0,
            title: 'Novato'
        };

        // Arenas disponíveis
        this.arenas = new Map();
        this.currentArena = null;

        // Configurações
        this.duelTimeout = 30000; // 30 segundos para aceitar
        this.duelDuration = 300000; // 5 minutos máximo
        this.inviteCooldown = 10000; // 10 segundos entre convites
        this.lastInviteTime = 0;

        // Títulos de PvP por rating
        this.titles = [
            { min: 0, max: 999, title: 'Novato', color: '#9e9e9e' },
            { min: 1000, max: 1199, title: 'Combatente', color: '#4caf50' },
            { min: 1200, max: 1399, title: 'Guerreiro', color: '#2196f3' },
            { min: 1400, max: 1599, title: 'Veterano', color: '#9c27b0' },
            { min: 1600, max: 1799, title: 'Campeão', color: '#ff9800' },
            { min: 1800, max: 1999, title: 'Elite', color: '#f44336' },
            { min: 2000, max: 2499, title: 'Mestre', color: '#ffd700' },
            { min: 2500, max: 9999, title: 'Lenda', color: '#00bcd4' }
        ];

        // Callbacks
        this.onDuelStarted = null;
        this.onDuelEnded = null;
        this.onDuelInvite = null;
        this.onRankUpdated = null;
        this.onArenaJoined = null;
        this.onArenaLeft = null;

        this.initialized = false;

        // Carregar dados salvos
        this.loadFromStorage();
    }

    init() {
        if (this.initialized) return;

        // Criar arenas de exemplo
        this.createExampleArenas();

        this.initialized = true;
        console.log('⚔️ PvPManager inicializado');
        console.log('   - Rating:', this.myRank.rating);
        console.log('   - Título:', this.myRank.title);
    }

    // Criar arenas de exemplo
    createExampleArenas() {
        const exampleArenas = [
            {
                id: 'arena_forest',
                name: 'Arena da Floresta',
                description: 'Campo de batalha natural entre as árvores',
                type: 'ffa',
                minPlayers: 2,
                maxPlayers: 10,
                minLevel: 1,
                rewards: { gold: 100, xp: 50 },
                players: [],
                status: 'waiting',
                currentRound: 0
            },
            {
                id: 'arena_colosseum',
                name: 'Coliseu de Eldoria',
                description: 'Arena oficial do reino - duelos 1v1',
                type: 'duel',
                minPlayers: 2,
                maxPlayers: 2,
                minLevel: 10,
                rewards: { gold: 200, xp: 100, rating: 25 },
                players: [],
                status: 'waiting',
                currentRound: 0
            },
            {
                id: 'arena_team',
                name: 'Vale do Trovão',
                description: 'Batalhas em equipe 3v3',
                type: 'team',
                minPlayers: 6,
                maxPlayers: 6,
                minLevel: 15,
                teamSize: 3,
                rewards: { gold: 300, xp: 150, rating: 35 },
                players: [],
                teams: { red: [], blue: [] },
                status: 'waiting',
                currentRound: 0
            }
        ];

        exampleArenas.forEach(arena => {
            this.arenas.set(arena.id, arena);
        });

        console.log('🎯', this.arenas.size, 'arenas criadas');
    }

    // Enviar convite de duelo
    sendDuelInvite(targetId, targetName) {
        // Verificar cooldown
        const now = Date.now();
        if (now - this.lastInviteTime < this.inviteCooldown) {
            const wait = Math.ceil((this.inviteCooldown - (now - this.lastInviteTime)) / 1000);
            return { success: false, error: `Aguarde ${wait}s para convidar novamente` };
        }

        // Verificar se já está em duelo
        if (this.myDuel) {
            return { success: false, error: 'Você já está em um duelo' };
        }

        // Verificar se já convidou este jogador
        if (this.sentInvites.has(targetId)) {
            return { success: false, error: 'Convite já enviado para este jogador' };
        }

        const invite = {
            fromId: this.playerId,
            fromName: this.playerName,
            toId: targetId,
            toName: targetName,
            timestamp: now,
            expiresAt: now + this.duelTimeout,
            status: 'pending'
        };

        this.sentInvites.set(targetId, invite);
        this.lastInviteTime = now;

        console.log('⚔️ Convite de duelo enviado para', targetName);

        // Simular aceitação automática para teste offline
        setTimeout(() => {
            this.acceptDuelInvite(invite, true);
        }, 5000);

        return { success: true, invite };
    }

    // Receber convite de duelo
    receiveDuelInvite(invite) {
        // Verificar se já está em duelo
        if (this.myDuel) {
            return { success: false, error: 'Você já está em um duelo' };
        }

        // Verificar se já tem convite deste jogador
        if (this.pendingInvites.has(invite.fromId)) {
            return { success: false, error: 'Convite pendente deste jogador' };
        }

        this.pendingInvites.set(invite.fromId, invite);

        if (this.onDuelInvite) {
            this.onDuelInvite(invite);
        }

        console.log('⚔️ Convite de duelo recebido de', invite.fromName);

        // Auto-expirar após timeout
        setTimeout(() => {
            this.expireInvite(invite.fromId);
        }, this.duelTimeout);

        return { success: true };
    }

    // Aceitar convite de duelo
    acceptDuelInvite(invite, auto = false) {
        const pending = this.pendingInvites.get(invite.fromId);
        const sent = this.sentInvites.get(invite.toId);

        if (!pending && !sent && !auto) {
            return { success: false, error: 'Convite não encontrado ou expirado' };
        }

        // Remover convites
        this.pendingInvites.delete(invite.fromId);
        this.sentInvites.delete(invite.toId);

        // Criar duelo
        const duel = this.createDuel(invite.fromId, invite.fromName, invite.toId, invite.toName);

        return { success: true, duel };
    }

    // Recusar convite
    declineDuelInvite(fromId) {
        const invite = this.pendingInvites.get(fromId);
        if (!invite) {
            return { success: false, error: 'Convite não encontrado' };
        }

        this.pendingInvites.delete(fromId);

        // Notificar recusa
        console.log('❌ Convite recusado');

        return { success: true };
    }

    // Cancelar convite enviado
    cancelDuelInvite(targetId) {
        const invite = this.sentInvites.get(targetId);
        if (!invite) {
            return { success: false, error: 'Convite não encontrado' };
        }

        this.sentInvites.delete(targetId);

        console.log('🚫 Convite cancelado');

        return { success: true };
    }

    // Expirar convite
    expireInvite(fromId) {
        const invite = this.pendingInvites.get(fromId);
        if (invite && Date.now() >= invite.expiresAt) {
            this.pendingInvites.delete(fromId);

            // Notificar expiração
            if (this.onDuelInvite) {
                this.onDuelInvite({ ...invite, status: 'expired' });
            }

            console.log('⏰ Convite expirado de', invite.fromName);
        }
    }

    // Criar duelo
    createDuel(player1Id, player1Name, player2Id, player2Name) {
        const duelId = 'duel_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

        const duel = {
            id: duelId,
            player1: {
                id: player1Id,
                name: player1Name,
                hp: 100,
                maxHp: 100,
                ready: false
            },
            player2: {
                id: player2Id,
                name: player2Name,
                hp: 100,
                maxHp: 100,
                ready: false
            },
            status: 'preparing', // preparing, active, ended
            startedAt: null,
            endedAt: null,
            winner: null,
            rounds: 0,
            log: []
        };

        this.activeDuels.set(duelId, duel);
        this.myDuel = duel;

        console.log('⚔️ Duelo criado:', duelId);
        console.log('   Jogador 1:', player1Name);
        console.log('   Jogador 2:', player2Name);

        // Iniciar preparação
        this.startDuelPreparation(duel);

        return duel;
    }

    // Iniciar preparação do duelo
    startDuelPreparation(duel) {
        console.log('🎯 Preparação do duelo iniciada');

        // Jogadores marcar ready (simulação)
        setTimeout(() => {
            duel.player1.ready = true;
            duel.player2.ready = true;
            this.startDuel(duel);
        }, 3000);
    }

    // Iniciar duelo
    startDuel(duel) {
        if (duel.status !== 'preparing') return;

        duel.status = 'active';
        duel.startedAt = Date.now();

        if (this.onDuelStarted) {
            this.onDuelStarted(duel);
        }

        console.log('⚔️⚔️⚔️ DUELO INICIADO ⚔️⚔️⚔️');
        console.log('   ', duel.player1.name, 'vs', duel.player2.name);

        // Simular combate
        this.simulateCombat(duel);
    }

    // Simular combate (modo offline)
    simulateCombat(duel) {
        const combatInterval = setInterval(() => {
            if (duel.status !== 'active') {
                clearInterval(combatInterval);
                return;
            }

            // Simular ataques
            const p1Damage = Math.floor(Math.random() * 15) + 5;
            const p2Damage = Math.floor(Math.random() * 15) + 5;

            duel.player2.hp = Math.max(0, duel.player2.hp - p1Damage);
            duel.player1.hp = Math.max(0, duel.player1.hp - p2Damage);

            duel.rounds++;

            // Log
            duel.log.push({
                round: duel.rounds,
                p1Action: `Ataca causando ${p1Damage} dano`,
                p2Action: `Ataca causando ${p2Damage} dano`,
                p1Hp: duel.player1.hp,
                p2Hp: duel.player2.hp
            });

            // Verificar fim do duelo
            if (duel.player1.hp <= 0 || duel.player2.hp <= 0) {
                clearInterval(combatInterval);
                this.endDuel(duel);
            }

            // Limite de rounds
            if (duel.rounds >= 50) {
                clearInterval(combatInterval);
                duel.player1.hp = 0;
                duel.player2.hp = 0;
                this.endDuel(duel, 'draw');
            }
        }, 1000);
    }

    // Finalizar duelo
    endDuel(duel, result = null) {
        if (duel.status === 'ended') return;

        duel.status = 'ended';
        duel.endedAt = Date.now();

        // Determinar vencedor
        if (result === 'draw') {
            duel.winner = null;
            duel.result = 'draw';
        } else if (duel.player1.hp > 0) {
            duel.winner = duel.player1;
            duel.result = 'player1';
        } else if (duel.player2.hp > 0) {
            duel.winner = duel.player2;
            duel.result = 'player2';
        } else {
            duel.winner = null;
            duel.result = 'draw';
        }

        // Atualizar rankings
        this.updateRankings(duel);

        // Limpar duelo ativo após delay
        setTimeout(() => {
            this.myDuel = null;
            this.activeDuels.delete(duel.id);
        }, 5000);

        if (this.onDuelEnded) {
            this.onDuelEnded(duel);
        }

        console.log('🏁 Duelo finalizado!');
        console.log('   Vencedor:', duel.winner ? duel.winner.name : 'Empate');
        console.log('   Rounds:', duel.rounds);

        // Salvar dados
        this.saveToStorage();
    }

    // Desistir do duelo
    forfeitDuel() {
        if (!this.myDuel || this.myDuel.status !== 'active') {
            return { success: false, error: 'Nenhum duelo ativo' };
        }

        const duel = this.myDuel;

        // Determinar vencedor (o outro jogador)
        if (duel.player1.id === this.playerId) {
            duel.winner = duel.player2;
            duel.result = 'player2';
        } else {
            duel.winner = duel.player1;
            duel.result = 'player1';
        }

        this.endDuel(duel);

        return { success: true };
    }

    // Atualizar rankings após duelo
    updateRankings(duel) {
        let myResult = 'draw';
        let opponentResult = 'draw';

        if (duel.winner) {
            if (duel.winner.id === this.playerId) {
                myResult = 'win';
                opponentResult = 'loss';
            } else {
                myResult = 'loss';
                opponentResult = 'win';
            }
        }

        // Calcular mudança de rating
        const ratingChange = this.calculateRatingChange(myResult);

        // Atualizar meu ranking
        this.myRank.rating = Math.max(0, this.myRank.rating + ratingChange);

        if (myResult === 'win') {
            this.myRank.wins++;
            this.myRank.streak++;
            this.myRank.bestStreak = Math.max(this.myRank.bestStreak, this.myRank.streak);
        } else if (myResult === 'loss') {
            this.myRank.losses++;
            this.myRank.streak = 0;
        } else {
            this.myRank.draws++;
        }

        // Atualizar título
        this.updateTitle();

        if (this.onRankUpdated) {
            this.onRankUpdated(this.myRank, ratingChange);
        }

        console.log('📊 Ranking atualizado:');
        console.log('   Resultado:', myResult.toUpperCase());
        console.log('   Rating:', this.myRank.rating, `( ${ratingChange > 0 ? '+' : ''}${ratingChange} )`);
        console.log('   Título:', this.myRank.title);
    }

    // Calcular mudança de rating
    calculateRatingChange(result) {
        const baseChange = {
            win: 25,
            loss: -20,
            draw: 5
        };

        let change = baseChange[result];

        // Bônus de streak
        if (result === 'win' && this.myRank.streak > 0) {
            change += Math.min(this.myRank.streak * 2, 10);
        }

        return change;
    }

    // Atualizar título baseado no rating
    updateTitle() {
        for (const titleData of this.titles) {
            if (this.myRank.rating >= titleData.min && this.myRank.rating <= titleData.max) {
                this.myRank.title = titleData.title;
                this.myRank.titleColor = titleData.color;
                break;
            }
        }
    }

    // Entrar em arena
    joinArena(arenaId) {
        const arena = this.arenas.get(arenaId);
        if (!arena) {
            return { success: false, error: 'Arena não encontrada' };
        }

        // Verificar se já está em arena
        if (this.currentArena) {
            return { success: false, error: 'Você já está em uma arena' };
        }

        // Verificar nível
        const playerLevel = 1; // Simulação
        if (playerLevel < arena.minLevel) {
            return { success: false, error: `Nível mínimo: ${arena.minLevel}` };
        }

        // Adicionar à arena
        arena.players.push({
            id: this.playerId,
            name: this.playerName,
            ready: false,
            team: null
        });

        this.currentArena = arena;

        if (this.onArenaJoined) {
            this.onArenaJoined(arena);
        }

        console.log('🎯 Entrou na arena:', arena.name);
        console.log('   Jogadores:', arena.players.length, '/', arena.maxPlayers);

        return { success: true, arena };
    }

    // Sair da arena
    leaveArena() {
        if (!this.currentArena) {
            return { success: false, error: 'Você não está em uma arena' };
        }

        const arena = this.currentArena;

        // Remover da lista
        arena.players = arena.players.filter(p => p.id !== this.playerId);

        this.currentArena = null;

        if (this.onArenaLeft) {
            this.onArenaLeft(arena);
        }

        console.log('🚫 Saiu da arena:', arena.name);

        return { success: true };
    }

    // Marcar ready na arena
    setReady(ready = true) {
        if (!this.currentArena) {
            return { success: false, error: 'Você não está em uma arena' };
        }

        const player = this.currentArena.players.find(p => p.id === this.playerId);
        if (player) {
            player.ready = ready;
        }

        // Verificar se todos estão prontos
        const allReady = this.currentArena.players.every(p => p.ready);
        if (allReady && this.currentArena.players.length >= this.currentArena.minPlayers) {
            this.startArenaMatch();
        }

        return { success: true, allReady };
    }

    // Iniciar partida de arena
    startArenaMatch() {
        if (!this.currentArena) return;

        const arena = this.currentArena;
        arena.status = 'active';
        arena.currentRound = 1;

        console.log('🔥 Partida iniciada na arena:', arena.name);
        console.log('   Tipo:', arena.type);
        console.log('   Jogadores:', arena.players.length);

        // Simular partida
        this.simulateArenaMatch(arena);
    }

    // Simular partida de arena
    simulateArenaMatch(arena) {
        // Simulação simplificada para offline
        setTimeout(() => {
            // Determinar vencedor aleatório (para demonstração)
            const winnerIndex = Math.floor(Math.random() * arena.players.length);
            const winner = arena.players[winnerIndex];

            arena.status = 'finished';

            console.log('🏆 Partida finalizada!');
            console.log('   Vencedor:', winner.name);
            console.log('   Recompensas:', arena.rewards);

            // Distribuir recompensas se o jogador ganhou
            if (winner.id === this.playerId) {
                this.giveArenaRewards(arena.rewards);
            }

            // Resetar arena
            setTimeout(() => {
                arena.status = 'waiting';
                arena.players = [];
                arena.currentRound = 0;
                this.currentArena = null;
            }, 5000);

        }, 10000); // 10 segundos de partida
    }

    // Dar recompensas de arena
    giveArenaRewards(rewards) {
        console.log('🎁 Recompensas recebidas:');
        console.log('   💰 Gold:', rewards.gold);
        console.log('   📚 XP:', rewards.xp);
        if (rewards.rating) {
            console.log('   🏆 Rating:', rewards.rating);
        }

        // Adicionar ao inventário se disponível
        if (window.inventoryManager) {
            window.inventoryManager.addGold(rewards.gold);
        }
    }

    // Obter status do PvP
    getPvPStatus() {
        return {
            inDuel: this.myDuel !== null,
            duel: this.myDuel,
            inArena: this.currentArena !== null,
            arena: this.currentArena,
            rank: this.myRank,
            pendingInvites: this.pendingInvites.size,
            sentInvites: this.sentInvites.size,
            totalDuels: this.myRank.wins + this.myRank.losses + this.myRank.draws,
            winRate: this.calculateWinRate()
        };
    }

    // Calcular taxa de vitória
    calculateWinRate() {
        const total = this.myRank.wins + this.myRank.losses + this.myRank.draws;
        if (total === 0) return 0;
        return Math.round((this.myRank.wins / total) * 100);
    }

    // Obter leaderboard (simulação)
    getLeaderboard(limit = 10) {
        // Simulação de leaderboard para modo offline
        const mockLeaderboard = [
            { rank: 1, name: 'DragãoNegro', rating: 2847, wins: 342, losses: 23, title: 'Lenda' },
            { rank: 2, name: 'ElfoMístico', rating: 2712, wins: 298, losses: 45, title: 'Lenda' },
            { rank: 3, name: 'GuerreiroDeAço', rating: 2589, wins: 267, losses: 67, title: 'Mestre' },
            { rank: 4, name: 'MagaSombras', rating: 2456, wins: 234, losses: 89, title: 'Mestre' },
            { rank: 5, name: 'LoboSolitário', rating: 2345, wins: 212, losses: 102, title: 'Elite' },
            { rank: 6, name: 'PaladinoReal', rating: 2234, wins: 198, losses: 134, title: 'Elite' },
            { rank: 7, name: 'ArqueiroNoturno', rating: 2156, wins: 187, losses: 145, title: 'Elite' },
            { rank: 8, name: 'BárbaroFurioso', rating: 2034, wins: 176, losses: 156, title: 'Mestre' },
            { rank: 9, name: 'NecromanteSombrio', rating: 1923, wins: 165, losses: 167, title: 'Campeão' },
            { rank: 10, name: 'Você', rating: this.myRank.rating, wins: this.myRank.wins, losses: this.myRank.losses, title: this.myRank.title, isPlayer: true }
        ];

        return mockLeaderboard.slice(0, limit);
    }

    // Obter arenas disponíveis
    getAvailableArenas() {
        const arenas = [];
        for (const arena of this.arenas.values()) {
            arenas.push({
                ...arena,
                playerCount: arena.players.length,
                canJoin: arena.status === 'waiting' && arena.players.length < arena.maxPlayers
            });
        }
        return arenas;
    }

    // Salvar dados
    saveToStorage() {
        const data = {
            myRank: this.myRank,
            stats: {
                totalDuels: this.myRank.wins + this.myRank.losses + this.myRank.draws,
                winRate: this.calculateWinRate()
            }
        };

        try {
            localStorage.setItem('pvp_data', JSON.stringify(data));
        } catch (e) {
            console.warn('Erro ao salvar dados PvP:', e);
        }
    }

    // Carregar dados
    loadFromStorage() {
        try {
            const data = JSON.parse(localStorage.getItem('pvp_data'));
            if (data && data.myRank) {
                this.myRank = { ...this.myRank, ...data.myRank };
                this.updateTitle();
            }
        } catch (e) {
            console.warn('Erro ao carregar dados PvP:', e);
        }
    }

    // Resetar dados (para testes)
    resetData() {
        this.myRank = {
            rating: 1000,
            wins: 0,
            losses: 0,
            draws: 0,
            streak: 0,
            bestStreak: 0,
            title: 'Novato'
        };

        this.activeDuels.clear();
        this.pendingInvites.clear();
        this.sentInvites.clear();
        this.myDuel = null;
        this.currentArena = null;

        localStorage.removeItem('pvp_data');

        console.log('🔄 Dados PvP resetados');
    }
}

window.PvPManager = PvPManager;
