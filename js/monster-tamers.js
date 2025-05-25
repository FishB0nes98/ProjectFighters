// Monster Tamers Game Mode - Team Builder
import { ref, get, set, push, serverTimestamp } from 'https://www.gstatic.com/firebasejs/9.10.0/firebase-database.js';
import { moveRegistry } from '../Monsters/move_registry.js';
import { abilityRegistry } from '../Monsters/ability_registry.js';
import { createXPProgressBar, addXPToMonsterCard } from './xp-ui-utils.js';
import { XPManager } from './xp-manager.js';
import { xpSnackManager } from './xp-snack-manager.js';
import { BattleSystem } from '../Monsters/battle_system.js';

// Firebase reference will be accessed via window.firebaseDatabase
let userUID = null;

// Monster cache
let monstersCache = {};
let userMonstersCache = [];
let selectedTeam = [];
let currentFilters = {
  type: '',
  search: ''
};

// Helper functions for XP manager
function calculateStatsHelper(baseStats, level, ivs) {
  const stats = {};
  for (const [statName, baseStat] of Object.entries(baseStats)) {
    const iv = ivs[statName] || 0;
    stats[statName] = Math.floor(((2 * baseStat + iv) * level / 100) + 5);
  }
  return stats;
}

function calculateHPHelper(baseStat, level, iv) {
  return Math.floor(((2 * baseStat + iv) * level / 100) + level + 10);
}

// DOM Elements
// Initialization is driven by window.MonsterTamers.init() called from HTML.

// Initialize the Monster Tamers game mode - This is window.MonsterTamers.init
// It no longer accepts the database instance as a parameter.
function initializeMonsterTamers() {
  console.log('MonsterTamers module initialized.');
  
  // Initialize XP manager
  const gameEngine = { calculateStats: calculateStatsHelper, calculateHP: calculateHPHelper };
  xpManager = new XPManager(gameEngine);
  
  // The initial userUID will be set by loadUserMonsters when auth state changes
  userUID = window.firebaseAuth?.currentUser?.uid || null; 
  console.log('Initial userUID check in initializeMonsterTamers:', userUID);

  // Set up the UI functionality (HTML structure already exists)
  setupUIFunctionality();
  
  // Add global event listeners
  addEventListeners(); 

  // Fetch monster data (definitions) - This can happen independently of user data
  fetchMonsterData().then(() => {
    console.log('Monster definitions loading initiated.');
    // Update collection stats
    updateCollectionStats();
    
    // If definitions load before auth state changes, and no userUID is set yet,
    // trigger an initial render to show the 'no monsters' message or available definitions.
    if (!userUID) {
        renderMonsterList(); 
    }
  }).catch(error => {
    console.error("Failed to fetch monster definitions:", error);
    const monsterListElement = document.querySelector('.monster-collection');
    if (monsterListElement) {
        monsterListElement.innerHTML = '<p style="color:red;">Could not load monster data. Please refresh.</p>';
    }
  });
  
  // loadUserMonsters will be called separately by the HTML on auth state change.
}

// Set up UI functionality for the new design
function setupUIFunctionality() {
  console.log('Setting up UI functionality...');
  
  // Set up filter controls
  const typeFilter = document.getElementById('type-filter');
  const searchInput = document.getElementById('monster-search');
  const viewToggles = document.querySelectorAll('.view-toggle');
  const teamActions = document.querySelectorAll('.team-action');

  // Type filter
  if (typeFilter) {
    typeFilter.addEventListener('change', (e) => {
      currentFilters.type = e.target.value;
      renderMonsterList();
    });
  }

  // Search filter
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      currentFilters.search = e.target.value.toLowerCase();
      renderMonsterList();
    });
  }

  // View toggles
  viewToggles.forEach(toggle => {
    toggle.addEventListener('click', (e) => {
      viewToggles.forEach(t => t.classList.remove('active'));
      e.target.classList.add('active');
      
      const view = e.target.dataset.view;
      const monsterList = document.querySelector('.monster-list');
      if (monsterList) {
        monsterList.className = `monster-list view-${view}`;
      }
    });
  });

  // Team actions
  teamActions.forEach(action => {
    action.addEventListener('click', (e) => {
      const actionType = e.target.id;
      switch (actionType) {
        case 'save-team':
          saveTeamToFirebase();
          break;
        case 'load-team':
          loadTeamFromFirebase();
          break;
        case 'clear-team':
          clearTeam();
          break;
      }
    });
  });

  console.log('UI functionality set up complete.');
}

// Fetch monster data from JSON files
async function fetchMonsterData() {
  try {
    const monsterFiles = [
      "Pechac.json",
      "Bunburrow.json",
      "Cryorose.json",
      "Hauntorch.json",
      "Ratastrophe.json",
      "Mizuryon.json",
      "Scorchlete.json",
      "Nymaria.json",
      "Peepuff.json",
      "Shiverion.json",
      "Lumillow.json",
      "Puffsqueak.json",
      // Image-based monsters
      "Crisilla.json",
      "Buzzy.json",
      "Maquatic.json",
      "Sharx.json",
      "Smouldimp.json",
      "Blobby.json",
      "Crymora.json",
      "Nerephal.json",
      // New monsters from images
      
      "Furnacron.json",
      "Nivoxis.json",
      "Noctivy.json",
      "Skarth.json",
      "Frosmoth.json",
      "Fulverice.json",
      "Pyrochi.json",
      "Synthraze.json"
    ];
    
    monstersCache = {}; // Initialize or clear cache

    for (const file of monsterFiles) {
      try {
        const response = await fetch(`/Monsters/${file}`);
        if (response.ok) {
          const monsterData = await response.json();
          if (monsterData && monsterData.name) {
            monstersCache[monsterData.name.toLowerCase()] = monsterData; // Use name.toLowerCase() as key
          } else {
            console.warn(`Monster data in ${file} is missing a 'name' property or is invalid.`);
          }
        } else {
          console.warn(`Failed to fetch monster data for ${file}: ${response.status} ${response.statusText}`);
        }
      } catch (error) {
        console.error(`Error processing monster file ${file}:`, error);
      }
    }
    
    console.log('Monsters loaded into cache (keyed by name.toLowerCase()):', monstersCache);
    return monstersCache;
  } catch (error) {
    console.error('Outer error in fetchMonsterData:', error);
    return monstersCache; // Return whatever was successfully cached
  }
}

// Update XP Snack count display
async function updateXPSnackCount() {
  try {
    const count = await xpSnackManager.getXPSnackCount();
    const countElement = document.getElementById('xp-snack-count');
    if (countElement) {
      countElement.textContent = count;
    }
  } catch (error) {
    console.error('Error updating XP Snack count:', error);
  }
}

