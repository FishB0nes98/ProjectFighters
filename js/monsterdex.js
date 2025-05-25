/**
 * MonsterDex - Dynamic Monster Encyclopedia
 * Features: Search, Filter, Sort, Detailed Views, Responsive Design
 */

class MonsterDex {
    constructor() {
        this.monsters = [];
        this.filteredMonsters = [];
        this.currentView = 'grid';
        this.searchTerm = '';
        this.typeFilter = '';
        this.sortBy = 'id';
        this.isLoading = false;
        
        this.init();
    }
    
    async init() {
        this.setupEventListeners();
        await this.loadMonsters();
        this.updateStats();
        this.populateTypeFilter();
        this.renderMonsters();
        this.hideLoading();
    }
    
    setupEventListeners() {
        // Search functionality
        const searchInput = document.getElementById('monster-search');
        const clearSearch = document.getElementById('clear-search');
        
        searchInput?.addEventListener('input', (e) => {
            this.searchTerm = e.target.value.toLowerCase();
            this.filterAndSort();
        });
        
        clearSearch?.addEventListener('click', () => {
            searchInput.value = '';
            this.searchTerm = '';
            this.filterAndSort();
        });
        
        // Filter functionality
        const typeFilter = document.getElementById('type-filter');
        const sortFilter = document.getElementById('sort-filter');
        
        typeFilter?.addEventListener('change', (e) => {
            this.typeFilter = e.target.value;
            this.filterAndSort();
        });
        
        sortFilter?.addEventListener('change', (e) => {
            this.sortBy = e.target.value;
            this.filterAndSort();
        });
        
        // View toggle
        const viewButtons = document.querySelectorAll('.view-btn');
        viewButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const view = e.target.closest('.view-btn').dataset.view;
                this.switchView(view);
            });
        });
        
        // Modal functionality
        const modal = document.getElementById('monster-modal');
        const closeModal = document.getElementById('close-modal');
        
        closeModal?.addEventListener('click', () => this.closeModal());
        modal?.addEventListener('click', (e) => {
            if (e.target === modal) this.closeModal();
        });
        
        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.closeModal();
        });
        
        // Responsive search clear button
        searchInput?.addEventListener('input', (e) => {
            const clearBtn = document.getElementById('clear-search');
            if (clearBtn) {
                clearBtn.style.display = e.target.value ? 'block' : 'none';
            }
        });
    }
    
    async loadMonsters() {
        this.showLoading();
        
        try {
            // Get all monster JSON files from the Monsters directory
            const monsterFiles = [
                'Nerephal.json', 'Crymora.json', 'Blobby.json', 'Smouldimp.json',
                'Sharx.json', 'Maquatic.json', 'Buzzy.json', 'Crisilla.json',
                'Puffsqueak.json', 'Lumillow.json', 'Shiverion.json', 'Peepuff.json',
                'Nymaria.json', 'Scorchlete.json', 'Ratastrophe.json', 'Mizuryon.json',
                'Hauntorch.json', 'Cryorose.json', 'Pechac.json', 'Bunburrow.json',
                // New monsters from images
                'Furnacron.json', 'Nivoxis.json', 'Noctivy.json',
                'Skarth.json', 'Frosmoth.json', 'Fulverice.json', 'Pyrochi.json',
                'Synthraze.json'
            ];
            
            const monsterPromises = monsterFiles.map(async (file) => {
                try {
                    const response = await fetch(`Monsters/${file}`);
                    if (!response.ok) throw new Error(`Failed to load ${file}`);
                    const monster = await response.json();
                    
                    // Add image path
                    monster.image = `Monsters/${monster.name}.png`;
                    
                    return monster;
                } catch (error) {
                    console.warn(`Could not load monster from ${file}:`, error);
                    return null;
                }
            });
            
            const loadedMonsters = await Promise.all(monsterPromises);
            this.monsters = loadedMonsters.filter(monster => monster !== null);
            
            // Sort by ID by default
            this.monsters.sort((a, b) => {
                const idA = parseInt(a.id);
                const idB = parseInt(b.id);
                return idA - idB;
            });
            
            this.filteredMonsters = [...this.monsters];
            
        } catch (error) {
            console.error('Error loading monsters:', error);
            this.showError('Failed to load monster data. Please try refreshing the page.');
        }
    }
    
    filterAndSort() {
        let filtered = [...this.monsters];
        
        // Apply search filter
        if (this.searchTerm) {
            filtered = filtered.filter(monster => {
                const searchableText = [
                    monster.name,
                    monster.description,
                    ...monster.types,
                    monster.ability.name,
                    monster.ability.description,
                    monster.habitat,
                    ...monster.moves.map(move => `${move.name} ${move.type} ${move.description}`)
                ].join(' ').toLowerCase();
                
                return searchableText.includes(this.searchTerm);
            });
        }
        
        // Apply type filter
        if (this.typeFilter) {
            filtered = filtered.filter(monster => 
                monster.types.some(type => type.toLowerCase() === this.typeFilter.toLowerCase())
            );
        }
        
        // Apply sorting
        filtered.sort((a, b) => {
            switch (this.sortBy) {
                case 'name':
                    return a.name.localeCompare(b.name);
                case 'name-desc':
                    return b.name.localeCompare(a.name);
                case 'type':
                    return a.types[0].localeCompare(b.types[0]);
                case 'hp':
                    return b.stats.hp - a.stats.hp;
                case 'attack':
                    return b.stats.attack - a.stats.attack;
                case 'speed':
                    return b.stats.speed - a.stats.speed;
                case 'price':
                    return b.price - a.price;
                case 'id':
                default:
                    return parseInt(a.id) - parseInt(b.id);
            }
        });
        
        this.filteredMonsters = filtered;
        this.renderMonsters();
    }
    
    renderMonsters() {
        const grid = document.getElementById('monsters-grid');
        const noResults = document.getElementById('no-results');
        
        if (!grid) return;
        
        if (this.filteredMonsters.length === 0) {
            grid.style.display = 'none';
            noResults.style.display = 'block';
            return;
        }
        
        grid.style.display = 'grid';
        noResults.style.display = 'none';
        
        grid.innerHTML = this.filteredMonsters.map(monster => 
            this.createMonsterCard(monster)
        ).join('');
        
        // Add click listeners to monster cards
        grid.querySelectorAll('.monster-card').forEach((card, index) => {
            card.addEventListener('click', () => {
                this.showMonsterDetail(this.filteredMonsters[index]);
            });
        });
    }
    
    createMonsterCard(monster) {
        const typeBadges = monster.types.map(type => 
            `<span class="type-badge type-${type.toLowerCase()}">${type}</span>`
        ).join('');
        
        const totalStats = Object.values(monster.stats).reduce((sum, stat) => sum + stat, 0);
        
        return `
            <div class="monster-card" data-monster-id="${monster.id}">
                <div class="monster-card-header">
                    <div class="monster-card-id">#${monster.id}</div>
                    <img src="${monster.image}" 
                         alt="${monster.name}" 
                         class="monster-card-image"
                         onerror="this.src='Monsters/placeholder.png'; this.onerror=null;">
                    <h3 class="monster-card-name">${monster.name}</h3>
                    <div class="monster-card-types">${typeBadges}</div>
                </div>
                <div class="monster-card-stats">
                    <div class="stats-row">
                        <div class="stat-item-small">
                            <div class="stat-name-small">HP</div>
                            <div class="stat-value-small">${monster.stats.hp}</div>
                        </div>
                        <div class="stat-item-small">
                            <div class="stat-name-small">ATK</div>
                            <div class="stat-value-small">${monster.stats.attack}</div>
                        </div>
                        <div class="stat-item-small">
                            <div class="stat-name-small">SPD</div>
                            <div class="stat-value-small">${monster.stats.speed}</div>
                        </div>
                    </div>
                    <div class="stats-row">
                        <div class="stat-item-small">
                            <div class="stat-name-small">Total</div>
                            <div class="stat-value-small">${totalStats}</div>
                        </div>
                        <div class="stat-item-small">
                            <div class="stat-name-small">Ability</div>
                            <div class="stat-value-small" style="font-size: 0.8rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${monster.ability ? monster.ability.name : 'None'}</div>
                        </div>
                    </div>
                    <div class="monster-price">${monster.price ? monster.price.toLocaleString() : '0'} Coins</div>
                </div>
            </div>
        `;
    }
    
    showMonsterDetail(monster) {
        const modal = document.getElementById('monster-modal');
        if (!modal) return;
        
        // Update modal content
        this.updateModalContent(monster);
        
        // Show modal with animation
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Animate stats bars
        setTimeout(() => this.animateStatBars(monster.stats), 300);
    }
    
    updateModalContent(monster) {
        // Basic info
        document.getElementById('modal-monster-image').src = monster.image;
        document.getElementById('modal-monster-image').alt = monster.name;
        document.getElementById('modal-monster-id').textContent = `#${monster.id}`;
        document.getElementById('modal-monster-name').textContent = monster.name;
        document.getElementById('modal-monster-description').textContent = monster.description;
        document.getElementById('modal-monster-height').textContent = monster.height;
        document.getElementById('modal-monster-weight').textContent = monster.weight;
        document.getElementById('modal-monster-price').textContent = `${monster.price ? monster.price.toLocaleString() : '0'} coins`;
        document.getElementById('modal-monster-habitat').textContent = monster.habitat;
        
        // Types
        const typesContainer = document.getElementById('modal-monster-types');
        typesContainer.innerHTML = monster.types.map(type => 
            `<span class="type-badge type-${type.toLowerCase()}">${type}</span>`
        ).join('');
        
        // Ability
        document.getElementById('modal-ability-name').textContent = monster.ability ? monster.ability.name : 'None';
        document.getElementById('modal-ability-description').textContent = monster.ability ? monster.ability.description : 'No ability available';
        
        // Stats
        const stats = monster.stats;
        const totalStats = Object.values(stats).reduce((sum, stat) => sum + stat, 0);
        
        document.getElementById('modal-hp-value').textContent = stats.hp;
        document.getElementById('modal-attack-value').textContent = stats.attack;
        document.getElementById('modal-defense-value').textContent = stats.defense;
        document.getElementById('modal-sp-attack-value').textContent = stats.specialAttack;
        document.getElementById('modal-sp-defense-value').textContent = stats.specialDefense;
        document.getElementById('modal-speed-value').textContent = stats.speed;
        document.getElementById('modal-total-stats').textContent = totalStats;
        
        // Moves
        const movesContainer = document.getElementById('modal-moves-container');
        movesContainer.innerHTML = monster.moves.map(move => {
            const moveTypeClass = `type-${move.type.toLowerCase()}`;
            return `
                <div class="move-card">
                    <div class="move-header">
                        <span class="move-name">${move.name}</span>
                        <span class="move-type type-badge ${moveTypeClass}">${move.type}</span>
                    </div>
                    <div class="move-stats">
                        <div class="move-stat">Power: <span>${move.power || 'N/A'}</span></div>
                        <div class="move-stat">Accuracy: <span>${move.accuracy}%</span></div>
                        <div class="move-stat">PP: <span>${move.pp}</span></div>
                        <div class="move-stat">Category: <span>${move.category}</span></div>
                    </div>
                    <div class="move-description">${move.description}</div>
                </div>
            `;
        }).join('');
    }
    
    animateStatBars(stats) {
        const maxStat = 255; // Typical max stat in monster games
        
        const statElements = [
            { element: document.getElementById('modal-hp-bar'), value: stats.hp },
            { element: document.getElementById('modal-attack-bar'), value: stats.attack },
            { element: document.getElementById('modal-defense-bar'), value: stats.defense },
            { element: document.getElementById('modal-sp-attack-bar'), value: stats.specialAttack },
            { element: document.getElementById('modal-sp-defense-bar'), value: stats.specialDefense },
            { element: document.getElementById('modal-speed-bar'), value: stats.speed }
        ];
        
        statElements.forEach(({ element, value }) => {
            if (element) {
                const percentage = Math.min((value / maxStat) * 100, 100);
                element.style.width = '0%';
                setTimeout(() => {
                    element.style.width = `${percentage}%`;
                }, 100);
            }
        });
    }
    
    closeModal() {
        const modal = document.getElementById('monster-modal');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    }
    
    switchView(view) {
        this.currentView = view;
        
        // Update button states
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === view);
        });
        
        // Update grid class
        const grid = document.getElementById('monsters-grid');
        if (grid) {
            grid.classList.toggle('list-view', view === 'list');
        }
    }
    
    updateStats() {
        const totalMonsters = this.monsters.length;
        const uniqueTypes = [...new Set(this.monsters.flatMap(monster => monster.types))].length;
        
        const totalMonstersEl = document.getElementById('total-monsters');
        const totalTypesEl = document.getElementById('total-types');
        
        if (totalMonstersEl) {
            this.animateNumber(totalMonstersEl, 0, totalMonsters, 1000);
        }
        
        if (totalTypesEl) {
            this.animateNumber(totalTypesEl, 0, uniqueTypes, 1000);
        }
    }
    
    populateTypeFilter() {
        const typeFilter = document.getElementById('type-filter');
        if (!typeFilter) return;
        
        const uniqueTypes = [...new Set(this.monsters.flatMap(monster => monster.types))]
            .sort((a, b) => a.localeCompare(b));
        
        typeFilter.innerHTML = '<option value="">All Types</option>' +
            uniqueTypes.map(type => `<option value="${type}">${type}</option>`).join('');
    }
    
    animateNumber(element, start, end, duration) {
        const startTime = performance.now();
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const currentNumber = Math.floor(start + (end - start) * this.easeOutCubic(progress));
            element.textContent = currentNumber;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        requestAnimationFrame(animate);
    }
    
    easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
    }
    
    showLoading() {
        this.isLoading = true;
        const spinner = document.getElementById('loading-spinner');
        const grid = document.getElementById('monsters-grid');
        
        if (spinner) spinner.style.display = 'block';
        if (grid) grid.style.display = 'none';
    }
    
    hideLoading() {
        this.isLoading = false;
        const spinner = document.getElementById('loading-spinner');
        const grid = document.getElementById('monsters-grid');
        
        if (spinner) spinner.style.display = 'none';
        if (grid) grid.style.display = 'grid';
    }
    
    showError(message) {
        const container = document.querySelector('.monsters-container');
        if (container) {
            container.innerHTML = `
                <div class="error-message" style="text-align: center; padding: 4rem 2rem;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: var(--error-color); margin-bottom: 1rem;"></i>
                    <h3 style="color: var(--text-secondary); margin-bottom: 0.5rem;">Error Loading MonsterDex</h3>
                    <p style="color: var(--text-muted);">${message}</p>
                    <button onclick="location.reload()" 
                            style="margin-top: 2rem; padding: 0.75rem 1.5rem; background: var(--accent-primary); 
                                   color: white; border: none; border-radius: var(--border-radius); cursor: pointer;">
                        Retry
                    </button>
                </div>
            `;
        }
    }
}

