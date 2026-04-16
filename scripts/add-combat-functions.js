// Add Combat Functions Script
// Adiciona funções de combate ao IntegratedGameplayEngine

const fs = require('fs');
const path = require('path');

console.log('⚔️ Adicionando Funções de Combate\n');

function addCombatFunctions() {
    const clientPath = path.join(__dirname, '../client/IntegratedGameplayEngine.js');
    
    if (!fs.existsSync(clientPath)) {
        console.error('❌ IntegratedGameplayEngine.js não encontrado');
        return false;
    }
    
    let clientContent = fs.readFileSync(clientPath, 'utf8');
    
    // Encontrar o final da classe para adicionar métodos
    const classEnd = `    renderAllMobs() {
        // Renderizar todos os mobs
        this.render();
    }`;
    
    const combatFunctions = `    renderAllMobs() {
        // Renderizar todos os mobs
        this.render();
    }
    
    // Funções de Combate
    performAttack() {
        if (!this.socket || !this.socket.connected) {
            console.log('❌ Não conectado ao servidor');
            return;
        }
        
        // Encontrar mob mais próximo
        let nearestMob = null;
        let minDistance = Infinity;
        
        this.mobs.forEach(mob => {
            const dx = mob.x - this.player.x;
            const dy = mob.y - this.player.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < minDistance && distance < 100) { // 100px de alcance
                minDistance = distance;
                nearestMob = mob;
            }
        });
        
        if (nearestMob) {
            console.log('⚔️ Atacando ' + nearestMob.name + ' a ' + minDistance.toFixed(2) + 'px');
            
            // Enviar ataque ao servidor
            this.socket.emit('attackMob', {
                mobId: nearestMob.id,
                damage: 10 + Math.floor(Math.random() * 10) // 10-20 dano
            });
            
            // Feedback visual
            this.showDamage(nearestMob.x, nearestMob.y, 10 + Math.floor(Math.random() * 10));
        } else {
            console.log('❌ Nenhum mob no alcance (100px)');
        }
    }
    
    useSkill(skillIndex) {
        console.log('🎯 Usando skill ' + (skillIndex + 1));
        
        // Skills baseadas no índice
        const skills = [
            { name: 'Fireball', damage: 25, range: 150 },
            { name: 'Heal', healing: 30, range: 0 },
            { name: 'Lightning', damage: 40, range: 200 },
            { name: 'Berserk', damage: 15, range: 80 }
        ];
        
        const skill = skills[skillIndex];
        if (!skill) return;
        
        if (skill.damage) {
            // Skill de dano
            let nearestMob = null;
            let minDistance = Infinity;
            
            this.mobs.forEach(mob => {
                const dx = mob.x - this.player.x;
                const dy = mob.y - this.player.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < minDistance && distance < skill.range) {
                    minDistance = distance;
                    nearestMob = mob;
                }
            });
            
            if (nearestMob) {
                console.log('🔥 Usando ' + skill.name + ' em ' + nearestMob.name);
                
                this.socket.emit('attackMob', {
                    mobId: nearestMob.id,
                    damage: skill.damage
                });
                
                this.showDamage(nearestMob.x, nearestMob.y, skill.damage);
                this.showSkillEffect(skill.name, nearestMob.x, nearestMob.y);
            } else {
                console.log('❌ Nenhum mob no alcance da skill ' + skill.range + 'px');
            }
        } else if (skill.healing) {
            // Skill de cura
            this.player.hp = Math.min(this.player.maxHp, this.player.hp + skill.healing);
            console.log('💚 Usando ' + skill.name + ' - curou ' + skill.healing + ' HP');
            this.updateHUD();
            this.showSkillEffect(skill.name, this.player.x, this.player.y);
        }
    }
    
    showDamage(x, y, damage) {
        // Mostrar número de dano flutuante
        const damageText = document.createElement('div');
        damageText.textContent = '-' + damage;
        damageText.style.position = 'absolute';
        damageText.style.left = x + 'px';
        damageText.style.top = (y - 20) + 'px';
        damageText.style.color = '#ff0000';
        damageText.style.fontSize = '16px';
        damageText.style.fontWeight = 'bold';
        damageText.style.zIndex = '9999';
        damageText.style.pointerEvents = 'none';
        damageText.style.transition = 'all 1s ease-out';
        
        document.body.appendChild(damageText);
        
        // Animação
        setTimeout(() => {
            damageText.style.transform = 'translateY(-30px)';
            damageText.style.opacity = '0';
        }, 100);
        
        // Remover após animação
        setTimeout(() => {
            if (damageText.parentNode) {
                damageText.parentNode.removeChild(damageText);
            }
        }, 1100);
    }
    
    showSkillEffect(skillName, x, y) {
        // Mostrar efeito visual da skill
        const effect = document.createElement('div');
        effect.textContent = '✨ ' + skillName;
        effect.style.position = 'absolute';
        effect.style.left = (x - 30) + 'px';
        effect.style.top = (y - 40) + 'px';
        effect.style.color = '#ffff00';
        effect.style.fontSize = '14px';
        effect.style.fontWeight = 'bold';
        effect.style.zIndex = '9999';
        effect.style.pointerEvents = 'none';
        effect.style.transition = 'all 1.5s ease-out';
        
        document.body.appendChild(effect);
        
        // Animação
        setTimeout(() => {
            effect.style.transform = 'translateY(-20px) scale(1.5)';
            effect.style.opacity = '0';
        }, 100);
        
        // Remover após animação
        setTimeout(() => {
            if (effect.parentNode) {
                effect.parentNode.removeChild(effect);
            }
        }, 1600);
    }`;
    
    // Aplicar mudanças
    if (clientContent.includes(classEnd)) {
        clientContent = clientContent.replace(classEnd, combatFunctions);
        fs.writeFileSync(clientPath, clientContent);
        console.log('✅ Funções de combate adicionadas com sucesso');
        console.log('   ⚔️ performAttack() - Ataque básico (espaço)');
        console.log('   🎯 useSkill() - Skills 1-4');
        console.log('   💥 showDamage() - Dano visual');
        console.log('   ✨ showSkillEffect() - Efeitos de skill');
        return true;
    } else {
        console.log('⚠️ Seção final da classe não encontrada');
        return false;
    }
}

// Executar
console.log('🎯 Add Combat Functions v0.4.0');
console.log('=================================\n');

const success = addCombatFunctions();

if (success) {
    console.log('\n🎮 Controles de Combate:');
    console.log('   ESPAÇO - Ataque básico');
    console.log('   1 - Fireball (25 dano, 150px alcance)');
    console.log('   2 - Heal (30 HP cura)');
    console.log('   3 - Lightning (40 dano, 200px alcance)');
    console.log('   4 - Berserk (15 dano, 80px alcance)');
    
    console.log('\n🔄 Recarregue a página para usar as novas funções');
    console.log('   1. Feche o jogo');
    console.log('   2. Abra novamente: http://localhost:3000');
    console.log('   3. Entre no mundo');
    console.log('   4. Use ESPAÇO ou 1-4 para atacar');
} else {
    console.log('\n❌ Falha ao adicionar funções de combate');
}

console.log('\n✅ Script concluído!');
