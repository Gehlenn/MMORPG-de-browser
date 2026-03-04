
async function loadPlayer(){

    const res = await fetch("/player");
    const p = await res.json();

    document.getElementById("stats").innerHTML =
    `Level ${p.level}<br>
     HP ${p.hp}/${p.maxHp}<br>
     EXP ${p.exp}/${p.nextLevel}<br>
     Gold ${p.gold}<br>
     Location ${p.location}`;

    const inv = document.getElementById("inventory");
    inv.innerHTML="";

    p.inventory.forEach(i=>{
        const btn = document.createElement("button");
        btn.innerText=i;
        btn.onclick=()=>useItem(i);
        inv.appendChild(btn);
    });
}

async function hunt(monster){

    const res = await fetch("/hunt",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({monster})
    });

    const r = await res.json();

    log(r.log);

    loadPlayer();
}

async function travel(location){

    await fetch("/travel",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({location})
    });

    log("Travelled to "+location);

    loadPlayer();
}

async function useItem(item){

    await fetch("/useItem",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({item})
    });

    log("Used "+item);

    loadPlayer();
}

function log(text){
    document.getElementById("log").innerHTML += "<p>"+text+"</p>";
}

loadPlayer();