// Utility functions for enhanced functionality
class MonsterUtils {
    static getTypeEffectiveness(attackingType, defendingTypes) {
        // Type effectiveness chart (simplified)
        const effectiveness = {
            'Fire': { 'Grass': 2, 'Water': 0.5, 'Fire': 0.5 },
            'Water': { 'Fire': 2, 'Grass': 0.5, 'Water': 0.5 },
            'Grass': { 'Water': 2, 'Fire': 0.5, 'Grass': 0.5 },
            'Electric': { 'Water': 2, 'Flying': 2, 'Electric': 0.5, 'Ground': 0 },
            'Ground': { 'Electric': 2, 'Fire': 2, 'Flying': 0 },
            'Flying': { 'Grass': 2, 'Fighting': 2, 'Bug': 2, 'Electric': 0.5, 'Rock': 0.5 },
            'Fighting': { 'Normal': 2, 'Rock': 2, 'Steel': 2, 'Flying': 0.5, 'Psychic': 0.5, 'Fairy': 0.5 },
            'Poison': { 'Grass': 2, 'Fairy': 2, 'Poison': 0.5, 'Ground': 0.5, 'Rock': 0.5, 'Ghost': 0.5, 'Steel': 0 },
            'Bug': { 'Grass': 2, 'Psychic': 2, 'Dark': 2, 'Fighting': 0.5, 'Flying': 0.5, 'Poison': 0.5, 'Ghost': 0.5, 'Steel': 0.5, 'Fire': 0.5, 'Fairy': 0.5 },
            'Rock': { 'Flying': 2, 'Bug': 2, 'Fire': 2, 'Ice': 2, 'Fighting': 0.5, 'Ground': 0.5, 'Steel': 0.5 },
            'Ghost': { 'Ghost': 2, 'Psychic': 2, 'Normal': 0, 'Dark': 0.5 },
            'Steel': { 'Rock': 2, 'Ice': 2, 'Fairy': 2, 'Steel': 0.5, 'Fire': 0.5, 'Water': 0.5, 'Electric': 0.5 },
            'Psychic': { 'Fighting': 2, 'Poison': 2, 'Steel': 0.5, 'Psychic': 0.5, 'Dark': 0 },
            'Ice': { 'Flying': 2, 'Ground': 2, 'Grass': 2, 'Dragon': 2, 'Steel': 0.5, 'Fire': 0.5, 'Water': 0.5, 'Ice': 0.5 },
            'Dragon': { 'Dragon': 2, 'Steel': 0.5, 'Fairy': 0 },
            'Dark': { 'Fighting': 0.5, 'Dark': 0.5, 'Fairy': 0.5, 'Ghost': 2, 'Psychic': 2 },
            'Fairy': { 'Fighting': 2, 'Dragon': 2, 'Dark': 2, 'Poison': 0.5, 'Steel': 0.5, 'Fire': 0.5 }
        };
        
        let multiplier = 1;
        for (const defendingType of defendingTypes) {
            if (effectiveness[attackingType] && effectiveness[attackingType][defendingType] !== undefined) {
                multiplier *= effectiveness[attackingType][defendingType];
            }
        }
        
        return multiplier;
    }
    
