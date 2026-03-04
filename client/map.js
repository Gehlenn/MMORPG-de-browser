const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const tileSize = 32;

const map = [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
];

function drawMap(theme){
    for(let y=0; y<map.length; y++){
        for(let x=0; x<map[y].length; x++){
            const blocked = map[y][x] === 1;
            ctx.fillStyle = blocked ? theme.wall : theme.floor;
            ctx.fillRect(x*tileSize, y*tileSize, tileSize, tileSize);
            ctx.strokeStyle = theme.grid;
            ctx.strokeRect(x*tileSize, y*tileSize, tileSize, tileSize);
        }
    }
}

function isBlockedTile(x, y){
    if(y < 0 || y >= map.length || x < 0 || x >= map[0].length){
        return true;
    }
    return map[y][x] === 1;
}