// Use XP Snack on a monster
async function useXPSnackOnMonster(monsterUid) {
  try {
    // Find the monster in the user's collection
    const userMonster = userMonstersCache.find(m => m.uid === monsterUid);
    if (!userMonster) {
      window.showToast('Monster not found!', 'error');
      return;
    }

    // Get the monster definition
    const monsterDef = monstersCache[userMonster.monsterId.toLowerCase()];
    if (!monsterDef) {
      window.showToast('Monster definition not found!', 'error');
      return;
    }

    // Create a complete monster object for the XP Snack manager
    const startingLevel = userMonster.level || 5; // Monsters start at level 5
    let experience = userMonster.experience || userMonster.xp || 0;
    
    // If monster has no XP but has a level > 1, calculate appropriate starting XP
    if (experience === 0 && startingLevel > 1) {
      // This will be handled by the XP snack manager, but we can pre-calculate here
      console.log(`🎯 Monster ${userMonster.monsterId} is Level ${startingLevel} with 0 XP - will be corrected`);
    }
    
    const completeMonster = {
      ...monsterDef,
      ...userMonster,
      baseStats: monsterDef.stats, // Keep original stats as baseStats
      stats: userMonster.stats || { ...monsterDef.stats }, // Current stats (copy to avoid mutation)
      experience: experience, // Handle XP migration
      level: startingLevel,
      maxHP: userMonster.maxHP || userMonster.stats?.hp || monsterDef.stats.hp,
      currentHP: userMonster.currentHP || userMonster.maxHP || userMonster.stats?.hp || monsterDef.stats.hp
    };

    // Use the XP Snack
    const result = await xpSnackManager.useXPSnack(completeMonster);

    if (result.success) {
      // Update the monster in the cache
      const monsterIndex = userMonstersCache.findIndex(m => m.uid === monsterUid);
      if (monsterIndex !== -1) {
        userMonstersCache[monsterIndex] = {
          ...userMonstersCache[monsterIndex],
          level: completeMonster.level || 1,
          experience: completeMonster.experience || 0,
          stats: completeMonster.stats || { ...monsterDef.stats },
          maxHP: completeMonster.maxHP || completeMonster.stats?.hp || monsterDef.stats.hp,
          currentHP: completeMonster.currentHP || completeMonster.maxHP || completeMonster.stats?.hp || monsterDef.stats.hp
        };
      }

      // Show success messages
      result.messages.forEach(message => {
        window.showToast(message, 'success', 2000);
      });

      // Update XP Snack count display
      await updateXPSnackCount();

      // Refresh the monster list to show updated stats
      renderMonsterList();

      // Close and reopen the modal to show updated stats
      closeMonsterDetail();
      setTimeout(() => {
        showMonsterDetail(monsterDef, userMonstersCache[monsterIndex]);
      }, 100);

    } else {
      window.showToast(result.error || 'Failed to use XP Snack', 'error');
    }

  } catch (error) {
    console.error('Error using XP Snack:', error);
    window.showToast('An error occurred while using XP Snack', 'error');
  }
}

// Update collection statistics
function updateCollectionStats() {
  const ownedCount = userMonstersCache.length;
  const totalCount = Object.keys(monstersCache).length;
  const completionPercent = totalCount > 0 ? Math.round((ownedCount / totalCount) * 100) : 0;

  const ownedElement = document.getElementById('owned-count');
  const totalElement = document.getElementById('total-count');
  const completionElement = document.getElementById('completion-percent');

  if (ownedElement) ownedElement.textContent = ownedCount;
  if (totalElement) totalElement.textContent = totalCount;
  if (completionElement) completionElement.textContent = `${completionPercent}%`;
}

// Renamed from fetchUserMonsters to fetchUserMonstersInternal
async function fetchUserMonstersInternal() {
  if (!userUID) {
    console.log('fetchUserMonstersInternal: No userUID, skipping fetch.');
    userMonstersCache = []; 
    return Promise.resolve([]);
  }
  const database = window.firebaseDatabase;
  
  if (!database) {
    console.error('Database (v9 instance) is not initialized in fetchUserMonstersInternal.');
    userMonstersCache = [];
    return Promise.reject(new Error("Database (v9 instance) not initialized for fetchUserMonstersInternal"));
  }
  console.log('Fetching user monsters for UID (internal, v9):', userUID);
  
  try {
    const userMonstersDbRef = ref(database, `users/${userUID}/monsters`);
    const snapshot = await get(userMonstersDbRef);
    const monstersData = snapshot.val() || {};
    
    userMonstersCache = Object.keys(monstersData).map(key => ({
      uid: key,
      ...monstersData[key]
    }));
    
    console.log('User monsters loaded (internal, v9):', userMonstersCache);
    
    // Update XP Snack count when user data is loaded
    updateXPSnackCount();
    
    return userMonstersCache;
  } catch (error) {
    console.error('Error fetching user monsters (internal, v9):', error);
    userMonstersCache = []; // Clear cache on error
    return Promise.reject(error);
  }
}

// Render the list of monsters
function renderMonsterList() {
  const collectionContainer = document.querySelector('.monster-collection');
  if (!collectionContainer) return;
  
  // Clear existing content
  collectionContainer.innerHTML = '';

  // Apply filters
  let filteredMonsters = userMonstersCache;
  
  if (currentFilters.type) {
    filteredMonsters = filteredMonsters.filter(userMonster => {
      const monsterData = monstersCache[userMonster.monsterId];
      return monsterData && monsterData.types.some(type => 
        type.toLowerCase() === currentFilters.type.toLowerCase()
      );
    });
  }

  if (currentFilters.search) {
    filteredMonsters = filteredMonsters.filter(userMonster => {
      const monsterData = monstersCache[userMonster.monsterId];
      return monsterData && monsterData.name.toLowerCase().includes(currentFilters.search);
    });
  }

  if (filteredMonsters.length > 0) {
    // Create monster list container
    const monsterList = document.createElement('div');
    monsterList.className = 'monster-list';
    
    // Render filtered monsters
    filteredMonsters.forEach(monster => {
      const monsterData = monstersCache[monster.monsterId]; // monster.monsterId should be like "pechac"
      if (monsterData) {
        renderMonsterCard(monsterList, monsterData, monster);
      } else {
        console.warn(`Monster definition not found in cache for owned monster ID: '${monster.monsterId}'. This monster will not be displayed. Check if its JSON was loaded and if the ID matches the cache key format.`);
      }
    });
    
    collectionContainer.appendChild(monsterList);
  } else if (userMonstersCache.length === 0) {
    // Display message if user has no monsters
    collectionContainer.innerHTML = `
      <div class="no-monsters-message">
        <h3>No Monsters Yet!</h3>
        <p>You don't have any monsters in your collection yet.</p>
        <p>Visit the <a href="StoreDemo2.html">Monster Shop</a> to buy your first monster.</p>
      </div>
    `;
  } else {
    // Display message if no monsters match filters
    collectionContainer.innerHTML = `
      <div class="no-monsters-message">
        <h3>No Matches Found</h3>
        <p>No monsters match your current filters.</p>
        <p>Try adjusting your search or filter criteria.</p>
      </div>
    `;
  }

  // Update collection stats
  updateCollectionStats();
}

