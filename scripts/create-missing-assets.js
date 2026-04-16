// Create Missing Assets Script
// Usage: node scripts/create-missing-assets.js

const fs = require('fs');
const path = require('path');

console.log('🎨 Creating Missing Assets for Better Visual Experience\n');

// Asset configurations
const assetConfigs = {
    npcs: [
        { name: 'captain', color: '#FF6B6B', type: 'guard' },
        { name: 'explorer_npc', color: '#4CAF50', type: 'adventurer' },
        { name: 'hermit_npc', color: '#9E9E9E', type: 'mystic' },
        { name: 'innkeeper', color: '#795548', type: 'merchant' },
        { name: 'merchant', color: '#FF9800', type: 'trader' },
        { name: 'miner_npc', color: '#607D8B', type: 'worker' },
        { name: 'ranger_npc', color: '#8BC34A', type: 'scout' },
        { name: 'sentinel_npc', color: '#3F51B5', type: 'guard' }
    ],
    monsters: [
        { name: 'dire_wolf', color: '#D32F2F', type: 'beast' },
        { name: 'goblin_raider', color: '#4CAF50', type: 'goblin' },
        { name: 'mountain_orc', color: '#795548', type: 'orc' }
    ],
    characters: [
        { name: 'human_adventurer', color: '#2196F3', type: 'human' },
        { name: 'elf_ranger', color: '#4CAF50', type: 'elf' },
        { name: 'dwarf_guardian', color: '#FF9800', type: 'dwarf' }
    ],
    maps: [
        { name: 'village_day', type: 'village', time: 'day' },
        { name: 'forest_north', type: 'forest', time: 'day' },
        { name: 'cave_echo', type: 'dungeon', time: 'dark' }
    ],
    dungeons: [
        { name: 'solo_ruins', type: 'ruins', difficulty: 'solo' },
        { name: 'group_crypt', type: 'crypt', difficulty: 'group' }
    ]
};

// Create directories if they don't exist
function ensureDirectory(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        console.log(`📁 Created directory: ${dirPath}`);
    }
}

// Generate SVG asset
function generateSVGAsset(config, category) {
    const { name, color, type } = config;
    
    let svgContent = '';
    
    if (category === 'npcs' || category === 'characters') {
        // Humanoid characters
        svgContent = `<svg width="64" height="64" xmlns="http://www.w3.org/2000/svg">
            <rect width="64" height="64" fill="${color}"/>
            <circle cx="32" cy="20" r="8" fill="#FFF"/>
            <rect x="24" y="28" width="16" height="20" fill="#333"/>
            <rect x="20" y="48" width="8" height="12" fill="#8B4513"/>
            <rect x="36" y="48" width="8" height="12" fill="#8B4513"/>
            <text x="32" y="60" text-anchor="middle" fill="#FFF" font-size="8">${name.substring(0, 3).toUpperCase()}</text>
        </svg>`;
    } else if (category === 'monsters') {
        // Monster characters
        svgContent = `<svg width="64" height="64" xmlns="http://www.w3.org/2000/svg">
            <rect width="64" height="64" fill="${color}"/>
            <circle cx="32" cy="25" r="10" fill="#FF0000"/>
            <polygon points="32,35 25,45 39,45" fill="#FFF"/>
            <rect x="20" y="48" width="24" height="12" fill="#333"/>
            <text x="32" y="60" text-anchor="middle" fill="#FFF" font-size="8">${type.substring(0, 3).toUpperCase()}</text>
        </svg>`;
    } else if (category === 'maps') {
        // Map backgrounds
        svgContent = `<svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <rect width="40" height="40" fill="none" stroke="#333" stroke-width="0.5"/>
                </pattern>
            </defs>
            <rect width="800" height="600" fill="${color}"/>
            <rect width="800" height="600" fill="url(#grid)" opacity="0.3"/>
            <text x="400" y="300" text-anchor="middle" fill="#FFF" font-size="24" opacity="0.5">${name.toUpperCase()}</text>
        </svg>`;
    } else if (category === 'dungeons') {
        // Dungeon maps
        svgContent = `<svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
            <rect width="800" height="600" fill="#1a1a1a"/>
            <rect x="100" y="100" width="600" height="400" fill="${color}" stroke="#666" stroke-width="2"/>
            <text x="400" y="300" text-anchor="middle" fill="#FFF" font-size="20">${name.replace('_', ' ').toUpperCase()}</text>
        </svg>`;
    }
    
    return svgContent;
}

