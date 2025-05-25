// Battle VFX System - Visual effects for monster battles
import { battleAudio } from './battle-audio.js';

export class BattleVFX {
    constructor() {
        this.activeEffects = new Set();
        this.effectContainer = null;
        this.initialized = false;
    }

    // Initialize the VFX system
    initialize() {
        if (this.initialized) return;
        
        console.log('🎨 Initializing Battle VFX system...');
        
        // Initialize audio system alongside VFX with error handling
        try {
            battleAudio.initialize();
        } catch (error) {
            console.warn('🔊 Audio initialization failed, continuing without audio:', error);
        }
        
        // Create VFX container
        this.effectContainer = document.createElement('div');
        this.effectContainer.className = 'vfx-container';
        this.effectContainer.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 1000;
            overflow: hidden;
            border: 3px solid lime;
            background: rgba(0, 255, 0, 0.2);
        `;
        
        // Add to battle screen - try multiple selectors
        let battleScreen = document.querySelector('.battle-screen');
        if (!battleScreen) {
            battleScreen = document.querySelector('#main-content');
        }
        if (!battleScreen) {
            battleScreen = document.body;
        }
        
        if (battleScreen) {
            battleScreen.appendChild(this.effectContainer);
            console.log('✅ VFX container added to battle screen');
            console.log('🔍 Battle screen rect:', battleScreen.getBoundingClientRect());
            console.log('🔍 VFX container rect:', this.effectContainer.getBoundingClientRect());
        } else {
            console.warn('⚠️ Could not find battle screen element');
        }
        
        this.initialized = true;
        console.log('🎨 Battle VFX system initialized successfully!');
        
        // Only run test VFX in debug mode or when explicitly called
        // Removed automatic testVFX call to prevent debug effects during normal battles
    }

    // Test function to verify VFX visibility
    testVFX() {
        console.log('🧪 Testing VFX visibility...');
        
        if (!this.effectContainer) {
            console.error('❌ No VFX container found for test');
            return;
        }
        
        const testElement = document.createElement('div');
        testElement.innerHTML = '✨';
        testElement.style.cssText = `
            position: absolute;
            left: 50%;
            top: 50%;
            font-size: 4rem;
            color: #FFD700;
            z-index: 1005;
            pointer-events: none;
            transform: translate(-50%, -50%);
            animation: sparkle-fade 3s ease-out forwards;
        `;
        
        this.effectContainer.appendChild(testElement);
        console.log('🧪 Test VFX element created');
        
        // Also create fixed position markers for debugging
        this.createDebugMarkers();
        
        setTimeout(() => {
            if (testElement.parentNode) {
                testElement.parentNode.removeChild(testElement);
                console.log('🧪 Test VFX element removed');
            }
        }, 3500);
    }

    // Create debug markers at specific positions
    createDebugMarkers() {
        console.log('🎯 Creating debug position markers...');
        
        // Create markers at different positions
        const positions = [
            { x: 100, y: 100, emoji: '🔴', label: 'top-left' },
            { x: 500, y: 300, emoji: '🟡', label: 'center-left' },
            { x: 900, y: 500, emoji: '🔵', label: 'center-right' },
            { x: 1400, y: 100, emoji: '🟢', label: 'top-right' }
        ];
        
        positions.forEach((pos, i) => {
            setTimeout(() => {
                const marker = document.createElement('div');
                marker.innerHTML = pos.emoji;
                marker.style.cssText = `
                    position: absolute;
                    left: ${pos.x}px;
                    top: ${pos.y}px;
                    font-size: 3rem;
                    z-index: 1010;
                    pointer-events: none;
                    transform: translate(-50%, -50%);
                `;
                
                this.effectContainer.appendChild(marker);
                console.log(`🎯 Debug marker ${pos.label} created at (${pos.x}, ${pos.y})`);
                
                // Remove after 5 seconds
                setTimeout(() => {
                    if (marker.parentNode) {
                        marker.parentNode.removeChild(marker);
                    }
                }, 5000);
            }, i * 500);
        });
    }

    // Play move animation with VFX and audio
    async playMoveAnimation(moveData, userElement, targetElement, moveType) {
        if (!this.initialized) {
            console.log('🎨 VFX not initialized, initializing now...');
            this.initialize();
        }
        
        console.log(`🎨 Playing VFX for move: ${moveData.name} (${moveType})`);
        
        const effectPromises = [];
        
        // Play audio with error handling
        try {
            // Use move-specific VFX if available, otherwise fall back to type-based
            if (moveData.vfx) {
                console.log(`🎨 Using custom VFX for ${moveData.name}:`, moveData.vfx);
                
                // Play custom move sound
                if (moveData.vfx.sound) {
                    battleAudio.playMoveSound(moveType, moveData.category, moveData.vfx.sound);
                } else {
                    battleAudio.playMoveSound(moveType, moveData.category);
                }
                
                // Custom screen shake
                const shakeIntensity = moveData.vfx.screenShake || 'medium';
                effectPromises.push(this.screenShake(shakeIntensity));
                
                // Custom VFX based on move type
                effectPromises.push(this.playCustomMoveVFX(moveData.vfx, userElement, targetElement));
                
            } else {
                console.log(`🎨 Using default type VFX for ${moveData.name} (${moveType})`);
                
                // Play move sound
                battleAudio.playMoveSound(moveType, moveData.category);
                
                // Screen shake for impact
                effectPromises.push(this.screenShake(moveData.category === 'Physical' ? 'strong' : 'medium'));
                
                // Type-specific VFX
                effectPromises.push(this.playTypeVFX(moveType, userElement, targetElement));
            }
        } catch (error) {
            console.warn('🔊 Audio playback failed, continuing with VFX:', error);
            
            // Still do screen shake and visual effects
            effectPromises.push(this.screenShake(moveData.category === 'Physical' ? 'strong' : 'medium'));
            effectPromises.push(this.playTypeVFX(moveType, userElement, targetElement));
        }
        
        // User animation
        effectPromises.push(this.animateAttacker(userElement, moveData.category));
        
        // Delay for visual impact
        await this.wait(200);
        
        // Target hit effect
        effectPromises.push(this.animateTarget(targetElement, moveData.category));
        
        // Wait for all effects to complete
        await Promise.all(effectPromises);
        
        console.log(`✅ VFX completed for ${moveData.name}`);
    }

    // Play type-specific VFX
    async playTypeVFX(moveType, userElement, targetElement) {
        const targetRect = targetElement.getBoundingClientRect();
        const userRect = userElement.getBoundingClientRect();
        
        console.log('🎯 playTypeVFX debug:', {
            moveType,
            userElement,
            targetElement,
            userRect,
            targetRect,
            userElementClass: userElement.className,
            targetElementClass: targetElement.className
        });
        
        switch (moveType.toLowerCase()) {
            case 'water':
                return this.createWaterEffect(userRect, targetRect);
            case 'fire':
                return this.createFireEffect(userRect, targetRect);
            case 'electric':
                return this.createElectricEffect(userRect, targetRect);
            case 'grass':
                return this.createGrassEffect(userRect, targetRect);
            case 'ice':
                return this.createIceEffect(userRect, targetRect);
            case 'rock':
                return this.createRockEffect(userRect, targetRect);
            case 'normal':
                return this.createImpactEffect(userRect, targetRect);
            case 'fairy':
                return this.createFairyEffect(userRect, targetRect);
            default:
                return this.createGenericEffect(userRect, targetRect);
        }
    }

    // Water type VFX
    async createWaterEffect(userRect, targetRect) {
        // Create water projectile
        const projectile = this.createProjectile('water', '#6890F0', userRect, targetRect);
        
        // Water splash on impact
        setTimeout(() => {
            this.createExplosion(targetRect, '#6890F0', 'water');
            this.createRipple(targetRect, '#6890F0');
        }, 600);
        
        return this.wait(1000);
    }

    // Fire type VFX
    async createFireEffect(userRect, targetRect) {
        // Create fire projectile
        const projectile = this.createProjectile('fire', '#F08030', userRect, targetRect);
        
        // Fire explosion on impact
        setTimeout(() => {
            this.createExplosion(targetRect, '#F08030', 'fire');
            this.createScreenFlash('#FF4500', 0.3);
        }, 600);
        
        return this.wait(1000);
    }

    // Electric type VFX
    async createElectricEffect(userRect, targetRect) {
        // Lightning bolt effect
        this.createLightning(userRect, targetRect);
        this.createScreenFlash('#F8D030', 0.2);
        
        // Electric sparks
        setTimeout(() => {
            this.createSparks(targetRect, '#F8D030');
            this.createExplosion(targetRect, '#F8D030', 'electric');
        }, 300);
        
        return this.wait(800);
    }

    // Grass type VFX
    async createGrassEffect(userRect, targetRect) {
        // Leaf projectiles
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                this.createProjectile('grass', '#78C850', userRect, targetRect, 100 * i);
            }, i * 150);
        }
        
        // Nature growth effect
        setTimeout(() => {
            this.createGrowthEffect(targetRect, '#78C850');
        }, 500);
        
        return this.wait(1200);
    }

    // Ice type VFX
    async createIceEffect(userRect, targetRect) {
        // Ice crystals
        this.createIceCrystals(userRect, targetRect);
        
        // Freeze flash
        setTimeout(() => {
            this.createScreenFlash('#98D8D8', 0.4);
            this.createExplosion(targetRect, '#98D8D8', 'ice');
        }, 600);
        
        return this.wait(1000);
    }

    // Rock type VFX
    async createRockEffect(userRect, targetRect) {
        // Rock projectile
        const projectile = this.createProjectile('rock', '#B8A038', userRect, targetRect);
        
        // Impact with debris
        setTimeout(() => {
            this.createExplosion(targetRect, '#B8A038', 'rock');
            this.screenShake('strong');
        }, 600);
        
        return this.wait(1000);
    }

    // Fairy type VFX
    async createFairyEffect(userRect, targetRect) {
        // Sparkles trail
        this.createSparkleTrail(userRect, targetRect, '#EE99AC');
        
        // Magical burst
        setTimeout(() => {
            this.createExplosion(targetRect, '#EE99AC', 'fairy');
        }, 500);
        
        return this.wait(1000);
    }

    // Generic impact effect
    async createGenericEffect(userRect, targetRect) {
        this.createImpactWave(targetRect, '#A8A878');
        return this.wait(600);
    }

    // Create projectile effect (enhanced to handle emoji conversion)
    createProjectile(type, color, startRect, endRect, delay = 0) {
        // Convert emoji to type if needed
        const actualType = this.convertEmojiToType(type) || type;
        
        // Validate and provide fallbacks for rect values
        const safeRect = (rect, fallback = { left: 0, top: 0, width: 100, height: 100 }) => {
            return {
                left: isNaN(rect.left) ? fallback.left : rect.left,
                top: isNaN(rect.top) ? fallback.top : rect.top,
                width: isNaN(rect.width) ? fallback.width : rect.width,
                height: isNaN(rect.height) ? fallback.height : rect.height
            };
        };
        
        const safeStartRect = safeRect(startRect, { left: 100, top: 200, width: 100, height: 100 });
        const safeEndRect = safeRect(endRect, { left: 600, top: 200, width: 100, height: 100 });
        
        // Get the battle screen container offset for proper positioning
        const battleScreen = document.querySelector('.battle-screen');
        const containerOffset = battleScreen ? battleScreen.getBoundingClientRect() : { left: 0, top: 0 };
        
        const projectile = document.createElement('div');
        projectile.className = `vfx-projectile projectile-${actualType}`;
        
        // Create type-specific visual projectile
        this.createProjectileVisual(projectile, actualType, color);
        
        projectile.style.cssText = `
            position: absolute;
            width: 20px;
            height: 20px;
            z-index: 1001;
            pointer-events: none;
            will-change: transform;
            filter: drop-shadow(0 0 10px ${color});
        `;
        
        // Calculate positions relative to the VFX container (which is inside battle screen)
        const startX = safeStartRect.left - containerOffset.left + safeStartRect.width / 2;
        const startY = safeStartRect.top - containerOffset.top + safeStartRect.height / 2;
        const endX = safeEndRect.left - containerOffset.left + safeEndRect.width / 2;
        const endY = safeEndRect.top - containerOffset.top + safeEndRect.height / 2;
        
        // Validate calculated positions
        const deltaX = isNaN(endX - startX) ? 500 : endX - startX;
        const deltaY = isNaN(endY - startY) ? 0 : endY - startY;
        
        projectile.style.left = (isNaN(startX) ? 150 : startX) + 'px';
        projectile.style.top = (isNaN(startY) ? 250 : startY) + 'px';
        
        // Add to container
        if (this.effectContainer) {
            this.effectContainer.appendChild(projectile);
        } else {
            console.warn('⚠️ No VFX container, adding to body');
            document.body.appendChild(projectile);
        }
        
        // Create animation keyframes with validated values
        const keyframes = [
            { 
                transform: 'translate(-50%, -50%) scale(1) rotate(0deg)', 
                opacity: 1 
            },
            { 
                transform: `translate(calc(-50% + ${deltaX}px), calc(-50% + ${deltaY}px)) scale(1.2) rotate(180deg)`, 
                opacity: 0.8, 
                offset: 0.8 
            },
            { 
                transform: `translate(calc(-50% + ${deltaX}px), calc(-50% + ${deltaY}px)) scale(0) rotate(360deg)`, 
                opacity: 0 
            }
        ];
        
        console.log(`🎯 Projectile: ${actualType} (converted from ${type}) from (${startX},${startY}) to (${endX},${endY}) delta:(${deltaX},${deltaY})`);
        
        projectile.animate(keyframes, {
            duration: 600 + delay,
            easing: 'ease-out',
            fill: 'forwards'
        });
        
        // Remove after animation
        setTimeout(() => {
            if (projectile.parentNode) {
                projectile.parentNode.removeChild(projectile);
            }
        }, 800 + delay);
    }

    // Create type-specific projectile visuals
    createProjectileVisual(element, type, color) {
        switch (type) {
            case 'water':
                element.style.cssText += `
                    background: radial-gradient(circle, ${color} 0%, rgba(104, 144, 240, 0.8) 50%, transparent 100%);
                    border-radius: 50%;
                    box-shadow: 0 0 15px ${color}, inset 0 0 10px rgba(255, 255, 255, 0.3);
                `;
                break;
            case 'fire':
                element.style.cssText += `
                    background: radial-gradient(circle, #ff6b00 0%, ${color} 50%, #ff0000 100%);
                    border-radius: 50% 50% 50% 0;
                    transform: rotate(45deg);
                    box-shadow: 0 0 20px #ff4500;
                `;
                break;
            case 'electric':
                element.style.cssText += `
                    background: linear-gradient(45deg, ${color} 0%, #ffff00 50%, ${color} 100%);
                    clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%);
                    box-shadow: 0 0 25px ${color};
                `;
                break;
            case 'grass':
                element.style.cssText += `
                    background: linear-gradient(135deg, ${color} 0%, #90EE90 50%, #228B22 100%);
                    clip-path: polygon(50% 0%, 80% 10%, 100% 35%, 85% 50%, 100% 65%, 80% 90%, 50% 100%, 20% 90%, 0% 65%, 15% 50%, 0% 35%, 20% 10%);
                    box-shadow: 0 0 15px ${color};
                `;
                break;
            case 'ice':
                element.style.cssText += `
                    background: linear-gradient(45deg, ${color} 0%, #e0f6ff 50%, #87ceeb 100%);
                    clip-path: polygon(50% 0%, 75% 25%, 100% 50%, 75% 75%, 50% 100%, 25% 75%, 0% 50%, 25% 25%);
                    box-shadow: 0 0 20px ${color}, inset 0 0 10px rgba(255, 255, 255, 0.5);
                `;
                break;
            case 'rock':
                element.style.cssText += `
                    background: linear-gradient(135deg, ${color} 0%, #8B7355 50%, #654321 100%);
                    clip-path: polygon(20% 0%, 80% 0%, 100% 20%, 100% 80%, 80% 100%, 20% 100%, 0% 80%, 0% 20%);
                    box-shadow: 0 0 10px rgba(0,0,0,0.5);
                `;
                break;
            case 'fairy':
                element.style.cssText += `
                    background: radial-gradient(circle, ${color} 0%, #ff69b4 50%, transparent 100%);
                    border-radius: 50%;
                    box-shadow: 0 0 20px ${color}, 0 0 30px #ff69b4;
                `;
                // Add sparkle effect
                const sparkle = document.createElement('div');
                sparkle.style.cssText = `
                    position: absolute;
                    width: 4px;
                    height: 4px;
                    background: white;
                    border-radius: 50%;
                    top: 25%;
                    left: 25%;
                    animation: sparkle-fade 0.5s infinite alternate;
                `;
                element.appendChild(sparkle);
                break;
            default:
                element.style.cssText += `
                    background: radial-gradient(circle, ${color} 0%, rgba(168, 168, 120, 0.8) 50%, transparent 100%);
                    border-radius: 50%;
                    box-shadow: 0 0 10px ${color};
                `;
        }
    }

    // Create explosion effect
    createExplosion(targetRect, color, effectType = 'burst') {
        // Get the battle screen container offset for proper positioning
        const battleScreen = document.querySelector('.battle-screen');
        const containerOffset = battleScreen ? battleScreen.getBoundingClientRect() : { left: 0, top: 0 };
        
        const explosion = document.createElement('div');
        explosion.className = `vfx-explosion explosion-${effectType}`;
        
        // Create type-specific explosion visual
        this.createExplosionVisual(explosion, effectType, color);
        
        // Calculate position relative to VFX container
        const x = targetRect.left - containerOffset.left + targetRect.width / 2;
        const y = targetRect.top - containerOffset.top + targetRect.height / 2;
        
        explosion.style.cssText = `
            position: absolute;
            left: ${x}px;
            top: ${y}px;
            width: 60px;
            height: 60px;
            z-index: 1002;
            pointer-events: none;
            transform: translate(-50%, -50%) scale(0);
            animation: explosion-burst 0.8s ease-out forwards;
        `;
        
        this.effectContainer.appendChild(explosion);
        
        // Create additional explosion particles
        this.createExplosionParticles(x, y, color, effectType);
        
        setTimeout(() => {
            if (explosion.parentNode) {
                explosion.parentNode.removeChild(explosion);
            }
        }, 1000);
    }

    // Create type-specific explosion visuals
    createExplosionVisual(element, effectType, color) {
        switch (effectType) {
            case 'fire':
                element.style.cssText += `
                    background: radial-gradient(circle, #ffff00 0%, #ff6b00 30%, ${color} 60%, #8B0000 100%);
                    border-radius: 50%;
                    box-shadow: 0 0 30px #ff4500, 0 0 60px #ff0000;
                `;
                break;
            case 'water':
                element.style.cssText += `
                    background: radial-gradient(circle, #ffffff 0%, ${color} 30%, #4682B4 60%, #191970 100%);
                    border-radius: 50%;
                    box-shadow: 0 0 25px ${color}, 0 0 50px #4682B4;
                `;
                break;
            case 'electric':
                element.style.cssText += `
                    background: radial-gradient(circle, #ffffff 0%, #ffff00 20%, ${color} 50%, #4B0082 100%);
                    clip-path: polygon(50% 0%, 80% 20%, 100% 50%, 80% 80%, 50% 100%, 20% 80%, 0% 50%, 20% 20%);
                    box-shadow: 0 0 40px ${color}, 0 0 80px #ffff00;
                `;
                break;
            case 'ice':
                element.style.cssText += `
                    background: radial-gradient(circle, #ffffff 0%, ${color} 40%, #87CEEB 70%, #4682B4 100%);
                    clip-path: polygon(50% 0%, 75% 25%, 100% 50%, 75% 75%, 50% 100%, 25% 75%, 0% 50%, 25% 25%);
                    box-shadow: 0 0 35px ${color}, inset 0 0 20px rgba(255, 255, 255, 0.5);
                `;
                break;
            case 'rock':
                element.style.cssText += `
                    background: radial-gradient(circle, #D2B48C 0%, ${color} 40%, #8B7355 70%, #654321 100%);
                    border-radius: 20% 30% 40% 50%;
                    box-shadow: 0 0 20px rgba(0,0,0,0.7);
                `;
                break;
            case 'fairy':
                element.style.cssText += `
                    background: radial-gradient(circle, #ffffff 0%, ${color} 30%, #ff69b4 60%, #9370DB 100%);
                    border-radius: 50%;
                    box-shadow: 0 0 30px ${color}, 0 0 60px #ff69b4;
                `;
                break;
            default:
                element.style.cssText += `
                    background: radial-gradient(circle, #ffffff 0%, ${color} 40%, rgba(168, 168, 120, 0.8) 70%, transparent 100%);
                    border-radius: 50%;
                    box-shadow: 0 0 25px ${color};
                `;
        }
    }

    // Create explosion particles
    createExplosionParticles(x, y, color, effectType) {
        const particleCount = effectType === 'fire' ? 8 : 6;
        
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = `vfx-explosion-particle particle-${effectType}`;
            
            const angle = (360 / particleCount) * i;
            const distance = 40 + Math.random() * 30;
            const particleX = x + Math.cos(angle * Math.PI / 180) * distance;
            const particleY = y + Math.sin(angle * Math.PI / 180) * distance;
            
            particle.style.cssText = `
                position: absolute;
                left: ${x}px;
                top: ${y}px;
                width: 8px;
                height: 8px;
                background: ${color};
                border-radius: 50%;
                z-index: 1001;
                pointer-events: none;
                animation: explosion-particle 0.6s ease-out forwards;
                --particle-x: ${particleX - x}px;
                --particle-y: ${particleY - y}px;
            `;
            
            this.effectContainer.appendChild(particle);
            
            setTimeout(() => {
                if (particle.parentNode) {
                    particle.parentNode.removeChild(particle);
                }
            }, 700);
        }
    }

    // Create damage numbers with audio
    createDamageNumbers(damage, targetElement, isCritical = false, isHealing = false) {
        const targetRect = targetElement.getBoundingClientRect();
        
        // Get the battle screen container offset for proper positioning
        const battleScreen = document.querySelector('.battle-screen');
        const containerOffset = battleScreen ? battleScreen.getBoundingClientRect() : { left: 0, top: 0 };
        
        const damageText = document.createElement('div');
        
        // Play appropriate hit sound
        battleAudio.playHitSound(damage, isCritical, isHealing);
        
        damageText.className = `vfx-damage-text ${isCritical ? 'critical' : ''} ${isHealing ? 'healing' : ''}`;
        damageText.textContent = isHealing ? `+${damage}` : `-${damage}`;
        
        // Calculate position relative to VFX container
        const x = targetRect.left - containerOffset.left + targetRect.width / 2;
        const y = targetRect.top - containerOffset.top;
        
        damageText.style.cssText = `
            position: absolute;
            left: ${x}px;
            top: ${y}px;
            transform: translate(-50%, -100%);
            font-family: 'Press Start 2P', monospace;
            font-size: ${isCritical ? '2rem' : '1.5rem'};
            font-weight: bold;
            color: ${isHealing ? '#4CAF50' : isCritical ? '#FF5722' : '#F44336'};
            text-shadow: 2px 2px 0 ${isHealing ? '#2E7D32' : '#B71C1C'};
            z-index: 1003;
            pointer-events: none;
            animation: damage-float 1.5s ease-out forwards;
        `;
        
        this.effectContainer.appendChild(damageText);
        
        setTimeout(() => {
            if (damageText.parentNode) {
                damageText.parentNode.removeChild(damageText);
            }
        }, 1600);
    }

    // Animate attacker
    async animateAttacker(attackerElement, category) {
        attackerElement.style.transition = 'transform 0.3s ease';
        
        if (category === 'Physical') {
            // Lunge forward
            attackerElement.style.transform = 'translateX(30px) scale(1.1)';
            await this.wait(200);
            attackerElement.style.transform = 'translateX(0) scale(1)';
        } else {
            // Glow and pulse for special attacks
            attackerElement.style.filter = 'brightness(1.5) saturate(1.5)';
            attackerElement.style.transform = 'scale(1.1)';
            await this.wait(300);
            attackerElement.style.filter = 'brightness(1) saturate(1)';
            attackerElement.style.transform = 'scale(1)';
        }
    }

    // Animate target when hit
    async animateTarget(targetElement, category) {
        targetElement.style.transition = 'all 0.2s ease';
        
        // Flash red
        targetElement.style.filter = 'sepia(1) hue-rotate(315deg) saturate(3)';
        
        // Shake
        const shakeKeyframes = [
            { transform: 'translateX(0)' },
            { transform: 'translateX(-10px)' },
            { transform: 'translateX(10px)' },
            { transform: 'translateX(-5px)' },
            { transform: 'translateX(5px)' },
            { transform: 'translateX(0)' }
        ];
        
        targetElement.animate(shakeKeyframes, {
            duration: 400,
            easing: 'ease-in-out'
        });
        
        await this.wait(200);
        targetElement.style.filter = 'none';
    }

    // Screen shake effect
    async screenShake(intensity = 'medium') {
        const battleField = document.querySelector('.battle-field');
        if (!battleField) return;
        
        const shakeAmount = intensity === 'strong' ? 15 : intensity === 'medium' ? 10 : 5;
        
        const shakeKeyframes = [
            { transform: 'translate(0, 0)' },
            { transform: `translate(${shakeAmount}px, ${shakeAmount}px)` },
            { transform: `translate(-${shakeAmount}px, -${shakeAmount}px)` },
            { transform: `translate(${shakeAmount}px, -${shakeAmount}px)` },
            { transform: `translate(-${shakeAmount}px, ${shakeAmount}px)` },
            { transform: 'translate(0, 0)' }
        ];
        
        battleField.animate(shakeKeyframes, {
            duration: 500,
            easing: 'ease-in-out'
        });
        
        return this.wait(500);
    }

    // Screen flash effect
    createScreenFlash(color, opacity = 0.3) {
        const flash = document.createElement('div');
        flash.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: ${color};
            opacity: ${opacity};
            z-index: 1004;
            animation: screen-flash 0.4s ease-out forwards;
        `;
        
        document.body.appendChild(flash);
        
        setTimeout(() => {
            if (flash.parentNode) {
                flash.parentNode.removeChild(flash);
            }
        }, 500);
    }

    // Lightning effect
    createLightning(startRect, endRect) {
        const startPos = this.getRelativePosition(startRect);
        
        const lightning = document.createElement('div');
        lightning.className = 'vfx-lightning';
        lightning.innerHTML = '⚡';
        lightning.style.cssText = `
            position: absolute;
            left: ${startPos.centerX}px;
            top: ${startPos.y - 50}px;
            font-size: 4rem;
            color: #F8D030;
            filter: drop-shadow(0 0 20px #F8D030);
            z-index: 1002;
            pointer-events: none;
            transform: translate(-50%, -50%);
            animation: lightning-strike 0.6s ease-out forwards;
        `;
        
        this.effectContainer.appendChild(lightning);
        
        setTimeout(() => {
            if (lightning.parentNode) {
                lightning.parentNode.removeChild(lightning);
            }
        }, 800);
    }

    // Sparkle trail effect
    createSparkleTrail(startRect, endRect, color) {
        const startPos = this.getRelativePosition(startRect);
        const endPos = this.getRelativePosition(endRect);
        const sparkleCount = 8;
        
        for (let i = 0; i < sparkleCount; i++) {
            setTimeout(() => {
                const sparkle = document.createElement('div');
                sparkle.innerHTML = '✨';
                
                const x = startPos.centerX + (endPos.centerX - startPos.centerX) * (i / sparkleCount);
                const y = startPos.centerY + (endPos.centerY - startPos.centerY) * (i / sparkleCount);
                
                sparkle.style.cssText = `
                    position: absolute;
                    left: ${x}px;
                    top: ${y}px;
                    font-size: 1.5rem;
                    color: ${color};
                    filter: drop-shadow(0 0 10px ${color});
                    z-index: 1001;
                    pointer-events: none;
                    transform: translate(-50%, -50%);
                    animation: sparkle-fade 1s ease-out forwards;
                `;
                
                this.effectContainer.appendChild(sparkle);
                
                setTimeout(() => {
                    if (sparkle.parentNode) {
                        sparkle.parentNode.removeChild(sparkle);
                    }
                }, 1200);
            }, i * 100);
        }
    }

    // Utility: Wait function
    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Clean up all effects
    cleanup() {
        if (this.effectContainer) {
            this.effectContainer.innerHTML = '';
        }
        this.activeEffects.clear();
    }

    // Create ripple effect
    createRipple(targetRect, color) {
        const pos = this.getRelativePosition(targetRect);
        
        const ripple = document.createElement('div');
        ripple.className = 'vfx-ripple';
        ripple.style.cssText = `
            position: absolute;
            left: ${pos.centerX}px;
            top: ${pos.centerY}px;
            border: 2px solid ${color};
            border-radius: 50%;
            z-index: 1001;
            pointer-events: none;
            transform: translate(-50%, -50%);
            animation: ripple-expand 1s ease-out forwards;
        `;
        
        this.effectContainer.appendChild(ripple);
        
        setTimeout(() => {
            if (ripple.parentNode) {
                ripple.parentNode.removeChild(ripple);
            }
        }, 1200);
    }

    // Create ice crystals effect
    createIceCrystals(userRect, targetRect) {
        const userPos = this.getRelativePosition(userRect);
        const crystalCount = 5;
        
        for (let i = 0; i < crystalCount; i++) {
            setTimeout(() => {
                const crystal = document.createElement('div');
                crystal.className = 'vfx-ice-crystal';
                crystal.innerHTML = '❄️';
                crystal.style.cssText = `
                    position: absolute;
                    left: ${userPos.centerX + (Math.random() - 0.5) * 100}px;
                    top: ${userPos.centerY + (Math.random() - 0.5) * 100}px;
                    font-size: 1.5rem;
                    color: #98D8D8;
                    filter: drop-shadow(0 0 10px #98D8D8);
                    z-index: 1001;
                    pointer-events: none;
                    transform: translate(-50%, -50%);
                    animation: ice-form 1.2s ease-out forwards;
                `;
                
                this.effectContainer.appendChild(crystal);
                
                setTimeout(() => {
                    if (crystal.parentNode) {
                        crystal.parentNode.removeChild(crystal);
                    }
                }, 1500);
            }, i * 200);
        }
    }

    // Create growth effect
    createGrowthEffect(targetRect, color) {
        const pos = this.getRelativePosition(targetRect);
        
        const growth = document.createElement('div');
        growth.className = 'vfx-growth';
        growth.innerHTML = '🌱🌿🌳';
        growth.style.cssText = `
            position: absolute;
            left: ${pos.centerX}px;
            top: ${pos.centerY + 50}px;
            font-size: 1.5rem;
            color: ${color};
            filter: drop-shadow(0 0 15px ${color});
            z-index: 1001;
            pointer-events: none;
            transform: translate(-50%, 0) scale(0);
            animation: nature-growth 1.5s ease-out forwards;
        `;
        
        this.effectContainer.appendChild(growth);
        
        setTimeout(() => {
            if (growth.parentNode) {
                growth.parentNode.removeChild(growth);
            }
        }, 1800);
    }

    // Create impact wave effect
    createImpactWave(targetRect, color) {
        const pos = this.getRelativePosition(targetRect);
        
        const wave = document.createElement('div');
        wave.className = 'vfx-impact-wave';
        wave.style.cssText = `
            position: absolute;
            left: ${pos.centerX}px;
            top: ${pos.centerY}px;
            border: 3px solid ${color};
            border-radius: 50%;
            z-index: 1001;
            pointer-events: none;
            transform: translate(-50%, -50%);
            animation: impact-wave 0.8s ease-out forwards;
        `;
        
        this.effectContainer.appendChild(wave);
        
        setTimeout(() => {
            if (wave.parentNode) {
                wave.parentNode.removeChild(wave);
            }
        }, 1000);
    }

    // Play custom move VFX based on move configuration
    async playCustomMoveVFX(vfxConfig, userRect, targetRect) {
        // userRect and targetRect are already the getBoundingClientRect() results
        // passed from the calling function, so we don't need to call getBoundingClientRect() again
        
        switch (vfxConfig.type) {
            case 'multi_hit_combo':
                return this.createMultiHitCombo(vfxConfig, userRect, targetRect);
            case 'water_blast':
                return this.createWaterBlast(vfxConfig, userRect, targetRect);
            case 'stone_eruption':
                return this.createStoneEruption(vfxConfig, userRect, targetRect);
            case 'fairy_breeze':
                return this.createFairyBreeze(vfxConfig, userRect, targetRect);
            default:
                // Fall back to enhanced generic effect with custom config
                return this.createEnhancedGenericEffect(vfxConfig, userRect, targetRect);
        }
    }

    // Multi-hit combo effect for moves like Rapid Strike
    async createMultiHitCombo(vfxConfig, userRect, targetRect) {
        const hits = 3; // Default number of visual hits
        
        // Convert emoji projectile to type name if needed
        const projectileType = this.convertEmojiToType(vfxConfig.projectile) || 'generic';
        
        for (let i = 0; i < hits; i++) {
            // Create projectile for each hit
            setTimeout(() => {
                this.createProjectile(projectileType, vfxConfig.color, userRect, targetRect, 0);
                
                // Impact effect slightly offset
                setTimeout(() => {
                    this.createComboBurst(targetRect, vfxConfig.color, projectileType);
                }, 200);
            }, i * 150);
        }
        
        return this.wait(hits * 150 + 500);
    }

    // Enhanced water blast effect
    async createWaterBlast(vfxConfig, userRect, targetRect) {
        // Convert emoji projectile to type name if needed
        const projectileType = this.convertEmojiToType(vfxConfig.projectile) || 'water';
        
        // Large water projectile
        const projectile = this.createProjectile(projectileType, vfxConfig.color, userRect, targetRect);
        
        // Additional water particles
        if (vfxConfig.particles) {
            for (let i = 0; i < 3; i++) {
                setTimeout(() => {
                    // Convert emoji particles to water type
                    this.createProjectile('water', vfxConfig.color, userRect, targetRect, 50 * i);
                }, i * 100);
            }
        }
        
        // Water explosion on impact
        setTimeout(() => {
            this.createWaterExplosion(targetRect, vfxConfig.color, 3);
            this.createRipple(targetRect, vfxConfig.color);
        }, 600);
        
        return this.wait(1200);
    }

    // Helper function to convert emojis to VFX types
    convertEmojiToType(emoji) {
        const emojiMap = {
            '💧': 'water',
            '🌊': 'water', 
            '💦': 'water',
            '🔥': 'fire',
            '💥': 'fire',
            '🌋': 'fire',
            '⚡': 'electric',
            '🍃': 'grass',
            '❄️': 'ice',
            '🪨': 'rock',
            '⛰️': 'rock',
            '✨': 'fairy',
            '🌟': 'fairy',
            '💫': 'fairy'
        };
        
        return emojiMap[emoji] || null;
    }

    // Stone eruption effect for Ground-type moves
    async createStoneEruption(vfxConfig, userRect, targetRect) {
        // Earthquake screen shake
        if (vfxConfig.screenShake !== false) {
            this.screenShake(vfxConfig.screenShakeIntensity || 'strong');
        }
        
        // Screen shake for earthquake effect
        this.screenShake('very_strong');
        
        // Rock shatter impact
        setTimeout(() => {
            this.createRockShatter(targetRect, vfxConfig.color, 6);
        }, 400);
        
        return this.wait(1000);
    }

    // Fairy breeze effect
    async createFairyBreeze(vfxConfig, userRect, targetRect) {
        // Sparkle trail from user to target
        if (vfxConfig.trail) {
            this.createSparkleTrail(userRect, targetRect, vfxConfig.color);
        }
        
        // Multiple fairy particles
        const particleCount = vfxConfig.particleCount || 3;
        for (let i = 0; i < particleCount; i++) {
            setTimeout(() => {
                this.createProjectile('fairy', vfxConfig.color, userRect, targetRect, 100 * i);
            }, i * 100);
        }
        
        // Sparkle burst on impact
        setTimeout(() => {
            this.createExplosion(targetRect, vfxConfig.color, 'fairy');
        }, 500);
        
        return this.wait(1000);
    }

    // Enhanced generic effect using custom configuration
    async createEnhancedGenericEffect(vfxConfig, userRect, targetRect) {
        // Create projectile with custom settings
        this.createProjectile(vfxConfig.projectileType || 'generic', vfxConfig.color, userRect, targetRect);
        
        // Custom impact effect
        setTimeout(() => {
            if (vfxConfig.impactEffect === 'explosion') {
                this.createExplosion(targetRect, vfxConfig.color, vfxConfig.explosionType || 'burst');
            } else {
                this.createImpactWave(targetRect, vfxConfig.color);
            }
        }, 600);
        
        return this.wait(800);
    }

    // Helper methods for new VFX effects
    createComboBurst(targetRect, color, type = 'combo') {
        const pos = this.getRelativePosition(targetRect);
        
        const element = document.createElement('div');
        element.className = `vfx-combo-burst burst-${type}`;
        
        // Create visual burst based on type
        element.style.cssText = `
            position: absolute;
            left: ${pos.centerX}px;
            top: ${pos.centerY}px;
            width: 40px;
            height: 40px;
            background: radial-gradient(circle, ${color} 0%, rgba(255, 255, 0, 0.8) 50%, transparent 100%);
            border-radius: 50%;
            z-index: 1002;
            pointer-events: none;
            transform: translate(-50%, -50%);
            animation: combo-burst 0.4s ease-out forwards;
            box-shadow: 0 0 20px ${color};
        `;
        
        this.effectContainer.appendChild(element);
        setTimeout(() => element.remove(), 400);
    }

    createWaterExplosion(targetRect, color, count = 3) {
        for (let i = 0; i < count; i++) {
            setTimeout(() => {
                this.createExplosion(targetRect, color, 'water');
            }, i * 100);
        }
    }

    createRockShatter(targetRect, color, particleCount = 6) {
        const pos = this.getRelativePosition(targetRect);
        
        for (let i = 0; i < particleCount; i++) {
            const element = document.createElement('div');
            element.className = 'vfx-rock-shatter';
            element.style.cssText = `
                position: absolute;
                left: ${pos.centerX + (Math.random() - 0.5) * 100}px;
                top: ${pos.centerY + (Math.random() - 0.5) * 100}px;
                width: 12px;
                height: 12px;
                background: linear-gradient(135deg, ${color} 0%, #8B7355 50%, #654321 100%);
                clip-path: polygon(20% 0%, 80% 0%, 100% 20%, 100% 80%, 80% 100%, 20% 100%, 0% 80%, 0% 20%);
                z-index: 1002;
                pointer-events: none;
                transform: translate(-50%, -50%);
                animation: rock-shatter 0.6s ease-out forwards;
                box-shadow: 0 0 8px rgba(0,0,0,0.5);
            `;
            
            this.effectContainer.appendChild(element);
            setTimeout(() => element.remove(), 600);
        }
    }

    // Helper function to get coordinates relative to VFX container
    getRelativePosition(rectOrElement) {
        const battleScreen = document.querySelector('.battle-screen');
        const containerOffset = battleScreen ? battleScreen.getBoundingClientRect() : { left: 0, top: 0 };
        
        // Handle both DOM elements and rect objects
        let rect;
        if (rectOrElement && typeof rectOrElement.getBoundingClientRect === 'function') {
            // It's a DOM element
            rect = rectOrElement.getBoundingClientRect();
        } else if (rectOrElement && typeof rectOrElement.left === 'number') {
            // It's already a rect object
            rect = rectOrElement;
        } else {
            // Fallback rect
            console.warn('⚠️ Invalid rect/element passed to getRelativePosition:', rectOrElement);
            rect = { left: 100, top: 200, width: 100, height: 100 };
        }
        
        // Ensure rect properties are valid numbers
        const left = isNaN(rect.left) ? 100 : rect.left;
        const top = isNaN(rect.top) ? 200 : rect.top;
        const width = isNaN(rect.width) ? 100 : rect.width;
        const height = isNaN(rect.height) ? 100 : rect.height;
        
        const result = {
            x: left - containerOffset.left + width / 2,
            y: top - containerOffset.top + height / 2,
            centerX: left - containerOffset.left + width / 2,
            centerY: top - containerOffset.top + height / 2
        };
        
        console.log('🔍 getRelativePosition debug:', {
            inputType: typeof rectOrElement,
            inputRect: rectOrElement,
            processedRect: { left, top, width, height },
            containerOffset,
            result
        });
        
        return result;
    }

    // Create sparks effect
    createSparks(targetRect, color) {
        const pos = this.getRelativePosition(targetRect);
        const sparkCount = 8;
        
        for (let i = 0; i < sparkCount; i++) {
            setTimeout(() => {
                const spark = document.createElement('div');
                spark.className = 'vfx-sparks';
                spark.style.cssText = `
                    position: absolute;
                    left: ${pos.centerX}px;
                    top: ${pos.centerY}px;
                    width: 6px;
                    height: 6px;
                    background: ${color};
                    border-radius: 50%;
                    z-index: 1001;
                    pointer-events: none;
                    transform: translate(-50%, -50%);
                    animation: sparks-scatter 0.8s ease-out forwards;
                    box-shadow: 0 0 8px ${color};
                `;
                
                // Random spark direction
                const angle = Math.random() * 360;
                const distance = 30 + Math.random() * 25;
                spark.style.setProperty('--spark-x', `${Math.cos(angle * Math.PI / 180) * distance}px`);
                spark.style.setProperty('--spark-y', `${Math.sin(angle * Math.PI / 180) * distance}px`);
                
                this.effectContainer.appendChild(spark);
                
                setTimeout(() => {
                    if (spark.parentNode) {
                        spark.parentNode.removeChild(spark);
                    }
                }, 1000);
            }, i * 50);
        }
    }

    createGroundEruption(targetRect, color, particleCount = 3) {
        const pos = this.getRelativePosition(targetRect);
        
        for (let i = 0; i < particleCount; i++) {
            const element = document.createElement('div');
            element.className = 'vfx-ground-eruption';
            element.style.cssText = `
                position: absolute;
                left: ${pos.centerX + (i - 1) * 30}px;
                top: ${pos.centerY + 50}px;
                width: 20px;
                height: 30px;
                background: linear-gradient(135deg, ${color} 0%, #8B7355 50%, #654321 100%);
                clip-path: polygon(20% 100%, 80% 100%, 100% 0%, 0% 0%);
                z-index: 1002;
                pointer-events: none;
                transform: translate(-50%, -50%);
                animation: ground-eruption 0.8s ease-out forwards;
                box-shadow: 0 0 15px rgba(0,0,0,0.5);
            `;
            
            this.effectContainer.appendChild(element);
            setTimeout(() => element.remove(), 800);
        }
    }
}

// Export singleton instance
export const battleVFX = new BattleVFX(); 