// Render an individual monster card
function renderMonsterCard(container, monster, userMonster) {
  const monsterCard = document.createElement('div');
  monsterCard.className = 'monster-card';
  monsterCard.dataset.monsterId = monster.id;
  monsterCard.draggable = true; // Enable dragging
  
  // Use the monster's unique ID if available
  const uid = userMonster.uid;
  const uniqueId = userMonster.uniqueId || `unknown_${Math.random().toString(36).substring(2, 10)}`;
  monsterCard.dataset.uid = uid;
  
  // Use the monster name directly without cleaning - preserve original name
  const monsterName = monster.name;
  
  // Calculate total IV percentage (max is 31 per stat, 6 stats total = 186 max)
  const ivs = userMonster.ivs || {};
  const totalIVs = (ivs.hp || 0) + (ivs.attack || 0) + (ivs.defense || 0) + 
                  (ivs.specialAttack || 0) + (ivs.specialDefense || 0) + (ivs.speed || 0);
  const ivPercentage = Math.round((totalIVs / 186) * 100);
  
  // Determine IV quality classification
  let ivQuality = '';
  if (ivPercentage >= 90) ivQuality = 'amazing';
  else if (ivPercentage >= 80) ivQuality = 'great';
  else if (ivPercentage >= 70) ivQuality = 'good';
  else if (ivPercentage >= 50) ivQuality = 'average';
  else ivQuality = 'poor';
  
  monsterCard.innerHTML = `
    <div class="monster-card-header">
      <h3>${monsterName}</h3>
      <span class="monster-id">#${monster.id.padStart(3, '0')}</span>
    </div>
    <img src="/Monsters/${monster.name}.png" alt="${monsterName}" class="monster-image" 
         onerror="this.src='data:image/svg+xml,<svg xmlns=&quot;http://www.w3.org/2000/svg&quot; width=&quot;160&quot; height=&quot;160&quot;><rect width=&quot;100%&quot; height=&quot;100%&quot; fill=&quot;%23f0f0f0&quot;/><text x=&quot;50%&quot; y=&quot;50%&quot; text-anchor=&quot;middle&quot; dy=&quot;.3em&quot; fill=&quot;%23999&quot;>${monsterName}</text></svg>'">
    <div class="monster-info">
      <div class="monster-types">
        ${monster.types.map(type => `<span class="monster-type type-${type.toLowerCase()}">${type}</span>`).join('')}
      </div>
      <div class="monster-level">LVL ${userMonster.level || 5}</div>
      <div class="monster-stats">
        <div class="monster-stat">
          <span class="stat-name">HP</span>
          <span class="stat-value">${monster.stats.hp}</span>
          <span class="iv-value">IV: ${ivs.hp || 0}</span>
        </div>
        <div class="monster-stat">
          <span class="stat-name">ATK</span>
          <span class="stat-value">${monster.stats.attack}</span>
          <span class="iv-value">IV: ${ivs.attack || 0}</span>
        </div>
        <div class="monster-stat">
          <span class="stat-name">DEF</span>
          <span class="stat-value">${monster.stats.defense}</span>
          <span class="iv-value">IV: ${ivs.defense || 0}</span>
        </div>
        <div class="monster-stat">
          <span class="stat-name">SP.ATK</span>
          <span class="stat-value">${monster.stats.specialAttack}</span>
          <span class="iv-value">IV: ${ivs.specialAttack || 0}</span>
        </div>
        <div class="monster-stat">
          <span class="stat-name">SP.DEF</span>
          <span class="stat-value">${monster.stats.specialDefense}</span>
          <span class="iv-value">IV: ${ivs.specialDefense || 0}</span>
        </div>
        <div class="monster-stat">
          <span class="stat-name">SPEED</span>
          <span class="stat-value">${monster.stats.speed}</span>
          <span class="iv-value">IV: ${ivs.speed || 0}</span>
        </div>
      </div>
      <div class="monster-ivs ${ivQuality}">IVs: ${ivPercentage}% (${ivQuality.toUpperCase()})</div>
      <div class="monster-unique-id">ID: ${uniqueId}</div>
    </div>
  `;
  
  // Add XP display to monster card
  const gameEngine = { xpManager: xpManager };
  const monsterWithXP = { ...userMonster, level: userMonster.level || 5, xp: userMonster.xp || xpManager.getXPForLevel(userMonster.level || 5) };
  
  // Add XP progress bar after the card is created
  setTimeout(() => {
    addXPToMonsterCard(monsterCard, monsterWithXP, gameEngine);
  }, 0);
  
  // Add drag event listeners
  monsterCard.addEventListener('dragstart', (e) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({
      monsterId: monster.name.toLowerCase(),
      uid: uid
    }));
    e.dataTransfer.effectAllowed = 'move';
    monsterCard.classList.add('dragging');
  });
  
  monsterCard.addEventListener('dragend', () => {
    monsterCard.classList.remove('dragging');
  });
  
  // Add click listener to show monster details
  monsterCard.addEventListener('click', (e) => {
    // Don't show details if we're in the middle of a drag operation
    if (!monsterCard.classList.contains('dragging')) {
      showMonsterDetail(monster, userMonster);
    }
  });
  
  container.appendChild(monsterCard);
}

