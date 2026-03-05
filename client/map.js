(() => {
    const canvas = document.getElementById("gameCanvas");
    const ctx = canvas.getContext("2d");

    const TILE_SIZE = 32;
    const GRID_W = 25;
    const GRID_H = 15;

    function createBaseMap() {
        const grid = [];
        for (let y = 0; y < GRID_H; y += 1) {
            const row = [];
            for (let x = 0; x < GRID_W; x += 1) {
                const border = x === 0 || y === 0 || x === GRID_W - 1 || y === GRID_H - 1;
                row.push(border ? 1 : 0);
            }
            grid.push(row);
        }
        return grid;
    }

    function drawGrid(theme, mapData) {
        for (let y = 0; y < GRID_H; y += 1) {
            for (let x = 0; x < GRID_W; x += 1) {
                const blocked = mapData[y][x] === 1;
                ctx.fillStyle = blocked ? theme.wall : theme.floor;
                ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
                ctx.strokeStyle = theme.grid;
                ctx.strokeRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
            }
        }
    }

    function drawEntitySprite(cache, path, x, y, wobble) {
        if (!path) {
            ctx.fillStyle = "#facc15";
            ctx.fillRect(x * TILE_SIZE + 5, y * TILE_SIZE + 5, TILE_SIZE - 10, TILE_SIZE - 10);
            return;
        }
        if (!cache[path]) {
            const img = new Image();
            img.src = path;
            cache[path] = img;
        }
        const sprite = cache[path];
        const py = y * TILE_SIZE + wobble;
        if (sprite.complete) {
            ctx.drawImage(sprite, x * TILE_SIZE, py, TILE_SIZE, TILE_SIZE);
        } else {
            ctx.fillStyle = "#64a4ff";
            ctx.fillRect(x * TILE_SIZE + 4, py + 4, TILE_SIZE - 8, TILE_SIZE - 8);
        }
    }

    window.WorldRenderer = {
        canvas,
        ctx,
        TILE_SIZE,
        GRID_W,
        GRID_H,
        createBaseMap,
        drawGrid,
        drawEntitySprite
    };
})();