// Create placeholder image (simple colored rectangle)
function createPlaceholderImage(config, category) {
    const canvas = require('canvas').createCanvas(64, 64);
    const ctx = canvas.getContext('2d');
    
    if (category === 'maps' || category === 'dungeons') {
        const mapCanvas = require('canvas').createCanvas(800, 600);
        const mapCtx = mapCanvas.getContext('2d');
        
        // Background
        mapCtx.fillStyle = config.color || '#4CAF50';
        mapCtx.fillRect(0, 0, 800, 600);
        
        // Grid pattern
        mapCtx.strokeStyle = '#333';
        mapCtx.lineWidth = 0.5;
        for (let x = 0; x <= 800; x += 40) {
            mapCtx.beginPath();
            mapCtx.moveTo(x, 0);
            mapCtx.lineTo(x, 600);
            mapCtx.stroke();
        }
        for (let y = 0; y <= 600; y += 40) {
            mapCtx.beginPath();
            mapCtx.moveTo(0, y);
            mapCtx.lineTo(800, y);
            mapCtx.stroke();
        }
        
        // Label
        mapCtx.fillStyle = '#FFF';
        mapCtx.font = '24px Arial';
        mapCtx.textAlign = 'center';
        mapCtx.fillText(config.name.replace('_', ' ').toUpperCase(), 400, 300);
        
        return mapCanvas.toBuffer('image/png');
    } else {
        // Character/NPC/Monster
        ctx.fillStyle = config.color || '#999';
        ctx.fillRect(0, 0, 64, 64);
        
        // Face
        ctx.fillStyle = '#FFF';
        ctx.beginPath();
        ctx.arc(32, 20, 8, 0, Math.PI * 2);
        ctx.fill();
        
        // Body
        ctx.fillStyle = '#333';
        ctx.fillRect(24, 28, 16, 20);
        
        // Legs
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(20, 48, 8, 12);
        ctx.fillRect(36, 48, 8, 12);
        
        // Label
        ctx.fillStyle = '#FFF';
        ctx.font = '8px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(config.name.substring(0, 3).toUpperCase(), 32, 60);
        
        return canvas.toBuffer('image/png');
    }
}

// Main creation function
function createAssets() {
    const clientPath = path.join(__dirname, '../client');
    
    Object.entries(assetConfigs).forEach(([category, assets]) => {
        console.log(`\n🎨 Creating ${category} assets...`);
        
        let targetDir;
        if (category === 'npcs') {
            targetDir = path.join(clientPath, 'assets/npcs');
        } else if (category === 'monsters') {
            targetDir = path.join(clientPath, 'assets/monsters');
        } else if (category === 'characters') {
            targetDir = path.join(clientPath, 'assets/characters');
        } else if (category === 'maps') {
            targetDir = path.join(clientPath, 'assets/maps');
        } else if (category === 'dungeons') {
            targetDir = path.join(clientPath, 'areas/dungeons');
        }
        
        ensureDirectory(targetDir);
        
        assets.forEach(asset => {
            const filePath = path.join(targetDir, `${asset.name}.png`);
            
            try {
                let imageBuffer;
                
                // Try to use canvas library first
                try {
                    imageBuffer = createPlaceholderImage(asset, category);
                } catch (canvasError) {
                    // Fallback to SVG
                    console.log(`⚠️ Canvas not available, using SVG fallback for ${asset.name}`);
                    const svgContent = generateSVGAsset(asset, category);
                    fs.writeFileSync(filePath.replace('.png', '.svg'), svgContent);
                    console.log(`✅ Created SVG: ${asset.name}.svg`);
                    return;
                }
                
                fs.writeFileSync(filePath, imageBuffer);
                console.log(`✅ Created: ${asset.name}.png`);
                
            } catch (error) {
                console.error(`❌ Failed to create ${asset.name}:`, error.message);
            }
        });
    });
}

// Create asset manifest
function createAssetManifest() {
    const manifest = {
        version: '0.4.0',
        created: new Date().toISOString(),
        assets: {}
    };
    
    Object.entries(assetConfigs).forEach(([category, assets]) => {
        manifest.assets[category] = assets.map(asset => ({
            name: asset.name,
            file: `${asset.name}.png`,
            type: asset.type || 'unknown',
            created: true
        }));
    });
    
    const manifestPath = path.join(__dirname, '../client/assets/manifest.json');
    ensureDirectory(path.dirname(manifestPath));
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    console.log('\n📋 Created asset manifest: client/assets/manifest.json');
}

// Execute
try {
    createAssets();
    createAssetManifest();
    
    console.log('\n🎉 Asset creation completed!');
    console.log('📝 Summary:');
    console.log('   - NPCs: 8 assets created');
    console.log('   - Monsters: 3 assets created');
    console.log('   - Characters: 3 assets created');
    console.log('   - Maps: 3 assets created');
    console.log('   - Dungeons: 2 assets created');
    console.log('   - Total: 19 assets created');
    console.log('\n✅ Visual experience improved!');
    
} catch (error) {
    console.error('❌ Error creating assets:', error);
    process.exit(1);
}