// Show detailed monster information
function showMonsterDetail(monster, userMonster) {
  const monsterName = monster.name;
  const modalOverlay = document.getElementById('monster-detail-modal');
  const modalContent = document.getElementById('monster-detail-content');
  
  if (!modalOverlay || !modalContent) {
    console.warn('Modal elements not found');
    return;
  }

  // Calculate total IV percentage
  const ivs = userMonster.ivs || {};
  const totalIVs = (ivs.hp || 0) + (ivs.attack || 0) + (ivs.defense || 0) + 
                  (ivs.specialAttack || 0) + (ivs.specialDefense || 0) + (ivs.speed || 0);
  const ivPercentage = Math.round((totalIVs / 186) * 100);
  
  // Determine IV quality classification
  let ivQuality = '';
  if (ivPercentage >= 90) ivQuality = 'amazing';
  else if (ivPercentage >= 80) ivQuality = 'great';
  else if (ivPercentage >= 70) ivQuality = 'good';
  else if (ivPercentage >= 50) ivQuality = 'average';
  else ivQuality = 'poor';

  // Create a battle system instance to calculate stats
  const battleSystem = new BattleSystem();
  
  // Create a complete monster object for stat calculation
  const completeMonster = {
    ...monster,
    ...userMonster,
    stats: monster.stats, // Base stats from monster definition
    level: userMonster.level || 5,
    ivs: ivs
  };

  // Calculate actual stats using battle system
  const actualStats = {
    hp: battleSystem.calculateBaseStat(completeMonster, "hp"),
    attack: battleSystem.calculateBaseStat(completeMonster, "attack"),
    defense: battleSystem.calculateBaseStat(completeMonster, "defense"),
    specialAttack: battleSystem.calculateBaseStat(completeMonster, "specialAttack"),
    specialDefense: battleSystem.calculateBaseStat(completeMonster, "specialDefense"),
    speed: battleSystem.calculateBaseStat(completeMonster, "speed")
  };

  // Find max stat for comparison bars
  const maxBaseStat = Math.max(...Object.values(monster.stats));
  const maxActualStat = Math.max(...Object.values(actualStats));
  const maxStat = Math.max(maxBaseStat, maxActualStat);
  
  modalContent.innerHTML = `
    <div class="detail-header">
      <img src="/Monsters/${monster.name}.png" alt="${monsterName}" class="detail-image" 
           onerror="this.src='data:image/svg+xml,<svg xmlns=&quot;http://www.w3.org/2000/svg&quot; width=&quot;200&quot; height=&quot;200&quot;><rect width=&quot;100%&quot; height=&quot;100%&quot; fill=&quot;%23f0f0f0&quot;/><text x=&quot;50%&quot; y=&quot;50%&quot; text-anchor=&quot;middle&quot; dy=&quot;.3em&quot; fill=&quot;%23999&quot;>${monsterName}</text></svg>'">
      <div class="detail-info">
        <h2>${monsterName} <span class="detail-id">#${monster.id.padStart(3, '0')}</span></h2>
        <p>${monster.description}</p>
        <div class="detail-types">
          ${monster.types.map(type => `<span class="monster-type type-${type.toLowerCase()}">${type}</span>`).join('')}
        </div>
        <div class="monster-physical-info">
          <span>Height: ${monster.height}</span> | <span>Weight: ${monster.weight}</span>
        </div>
        <div class="monster-level">Level: ${userMonster.level || 5}</div>
        <div class="monster-ivs ${ivQuality}">IVs: ${ivPercentage}% (${ivQuality.toUpperCase()})</div>
        <div class="monster-unique-id">Unique ID: ${userMonster.uniqueId || 'Unknown'}</div>
        
        <!-- Action Buttons -->
        <div class="monster-actions">
          <button class="action-btn add-to-team" onclick="window.MonsterTamers.addMonsterToTeam('${monster.name.toLowerCase()}', '${userMonster.uid}')">
            <i class="fas fa-plus"></i> Add to Team
          </button>
          <button class="action-btn use-xp-snack" onclick="window.MonsterTamers.useXPSnackOnMonster('${userMonster.uid}')">
            <i class="fas fa-cookie"></i> Use XP Snack
          </button>
          <button class="action-btn release-monster" onclick="if(confirm('Are you sure you want to release ${monsterName}? This cannot be undone!')) window.MonsterTamers.releaseMonsterFromCollection('${userMonster.uid}')">
            <i class="fas fa-dove"></i> Release
          </button>
        </div>
      </div>
    </div>

    <div class="stat-toggle">
      <span class="stat-toggle-label">Base Stats</span>
      <label class="stat-toggle-switch">
        <input type="checkbox" id="stat-toggle">
        <span class="stat-toggle-slider"></span>
      </label>
      <span class="stat-toggle-label">Actual Stats</span>
    </div>
    
    <div class="detail-stats">
      <div class="detail-stat">
        <span class="detail-stat-name">HP</span>
        <span class="detail-stat-value">${monster.stats.hp}</span>
        <span class="detail-stat-actual">
          ${actualStats.hp}
          <span class="stat-arrow">↑</span>
        </span>
        <div class="stat-comparison-bar">
          <div class="stat-comparison-base" style="width: ${(monster.stats.hp / maxStat) * 100}%"></div>
          <div class="stat-comparison-fill" style="width: ${(actualStats.hp / maxStat) * 100}%"></div>
        </div>
        <span class="detail-iv-value">IV: ${ivs.hp || 0}/31</span>
      </div>
      <div class="detail-stat">
        <span class="detail-stat-name">Attack</span>
        <span class="detail-stat-value">${monster.stats.attack}</span>
        <span class="detail-stat-actual">
          ${actualStats.attack}
          <span class="stat-arrow">↑</span>
        </span>
        <div class="stat-comparison-bar">
          <div class="stat-comparison-base" style="width: ${(monster.stats.attack / maxStat) * 100}%"></div>
          <div class="stat-comparison-fill" style="width: ${(actualStats.attack / maxStat) * 100}%"></div>
        </div>
        <span class="detail-iv-value">IV: ${ivs.attack || 0}/31</span>
      </div>
      <div class="detail-stat">
        <span class="detail-stat-name">Defense</span>
        <span class="detail-stat-value">${monster.stats.defense}</span>
        <span class="detail-stat-actual">
          ${actualStats.defense}
          <span class="stat-arrow">↑</span>
        </span>
        <div class="stat-comparison-bar">
          <div class="stat-comparison-base" style="width: ${(monster.stats.defense / maxStat) * 100}%"></div>
          <div class="stat-comparison-fill" style="width: ${(actualStats.defense / maxStat) * 100}%"></div>
        </div>
        <span class="detail-iv-value">IV: ${ivs.defense || 0}/31</span>
      </div>
      <div class="detail-stat">
        <span class="detail-stat-name">Sp. Attack</span>
        <span class="detail-stat-value">${monster.stats.specialAttack}</span>
        <span class="detail-stat-actual">
          ${actualStats.specialAttack}
          <span class="stat-arrow">↑</span>
        </span>
        <div class="stat-comparison-bar">
          <div class="stat-comparison-base" style="width: ${(monster.stats.specialAttack / maxStat) * 100}%"></div>
          <div class="stat-comparison-fill" style="width: ${(actualStats.specialAttack / maxStat) * 100}%"></div>
        </div>
        <span class="detail-iv-value">IV: ${ivs.specialAttack || 0}/31</span>
      </div>
      <div class="detail-stat">
        <span class="detail-stat-name">Sp. Defense</span>
        <span class="detail-stat-value">${monster.stats.specialDefense}</span>
        <span class="detail-stat-actual">
          ${actualStats.specialDefense}
          <span class="stat-arrow">↑</span>
        </span>
        <div class="stat-comparison-bar">
          <div class="stat-comparison-base" style="width: ${(monster.stats.specialDefense / maxStat) * 100}%"></div>
          <div class="stat-comparison-fill" style="width: ${(actualStats.specialDefense / maxStat) * 100}%"></div>
        </div>
        <span class="detail-iv-value">IV: ${ivs.specialDefense || 0}/31</span>
      </div>
      <div class="detail-stat">
        <span class="detail-stat-name">Speed</span>
        <span class="detail-stat-value">${monster.stats.speed}</span>
        <span class="detail-stat-actual">
          ${actualStats.speed}
          <span class="stat-arrow">↑</span>
        </span>
        <div class="stat-comparison-bar">
          <div class="stat-comparison-base" style="width: ${(monster.stats.speed / maxStat) * 100}%"></div>
          <div class="stat-comparison-fill" style="width: ${(actualStats.speed / maxStat) * 100}%"></div>
        </div>
        <span class="detail-iv-value">IV: ${ivs.speed || 0}/31</span>
      </div>
    </div>
    
    <div class="detail-abilities">
      <h3>Ability</h3>
      <div class="ability ${monster.ability.isPassive ? 'passive-ability' : ''}">
        <span class="ability-name">${monster.ability.name}</span>
        ${monster.ability.isPassive ? ' (Passive)' : ''}: ${monster.ability.description}
      </div>
    </div>
    
    <div class="detail-moves">
      <h3>Moves</h3>
      ${monster.moves.map(move => `
        <div class="move">
          <div class="move-header">
            <span class="move-name">${move.name}</span>
            <span class="move-type type-${move.type.toLowerCase()}">${move.type}</span>
          </div>
          <div class="move-info">
            <span>Power: ${move.power || '-'}</span> | 
            <span>Accuracy: ${move.accuracy || '-'}</span> | 
            <span>PP: ${move.pp}</span> | 
            <span>Category: ${move.category}</span>
          </div>
          <div class="move-description">${move.description}</div>
        </div>
      `).join('')}
    </div>
  `;

  // Add toggle functionality
  const statToggle = modalContent.querySelector('#stat-toggle');
  const detailStats = modalContent.querySelector('.detail-stats');
  
  statToggle.addEventListener('change', (e) => {
    if (e.target.checked) {
      detailStats.classList.add('show-actual-stats');
    } else {
      detailStats.classList.remove('show-actual-stats');
    }
  });

  // Show modal
  modalOverlay.style.display = 'flex';
}

