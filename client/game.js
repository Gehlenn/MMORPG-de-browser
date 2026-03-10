const byId = (id) => document.getElementById(id);
const { canvas, ctx, GRID_W, GRID_H, createBaseMap, drawGrid, drawEntitySprite } = window.WorldRenderer;

const RACES = {
    human: { name: "Humano", sprite: "sprites/human.webp", hp: 110, atk: 2, def: 1 },
    elf: { name: "Elfo", sprite: "sprites/elf.webp", hp: 95, atk: 4, def: 0 },
    dwarf: { name: "Anao", sprite: "sprites/dwarf.webp", hp: 130, atk: 1, def: 3 }
};

const CLASSES = {
    warrior: { name: "Guerreiro", hp: 30, atk: 6, def: 4, starter: ["iron_sword", "leather_armor", "potion"] },
    mage: { name: "Mago", hp: 10, atk: 8, def: 1, starter: ["oak_staff", "cloth_robe", "potion"] },
    ranger: { name: "Rastreador", hp: 20, atk: 7, def: 2, starter: ["hunter_bow", "leather_armor", "potion"] }
};

const EVOLUTIONS = {
    warrior: ["Guerreiro", "Cavaleiro", "Senhor da Guerra"],
    mage: ["Mago", "Arcanista", "Arquimago"],
    ranger: ["Rastreador", "Cacador", "Guardiao" ]
};

const ITEMS = {
    potion: { name: "Pocao", type: "consumable", heal: 40, value: 10 },
    hi_potion: { name: "Pocao Maior", type: "consumable", heal: 85, value: 25 },
    iron_sword: { name: "Espada de Ferro", type: "weapon", bonusAtk: 4, value: 40 },
    oak_staff: { name: "Cajado de Carvalho", type: "weapon", bonusAtk: 5, value: 45 },
    hunter_bow: { name: "Arco de Caca", type: "weapon", bonusAtk: 4, value: 42 },
    mountain_blade: { name: "Lamina da Montanha", type: "weapon", bonusAtk: 8, value: 120 },
    leather_armor: { name: "Armadura de Couro", type: "armor", bonusDef: 3, value: 35 },
    cloth_robe: { name: "Robe Arcano", type: "armor", bonusDef: 2, value: 30 },
    scale_armor: { name: "Armadura de Escamas", type: "armor", bonusDef: 6, value: 110 },
    focus_ring: { name: "Anel de Foco", type: "accessory", bonusAtk: 2, bonusDef: 2, value: 80 }
};

const MOBS = {
    goblin: { name: "Goblin", hp: 36, atk: 7, def: 1, exp: 20, gold: 12, sprite: "sprites/goblin.webp" },
    wolf: { name: "Lobo", hp: 48, atk: 9, def: 2, exp: 28, gold: 14, sprite: "sprites/wolf.webp" },
    orc: { name: "Orc", hp: 72, atk: 12, def: 4, exp: 45, gold: 24, sprite: "sprites/orc.webp" }
};

const THEMES = {
    city: { floor: "#314a2f", wall: "#1f2a24", grid: "rgba(255,255,255,0.08)", image: "areas/village.webp", desc: "Centro da civilizacao. Aqui voce encontra servicos, quests e mercado." },
    plains: { floor: "#405b33", wall: "#213229", grid: "rgba(255,255,255,0.08)", image: "areas/forest.webp", desc: "Campos abertos com emboscadas ocasionais." },
    north: { floor: "#245d44", wall: "#183b2c", grid: "rgba(255,255,255,0.07)", image: "areas/forest.webp", desc: "Bosque denso ao norte da cidade." },
    mountain_gate: { floor: "#5f7a37", wall: "#36461f", grid: "rgba(0,0,0,0.15)", image: "areas/mountain.webp", desc: "Voce esta perto da entrada para as montanhas." },
    mountain_inside: { floor: "#687b4f", wall: "#3d4b2d", grid: "rgba(0,0,0,0.2)", image: "areas/mountain.webp", desc: "Escarpas frias e trilhas estreitas. Orcs dominam a area." },
    cave_inside: { floor: "#3c475c", wall: "#111827", grid: "rgba(255,255,255,0.08)", image: "areas/cave.webp", desc: "Uma caverna escura cheia de ecos e predadores." },
    swamp: { floor: "#2e4632", wall: "#1b2b1f", grid: "rgba(255,255,255,0.07)", image: "areas/forest.webp", desc: "Pantano hostil no oeste, com nevoa espessa." }
};

const QUEST_TEMPLATES = {
    q_goblin: {
        id: "q_goblin",
        title: "Limpando as Estradas",
        text: "Derrote 3 goblins proximos da cidade.",
        targetMob: "goblin",
        targetCount: 3,
        rewardGold: 60,
        rewardItems: ["hi_potion"]
    },
    q_wolf: {
        id: "q_wolf",
        title: "Ameaca da Floresta",
        text: "Derrote 2 lobos no norte.",
        targetMob: "wolf",
        targetCount: 2,
        rewardGold: 80,
        rewardItems: ["focus_ring"]
    },
    q_orc: {
        id: "q_orc",
        title: "Sangue nas Montanhas",
        text: "Entre nas montanhas e derrote 2 orcs.",
        targetMob: "orc",
        targetCount: 2,
        rewardGold: 120,
        rewardItems: ["mountain_blade"]
    }
};

const MARKET_ITEMS = ["potion", "hi_potion", "scale_armor", "focus_ring"];
const TITLES = [
    { id: "novato", name: "Novato", req: "Nivel 1" },
    { id: "aprendiz", name: "Aprendiz", req: "Nivel 5" },
    { id: "aventureiro", name: "Aventureiro", req: "Nivel 10" },
    { id: "veterano", name: "Veterano", req: "Nivel 20" },
    { id: "lendario", name: "Lendario", req: "Nivel 30" },
    { id: "cacador", name: "Cacador", req: "Derrotar 50 monstros" },
    { id: "mestre_cacador", name: "Mestre Cacador", req: "Derrotar 200 monstros" },
    { id: "explorador", name: "Explorador", req: "Visitar 8 regioes" },
    { id: "heroi", name: "Heroi", req: "Concluir 3 quests" },
    { id: "magnata", name: "Magnata", req: "Ter 1000 ouro" }
];

const ACHIEVEMENTS = [
    { id: "kill_10", category: "combate", name: "Primeiro Sangue", desc: "Derrote 10 monstros", points: 20, check: (s) => s.player.monstersKilled >= 10 },
    { id: "kill_50", category: "combate", name: "Cacador", desc: "Derrote 50 monstros", points: 50, check: (s) => s.player.monstersKilled >= 50 },
    { id: "kill_200", category: "combate", name: "Mestre Cacador", desc: "Derrote 200 monstros", points: 150, check: (s) => s.player.monstersKilled >= 200 },
    { id: "quest_1", category: "quest", name: "Ao Trabalho", desc: "Conclua 1 quest", points: 20, check: (s) => s.player.questsCompleted >= 1 },
    { id: "quest_3", category: "quest", name: "Heroi da Vila", desc: "Conclua 3 quests", points: 80, check: (s) => s.player.questsCompleted >= 3 },
    { id: "explore_4", category: "exploracao", name: "Passos Largos", desc: "Visite 4 regioes", points: 25, check: (s) => s.player.explored.size >= 4 },
    { id: "explore_8", category: "exploracao", name: "Cartografo", desc: "Visite 8 regioes", points: 90, check: (s) => s.player.explored.size >= 8 },
    { id: "gold_500", category: "economia", name: "Bolsa Cheia", desc: "Acumule 500 ouro", points: 35, check: (s) => s.player.gold >= 500 },
    { id: "gold_1000", category: "economia", name: "Magnata", desc: "Acumule 1000 ouro", points: 120, check: (s) => s.player.gold >= 1000 },
    { id: "lvl_10", category: "especial", name: "Ascensao", desc: "Alcance nivel 10", points: 100, check: (s) => s.player.level >= 10 }
];

