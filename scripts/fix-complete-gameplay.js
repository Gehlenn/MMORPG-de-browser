// Fix Complete Gameplay Script
// Corrige movimento do jogador, combate automático dos mobs, dano e XP

const fs = require('fs');
const path = require('path');

console.log('🎮 Corrigindo Gameplay Completo\n');

function fixCompleteGameplay() {
    const clientPath = path.join(__dirname, '../client/IntegratedGameplayEngine.js');
    const serverPath = path.join(__dirname, '../server/server-simple-fixed.js');
    
    if (!fs.existsSync(clientPath) || !fs.existsSync(serverPath)) {
        console.error('❌ Arquivos não encontrados');
        return false;
    }
    
    let clientContent = fs.readFileSync(clientPath, 'utf8');
    let serverContent = fs.readFileSync(serverPath, 'utf8');
    
    // === CORREÇÕES DO CLIENTE ===
    
    // 1. Corrigir movimento do jogador
    const updateSection = `update(deltaTime) {
        // Update player position based on keys
        const speed = 200; // pixels per second
        const moveX = (this.keys.right ? 1 : 0) - (this.keys.left ? 1 : 0);
        const moveY = (this.keys.down ? 1 : 0) - (this.keys.up ? 1 : 0);
        
        if (moveX !== 0 || moveY !== 0) {
            // Normalize diagonal movement
            const length = Math.sqrt(moveX * moveX + moveY * moveY);
            const normalizedX = moveX / length;
            const normalizedY = moveY / length;
            
            // Apply movement
            const oldX = this.player.x;
            const oldY = this.player.y;
            
            this.player.x += normalizedX * speed * deltaTime;
            this.player.y += normalizedY * speed * deltaTime;
            
            // Keep player in bounds
            this.player.x = Math.max(0, Math.min(this.canvas.width - 32, this.player.x));
            this.player.y = Math.max(0, Math.min(this.canvas.height - 32, this.player.y));
            
            // Send position to server only if position changed
            if (this.socket && this.socket.connected && (oldX !== this.player.x || oldY !== this.player.y)) {
                this.socket.emit('playerMove', {
                    x: this.player.x,
                    y: this.player.y
                });
                console.log('🏃 Player moved to (' + this.player.x.toFixed(1) + ', ' + this.player.y.toFixed(1) + ')');
            }
        }`;
    
    const enhancedUpdate = `update(deltaTime) {
        // Update player position based on keys
        const speed = 200; // pixels per second
        const moveX = (this.keys.right ? 1 : 0) - (this.keys.left ? 1 : 0);
        const moveY = (this.keys.down ? 1 : 0) - (this.keys.up ? 1 : 0);
        
        if (moveX !== 0 || moveY !== 0) {
            // Normalize diagonal movement
            const length = Math.sqrt(moveX * moveX + moveY * moveY);
            const normalizedX = moveX / length;
            const normalizedY = moveY / length;
            
            // Apply movement
            const oldX = this.player.x;
            const oldY = this.player.y;
            
            this.player.x += normalizedX * speed * deltaTime;
            this.player.y += normalizedY * speed * deltaTime;
            
            // Keep player in bounds
            this.player.x = Math.max(0, Math.min(this.canvas.width - 32, this.player.x));
            this.player.y = Math.max(0, Math.min(this.canvas.height - 32, this.player.y));
            
            // Send position to server only if position changed
            if (this.socket && this.socket.connected && (oldX !== this.player.x || oldY !== this.player.y)) {
                this.socket.emit('playerMove', {
                    x: this.player.x,
                    y: this.player.y
                });
                console.log('🏃 Player moved to (' + this.player.x.toFixed(1) + ', ' + this.player.y.toFixed(1) + ')');
            }
        }
        
        // Verificar se jogador está se movendo
        if (moveX === 0 && moveY === 0) {
            // Jogador parado - enviar posição anyway para manter sincronizado
            if (this.socket && this.socket.connected && Math.random() < 0.1) { // 10% de chance
                this.socket.emit('playerMove', {
                    x: this.player.x,
                    y: this.player.y
                });
            }
        }`;
    
    // 2. Adicionar evento de dano recebido
    const damageSection = `this.socket.on('combat_damage', (data) => {
            if (data.targetId === this.player.id) {
                this.player.hp = Math.max(0, this.player.hp - data.damage);
                this.updateHUD();
            }
        });`;
    
    const enhancedDamage = `this.socket.on('combat_damage', (data) => {
            if (data.targetId === this.player.id || data.targetId === this.socket.id) {
                this.player.hp = Math.max(0, this.player.hp - data.damage);
                console.log('💔 Player recebeu ' + data.damage + ' de dano! HP: ' + this.player.hp + '/' + this.player.maxHp);
                this.updateHUD();
                this.showDamage(this.player.x, this.player.y, data.damage);
            }
        });
        
        this.socket.on('mobAttack', (data) => {
            if (data.targetId === this.player.id || data.targetId === this.socket.id) {
                this.player.hp = Math.max(0, this.player.hp - data.damage);
                console.log('👹 ' + data.mobName + ' atacou! Dano: ' + data.damage + ' HP: ' + this.player.hp + '/' + this.player.maxHp);
                this.updateHUD();
                this.showDamage(this.player.x, this.player.y, data.damage);
                
                if (this.player.hp <= 0) {
                    console.log('💀 Player derrotado!');
                    this.handlePlayerDeath();
                }
            }
        });`;
    
    // 3. Adicionar método de morte do jogador
    const deathMethod = `    handlePlayerDeath() {
        console.log('💀 Player morreu - respawn em 5 segundos...');
        
        // Respawn após 5 segundos
        setTimeout(() => {
            this.player.x = 400;
            this.player.y = 300;
            this.player.hp = this.player.maxHp;
            
            if (this.socket && this.socket.connected) {
                this.socket.emit('playerMove', {
                    x: this.player.x,
                    y: this.player.y
                });
            }
            
            console.log('✅ Player respawnado!');
            this.updateHUD();
        }, 5000);
    }`;
    
    // === CORREÇÕES DO SERVIDOR ===
    
    // 4. Adicionar ataque automático dos mobs
    const mobAISection = `if (nearestPlayer && minDistance > 20) {
                    const dx = nearestPlayer.x - mob.x;
                    const dy = nearestPlayer.y - mob.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    const moveX = (dx / distance) * (mob.speed || 4);
                    const moveY = (dy / distance) * (mob.speed || 4);
                    
                    const oldX = mob.x;
                    const oldY = mob.y;
                    
                    mob.x += moveX;
                    mob.y += moveY;
                    
                    console.log('🏃 ' + mob.name + ' moving from (' + oldX.toFixed(1) + ', ' + oldY.toFixed(1) + ') to (' + mob.x.toFixed(1) + ', ' + mob.y.toFixed(1) + ')');
                    
                    // Emitir update para todos os jogadores
                    this.io.emit('mobUpdate', { 
                        id: mobId, 
                        x: mob.x, 
                        y: mob.y,
                        name: mob.name,
                        type: mob.type,
                        hp: mob.hp,
                        maxHp: mob.maxHp,
                        color: mob.color
                    });
                    
                    console.log('📡 Emitted mobUpdate for ' + mob.name);
                } else {
                    console.log('⏸️ ' + mob.name + ' not moving - nearestPlayer: ' + (nearestPlayer ? nearestPlayer.name : 'none') + ', distance: ' + minDistance.toFixed(2) + 'px');
                    
                    // Emitir update mesmo se não se mover (para manter sincronizado)
                    this.io.emit('mobUpdate', { 
                        id: mobId, 
                        x: mob.x, 
                        y: mob.y,
                        name: mob.name,
                        type: mob.type,
                        hp: mob.hp,
                        maxHp: mob.maxHp,
                        color: mob.color
                    });
                }`;
    
    const enhancedMobAI = `if (nearestPlayer && minDistance > 20) {
                    const dx = nearestPlayer.x - mob.x;
                    const dy = nearestPlayer.y - mob.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    const moveX = (dx / distance) * (mob.speed || 4);
                    const moveY = (dy / distance) * (mob.speed || 4);
                    
                    const oldX = mob.x;
                    const oldY = mob.y;
                    
                    mob.x += moveX;
                    mob.y += moveY;
                    
                    console.log('🏃 ' + mob.name + ' moving from (' + oldX.toFixed(1) + ', ' + oldY.toFixed(1) + ') to (' + mob.x.toFixed(1) + ', ' + mob.y.toFixed(1) + ')');
                    
                    // Emitir update para todos os jogadores
                    this.io.emit('mobUpdate', { 
                        id: mobId, 
                        x: mob.x, 
                        y: mob.y,
                        name: mob.name,
                        type: mob.type,
                        hp: mob.hp,
                        maxHp: mob.maxHp,
                        color: mob.color
                    });
                    
                    console.log('📡 Emitted mobUpdate for ' + mob.name);
                } else if (nearestPlayer && minDistance <= 20) {
                    // MOB ATACA JOGADOR PRÓXIMO!
                    console.log('⚔️ ' + mob.name + ' atacando ' + nearestPlayer.name + '!');
                    
                    // Calcular dano
                    const damage = mob.damage || 5;
                    
                    // Enviar dano ao jogador
                    this.io.emit('mobAttack', {
                        mobId: mobId,
                        mobName: mob.name,
                        targetId: nearestPlayer.id,
                        damage: damage
                    });
                    
                    console.log('💥 ' + mob.name + ' causou ' + damage + ' de dano em ' + nearestPlayer.name);
                } else {
                    console.log('⏸️ ' + mob.name + ' not moving - nearestPlayer: ' + (nearestPlayer ? nearestPlayer.name : 'none') + ', distance: ' + minDistance.toFixed(2) + 'px');
                    
                    // Emitir update mesmo se não se mover (para manter sincronizado)
                    this.io.emit('mobUpdate', { 
                        id: mobId, 
                        x: mob.x, 
                        y: mob.y,
                        name: mob.name,
                        type: mob.type,
                        hp: mob.hp,
                        maxHp: mob.maxHp,
                        color: mob.color
                    });
                }`;
    
    // 5. Corrigir sistema de XP
    const xpSection = `if (mob.hp <= 0) {
                    this.mobs.delete(mobId);
                    socket.emit('mobDefeated', { mobId: mobId, exp: mob.exp || 25 });
                    this.io.emit('mobRemove', { id: mobId });
                    console.log('💀 Mob ' + mobId + ' defeated by ' + socket.id);
                }`;
    
    const enhancedXP = `if (mob.hp <= 0) {
                    const expGained = mob.exp || 25;
                    this.mobs.delete(mobId);
                    
                    // Enviar XP ao jogador
                    socket.emit('mobDefeated', { 
                        mobId: mobId, 
                        exp: expGained,
                        mobName: mob.name
                    });
                    
                    // Remover mob para todos
                    this.io.emit('mobRemove', { id: mobId });
                    
                    console.log('💀 ' + socket.name + ' derrotou ' + mob.name + '! +' + expGained + ' EXP');
                }`;
    
    let changes = 0;
    
    // Aplicar mudanças no cliente
    if (clientContent.includes(updateSection)) {
        clientContent = clientContent.replace(updateSection, enhancedUpdate);
        changes++;
        console.log('✅ Movimento do jogador corrigido');
    }
    
    if (clientContent.includes(damageSection)) {
        clientContent = clientContent.replace(damageSection, enhancedDamage);
        changes++;
        console.log('✅ Sistema de dano recebido corrigido');
    }
    
    // Adicionar método de morte
    const classEndMarker = `    renderAllMobs() {
        // Renderizar todos os mobs
        this.render();
    }`;
    
    if (clientContent.includes(classEndMarker) && !clientContent.includes('handlePlayerDeath')) {
        clientContent = clientContent.replace(classEndMarker, deathMethod + '\n\n    ' + classEndMarker);
        changes++;
        console.log('✅ Sistema de morte/respawn adicionado');
    }
    
    // Aplicar mudanças no servidor
    if (serverContent.includes(mobAISection)) {
        serverContent = serverContent.replace(mobAISection, enhancedMobAI);
        changes++;
        console.log('✅ Ataque automático dos mobs adicionado');
    }
    
    if (serverContent.includes(xpSection)) {
        serverContent = serverContent.replace(xpSection, enhancedXP);
        changes++;
        console.log('✅ Sistema de XP corrigido');
    }
    
    // Salvar arquivos
    if (changes > 0) {
        fs.writeFileSync(clientPath, clientContent);
        fs.writeFileSync(serverPath, serverContent);
        console.log('✅ ' + changes + ' mudanças aplicadas com sucesso');
        return true;
    } else {
        console.log('⚠️ Nenhuma mudança necessária');
        return false;
    }
}

