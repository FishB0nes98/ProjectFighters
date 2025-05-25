// Move Registry - Central management for all monster moves
import { FairyWind } from './moves/fairy_wind.js';
import { HealBell } from './moves/heal_bell.js';
import { LightScreen } from './moves/light_screen.js';
import { BurrowStrike } from './moves/burrow_strike.js';
import { AquaCannon } from './moves/aqua_cannon.js';
import { StoneEdge } from './moves/stone_edge.js';
import { RapidStrike } from './moves/rapid_strike.js';
import { TempleCrash } from './moves/temple_crash.js';
import { AquaJet } from './moves/aqua_jet.js';
import { SolarBeam } from './moves/solar_beam.js';
import { PlagueBite } from './moves/plague_bite.js';
import { TidalWave } from './moves/tidal_wave.js';
import { PhantomStrike } from './moves/phantom_strike.js';
import { InfernalBurst } from './moves/infernal_burst.js';
import { ToxicOverload } from './moves/toxic_overload.js';
import { PrecisionStrike } from './moves/precision_strike.js';
import { FrozenPetal } from './moves/frozen_petal.js';
import { ToxicSpike } from './moves/toxic_spike.js';
import { SludgeBomb } from './moves/sludge_bomb.js';
import { VineWhip } from './moves/vine_whip.js';
import { Blizzard } from './moves/blizzard.js';
import { ShadowBall } from './moves/shadow_ball.js';
import { Flamethrower } from './moves/flamethrower.js';
import { HydroClaw } from './moves/hydro_claw.js';

// New moves for the new monsters
import { FlameDash } from './moves/flame_dash.js';
import { MagmaBurst } from './moves/magma_burst.js';
import { BubbleBeam } from './moves/bubble_beam.js';
import { Moonbeam } from './moves/moonbeam.js';
import { Spore } from './moves/spore.js';
import { DrainKiss } from './moves/drain_kiss.js';
import { PetalBlizzard } from './moves/petal_blizzard.js';
import { DragonPulse } from './moves/dragon_pulse.js';
import { IceShard } from './moves/ice_shard.js';
import { GlacialStorm } from './moves/glacial_storm.js';
import { SleepyTime } from './moves/sleepy_time.js';
import { DreamEater } from './moves/dream_eater.js';
import { Rest } from './moves/rest.js';
import { QuickAttack } from './moves/quick_attack.js';
import { BrickBreak } from './moves/brick_break.js';
import { TailSlap } from './moves/tail_slap.js';
import { PlayRough } from './moves/play_rough.js';

// New moves for image-based monsters
import { Charm } from './moves/charm.js';
import { Swift } from './moves/swift.js';
import { StaffStrike } from './moves/staff_strike.js';
import { AquaCutter } from './moves/aqua_cutter.js';

// Newly created standard moves
import { ThunderShock } from './moves/thunder_shock.js';
import { AquaRing } from './moves/aqua_ring.js';
import { ThunderWave } from './moves/thunder_wave.js';
import { ElectroBall } from './moves/electro_ball.js';
import { IceFang } from './moves/ice_fang.js';
import { Liquidation } from './moves/liquidation.js';
import { IcePunch } from './moves/ice_punch.js';
import { Crunch } from './moves/crunch.js';
import { CloseCombat } from './moves/close_combat.js';
import { Surf } from './moves/surf.js';
import { Ember } from './moves/ember.js';
import { LavaPlume } from './moves/lava_plume.js';
import { FireSpin } from './moves/fire_spin.js';
import { Recover } from './moves/recover.js';
import { IceBeam } from './moves/ice_beam.js';
import { Moonblast } from './moves/moonblast.js';
import { DarkPulse } from './moves/dark_pulse.js';
import { DazzlingGleam } from './moves/dazzling_gleam.js';

// Missing moves for Nerephal
import { UTurn } from './moves/u_turn.js';
import { SpearThrust } from './moves/spear_thrust.js';
import { Protect } from './moves/protect.js';

// Missing moves for Blobby and other monsters
import { DragonBreath } from './moves/dragon_breath.js';
import { AquaTail } from './moves/aqua_tail.js';
import { PlayNice } from './moves/play_nice.js';

// New moves for the new monsters
import { NinjaStrike } from './moves/ninja_strike.js';
import { QuiverDance } from './moves/quiver_dance.js';
import { BeatDrop } from './moves/beat_drop.js';
import { IceShuriken } from './moves/ice_shuriken.js';
import { StealthCurrent } from './moves/stealth_current.js';
import { AbsoluteZero } from './moves/absolute_zero.js';

export class MoveRegistry {
    constructor() {
        this.moves = new Map();
        this.initializeMoves();
    }

