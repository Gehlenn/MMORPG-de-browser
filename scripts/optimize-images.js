const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const RUNTIME_DIRS = [
    "client/areas",
    "client/areas/dungeons",
    "client/sprites",
    "client/sprites/npcs"
];

function listPngFiles(dir) {
    if (!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir)
        .map((name) => path.join(dir, name))
        .filter((full) => fs.statSync(full).isFile() && path.extname(full).toLowerCase() === ".png");
}

function size(file) {
    return fs.existsSync(file) ? fs.statSync(file).size : 0;
}

function fmt(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

async function optimizePngInPlace(file) {
    const before = size(file);
    const temp = `${file}.opt.tmp`;

    await sharp(file)
        .png({ compressionLevel: 9, adaptiveFiltering: true, palette: true })
        .toFile(temp);

    const after = size(temp);
    if (after > 0 && after < before) {
        fs.renameSync(temp, file);
        return { before, after, changed: true };
    }

    fs.unlinkSync(temp);
    return { before, after: before, changed: false };
}

async function generateWebp(file) {
    const webp = file.replace(/\.png$/i, ".webp");
    await sharp(file)
        .webp({ quality: 82, effort: 5, smartSubsample: true })
        .toFile(webp);

    return { webp, webpSize: size(webp), pngSize: size(file) };
}

function updateRuntimeRefsToWebp() {
    const gamePath = "client/game.js";
    let game = fs.readFileSync(gamePath, "utf8");

    game = game
        .replace(/areas\/village\.png/g, "areas/village.webp")
        .replace(/areas\/forest\.png/g, "areas/forest.webp")
        .replace(/areas\/mountain\.png/g, "areas/mountain.webp")
        .replace(/areas\/cave\.png/g, "areas/cave.webp")
        .replace(/sprites\/human\.png/g, "sprites/human.webp")
        .replace(/sprites\/elf\.png/g, "sprites/elf.webp")
        .replace(/sprites\/dwarf\.png/g, "sprites/dwarf.webp")
        .replace(/sprites\/goblin\.png/g, "sprites/goblin.webp")
        .replace(/sprites\/wolf\.png/g, "sprites/wolf.webp")
        .replace(/sprites\/orc\.png/g, "sprites/orc.webp");

    fs.writeFileSync(gamePath, game, "utf8");
}

async function main() {
    const files = RUNTIME_DIRS.flatMap(listPngFiles);
    if (files.length === 0) {
        console.log("Nenhum PNG encontrado para otimizar.");
        return;
    }

    let totalBefore = 0;
    let totalAfterPng = 0;
    let totalWebp = 0;
    let changedCount = 0;

    for (const file of files) {
        const pngResult = await optimizePngInPlace(file);
        totalBefore += pngResult.before;
        totalAfterPng += pngResult.after;
        if (pngResult.changed) changedCount += 1;

        const webpResult = await generateWebp(file);
        totalWebp += webpResult.webpSize;

        console.log(`png ${file}: ${fmt(pngResult.before)} -> ${fmt(pngResult.after)} | webp ${fmt(webpResult.webpSize)}`);
    }

    updateRuntimeRefsToWebp();

    console.log("---");
    console.log(`Arquivos processados: ${files.length}`);
    console.log(`PNG original total: ${fmt(totalBefore)}`);
    console.log(`PNG otimizado total: ${fmt(totalAfterPng)}`);
    console.log(`WEBP total: ${fmt(totalWebp)}`);
    console.log(`PNGs alterados: ${changedCount}`);
    console.log("Referencias runtime atualizadas para WEBP em client/game.js");
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