// Close the monster detail view
function closeMonsterDetail() {
  // Try new modal first
  const modalOverlay = document.getElementById('monster-detail-modal');
  if (modalOverlay) {
    modalOverlay.style.display = 'none';
    return;
  }
  
  // Fallback to legacy structure
  const detailElement = document.querySelector('.monster-detail');
  if (detailElement) {
    detailElement.style.display = 'none';
  }
}

// Add monster to the selected team
function addMonsterToTeam(monsterId, uid) {
  // Count active team members (non-null entries)
  const activeTeamCount = selectedTeam.filter(member => member !== null && member !== undefined).length;
  
  if (activeTeamCount >= 6) {
    if (window.showToast) {
      window.showToast('Your team is already full! Remove a monster first.', 'warning');
    } else {
      alert('Your team is already full! Remove a monster first.');
    }
    return;
  }
  
  // Check if monster is already in team
  const isAlreadyInTeam = selectedTeam.some(monster => monster && monster.uid === uid);
  if (isAlreadyInTeam) {
    if (window.showToast) {
      window.showToast('This monster is already in your team!', 'warning');
    } else {
      alert('This monster is already in your team!');
    }
    return;
  }
  
  // Find the first empty slot
  let emptySlotIndex = -1;
  for (let i = 0; i < 6; i++) {
    if (!selectedTeam[i] || selectedTeam[i] === null) {
      emptySlotIndex = i;
      break;
    }
  }
  
  if (emptySlotIndex === -1) {
    if (window.showToast) {
      window.showToast('Your team is already full!', 'warning');
    }
    return;
  }
  
  // Add to the first empty slot
  selectedTeam[emptySlotIndex] = {
    monsterId,
    uid
  };
  
  // Immediately update UI with proper error handling
  try {
    updateTeamDisplay();
    updateTeamStats();
    console.log('Team UI updated after adding monster to slot', emptySlotIndex);
    
    // Show success message
    const monsterData = monstersCache[monsterId];
    const monsterName = monsterData ? monsterData.name : 'Monster';
    if (window.showToast) {
      window.showToast(`${monsterName} added to your team!`, 'success');
    }
    
    // Save team to Firebase if user is logged in (async, don't wait)
    if (userUID) {
      saveTeamToFirebase().catch(error => {
        console.error('Error saving team:', error);
        if (window.showToast) {
          window.showToast('Team saved locally but failed to sync. Changes may be lost.', 'warning');
        }
      });
    }
  } catch (error) {
    console.error('Error updating team UI:', error);
    if (window.showToast) {
      window.showToast('Error updating team display. Please try again.', 'error');
    }
  }
}

// Remove monster from the selected team
function removeMonsterFromTeam(slotIndex) {
  if (slotIndex >= 0 && slotIndex < 6 && selectedTeam[slotIndex]) {
    const removedMonster = selectedTeam[slotIndex];
    
    // Set the specific slot to null to maintain slot-based positioning
    selectedTeam[slotIndex] = null;
    
    // Immediately update UI with proper error handling
    try {
      updateTeamDisplay();
      updateTeamStats();
      console.log('Team UI updated after removing monster from slot', slotIndex);
      
      // Show success message
      const monsterData = monstersCache[removedMonster.monsterId];
      const monsterName = monsterData ? monsterData.name : 'Monster';
      if (window.showToast) {
        window.showToast(`${monsterName} removed from your team!`, 'success');
      }
      
      // Save team to Firebase if user is logged in (async, don't wait)
      if (userUID) {
        saveTeamToFirebase().catch(error => {
          console.error('Error saving team:', error);
          if (window.showToast) {
            window.showToast('Team saved locally but failed to sync. Changes may be lost.', 'warning');
          }
        });
      }
    } catch (error) {
      console.error('Error updating team UI:', error);
      if (window.showToast) {
        window.showToast('Error updating team display. Please try again.', 'error');
      }
    }
  }
}

// Update the team display
function updateTeamDisplay() {
  const teamSlots = document.querySelectorAll('.team-slot');
  
  teamSlots.forEach((slot, index) => {
    // Remove filled class and click listeners
    slot.classList.remove('filled', 'drag-over', 'invalid-drop');
    slot.replaceWith(slot.cloneNode(true)); // Remove all event listeners
    
    // Get fresh references
    const newSlot = document.querySelectorAll('.team-slot')[index];
    let slotContent = newSlot.querySelector('.slot-content');
    
    // If slot content doesn't exist, create it
    if (!slotContent) {
      newSlot.innerHTML = `
        <div class="slot-number">${index + 1}</div>
        <div class="slot-content">
          <span class="slot-placeholder">+</span>
          <span class="slot-text">Add Monster</span>
        </div>
      `;
      slotContent = newSlot.querySelector('.slot-content');
    }
    
    // Add drag and drop event listeners to all slots
    setupSlotDragAndDrop(newSlot, index);
    
    // Check if there's a monster in this slot (and it's not null)
    if (selectedTeam[index] && selectedTeam[index] !== null) {
      const teamMember = selectedTeam[index];
      const monster = monstersCache[teamMember.monsterId];
      
      if (monster) {
        // Use the monster name directly without cleaning - preserve original name
        const monsterName = monster.name;
        
        slotContent.innerHTML = `
          <img src="/Monsters/${monster.name}.png" alt="${monsterName}" 
               onerror="this.src='data:image/svg+xml,<svg xmlns=&quot;http://www.w3.org/2000/svg&quot; width=&quot;60&quot; height=&quot;60&quot;><rect width=&quot;100%&quot; height=&quot;100%&quot; fill=&quot;%23f0f0f0&quot;/><text x=&quot;50%&quot; y=&quot;50%&quot; text-anchor=&quot;middle&quot; dy=&quot;.3em&quot; fill=&quot;%23999&quot; font-size=&quot;10&quot;>${monsterName}</text></svg>'">
          <span class="monster-name">${monsterName}</span>
        `;
        newSlot.classList.add('filled');
        
        // Add XP progress bar to team slot
        const userMonster = userMonstersCache.find(um => um.uid === teamMember.uid);
        if (userMonster) {
          const gameEngine = { xpManager: xpManager };
          const monsterWithXP = { ...userMonster, level: userMonster.level || 5, xp: userMonster.xp || xpManager.getXPForLevel(userMonster.level || 5) };
          
          setTimeout(() => {
            const xpProgressBar = createXPProgressBar(monsterWithXP, gameEngine, 'mini');
            if (xpProgressBar) {
              slotContent.appendChild(xpProgressBar);
            }
          }, 0);
        }
        
        // Add click event to remove monster
        newSlot.addEventListener('click', () => {
          if (confirm(`Remove ${monsterName} from your team?`)) {
            removeMonsterFromTeam(index);
          }
        });
      }
    } else {
      // Reset to empty slot appearance
      slotContent.innerHTML = `
        <span class="slot-placeholder">+</span>
        <span class="slot-text">Add Monster</span>
      `;
      newSlot.classList.remove('filled');
    }
  });
}