const HUNT_BOARD = [
    { id: "hunt_goblin", target: "goblin", amount: 8, rewardGold: 90, rewardExp: 80 },
    { id: "hunt_wolf", target: "wolf", amount: 6, rewardGold: 120, rewardExp: 120 },
    { id: "hunt_orc", target: "orc", amount: 4, rewardGold: 180, rewardExp: 180 }
];

const DUNGEONS = {
    solo_ruins: { id: "solo_ruins", name: "Ruinas Solitarias", mode: "solo", floors: 2, rewardGold: 140, rewardExp: 160, mobPool: ["goblin", "wolf"] },
    group_crypt: { id: "group_crypt", name: "Cripta de Grupo", mode: "group", floors: 3, rewardGold: 260, rewardExp: 320, mobPool: ["wolf", "orc", "orc"] }
};

const state = {
    screen: "login",
    sessionUser: "",
    imageAngle: 0,
    animTick: 0,
    worldX: 0,
    worldY: 0,
    instance: null,
    dungeonRun: null,
    mapData: createBaseMap(),
    mobs: [],
    npcs: [],
    player: null,
    activeTab: "inventory",
    quests: [],
    currentTheme: THEMES.city,
    locationId: "city",
    locationName: "Cidade Inicial",
    logEntries: [],
    logFilter: "all",
    viewportPreset: "auto"
};

const spriteCache = {};

async function authRegister(username, email, password) {
    const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password })
    });
    return response.json();
}

async function authLogin(username, password) {
    const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
    });
    return response.json();
}

function getPartyXpBonusPercent() {
    if (!state.player || state.player.party.members.length <= 1) return 0;
    const base = Math.min(4, state.player.party.members.length) * 5;
    const closed = state.player.party.closed ? 10 : 0;
    return base + closed;
}


function applyViewportPreset() {
    document.body.classList.remove("preset-1366", "preset-1920");
    if (state.viewportPreset === "1366x768") {
        document.body.classList.add("preset-1366");
    } else if (state.viewportPreset === "1920x1080") {
        document.body.classList.add("preset-1920");
    }
}
function setScreen(screenName) {
    state.screen = screenName;
    byId("loginScreen").classList.toggle("visible", screenName === "login");
    byId("characterScreen").classList.toggle("visible", screenName === "character");
    byId("gameScreen").classList.toggle("visible", screenName === "game");
}

function matchesLogFilter(entry) {
    if (state.logFilter === "all") return true;
    if (state.logFilter === "combat") return ["combat", "danger", "dungeon"].includes(entry.type);
    if (state.logFilter === "quest") return ["quest", "level"].includes(entry.type);
    if (state.logFilter === "loot") return ["loot", "reward"].includes(entry.type);
    return true;
}

function renderLog() {
    const box = byId("log");
    if (!box) return;

    const filtered = (state.logEntries || []).filter(matchesLogFilter);
    if (filtered.length === 0) {
        box.innerHTML = '<div class="log-empty">Sem eventos para esse filtro.</div>';
        return;
    }

    box.innerHTML = filtered
        .map((entry) => `<div class="log-entry log-${entry.type}"><span class="log-time">${entry.time}</span><span>${entry.message}</span></div>`)
        .join("");

    box.scrollTop = box.scrollHeight;
}

function logMessage(msg, type = "info") {
    if (!state.logEntries) state.logEntries = [];
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    const ss = String(now.getSeconds()).padStart(2, "0");

    state.logEntries.push({
        message: msg,
        type,
        time: `${hh}:${mm}:${ss}`
    });

    if (state.logEntries.length > 120) {
        state.logEntries = state.logEntries.slice(-120);
    }

    renderLog();
}

function nextLevelExp(level) {
    return 65 + level * 35;
}

function getEvolutionName(baseClass, level) {
    const stages = EVOLUTIONS[baseClass] || [CLASSES[baseClass].name];
    if (level >= 10 && stages[2]) return stages[2];
    if (level >= 5 && stages[1]) return stages[1];
    return stages[0];
}

function totalStats() {
    const p = state.player;
    const race = RACES[p.race];
    const baseClass = CLASSES[p.baseClass];
    const eq = p.equipment;
    let atkBonus = 0;
    let defBonus = 0;

    Object.values(eq).forEach((itemId) => {
        if (!itemId) return;
        const item = ITEMS[itemId];
        atkBonus += item.bonusAtk || 0;
        defBonus += item.bonusDef || 0;
    });

    const attack = race.atk + baseClass.atk + p.level * 2 + atkBonus;
    const defense = race.def + baseClass.def + p.level + defBonus;
    const maxHp = race.hp + baseClass.hp + p.level * 12;

    return { attack, defense, maxHp };
}

function healToMax() {
    const stats = totalStats();
    state.player.hp = stats.maxHp;
}

function addItem(itemId, qty = 1) {
    for (let i = 0; i < qty; i += 1) {
        state.player.inventory.push(itemId);
    }
}

function removeItem(itemId) {
    const idx = state.player.inventory.indexOf(itemId);
    if (idx >= 0) {
        state.player.inventory.splice(idx, 1);
        return true;
    }
    return false;
}

function seededRng(seedText) {
    let seed = 0;
    for (let i = 0; i < seedText.length; i += 1) {
        seed = (seed * 31 + seedText.charCodeAt(i)) >>> 0;
    }
    return () => {
        seed = (seed * 1664525 + 1013904223) >>> 0;
        return seed / 4294967296;
    };
}
function unlockTitle(titleId) {
    state.player.unlockedTitles.add(titleId);
    if (!state.player.currentTitle) {
        const info = TITLES.find((t) => t.id === titleId);
        if (info) state.player.currentTitle = info.name;
    }
}

function refreshTitles() {
    if (state.player.level >= 1) unlockTitle("novato");
    if (state.player.level >= 5) unlockTitle("aprendiz");
    if (state.player.level >= 10) unlockTitle("aventureiro");
    if (state.player.level >= 20) unlockTitle("veterano");
    if (state.player.level >= 30) unlockTitle("lendario");
    if (state.player.monstersKilled >= 50) unlockTitle("cacador");
    if (state.player.monstersKilled >= 200) unlockTitle("mestre_cacador");
    if (state.player.explored.size >= 8) unlockTitle("explorador");
    if (state.player.questsCompleted >= 3) unlockTitle("heroi");
    if (state.player.gold >= 1000) unlockTitle("magnata");
}

function updateAchievements() {
    ACHIEVEMENTS.forEach((ach) => {
        if (state.player.unlockedAchievements.has(ach.id)) return;
        if (!ach.check(state)) return;
        state.player.unlockedAchievements.add(ach.id);
        state.player.achievementPoints += ach.points;
        logMessage(`Conquista desbloqueada: ${ach.name} (+${ach.points} pts)`);
    });
    refreshTitles();
}

function getWorldContext() {
    if (state.instance && state.instance.startsWith("dungeon:")) {
        const dungeonId = state.instance.split(":")[1];
        const d = DUNGEONS[dungeonId];
        if (d) {
            return {
                id: `dungeon_${d.id}`,
                name: `${d.name} - Andar ${state.dungeonRun ? state.dungeonRun.floor : 1}`,
                ...THEMES.cave_inside,
                image: "areas/cave.webp",
                desc: `Dungeon ${d.mode === "solo" ? "solo" : "em grupo"}. Derrote todos os mobs para subir.` ,
                mobPool: d.mobPool,
                npcs: []
            };
        }
    }
    if (state.instance === "mountain") {
        return { id: "mountain_inside", name: "Montanhas", ...THEMES.mountain_inside, mobPool: ["orc", "orc", "wolf"], npcs: ["Sentinela"] };
    }
    if (state.instance === "cave") {
        return { id: "cave_inside", name: "Caverna do Eco", ...THEMES.cave_inside, mobPool: ["wolf", "orc"], npcs: ["Minerador"] };
    }

    if (state.worldX === 0 && state.worldY === 0) {
        return { id: "city", name: "Cidade Inicial", ...THEMES.city, mobPool: [], npcs: ["Taverneiro", "Mercadora", "Capitao"] };
    }
    if (state.worldY >= 2) {
        return { id: "mountain_gate", name: "Sopé das Montanhas", ...THEMES.mountain_gate, mobPool: ["wolf", "orc"], npcs: ["Explorador"] };
    }
    if (state.worldY <= -2) {
        return { id: "north", name: "Norte Selvagem", ...THEMES.north, mobPool: ["wolf", "goblin"], npcs: ["Ranger"] };
    }
    if (state.worldX <= -2) {
        return { id: "swamp", name: "Pantano Oeste", ...THEMES.swamp, mobPool: ["goblin", "wolf"], npcs: ["Ermitao"] };
    }
    return { id: "plains", name: "Campos Centrais", ...THEMES.plains, mobPool: ["goblin", "wolf"], npcs: ["Viajante"] };
}

