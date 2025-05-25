// Ability Registry - Central management for all monster abilities
import { Pixilate } from './abilities/bunburrow_pixilate.js';
import { Torrent } from './abilities/pechac_torrent.js';
import { ToxicAura } from './abilities/ratastrophe_toxic_aura.js';
import { LiquidBody } from './abilities/mizuryon_liquid_body.js';
import { PhantomFlame } from './abilities/hauntorch_phantom_flame.js';
import { GlacialBloom } from './abilities/cryorose_glacial_bloom.js';

// New abilities for the new monsters
import { SpeedBoost } from './abilities/scorchlete_speed_boost.js';
import { AquaPixie } from './abilities/nymaria_aqua_pixie.js';
import { SporeCloud } from './abilities/peepuff_spore_cloud.js';
import { FrozenMajesty } from './abilities/shiverion_frozen_majesty.js';
import { DreamWeaver } from './abilities/lumillow_dream_weaver.js';
import { ScrappyFighter } from './abilities/puffsqueak_scrappy_fighter.js';

// New monster abilities from images
import { CharmingGrace } from './abilities/crisilla_charming_grace.js';
import { StaticCurrent } from './abilities/buzzy_static_current.js';
import { BuccaneerSpirit } from './abilities/maquatic_buccaneer_spirit.js';
import { FrozenFury } from './abilities/sharx_frozen_fury.js';
import { MoltenBody } from './abilities/smouldimp_molten_body.js';
import { BubblePlay } from './abilities/blobby_bubble_play.js';
import { DarkFrost } from './abilities/crymora_dark_frost.js';
import { BattleTactics } from './abilities/nerephal_battle_tactics.js';

// New abilities for the new monsters

import { AbsoluteFreeze } from './abilities/fulverice_absolute_freeze.js';
import { IceScales } from './abilities/frosmoth_ice_scales.js';

export class AbilityRegistry {
    constructor() {
        this.abilities = new Map();
        this.initializeAbilities();
    }

    // Initialize all available abilities
    initializeAbilities() {
        // Bunburrow abilities
        this.registerAbility("Pixilate", Pixilate);

        // Pechac abilities
        this.registerAbility("Torrent", Torrent);

        // Ratastrophe abilities
        this.registerAbility("Toxic Aura", ToxicAura);

        // Mizuryon abilities
        this.registerAbility("Liquid Body", LiquidBody);

        // Hauntorch abilities
        this.registerAbility("Phantom Flame", PhantomFlame);

        // Cryorose abilities
        this.registerAbility("Glacial Bloom", GlacialBloom);

        // New monster abilities
        // Scorchlete abilities
        this.registerAbility("Speed Boost", SpeedBoost);

        // Nymaria abilities
        this.registerAbility("Aqua Pixie", AquaPixie);

        // Peepuff abilities
        this.registerAbility("Spore Cloud", SporeCloud);

        // Shiverion abilities
        this.registerAbility("Frozen Majesty", FrozenMajesty);

        // Lumillow abilities
        this.registerAbility("Dream Weaver", DreamWeaver);

        // Puffsqueak abilities
        this.registerAbility("Scrappy Fighter", ScrappyFighter);

        // New image-based monster abilities
        // Crisilla abilities
        this.registerAbility("Charming Grace", CharmingGrace);

        // Buzzy abilities
        this.registerAbility("Static Current", StaticCurrent);

        // Maquatic abilities
        this.registerAbility("Buccaneer's Spirit", BuccaneerSpirit);

        // Sharx abilities
        this.registerAbility("Frozen Fury", FrozenFury);

        // Smouldimp abilities
        this.registerAbility("Molten Body", MoltenBody);

        // Blobby abilities
        this.registerAbility("Bubble Play", BubblePlay);

        // Crymora abilities
        this.registerAbility("Dark Frost", DarkFrost);

        // Nerephal abilities
        this.registerAbility("Battle Tactics", BattleTactics);

        // New monster abilities
        
        

        // Fulverice abilities
        this.registerAbility("Absolute Freeze", AbsoluteFreeze);

        // Frosmoth abilities
        this.registerAbility("Ice Scales", IceScales);
    }

    // Register a new ability
    registerAbility(name, abilityClass) {
        this.abilities.set(name, abilityClass);
    }

    // Get an ability instance by name
    getAbility(name) {
        const AbilityClass = this.abilities.get(name);
        if (AbilityClass) {
            return new AbilityClass();
        }
        throw new Error(`Ability "${name}" not found in registry`);
    }

    // Get all available abilities
    getAllAbilities() {
        return Array.from(this.abilities.keys());
    }

    // Check if an ability exists
    hasAbility(name) {
        return this.abilities.has(name);
    }

    // Get abilities by owner
    getAbilitiesByOwner(ownerName) {
        const ownerAbilities = [];
        for (const [name, AbilityClass] of this.abilities) {
            const abilityInstance = new AbilityClass();
            if (abilityInstance.ownerName === ownerName) {
                ownerAbilities.push(name);
            }
        }
        return ownerAbilities;
    }

    // Create an ability for a monster (used when loading monster data)
    createAbility(abilityName) {
        try {
            return this.getAbility(abilityName);
        } catch (error) {
            console.warn(`Failed to load ability "${abilityName}":`, error.message);
            return null;
        }
    }

    // Execute ability hook for a specific context
    executeAbilityHook(ability, context, user, ...args) {
        if (!ability || !ability.shouldActivate(context, user, ...args)) {
            return { triggered: false };
        }

        switch (context) {
            case "move_use":
                return ability.onMoveUse(...args, user);
            case "battle_start":
                return ability.onBattleStart(user, ...args);
            case "switch_in":
                return ability.onSwitchIn(user, ...args);
            case "hp_change":
                return ability.onHPChange(user, ...args);
            case "damage_dealt":
                // Args from battle manager: move, target, damage, battleState
                // onDamageDealt expects: move, user, target, damage, battleState
                const [move, target, damage, battleState] = args;
                return ability.onDamageDealt ? ability.onDamageDealt(move, user, target, damage, battleState) : { triggered: false };
            default:
                return { triggered: false };
        }
    }
}

// Global instance
export const abilityRegistry = new AbilityRegistry(); 