// Set up drag and drop functionality for team slots
function setupSlotDragAndDrop(slot, slotIndex) {
  // Allow dropping
  slot.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    // Count active team members for proper validation
    const activeTeamCount = selectedTeam.filter(member => member !== null && member !== undefined).length;
    
    // Add visual feedback
    if (!slot.classList.contains('filled') || activeTeamCount < 6) {
      slot.classList.add('drag-over');
      slot.classList.remove('invalid-drop');
    } else {
      slot.classList.add('invalid-drop');
      slot.classList.remove('drag-over');
    }
  });
  
  slot.addEventListener('dragleave', (e) => {
    // Only remove classes if we're actually leaving the slot
    if (!slot.contains(e.relatedTarget)) {
      slot.classList.remove('drag-over', 'invalid-drop');
    }
  });
  
  slot.addEventListener('drop', (e) => {
    e.preventDefault();
    slot.classList.remove('drag-over', 'invalid-drop');
    
    try {
      const dragData = JSON.parse(e.dataTransfer.getData('text/plain'));
      const { monsterId, uid } = dragData;
      
      // Count active team members
      const activeTeamCount = selectedTeam.filter(member => member !== null && member !== undefined).length;
      
      // Check if team is full and slot is empty
      if (activeTeamCount >= 6 && (!selectedTeam[slotIndex] || selectedTeam[slotIndex] === null)) {
        if (window.showToast) {
          window.showToast('Your team is already full!', 'warning');
        }
        return;
      }
      
      // Check if monster is already in team
      const isAlreadyInTeam = selectedTeam.some(monster => monster && monster.uid === uid);
      if (isAlreadyInTeam) {
        if (window.showToast) {
          window.showToast('This monster is already in your team!', 'warning');
        }
        return;
      }
      
      // If slot is occupied, we'll replace the monster
      if (selectedTeam[slotIndex] && selectedTeam[slotIndex] !== null) {
        const oldMonster = monstersCache[selectedTeam[slotIndex].monsterId];
        const oldMonsterName = oldMonster ? oldMonster.name : 'Monster';
        if (window.showToast) {
          window.showToast(`${oldMonsterName} was replaced`, 'info');
        }
      }
      
      // Add monster to specific slot
      selectedTeam[slotIndex] = {
        monsterId,
        uid
      };
      
      // Update displays
      updateTeamDisplay();
      updateTeamStats();
      
      // Show success message
      const monsterData = monstersCache[monsterId];
      const monsterName = monsterData ? monsterData.name : 'Monster';
      if (window.showToast) {
        window.showToast(`${monsterName} added to team slot ${slotIndex + 1}!`, 'success');
      }
      
      // Save team to Firebase if user is logged in
      if (userUID) {
        saveTeamToFirebase();
      }
      
    } catch (error) {
      console.error('Error processing drop:', error);
      if (window.showToast) {
        window.showToast('Error adding monster to team', 'error');
      }
    }
  });
}

// Update team statistics
function updateTeamStats() {
  const teamTypes = new Set();
  let totalLevel = 0;
  let totalCP = 0;
  
  // Filter out null entries before processing
  const activeTeamMembers = selectedTeam.filter(member => member !== null && member !== undefined);
  
  activeTeamMembers.forEach(teamMember => {
    const monster = monstersCache[teamMember.monsterId];
    if (monster) {
      // Add types
      monster.types.forEach(type => teamTypes.add(type.toLowerCase()));
      
      // Add to totals (simplified calculations)
      const userMonster = userMonstersCache.find(um => um.uid === teamMember.uid);
      if (userMonster) {
        totalLevel += userMonster.level || 5;
        totalCP += monster.stats.hp + monster.stats.attack + monster.stats.defense + 
                  monster.stats.specialAttack + monster.stats.specialDefense + monster.stats.speed;
      }
    }
  });
  
  // Update type coverage display
  const teamTypesElement = document.getElementById('team-types');
  if (teamTypesElement) {
    teamTypesElement.innerHTML = Array.from(teamTypes)
      .map(type => `<span class="monster-type type-${type}">${type}</span>`)
      .join('');
  }
  
  // Update average level
  const avgLevelElement = document.getElementById('avg-level');
  if (avgLevelElement) {
    const avgLevel = activeTeamMembers.length > 0 ? Math.round(totalLevel / activeTeamMembers.length) : 0;
    avgLevelElement.textContent = avgLevel > 0 ? avgLevel : '-';
  }
  
  // Update total CP
  const totalCPElement = document.getElementById('total-cp');
  if (totalCPElement) {
    totalCPElement.textContent = totalCP > 0 ? totalCP : '-';
  }
}

// Save team to Firebase
function saveTeamToFirebase() {
  if (!userUID) return Promise.resolve();
  
  const database = window.firebaseDatabase;

  if (!database) {
      console.error('Database (v9 instance) is not initialized in saveTeamToFirebase.');
      return Promise.reject(new Error('Database not initialized'));
  }

  const teamDbRef = ref(database, `users/${userUID}/MonsterTeam`);
  const teamData = {};
  
  // Only save non-null monsters with their slot index
  selectedTeam.forEach((monster, index) => {
    if (monster && monster !== null && monster.uid) {
      teamData[index] = monster.uid;
    }
  });
  
  return set(teamDbRef, teamData)
    .then(() => {
      console.log('Team saved successfully (v9)');
      return true;
    })
    .catch(error => {
      console.error('Error saving team (v9):', error);
      throw error;
    });
}

// Load team from Firebase
async function loadTeamFromFirebase() {
  const database = window.firebaseDatabase;

  if (!database) {
    console.error('Database (v9 instance) is not initialized in loadTeamFromFirebase.');
    return;
  }
  console.log('Loading team for UID (v9):', userUID);
  
  if (!userUID) {
      console.log('loadTeamFromFirebase: No userUID, skipping load.');
      selectedTeam = new Array(6).fill(null);
      updateTeamDisplay();
      return;
  }

  try {
    const teamDbRef = ref(database, `users/${userUID}/MonsterTeam`);
    const snapshot = await get(teamDbRef);
    const teamData = snapshot.val() || {};
    
    // Initialize team with 6 null slots
    selectedTeam = new Array(6).fill(null);
    
    // Load team data into specific slots
    Object.keys(teamData).forEach(slotIndex => {
      const monsterUid = teamData[slotIndex];
      const slotNum = parseInt(slotIndex);
      
      // Ensure the userMonster exists in the cache before adding to team
      const userMonster = userMonstersCache.find(m => m.uid === monsterUid);
      
      if (userMonster && slotNum >= 0 && slotNum < 6) {
        selectedTeam[slotNum] = {
          monsterId: userMonster.monsterId,
          uid: userMonster.uid
        };
      }
    });
    
    // Update team display
    updateTeamDisplay();
    updateTeamStats();
    
    console.log('Team loaded successfully:', selectedTeam);
  } catch (error) {
    console.error('Error loading team:', error);
    // On error, initialize with empty slots
    selectedTeam = new Array(6).fill(null);
    updateTeamDisplay();
    updateTeamStats();
  }
}