    // Initialize all available moves
    initializeMoves() {
        // Bunburrow moves
        this.registerMove("Fairy Wind", FairyWind);
        this.registerMove("Heal Bell", HealBell);
        this.registerMove("Light Screen", LightScreen);
        this.registerMove("Burrow Strike", BurrowStrike);

        // Pechac moves
        this.registerMove("Aqua Cannon", AquaCannon);
        this.registerMove("Stone Edge", StoneEdge);
        this.registerMove("Rapid Strike", RapidStrike);
        this.registerMove("Temple Crash", TempleCrash);

        // Additional moves for other monsters
        this.registerMove("Aqua Jet", AquaJet);
        this.registerMove("Solar Beam", SolarBeam);
        this.registerMove("Plague Bite", PlagueBite);
        this.registerMove("Tidal Wave", TidalWave);
        this.registerMove("Phantom Strike", PhantomStrike);
        this.registerMove("Infernal Burst", InfernalBurst);
        this.registerMove("Toxic Overload", ToxicOverload);
        this.registerMove("Precision Strike", PrecisionStrike);
        this.registerMove("Frozen Petal", FrozenPetal);

        // Newly created moves
        this.registerMove("Toxic Spike", ToxicSpike);
        this.registerMove("Sludge Bomb", SludgeBomb);
        this.registerMove("Vine Whip", VineWhip);
        this.registerMove("Blizzard", Blizzard);
        this.registerMove("Shadow Ball", ShadowBall);
        this.registerMove("Flamethrower", Flamethrower);
        this.registerMove("Hydro Claw", HydroClaw);

        // New monster moves
        // Scorchlete moves
        this.registerMove("Flame Dash", FlameDash);
        this.registerMove("Magma Burst", MagmaBurst);

        // Nymaria moves
        this.registerMove("Bubble Beam", BubbleBeam);
        this.registerMove("Moonbeam", Moonbeam);

        // Peepuff moves
        this.registerMove("Spore", Spore);
        this.registerMove("Drain Kiss", DrainKiss);
        this.registerMove("Petal Blizzard", PetalBlizzard);

        // Shiverion moves
        this.registerMove("Dragon Pulse", DragonPulse);
        this.registerMove("Ice Shard", IceShard);
        this.registerMove("Glacial Storm", GlacialStorm);

        // Lumillow moves
        this.registerMove("Sleepy Time", SleepyTime);
        this.registerMove("Dream Eater", DreamEater);
        this.registerMove("Rest", Rest);

        // Puffsqueak moves
        this.registerMove("Quick Attack", QuickAttack);
        this.registerMove("Brick Break", BrickBreak);
        this.registerMove("Tail Slap", TailSlap);
        this.registerMove("Play Rough", PlayRough);

        // New image-based monster moves
        // Crisilla moves
        this.registerMove("Charm", Charm);
        this.registerMove("Swift", Swift);

        // Maquatic moves
        this.registerMove("Staff Strike", StaffStrike);

        // Nerephal moves
        this.registerMove("Aqua Cutter", AquaCutter);

        // Missing Nerephal moves
        this.registerMove("U-turn", UTurn);
        this.registerMove("Spear Thrust", SpearThrust);
        this.registerMove("Protect", Protect);

        // Standard Pokemon-like moves for existing monsters
        this.registerMove("Thunder Shock", ThunderShock);
        this.registerMove("Aqua Ring", AquaRing);
        this.registerMove("Thunder Wave", ThunderWave);
        this.registerMove("Electro Ball", ElectroBall);
        this.registerMove("Ice Fang", IceFang);
        this.registerMove("Liquidation", Liquidation);
        this.registerMove("Ice Punch", IcePunch);
        this.registerMove("Crunch", Crunch);
        this.registerMove("Close Combat", CloseCombat);
        this.registerMove("Surf", Surf);
        this.registerMove("Ember", Ember);
        this.registerMove("Lava Plume", LavaPlume);
        this.registerMove("Fire Spin", FireSpin);
        this.registerMove("Recover", Recover);
        this.registerMove("Ice Beam", IceBeam);
        this.registerMove("Moonblast", Moonblast);
        this.registerMove("Dark Pulse", DarkPulse);
        this.registerMove("Dazzling Gleam", DazzlingGleam);

        // Missing moves for Blobby and other monsters
        this.registerMove("Dragon Breath", DragonBreath);
        this.registerMove("Aqua Tail", AquaTail);
        this.registerMove("Play Nice", PlayNice);

        // New moves for the new monsters
        this.registerMove("Ninja Strike", NinjaStrike);
        this.registerMove("Quiver Dance", QuiverDance);
        this.registerMove("Beat Drop", BeatDrop);
        this.registerMove("Ice Shuriken", IceShuriken);
        this.registerMove("Stealth Current", StealthCurrent);
        this.registerMove("Absolute Zero", AbsoluteZero);
    }

    // Register a new move
    registerMove(name, moveClass) {
        this.moves.set(name, moveClass);
    }

    // Get a move instance by name
    getMove(name) {
        const MoveClass = this.moves.get(name);
        if (MoveClass) {
            return new MoveClass();
        }
        throw new Error(`Move "${name}" not found in registry`);
    }

    // Get all available moves
    getAllMoves() {
        return Array.from(this.moves.keys());
    }

    // Check if a move exists
    hasMove(name) {
        return this.moves.has(name);
    }

    // Get moves by type
    getMovesByType(type) {
        const movesOfType = [];
        for (const [name, MoveClass] of this.moves) {
            const moveInstance = new MoveClass();
            if (moveInstance.type === type) {
                movesOfType.push(name);
            }
        }
        return movesOfType;
    }

    // Get moves by category
    getMovesByCategory(category) {
        const movesOfCategory = [];
        for (const [name, MoveClass] of this.moves) {
            const moveInstance = new MoveClass();
            if (moveInstance.category === category) {
                movesOfCategory.push(name);
            }
        }
        return movesOfCategory;
    }

    // Create a moveset for a monster (used when loading monster data)
    createMoveset(moveNames) {
        const moveset = [];
        for (const moveName of moveNames) {
            try {
                const move = this.getMove(moveName);
                moveset.push(move);
            } catch (error) {
                console.warn(`Failed to load move "${moveName}":`, error.message);
            }
        }
        return moveset;
    }
}

// Global instance
export const moveRegistry = new MoveRegistry(); 