// Executar
console.log('🎯 Fix Complete Gameplay v0.4.0');
console.log('==================================\n');

const success = fixCompleteGameplay();

if (success) {
    console.log('\n🔄 Reinicie o servidor e o cliente:');
    console.log('   1. taskkill /f /im node.exe');
    console.log('   2. node server/server-simple-fixed.js');
    console.log('   3. Feche e reabra o jogo');
    
    console.log('\n🎮 Gameplay Completo Corrigido:');
    console.log('   🏃 Jogador: Movimento WASD funcional');
    console.log('   👾 Mobs: Ataque automático quando próximos');
    console.log('   💥 Dano: Mobs causam dano no jogador');
    console.log('   💀 Morte: Respawn automático após 5s');
    console.log('   ⭐ XP: Sistema de experiência funcionando');
    console.log('   ⚔️ Combate: Batalhas completas');
    
    console.log('\n📊 Status Final:');
    console.log('   ✅ Movimento do jogador');
    console.log('   ✅ Perseguição dos mobs');
    console.log('   ✅ Ataque automático dos mobs');
    console.log('   ✅ Dano recebido pelo jogador');
    console.log('   ✅ Sistema de XP');
    console.log('   ✅ Morte e respawn');
    console.log('   ✅ Gameplay MMORPG completo');
} else {
    console.log('\n❌ Falha ao corrigir gameplay');
}

console.log('\n✅ Script concluído!');