function nearbyEntries(context) {
    if ((state.instance === "mountain" || state.instance === "cave") || (state.instance && state.instance.startsWith("dungeon:"))) {
        return [{ id: "exit_instance", label: "Sair para o mundo" }];
    }

    const entries = [];
    if (context.id === "mountain_gate") {
        entries.push({ id: "enter_mountain", label: "Entrar nas Montanhas" });
    }
    if (context.id === "north") {
        entries.push({ id: "enter_cave", label: "Entrar na Caverna do Eco" });
    }
    if (state.worldX === 0 && state.worldY === 0) {
        entries.push({ id: "city_center", label: "Voce esta no centro da cidade" });
    }
    return entries;
}

function spawnEntities(context) {
    const rng = seededRng(`${state.worldX}:${state.worldY}:${context.id}`);
    state.mapData = createBaseMap();

    for (let i = 0; i < 18; i += 1) {
        const rx = 2 + Math.floor(rng() * (GRID_W - 4));
        const ry = 2 + Math.floor(rng() * (GRID_H - 4));
        if ((rx === 2 && ry === 2) || (rx === GRID_W - 3 && ry === GRID_H - 3)) continue;
        if (rng() > 0.7) state.mapData[ry][rx] = 1;
    }

    state.mapData[2][2] = 0;
    state.mapData[GRID_H - 3][GRID_W - 3] = 0;

    state.mobs = [];
    let mobCount = Math.min(5, context.mobPool.length + 1);
    if (state.instance && state.instance.startsWith("dungeon:")) {
        mobCount = Math.min(8, (state.dungeonRun ? state.dungeonRun.floor : 1) + 2);
    }
    for (let i = 0; i < mobCount; i += 1) {
        if (context.mobPool.length === 0) break;
        const type = context.mobPool[Math.floor(rng() * context.mobPool.length)];
        let x = 3;
        let y = 3;
        let guard = 0;
        while (guard < 40) {
            x = 1 + Math.floor(rng() * (GRID_W - 2));
            y = 1 + Math.floor(rng() * (GRID_H - 2));
            if (state.mapData[y][x] === 0 && (x !== state.player.x || y !== state.player.y)) break;
            guard += 1;
        }
        state.mobs.push({ id: `${type}-${i}`, type, x, y, hp: MOBS[type].hp });
    }

    state.npcs = context.npcs.map((name, i) => ({
        id: `npc-${i}`,
        name,
        x: GRID_W - 4 - i,
        y: 2 + i,
        sprite: i % 2 === 0 ? RACES.human.sprite : RACES.elf.sprite
    }));
}

function updateLocation() {
    const context = getWorldContext();
    state.currentTheme = context;
    state.locationId = context.id;
    state.locationName = context.name;

    byId("locationName").innerText = context.name;
    byId("locationDesc").innerText = context.desc;
    byId("locationImage").src = context.image;
    byId("locationImage").style.transform = `rotate(${state.imageAngle}deg)`;

    byId("cityServices").classList.toggle("hidden", context.id !== "city");
    if (context.id !== "city") {
        byId("marketPanel").classList.add("hidden");
        byId("marketPanel").innerHTML = "";
    }

    state.player.explored.add(context.id);
    updateAchievements();

    renderEntries(context);
    spawnEntities(context);
}

function renderEntries(context) {
    const box = byId("entryButtons");
    box.innerHTML = "";
    const entries = nearbyEntries(context);

    entries.forEach((entry) => {
        const btn = document.createElement("button");
        btn.innerText = entry.label;
        btn.disabled = entry.id === "city_center";
        btn.onclick = () => handleEntry(entry.id);
        box.appendChild(btn);
    });

    if (entries.length === 0) {
        const p = document.createElement("div");
        p.className = "small";
        p.innerText = "Nenhuma entrada especial por perto.";
        box.appendChild(p);
    }
}

function handleEntry(entryId) {
    if (entryId === "enter_mountain") {
        state.instance = "mountain";
        state.player.x = 2;
        state.player.y = 2;
        updateLocation();
        logMessage("Voce entrou nas Montanhas.");
        return;
    }
    if (entryId === "enter_cave") {
        state.instance = "cave";
        state.player.x = 2;
        state.player.y = 2;
        updateLocation();
        logMessage("Voce entrou na Caverna do Eco.");
        return;
    }
    if (entryId === "exit_instance") {
        if (state.instance && state.instance.startsWith("dungeon:") && state.dungeonRun) {
            state.worldX = state.dungeonRun.originX;
            state.worldY = state.dungeonRun.originY;
        }
        state.instance = null;
        state.dungeonRun = null;
        state.player.x = 2;
        state.player.y = 2;
        updateLocation();
        logMessage("Voce voltou ao mundo aberto.");
    }
}

function moveWorld(direction) {
    if (state.instance) {
        logMessage("Saia da area especial para mover no mundo principal.");
        return;
    }

    if (direction === "north") state.worldY -= 1;
    if (direction === "south") state.worldY += 1;
    if (direction === "west") state.worldX -= 1;
    if (direction === "east") state.worldX += 1;

    const eventRoll = Math.random();
    if (eventRoll < 0.12) {
        addItem("potion", 1);
        logMessage("Evento: um viajante deixou uma Pocao para voce.");
    } else if (eventRoll < 0.2) {
        state.player.gold += 10;
        logMessage("Evento: voce encontrou 10 ouro na estrada.");
    } else {
        logMessage(`Voce seguiu para ${direction}.`);
    }

    state.player.x = 2;
    state.player.y = 2;
    updateLocation();
    updateAchievements();
    renderAll();
}

function canWalk(x, y) {
    if (x < 0 || y < 0 || x >= GRID_W || y >= GRID_H) return false;
    return state.mapData[y][x] === 0;
}

function applyQuestProgress(mobType) {
    state.quests.forEach((quest) => {
        if (quest.completed) return;
        if (quest.targetMob !== mobType) return;
        quest.progress += 1;
        if (quest.progress >= quest.targetCount) {
            quest.completed = true;
            logMessage(`Quest concluida: ${quest.title}. Volte ao quadro para receber.`, "quest");
        }
    });
}

function grantRewards(quest) {
    if (quest.claimed || !quest.completed) return;
    state.player.gold += quest.rewardGold;
    quest.rewardItems.forEach((item) => addItem(item, 1));
    quest.claimed = true;
    state.player.questsCompleted += 1;
    logMessage(`Recompensa de quest recebida: ${quest.title}.`, "reward");
    updateAchievements();
}

function applyHuntProgress(mobType) {
    state.player.hunts.forEach((hunt) => {
        if (hunt.claimed) return;
        if (hunt.target !== mobType) return;
        hunt.progress += 1;
        if (hunt.progress >= hunt.amount) hunt.completed = true;
    });
}

