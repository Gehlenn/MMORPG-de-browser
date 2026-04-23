/**
 * AdvanceClassSystem - Sistema de Classes Estilo Ragnarök
 * 
 * Estrutura:
 * - Aprendiz (lvl 1-10)
 * - 7 Classes Base (lvl 10): Guerreiro, Mago, Ladino, Arqueiro, Druida, Sacerdote, Bruxo
 * - 21 1ª Evoluções (lvl 40): 3 opções por classe base
 * - 63 2ª Evoluções (lvl 80): 3 opções por 1ª evolução
 * - Título de Mestre (lvl 99)
 */

class AdvanceClassSystem {
    constructor(db, characterPersistence) {
        this.db = db;
        this.characterPersistence = characterPersistence;
        this.classes = this.loadClassTree();
        this.EVOLUTION_LEVELS = {
            NOVICE: 1,      // Aprendiz
            BASE: 10,       // Escolhe classe base
            FIRST: 40,      // 1ª evolução
            SECOND: 80,     // 2ª evolução
            MASTER: 99      // Título de mestre
        };
    }

    async initialize() {
        await this.createTables();
        console.log('[AdvanceClassSystem] Sistema de classes inicializado - 91 classes totais');
    }

    async createTables() {
        return new Promise((resolve, reject) => {
            this.db.exec(`
                CREATE TABLE IF NOT EXISTS character_classes (
                    character_id TEXT PRIMARY KEY,
                    novice_class TEXT DEFAULT 'aprendiz',
                    base_class TEXT,
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
     * Load complete class tree - 91 classes total
     */
    loadClassTree() {
        return {
            // ============ CLASSE INICIAL ============
            aprendiz: {
                id: 'aprendiz',
                name: 'Aprendiz',
                tier: 'novice',
                icon: '🎒',
                description: 'Aventureiro em treinamento, ainda não escolheu seu caminho.',
                stats: { str: 5, agi: 5, vit: 5, int: 5, dex: 5, luk: 5 },
                weapons: ['dagger', 'club'],
                armor: 'light',
                skills: ['first_aid', 'trick_dead', 'sitting'],
                nextJobs: ['guerreiro', 'mago', 'ladino', 'arqueiro', 'druida', 'sacerdote', 'bruxo'],
                levelRequired: 10
            },

            // ============ 7 CLASSES BASE (Level 10) ============
            guerreiro: {
                id: 'guerreiro',
                name: 'Guerreiro',
                tier: 'base',
                icon: '⚔️',
                description: 'Combatente corpo a corpo com força bruta e resistência.',
                stats: { str: 12, agi: 7, vit: 11, int: 3, dex: 6, luk: 6 },
                weapons: ['sword', 'spear', 'axe'],
                armor: 'heavy',
                skills: ['bash', 'magnum_break', 'provoke', 'endure', 'hp_recovery'],
                nextJobs: ['cavaleiro', 'berserker', 'templario_guerreiro'],
                levelRequired: 40
            },

            mago: {
                id: 'mago',
                name: 'Mago',
                tier: 'base',
                icon: '🔮',
                description: 'Manipulador de elementos mágicos com poder arcano.',
                stats: { str: 3, agi: 5, vit: 5, int: 14, dex: 8, luk: 5 },
                weapons: ['staff', 'rod'],
                armor: 'cloth',
                skills: ['fire_bolt', 'cold_bolt', 'lightning_bolt', 'energy_coat', 'sight'],
                nextJobs: ['elementalista', 'arcano', 'conjurador'],
                levelRequired: 40
            },

            ladino: {
                id: 'ladino',
                name: 'Ladino',
                tier: 'base',
                icon: '🗡️',
                description: 'Especialista em furtividade, venenos e ataques rápidos.',
                stats: { str: 7, agi: 14, vit: 5, int: 4, dex: 11, luk: 9 },
                weapons: ['dagger', 'katar'],
                armor: 'light',
                skills: ['steal', 'hiding', 'envenom', 'detoxify', 'stealth_walk'],
                nextJobs: ['assassino', 'ninja', 'ladrao_mestre'],
                levelRequired: 40
            },

            arqueiro: {
                id: 'arqueiro',
                name: 'Arqueiro',
                tier: 'base',
                icon: '🏹',
                description: 'Especialista em combate à distância com precisão letal.',
                stats: { str: 5, agi: 12, vit: 6, int: 4, dex: 13, luk: 5 },
                weapons: ['bow', 'crossbow'],
                armor: 'light',
                skills: ['double_strafe', 'arrow_shower', 'improve_concentration', 'owl_eye', 'charge_arrow'],
                nextJobs: ['cacador', 'atirador', 'bardo'],
                levelRequired: 40
            },

            druida: {
                id: 'druida',
                name: 'Druida',
                tier: 'base',
                icon: '🌿',
                description: 'Guardião da natureza que invoca bestas e usa magia natural.',
                stats: { str: 6, agi: 8, vit: 7, int: 10, dex: 7, luk: 7 },
                weapons: ['staff', 'club', 'rod'],
                armor: 'leather',
                skills: ['summon_familiar', 'nature_touch', 'root_bind', 'beast_empathy', 'photosynthesis'],
                nextJobs: ['guardiao_florestal', 'feiticeiro_natural', 'xama'],
                levelRequired: 40
            },

            sacerdote: {
                id: 'sacerdote',
                name: 'Sacerdote',
                tier: 'base',
                icon: '✨',
                description: 'Servidor divino com poderes de cura e proteção sagrada.',
                stats: { str: 5, agi: 5, vit: 8, int: 12, dex: 6, luk: 9 },
                weapons: ['mace', 'staff', 'book'],
                armor: 'robe',
                skills: ['heal', 'blessing', 'angelus', 'cure', 'holy_light'],
                nextJobs: ['santo', 'paladino_sagrado', 'oraculo'],
                levelRequired: 40
            },

            bruxo: {
                id: 'bruxo',
                name: 'Bruxo',
                tier: 'base',
                icon: '💀',
                description: 'Praticante das artes sombrias e maldições.',
                stats: { str: 4, agi: 6, vit: 6, int: 13, dex: 7, luk: 9 },
                weapons: ['rod', 'dagger', 'staff'],
                armor: 'cloth',
                skills: ['soul_drain', 'dark_bolt', 'curse', 'decrease_agility', 'soul_collect'],
                nextJobs: ['necromante', 'mago_sombrio', 'invocador'],
                levelRequired: 40
            },

            // ============ 1ª EVOLUÇÃO - GUERREIRO (3 opções) ============
            cavaleiro: {
                id: 'cavaleiro',
                name: 'Cavaleiro',
                tier: 'first',
                baseClass: 'guerreiro',
                icon: '🛡️',
                description: 'Guerreiro montado com defesa impenetrável e ataques de cavalaria.',
                stats: { str: 15, agi: 8, vit: 14, int: 4, dex: 7, luk: 6 },
                weapons: ['sword', 'spear', 'two_handed_sword'],
                armor: 'heavy',
                skills: ['riding', 'cavalry_mastery', 'two_hand_quicken', 'bowling_bash', 'auto_counter'],
                nextJobs: ['lorde_cavaleiro', 'paladino', 'templario'],
                levelRequired: 80
            },

            berserker: {
                id: 'berserker',
                name: 'Berserker',
                tier: 'first',
                baseClass: 'guerreiro',
                icon: '🪓',
                description: 'Guerreiro feroz que entra em fúria causando dano massivo.',
                stats: { str: 17, agi: 10, vit: 11, int: 3, dex: 7, luk: 5 },
                weapons: ['axe', 'two_handed_axe', 'mace'],
                armor: 'medium',
                skills: ['frenzy', 'berserk', 'fatal_blow', 'anger_mastery', 'bloodlust'],
                nextJobs: ['guerreiro_selvagem', 'destruidor', 'executor'],
                levelRequired: 80
            },

            templario_guerreiro: {
                id: 'templario_guerreiro',
                name: 'Templário',
                tier: 'first',
                baseClass: 'guerreiro',
                icon: '⛨',
                description: 'Guerreiro sagrado que combina força bruta com fé divina.',
                stats: { str: 13, agi: 7, vit: 13, int: 8, dex: 7, luk: 7 },
                weapons: ['sword', 'mace', 'spear'],
                armor: 'heavy',
                skills: ['holy_cross', 'devotion', 'shield_boomerang', 'auto_guard', 'sacrifice'],
                nextJobs: ['cruzado', 'guardiao_divino', 'inquisidor'],
                levelRequired: 80
            },

            // ============ 1ª EVOLUÇÃO - MAGO (3 opções) ============
            elementalista: {
                id: 'elementalista',
                name: 'Elementalista',
                tier: 'first',
                baseClass: 'mago',
                icon: '🔥',
                description: 'Mago que domina fogo, gelo e relâmpago em escala massiva.',
                stats: { str: 4, agi: 6, vit: 6, int: 17, dex: 10, luk: 6 },
                weapons: ['staff', 'rod'],
                armor: 'cloth',
                skills: ['meteor_storm', 'lord_of_vermillion', 'storm_gust', 'earth_spike', 'sight_blaster'],
                nextJobs: ['arquimago', 'elemental_supremo', 'feiticeiro_caos'],
                levelRequired: 80
            },

            arcano: {
                id: 'arcano',
                name: 'Arcano',
                tier: 'first',
                baseClass: 'mago',
                icon: '📚',
                description: 'Mago erudito que estuda magia de livros e manipula propriedades.',
                stats: { str: 4, agi: 7, vit: 6, int: 16, dex: 10, luk: 6 },
                weapons: ['book', 'rod', 'staff'],
                armor: 'cloth',
                skills: ['study', 'free_cast', 'auto_spell', 'deluge', 'violent_gale'],
                nextJobs: ['sabio', 'runomante', 'mistico'],
                levelRequired: 80
            },

            conjurador: {
                id: 'conjurador',
                name: 'Conjurador',
                tier: 'first',
                baseClass: 'mago',
                icon: '🔯',
                description: 'Mago especializado em invocações e magia de suporte.',
                stats: { str: 5, agi: 6, vit: 7, int: 15, dex: 9, luk: 8 },
                weapons: ['staff', 'dagger', 'grimoire'],
                armor: 'cloth',
                skills: ['summon_ignis', 'summon_aqua', 'summon_ventus', 'summon_terra', 'spirit_sympathy'],
                nextJobs: ['invocador_supremo', 'evocador', 'ligante'],
                levelRequired: 80
            },

            // ============ 1ª EVOLUÇÃO - LADINO (3 opções) ============
            assassino: {
                id: 'assassino',
                name: 'Assassino',
                tier: 'first',
                baseClass: 'ladino',
                icon: '☠️',
                description: 'Mestre do assassinato com ataques fatais e venenos mortais.',
                stats: { str: 11, agi: 16, vit: 6, int: 4, dex: 12, luk: 12 },
                weapons: ['katar', 'dagger'],
                armor: 'light',
                skills: ['sonic_blow', 'grimtooth', 'cloaking', 'enchant_poison', 'sonic_acceleration'],
                nextJobs: ['assassino_noturno', 'veneno_mortal', 'sombra_viva'],
                levelRequired: 80
            },

            ninja: {
                id: 'ninja',
                name: 'Ninja',
                tier: 'first',
                baseClass: 'ladino',
                icon: '🥷',
                description: 'Guerreiro das sombras com técnicas de ninjutsu e kunais.',
                stats: { str: 9, agi: 15, vit: 6, int: 6, dex: 13, luk: 8 },
                weapons: ['dagger', 'huuma', 'kunai'],
                armor: 'light',
                skills: ['throw_kunai', 'throw_huuma', 'ninpou', 'mist_slasher', 'shadow_jump'],
                nextJobs: ['mestre_ninja', 'assassino_sombrio', 'kage'],
                levelRequired: 80
            },

            ladrao_mestre: {
                id: 'ladrao_mestre',
                name: 'Ladrão Mestre',
                tier: 'first',
                baseClass: 'ladino',
                icon: '💰',
                description: 'Especialista em roubo, trapaças e desarmar inimigos.',
                stats: { str: 8, agi: 14, vit: 6, int: 5, dex: 14, luk: 10 },
                weapons: ['dagger', 'bow', 'sword'],
                armor: 'light',
                skills: ['plagiarism', 'strip_weapon', 'intimidate', 'snatch', 'steal_coin'],
                nextJobs: ['mestre_trapaceiro', 'enganador', 'infiltrador'],
                levelRequired: 80
            },

            // ============ 1ª EVOLUÇÃO - ARQUEIRO (3 opções) ============
            cacador: {
                id: 'cacador',
                name: 'Caçador',
                tier: 'first',
                baseClass: 'arqueiro',
                icon: '🐺',
                description: 'Rastreador mestre que comanda feras de estimação.',
                stats: { str: 7, agi: 14, vit: 8, int: 5, dex: 14, luk: 7 },
                weapons: ['bow', 'crossbow'],
                armor: 'light',
                skills: ['blitz_beat', 'beast_mastery', 'falconry', 'ankle_snare', 'steel_crow'],
                nextJobs: ['atirador_elite', 'mestre_feras', 'rastreador'],
                levelRequired: 80
            },

            atirador: {
                id: 'atirador',
                name: 'Atirador',
                tier: 'first',
                baseClass: 'arqueiro',
                icon: '🎯',
                description: 'Especialista em precisão letal e tiros mortais.',
                stats: { str: 6, agi: 13, vit: 7, int: 4, dex: 16, luk: 7 },
                weapons: ['bow', 'crossbow', 'gun'],
                armor: 'light',
                skills: ['bulls_eye', 'burst_shot', 'rapid_shot', 'tracking', 'trap_mastery'],
                nextJobs: ['franco_atirador', 'pistoleiro', 'sniper'],
                levelRequired: 80
            },

            bardo: {
                id: 'bardo',
                name: 'Bardo',
                tier: 'first',
                baseClass: 'arqueiro',
                icon: '🎵',
                description: 'Artista de combate que usa música para buffar aliados.',
                stats: { str: 5, agi: 10, vit: 6, int: 9, dex: 12, luk: 13 },
                weapons: ['bow', 'instrument', 'whip'],
                armor: 'light',
                skills: ['music_lessons', 'encore', 'scream', 'lady_luck', 'adaptation'],
                nextJobs: ['menestrel', 'virtuoso', 'maestro'],
                levelRequired: 80
            },

            // ============ 1ª EVOLUÇÃO - DRUIDA (3 opções) ============
            guardiao_florestal: {
                id: 'guardiao_florestal',
                name: 'Guardião Florestal',
                tier: 'first',
                baseClass: 'druida',
                icon: '🌳',
                description: 'Protetor das florestas que invoca espíritos da natureza.',
                stats: { str: 8, agi: 9, vit: 10, int: 11, dex: 7, luk: 8 },
                weapons: ['staff', 'club'],
                armor: 'leather',
                skills: ['summon_treant', 'nature_wrath', 'forest_barrier', 'life_seed', 'entangle'],
                nextJobs: ['senhor_florestal', 'espirito_natureza', 'ancestral'],
                levelRequired: 80
            },

            feiticeiro_natural: {
                id: 'feiticeiro_natural',
                name: 'Feiticeiro Natural',
                tier: 'first',
                baseClass: 'druida',
                icon: '🍃',
                description: 'Manipulador de magia natural com poderes curativos.',
                stats: { str: 5, agi: 8, vit: 7, int: 13, dex: 8, luk: 9 },
                weapons: ['staff', 'rod', 'whip'],
                armor: 'leather',
                skills: ['natural_heal', 'breeze', 'earthquake', 'photosynthesis_max', 'herbalism'],
                nextJobs: ['druida_supremo', 'curandeiro_natureza', 'herbalista'],
                levelRequired: 80
            },

            xama: {
                id: 'xama',
                name: 'Xamã',
                tier: 'first',
                baseClass: 'druida',
                icon: '🔮',
                description: 'Místico que comunica com espíritos e ancestrais.',
                stats: { str: 6, agi: 8, vit: 8, int: 12, dex: 7, luk: 10 },
                weapons: ['totem', 'staff', 'club'],
                armor: 'leather',
                skills: ['spirit_call', 'ancestral_blessing', 'totem_mastery', 'vision', 'ghost_walk'],
                nextJobs: ['xama_supremo', 'espiritualista', 'medico_xama'],
                levelRequired: 80
            },

            // ============ 1ª EVOLUÇÃO - SACERDOTE (3 opções) ============
            santo: {
                id: 'santo',
                name: 'Santo',
                tier: 'first',
                baseClass: 'sacerdote',
                icon: '🕊️',
                description: 'Curandeiro supremo com poderes divinos de regeneração.',
                stats: { str: 5, agi: 5, vit: 9, int: 15, dex: 6, luk: 10 },
                weapons: ['mace', 'staff', 'book'],
                armor: 'robe',
                skills: ['high_heal', 'resurrection', 'angelus_max', 'sacrament', 'divine_protection'],
                nextJobs: ['santo_supremo', 'apostolo', 'santo_guerreiro'],
                levelRequired: 80
            },

            paladino_sagrado: {
                id: 'paladino_sagrado',
                name: 'Paladino Sagrado',
                tier: 'first',
                baseClass: 'sacerdote',
                icon: '✝️',
                description: 'Defensor sagrado que combina fé com combate corpo a corpo.',
                stats: { str: 11, agi: 6, vit: 12, int: 11, dex: 7, luk: 8 },
                weapons: ['sword', 'mace', 'shield'],
                armor: 'heavy',
                skills: ['holy_cross', 'grand_cross', 'smite', 'divine_plea', 'shield_chain'],
                nextJobs: ['paladino_supremo', 'templario_sagrado', 'crusado'],
                levelRequired: 80
            },

            oraculo: {
                id: 'oraculo',
                name: 'Oráculo',
                tier: 'first',
                baseClass: 'sacerdote',
                icon: '👁️',
                description: 'Vidente que prevê ataques e protege aliados com profecias.',
                stats: { str: 4, agi: 6, vit: 7, int: 14, dex: 8, luk: 11 },
                weapons: ['staff', 'rod', 'book'],
                armor: 'robe',
                skills: ['foresight', 'prophecy', 'divine_ward', 'fate_change', 'omen'],
                nextJobs: ['profeta', 'vidente', 'sabio_divino'],
                levelRequired: 80
            },

            // ============ 1ª EVOLUÇÃO - BRUXO (3 opções) ============
            necromante: {
                id: 'necromante',
                name: 'Necromante',
                tier: 'first',
                baseClass: 'bruxo',
                icon: '💀',
                description: 'Mago das trevas que invoca mortos-vivos e manipula almas.',
                stats: { str: 6, agi: 5, vit: 7, int: 16, dex: 7, luk: 9 },
                weapons: ['rod', 'staff', 'dagger'],
                armor: 'cloth',
                skills: ['summon_skeleton', 'raise_dead', 'corpse_explosion', 'bone_armor', 'death_ward'],
                nextJobs: ['senhor_mortos', 'licho', 'ceifador'],
                levelRequired: 80
            },

            mago_sombrio: {
                id: 'mago_sombrio',
                name: 'Mago Sombrio',
                tier: 'first',
                baseClass: 'bruxo',
                icon: '🌑',
                description: 'Mestre das sombras que lança maldições poderosas.',
                stats: { str: 5, agi: 7, vit: 6, int: 15, dex: 8, luk: 9 },
                weapons: ['rod', 'dagger', 'grimoire'],
                armor: 'cloth',
                skills: ['dark_strike', 'shadow_bolt', 'curse_field', 'fear', 'nightmare'],
                nextJobs: ['bruxo_supremo', 'demonologo', 'sombra_eterna'],
                levelRequired: 80
            },

            invocador: {
                id: 'invocador',
                name: 'Invocador',
                tier: 'first',
                baseClass: 'bruxo',
                icon: '👹',
                description: 'Invocador de demônios e criaturas das profundezas.',
                stats: { str: 6, agi: 6, vit: 8, int: 14, dex: 7, luk: 10 },
                weapons: ['staff', 'dagger', 'grimoire'],
                armor: 'cloth',
                skills: ['summon_imp', 'summon_dark_hound', 'demon_pact', 'blood_sacrifice', 'hell_gate'],
                nextJobs: ['invocador_supremo', 'demonomago', 'senhor_demonios'],
                levelRequired: 80
            },

            // ============ 2ª EVOLUÇÃO - CAVALEIRO (3 opções) ============
            lorde_cavaleiro: {
                id: 'lorde_cavaleiro',
                name: 'Lorde Cavaleiro',
                tier: 'second',
                baseClass: 'guerreiro',
                firstJob: 'cavaleiro',
                icon: '👑',
                description: 'Cavaleiro lendário com aura de comando e poder destrutivo.',
                stats: { str: 19, agi: 9, vit: 17, int: 5, dex: 8, luk: 6 },
                weapons: ['sword', 'spear', 'two_handed_sword'],
                armor: 'heavy',
                skills: ['aura_blade', 'parry', 'concentration', 'tension_relax', 'berserk'],
                ultimate: 'joint_beat',
                canMaster: true
            },

            paladino: {
                id: 'paladino',
                name: 'Paladino',
                tier: 'second',
                baseClass: 'guerreiro',
                firstJob: 'cavaleiro',
                icon: '⚔️',
                description: 'Defensor sagrado máximo com poderes divinos.',
                stats: { str: 15, agi: 7, vit: 19, int: 12, dex: 8, luk: 7 },
                weapons: ['sword', 'mace', 'shield'],
                armor: 'heavy',
                skills: ['grand_cross', 'sacrifice', 'gospel', 'pressure', 'divine_plea'],
                ultimate: 'shield_of_justice',
                canMaster: true
            },

            templario: {
                id: 'templario',
                name: 'Templário Supremo',
                tier: 'second',
                baseClass: 'guerreiro',
                firstJob: 'cavaleiro',
                icon: '⛨',
                description: 'Guardião antigo com magia rúnica e defesa impenetrável.',
                stats: { str: 13, agi: 7, vit: 18, int: 15, dex: 8, luk: 7 },
                weapons: ['sword', 'mace', 'rune_weapon'],
                armor: 'heavy',
                skills: ['rune_mastery', 'runic_aura', 'ancient_slam', 'holy_pillar', 'divine_barrier'],
                ultimate: 'rune_of_destruction',
                canMaster: true
            },

            // ============ 2ª EVOLUÇÃO - BERSERKER (3 opções) ============
            guerreiro_selvagem: {
                id: 'guerreiro_selvagem',
                name: 'Guerreiro Selvagem',
                tier: 'second',
                baseClass: 'guerreiro',
                firstJob: 'berserker',
                icon: '🐺',
                description: 'Guerreiro feral que luta com instintos animais.',
                stats: { str: 21, agi: 12, vit: 13, int: 3, dex: 8, luk: 5 },
                weapons: ['axe', 'claw', 'two_handed_axe'],
                armor: 'medium',
                skills: ['animal_rage', 'beast_slash', 'wild_instinct', 'primal_roar', 'frenzy_max'],
                ultimate: 'beast_transformation',
                canMaster: true
            },

            destruidor: {
                id: 'destruidor',
                name: 'Destruidor',
                tier: 'second',
                baseClass: 'guerreiro',
                firstJob: 'berserker',
                icon: '🔨',
                description: 'Guerreiro destrutivo que quebra armaduras e escudos.',
                stats: { str: 22, agi: 8, vit: 14, int: 3, dex: 8, luk: 5 },
                weapons: ['axe', 'mace', 'hammer'],
                armor: 'heavy',
                skills: ['armor_break', 'weapon_crush', 'destroy_shield', 'quake', 'demolish'],
                ultimate: 'world_breaker',
                canMaster: true
            },

            executor: {
                id: 'executor',
                name: 'Executor',
                tier: 'second',
                baseClass: 'guerreiro',
                firstJob: 'berserker',
                icon: '⚔️',
                description: 'Assassino de elite em combate corpo a corpo.',
                stats: { str: 20, agi: 14, vit: 12, int: 3, dex: 10, luk: 6 },
                weapons: ['axe', 'dagger', 'sword'],
                armor: 'medium',
                skills: ['execution', 'fatal_strike', 'blood_rush', 'assassinate', 'death_blow'],
                ultimate: 'instant_execution',
                canMaster: true
            },

            // ============ 2ª EVOLUÇÃO - TEMPLÁRIO GUERREIRO (3 opções) ============
            cruzado: {
                id: 'cruzado',
                name: 'Cruzado Supremo',
                tier: 'second',
                baseClass: 'guerreiro',
                firstJob: 'templario_guerreiro',
                icon: '✝️',
                description: 'Guerreiro sagrado máximo com poder de exorcismo.',
                stats: { str: 14, agi: 7, vit: 17, int: 14, dex: 8, luk: 8 },
                weapons: ['sword', 'mace', 'holy_weapon'],
                armor: 'heavy',
                skills: ['holy_cross_max', 'exorcism', 'conversion', 'resurrection', 'divine_fury'],
                ultimate: 'holy_crusade',
                canMaster: true
            },

            guardiao_divino: {
                id: 'guardiao_divino',
                name: 'Guardião Divino',
                tier: 'second',
                baseClass: 'guerreiro',
                firstJob: 'templario_guerreiro',
                icon: '🛡️',
                description: 'Protetor sagrado impenetrável.',
                stats: { str: 12, agi: 6, vit: 21, int: 12, dex: 7, luk: 8 },
                weapons: ['sword', 'mace', 'shield'],
                armor: 'heavy',
                skills: ['divine_guard', 'sacred_shield', 'holy_wall', 'protection_aura', 'martyr'],
                ultimate: 'divine_fortress',
                canMaster: true
            },

            inquisidor: {
                id: 'inquisidor',
                name: 'Inquisidor',
                tier: 'second',
                baseClass: 'guerreiro',
                firstJob: 'templario_guerreiro',
                icon: '🔥',
                description: 'Caçador de hereges com julgamento divino.',
                stats: { str: 16, agi: 8, vit: 15, int: 13, dex: 9, luk: 7 },
                weapons: ['sword', 'mace', 'whip'],
                armor: 'heavy',
                skills: ['judgment', 'inquisition', 'heretic_burn', 'confession', 'divine_verdict'],
                ultimate: 'final_judgment',
                canMaster: true
            },

            // ============ 2ª EVOLUÇÃO - ELEMENTALISTA (3 opções) ============
            arquimago: {
                id: 'arquimago',
                name: 'Arquimago',
                tier: 'second',
                baseClass: 'mago',
                firstJob: 'elementalista',
                icon: '🔥',
                description: 'Mago supremo com magia elemental destrutiva.',
                stats: { str: 5, agi: 7, vit: 7, int: 23, dex: 12, luk: 6 },
                weapons: ['staff', 'rod', 'grimoire'],
                armor: 'cloth',
                skills: ['magic_crash', 'mana_soul', 'mind_breaker', 'magic_power', 'free_cast_max'],
                ultimate: 'elemental_apocalypse',
                canMaster: true
            },

            elemental_supremo: {
                id: 'elemental_supremo',
                name: 'Elemental Supremo',
                tier: 'second',
                baseClass: 'mago',
                firstJob: 'elementalista',
                icon: '🌟',
                description: 'Mago que se torna um com os elementos.',
                stats: { str: 5, agi: 8, vit: 7, int: 22, dex: 11, luk: 7 },
                weapons: ['staff', 'elemental_orb', 'rod'],
                armor: 'cloth',
                skills: ['elemental_fusion', 'fire_mastery', 'ice_mastery', 'lightning_mastery', 'earth_mastery'],
                ultimate: 'avatar_elemental',
                canMaster: true
            },

            feiticeiro_caos: {
                id: 'feiticeiro_caos',
                name: 'Feiticeiro do Caos',
                tier: 'second',
                baseClass: 'mago',
                firstJob: 'elementalista',
                icon: '🔮',
                description: 'Mago caótico que combina elementos perigosamente.',
                stats: { str: 6, agi: 7, vit: 6, int: 21, dex: 12, luk: 8 },
                weapons: ['chaos_orb', 'staff', 'rod'],
                armor: 'cloth',
                skills: ['chaos_storm', 'elemental_disorder', 'unstable_magic', 'chaos_shield', 'random_burst'],
                ultimate: 'chaos_reign',
                canMaster: true
            },

            // ============ 2ª EVOLUÇÃO - ARCANO (3 opções) ============
            sabio: {
                id: 'sabio',
                name: 'Sábio Supremo',
                tier: 'second',
                baseClass: 'mago',
                firstJob: 'arcano',
                icon: '📚',
                description: 'Sábio que transcendeu com conhecimento absoluto.',
                stats: { str: 5, agi: 8, vit: 7, int: 21, dex: 11, luk: 7 },
                weapons: ['book', 'rod', 'staff'],
                armor: 'cloth',
                skills: ['dispell', 'spell_broker', 'fiber_lock', 'dragonology', 'soul_change'],
                ultimate: 'knowledge_apocalypse',
                canMaster: true
            },

            runomante: {
                id: 'runomante',
                name: 'Runomante',
                tier: 'second',
                baseClass: 'mago',
                firstJob: 'arcano',
                icon: '🔯',
                description: 'Mestre de runas antigas e magia inscrita.',
                stats: { str: 6, agi: 7, vit: 8, int: 20, dex: 12, luk: 7 },
                weapons: ['rune_staff', 'rod', 'rune_book'],
                armor: 'cloth',
                skills: ['rune_mastery', 'rune_craft', 'rune_activation', 'rune_explosion', 'rune_guard'],
                ultimate: 'runic_apocalypse',
                canMaster: true
            },

            mistico: {
                id: 'mistico',
                name: 'Místico',
                tier: 'second',
                baseClass: 'mago',
                firstJob: 'arcano',
                icon: '✨',
                description: 'Mago místico com poderes de intuição e adivinhação.',
                stats: { str: 5, agi: 9, vit: 7, int: 19, dex: 11, luk: 9 },
                weapons: ['crystal_ball', 'staff', 'rod'],
                armor: 'cloth',
                skills: ['clairvoyance', 'precognition', 'telepathy', 'astral_projection', 'mind_read'],
                ultimate: 'omniscience',
                canMaster: true
            },

            // ============ 2ª EVOLUÇÃO - CONJURADOR (3 opções) ============
            invocador_supremo: {
                id: 'invocador_supremo',
                name: 'Invocador Supremo',
                tier: 'second',
                baseClass: 'mago',
                firstJob: 'conjurador',
                icon: '👹',
                description: 'Mestre invocador de criaturas poderosas.',
                stats: { str: 6, agi: 6, vit: 8, int: 20, dex: 10, luk: 10 },
                weapons: ['staff', 'grimoire', 'summon_orb'],
                armor: 'cloth',
                skills: ['summon_diabolus', 'summon_agni', 'summon_aqua_max', 'summon_ventus_max', 'summon_terra_max'],
                ultimate: 'army_of_summons',
                canMaster: true
            },

            evocador: {
                id: 'evocador',
                name: 'Evocador',
                tier: 'second',
                baseClass: 'mago',
                firstJob: 'conjurador',
                icon: '🔥',
                description: 'Especialista em evocação elemental massiva.',
                stats: { str: 5, agi: 7, vit: 7, int: 21, dex: 10, luk: 10 },
                weapons: ['staff', 'elemental_orb', 'rod'],
                armor: 'cloth',
                skills: ['evoke_phoenix', 'evoke_leviathan', 'evoke_behemoth', 'evoke_seraph', 'elemental_overload'],
                ultimate: 'elemental_catastrophe',
                canMaster: true
            },

            ligante: {
                id: 'ligante',
                name: 'Ligante',
                tier: 'second',
                baseClass: 'mago',
                firstJob: 'conjurador',
                icon: '🔗',
                description: 'Mago que liga almas e controla invocados perfeitamente.',
                stats: { str: 5, agi: 6, vit: 8, int: 20, dex: 11, luk: 10 },
                weapons: ['soul_chain', 'staff', 'rod'],
                armor: 'cloth',
                skills: ['soul_bind', 'summon_link', 'symbiosis', 'shared_life', 'summon_fusion'],
                ultimate: 'soul_fusion',
                canMaster: true
            },

            // ============ 2ª EVOLUÇÃO - ASSASSINO (3 opções) ============
            assassino_noturno: {
                id: 'assassino_noturno',
                name: 'Assassino Noturno',
                tier: 'second',
                baseClass: 'ladino',
                firstJob: 'assassino',
                icon: '🌙',
                description: 'Assassino das sombras supremo com poderes noturnos.',
                stats: { str: 14, agi: 22, vit: 7, int: 5, dex: 14, luk: 15 },
                weapons: ['katar', 'dagger', 'shadow_blade'],
                armor: 'light',
                skills: ['advanced_enchant_poison', 'meteor_assault', 'create_deadly_poison', 'soul_breaker', 'hallucination_walk'],
                ultimate: 'shadow_assassination',
                canMaster: true
            },

            veneno_mortal: {
                id: 'veneno_mortal',
                name: 'Veneno Mortal',
                tier: 'second',
                baseClass: 'ladino',
                firstJob: 'assassino',
                icon: '☠️',
                description: 'Especialista em venenos letais e toxinas.',
                stats: { str: 12, agi: 20, vit: 8, int: 6, dex: 13, luk: 16 },
                weapons: ['poison_katar', 'venom_dagger', 'toxic_blade'],
                armor: 'light',
                skills: ['new_poison_research', 'venom_splasher', 'poison_smoke', 'toxin_mastery', 'plague_spread'],
                ultimate: 'extinction_plague',
                canMaster: true
            },

            sombra_viva: {
                id: 'sombra_viva',
                name: 'Sombra Viva',
                tier: 'second',
                baseClass: 'ladino',
                firstJob: 'assassino',
                icon: '👤',
                description: 'Assassino que se tornou uma sombra ambulante.',
                stats: { str: 11, agi: 21, vit: 7, int: 6, dex: 14, luk: 14 },
                weapons: ['shadow_katar', 'ethereal_dagger', 'void_blade'],
                armor: 'light',
                skills: ['shadow_meld', 'phase_walk', 'void_step', 'shadow_clone', 'umbral_strike'],
                ultimate: 'shadow_dimension',
                canMaster: true
            },

            // ============ 2ª EVOLUÇÃO - NINJA (3 opções) ============
            mestre_ninja: {
                id: 'mestre_ninja',
                name: 'Mestre Ninja',
                tier: 'second',
                baseClass: 'ladino',
                firstJob: 'ninja',
                icon: '🥷',
                description: 'Ninja supremo com todas as técnicas ninjas.',
                stats: { str: 11, agi: 22, vit: 7, int: 7, dex: 15, luk: 9 },
                weapons: ['ninjato', 'huuma', 'kunai'],
                armor: 'light',
                skills: ['final_ninpou', 'shadow_warrior', 'summon_illusion', 'ninja_mastery', 'issen'],
                ultimate: 'kouenka',
                canMaster: true
            },

            assassino_sombrio: {
                id: 'assassino_sombrio',
                name: 'Assassino Sombrio',
                tier: 'second',
                baseClass: 'ladino',
                firstJob: 'ninja',
                icon: '🗡️',
                description: 'Ninja especializado em assassinatos silenciosos.',
                stats: { str: 13, agi: 21, vit: 7, int: 5, dex: 14, luk: 11 },
                weapons: ['ninjato', 'sai', 'poison_kunai'],
                armor: 'light',
                skills: ['silent_kill', 'shadow_strike', 'smoke_bomb', 'death_mark', 'silent_step'],
                ultimate: 'night_of_slaughter',
                canMaster: true
            },

            kage: {
                id: 'kage',
                name: 'Kage',
                tier: 'second',
                baseClass: 'ladino',
                firstJob: 'ninja',
                icon: '🌑',
                description: 'Líder ninja sombra com poderes ilusórios supremos.',
                stats: { str: 10, agi: 23, vit: 7, int: 8, dex: 14, luk: 9 },
                weapons: ['kage_weapon', 'shadow_kunai', 'illusion_blade'],
                armor: 'light',
                skills: ['kage_bunshin', 'shadow_possession', 'dark_emperor', 'illusion_master', 'shadow_realm'],
                ultimate: 'infinite_genjutsu',
                canMaster: true
            },

            // ============ 2ª EVOLUÇÃO - LADRÃO MESTRE (3 opções) ============
            mestre_trapaceiro: {
                id: 'mestre_trapaceiro',
                name: 'Mestre Trapaceiro',
                tier: 'second',
                baseClass: 'ladino',
                firstJob: 'ladrao_mestre',
                icon: '🎭',
                description: 'Trapaceiro supremo que engana todos.',
                stats: { str: 9, agi: 19, vit: 7, int: 7, dex: 17, luk: 11 },
                weapons: ['trickster_dagger', 'deception_blade', 'illusion_sword'],
                armor: 'light',
                skills: ['full_strip', 'reproduce_max', 'auto_shadow_spell', 'chase_walk', 'close_confine'],
                ultimate: 'grand_deception',
                canMaster: true
            },

            enganador: {
                id: 'enganador',
                name: 'Enganador',
                tier: 'second',
                baseClass: 'ladino',
                firstJob: 'ladrao_mestre',
                icon: '💫',
                description: 'Mestre do disfarce e engano perfeito.',
                stats: { str: 8, agi: 20, vit: 7, int: 8, dex: 16, luk: 12 },
                weapons: ['disguise_weapon', 'shapeshift_blade', 'mimic_dagger'],
                armor: 'light',
                skills: ['perfect_disguise', 'identity_theft', 'face_mimic', 'voice_copy', 'total_imitation'],
                ultimate: 'perfect_copy',
                canMaster: true
            },

            infiltrador: {
                id: 'infiltrador',
                name: 'Infiltrador',
                tier: 'second',
                baseClass: 'ladino',
                firstJob: 'ladrao_mestre',
                icon: '🕵️',
                description: 'Especialista em infiltração e espionagem.',
                stats: { str: 9, agi: 20, vit: 7, int: 7, dex: 16, luk: 11 },
                weapons: ['infiltrator_blade', 'silent_dagger', 'spy_weapon'],
                armor: 'light',
                skills: ['master_sneak', 'lock_master', 'trap_evasion', 'information_extract', 'silent_entry'],
                ultimate: 'invisible_intruder',
                canMaster: true
            },

            // ============ 2ª EVOLUÇÃO - CAÇADOR (3 opções) ============
            atirador_elite: {
                id: 'atirador_elite',
                name: 'Atirador de Elite',
                tier: 'second',
                baseClass: 'arqueiro',
                firstJob: 'cacador',
                icon: '🎯',
                description: 'Arqueiro supremo com precisão letal absoluta.',
                stats: { str: 8, agi: 19, vit: 8, int: 6, dex: 19, luk: 8 },
                weapons: ['bow', 'crossbow', 'sniper_bow'],
                armor: 'light',
                skills: ['falcon_eyes', 'true_sight', 'falcon_assault', 'sharp_shooting', 'wind_walk'],
                ultimate: 'focused_arrow_strike',
                canMaster: true
            },

            mestre_feras: {
                id: 'mestre_feras',
                name: 'Mestre das Feras',
                tier: 'second',
                baseClass: 'arqueiro',
                firstJob: 'cacador',
                icon: '🐻',
                description: 'Comandante de bestas com criaturas poderosas.',
                stats: { str: 10, agi: 16, vit: 10, int: 7, dex: 15, luk: 11 },
                weapons: ['bow', 'whip', 'horn'],
                armor: 'light',
                skills: ['call_ferus', 'call_vesper', 'call_bayeri', 'mental_shock', 'scratch'],
                ultimate: 'summon_legion',
                canMaster: true
            },

            rastreador: {
                id: 'rastreador',
                name: 'Rastreador',
                tier: 'second',
                baseClass: 'arqueiro',
                firstJob: 'cacador',
                icon: '👣',
                description: 'Caçador que rastreia qualquer presa.',
                stats: { str: 9, agi: 17, vit: 9, int: 6, dex: 17, luk: 9 },
                weapons: ['bow', 'crossbow', 'tracker_bow'],
                armor: 'light',
                skills: ['track', 'hunt_mastery', 'prey_mark', 'relentless_pursuit', 'ambush_master'],
                ultimate: 'no_escape',
                canMaster: true
            },

            // ============ 2ª EVOLUÇÃO - ATIRADOR (3 opções) ============
            franco_atirador: {
                id: 'franco_atirador',
                name: 'Franco Atirador',
                tier: 'second',
                baseClass: 'arqueiro',
                firstJob: 'atirador',
                icon: '🔫',
                description: 'Atirador de longo alcance com precisão cirúrgica.',
                stats: { str: 7, agi: 17, vit: 8, int: 5, dex: 21, luk: 8 },
                weapons: ['sniper_rifle', 'long_bow', 'crossbow'],
                armor: 'light',
                skills: ['snipe', 'headshot', 'steady_aim', 'camouflage', 'one_shot_one_kill'],
                ultimate: 'perfect_shot',
                canMaster: true
            },

            pistoleiro: {
                id: 'pistoleiro',
                name: 'Pistoleiro',
                tier: 'second',
                baseClass: 'arqueiro',
                firstJob: 'atirador',
                icon: '🔫',
                description: 'Especialista em armas de fogo rápidas.',
                stats: { str: 8, agi: 19, vit: 8, int: 5, dex: 19, luk: 8 },
                weapons: ['pistol', 'revolver', 'dual_pistol'],
                armor: 'light',
                skills: ['rapid_fire', 'fanning', 'quick_draw', 'duel_mastery', 'bullet_storm'],
                ultimate: 'bullet_hell',
                canMaster: true
            },

            sniper: {
                id: 'sniper',
                name: 'Sniper',
                tier: 'second',
                baseClass: 'arqueiro',
                firstJob: 'atirador',
                icon: '🎯',
                description: 'Atirador de elite com alcance máximo.',
                stats: { str: 6, agi: 16, vit: 7, int: 6, dex: 22, luk: 8 },
                weapons: ['heavy_sniper', 'anti_materiel_rifle'],
                armor: 'light',
                skills: ['extreme_range', 'penetrating_shot', 'armor_pierce', 'zero_in', 'critical_aim'],
                ultimate: 'annihilation_shot',
                canMaster: true
            },

            // ============ 2ª EVOLUÇÃO - BARDO (3 opções) ============
            menestrel: {
                id: 'menestrel',
                name: 'Menestrel',
                tier: 'second',
                baseClass: 'arqueiro',
                firstJob: 'bardo',
                icon: '🎶',
                description: 'Artista supremo cujas performances mudam batalhas.',
                stats: { str: 6, agi: 13, vit: 7, int: 11, dex: 15, luk: 15 },
                weapons: ['instrument', 'whip', 'bow'],
                armor: 'light',
                skills: ['severe_rainstorm', 'bloom_harmony', 'swing_dance', 'echo_song', 'harmonize'],
                ultimate: 'great_echo',
                canMaster: true
            },

            virtuoso: {
                id: 'virtuoso',
                name: 'Virtuoso',
                tier: 'second',
                baseClass: 'arqueiro',
                firstJob: 'bardo',
                icon: '🎼',
                description: 'Músico virtuoso com sinfonias poderosas.',
                stats: { str: 5, agi: 14, vit: 6, int: 13, dex: 15, luk: 14 },
                weapons: ['virtuoso_instrument', 'maestro_baton', 'sound_whip'],
                armor: 'light',
                skills: ['reverberation', 'metallic_sound', 'dominion_impulse', 'song_of_mana', 'frigg_song'],
                ultimate: 'symphony_of_love',
                canMaster: true
            },

            maestro: {
                id: 'maestro',
                name: 'Maestro',
                tier: 'second',
                baseClass: 'arqueiro',
                firstJob: 'bardo',
                icon: '🎵',
                description: 'Comandante musical que lidera exércitos com música.',
                stats: { str: 6, agi: 13, vit: 7, int: 12, dex: 15, luk: 14 },
                weapons: ['conductor_baton', 'maestro_instrument', 'command_whip'],
                armor: 'light',
                skills: ['orchestra_conductor', 'battle_symphony', 'inspire_courage', 'mass_haste', 'victory_overture'],
                ultimate: 'apocalyptic_symphony',
                canMaster: true
            },

            // ============ 2ª EVOLUÇÃO - GUARDIÃO FLORESTAL (3 opções) ============
            senhor_florestal: {
                id: 'senhor_florestal',
                name: 'Senhor da Floresta',
                tier: 'second',
                baseClass: 'druida',
                firstJob: 'guardiao_florestal',
                icon: '🌳',
                description: 'Protetor supremo das florestas com poder natural absoluto.',
                stats: { str: 10, agi: 10, vit: 12, int: 13, dex: 8, luk: 9 },
                weapons: ['nature_staff', 'ancient_club', 'tree_mace'],
                armor: 'leather',
                skills: ['summon_treant_elder', 'nature_wrath_max', 'forest_barrier', 'life_seed_max', 'verdant_vengeance'],
                ultimate: 'awaken_forest',
                canMaster: true
            },

            espirito_natureza: {
                id: 'espirito_natureza',
                name: 'Espírito da Natureza',
                tier: 'second',
                baseClass: 'druida',
                firstJob: 'guardiao_florestal',
                icon: '🍃',
                description: 'Druida que se tornou um com a natureza.',
                stats: { str: 7, agi: 11, vit: 10, int: 14, dex: 8, luk: 11 },
                weapons: ['spirit_staff', 'nature_orb', 'living_weapon'],
                armor: 'leather',
                skills: ['nature_spirit_form', 'elemental_nature', 'photosynthesis_eternal', 'natural_balance', 'life_burst'],
                ultimate: 'nature_avatar',
                canMaster: true
            },

            ancestral: {
                id: 'ancestral',
                name: 'Ancestral',
                tier: 'second',
                baseClass: 'druida',
                firstJob: 'guardiao_florestal',
                icon: '🌲',
                description: 'Guardião ancestral com sabedoria milenar.',
                stats: { str: 8, agi: 9, vit: 13, int: 13, dex: 7, luk: 11 },
                weapons: ['ancestral_staff', 'ancient_totem', 'wisdom_club'],
                armor: 'leather',
                skills: ['ancestral_wisdom', 'timeless_growth', 'ancient_barrier', 'primordial_force', 'eternal_wood'],
                ultimate: 'primordial_nature',
                canMaster: true
            },

            // ============ 2ª EVOLUÇÃO - FEITICEIRO NATURAL (3 opções) ============
            druida_supremo: {
                id: 'druida_supremo',
                name: 'Druida Supremo',
                tier: 'second',
                baseClass: 'druida',
                firstJob: 'feiticeiro_natural',
                icon: '🌿',
                description: 'Druida máximo com controle total da natureza.',
                stats: { str: 6, agi: 9, vit: 9, int: 17, dex: 9, luk: 10 },
                weapons: ['druid_staff', 'nature_rod', 'earth_whip'],
                armor: 'leather',
                skills: ['natural_heal_max', 'nature_mastery', 'earthquake_max', 'photosynthesis_eternal', 'herbalism_master'],
                ultimate: 'nature_apocalypse',
                canMaster: true
            },

            curandeiro_natureza: {
                id: 'curandeiro_natureza',
                name: 'Curandeiro da Natureza',
                tier: 'second',
                baseClass: 'druida',
                firstJob: 'feiticeiro_natural',
                icon: '💚',
                description: 'Curandeiro supremo com poderes regenerativos.',
                stats: { str: 5, agi: 8, vit: 10, int: 16, dex: 8, luk: 12 },
                weapons: ['healing_staff', 'life_rod', 'cure_whip'],
                armor: 'leather',
                skills: ['regeneration_aura', 'mass_heal', 'resurrection_nature', 'purify', 'life_stream'],
                ultimate: 'fountain_of_life',
                canMaster: true
            },

            herbalista: {
                id: 'herbalista',
                name: 'Herbalista',
                tier: 'second',
                baseClass: 'druida',
                firstJob: 'feiticeiro_natural',
                icon: '🌱',
                description: 'Mestre em poções e ervas medicinais.',
                stats: { str: 6, agi: 9, vit: 9, int: 15, dex: 9, luk: 11 },
                weapons: ['herbal_staff', 'potion_rod', 'medicine_whip'],
                armor: 'leather',
                skills: ['master_brewer', 'potion_mastery', 'elixir_craft', 'antidote_master', 'panacea'],
                ultimate: 'philosopher_stone',
                canMaster: true
            },

            // ============ 2ª EVOLUÇÃO - XAMÃ (3 opções) ============
            xama_supremo: {
                id: 'xama_supremo',
                name: 'Xamã Supremo',
                tier: 'second',
                baseClass: 'druida',
                firstJob: 'xama',
                icon: '🔮',
                description: 'Xamã máximo com controle espiritual absoluto.',
                stats: { str: 7, agi: 9, vit: 10, int: 16, dex: 8, luk: 11 },
                weapons: ['shaman_totem', 'spirit_staff', 'ancestral_club'],
                armor: 'leather',
                skills: ['spirit_call_max', 'ancestral_blessing_max', 'totem_mastery_max', 'vision_true', 'ghost_walk_eternal'],
                ultimate: 'spirit_world_gate',
                canMaster: true
            },

            espiritualista: {
                id: 'espiritualista',
                name: 'Espiritualista',
                tier: 'second',
                baseClass: 'druida',
                firstJob: 'xama',
                icon: '👻',
                description: 'Mestre em manipulação de espíritos.',
                stats: { str: 6, agi: 9, vit: 9, int: 15, dex: 8, luk: 12 },
                weapons: ['spirit_orb', 'ghost_staff', 'soul_rod'],
                armor: 'leather',
                skills: ['spirit_possession', 'soul_manipulation', 'ectoplasm', 'spirit_barrier', 'haunt'],
                ultimate: 'army_of_ghosts',
                canMaster: true
            },

            medico_xama: {
                id: 'medico_xama',
                name: 'Médico Xamã',
                tier: 'second',
                baseClass: 'druida',
                firstJob: 'xama',
                icon: '🏥',
                description: 'Curandeiro espiritual que cura alma e corpo.',
                stats: { str: 6, agi: 8, vit: 10, int: 16, dex: 8, luk: 11 },
                weapons: ['healing_totem', 'medicine_staff', 'cure_rod'],
                armor: 'leather',
                skills: ['spirit_heal', 'soul_cure', 'exorcism_heal', 'blessing_ward', 'spiritual_renewal'],
                ultimate: 'miracle_healing',
                canMaster: true
            },

            // ============ 2ª EVOLUÇÃO - SANTO (3 opções) ============
            santo_supremo: {
                id: 'santo_supremo',
                name: 'Santo Supremo',
                tier: 'second',
                baseClass: 'sacerdote',
                firstJob: 'santo',
                icon: '🕊️',
                description: 'Curandeiro divino máximo com milagres.',
                stats: { str: 6, agi: 6, vit: 11, int: 18, dex: 7, luk: 11 },
                weapons: ['holy_mace', 'divine_staff', 'sacred_book'],
                armor: 'robe',
                skills: ['high_heal_max', 'resurrection_divine', 'angelus_eternal', 'sacrament_max', 'divine_protection_max'],
                ultimate: 'miracle_of_god',
                canMaster: true
            },

            apostolo: {
                id: 'apostolo',
                name: 'Apóstolo',
                tier: 'second',
                baseClass: 'sacerdote',
                firstJob: 'santo',
                icon: '📖',
                description: 'Missionário sagrado que espalha a palavra divina.',
                stats: { str: 7, agi: 6, vit: 10, int: 17, dex: 7, luk: 12 },
                weapons: ['apostle_book', 'holy_symbol', 'preacher_staff'],
                armor: 'robe',
                skills: ['convert', 'blessing_mass', 'divine_word', 'faith_shield', 'sacred_mission'],
                ultimate: 'second_coming',
                canMaster: true
            },

            santo_guerreiro: {
                id: 'santo_guerreiro',
                name: 'Santo Guerreiro',
                tier: 'second',
                baseClass: 'sacerdote',
                firstJob: 'santo',
                icon: '⚔️',
                description: 'Guerreiro sagrado que combate com fé e força.',
                stats: { str: 13, agi: 7, vit: 12, int: 14, dex: 7, luk: 10 },
                weapons: ['holy_sword', 'blessed_mace', 'faith_shield'],
                armor: 'heavy',
                skills: ['holy_strike', 'divine_combat', 'sacred_fury', 'blessed_weapon', 'crusader_stance'],
                ultimate: 'divine_wrath',
                canMaster: true
            },

            // ============ 2ª EVOLUÇÃO - PALADINO SAGRADO (3 opções) ============
            paladino_supremo: {
                id: 'paladino_supremo',
                name: 'Paladino Supremo',
                tier: 'second',
                baseClass: 'sacerdote',
                firstJob: 'paladino_sagrado',
                icon: '🛡️',
                description: 'Defensor sagrado máximo impenetrável.',
                stats: { str: 13, agi: 6, vit: 20, int: 13, dex: 7, luk: 9 },
                weapons: ['holy_sword', 'divine_mace', 'sacred_shield'],
                armor: 'heavy',
                skills: ['holy_cross_max', 'grand_cross_max', 'smite_max', 'divine_plea_max', 'shield_chain_max'],
                ultimate: 'holy_avenger',
                canMaster: true
            },

            templario_sagrado: {
                id: 'templario_sagrado',
                name: 'Templário Sagrado',
                tier: 'second',
                baseClass: 'sacerdote',
                firstJob: 'paladino_sagrado',
                icon: '⛨',
                description: 'Guardião do templo com fé inabalável.',
                stats: { str: 12, agi: 6, vit: 18, int: 14, dex: 7, luk: 10 },
                weapons: ['temple_sword', 'holy_mace', 'templar_shield'],
                armor: 'heavy',
                skills: ['temple_guard', 'sacred_oath', 'divine_duty', 'holy_ground', 'pilgrim_protection'],
                ultimate: 'sanctuary_eternal',
                canMaster: true
            },

            crusado: {
                id: 'crusado',
                name: 'Cruzado',
                tier: 'second',
                baseClass: 'sacerdote',
                firstJob: 'paladino_sagrado',
                icon: '✝️',
                description: 'Guerreiro da cruz com fúria sagrada.',
                stats: { str: 15, agi: 7, vit: 16, int: 13, dex: 8, luk: 8 },
                weapons: ['crusader_sword', 'holy_axe', 'faith_mace'],
                armor: 'heavy',
                skills: ['crusade', 'holy_war', 'zealot_fury', 'divine_charge', 'sacred_conquest'],
                ultimate: 'holy_crusade_final',
                canMaster: true
            },

            // ============ 2ª EVOLUÇÃO - ORÁCULO (3 opções) ============
            profeta: {
                id: 'profeta',
                name: 'Profeta',
                tier: 'second',
                baseClass: 'sacerdote',
                firstJob: 'oraculo',
                icon: '👁️',
                description: 'Vidente que prediz o futuro com precisão absoluta.',
                stats: { str: 5, agi: 7, vit: 8, int: 18, dex: 9, luk: 12 },
                weapons: ['prophet_staff', 'vision_rod', 'fate_book'],
                armor: 'robe',
                skills: ['foresight_true', 'prophecy_true', 'divine_ward_max', 'fate_change_max', 'omen_true'],
                ultimate: 'see_all_fates',
                canMaster: true
            },

            vidente: {
                id: 'vidente',
                name: 'Vidente',
                tier: 'second',
                baseClass: 'sacerdote',
                firstJob: 'oraculo',
                icon: '🔮',
                description: 'Clarividente que vê através de todas as ilusões.',
                stats: { str: 5, agi: 8, vit: 7, int: 17, dex: 9, luk: 13 },
                weapons: ['seer_orb', 'clarity_crystal', 'vision_staff'],
                armor: 'robe',
                skills: ['true_sight_divine', 'pierce_illusion', 'reveal_truth', 'astral_vision', 'future_sight'],
                ultimate: 'omniscient_vision',
                canMaster: true
            },

            sabio_divino: {
                id: 'sabio_divino',
                name: 'Sábio Divino',
                tier: 'second',
                baseClass: 'sacerdote',
                firstJob: 'oraculo',
                icon: '📜',
                description: 'Erudito sagrado com sabedoria divina.',
                stats: { str: 5, agi: 6, vit: 8, int: 19, dex: 8, luk: 11 },
                weapons: ['divine_tome', 'wisdom_staff', 'sacred_scroll'],
                armor: 'robe',
                skills: ['divine_wisdom', 'sacred_knowledge', 'holy_lore', 'blessed_insight', 'godly_understanding'],
                ultimate: 'word_of_god',
                canMaster: true
            },

            // ============ 2ª EVOLUÇÃO - NECROMANTE (3 opções) ============
            senhor_mortos: {
                id: 'senhor_mortos',
                name: 'Senhor dos Mortos',
                tier: 'second',
                baseClass: 'bruxo',
                firstJob: 'necromante',
                icon: '💀',
                description: 'Necromante supremo que comanda exércitos de mortos.',
                stats: { str: 7, agi: 5, vit: 9, int: 19, dex: 7, luk: 10 },
                weapons: ['death_staff', 'bone_wand', 'soul_rod'],
                armor: 'cloth',
                skills: ['summon_skeleton_warrior', 'summon_lich', 'corpse_explosion_max', 'bone_armor_max', 'army_of_dead'],
                ultimate: 'apocalypse_of_dead',
                canMaster: true
            },

            licho: {
                id: 'licho',
                name: 'Lich',
                tier: 'second',
                baseClass: 'bruxo',
                firstJob: 'necromante',
                icon: '👻',
                description: 'Mago imortal que transcendeu a morte.',
                stats: { str: 5, agi: 5, vit: 8, int: 22, dex: 7, luk: 8 },
                weapons: ['lich_phylactery', 'death_orb', 'soul_gem'],
                armor: 'cloth',
                skills: ['undead_form', 'soul_drain_max', 'immortal_mind', 'phylactery', 'death_ward_max'],
                ultimate: 'eternal_lichdom',
                canMaster: true
            },

            ceifador: {
                id: 'ceifador',
                name: 'Ceifador',
                tier: 'second',
                baseClass: 'bruxo',
                firstJob: 'necromante',
                icon: '🌑',
                description: 'Embaixador da morte que ceifa almas.',
                stats: { str: 9, agi: 8, vit: 8, int: 17, dex: 9, luk: 8 },
                weapons: ['scythe', 'death_blade', 'soul_reaper'],
                armor: 'cloth',
                skills: ['soul_reap', 'death_touch', 'harvest_life', 'grim_ward', 'final_hour'],
                ultimate: 'reaper_form',
                canMaster: true
            },

            // ============ 2ª EVOLUÇÃO - MAGO SOMBRIO (3 opções) ============
            bruxo_supremo: {
                id: 'bruxo_supremo',
                name: 'Bruxo Supremo',
                tier: 'second',
                baseClass: 'bruxo',
                firstJob: 'mago_sombrio',
                icon: '🌑',
                description: 'Mago das trevas máximo com poder absoluto.',
                stats: { str: 6, agi: 7, vit: 7, int: 21, dex: 9, luk: 9 },
                weapons: ['dark_staff', 'shadow_rod', 'nightmare_book'],
                armor: 'cloth',
                skills: ['dark_strike_max', 'shadow_bolt_max', 'curse_field_max', 'fear_max', 'nightmare_max'],
                ultimate: 'eternal_darkness',
                canMaster: true
            },

            demonologo: {
                id: 'demonologo',
                name: 'Demonólogo',
                tier: 'second',
                baseClass: 'bruxo',
                firstJob: 'mago_sombrio',
                icon: '👿',
                description: 'Especialista em demônios e pactos infernais.',
                stats: { str: 7, agi: 6, vit: 8, int: 19, dex: 8, luk: 11 },
                weapons: ['demon_staff', 'infernal_rod', 'hell_book'],
                armor: 'cloth',
                skills: ['summon_demon_lord', 'demon_pact_max', 'infernal_flame', 'hell_gate', 'demon_form'],
                ultimate: 'prince_of_hell',
                canMaster: true
            },

            sombra_eterna: {
                id: 'sombra_eterna',
                name: 'Sombra Eterna',
                tier: 'second',
                baseClass: 'bruxo',
                firstJob: 'mago_sombrio',
                icon: '👤',
                description: 'Mago que se tornou uma sombra viva.',
                stats: { str: 5, agi: 10, vit: 6, int: 20, dex: 8, luk: 10 },
                weapons: ['shadow_essence', 'void_rod', 'darkness_orb'],
                armor: 'cloth',
                skills: ['shadow_form', 'darkness_mastery', 'void_walk', 'shadow_magic', 'eternal_night'],
                ultimate: 'become_shadow',
                canMaster: true
            },

            // ============ 2ª EVOLUÇÃO - INVOCADOR (3 opções) ============
            invocador_supremo_bruxo: {
                id: 'invocador_supremo_bruxo',
                name: 'Invocador Supremo',
                tier: 'second',
                baseClass: 'bruxo',
                firstJob: 'invocador',
                icon: '🔥',
                description: 'Mestre invocador de criaturas das trevas.',
                stats: { str: 7, agi: 6, vit: 9, int: 19, dex: 8, luk: 10 },
                weapons: ['summon_staff', 'grimoire', 'binding_rod'],
                armor: 'cloth',
                skills: ['summon_balrog', 'summon_diabolos', 'summon_dark_phoenix', 'blood_sacrifice_max', 'hell_gate_max'],
                ultimate: 'summon_legion_demons',
                canMaster: true
            },

            demononago: {
                id: 'demonomago',
                name: 'Demonomago',
                tier: 'second',
                baseClass: 'bruxo',
                firstJob: 'invocador',
                icon: '👹',
                description: 'Mago que fundiu sua alma com demônios.',
                stats: { str: 8, agi: 6, vit: 9, int: 18, dex: 8, luk: 10 },
                weapons: ['demon_fused_staff', 'corrupted_rod', 'pact_weapon'],
                armor: 'cloth',
                skills: ['demon_fusion', 'infernal_magic', 'hell_flame', 'soul_trade', 'demon_ascension'],
                ultimate: 'demon_god_form',
                canMaster: true
            },

            senhor_demonios: {
                id: 'senhor_demonios',
                name: 'Senhor dos Demônios',
                tier: 'second',
                baseClass: 'bruxo',
                firstJob: 'invocador',
                icon: '😈',
                description: 'Governante dos infernos com legiões demoníacas.',
                stats: { str: 9, agi: 6, vit: 10, int: 18, dex: 8, luk: 10 },
                weapons: ['demon_lord_scepter', 'hell_crown', 'infernal_staff'],
                armor: 'cloth',
                skills: ['demon_command', 'hell_throne', 'infernal_army', 'soul_harvest', 'demon_emperor'],
                ultimate: 'emperor_of_hell',
                canMaster: true
            }
        };
    }

    /**
     * Initialize new character as Aprendiz
     */
    async initializeCharacterClass(characterId) {
        try {
            const novice = this.classes['aprendiz'];

            await new Promise((resolve, reject) => {
                this.db.run(
                    `INSERT OR REPLACE INTO character_classes 
                     (character_id, novice_class, job_level, max_job_level, skill_points)
                     VALUES (?, ?, 1, 10, 0)`,
                    [characterId, 'aprendiz'],
                    (err) => {
                        if (err) reject(err);
                        else resolve();
                    }
                );
            });

            // Give novice skills
            for (const skillId of novice.skills) {
                await this.learnSkill(characterId, skillId, 'novice', 1);
            }

            console.log(`[AdvanceClassSystem] Initialized Aprendiz for ${characterId}`);
            return { success: true, class: novice };
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

            // Check for base class selection (lvl 10)
            if (!charClass.base_class) {
                if (baseLevel < this.EVOLUTION_LEVELS.BASE) {
                    return {
                        canChange: false,
                        currentLevel: baseLevel,
                        requiredLevel: this.EVOLUTION_LEVELS.BASE,
                        message: `Necessário nível ${this.EVOLUTION_LEVELS.BASE} para escolher classe base`
                    };
                }

                const novice = this.classes['aprendiz'];
                return {
                    canChange: true,
                    tier: 'base',
                    options: novice.nextJobs.map(jobId => this.classes[jobId]),
                    currentClass: 'aprendiz'
                };
            }

            // Check for first job (lvl 40)
            if (!charClass.first_job) {
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
                    tier: 'first',
                    options: baseClass.nextJobs?.map(jobId => this.classes[jobId]) || [],
                    currentClass: charClass.base_class
                };
            }

            // Check for second job (lvl 80)
            if (!charClass.second_job) {
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
                    tier: 'second',
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
            if (newJob.tier === 'base' && charClass.novice_class === 'aprendiz') {
                isValidPath = this.classes['aprendiz'].nextJobs.includes(newJobId);
            } else if (newJob.tier === 'first' && charClass.base_class === newJobId.baseClass) {
                isValidPath = true;
            } else if (newJob.tier === 'second' && charClass.first_job === newJob.firstJob) {
                isValidPath = true;
            }

            if (!isValidPath) {
                return { success: false, error: 'Invalid job evolution path' };
            }

            // Update class
            let updateFields = {};
            if (newJob.tier === 'base') {
                updateFields = { base_class: newJobId, job_level: 1, max_job_level: 40, skill_points: 0 };
            } else if (newJob.tier === 'first') {
                updateFields = { first_job: newJobId, job_level: 1, max_job_level: 80, skill_points: 0 };
            } else {
                updateFields = { second_job: newJobId, job_level: 1, max_job_level: 50, skill_points: 0 };
            }

            await this.updateCharacterClass(characterId, updateFields);

            // Learn new skills
            for (const skillId of newJob.skills) {
                await this.learnSkill(characterId, skillId, newJob.tier, 1);
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
            // Guerreiro tree
            'lorde_cavaleiro': 'Mestre da Guerra',
            'paladino': 'Guardião Divino',
            'templario': 'Templário Ancião',
            'guerreiro_selvagem': 'Besta Suprema',
            'destruidor': 'Destruidor de Mundos',
            'executor': 'Juiz Final',
            'cruzado': 'Cruzado Sagrado',
            'guardiao_divino': 'Protetor Celestial',
            'inquisidor': 'Inquisitor Supremo',
            
            // Mago tree
            'arquimago': 'Arquimago Supremo',
            'elemental_supremo': 'Avatar Elemental',
            'feiticeiro_caos': 'Senhor do Caos',
            'sabio': 'Grande Sábio',
            'runomante': 'Mestre das Runas',
            'mistico': 'Olho do Destino',
            'invocador_supremo': 'Invocador de Lendários',
            'evocador': 'Evocador de Titãs',
            'ligante': 'Ligante de Almas',
            
            // Ladino tree
            'assassino_noturno': 'Lâmina Noturna',
            'veneno_mortal': 'Peste Andante',
            'sombra_viva': 'Sombra Eterna',
            'mestre_ninja': 'Grande Kage',
            'assassino_sombrio': 'Ceifador Silencioso',
            'kage': 'Lenda Sombria',
            'mestre_trapaceiro': 'Mestre do Engano',
            'enganador': 'Rei dos Truques',
            'infiltrador': 'Fantasma Infiltrador',
            
            // Arqueiro tree
            'atirador_elite': 'Olho de Águia',
            'mestre_feras': 'Senhor das Bestas',
            'rastreador': 'Rastreador Implacável',
            'franco_atirador': 'Mira Perfeita',
            'pistoleiro': 'Velho Oeste',
            'sniper': 'Alma de Aço',
            'menestrel': 'Virtuoso Supremo',
            'virtuoso': 'Maestro Divino',
            'maestro': 'Comandante de Harmonia',
            
            // Druida tree
            'senhor_florestal': 'Rei da Natureza',
            'espirito_natureza': 'Avatar Verde',
            'ancestral': 'Sábio Ancestral',
            'druida_supremo': 'Guardião Eterno',
            'curandeiro_natureza': 'Toque da Vida',
            'herbalista': 'Alquimista Natural',
            'xama_supremo': 'Xamã Lendário',
            'espiritualista': 'Mestre Espiritual',
            'medico_xama': 'Curandeiro Sagrado',
            
            // Sacerdote tree
            'santo_supremo': 'Santo Milagroso',
            'apostolo': 'Apóstolo Divino',
            'santo_guerreiro': 'Guerreiro da Fé',
            'paladino_supremo': 'Paladino de Ouro',
            'templario_sagrado': 'Templário Inquebrável',
            'crusado': 'Cruzado Dourado',
            'profeta': 'Vidente de Deus',
            'vidente': 'Olho que Tudo Vê',
            'sabio_divino': 'Bibliotecário Celestial',
            
            // Bruxo tree
            'senhor_mortos': 'Rei dos Mortos',
            'licho': 'Lich Imortal',
            'ceifador': 'Ceifador de Almas',
            'bruxo_supremo': 'Senhor das Sombras',
            'demonologo': 'Príncipe do Inferno',
            'sombra_eterna': 'Vazio Ambulante',
            'invocador_supremo_bruxo': 'Invocador Demoníaco',
            'demonomago': 'Deus Demônio',
            'senhor_demonios': 'Imperador Infernal'
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
                                : row.base_class
                                    ? this.classes[row.base_class]
                                    : this.classes[row.novice_class || 'aprendiz']
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

        const tree = {
            base: base,
            firstJobs: [],
            secondJobs: {}
        };

        if (base.nextJobs) {
            for (const firstJobId of base.nextJobs) {
                const firstJob = this.classes[firstJobId];
                tree.firstJobs.push(firstJob);

                if (firstJob.nextJobs) {
                    tree.secondJobs[firstJobId] = firstJob.nextJobs.map(
                        secondJobId => this.classes[secondJobId]
                    );
                }
            }
        }

        return tree;
    }

    /**
     * Get all available classes
     */
    getAllClasses() {
        return Object.values(this.classes).map(c => ({
            id: c.id,
            name: c.name,
            tier: c.tier,
            icon: c.icon,
            description: c.description,
            stats: c.stats,
            weapons: c.weapons,
            armor: c.armor,
            levelRequired: c.levelRequired || null
        }));
    }

    /**
     * Get class statistics
     */
    getClassStatistics() {
        const classes = Object.values(this.classes);
        return {
            total: classes.length,
            novice: classes.filter(c => c.tier === 'novice').length,
            base: classes.filter(c => c.tier === 'base').length,
            first: classes.filter(c => c.tier === 'first').length,
            second: classes.filter(c => c.tier === 'second').length,
            withMaster: classes.filter(c => c.canMaster).length
        };
    }
}

module.exports = AdvanceClassSystem;
