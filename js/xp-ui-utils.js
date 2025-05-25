// XP UI Utilities - Helper functions for creating XP progress bars and displays

// Create an XP progress bar element
export function createXPProgressBar(monster, gameEngine, size = 'normal') {
    if (!gameEngine?.xpManager || !monster) return null;
    
    const xpData = gameEngine.xpManager.getXPBarData(monster);
    
    const container = document.createElement('div');
    container.className = `xp-progress-container ${size === 'mini' ? 'xp-mini' : ''}`;
    
    // Level badge
    const levelBadge = document.createElement('div');
    levelBadge.className = `xp-level-badge ${xpData.isMaxLevel ? 'max-level' : ''}`;
    levelBadge.textContent = `L${xpData.level}`;
    
    // Progress bar
    const progressBar = document.createElement('div');
    progressBar.className = 'xp-progress-bar';
    
    const progressFill = document.createElement('div');
    progressFill.className = 'xp-progress-fill';
    progressFill.style.width = `${xpData.progress * 100}%`;
    
    progressBar.appendChild(progressFill);
    
    // Info text
    const infoText = document.createElement('div');
    infoText.className = 'xp-info-text';
    
    if (xpData.isMaxLevel) {
        infoText.textContent = 'MAX';
    } else {
        infoText.textContent = `${gameEngine.xpManager.formatXP(xpData.xpToNext)}`;
    }
    
    // Assemble container
    container.appendChild(levelBadge);
    container.appendChild(progressBar);
    container.appendChild(infoText);
    
    // Add tooltip with detailed XP info
    container.title = xpData.isMaxLevel 
        ? `Level ${xpData.level} (MAX LEVEL)`
        : `Level ${xpData.level} - ${gameEngine.xpManager.formatXP(xpData.xpToNext)} XP to next level`;
    
    return container;
}

// Create detailed XP stats display
export function createXPStatsDisplay(monster, gameEngine) {
    if (!gameEngine?.xpManager || !monster) return null;
    
    const xpData = gameEngine.xpManager.getXPBarData(monster);
    
    const container = document.createElement('div');
    container.className = 'xp-stats';
    
    // Current XP
    const currentXPRow = document.createElement('div');
    currentXPRow.className = 'xp-stat-row';
    currentXPRow.innerHTML = `
        <span class="xp-stat-label">Current XP:</span>
        <span class="xp-stat-value">${gameEngine.xpManager.formatXP(xpData.currentXP)}</span>
    `;
    
    // Next Level XP
    if (!xpData.isMaxLevel) {
        const nextLevelRow = document.createElement('div');
        nextLevelRow.className = 'xp-stat-row';
        nextLevelRow.innerHTML = `
            <span class="xp-stat-label">Next Level:</span>
            <span class="xp-stat-value">${gameEngine.xpManager.formatXP(xpData.nextLevelXP)}</span>
        `;
        container.appendChild(nextLevelRow);
        
        // XP to Next Level
        const toNextRow = document.createElement('div');
        toNextRow.className = 'xp-stat-row';
        toNextRow.innerHTML = `
            <span class="xp-stat-label">To Next:</span>
            <span class="xp-stat-value">${gameEngine.xpManager.formatXP(xpData.xpToNext)}</span>
        `;
        container.appendChild(toNextRow);
    }
    
    container.appendChild(currentXPRow);
    
    return container;
}

// Show level up notification
export function showLevelUpNotification(monster, oldLevel, newLevel) {
    const notification = document.createElement('div');
    notification.className = 'level-up-notification';
    
    notification.innerHTML = `
        <h3>🎉 LEVEL UP! 🎉</h3>
        <div class="monster-name">${monster.name}</div>
        <div class="new-level">Level ${newLevel}!</div>
    `;
    
    document.body.appendChild(notification);
    
    // Remove after animation
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 3000);
}

// Show XP gain popup
export function showXPGainPopup(element, xpGain) {
    const popup = document.createElement('div');
    popup.className = 'xp-gain-popup';
    popup.textContent = `+${xpGain} XP`;
    
    // Position relative to the element
    const rect = element.getBoundingClientRect();
    popup.style.left = `${rect.left + rect.width / 2}px`;
    popup.style.top = `${rect.top}px`;
    
    document.body.appendChild(popup);
    
    // Remove after animation
    setTimeout(() => {
        if (popup.parentNode) {
            popup.parentNode.removeChild(popup);
        }
    }, 2000);
}