    static calculateStatTotal(stats) {
        return Object.values(stats).reduce((sum, stat) => sum + stat, 0);
    }
    
    static getStatRating(statValue) {
        if (statValue >= 120) return 'Excellent';
        if (statValue >= 100) return 'Great';
        if (statValue >= 80) return 'Good';
        if (statValue >= 60) return 'Average';
        if (statValue >= 40) return 'Below Average';
        return 'Poor';
    }
    
    static formatCurrency(amount) {
        return new Intl.NumberFormat('en-US').format(amount);
    }
}

// Enhanced search functionality
class MonsterSearch {
    static fuzzySearch(needle, haystack, threshold = 0.6) {
        const distance = this.levenshteinDistance(needle.toLowerCase(), haystack.toLowerCase());
        const maxLength = Math.max(needle.length, haystack.length);
        const similarity = 1 - (distance / maxLength);
        return similarity >= threshold;
    }
    
    static levenshteinDistance(str1, str2) {
        const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
        
        for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
        for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
        
        for (let j = 1; j <= str2.length; j++) {
            for (let i = 1; i <= str1.length; i++) {
                const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
                matrix[j][i] = Math.min(
                    matrix[j][i - 1] + 1,
                    matrix[j - 1][i] + 1,
                    matrix[j - 1][i - 1] + indicator
                );
            }
        }
        
        return matrix[str2.length][str1.length];
    }
}

// Initialize MonsterDex when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.monsterDex = new MonsterDex();
});

// Export for potential use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MonsterDex, MonsterUtils, MonsterSearch };
} 