function checkCombat() {
    const mobIndex = state.mobs.findIndex((mob) => mob.x === state.player.x && mob.y === state.player.y);
    if (mobIndex < 0) return;

    const mob = state.mobs[mobIndex];
    const mobData = MOBS[mob.type];
    const stats = totalStats();
    let playerHp = state.player.hp;
    let mobHp = mob.hp;
    let rounds = 0;
    const combatLines = [];

    logMessage(`Combate iniciado contra ${mobData.name}.`, "combat");

    while (playerHp > 0 && mobHp > 0) {
        rounds += 1;
        const dealt = Math.max(2, stats.attack - mobData.def + Math.floor(Math.random() * 4));
        mobHp = Math.max(0, mobHp - dealt);
        combatLines.push(`Turno ${rounds}: voce causou ${dealt} de dano (${mobHp} HP do inimigo).`);

        if (mobHp > 0) {
            const received = Math.max(1, mobData.atk - stats.defense + Math.floor(Math.random() * 3));
            playerHp = Math.max(0, playerHp - received);
            combatLines.push(`Turno ${rounds}: ${mobData.name} causou ${received} de dano (${playerHp} HP seu).`);
        }
    }

    const visibleLines = combatLines.slice(0, 8);
    visibleLines.forEach((line) => logMessage(line, "combat"));
    if (combatLines.length > visibleLines.length) {
        logMessage(`... ${combatLines.length - visibleLines.length} eventos de combate omitidos.`, "combat");
    }

    if (playerHp <= 0) {
        state.player.hp = Math.max(1, Math.floor(totalStats().maxHp * 0.35));
        state.worldX = 0;
        state.worldY = 0;
        state.instance = null;
        state.dungeonRun = null;
        state.player.x = 2;
        state.player.y = 2;
        updateLocation();
        logMessage("Voce caiu em batalha e retornou para a Cidade Inicial.", "danger");
        return;
    }

    state.player.hp = Math.min(playerHp, totalStats().maxHp);
    const bonusPct = getPartyXpBonusPercent();
    const gainedExp = Math.floor(mobData.exp * (1 + bonusPct / 100));
    state.player.exp += gainedExp;
    state.player.gold += mobData.gold;
    state.player.monstersKilled += 1;
    state.player.killByMob[mob.type] = (state.player.killByMob[mob.type] || 0) + 1;

    let droppedItem = null;
    if (Math.random() < 0.45) {
        droppedItem = "potion";
        addItem(droppedItem, 1);
    }

    state.mobs.splice(mobIndex, 1);
    applyQuestProgress(mob.type);
    applyHuntProgress(mob.type);

    if (state.instance && state.instance.startsWith("dungeon:") && state.mobs.length === 0 && state.dungeonRun) {
        const dungeon = DUNGEONS[state.dungeonRun.id];
        if (state.dungeonRun.floor < dungeon.floors) {
            state.dungeonRun.floor += 1;
            updateLocation();
            logMessage(`Andar ${state.dungeonRun.floor} iniciado em ${dungeon.name}.`, "dungeon");
        } else {
            state.player.gold += dungeon.rewardGold;
            state.player.exp += dungeon.rewardExp;
            const dungeonName = dungeon.name;
            state.instance = null;
            state.worldX = state.dungeonRun.originX;
            state.worldY = state.dungeonRun.originY;
            state.dungeonRun = null;
            updateLocation();
            logMessage(`Dungeon concluida: ${dungeonName}. Recompensa recebida (+${dungeon.rewardExp} EXP, +${dungeon.rewardGold} ouro).`, "dungeon");
        }
    }

    handleLevelUp();
    updateAchievements();
    logMessage(`Vitoria contra ${mobData.name} em ${rounds} turnos.`, "combat");
    logMessage(`Recompensas: +${gainedExp} EXP (+${bonusPct}% party), +${mobData.gold} ouro.`, "reward");
    if (droppedItem) {
        logMessage(`Item obtido: ${ITEMS[droppedItem].name}.`, "loot");
    }
}
function handleLevelUp() {
    let needed = nextLevelExp(state.player.level);
    while (state.player.exp >= needed) {
        state.player.exp -= needed;
        state.player.level += 1;
        needed = nextLevelExp(state.player.level);
        healToMax();
        state.player.className = getEvolutionName(state.player.baseClass, state.player.level);
        logMessage(`Level up! Agora voce e ${state.player.className} Nv.${state.player.level}.`, "level");
    }
}

function useItem(itemId) {
    if (!removeItem(itemId)) return;
    const item = ITEMS[itemId];
    if (!item || item.type !== "consumable") return;
    const stats = totalStats();
    state.player.hp = Math.min(stats.maxHp, state.player.hp + item.heal);
    logMessage(`Voce usou ${item.name} e recuperou ${item.heal} HP.`, "info");
    renderAll();
}

function equipItem(itemId) {
    const item = ITEMS[itemId];
    if (!item || (item.type !== "weapon" && item.type !== "armor" && item.type !== "accessory")) return;
    if (!removeItem(itemId)) return;

    const slot = item.type;
    const old = state.player.equipment[slot];
    if (old) addItem(old, 1);

    state.player.equipment[slot] = itemId;
    const stats = totalStats();
    state.player.hp = Math.min(state.player.hp, stats.maxHp);
    logMessage(`${item.name} equipado.`, "info");
    renderAll();
}

function unequip(slot) {
    const current = state.player.equipment[slot];
    if (!current) return;
    addItem(current, 1);
    state.player.equipment[slot] = null;
    const stats = totalStats();
    state.player.hp = Math.min(state.player.hp, stats.maxHp);
    logMessage(`Item removido do slot ${slot}.`, "info");
    renderAll();
}

function renderStats() {
    const stats = totalStats();
    const expNeed = nextLevelExp(state.player.level);
    const title = state.player.currentTitle ? `[${state.player.currentTitle}] ` : "";
    byId("stats").innerHTML = `
        <div><strong>${title}${state.player.name}</strong></div>
        <div>${RACES[state.player.race].name} | ${state.player.className}</div>
        <div>HP: ${state.player.hp}/${stats.maxHp}</div>
        <div>ATK: ${stats.attack} | DEF: ${stats.defense}</div>
        <div>Nv ${state.player.level} | EXP ${state.player.exp}/${expNeed}</div>
        <div>Ouro: ${state.player.gold}</div>
        <div>Coord Mundo: (${state.worldX}, ${state.worldY})</div>
    `;
}

function renderInventory() {
    const panel = byId("inventoryPanel");
    panel.innerHTML = "";

    const grouped = {};
    state.player.inventory.forEach((itemId) => {
        grouped[itemId] = (grouped[itemId] || 0) + 1;
    });

    const entries = Object.entries(grouped);
    if (entries.length === 0) {
        panel.innerHTML = '<div class="small">Inventario vazio.</div>';
        return;
    }

    entries.forEach(([itemId, qty]) => {
        const item = ITEMS[itemId];
        const row = document.createElement("div");
        row.className = "item-row";

        const action = item.type === "consumable" ? "Usar" : "Equipar";
        row.innerHTML = `<strong>${item.name}</strong><span class="small">Qtd: ${qty}</span>`;

        const btn = document.createElement("button");
        btn.innerText = action;
        btn.onclick = () => {
            if (item.type === "consumable") useItem(itemId);
            else equipItem(itemId);
        };

        row.appendChild(btn);
        panel.appendChild(row);
    });
}

function renderEquipment() {
    const panel = byId("equipmentPanel");
    panel.innerHTML = "";

    ["weapon", "armor", "accessory"].forEach((slot) => {
        const row = document.createElement("div");
        row.className = "equip-row";
        const current = state.player.equipment[slot];
        const label = current ? ITEMS[current].name : "Vazio";
        row.innerHTML = `<strong>${slot}</strong><span class="small">${label}</span>`;
        if (current) {
            const btn = document.createElement("button");
            btn.innerText = "Remover";
            btn.onclick = () => unequip(slot);
            row.appendChild(btn);
        }
        panel.appendChild(row);
    });
}

function renderQuestList() {
    const list = byId("questList");
    list.innerHTML = "";
    if (state.quests.length === 0) {
        list.innerHTML = '<div class="small">Nenhuma quest ativa.</div>';
        return;
    }

    state.quests.forEach((quest) => {
        const row = document.createElement("div");
        row.className = "quest-row";
        row.innerHTML = `
            <strong>${quest.title}</strong>
            <span class="small">${quest.progress}/${quest.targetCount} ${MOBS[quest.targetMob].name}</span>
            <span class="small">${quest.completed ? "Concluida" : "Em andamento"}</span>
        `;

        if (quest.completed && !quest.claimed && state.locationId === "city") {
            const btn = document.createElement("button");
            btn.innerText = "Receber recompensa";
            btn.onclick = () => {
                grantRewards(quest);
                renderAll();
                logMessage(`Recompensa recebida: ${quest.title}.`, "reward");
            };
            row.appendChild(btn);
        }

        if (quest.claimed) {
            const done = document.createElement("span");
            done.className = "small";
            done.innerText = "Recompensa recebida";
            row.appendChild(done);
        }

        list.appendChild(row);
    });
}


