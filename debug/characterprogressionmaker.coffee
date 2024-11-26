def generate_character_rewards():
    character_name = input("Enter character name: ")
    
    # Template for rewards array
    rewards = [
        {
            "xpRequired": 1000,
            "rewardName": f"{character_name} Beginner",
            "rewardType": "title",
            "rewardImage": "titles/titleimage.png",
            "databasePath": f"titles/{character_name.lower()}_beginner"
        },
        {
            "xpRequired": 2500,
            "rewardName": f"{character_name} Icon",
            "rewardType": "icon",
            "rewardImage": f"Icons/Profile/{character_name}_Icon.png",
            "databasePath": f"Icons/{character_name}_Icon"
        },
        {
            "xpRequired": 5000,
            "rewardName": "Free Lootbox",
            "rewardType": "lootbox",
            "rewardImage": "res/img/basicbox.png",
            "databasePath": "freelootbox"
        }
    ]
    
    # Get skin rewards
    for i in range(3):  # 3 skins
        xp = int(input(f"Enter XP required for skin {i+1}: "))
        skin_name = input(f"Enter skin name for {character_name}: ")
        
        skin_reward = {
            "xpRequired": xp,
            "rewardName": f"{character_name} {skin_name}",
            "rewardType": "skin",
            "rewardImage": f"Skins/{character_name} {skin_name}.jpeg",
            "databasePath": f"skins/{character_name} {skin_name}"
        }
        rewards.append(skin_reward)
    
    # Add border reward
    border_reward = {
        "xpRequired": 11500,
        "rewardName": f"{character_name} Loading Screen Border",
        "rewardType": "border",
        "rewardImage": f"borders/{character_name.lower()}_border.png",
        "databasePath": f"borders/{character_name.lower()}"
    }
    rewards.append(border_reward)
    
    # Add final title
    final_reward = {
        "xpRequired": 60000,
        "rewardName": f"{character_name} Master",
        "rewardType": "title",
        "rewardImage": "titles/titleimage.png",
        "databasePath": f"titles/{character_name.lower()}_master"
    }
    rewards.append(final_reward)
    
    # Sort rewards by XP required
    rewards.sort(key=lambda x: x["xpRequired"])
    
    # Print the formatted JavaScript array
    print("\nGenerated JavaScript code:")
    print(f"export const {character_name.lower()}Rewards = [")
    for reward in rewards:
        print("    {")
        for key, value in reward.items():
            print(f'        {key}: "{value}",')
        print("    },")
    print("];")

# Run the generator
if __name__ == "__main__":
    generate_character_rewards()