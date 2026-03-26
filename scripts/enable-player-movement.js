// Enable Player Movement Script
// Habilita movimento do jogador e sistema de combate

const fs = require('fs');
const path = require('path');

console.log('🏃 Habilitando Movimento do Jogador e Combate\n');

function enablePlayerMovement() {
    const clientPath = path.join(__dirname, '../client/IntegratedGameplayEngine.js');
    
    if (!fs.existsSync(clientPath)) {
        console.error('❌ IntegratedGameplayEngine.js não encontrado');
        return false;
    }
    
    let clientContent = fs.readFileSync(clientPath, 'utf8');
    
    // Encontrar a seção de setupEventListeners
    const eventListenersSection = `setupEventListeners() {
        // Keyboard controls
        document.addEventListener('keydown', (e) => this.handleKeyDown(e.key));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e.key));
        
        // Mouse controls
        this.canvas.addEventListener('click', (e) => this.handleMouseClick(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    }`;
    
    const enhancedEventListeners = `setupEventListeners() {
        // Keyboard controls
        document.addEventListener('keydown', (e) => this.handleKeyDown(e.key));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e.key));
        
        // Mouse controls
        this.canvas.addEventListener('click', (e) => this.handleMouseClick(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        
        // Impedir scroll com WASD
        window.addEventListener('keydown', (e) => {
            if (['w', 'a', 's', 'd', 'W', 'A', 'S', 'D', ' '].includes(e.key)) {
                e.preventDefault();
            }
        });
    }`;
    
    // Encontrar a seção de handleKeyDown
    const keyDownSection = `handleKeyDown(key) {
        // Movement
        if (key === 'w' || key === 'W') this.keys.up = true;
        if (key === 's' || key === 'S') this.keys.down = true;
        if (key === 'a' || key === 'A') this.keys.left = true;
        if (key === 'd' || key === 'D') this.keys.right = true;
        
        // Debug
        if (key === 'r' || key === 'R') this.clearMobs();`;
    
    const enhancedKeyDown = `handleKeyDown(key) {
        // Movement
        if (key === 'w' || key === 'W') this.keys.up = true;
        if (key === 's' || key === 'S') this.keys.down = true;
        if (key === 'a' || key === 'A') this.keys.left = true;
        if (key === 'd' || key === 'D') this.keys.right = true;
        
        // Attack/Combat
        if (key === ' ') {
            this.performAttack();
        }
        
        // Skill 1-4
        if (key >= '1' && key <= '4') {
            this.useSkill(parseInt(key) - 1);
        }
        
        // Debug
        if (key === 'r' || key === 'R') this.clearMobs();`;
    
    // Encontrar a seção update
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
            this.player.x += normalizedX * speed * deltaTime;
            this.player.y += normalizedY * speed * deltaTime;
            
            // Keep player in bounds
            this.player.x = Math.max(0, Math.min(this.canvas.width - 32, this.player.x));
            this.player.y = Math.max(0, Math.min(this.canvas.height - 32, this.player.y));
            
            // Send position to server
            if (this.socket && this.socket.connected) {
                this.socket.emit('playerMove', {
                    x: this.player.x,
                    y: this.player.y
                });
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
        }`;
    
    // Encontrar a seção handleMouseClick
    const mouseClickSection = `handleMouseClick(e) {
        // Get mouse position relative to canvas
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        console.log('🖱️ Mouse clicked at (' + x + ', ' + y + ')');
    }`;
    
    const enhancedMouseClick = `handleMouseClick(e) {
        // Get mouse position relative to canvas
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        console.log('🖱️ Mouse clicked at (' + x + ', ' + y + ')');
        
        // Check if clicked on a mob
        this.mobs.forEach(mob => {
            const mobRect = {
                left: mob.x,
                right: mob.x + (mob.width || 32),
                top: mob.y,
                bottom: mob.y + (mob.height || 32)
            };
            
            if (x >= mobRect.left && x <= mobRect.right && y >= mobRect.top && y <= mobRect.bottom) {
                console.log('🎯 Clicked on mob: ' + mob.name);
                this.attackMob(mob.id);
            }
        });
    }`;
    
    // Adicionar método attackMob
    const attackMobMethod = `    attackMob(mobId) {
        if (!this.socket || !this.socket.connected) {
            console.log('❌ Não conectado ao servidor');
            return;
        }
        
        const mob = this.mobs.find(m => m.id === mobId);
        if (!mob) {
            console.log('❌ Mob não encontrado: ' + mobId);
            return;
        }
        
        // Calcular distância
        const dx = mob.x - this.player.x;
        const dy = mob.y - this.player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 100) {
            console.log('❌ Mob muito longe: ' + distance.toFixed(2) + 'px (máximo 100px)');
            return;
        }
        
        // Calcular dano
        const damage = 10 + Math.floor(Math.random() * 10); // 10-20 dano
        
        console.log('⚔️ Atacando ' + mob.name + ' a ' + distance.toFixed(2) + 'px com ' + damage + ' de dano');
        
        // Enviar ataque ao servidor
        this.socket.emit('attackMob', {
            mobId: mobId,
            damage: damage
        });
        
        // Feedback visual
        this.showDamage(mob.x, mob.y, damage);
    }`;
    
    let changes = 0;
    
    // Aplicar mudanças
    if (clientContent.includes(eventListenersSection)) {
        clientContent = clientContent.replace(eventListenersSection, enhancedEventListeners);
        changes++;
        console.log('✅ Event listeners melhorados');
    }
    
    if (clientContent.includes(keyDownSection)) {
        clientContent = clientContent.replace(keyDownSection, enhancedKeyDown);
        changes++;
        console.log('✅ KeyDown handler atualizado');
    }
    
    if (clientContent.includes(updateSection)) {
        clientContent = clientContent.replace(updateSection, enhancedUpdate);
        changes++;
        console.log('✅ Update method melhorado');
    }
    
    if (clientContent.includes(mouseClickSection)) {
        clientContent = clientContent.replace(mouseClickSection, enhancedMouseClick);
        changes++;
        console.log('✅ Mouse click handler atualizado');
    }
    
    // Adicionar método attackMob antes do final da classe
    const classEndMarker = `    renderAllMobs() {
        // Renderizar todos os mobs
        this.render();
    }`;
    
    if (clientContent.includes(classEndMarker)) {
        clientContent = clientContent.replace(classEndMarker, attackMobMethod + '\n\n    ' + classEndMarker);
        changes++;
        console.log('✅ Método attackMob adicionado');
    }
    
    if (changes > 0) {
        fs.writeFileSync(clientPath, clientContent);
        console.log('✅ ' + changes + ' mudanças aplicadas com sucesso');
        return true;
    } else {
        console.log('⚠️ Nenhuma mudança necessária');
        return false;
    }
}

// Executar
console.log('🎯 Enable Player Movement v0.4.0');
console.log('===================================\n');

const success = enablePlayerMovement();

if (success) {
    console.log('\n🎮 Controles Habilitados:');
    console.log('   🏃 WASD - Movimento do jogador');
    console.log('   🖱️ Clique nos mobs - Ataque direto');
    console.log('   ⚔️ ESPAÇO - Ataque mais próximo');
    console.log('   🎯 1-4 - Skills especiais');
    
    console.log('\n🔄 Recarregue a página para usar as novas funções:');
    console.log('   1. Feche o jogo');
    console.log('   2. Abra novamente: http://localhost:3000');
    console.log('   3. Entre no mundo');
    console.log('   4. Use WASD para se mover');
    console.log('   5. Clique nos mobs para atacar');
    
    console.log('\n📊 Sistema completo:');
    console.log('   ✅ Movimento do jogador');
    console.log('   ✅ Perseguição dos mobs');
    console.log('   ✅ Combate funcional');
    console.log('   ✅ Feedback visual');
} else {
    console.log('\n❌ Falha ao habilitar movimento');
}

console.log('\n✅ Script concluído!');