function renderAchievements() {
    const panel = byId("achievementsPanel");
    const unlocked = state.player.unlockedAchievements.size;
    const total = ACHIEVEMENTS.length;
    panel.innerHTML = "";

    const summary = document.createElement("div");
    summary.className = "ach-summary";
    summary.innerHTML = `
        <div class="ach-box"><div class="small">Conquistas</div><strong>${unlocked}/${total}</strong></div>
        <div class="ach-box"><div class="small">Pontos</div><strong>${state.player.achievementPoints}</strong></div>
        <div class="ach-box"><div class="small">Titulos</div><strong>${state.player.unlockedTitles.size}</strong></div>
    `;
    panel.appendChild(summary);

    const titleHolder = document.createElement("div");
    titleHolder.className = "stack";
    TITLES.forEach((title) => {
        const has = state.player.unlockedTitles.has(title.id);
        const row = document.createElement("div");
        row.className = "achievement-row";
        row.innerHTML = `<strong>${title.name}</strong><span class="small">${title.req}</span>`;
        if (has) {
            const btn = document.createElement("button");
            btn.innerText = state.player.currentTitle === title.name ? "Equipado" : "Usar";
            btn.disabled = state.player.currentTitle === title.name;
            btn.onclick = () => {
                state.player.currentTitle = title.name;
                renderAll();
            };
            row.appendChild(btn);
        } else {
            const locked = document.createElement("span");
            locked.className = "small";
            locked.innerText = "Bloqueado";
            row.appendChild(locked);
        }
        titleHolder.appendChild(row);
    });
    panel.appendChild(titleHolder);

    const achList = document.createElement("div");
    achList.className = "stack";
    ACHIEVEMENTS.forEach((ach) => {
        const row = document.createElement("div");
        row.className = "achievement-row";
        const ok = state.player.unlockedAchievements.has(ach.id);
        row.innerHTML = `
            <strong>${ach.name}</strong>
            <span class="small">${ach.desc}</span>
            <span class="small">${ach.category} | ${ok ? "Desbloqueada" : "Bloqueada"} | +${ach.points} pts</span>
        `;
        achList.appendChild(row);
    });
    panel.appendChild(achList);
}
function renderSocial() {
    const friendList = byId("friendList");
    const partyList = byId("partyList");
    const partyInfo = byId("partyInfo");

    friendList.innerHTML = "";
    if (state.player.friends.length === 0) {
        friendList.innerHTML = '<div class="small">Nenhum amigo adicionado.</div>';
    } else {
        state.player.friends.forEach((friend) => {
            const row = document.createElement("div");
            row.className = "item-row";
            row.innerHTML = `<strong>${friend.name}</strong><span class="small">${friend.online ? "Online" : "Offline"}</span>`;
            const inviteBtn = document.createElement("button");
            inviteBtn.innerText = "Convidar";
            inviteBtn.disabled = !friend.online || state.player.party.members.includes(friend.name) || state.player.party.members.length >= 4;
            inviteBtn.onclick = () => {
                state.player.party.members.push(friend.name);
                renderAll();
                logMessage(`${friend.name} entrou na party.`);
            };
            row.appendChild(inviteBtn);
            friendList.appendChild(row);
        });
    }

    partyList.innerHTML = "";
    state.player.party.members.forEach((member, idx) => {
        const row = document.createElement("div");
        row.className = "item-row";
        row.innerHTML = `<strong>${member}</strong><span class="small">${idx === 0 ? "Lider" : "Membro"}</span>`;
        if (idx > 0) {
            const kickBtn = document.createElement("button");
            kickBtn.innerText = "Remover";
            kickBtn.onclick = () => {
                state.player.party.members = state.player.party.members.filter((m) => m !== member);
                renderAll();
            };
            row.appendChild(kickBtn);
        }
        partyList.appendChild(row);
    });

    const bonus = getPartyXpBonusPercent();
    partyInfo.innerText = `Bonus XP da party: +${bonus}% (${state.player.party.closed ? "Fechada" : "Aberta"})`;
    byId("togglePartyCloseBtn").innerText = state.player.party.closed ? "Party Fechada" : "Party Aberta";
}

function showQuestBoard() {
    const panel = byId("marketPanel");
    panel.classList.remove("hidden");
    panel.innerHTML = "<h4>Quadro de Missoes</h4>";

    Object.values(QUEST_TEMPLATES).forEach((template) => {
        const exists = state.quests.some((q) => q.id === template.id);
        const row = document.createElement("div");
        row.className = "item-row";
        row.innerHTML = `
            <strong>${template.title}</strong>
            <span class="small">${template.text}</span>
            <span class="small">Recompensa: ${template.rewardGold} ouro</span>
        `;

        const btn = document.createElement("button");
        btn.innerText = exists ? "Ja aceita" : "Aceitar";
        btn.disabled = exists;
        btn.onclick = () => {
            state.quests.push({ ...template, progress: 0, completed: false, claimed: false });
            showQuestBoard();
            renderQuestList();
            logMessage(`Quest aceita: ${template.title}.`, "quest");
        };

        row.appendChild(btn);
        panel.appendChild(row);
    });
}


function showHuntBoard() {
    const panel = byId("marketPanel");
    panel.classList.remove("hidden");
    panel.innerHTML = "<h4>Quadro de Hunt</h4>";

    HUNT_BOARD.forEach((entry) => {
        let playerHunt = state.player.hunts.find((h) => h.id === entry.id);
        if (!playerHunt) {
            playerHunt = { ...entry, progress: 0, completed: false, claimed: false };
            state.player.hunts.push(playerHunt);
        }

        const row = document.createElement("div");
        row.className = "item-row";
        row.innerHTML = `
            <strong>Hunt: ${MOBS[entry.target].name}</strong>
            <span class="small">${playerHunt.progress}/${entry.amount}</span>
            <span class="small">Recompensa: ${entry.rewardGold} ouro + ${entry.rewardExp} EXP</span>
        `;

        const btn = document.createElement("button");
        if (playerHunt.claimed) {
            btn.innerText = "Concluida";
            btn.disabled = true;
        } else if (playerHunt.completed) {
            btn.innerText = "Receber";
            btn.onclick = () => {
                state.player.gold += playerHunt.rewardGold;
                state.player.exp += playerHunt.rewardExp;
                playerHunt.claimed = true;
                handleLevelUp();
                updateAchievements();
                showHuntBoard();
                renderAll();
                logMessage(`Hunt concluida: ${MOBS[entry.target].name}.`, "reward");
            };
        } else {
            btn.innerText = "Em andamento";
            btn.disabled = true;
        }

        row.appendChild(btn);
        panel.appendChild(row);
    });
}
function showDungeonBoard() {
    const panel = byId("marketPanel");
    panel.classList.remove("hidden");
    panel.innerHTML = "<h4>Portal de Dungeons</h4>";

    Object.values(DUNGEONS).forEach((d) => {
        const row = document.createElement("div");
        row.className = "item-row";
        row.innerHTML = `<strong>${d.name}</strong><span class="small">Modo: ${d.mode === "solo" ? "Solo" : "Grupo"} | Andares: ${d.floors}</span>`;
        const btn = document.createElement("button");
        btn.innerText = "Entrar";
        btn.onclick = () => enterDungeon(d.id);
        row.appendChild(btn);
        panel.appendChild(row);
    });
}

