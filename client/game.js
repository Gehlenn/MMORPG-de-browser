const races = {
    human: {name: "Humano", sprite: "sprites/human.svg", hp: 110},
    elf: {name: "Elfo", sprite: "sprites/elf.svg", hp: 95},
    dwarf: {name: "Anão", sprite: "sprites/dwarf.svg", hp: 130}
};

const locations = {
    Village: {
        image: "areas/village.svg",
        theme: {floor: "#65a30d", wall: "#3f3f46", grid: "rgba(255,255,255,0.08)"},
        monsters: [
            {type: "goblin", x: 8, y: 4, hp: 25},
            {type: "goblin", x: 12, y: 6, hp: 25}
        ]
    },
    Forest: {
        image: "areas/forest.svg",
        theme: {floor: "#166534", wall: "#1f2937", grid: "rgba(255,255,255,0.07)"},
        monsters: [
            {type: "goblin", x: 9, y: 3, hp: 25},
            {type: "wolf", x: 15, y: 5, hp: 35}
        ]
    },
    Cave: {
        image: "areas/cave.svg",
        theme: {floor: "#334155", wall: "#0f172a", grid: "rgba(255,255,255,0.08)"},
        monsters: [
            {type: "wolf", x: 7, y: 6, hp: 35},
            {type: "orc", x: 18, y: 2, hp: 55}
        ]
    },
    Mountain: {
        image: "areas/mountain.svg",
        theme: {floor: "#84cc16", wall: "#475569", grid: "rgba(15,23,42,0.12)"},
        monsters: [
            {type: "orc", x: 11, y: 3, hp: 55},
            {type: "orc", x: 16, y: 6, hp: 55}
        ]
    }
};

const mobSprites = {
    goblin: "sprites/goblin.svg",
    wolf: "sprites/wolf.svg",
    orc: "sprites/orc.svg"
};

const spriteCache = {};

function getSprite(path){
    if(!spriteCache[path]){
        const img = new Image();
        img.src = path;
        spriteCache[path] = img;
    }
    return spriteCache[path];
}

let player = {
    x: 3,
    y: 3,
    race: "human",
    hp: races.human.hp,
    inventory: ["potion", "knife"]
};

let currentLocation = "Village";
let monsters = [];
let animTick = 0;

function setLog(text){
    document.getElementById("log").innerText = text;
}

function updateStats(){
    const race = races[player.race];
    document.getElementById("stats").innerHTML =
        `Raça: <strong>${race.name}</strong><br>HP: ${player.hp}<br>Área: ${currentLocation}<br>Mobs: ${monsters.length}`;
}

function updateInventory(){
    const inv = document.getElementById("inventory");
    inv.innerHTML = "";

    player.inventory.forEach((item)=>{
        const div = document.createElement("div");
        div.className = "item";
        div.innerText = `🎒 ${item}`;
        inv.appendChild(div);
    });
}

function setupRaceSelector(){
    const holder = document.getElementById("raceSelector");
    holder.innerHTML = "";

    Object.keys(races).forEach((raceKey)=>{
        const button = document.createElement("button");
        button.innerText = races[raceKey].name;
        if(raceKey === player.race) button.classList.add("active");

        button.onclick = ()=>{
            player.race = raceKey;
            player.hp = races[raceKey].hp;
            setupRaceSelector();
            updateStats();
            setLog(`Você mudou para a raça ${races[raceKey].name}.`);
            draw();
        };

        holder.appendChild(button);
    });
}

function setupTravelButtons(){
    const holder = document.getElementById("travelButtons");
    holder.innerHTML = "";

    Object.keys(locations).forEach((locationName)=>{
        const button = document.createElement("button");
        button.innerText = locationName;
        if(locationName === currentLocation) button.classList.add("active");

        button.onclick = ()=>{
            currentLocation = locationName;
            player.x = 3;
            player.y = 3;
            monsters = locations[locationName].monsters.map((mob)=>({ ...mob }));
            document.getElementById("locationImage").src = locations[locationName].image;
            setupTravelButtons();
            updateStats();
            setLog(`Você entrou em ${locationName}.`);
            draw();
        };

        holder.appendChild(button);
    });
}

function drawSprite(path, x, y, wobble){
    const sprite = getSprite(path);
    const pixelX = x * tileSize;
    const pixelY = y * tileSize + wobble;

    if(sprite.complete){
        ctx.drawImage(sprite, pixelX, pixelY, tileSize, tileSize);
    }else{
        sprite.onload = draw;
        ctx.fillStyle = "#2563eb";
        ctx.fillRect(pixelX, pixelY, tileSize, tileSize);
    }
}

function drawPlayer(){
    const bob = Math.sin(animTick / 12) * 2;
    drawSprite(races[player.race].sprite, player.x, player.y, bob);
}

function drawMonsters(){
    monsters.forEach((monster, i)=>{
        const bob = Math.sin((animTick + i * 7) / 10) * 2;
        drawSprite(mobSprites[monster.type], monster.x, monster.y, bob);
    });
}

function checkCombat(){
    monsters.forEach((monster, i)=>{
        if(monster.x === player.x && monster.y === player.y){
            monsters.splice(i, 1);
            const loot = Math.random() < 0.5 ? "monster claw" : "potion";
            player.inventory.push(loot);
            setLog(`⚔ Combate com ${monster.type}! Você venceu e ganhou ${loot}.`);
            updateInventory();
        }
    });
}

function draw(){
    const theme = locations[currentLocation].theme;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawMap(theme);
    drawMonsters();
    drawPlayer();
}

function gameLoop(){
    animTick++;
    draw();
    requestAnimationFrame(gameLoop);
}

document.addEventListener("keydown", (e)=>{
    let nextX = player.x;
    let nextY = player.y;

    if(e.key === "ArrowUp") nextY--;
    if(e.key === "ArrowDown") nextY++;
    if(e.key === "ArrowLeft") nextX--;
    if(e.key === "ArrowRight") nextX++;

    if((nextX !== player.x || nextY !== player.y) && !isBlockedTile(nextX, nextY)){
        player.x = nextX;
        player.y = nextY;
        checkCombat();
        updateStats();
    }
});

monsters = locations[currentLocation].monsters.map((mob)=>({ ...mob }));
document.getElementById("locationImage").src = locations[currentLocation].image;
setupRaceSelector();
setupTravelButtons();
updateStats();
updateInventory();
setLog("Use as setas para andar. Encoste nos mobs para combater.");
gameLoop();