// Add global event listeners
function addEventListeners() {
  console.log('Setting up global event listeners...');
  
  // Close monster detail modal - New structure
  const modalCloseBtn = document.getElementById('close-detail');
  if (modalCloseBtn) {
    modalCloseBtn.addEventListener('click', closeMonsterDetail);
  }
  
  // Close modal when clicking the overlay - New structure
  const modalOverlay = document.getElementById('monster-detail-modal');
  if (modalOverlay) {
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) {
        closeMonsterDetail();
      }
    });
  }
  
  // Legacy support - Close monster detail view when clicking the close button
  const closeDetailBtn = document.querySelector('.close-detail');
  if (closeDetailBtn) {
    closeDetailBtn.addEventListener('click', closeMonsterDetail);
  }
  
  // Legacy support - Close monster detail view when clicking outside the card
  const monsterDetail = document.querySelector('.monster-detail');
  if (monsterDetail) {
    monsterDetail.addEventListener('click', (e) => {
      if (e.target === monsterDetail) {
        closeMonsterDetail();
      }
    });
  }
  
  // Team slot click handlers for empty slots (to show available monsters)
  const teamSlots = document.querySelectorAll('.team-slot.empty');
  teamSlots.forEach((slot, index) => {
    slot.addEventListener('click', () => {
      // Scroll to monster collection
      const monsterCollection = document.querySelector('.monster-collection');
      if (monsterCollection) {
        monsterCollection.scrollIntoView({ behavior: 'smooth' });
      }
      
      // Show helpful message
      if (window.showToast) {
        window.showToast('Click on a monster below to add it to your team!', 'info');
      }
    });
  });
  
  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    // Escape key to close modal
    if (e.key === 'Escape') {
      closeMonsterDetail();
    }
    
    // Ctrl/Cmd + F to focus search
    if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
      e.preventDefault();
      const searchInput = document.getElementById('monster-search');
      if (searchInput) {
        searchInput.focus();
      }
    }
  });
  
  console.log('Global event listeners set up complete.');
}

// Release a monster from user's collection
async function releaseMonsterFromCollection(monsterUid, explicitUserId = null) {
  const userId = explicitUserId || userUID;
  
  if (!userId) {
    console.error('User not logged in, cannot release monster.');
    if (window.showToast) {
      window.showToast('Please log in to release monsters.', 'warning');
    }
    return Promise.reject(new Error('User not logged in'));
  }
  
  const database = window.firebaseDatabase;

  if (!database) {
    console.error('Database (v9 instance) is not initialized in releaseMonsterFromCollection.');
    if (window.showToast) {
      window.showToast('Database connection error. Please try again.', 'error');
    }
    return Promise.reject(new Error('Database not initialized'));
  }

  try {
    // Import Firebase functions
    const { ref, remove, get } = await import('https://www.gstatic.com/firebasejs/9.10.0/firebase-database.js');
    
    // Get monster data before deletion for confirmation
    const monsterRef = ref(database, `users/${userId}/monsters/${monsterUid}`);
    const snapshot = await get(monsterRef);
    const monsterData = snapshot.val();
    
    if (!monsterData) {
      console.error('Monster not found in collection');
      if (window.showToast) {
        window.showToast('Monster not found in your collection.', 'error');
      }
      return Promise.reject(new Error('Monster not found'));
    }

    // Check if monster is currently in team
    const isInTeam = selectedTeam.some(teamMember => teamMember && teamMember.uid === monsterUid);
    if (isInTeam) {
      // Remove from team first
      const teamIndex = selectedTeam.findIndex(teamMember => teamMember && teamMember.uid === monsterUid);
      if (teamIndex !== -1) {
        selectedTeam[teamIndex] = null;
        updateTeamDisplay();
        updateTeamStats();
        
        // Save updated team to Firebase
        if (userId === userUID) {
          await saveTeamToFirebase();
        }
      }
    }

    // Remove monster from Firebase
    await remove(monsterRef);
    
    console.log(`Monster ${monsterData.monsterId} released from user's collection (UID: ${monsterUid})`);
    
    // If we're releasing a monster from the current user, update the UI immediately
    if (userId === userUID) {
      // Remove from local cache
      userMonstersCache = userMonstersCache.filter(m => m.uid !== monsterUid);
      
      // Refresh UI
      renderMonsterList();
      updateCollectionStats();
      console.log('UI updated after releasing monster');
      
      // Show success notification
      const monsterName = monstersCache[monsterData.monsterId]?.name || monsterData.monsterId;
      if (window.showToast) {
        window.showToast(`${monsterName} has been released! 🕊️`, 'success');
      }
    }
    
    return true;
    
  } catch (error) {
    console.error('Error releasing monster:', error);
    if (window.showToast) {
      window.showToast('Failed to release monster. Please try again.', 'error');
    }
    throw error;
  }
}

// For development/testing: Add a monster to user's collection
function addMonsterToUserCollection(monsterId, explicitUserId = null) {
  const userId = explicitUserId || userUID;
  
  if (!userId) {
    console.error('User not logged in, cannot add monster.');
    if (window.showToast) {
      window.showToast('Please log in to add monsters to your collection.', 'warning');
    }
    return Promise.reject(new Error('User not logged in'));
  }
  
  const database = window.firebaseDatabase;

  if (!database) {
    console.error('Database (v9 instance) is not initialized in addMonsterToUserCollection.');
    if (window.showToast) {
      window.showToast('Database connection error. Please try again.', 'error');
    }
    return Promise.reject(new Error('Database not initialized'));
  }
  console.log('Using v9 database instance in addMonsterToUserCollection:', database);
  
  const userMonstersDbRef = ref(database, `users/${userId}/monsters`);
  const newMonsterPushRef = push(userMonstersDbRef); // push() returns a new Reference
  
  const uniqueId = `monster_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
  
  return set(newMonsterPushRef, { // Use set() on the new reference
    monsterId,
    uniqueId,
    dateAcquired: serverTimestamp(), // v9 server timestamp
    level: 1,
    experience: 0,
    ivs: {
      hp: Math.floor(Math.random() * 32),
      attack: Math.floor(Math.random() * 32),
      defense: Math.floor(Math.random() * 32),
      specialAttack: Math.floor(Math.random() * 32),
      specialDefense: Math.floor(Math.random() * 32),
      speed: Math.floor(Math.random() * 32)
    }
  }).then(() => {
    console.log(`Monster ${monsterId} added to user's collection with uniqueId: ${uniqueId} (v9)`);
    
    // If we're adding a monster to the current user, update the UI immediately
    if (userId === userUID) {
      // Refresh user monsters and update UI
      return fetchUserMonstersInternal().then(() => {
        renderMonsterList();
        updateCollectionStats();
        console.log('UI updated after adding monster');
        
        // Show success notification
        if (window.showToast) {
          const monsterData = monstersCache[monsterId];
          const monsterName = monsterData ? monsterData.name : monsterId;
          window.showToast(`${monsterName} added to your collection!`, 'success');
        }
      }).catch(error => {
        console.error('Error updating UI after adding monster:', error);
        if (window.showToast) {
          window.showToast('Monster added but UI update failed. Please refresh.', 'warning');
        }
      });
    }
    
    return true;
  }).catch(error => {
    console.error('Error adding monster:', error);
    if (window.showToast) {
      window.showToast('Failed to add monster. Please try again.', 'error');
    }
    throw error;
  });
}

// Set the user ID explicitly - primarily updates the module-level userUID
function setUserID(userId) {
  if (userId) {
    userUID = userId;
    console.log('User ID set to:', userUID);
    // Data fetching is handled by loadUserMonsters after this is called.
  } else {
    // Handle user logout: clear user-specific data
    userUID = null;
    userMonstersCache = [];
    selectedTeam = [];
    console.log('User ID cleared (logged out).');
    // UI updates happen in loadUserMonsters after setUserID(null) is called.
  }
}