// Update XP progress bar with animation
export function updateXPProgressBar(progressBarElement, monster, gameEngine, animateLevel = false) {
    if (!gameEngine?.xpManager || !monster || !progressBarElement) return;
    
    const xpData = gameEngine.xpManager.getXPBarData(monster);
    
    const levelBadge = progressBarElement.querySelector('.xp-level-badge');
    const progressFill = progressBarElement.querySelector('.xp-progress-fill');
    const infoText = progressBarElement.querySelector('.xp-info-text');
    
    if (levelBadge) {
        levelBadge.textContent = `L${xpData.level}`;
        levelBadge.className = `xp-level-badge ${xpData.isMaxLevel ? 'max-level' : ''}`;
    }
    
    if (progressFill) {
        // Animate level up
        if (animateLevel) {
            progressFill.classList.add('level-up');
            setTimeout(() => progressFill.classList.remove('level-up'), 1000);
        }
        
        progressFill.style.width = `${xpData.progress * 100}%`;
    }
    
    if (infoText) {
        infoText.textContent = xpData.isMaxLevel 
            ? 'MAX'
            : gameEngine.xpManager.formatXP(xpData.xpToNext);
    }
    
    // Update tooltip
    progressBarElement.title = xpData.isMaxLevel 
        ? `Level ${xpData.level} (MAX LEVEL)`
        : `Level ${xpData.level} - ${gameEngine.xpManager.formatXP(xpData.xpToNext)} XP to next level`;
}

// Add XP display to monster card
export function addXPToMonsterCard(cardElement, monster, gameEngine) {
    if (!gameEngine?.xpManager || !monster || !cardElement) return;
    
    // Remove existing XP section
    const existingXP = cardElement.querySelector('.xp-section');
    if (existingXP) {
        existingXP.remove();
    }
    
    // Create XP section
    const xpSection = document.createElement('div');
    xpSection.className = 'xp-section';
    
    const xpProgressBar = createXPProgressBar(monster, gameEngine, 'normal');
    if (xpProgressBar) {
        xpSection.appendChild(xpProgressBar);
    }
    
    // Add to card
    cardElement.appendChild(xpSection);
    
    return xpSection;
}

// Add mini XP display to team slot
export function addXPToTeamSlot(slotElement, monster, gameEngine) {
    if (!gameEngine?.xpManager || !monster || !slotElement) return;
    
    // Remove existing XP section
    const existingXP = slotElement.querySelector('.xp-mini');
    if (existingXP) {
        existingXP.remove();
    }
    
    // Create mini XP display
    const xpMini = createXPProgressBar(monster, gameEngine, 'mini');
    if (xpMini) {
        xpMini.classList.add('xp-mini');
        slotElement.appendChild(xpMini);
    }
    
    return xpMini;
}

// Add XP display to battle monster info
export function addXPToBattleInfo(infoElement, monster, gameEngine) {
    if (!gameEngine?.xpManager || !monster || !infoElement) return;
    
    // Remove existing XP display
    const existingXP = infoElement.querySelector('.xp-display');
    if (existingXP) {
        existingXP.remove();
    }
    
    // Create XP display
    const xpDisplay = document.createElement('div');
    xpDisplay.className = 'xp-display';
    
    const xpProgressBar = createXPProgressBar(monster, gameEngine, 'battle');
    if (xpProgressBar) {
        xpDisplay.appendChild(xpProgressBar);
    }
    
    // Add to info element
    infoElement.appendChild(xpDisplay);
    
    return xpDisplay;
}

// Refresh all XP displays on the page
export function refreshAllXPDisplays(gameEngine) {
    if (!gameEngine?.xpManager) return;
    
    // Find all XP progress bars
    const xpBars = document.querySelectorAll('.xp-progress-container');
    
    xpBars.forEach(bar => {
        const monsterElement = bar.closest('[data-monster-name]');
        if (monsterElement) {
            const monsterName = monsterElement.dataset.monsterName;
            // Find monster in user team
            const monster = gameEngine.userTeam.find(m => m.name === monsterName);
            if (monster) {
                updateXPProgressBar(bar, monster, gameEngine);
            }
        }
    });
}

// Get XP color based on progress
export function getXPColor(progress) {
    if (progress >= 0.8) return '#4CAF50'; // Green
    if (progress >= 0.6) return '#FFC107'; // Amber
    if (progress >= 0.4) return '#FF9800'; // Orange
    if (progress >= 0.2) return '#FF5722'; // Deep Orange
    return '#F44336'; // Red
}

// Format level with ordinal suffix
export function formatLevel(level) {
    const lastDigit = level % 10;
    const lastTwoDigits = level % 100;
    
    if (lastTwoDigits >= 11 && lastTwoDigits <= 13) {
        return `${level}th`;
    }
    
    switch (lastDigit) {
        case 1: return `${level}st`;
        case 2: return `${level}nd`;
        case 3: return `${level}rd`;
        default: return `${level}th`;
    }
} 