function enterDungeon(dungeonId) {
    const d = DUNGEONS[dungeonId];
    if (!d) return;
    if (d.mode === "solo" && state.player.party.members.length > 1) {
        logMessage("Dungeon solo exige party com apenas voce.");
        return;
    }
    if (d.mode === "group" && state.player.party.members.length < 2) {
        logMessage("Dungeon de grupo exige pelo menos 2 jogadores na party.");
        return;
    }

    state.dungeonRun = { id: dungeonId, floor: 1, originX: state.worldX, originY: state.worldY };
    state.instance = `dungeon:${dungeonId}`;
    state.player.x = 2;
    state.player.y = 2;
    updateLocation();
    renderAll();
    logMessage(`Voce entrou em ${d.name}.`);
}

function showMarket() {
    const panel = byId("marketPanel");
    panel.classList.remove("hidden");
    panel.innerHTML = "<h4>Mercado</h4>";

    MARKET_ITEMS.forEach((itemId) => {
        const item = ITEMS[itemId];
        const row = document.createElement("div");
        row.className = "item-row";
        row.innerHTML = `<strong>${item.name}</strong><span class="small">Preco: ${item.value} ouro</span>`;

        const btn = document.createElement("button");
        btn.innerText = "Comprar";
        btn.onclick = () => {
            if (state.player.gold < item.value) {
                logMessage("Ouro insuficiente.");
                return;
            }
            state.player.gold -= item.value;
            addItem(itemId, 1);
            renderAll();
            showMarket();
            logMessage(`${item.name} comprado.`, "reward");
        };

        row.appendChild(btn);
        panel.appendChild(row);
    });
}

function handleService(serviceId) {
    if (state.locationId !== "city") {
        logMessage("Servicos so estao disponiveis na Cidade Inicial.");
        return;
    }

    if (serviceId === "tavern") {
        const heal = 18 + Math.floor(Math.random() * 10);
        state.player.hp = Math.min(totalStats().maxHp, state.player.hp + heal);
        logMessage(`Na taverna voce recuperou ${heal} HP e ouviu rumores de eventos no norte.`, "info");
    }

    if (serviceId === "rest") {
        if (state.player.gold < 5) {
            logMessage("Sem ouro para descansar.");
            return;
        }
        state.player.gold -= 5;
        healToMax();
        logMessage("Descanso completo realizado.", "info");
    }

    if (serviceId === "board") {
        showQuestBoard();
    }

    if (serviceId === "hunt") {
        showHuntBoard();
    }

    if (serviceId === "dungeon") {
        showDungeonBoard();
    }

    if (serviceId === "market") {
        showMarket();
    }

    updateAchievements();
    renderAll();
}

function drawWorld() {
    drawGrid(state.currentTheme, state.mapData);
    state.animTick += 1;

    state.npcs.forEach((npc, idx) => {
        drawEntitySprite(spriteCache, npc.sprite, npc.x, npc.y, Math.sin((state.animTick + idx) / 14) * 1.5);
        ctx.fillStyle = "#f8fafc";
        ctx.font = "12px Segoe UI";
        ctx.fillText(npc.name, npc.x * 32, npc.y * 32 - 4);
    });

    state.mobs.forEach((mob, idx) => {
        drawEntitySprite(spriteCache, MOBS[mob.type].sprite, mob.x, mob.y, Math.sin((state.animTick + idx) / 10) * 2);
    });

    drawEntitySprite(spriteCache, RACES[state.player.race].sprite, state.player.x, state.player.y, Math.sin(state.animTick / 9) * 2);
}

function moveInMap(dx, dy) {
    const nx = state.player.x + dx;
    const ny = state.player.y + dy;

    if (nx <= 0) {
        moveWorld("west");
        return;
    }
    if (nx >= GRID_W - 1) {
        moveWorld("east");
        return;
    }
    if (ny <= 0) {
        moveWorld("north");
        return;
    }
    if (ny >= GRID_H - 1) {
        moveWorld("south");
        return;
    }

    if (!canWalk(nx, ny)) {
        logMessage("Caminho bloqueado.");
        return;
    }

    state.player.x = nx;
    state.player.y = ny;
    checkCombat();
    renderAll();
}

function renderAll() {
    if (state.screen !== "game") return;
    renderStats();
    renderInventory();
    renderEquipment();
    renderQuestList();
    renderAchievements();
    renderSocial();
    renderLog();
    drawWorld();
}

function setupTabs() {
    const tabInventory = byId("tabInventory");
    const tabEquipment = byId("tabEquipment");
    const tabAchievements = byId("tabAchievements");

    const inventoryPanel = byId("inventoryPanel");
    const equipmentPanel = byId("equipmentPanel");
    const achievementsPanel = byId("achievementsPanel");

    tabInventory.onclick = () => {
        state.activeTab = "inventory";
        tabInventory.classList.add("active");
        tabEquipment.classList.remove("active");
        tabAchievements.classList.remove("active");
        inventoryPanel.classList.remove("hidden");
        equipmentPanel.classList.add("hidden");
        achievementsPanel.classList.add("hidden");
    };

    tabEquipment.onclick = () => {
        state.activeTab = "equipment";
        tabEquipment.classList.add("active");
        tabInventory.classList.remove("active");
        tabAchievements.classList.remove("active");
        equipmentPanel.classList.remove("hidden");
        inventoryPanel.classList.add("hidden");
        achievementsPanel.classList.add("hidden");
    };

    tabAchievements.onclick = () => {
        state.activeTab = "achievements";
        tabAchievements.classList.add("active");
        tabInventory.classList.remove("active");
        tabEquipment.classList.remove("active");
        achievementsPanel.classList.remove("hidden");
        inventoryPanel.classList.add("hidden");
        equipmentPanel.classList.add("hidden");
    };
}
function setupCharacterScreen() {
    const raceSelect = byId("raceSelect");
    const classSelect = byId("classSelect");

    Object.entries(RACES).forEach(([id, race]) => {
        const op = document.createElement("option");
        op.value = id;
        op.innerText = race.name;
        raceSelect.appendChild(op);
    });

    Object.entries(CLASSES).forEach(([id, clazz]) => {
        const op = document.createElement("option");
        op.value = id;
        op.innerText = clazz.name;
        classSelect.appendChild(op);
    });

    const updatePreview = () => {
        const race = RACES[raceSelect.value];
        const clazz = CLASSES[classSelect.value];
        byId("classPreview").innerText = `Raca: ${race.name} | Classe: ${clazz.name} | Bonus base HP ${race.hp + clazz.hp}`;
    };

    raceSelect.onchange = updatePreview;
    classSelect.onchange = updatePreview;
    updatePreview();
}

function startGame() {
    setScreen("game");
    byId("sessionInfo").innerText = `Conectado: ${state.sessionUser}`;
    state.logEntries = [];
    state.logFilter = "all";
    document.querySelectorAll("[data-log-filter]").forEach((b) => b.classList.remove("active"));
    const defaultFilterBtn = document.querySelector("[data-log-filter=\"all\"]");
    if (defaultFilterBtn) defaultFilterBtn.classList.add("active");
    updateLocation();
    healToMax();
    updateAchievements();
    logMessage("Use setas/WASD para andar no mapa local. Borda troca de regiao.", "info");
    renderAll();
}