// Load user's monsters and team from the database
// This function is called by the HTML when the auth state changes.
async function loadUserMonsters(userId) {
  // Use setUserID to update the internal userUID variable
  setUserID(userId);

  const database = window.firebaseDatabase;

  if (!database) {
     console.error('loadUserMonsters: Database (v9 instance) not initialized when called.');
     renderMonsterList();
     updateTeamDisplay();
     return;
  }

  // If a user is logged in (userUID is not null after setUserID)
  if (userUID) {
    console.log('loadUserMonsters: Loading data for user ID:', userUID);
    try {
      // Ensure monster definitions are loaded (fetchMonsterData is idempotent)
      await fetchMonsterData(); 

      // Fetch user's monsters
      await fetchUserMonstersInternal(); // Uses the updated userUID and accesses window.firebaseDatabase

      // Render the monster list based on fetched user monsters
      renderMonsterList();

      // Load team data
      await loadTeamFromFirebase(); // Uses the updated userUID and accesses window.firebaseDatabase

      console.log('User monsters and team loaded successfully via loadUserMonsters for UID:', userUID);
    } catch (error) {
      console.error('Error in loadUserMonsters for UID:', userUID, error);
      // On error, ensure caches are cleared and update UI
      userMonstersCache = []; // Clear cache on fetch error
      selectedTeam = []; // Clear team cache on load error
      renderMonsterList(); // Show empty/error state
      updateTeamDisplay(); // Show empty team
    }
  } else {
    // No user ID provided or user logged out
    console.log('loadUserMonsters: No user logged in, clearing data and rendering demo state.');
    // setUserID(null) already cleared the internal state and caches

    // Ensure monster definitions are loaded for demo display
    await fetchMonsterData(); // Ensure definitions are loaded

    // Render to show "no monsters" message and clear team display
    renderMonsterList(); 
    updateTeamDisplay(); 
  }
}

// Clear team function
function clearTeam() {
  // Reset to empty 6-slot array
  selectedTeam = new Array(6).fill(null);
  
  // Immediately update UI with proper error handling
  try {
    updateTeamDisplay();
    updateTeamStats();
    console.log('Team UI updated after clearing team');
    
    if (window.showToast) {
      window.showToast('Team cleared successfully!', 'success');
    }
    
    // Save to Firebase (async, don't wait)
    if (userUID) {
      saveTeamToFirebase().catch(error => {
        console.error('Error saving cleared team:', error);
        if (window.showToast) {
          window.showToast('Team cleared locally but failed to sync. Changes may be lost.', 'warning');
        }
      });
    }
  } catch (error) {
    console.error('Error updating team UI after clearing:', error);
    if (window.showToast) {
      window.showToast('Error clearing team display. Please try again.', 'error');
    }
  }
}

// Helper function for testing - add multiple monsters
function addTestMonsters() {
  if (!userUID) {
    console.error('No user logged in. Cannot add test monsters.');
    if (window.showToast) {
      window.showToast('Please log in first to add test monsters', 'warning');
    }
    return;
  }
  
  const testMonsters = ['pechac', 'bunburrow', 'crisilla', 'buzzy', 'sharx'];
  testMonsters.forEach(monsterId => {
    addMonsterToUserCollection(monsterId);
  });
  
  if (window.showToast) {
    window.showToast(`Added ${testMonsters.length} test monsters to your collection!`, 'success');
  }
}

// Helper function for testing team functionality
function addTestMonstersToTeam() {
  if (!userUID) {
    console.error('No user logged in. Cannot add test monsters to team.');
    if (window.showToast) {
      window.showToast('Please log in first to test team functionality', 'warning');
    }
    return;
  }
  
  // Clear existing team first
  selectedTeam = [];
  
  // Add a few test monsters to team
  const testTeam = ['pechac', 'bunburrow', 'crisilla'];
  testTeam.forEach((monsterId, index) => {
    // Find the first monster of this type in user's collection
    const userMonster = userMonstersCache.find(m => m.monsterId === monsterId);
    if (userMonster) {
      selectedTeam[index] = {
        monsterId: monsterId,
        uid: userMonster.uid
      };
    }
  });
  
  // Update UI immediately
  updateTeamDisplay();
  updateTeamStats();
  
  if (window.showToast) {
    window.showToast(`Test team created with ${selectedTeam.length} monsters!`, 'success');
  }
  
  // Save to Firebase
  if (userUID) {
    saveTeamToFirebase().catch(error => {
      console.error('Error saving test team:', error);
    });
  }
}

// Export functions for global access
window.MonsterTamers = {
  init: initializeMonsterTamers,
  addMonsterToUserCollection,
  releaseMonsterFromCollection,
  addTestMonsters,
  addTestMonstersToTeam,
  loadUserMonsters, 
  setUserID 
};

// Simple XP system for monster-tamers
class SimpleXPManager {
  constructor() {
    this.maxLevel = 100;
    this.xpTable = this.generateXPTable();
  }

  generateXPTable() {
    const table = [0]; // Level 1 starts at 0 XP
    
    for (let level = 2; level <= this.maxLevel; level++) {
      const baseXP = 50;
      const multiplier = 8;
      const exponent = 2.3;
      
      const xpNeeded = Math.floor(baseXP + Math.pow(level, exponent) * multiplier);
      table.push(table[table.length - 1] + xpNeeded);
    }
    
    return table;
  }

  getXPForLevel(level) {
    if (level <= 1) return 0;
    if (level > this.maxLevel) return this.xpTable[this.maxLevel - 1];
    return this.xpTable[level - 1];
  }

  getXPToNextLevel(currentLevel, currentXP) {
    if (currentLevel >= this.maxLevel) return 0;
    
    const nextLevelXP = this.getXPForLevel(currentLevel + 1);
    return nextLevelXP - currentXP;
  }

  getLevelProgress(level, currentXP) {
    if (level >= this.maxLevel) return 1.0;
    
    const currentLevelXP = this.getXPForLevel(level);
    const nextLevelXP = this.getXPForLevel(level + 1);
    const levelXPRange = nextLevelXP - currentLevelXP;
    const progressXP = currentXP - currentLevelXP;
    
    return Math.max(0, Math.min(1, progressXP / levelXPRange));
  }

  getXPBarData(monster) {
    const level = monster.level || 5;
    const currentXP = monster.xp || this.getXPForLevel(level);
    
    const currentLevelXP = this.getXPForLevel(level);
    const nextLevelXP = this.getXPForLevel(level + 1);
    const progress = this.getLevelProgress(level, currentXP);
    const xpToNext = this.getXPToNextLevel(level, currentXP);
    
    return {
      level: level,
      currentXP: currentXP,
      currentLevelXP: currentLevelXP,
      nextLevelXP: nextLevelXP,
      progress: progress,
      xpToNext: xpToNext,
      isMaxLevel: level >= this.maxLevel
    };
  }

  formatXP(xp) {
    if (xp >= 1000000) {
      return `${(xp / 1000000).toFixed(1)}M`;
    } else if (xp >= 1000) {
      return `${(xp / 1000).toFixed(1)}K`;
    }
    return xp.toString();
  }
}

// Create XP manager instance
let xpManager = new SimpleXPManager(); 