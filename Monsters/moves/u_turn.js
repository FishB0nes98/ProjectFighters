// U-turn - Bug type physical move that attacks and then switches out
import { BaseMove } from './base_move.js';

export class UTurn extends BaseMove {
    constructor() {
        super();
        this.name = "U-turn";
        this.type = "Bug";
        this.category = "Physical";
        this.power = 70;
        this.accuracy = 100;
        this.pp = 20;
        this.maxPP = 20;
        this.priority = 0;
        this.description = "Attacks then switches out to another monster.";
        this.effects = ["switch_out"];
        this.makesContact = true;
    }

    executeSpecific(user, target, battleManager, battleState, result) {
        // Execute standard damage first
        result = this.executeDamageMove(user, target, battleManager, result);

        // Add switch out effect if the attack was successful
        if (result.success) {
            result.switchOut = true;
            result.effects.push({
                type: 'switch_out',
                target: 'user'
            });
            result.messages.push(`${user.name} quickly retreated after the attack!`);
        }

        return result;
    }

    // U-turn has unique switch-out mechanics
    hasSwitchOut() {
        return true;
    }
} 