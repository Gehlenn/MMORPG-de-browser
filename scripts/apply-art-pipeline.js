#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const EXT_PRIORITY = [".svg", ".png", ".webp", ".jpg", ".jpeg"];

function parseArgs(argv) {
    const args = { input: "art/generated", config: "art/pipeline.config.json", dryRun: false, backup: true };
    for (let i = 2; i < argv.length; i += 1) {
        const a = argv[i];
        const n = argv[i + 1];
        if (a === "--input" && n) {
            args.input = n;
            i += 1;
        } else if (a === "--config" && n) {
            args.config = n;
            i += 1;
        } else if (a === "--dry-run") {
            args.dryRun = true;
        } else if (a === "--no-backup") {
            args.backup = false;
        }
    }
    return args;
}

function walkFiles(dir) {
    if (!fs.existsSync(dir)) return [];
    const out = [];
    const stack = [dir];
    while (stack.length) {
        const current = stack.pop();
        for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
            const full = path.join(current, entry.name);
            if (entry.isDirectory()) stack.push(full);
            else out.push(full);
        }
    }
    return out;
}

function extRank(ext) {
    const idx = EXT_PRIORITY.indexOf(ext.toLowerCase());
    return idx === -1 ? 999 : idx;
}

function ensureDir(dir, dryRun) {
    if (dryRun) return;
    fs.mkdirSync(dir, { recursive: true });
}

function copyFile(src, dst, dryRun) {
    if (dryRun) return;
    fs.copyFileSync(src, dst);
}

function toPosix(p) {
    return p.replace(/\\/g, "/");
}

function escapeRegex(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function findByKey(files, key) {
    const lower = key.toLowerCase();
    const candidates = files.filter((f) => {
        const ext = path.extname(f).toLowerCase();
        if (!EXT_PRIORITY.includes(ext)) return false;
        const base = path.basename(f, ext).toLowerCase();
        return base === lower || base.startsWith(`${lower}_`) || base.startsWith(`${lower}-`) || base.startsWith(lower);
    });

    candidates.sort((a, b) => {
        const ea = extRank(path.extname(a));
        const eb = extRank(path.extname(b));
        if (ea !== eb) return ea - eb;
        return a.length - b.length;
    });

    return candidates[0] || null;
}

function backupExisting(destBase, backupRoot, dryRun, report) {
    const dir = path.dirname(destBase);
    const stem = path.basename(destBase);
    if (!fs.existsSync(dir)) return;

    const matches = fs.readdirSync(dir)
        .filter((name) => path.basename(name, path.extname(name)) === stem)
        .map((name) => path.join(dir, name));

    for (const src of matches) {
        const rel = path.relative(process.cwd(), src);
        const dst = path.join(backupRoot, rel);
        ensureDir(path.dirname(dst), dryRun);
        copyFile(src, dst, dryRun);
        report.push(`backup: ${toPosix(rel)} -> ${toPosix(path.relative(process.cwd(), dst))}`);
    }
}

function replaceRefs(gamePath, replacements, dryRun) {
    let game = fs.readFileSync(gamePath, "utf8");
    for (const rep of replacements) {
        const rx = new RegExp(`${escapeRegex(rep.refBase)}\\.(svg|png|webp|jpg|jpeg)`, "g");
        game = game.replace(rx, `${rep.refBase}${rep.ext}`);
    }
    if (!dryRun) fs.writeFileSync(gamePath, game, "utf8");
}

function processItems(items, files, opts, backupRoot, report, replacements) {
    for (const item of items) {
        let src = null;
        for (const key of item.keys) {
            src = findByKey(files, key);
            if (src) break;
        }

        if (!src) {
            report.push(`skip: ${item.keys.join("|")} (nao encontrado)`);
            continue;
        }

        const ext = path.extname(src).toLowerCase();
        const dest = `${item.destBase}${ext}`;
        ensureDir(path.dirname(dest), opts.dryRun);

        if (opts.backup) backupExisting(item.destBase, backupRoot, opts.dryRun, report);
        copyFile(src, dest, opts.dryRun);

        report.push(`copy: ${toPosix(path.relative(process.cwd(), src))} -> ${toPosix(dest)}`);

        if (item.refBase) replacements.push({ refBase: item.refBase, ext });
    }
}

function main() {
    const opts = parseArgs(process.argv);
    const inputDir = path.resolve(opts.input);
    const configPath = path.resolve(opts.config);

    if (!fs.existsSync(inputDir)) {
        console.error(`Input nao existe: ${inputDir}`);
        process.exit(1);
    }
    if (!fs.existsSync(configPath)) {
        console.error(`Config nao existe: ${configPath}`);
        process.exit(1);
    }

    const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
    const files = walkFiles(inputDir);
    const report = [];
    const replacements = [];

    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupRoot = path.join("art", "backups", stamp);

    processItems(config.targets || [], files, opts, backupRoot, report, replacements);
    processItems(config.extras || [], files, opts, backupRoot, report, []);

    if (replacements.length) {
        replaceRefs(path.join("client", "game.js"), replacements, opts.dryRun);
        report.push(`update: client/game.js (${replacements.length} referencias)`);
    }

    console.log(`Modo: ${opts.dryRun ? "DRY RUN" : "APPLY"}`);
    console.log(`Input: ${toPosix(path.relative(process.cwd(), inputDir))}`);
    for (const line of report) console.log(`- ${line}`);
}

main();
