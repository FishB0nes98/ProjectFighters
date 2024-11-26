const ITEM_DATABASE = {
    health_potion: {
        id: 'health_potion',
        name: 'Health Potion',
        description: 'Restores 800 HP',
        image: 'res/health_potion.jpeg',
        rarity: 'common',
        usable: true,
        consumeType: 'single',
        cooldown: 5,
        effect: (targetId) => {
            return {
                type: 'heal',
                value: 800,
                target: targetId
            };
        }
    },
    cm: {
        id: 'cm',
        name: 'CM',
        description: 'Common currency used in the game',
        image: '../../res/img/cm.png',
        rarity: 'common',
        usable: true,
        consumeType: 'stack',
        effect: async (_, stackCount) => {
            const user = auth.currentUser;
            if (!user) {
                console.error('No user logged in');
                return {
                    type: 'error',
                    message: 'User not logged in'
                };
            }

            try {
                // Get current CM value
                const cmRef = dbRef(db, `users/${user.uid}/CM`);
                const snapshot = await dbGet(cmRef);
                const currentCM = snapshot.exists() ? parseInt(snapshot.val()) : 0;
                
                console.log('CM Update:', { currentCM, addingStackCount: stackCount });

                // Update CM value with full stack count
                const updates = {};
                updates['CM'] = currentCM + stackCount;
                
                await dbUpdate(dbRef(db, `users/${user.uid}`), updates);

                return {
                    type: 'currency',
                    value: stackCount,
                    currencyType: 'CM'
                };
            } catch (error) {
                console.error('Error updating CM:', error);
                return {
                    type: 'error',
                    message: 'Failed to update CM'
                };
            }
        }
    },
    fm: {
        id: 'fm',
        name: 'FM',
        description: 'Premium currency used in the game',
        image: '../../res/img/fm.png',
        rarity: 'rare',
        usable: true,
        consumeType: 'stack',
        effect: async (_, stackCount) => {
            const user = auth.currentUser;
            if (!user) {
                console.error('No user logged in');
                return {
                    type: 'error',
                    message: 'User not logged in'
                };
            }

            try {
                // Get current FM value
                const fmRef = dbRef(db, `users/${user.uid}/FM`);
                const snapshot = await dbGet(fmRef);
                const currentFM = snapshot.exists() ? parseInt(snapshot.val()) : 0;
                
                console.log('FM Update:', { currentFM, addingStackCount: stackCount });

                // Add the full stack count to current FM
                await dbUpdate(dbRef(db, `users/${user.uid}`), {
                    FM: currentFM + stackCount
                });

                return {
                    type: 'currency',
                    value: stackCount,
                    currencyType: 'FM'
                };
            } catch (error) {
                console.error('Error updating FM:', error);
            }
        }
    },
    farmer_fang_skin: {
        id: 'farmer_fang_skin',
        name: 'Farmer FANG Skin',
        description: 'A rare skin for FANG character. If already owned, converts to 3000 FM!',
        image: '../../Loading Screen/Farmer FANG.png',
        rarity: 'legendary',
        usable: true,
        consumeType: 'single',
        effect: async (targetId) => {
            const user = auth.currentUser;
            if (!user) {
                return {
                    type: 'error',
                    message: 'User not logged in'
                };
            }

            try {
                // Check if user already has the skin
                const skinRef = dbRef(db, `users/${user.uid}/skins/Farmer_FANG`);
                const snapshot = await dbGet(skinRef);
                
                if (snapshot.exists() && snapshot.val() === 1) {
                    // User already has the skin - convert to FM
                    const fmRef = dbRef(db, `users/${user.uid}/FM`);
                    const fmSnapshot = await dbGet(fmRef);
                    const currentFM = fmSnapshot.exists() ? parseInt(fmSnapshot.val()) : 0;
                    
                    // Add 3000 FM
                    await dbUpdate(dbRef(db, `users/${user.uid}`), {
                        FM: currentFM + 3000
                    });

                    return {
                        type: 'duplicate_skin',
                        value: 3000,
                        message: 'Converted duplicate Farmer FANG skin to 3000 FM!'
                    };
                } else {
                    // User doesn't have the skin - unlock it
                    await dbUpdate(dbRef(db, `users/${user.uid}/skins`), {
                        Farmer_FANG: 1
                    });

                    return {
                        type: 'skin',
                        skinId: 'Farmer_FANG',
                        message: 'Farmer FANG skin unlocked!'
                    };
                }
            } catch (error) {
                console.error('Error processing skin:', error);
                return {
                    type: 'error',
                    message: 'Failed to process skin'
                };
            }
        }
    },
    julia_pendant: {
        id: 'julia_pendant',
        name: "Julia's Pendant",
        description: 'Increases healing received by 40% for 10 turns',
        image: '../../res/img/julia_pendant.jpeg',
        rarity: 'rare',
        usable: true,
        consumeType: 'single',
        cooldown: 10,
        effect: (targetId) => {
            if (!buffs[targetId]) {
                buffs[targetId] = {};
            }
            buffs[targetId]['healing_amplifier'] = {
                value: 0.4,
                duration: 10
            };
            applyBuff(targetId, 'healing_amplifier', 10, '../../res/img/julia_pendant.jpeg', 'Increases healing received by 40% for 10 turns');
            return {
                type: 'buff',
                buffType: 'healing_amplifier',
                value: 0.4,
                duration: 10,
                target: targetId
            };
        }
    }
};

export default ITEM_DATABASE; 