function setupForms() {
    const loginForm = byId("loginForm");
    const registerForm = byId("registerForm");
    const showLoginBtn = byId("showLoginBtn");
    const showRegisterBtn = byId("showRegisterBtn");

    const showLogin = () => {
        loginForm.classList.remove("hidden");
        registerForm.classList.add("hidden");
        showLoginBtn.classList.add("active");
        showRegisterBtn.classList.remove("active");
    };

    const showRegister = () => {
        registerForm.classList.remove("hidden");
        loginForm.classList.add("hidden");
        showRegisterBtn.classList.add("active");
        showLoginBtn.classList.remove("active");
    };

    showLoginBtn.onclick = showLogin;
    showRegisterBtn.onclick = showRegister;

    loginForm.onsubmit = async (event) => {
        event.preventDefault();
        const username = byId("loginUser").value.trim();
        const password = byId("loginPass").value.trim();
        const statusDiv = byId("loginStatus");

        // Mostrar status de carregamento
        statusDiv.className = 'login-status info';
        statusDiv.textContent = '🔄 Conectando ao servidor...';

        try {
            console.log('Tentando login com:', username);
            
            // Use NetworkManager for login
            if (window.game && window.game.networkManager) {
                console.log('Usando NetworkManager para login');
                window.game.networkManager.send('login', { username, password });
            } else {
                // Fallback: try to connect first
                if (window.io) {
                    console.log('Conectando diretamente com Socket.IO');
                    statusDiv.textContent = '🔄 Estabelecendo conexão...';
                    
                    const socket = io('http://localhost:3002');
                    
                    socket.on('connect', () => {
                        console.log('Socket conectado, fazendo login...');
                        statusDiv.textContent = '🔐 Autenticando...';
                        socket.emit('login', { username, password });
                    });
                    
                    socket.on('loginSuccess', (data) => {
                        console.log('Login successful:', data);
                        statusDiv.className = 'login-status success';
                        statusDiv.textContent = `✅ Bem-vindo, ${data.character.name}!`;
                        
                        // Atualizar informações da sessão
                        state.sessionUser = data.character.name;
                        byId("sessionInfo").textContent = `Online: ${data.character.name}`;
                        
                        // Atualizar interface do jogo com dados do personagem
                        updateGameUI(data.character);
                        
                        // Esconder tela de login
                        setTimeout(() => {
                            byId("loginScreen").classList.remove("visible");
                            byId("gameScreen").classList.add("visible");
                            
                            // Inicializar sistema do novo engine se disponível
                            if (window.game && window.game.initialize) {
                                window.game.initialize();
                            }
                            
                            // Inicializar nova interface
                            addChatMessage("Bem-vindo ao MMORPG Browser!", "system");
                            initializeModernGameInterface();
                            
                            // Log de sucesso
                            logMessage(`Bem-vindo ao jogo, ${data.character.name}!`);
                            
                            // Carregar dados do personagem
                            if (window.game && window.game.loadPlayer) {
                                window.game.loadPlayer(data.character);
                            }
                        }, 1000);
                    });
                    
                    socket.on('loginError', (data) => {
                        console.error('Login failed:', data.message);
                        statusDiv.className = 'login-status error';
                        statusDiv.textContent = `❌ Erro: ${data.message}`;
                        logMessage("Login invalido: " + data.message);
                    });
                    
                    socket.on('connect_error', (error) => {
                        console.error('Connection error:', error);
                        statusDiv.className = 'login-status error';
                        statusDiv.textContent = '❌ Falha de conexão com o servidor';
                    });
                    
                } else {
                    statusDiv.className = 'login-status error';
                    statusDiv.textContent = '❌ Socket.IO não disponível';
                    logMessage("Conexao nao disponivel.");
                }
            }
        } catch (error) {
            console.error('Login error:', error);
            statusDiv.className = 'login-status error';
            statusDiv.textContent = '❌ Erro inesperado ao fazer login';
            logMessage("Falha de conexao no login.");
        }
    };

    registerForm.onsubmit = async (event) => {
        event.preventDefault();
        const username = byId("registerUser").value.trim();
        const email = byId("registerEmail").value.trim();
        const password = byId("registerPass").value.trim();
        const statusDiv = byId("loginStatus");

        // Validação
        if (!username || !password) {
            statusDiv.className = 'login-status error';
            statusDiv.textContent = '❌ Preencha nome de usuário e senha!';
            return;
        }

        // Mostrar status de carregamento
        statusDiv.className = 'login-status info';
        statusDiv.textContent = '🔄 Criando conta...';

        try {
            console.log('Tentando criar conta para:', username);
            
            // Conectar ao servidor
            const socket = io('http://localhost:3002');
            
            socket.on('connect', () => {
                console.log('Socket conectado, criando conta...');
                statusDiv.textContent = '🔐 Criando sua conta...';
                
                // Criar CONTA (não personagem)
                socket.emit('createAccount', { 
                    username: username, 
                    email: email || `${username}@example.com`, 
                    password: password 
                });
            });
            
            socket.on('createSuccess', (data) => {
                console.log('Conta criada:', data);
                statusDiv.className = 'login-status success';
                statusDiv.textContent = '✅ ' + data.message;
                
                // Limpar formulário
                byId("registerUser").value = '';
                byId("registerEmail").value = '';
                byId("registerPass").value = '';
                
                // Mudar para aba de login após 2 segundos
                setTimeout(() => {
                    showLoginTab();
                    byId("loginUser").value = username;
                    byId("loginUser").focus();
                }, 2000);
                
                logMessage("Conta criada! Faça login.");
            });
            
            socket.on('createError', (data) => {
                console.error('Erro ao criar conta:', data);
                statusDiv.className = 'login-status error';
                
                if (data.code === 'DUPLICATE_KEY') {
                    statusDiv.textContent = `❌ ${data.shortExplanation || 'Nome já em uso!'}`;
                    
                    // Gerar sugestões
                    const suggestions = generateNameSuggestions(username);
                    if (suggestions.length > 0) {
                        showNameSuggestions(suggestions);
                    }
                } else {
                    statusDiv.textContent = `❌ ${data.message || 'Erro ao criar conta'}`;
                }
            });
            
            socket.on('connect_error', (error) => {
                console.error('Erro de conexão:', error);
                statusDiv.className = 'login-status error';
                statusDiv.textContent = '❌ Falha ao conectar ao servidor';
            });
            
        } catch (error) {
            console.error('Erro no registro:', error);
            statusDiv.className = 'login-status error';
            statusDiv.textContent = '❌ Erro ao criar conta';
        }
    };                
                            // Gerar sugestões de nomes
                            const suggestions = generateNameSuggestions(heroName);
                            const suggestionText = data.suggestion || 
                                (suggestions.length > 0 ? `Sugestões: ${suggestions.join(', ')}` : 'Tente outro nome.');
                            
                            logMessage(`${data.shortExplanation || 'Nome indisponível'}. ${suggestionText}`);
                            
                            // Adicionar sugestões na interface
                            if (suggestions.length > 0) {
                                showNameSuggestions(suggestions);
                            }
                        } else if (data.code === 'TABLE_NOT_FOUND') {
                            statusDiv.textContent = `❌ ${data.shortExplanation || 'Erro no banco de dados'}`;
                            logMessage(`${data.shortExplanation}: ${data.message}`);
                            logMessage('Solução: Reinicie o servidor para criar as tabelas.');
                        } else if (data.code === 'DATABASE_CONNECTION_FAILED') {
                            statusDiv.textContent = `❌ ${data.shortExplanation || 'Falha no servidor'}`;
                            logMessage(`${data.shortExplanation}: ${data.message}`);
                            logMessage('Solução: Verifique se o servidor está online.');
                        } else {
                            // Erro genérico com informações detalhadas
                            const explanation = data.shortExplanation || 'Erro desconhecido';
                            const message = data.message || 'Tente novamente.';
                            
                            statusDiv.textContent = `❌ ${explanation}`;
                            logMessage(`Erro (${data.code || 'UNKNOWN'}): ${explanation}`);
                            logMessage(`Detalhes: ${message}`);
                            
                            if (data.suggestion) {
                                logMessage(`Sugestão: ${data.suggestion}`);
                            }
                        }
                    });
                    
                    // Account creation events
                    socket.on('createSuccess', (data) => {
                        console.log('Account/Character created successfully:', data);
                        statusDiv.className = 'login-status success';
                        statusDiv.textContent = '✅ ' + data.message;
                        
                        if (data.character) {
                            // Character created - proceed to game
                            setTimeout(() => {
                                showScreen('gameScreen');
                                initializeModernGameInterface();
                                addChatMessage("Bem-vindo ao MMORPG Browser!", "system");
                                updateGameUI(data.character);
                            }, 1500);
                        } else {
                            // Account created - switch to login
                            setTimeout(() => {
                                loginTab.click();
                                byId("loginUser").focus();
                            }, 1500);
                        }
                        
                        logMessage(data.message);
                    });
                    
                    socket.on('connect_error', (error) => {
                        console.error('Connection error:', error);
                        statusDiv.className = 'login-status error';
                        statusDiv.textContent = '❌ Falha de conexão com o servidor';
                    });
                    
                } else {
                    statusDiv.className = 'login-status error';
                    statusDiv.textContent = '❌ Socket.IO não disponível';
                    logMessage("Conexao nao disponivel.");
                }
            }
        } catch (error) {
            console.error('Registration error:', error);
            statusDiv.className = 'login-status error';
            statusDiv.textContent = '❌ Erro inesperado ao criar conta';
            logMessage("Falha de conexao no cadastro.");
        }
    };

    byId("googleFutureBtn").onclick = async () => {
        try {
            const response = await fetch("/api/auth/google", { method: "POST" });
            const data = await response.json();
            logMessage(data.error || "Google Account sera vinculado em breve.");
        } catch {
            logMessage("Google Account sera vinculado em breve.");
        }
    };

    byId("characterForm").onsubmit = (event) => {
        event.preventDefault();
        const heroName = byId("heroName").value.trim();
        const race = byId("raceSelect").value;
        const baseClass = byId("classSelect").value;

        state.player = {
            name: heroName,
            race,
            baseClass,
            className: getEvolutionName(baseClass, 1),
            currentTitle: "",
            hp: 1,
            level: 1,
            exp: 0,
            gold: 45,
            x: 2,
            y: 2,
            inventory: [],
            equipment: { weapon: null, armor: null, accessory: null },
            questsCompleted: 0,
            monstersKilled: 0,
            killByMob: {},
            explored: new Set(["city"]),
            hunts: [],
            unlockedAchievements: new Set(),
            unlockedTitles: new Set(),
            achievementPoints: 0,
            friends: [],
            party: { members: [heroName], closed: false }
        };

        CLASSES[baseClass].starter.forEach((itemId) => addItem(itemId, 1));
        startGame();
    };
}
function setupButtons() {
    document.querySelectorAll("[data-dir]").forEach((btn) => {
        btn.onclick = () => moveWorld(btn.dataset.dir);
    });

    document.querySelectorAll("[data-service]").forEach((btn) => {
        btn.onclick = () => handleService(btn.dataset.service);
    });

    byId("rotateImageBtn").onclick = () => {
        state.imageAngle = (state.imageAngle + 90) % 360;
        byId("locationImage").style.transform = `rotate(${state.imageAngle}deg)`;
    };

    const viewportPreset = byId("viewportPreset");
    if (viewportPreset) {
        viewportPreset.value = state.viewportPreset;
        viewportPreset.onchange = () => {
            state.viewportPreset = viewportPreset.value;
            applyViewportPreset();
        };
    }

    byId("addFriendBtn").onclick = () => {
        if (!state.player) return;
        const name = byId("friendInput").value.trim();
        if (!name || name.toLowerCase() === state.player.name.toLowerCase()) return;
        if (state.player.friends.some((f) => f.name.toLowerCase() === name.toLowerCase())) {
            logMessage("Esse amigo ja esta na lista.", "info");
            return;
        }
        state.player.friends.push({ name, online: true });
        byId("friendInput").value = "";
        renderAll();
        logMessage(`${name} adicionado na friend list.`, "info");
    };

    byId("togglePartyCloseBtn").onclick = () => {
        if (!state.player) return;
        state.player.party.closed = !state.player.party.closed;
        renderAll();
    };

    byId("leavePartyBtn").onclick = () => {
        if (!state.player) return;
        state.player.party.members = [state.player.name];
        state.player.party.closed = false;
        renderAll();
        logMessage("Voce saiu da party e criou uma nova solo.", "info");
    };

    document.querySelectorAll("[data-log-filter]").forEach((btn) => {
        btn.onclick = () => {
            state.logFilter = btn.dataset.logFilter;
            document.querySelectorAll("[data-log-filter]").forEach((b) => b.classList.remove("active"));
            btn.classList.add("active");
            renderLog();
        };
    });

    byId("logClearBtn").onclick = () => {
        state.logEntries = [];
    state.logFilter = "all";
    document.querySelectorAll("[data-log-filter]").forEach((b) => b.classList.remove("active"));
    const defaultFilterBtn = document.querySelector("[data-log-filter=\"all\"]");
    if (defaultFilterBtn) defaultFilterBtn.classList.add("active");
        renderLog();
    };
}
function setupKeyboard() {
    document.addEventListener("keydown", (event) => {
        if (state.screen !== "game") return;
        const key = event.key.toLowerCase();
        if (key === "arrowup" || key === "w") moveInMap(0, -1);
        if (key === "arrowdown" || key === "s") moveInMap(0, 1);
        if (key === "arrowleft" || key === "a") moveInMap(-1, 0);
        if (key === "arrowright" || key === "d") moveInMap(1, 0);
    });
}

