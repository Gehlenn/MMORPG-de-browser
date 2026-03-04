
const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("client"));

let player = {
    name: "Hero",
    level: 1,
    exp: 0,
    nextLevel: 100,
    hp: 100,
    maxHp: 100,
    attack: 10,
    defense: 5,
    gold: 50,
    location: "Village",
    inventory: []
};

const maps = {
    Village: ["goblin"],
    Forest: ["goblin","wolf"],
    Cave: ["wolf","orc"],
    Mountain: ["orc"]
};

const monsters = {
    goblin:{hp:30,attack:5,exp:20,gold:10},
    wolf:{hp:45,attack:8,exp:30,gold:15},
    orc:{hp:70,attack:12,exp:50,gold:25}
};

const items = {
    potion:{name:"Potion",heal:30},
    sword:{name:"Iron Sword",attack:5}
};

function levelUp(){
    if(player.exp >= player.nextLevel){
        player.exp -= player.nextLevel;
        player.level++;
        player.nextLevel = Math.floor(player.nextLevel*1.4);
        player.maxHp += 20;
        player.attack += 2;
        player.defense += 1;
        player.hp = player.maxHp;
    }
}

app.get("/player",(req,res)=>{
    res.json(player);
});

app.post("/travel",(req,res)=>{
    player.location = req.body.location;
    res.json({location:player.location});
});

app.post("/hunt",(req,res)=>{

    const monsterName = req.body.monster;
    const monster = monsters[monsterName];

    let monsterHp = monster.hp;

    while(monsterHp>0 && player.hp>0){

        monsterHp -= player.attack;

        if(monsterHp>0){
            player.hp -= Math.max(1, monster.attack - player.defense);
        }
    }

    if(player.hp<=0){
        player.hp = player.maxHp;
        player.location = "Village";
        return res.json({log:"You died and returned to the village"});
    }

    player.exp += monster.exp;
    player.gold += monster.gold;

    if(Math.random()<0.3){
        player.inventory.push("potion");
    }

    levelUp();

    res.json({
        log:`You defeated a ${monsterName}! +${monster.exp} EXP +${monster.gold} gold`
    });
});

app.post("/useItem",(req,res)=>{

    const item = req.body.item;

    if(item==="potion"){
        player.hp = Math.min(player.maxHp, player.hp + items.potion.heal);
        const index = player.inventory.indexOf("potion");
        if(index>-1) player.inventory.splice(index,1);
    }

    res.json(player);
});

app.listen(3000,()=>{
    console.log("Server running on http://localhost:3000");
});
