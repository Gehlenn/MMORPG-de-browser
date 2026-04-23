/**
 * AdvanceClassSystem - Ragnarök-style class progression system
 * 4 base classes → 8 1st jobs → 16 2nd jobs → Master classes at 99
 */

class AdvanceClassSystem {
    constructor(db, characterPersistence) {
        this.db = db;
        this.characterPersistence = characterPersistence;
        this.classes = this.loadClassTree();
        this.EVOLUTION_LEVELS = {
            FIRST: 50,      // 1st job change
            SECOND: 80,     // 2nd job change  
            MASTER: 99      // Master title
        };
    }

    async initialize() {
        await this.createTables();
        console.log('[AdvanceClassSystem] Ragnarök-style class system initialized');
    }

    async createTables() {
        return new Promise((resolve, reject) => {
            this.db.exec(`
                CREATE TABLE IF NOT EXISTS character_classes (
                    character_id TEXT PRIMARY KEY,
                    base_class TEXT NOT NULL,
                    first_job TEXT,
                    second_job TEXT,
                    is_master BOOLEAN DEFAULT 0,
                    master_title TEXT,
                    job_level INTEGER DEFAULT 1,
                    max_job_level INTEGER DEFAULT 50,
                    skill_points INTEGER DEFAULT 0,
                    skill_points_used INTEGER DEFAULT 0,
                    FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
                );

                CREATE TABLE IF NOT EXISTS character_skills (
                    character_id TEXT NOT NULL,
                    skill_id TEXT NOT NULL,
                    skill_level INTEGER DEFAULT 1,
                    max_level INTEGER DEFAULT 5,
                    job_tier TEXT NOT NULL,
                    learned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    PRIMARY KEY (character_id, skill_id),
                    FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
                );

                CREATE INDEX IF NOT EXISTS idx_skills_character ON character_skills(character_id);
            `, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    /**
     * Load complete class tree - Ragnarök style
     */
    loadClassTree() {
        return {
            // ============ BASE CLASSES (Level 1) ============
            swordsman: {
                id: 'swordsman',
                name: 'Espadachim',
                tier: 0,
                icon: '⚔️',
                description: 'Guerreiro em treinamento, domina o uso de espadas e defesa.',
                stats: { str: 12, agi: 8, vit: 10, int: 3, dex: 6, luk: 6 },
                weapons: ['sword', 'spear'],
                armor: 'heavy',
                skills: ['bash', 'magnum_break', 'provoke', 'endure'],
                nextJobs: ['knight', 'crusader']
            },

            archer: {
                id: 'archer',
                name: 'Arqueiro',
                tier: 0,
                icon: '🏹',
                description: 'Especialista em combate à distância com arcos e bestas.',
                stats: { str: 5, agi: 12, vit: 6, int: 4, dex: 12, luk: 6 },
                weapons: ['bow', 'crossbow'],
                armor: 'light',
                skills: ['double_strafe', 'arrow_shower', 'improve_concentration', 'owl_eye'],
                nextJobs: ['hunter', 'bard_dancer']
            },

            mage: {
                id: 'mage',
                name: 'Mago',
                tier: 0,
                icon: '🔮',
                description: 'Estudante das artes arcanas, manipula elementos mágicos.',
                stats: { str: 3, agi: 5, vit: 5, int: 15, dex: 8, luk: 4 },
                weapons: ['staff', 'rod'],
                armor: 'cloth',
                skills: ['fire_bolt', 'cold_bolt', 'lightning_bolt', 'energy_coat'],
                nextJobs: ['wizard', 'sage']
            },

            thief: {
                id: 'thief',
                name: 'Ladrão',
                tier: 0,
                icon: '🗡️',
                description: 'Mestre da furtividade e ataques rápidos pelas costas.',
                stats: { str: 7, agi: 15, vit: 5, int: 4, dex: 10, luk: 9 },
                weapons: ['dagger', 'katar'],
                armor: 'light',
                skills: ['steal', 'hiding', 'envenom', 'detoxify'],
                nextJobs: ['assassin', 'rogue']
            },

            // ============ 1ST JOBS (Level 50) ============
            // Swordsman branch
            knight: {
                id: 'knight',
                name: 'Cavaleiro',
                tier: 1,
                baseClass: 'swordsman',
                icon: '🛡️',
                description: 'Elite montado que combina força bruta com técnicas refinadas.',
                stats: { str: 15, agi: 8, vit: 14, int: 4, dex: 7, luk: 6 },
                weapons: ['sword', 'spear', 'two_handed_sword'],
                armor: 'heavy',
                skills: ['two_hand_quicken', 'auto_counter', 'bowling_bash', 'riding', 'cavalry_mastery'],
                nextJobs: ['lord_knight', 'paladin']
            },

            crusader: {
                id: 'crusader',
                name: 'Cruzado',
                tier: 1,
                baseClass: 'swordsman',
                icon: '✝️',
                description: 'Guerreiro sagrado que defende a fé com férvor divino.',
                stats: { str: 12, agi: 8, vit: 14, int: 8, dex: 7, luk: 6 },
                weapons: ['sword', 'spear', 'mace'],
                armor: 'heavy',
                skills: ['holy_cross', 'smite', 'auto_guard', 'shield_boomerang', 'devotion'],
                nextJobs: ['paladin', 'templar']
            },

            // Archer branch
            hunter: {
                id: 'hunter',
                name: 'Caçador',
                tier: 1,
                baseClass: 'archer',
                icon: '🐺',
                description: 'Mestre do arco que comanda feras de estimação.',
                stats: { str: 6, agi: 14, vit: 8, int: 5, dex: 14, luk: 7 },
                weapons: ['bow', 'crossbow'],
                armor: 'light',
                skills: ['blitz_beat', 'beast_mastery', 'falconry', 'ankle_snare', 'steel_crow'],
                nextJobs: ['sniper', 'beast_master']
            },

            bard_dancer: {
                id: 'bard_dancer',
                name: 'Bardo/Dançarina',
                tier: 1,
                baseClass: 'archer',
                icon: '🎵',
                description: 'Artista de combate que usa música e dança para buffar aliados.',
                stats: { str: 5, agi: 10, vit: 6, int: 10, dex: 12, luk: 12 },
                weapons: ['bow', 'instrument', 'whip'],
                armor: 'light',
                skills: ['music_lessons', 'dance_lessons', 'encore', 'scream', 'lady_luck'],
                nextJobs: ['minstrel_gypsy', 'maestro_wanderer']
            },

            // Mage branch
            wizard: {
                id: 'wizard',
                name: 'Feiticeiro',
                tier: 1,
                baseClass: 'mage',
                icon: '🔥',
                description: 'Mago elemental que domina fogo, gelo e relâmpago.',
                stats: { str: 4, agi: 6, vit: 6, int: 18, dex: 10, luk: 6 },
                weapons: ['staff', 'rod'],
                armor: 'cloth',
                skills: ['meteor_storm', 'lord_of_vermillion', 'storm_gust', 'earth_spike', 'sight'],
                nextJobs: ['high_wizard', 'warlock']
            },

            sage: {
                id: 'sage',
                name: 'Sábio',
                tier: 1,
                baseClass: 'mage',
                icon: '📚',
                description: 'Erudito que estuda magia de livros e manipula propriedades elementais.',
                stats: { str: 4, agi: 7, vit: 6, int: 16, dex: 10, luk: 7 },
                weapons: ['book', 'rod', 'staff'],
                armor: 'cloth',
                skills: ['study', 'free_cast', 'auto_spell', 'deluge', 'violent_gale'],
                nextJobs: ['scholar', 'sorcerer']
            },

            // Thief branch
            assassin: {
                id: 'assassin',
                name: 'Assassino',
                tier: 1,
                baseClass: 'thief',
                icon: '☠️',
                description: 'Mestre do assassinato com katars e ataques duplos.',
                stats: { str: 10, agi: 16, vit: 6, int: 4, dex: 12, luk: 12 },
                weapons: ['katar', 'dagger'],
                armor: 'light',
                skills: ['sonic_blow', 'grimtooth', 'cloaking', 'enchant_poison', 'sonic_acceleration'],
                nextJobs: ['assassin_cross', 'guillotine_cross']
            },

            rogue: {
                id: 'rogue',
                name: 'Trapaceiro',
                tier: 1,
                baseClass: 'thief',
                icon: '🎭',
                description: 'Ladino astuto que copia habilidades e desarma armadilhas.',
                stats: { str: 8, agi: 14, vit: 6, int: 6, dex: 14, luk: 8 },
                weapons: ['dagger', 'bow', 'sword'],
                armor: 'light',
                skills: ['plagiarism', 'strip_weapon', 'intimidate', 'snatch', 'sightless_mind'],
                nextJobs: ['stalker', 'shadow_chaser']
            },

            // ============ 2ND JOBS (Level 80) ============
            // Knight branch
            lord_knight: {
                id: 'lord_knight',
                name: 'Lorde Cavaleiro',
                tier: 2,
                baseClass: 'swordsman',
                firstJob: 'knight',
                icon: '👑',
                description: 'Cavaleiro lendário com aura de comando e poder destrutivo.',
                stats: { str: 18, agi: 10, vit: 16, int: 5, dex: 8, luk: 6 },
                weapons: ['sword', 'spear', 'two_handed_sword'],
                armor: 'heavy',
                skills: ['aura_blade', 'parry', 'concentration', 'tension_relax', 'berserk'],
                ultimate: 'joint_beat',
                canMaster: true
            },

            paladin: {
                id: 'paladin',
                name: 'Paladino',
                tier: 2,
                baseClass: 'swordsman',
                firstJob: 'crusader',
                icon: '🛡️',
                description: 'Defensor sagrado máximo com poderes divinos de cura e proteção.',
                stats: { str: 14, agi: 8, vit: 18, int: 12, dex: 7, luk: 6 },
                weapons: ['sword', 'spear', 'mace', 'shield'],
                armor: 'heavy',
                skills: ['grand_cross', 'sacrifice', 'gospel', 'pressure', 'shield_chain'],
                ultimate: 'shield_boomerang_mastery',
                canMaster: true
            },

            templar: {
                id: 'templar',
                name: 'Templário',
                tier: 2,
                baseClass: 'swordsman',
                firstJob: 'crusader',
                icon: '⛨',
                description: 'Guardião antigo com magia rúnica e defesa impenetrável.',
                stats: { str: 12, agi: 8, vit: 16, int: 14, dex: 8, luk: 7 },
                weapons: ['sword', 'mace', 'rune_weapon'],
                armor: 'heavy',
                skills: ['rune_mastery', 'runic_aura', 'ancient_slam', 'holy_pillar', 'divine_plea'],
                ultimate: 'rune_of_destruction',
                canMaster: true
            },

            // Archer branch
            sniper: {
                id: 'sniper',
                name: 'Atirador de Elite',
                tier: 2,
                baseClass: 'archer',
                firstJob: 'hunter',
                icon: '🎯',
                description: 'Arqueiro supremo com precisão letal e habilidades de falcoes avançadas.',
                stats: { str: 8, agi: 18, vit: 8, int: 6, dex: 18, luk: 8 },
                weapons: ['bow', 'crossbow', 'sniper_rifle'],
                armor: 'light',
                skills: ['falcon_eyes', 'true_sight', 'falcon_assault', 'sharp_shooting', 'wind_walk'],
                ultimate: 'focused_arrow_strike',
                canMaster: true
            },

            beast_master: {
                id: 'beast_master',
                name: 'Mestre das Feras',
                tier: 2,
                baseClass: 'archer',
                firstJob: 'hunter',
                icon: '🐻',
                description: 'Comandante de bestas que invoca criaturas poderosas para lutar.',
                stats: { str: 10, agi: 14, vit: 10, int: 8, dex: 14, luk: 10 },
                weapons: ['bow', 'whip', 'horn'],
                armor: 'light',
                skills: ['call_ferus', 'call_vesper', 'call_bayeri', 'mental_shock', 'scratch'],
                ultimate: 'summon_legion',
                canMaster: true
            },

            minstrel_gypsy: {
                id: 'minstrel_gypsy',
                name: 'Menestrel/Gypsy',
                tier: 2,
                baseClass: 'archer',
                firstJob: 'bard_dancer',
                icon: '🎶',
                description: 'Artista supremo cujas performances podem mudar o curso da batalha.',
                stats: { str: 6, agi: 12, vit: 7, int: 12, dex: 14, luk: 14 },
                weapons: ['instrument', 'whip', 'bow'],
                armor: 'light',
                skills: ['severe_rainstorm', 'bloom_harmony', 'swing_dance', 'echo_song', 'harmonize'],
                ultimate: 'great_echo',
                canMaster: true
            },

            maestro_wanderer: {
                id: 'maestro_wanderer',
                name: 'Maestro/Wanderer',
                tier: 2,
                baseClass: 'archer',
                firstJob: 'bard_dancer',
                icon: '🎼',
                description: 'Virtuoso cujas canções reverberam através dos reinos.',
                stats: { str: 5, agi: 14, vit: 6, int: 14, dex: 14, luk: 12 },
                weapons: ['instrument', 'whip'],
                armor: 'light',
                skills: ['reverberation', 'metallic_sound', 'dominion_impulse', 'song_of_mana', 'frigg_song'],
                ultimate: 'symphony_of_love',
                canMaster: true
            },

            // Mage branch
            high_wizard: {
                id: 'high_wizard',
                name: 'Arquimago',
                tier: 2,
                baseClass: 'mage',
                firstJob: 'wizard',
                icon: '🔥',
                description: 'Mago elemental supremo com magia destrutiva em massa.',
                stats: { str: 5, agi: 7, vit: 7, int: 22, dex: 12, luk: 6 },
                weapons: ['staff', 'rod', 'grimoire'],
                armor: 'cloth',
                skills: ['magic_crash', 'soul_drain', 'mind_breaker', 'magic_power', 'free_cast_max'],
                ultimate: 'chain_lightning_mastery',
                canMaster: true
            },

            warlock: {
                id: 'warlock',
                name: 'Bruxo',
                tier: 2,
                baseClass: 'mage',
                firstJob: 'wizard',
                icon: '👿',
                description: 'Mago das trevas que invoca demônios e manipula almas.',
                stats: { str: 6, agi: 6, vit: 8, int: 20, dex: 10, luk: 10 },
                weapons: ['staff', 'dagger', 'grimoire'],
                armor: 'cloth',
                skills: ['summon_ignis', 'summon_aqua', 'summon_ventus', 'summon_terra', 'sacrificial_contract'],
                ultimate: 'summon_diabolus',
                canMaster: true
            },

            scholar: {
                id: 'scholar',
                name: 'Erudito',
                tier: 2,
                baseClass: 'mage',
                firstJob: 'sage',
                icon: '📖',
                description: 'Sábio que transcendeu com conhecimento absoluto e magia de suporte.',
                stats: { str: 5, agi: 8, vit: 7, int: 20, dex: 11, luk: 8 },
                weapons: ['book', 'rod', 'staff'],
                armor: 'cloth',
                skills: ['dispell', 'alchemsit', 'fiber_lock', 'spider_web', 'dragonology'],
                ultimate: 'soul_change',
                canMaster: true
            },

            sorcerer: {
                id: 'sorcerer',
                name: 'Feiticeiro Elemental',
                tier: 2,
                baseClass: 'mage',
                firstJob: 'sage',
                icon: '🌟',
                description: 'Mago que personifica elementos e comanda espíritos da natureza.',
                stats: { str: 5, agi: 9, vit: 7, int: 19, dex: 11, luk: 9 },
                weapons: ['staff', 'dagger', 'elemental_orb'],
                armor: 'cloth',
                skills: ['summon_agarus', 'summon_angra', 'elemental_analysis', 'elemental_shield', 'extreme_vacuum'],
                ultimate: 'elemental_sympathy',
                canMaster: true
            },

            // Thief branch
            assassin_cross: {
                id: 'assassin_cross',
                name: 'Assassino Noturno',
                tier: 2,
                baseClass: 'thief',
                firstJob: 'assassin',
                icon: '🌙',
                description: 'Assassino transcendental com poderes das sombras supremos.',
                stats: { str: 14, agi: 20, vit: 7, int: 5, dex: 14, luk: 15 },
                weapons: ['katar', 'dagger', 'claw'],
                armor: 'light',
                skills: ['advanced_enchant_poison', 'meteor_assault', 'create_deadly_poison', 'soul_breaker', 'venom_splasher'],
                ultimate: 'hallucination_walk',
                canMaster: true
            },

            guillotine_cross: {
                id: 'guillotine_cross',
                name: 'Cruz Guilhotina',
                tier: 2,
                baseClass: 'thief',
                firstJob: 'assassin',
                icon: '🔪',
                description: 'Assassino brutal especializado em execuções rápidas e sangrentas.',
                stats: { str: 16, agi: 18, vit: 8, int: 4, dex: 13, luk: 12 },
                weapons: ['katar', 'dagger', 'swordbreaker'],
                armor: 'light',
                skills: ['rolling_cutter', 'cross_ripper_slasher', 'phantom_menace', 'weapon_blocking', 'dark_illusion'],
                ultimate: 'new_poison_research',
                canMaster: true
            },

            stalker: {
                id: 'stalker',
                name: 'Perseguidor',
                tier: 2,
                baseClass: 'thief',
                firstJob: 'rogue',
                icon: '👤',
                description: 'Trapaceiro mestre que copia habilidades e rouba tudo.',
                stats: { str: 10, agi: 18, vit: 7, int: 7, dex: 16, luk: 9 },
                weapons: ['dagger', 'bow', 'sword'],
                armor: 'light',
                skills: ['full_strip', 'reproduce', 'auto_shadow_spell', 'chase_walk', 'close_confine'],
                ultimate: 'triangle_shot',
                canMaster: true
            },

            shadow_chaser: {
                id: 'shadow_chaser',
                name: 'Caçador de Sombras',
                tier: 2,
                baseClass: 'thief',
                firstJob: 'rogue',
                icon: '🌑',
                description: 'Mestre das sombras que manipula ilusões e reflete magia.',
                stats: { str: 9, agi: 17, vit: 7, int: 10, dex: 15, luk: 9 },
                weapons: ['dagger', 'bow', 'whip'],
                armor: 'light',
                skills: ['manhole', 'dimension_door', 'chaos_panic', 'maelstrom', 'feint_bomb'],
                ultimate: 'emergency_escape',
                canMaster: true
            }
        };
    }

    /**
     * Initialize new character with base class
     */
    async initializeCharacterClass(characterId, baseClassId) {
        try {
            const baseClass = this.classes[baseClassId];
            if (!baseClass) throw new Error(`Invalid base class: ${baseClassId}`);

            await new Promise((resolve, reject) => {
                this.db.run(
                    `INSERT OR REPLACE INTO character_classes 
                     (character_id, base_class, job_level, max_job_level, skill_points)
                     VALUES (?, ?, 1, 50, 0)`,
                    [characterId, baseClassId],
                    (err) => {
                        if (err) reject(err);
                        else resolve();
                    }
                );
            });

            // Give base skills
            for (const skillId of baseClass.skills) {
                await this.learnSkill(characterId, skillId, 'base', 1);
            }

            console.log(`[AdvanceClassSystem] Initialized ${baseClassId} for ${characterId}`);
            return { success: true, class: baseClass };
        } catch (error) {
            console.error('[AdvanceClassSystem] Init error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Check if character can evolve to next job
     */
    async checkJobChange(characterId) {
        try {
            const charClass = await this.getCharacterClass(characterId);
            if (!charClass) return { canChange: false, reason: 'No class found' };

            const activeChar = this.characterPersistence?.getActiveCharacter(characterId);
            const baseLevel = activeChar?.data?.level || 1;

            // Check current tier
            if (!charClass.first_job) {
                // Can do 1st job change at 50
                if (baseLevel < this.EVOLUTION_LEVELS.FIRST) {
                    return {
                        canChange: false,
                        currentLevel: baseLevel,
                        requiredLevel: this.EVOLUTION_LEVELS.FIRST,
                        message: `Necessário nível ${this.EVOLUTION_LEVELS.FIRST} para 1ª evolução`
                    };
                }

                const baseClass = this.classes[charClass.base_class];
                return {
                    canChange: true,
                    tier: 1,
                    options: baseClass.nextJobs.map(jobId => this.classes[jobId]),
                    currentClass: charClass.base_class
                };
            }

            if (!charClass.second_job) {
                // Can do 2nd job change at 80
                if (baseLevel < this.EVOLUTION_LEVELS.SECOND) {
                    return {
                        canChange: false,
                        currentLevel: baseLevel,
                        requiredLevel: this.EVOLUTION_LEVELS.SECOND,
                        message: `Necessário nível ${this.EVOLUTION_LEVELS.SECOND} para 2ª evolução`
                    };
                }

                const firstJob = this.classes[charClass.first_job];
                return {
                    canChange: true,
                    tier: 2,
                    options: firstJob.nextJobs?.map(jobId => this.classes[jobId]) || [],
                    currentClass: charClass.first_job
                };
            }

            // Check master title at 99
            if (!charClass.is_master && baseLevel >= this.EVOLUTION_LEVELS.MASTER) {
                const secondJob = this.classes[charClass.second_job];
                return {
                    canChange: true,
                    tier: 'master',
                    message: 'Desbloquear título de Mestre',
                    currentClass: charClass.second_job,
                    masterTitle: this.generateMasterTitle(charClass.second_job)
                };
            }

            return {
                canChange: false,
                message: 'Classe máxima atingida',
                isMaster: charClass.is_master
            };
        } catch (error) {
            console.error('[AdvanceClassSystem] Check error:', error);
            return { canChange: false, error: error.message };
        }
    }

    /**
     * Perform job change
     */
    async changeJob(characterId, newJobId) {
        try {
            const check = await this.checkJobChange(characterId);
            if (!check.canChange) {
                return { success: false, error: check.reason || 'Cannot change job' };
            }

            const newJob = this.classes[newJobId];
            if (!newJob) return { success: false, error: 'Invalid job' };

            const charClass = await this.getCharacterClass(characterId);
            
            // Verify this is a valid evolution path
            let isValidPath = false;
            if (newJob.tier === 1 && charClass.base_class === newJob.baseClass) {
                isValidPath = true;
            } else if (newJob.tier === 2 && charClass.first_job === newJob.firstJob) {
                isValidPath = true;
            }

            if (!isValidPath) {
                return { success: false, error: 'Invalid job evolution path' };
            }

            // Update class
            const updateFields = newJob.tier === 1 
                ? { first_job: newJobId, job_level: 1, max_job_level: 70 }
                : { second_job: newJobId, job_level: 1, max_job_level: 50 };

            await this.updateCharacterClass(characterId, updateFields);

            // Learn new skills
            for (const skillId of newJob.skills) {
                await this.learnSkill(characterId, skillId, newJob.tier === 1 ? 'first' : 'second', 1);
            }

            // Notify
            this.notifyJobChange(characterId, newJob);

            console.log(`[AdvanceClassSystem] ${characterId} changed to ${newJobId}`);

            return {
                success: true,
                newJob: newJob,
                newSkills: newJob.skills,
                tier: newJob.tier
            };
        } catch (error) {
            console.error('[AdvanceClassSystem] Change error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Apply master title
     */
    async applyMasterTitle(characterId) {
        try {
            const charClass = await this.getCharacterClass(characterId);
            if (!charClass || !charClass.second_job) {
                return { success: false, error: 'No second job found' };
            }

            const activeChar = this.characterPersistence?.getActiveCharacter(characterId);
            if ((activeChar?.data?.level || 0) < this.EVOLUTION_LEVELS.MASTER) {
                return { success: false, error: 'Need level 99' };
            }

            const title = this.generateMasterTitle(charClass.second_job);
            
            await this.updateCharacterClass(characterId, {
                is_master: 1,
                master_title: title
            });

            this.notifyMasterTitle(characterId, title);

            return {
                success: true,
                title: title,
                message: `Parabéns! Você se tornou um ${title}!`
            };
        } catch (error) {
            console.error('[AdvanceClassSystem] Master error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Generate master title based on job
     */
    generateMasterTitle(jobId) {
        const titles = {
            // Knight branch
            lord_knight: 'Mestre da Espada',
            paladin: 'Guardião Divino',
            templar: 'Guardião do Saber',
            
            // Archer branch
            sniper: 'Olho do Falcão',
            beast_master: 'Senhor das Feras',
            minstrel_gypsy: 'Virtuoso Supremo',
            maestro_wanderer: 'Compositor Celestial',
            
            // Mage branch
            high_wizard: 'Arquimago Supremo',
            warlock: 'Senhor das Trevas',
            scholar: 'Bibliotecário Eterno',
            sorcerer: 'Avatar Elemental',
            
            // Thief branch
            assassin_cross: 'Anjo da Morte',
            guillotine_cross: 'Executor Supremo',
            stalker: 'Mestre do Roubo',
            shadow_chaser: 'Caminhante do Vazio'
        };

        return titles[jobId] || `Mestre ${this.classes[jobId]?.name || ''}`;
    }

    /**
     * Learn a skill
     */
    async learnSkill(characterId, skillId, tier, level = 1) {
        return new Promise((resolve, reject) => {
            this.db.run(
                `INSERT OR REPLACE INTO character_skills 
                 (character_id, skill_id, skill_level, job_tier)
                 VALUES (?, ?, ?, ?)`,
                [characterId, skillId, level, tier],
                (err) => {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });
    }

    /**
     * Get character class data
     */
    async getCharacterClass(characterId) {
        return new Promise((resolve, reject) => {
            this.db.get(
                `SELECT * FROM character_classes WHERE character_id = ?`,
                [characterId],
                async (err, row) => {
                    if (err) {
                        reject(err);
                        return;
                    }

                    if (!row) {
                        resolve(null);
                        return;
                    }

                    const skills = await this.getCharacterSkills(characterId);

                    resolve({
                        ...row,
                        isMaster: row.is_master === 1,
                        skills: skills,
                        currentClassDef: row.second_job 
                            ? this.classes[row.second_job]
                            : row.first_job
                                ? this.classes[row.first_job]
                                : this.classes[row.base_class]
                    });
                }
            );
        });
    }

    /**
     * Get character skills
     */
    async getCharacterSkills(characterId) {
        return new Promise((resolve, reject) => {
            this.db.all(
                `SELECT * FROM character_skills WHERE character_id = ?`,
                [characterId],
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows || []);
                }
            );
        });
    }

    /**
     * Update character class fields
     */
    async updateCharacterClass(characterId, fields) {
        const keys = Object.keys(fields);
        const values = Object.values(fields);
        values.push(characterId);

        return new Promise((resolve, reject) => {
            this.db.run(
                `UPDATE character_classes SET ${keys.map(k => `${k} = ?`).join(', ')} 
                 WHERE character_id = ?`,
                values,
                (err) => {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });
    }

    /**
     * Notify player of job change
     */
    notifyJobChange(characterId, newJob) {
        const activeChar = this.characterPersistence?.getActiveCharacter(characterId);
        if (!activeChar?.socket) return;

        activeChar.socket.emit('class:job_change', {
            tier: newJob.tier,
            newClass: newJob.id,
            className: newJob.name,
            icon: newJob.icon,
            description: newJob.description,
            newSkills: newJob.skills,
            ultimate: newJob.ultimate
        });
    }

    /**
     * Notify master title
     */
    notifyMasterTitle(characterId, title) {
        const activeChar = this.characterPersistence?.getActiveCharacter(characterId);
        if (!activeChar?.socket) return;

        activeChar.socket.emit('class:master_title', {
            title: title,
            message: `Você alcançou o pináculo da sua classe!`,
            effects: ['aura_golden', 'title_floating']
        });
    }

    /**
     * Get full class tree for a base class
     */
    getClassTree(baseClassId) {
        const base = this.classes[baseClassId];
        if (!base) return null;

        return {
            base: base,
            firstJobs: base.nextJobs?.map(id => this.classes[id]),
            secondJobs: base.nextJobs?.flatMap(firstId => {
                const first = this.classes[firstId];
                return first.nextJobs?.map(id => this.classes[id]) || [];
            })
        };
    }

    /**
     * Get all available classes for display
     */
    getAllClasses() {
        return Object.values(this.classes).map(c => ({
            id: c.id,
            name: c.name,
            tier: c.tier,
            icon: c.icon,
            baseClass: c.baseClass,
            firstJob: c.firstJob,
            description: c.description
        }));
    }

    /**
     * Calculate stat bonuses from class
     */
    getClassStatBonuses(characterId, classData) {
        const bonuses = { str: 0, agi: 0, vit: 0, int: 0, dex: 0, luk: 0 };
        
        // Base class stats
        const base = this.classes[classData.base_class];
        if (base) {
            Object.entries(base.stats).forEach(([stat, val]) => {
                bonuses[stat] += val;
            });
        }

        // First job bonus
        if (classData.first_job) {
            const first = this.classes[classData.first_job];
            if (first && first.bonusStats) {
                Object.entries(first.bonusStats).forEach(([stat, val]) => {
                    bonuses[stat] += val;
                });
            }
        }

        // Second job bonus
        if (classData.second_job) {
            const second = this.classes[classData.second_job];
            if (second && second.bonusStats) {
                Object.entries(second.bonusStats).forEach(([stat, val]) => {
                    bonuses[stat] += val;
                });
            }
        }

        // Master bonus
        if (classData.is_master) {
            Object.keys(bonuses).forEach(stat => {
                bonuses[stat] += 5;
            });
        }

        return bonuses;
    }
}

module.exports = AdvanceClassSystem;