function update(dt) {
    state.animTick += dt * 60;
}

function gameLoop() {
    update(1 / 60);
    if (state.screen === "game") drawWorld();
    requestAnimationFrame(gameLoop);
}

window.advanceTime = (ms) => {
    const steps = Math.max(1, Math.round(ms / (1000 / 60)));
    for (let i = 0; i < steps; i += 1) {
        update(1 / 60);
    }
    if (state.screen === "game") drawWorld();
};

window.render_game_to_text = () => {
    const payload = {
        mode: state.screen,
        coordinate_system: "origem no canto superior esquerdo; x cresce para leste; y cresce para sul",
        world: {
            x: state.worldX,
            y: state.worldY,
            instance: state.instance,
            location_id: state.locationId,
            location_name: state.locationName
        },
        player: state.player ? {
            name: state.player.name,
            title: state.player.currentTitle,
            race: state.player.race,
            class_name: state.player.className,
            level: state.player.level,
            hp: state.player.hp,
            position: { x: state.player.x, y: state.player.y },
            gold: state.player.gold,
            monsters_killed: state.player.monstersKilled,
            quests_completed: state.player.questsCompleted,
            inventory_count: state.player.inventory.length,
            achievement_points: state.player.achievementPoints,
            unlocked_achievements: state.player.unlockedAchievements.size,
            party_members: state.player.party.members,
            party_closed: state.player.party.closed,
            party_xp_bonus: getPartyXpBonusPercent(),
            friends_count: state.player.friends.length,
            equipment: state.player.equipment
        } : null,
        mobs: state.mobs.map((mob) => ({ type: mob.type, x: mob.x, y: mob.y, hp: mob.hp })),
        npcs: state.npcs.map((npc) => ({ name: npc.name, x: npc.x, y: npc.y })),
        quests: state.quests.map((q) => ({ id: q.id, progress: q.progress, target: q.targetCount, completed: q.completed, claimed: q.claimed })),
        hunts: state.player ? state.player.hunts.map((h) => ({ id: h.id, progress: h.progress, target: h.amount, completed: h.completed, claimed: h.claimed })) : [],
        dungeon_run: state.dungeonRun ? { id: state.dungeonRun.id, floor: state.dungeonRun.floor } : null
    };

    return JSON.stringify(payload);
};

setupForms();
setupButtons();
applyViewportPreset();
setupTabs();
setupCharacterScreen();
setupKeyboard();
const query = new URLSearchParams(window.location.search);
if (query.get("autoplay") === "1") {
    state.sessionUser = "auto_tester";
    state.player = {
        name: "AutoHero",
        race: "human",
        baseClass: "warrior",
        className: getEvolutionName("warrior", 1),
        currentTitle: "",
        hp: 1,
        level: 1,
        exp: 0,
        gold: 60,
        x: 2,
        y: 2,
        inventory: [],
        equipment: { weapon: null, armor: null, accessory: null },
        questsCompleted: 0,
        monstersKilled: 0,
        killByMob: {},
        explored: new Set(["city"]),
        hunts: [],
        unlockedAchievements: new Set(),
        unlockedTitles: new Set(),
        achievementPoints: 0,
        friends: [],
        party: { members: ["AutoHero"], closed: false }
    };
    CLASSES.warrior.starter.forEach((itemId) => addItem(itemId, 1));
    startGame();
} else {
    setScreen("login");
}
gameLoop();



















































