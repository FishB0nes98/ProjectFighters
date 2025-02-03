import pygame
import sys
from ..stage_base import Stage
from engine.character import Character
from engine.ability import Ability
from engine.inventory import Inventory, Item
from engine.battle_log import BattleLog
from engine.buff import Buff
from engine.target import Target
from engine.loot_notification import LootNotification
from engine.tooltip import TooltipManager
import random
import math
from random import random as random_float, randint
from typing import List, Dict, Any
import json
import os

class FarmStage4(Stage):
    def __init__(self, screen, firebase_manager):
        super().__init__(screen)
        self.firebase = firebase_manager
        self.ai_thinking = False
        self.ai_think_start = 0
        self.ai_think_duration = 2000
        self.damage_flash = {"cham_cham": 0, "alice": 0, "crazy_farmer": 0, "hound": 0}
        self.damage_flash_duration = 500
        self.attacking = False
        self.attack_start = 0
        self.attack_duration = 500
        self.attacker = None
        self.original_pos = None
        self.targeting_mode = False
        self.current_ability = None
        self.targets = []
        self.healing_particles = []
        self.loot_notification = LootNotification(screen)
        
        # Add dragging state attributes
        self.dragging_inventory = False
        self.dragging_battle_log = False
        self.inventory_drag_offset = (0, 0)
        self.battle_log_drag_offset = (0, 0)
        
        # Project root for loading items
        self.project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        self.items_path = os.path.join(self.project_root, 'data', 'items.json')
        
        try:
            with open(self.items_path, 'r') as f:
                self.items_data = json.load(f)
        except FileNotFoundError:
            print(f"Could not find items.json at {self.items_path}")
            self.items_data = {"items": []}

        # Add boomerang tracking from Stage 1
        self.boomerang_active = False
        self.boomerang_damage = 0
        self.boomerang_target = None

        # Add end turn button
        button_width = 200
        button_height = 50
        self.end_turn_button = pygame.Rect(
            self.screen.get_width() - button_width - 20,  # 20px from right edge
            self.screen.get_height() - button_height - 20,  # 20px from bottom edge
            button_width,
            button_height
        )

    def load_resources(self):
        # Load and scale background
        self.background = pygame.image.load("Raidpy/res/img/Stage_4_BG.webp")
        self.scaled_bg = pygame.transform.scale(self.background, (1920, 1080))
        self.background = None  # Free up original memory

        screen_width = self.screen.get_width()
        screen_height = self.screen.get_height()

        # Create characters
        # Cham Cham (left) - Add passive bonus damage initialization
        cham_cham_x = (screen_width // 3) - 125
        cham_cham_y = screen_height - 450
        self.cham_cham = Character("Farmer Cham Cham", 8725, 
                                 "Loading Screen/Farmer Cham Cham.png", 
                                 (cham_cham_x, cham_cham_y))
        # Initialize Cham Cham's passive bonus damage
        self.cham_cham.passive_bonus_damage = 0
        
        # Add passive display properties
        self.cham_cham.passive_display = {
            "icon": "⚔",
            "color": (255, 50, 50),  # Red
            "value": "0"
        }

        # Alice (right)
        alice_x = (screen_width * 2 // 3) - 125
        alice_y = screen_height - 450
        self.alice = Character("Farmer Alice", 11005,  # Updated HP
                             "Loading Screen/Farmer Alice.png", 
                             (alice_x, alice_y))

        # Crazy Farmer (top left)
        farmer_x = (screen_width // 3) - 125
        farmer_y = 50
        self.crazy_farmer = Character("Crazy Farmer", 20000,  # Updated HP
                                    "Raidpy/res/img/Crazy_Farmer.jpeg", 
                                    (farmer_x, farmer_y))

        # Hound (top right)
        hound_x = (screen_width * 2 // 3) - 125
        hound_y = 50
        self.hound = Character("Hound", 16500,  # Updated HP
                             "Raidpy/res/img/Hound.jpeg", 
                             (hound_x, hound_y))

        # Initialize Hound's passive counter damage
        self.hound.passive_counter_damage = 0
        
        # Add passive display for Hound
        self.hound.passive_display = {
            "icon": "🐕‍🦺",  # Angry dog emoji
            "color": (255, 100, 100),  # Reddish color
            "value": "0"  # Initial counter damage
        }

        # Create inventory
        self.inventory = Inventory((20, screen_height // 2 - 150))
        self.inventory.load_items(self.firebase)

        # Add battle log
        self.battle_log = BattleLog(self.screen)

        # Set up abilities
        self.setup_abilities()

        # Randomly decide who goes first
        self.current_turn = random.choice(["player", "enemy"])
        self.battle_log.add_message(f"⚔️ Battle Start! {self.current_turn.capitalize()} goes first!", "system")

        if self.current_turn == "enemy":
            self.waiting_for_turn = True

    def setup_abilities(self):
        # Cham Cham's abilities
        cham_cham_abilities = [
            ("Scratch", "Raidpy/res/img/Cham_A1.jpeg", 340, 0, 0, True),
            ("Fertilizer Heal", "Raidpy/res/img/Cham_A2.jpeg", 0, 0, 14, False),
            ("Seed Boomerang", "Raidpy/res/img/Cham_A3.jpeg", 100, 0, 8, True),
            ("Rapid Claws", "Raidpy/res/img/Cham_A4.jpeg", 340, 0, 26, True)
        ]

        # Add abilities with descriptions for Cham Cham
        for name, icon, damage, healing, cooldown, ends_turn in cham_cham_abilities:
            ability = Ability(name, icon, damage, healing, cooldown, ends_turn)
            if name == "Scratch":
                ability.description = f"Deal {damage} damage\nIncrease passive damage by 10\nNo cooldown"
            elif name == "Fertilizer Heal":
                ability.description = "Gain 35% lifesteal for 4 turns\nCooldown: 14 turns"
            elif name == "Seed Boomerang":
                ability.description = f"Deal {damage} damage twice (Scales with passive)\nEach hit reduces Fertilizer Heal cooldown by 2\nCooldown: 8 turns"
            elif name == "Rapid Claws":
                ability.description = f"Strike 6 times for {damage} damage\nEach hit increases passive damage by 10\nCooldown: 26 turns"
            self.cham_cham.add_ability(ability)

        # Alice's abilities
        alice_abilities = [
            ("Punish Pounce", "Raidpy/res/img/Alice_A1.webp", 200, 0, 6, True),  # Stun attack
            ("Thick Fur", "Raidpy/res/img/Alice_A2.webp", 0, 0, 11, True),  # Changed to end turn
            ("Bunny Hop", "Raidpy/res/img/Alice_A3.webp", 400, 0, 9, True),  # Bunny Hop
            ("Carrot Dinner", "Raidpy/res/img/Alice_A4.webp", 0, 1550, 17, False)  # New healing ability
        ]

        # Add abilities with descriptions for Alice
        for name, icon, damage, healing, cooldown, ends_turn in alice_abilities:
            ability = Ability(name, icon, damage, healing, cooldown, ends_turn)
            if name == "Punish Pounce":
                ability.description = (
                    "Deal 200 damage and stun target for 3 turns\n"
                    "Cooldown: 6 turns\n"
                    "Cooldown reduces by 2 when damaged"
                )
            elif name == "Thick Fur":
                ability.description = (
                    "Reduce damage taken by 40%\n"
                    "Duration: 6 turns\n"
                    "Cooldown: 11 turns"
                )
            elif name == "Bunny Hop":
                ability.description = (
                    "Bounce between enemies dealing increasing damage\n"
                    "Base damage: 400 (+100 per bounce)\n"
                    "Can bounce 1-6 times\n"
                    "Bounce chances: 100%, 80%, 55%, 40%, 20%, 10%\n"
                    "Cooldown: 9 turns"  # Updated cooldown
                )
            elif name == "Carrot Dinner":
                ability.description = (
                    "Restore 1550 HP\n"
                    "Doesn't end turn\n"
                    "Cooldown: 17 turns"
                )
            self.alice.add_ability(ability)

        # Crazy Farmer's abilities
        crazy_farmer_abilities = [
            ("Slash", "Raidpy/res/img/Crazy_Farmer_A1.webp", 400, 0, 0, True),  # AoE attack
            ("Drink Up!", "Raidpy/res/img/Crazy_Farmer_A2.webp", 0, 1000, 10, True),  # Heal + buff
            ("Sacrifice", "Raidpy/res/img/Crazy_Farmer_A3.webp", 0, 0, 15, True)  # New Sacrifice ability
        ]

        # Hound's abilities
        hound_abilities = [
            ("Bite", "Raidpy/res/img/Hound_A1.webp", 300, 0, 0, True),  # Basic attack
            ("Chase", "Raidpy/res/img/Hound_A2.webp", 0, 0, 8, True),  # Chase ability
            ("Bloodthirst", "Raidpy/res/img/Hound_A3.webp", 0, 0, 15, True)  # New Bloodthirst ability
        ]

        # Add abilities with descriptions for Crazy Farmer
        for name, icon, damage, healing, cooldown, ends_turn in crazy_farmer_abilities:
            ability = Ability(name, icon, damage, healing, cooldown, ends_turn)
            if name == "Slash":
                ability.description = "Deal 400 damage to all enemies\nNo cooldown"
            elif name == "Drink Up!":
                ability.description = "Heal for 1000 HP\nGain 20% increased damage for 4 turns\nCooldown: 10 turns"
            elif name == "Sacrifice":
                ability.description = (
                    "Sacrifice 20% of current HP\n"
                    "Heal Hound for the sacrificed amount\n"
                    "Cooldown: 15 turns"
                )
            self.crazy_farmer.add_ability(ability)

        # Add abilities with descriptions for Hound
        for name, icon, damage, healing, cooldown, ends_turn in hound_abilities:
            ability = Ability(name, icon, damage, healing, cooldown, ends_turn)
            if name == "Bite":
                ability.description = (
                    "Deal 300 damage\n"
                    "40% chance to apply Bleed for 5 turns\n"
                    "Bleed: Deal 1% max HP damage per turn\n"
                    "Successful bleed reduces cooldown by 2\n"
                    "No cooldown"
                )
            elif name == "Chase":
                ability.description = (
                    "Become untargetable and gain 25% increased damage\n"
                    "Duration: 4 turns\n"
                    "Cooldown: 8 turns"
                )
            elif name == "Bloodthirst":
                ability.description = (
                    "Gain 20% lifesteal\n"
                    "Duration: 7 turns\n"
                    "Cooldown: 15 turns"
                )
            self.hound.add_ability(ability)

        # Add initial abilities at start
        self.crazy_farmer.abilities[0].use()  # Start with Slash ready
        # self.hound.abilities[0].use()  # Start with Bite ready

    def draw(self):
        # Use pre-scaled background
        self.screen.blit(self.scaled_bg, (0, 0))
        
        current_time = pygame.time.get_ticks()
        
        # Cache common calculations
        damage_flash_active = {
            "cham_cham": current_time - self.damage_flash["cham_cham"] < self.damage_flash_duration,
            "alice": current_time - self.damage_flash["alice"] < self.damage_flash_duration,
            "crazy_farmer": current_time - self.damage_flash["crazy_farmer"] < self.damage_flash_duration,
            "hound": current_time - self.damage_flash["hound"] < self.damage_flash_duration
        }
        
        # Pre-render common surfaces
        flash_surface = pygame.Surface((250, 350), pygame.SRCALPHA)
        flash_surface.fill((255, 0, 0, 128))
        
        # Draw characters with optimized flash effect
        # Draw Cham Cham
        if damage_flash_active["cham_cham"]:
            self.screen.blit(self.cham_cham.image, self.cham_cham.position)
            self.screen.blit(flash_surface, self.cham_cham.position)
        else:
            self.screen.blit(self.cham_cham.image, self.cham_cham.position)
        self.draw_hp_bar(self.cham_cham)
        if self.cham_cham.buffs:
            buff_start_x = self.cham_cham.position[0] + 10
            buff_start_y = self.cham_cham.position[1] + 10
            for i, buff in enumerate(self.cham_cham.buffs):
                buff.draw(self.screen, (buff_start_x, buff_start_y + i * 45))
        
        # Draw Alice
        if damage_flash_active["alice"]:
            self.screen.blit(self.alice.image, self.alice.position)
            self.screen.blit(flash_surface, self.alice.position)
        else:
            self.screen.blit(self.alice.image, self.alice.position)
        self.draw_hp_bar(self.alice)
        if self.alice.buffs:
            buff_start_x = self.alice.position[0] + 10
            buff_start_y = self.alice.position[1] + 10
            for i, buff in enumerate(self.alice.buffs):
                buff.draw(self.screen, (buff_start_x, buff_start_y + i * 45))

        # Draw Crazy Farmer if exists and alive
        if self.crazy_farmer and self.crazy_farmer.current_hp > 0:
            if damage_flash_active["crazy_farmer"]:
                self.screen.blit(self.crazy_farmer.image, self.crazy_farmer.position)
                self.screen.blit(flash_surface, self.crazy_farmer.position)
            else:
                self.screen.blit(self.crazy_farmer.image, self.crazy_farmer.position)
            self.draw_hp_bar(self.crazy_farmer)
            if self.crazy_farmer.buffs:
                buff_start_x = self.crazy_farmer.position[0] + 10
                buff_start_y = self.crazy_farmer.position[1] + 10
                for i, buff in enumerate(self.crazy_farmer.buffs):
                    buff.draw(self.screen, (buff_start_x, buff_start_y + i * 45))
        
        # Draw Hound if exists and alive
        if self.hound and self.hound.current_hp > 0:
            if damage_flash_active["hound"]:
                self.screen.blit(self.hound.image, self.hound.position)
                self.screen.blit(flash_surface, self.hound.position)
            else:
                self.screen.blit(self.hound.image, self.hound.position)
            self.draw_hp_bar(self.hound)
            if self.hound.buffs:
                buff_start_x = self.hound.position[0] + 10
                buff_start_y = self.hound.position[1] + 10
                for i, buff in enumerate(self.hound.buffs):
                    buff.draw(self.screen, (buff_start_x, buff_start_y + i * 45))
        
        # Draw Cham Cham's abilities
        cham_cham_ability_y = self.cham_cham.position[1] + self.cham_cham.image.get_height() + 35
        cham_cham_ability_start_x = self.cham_cham.position[0] + (self.cham_cham.image.get_width() // 2) - 120
        
        for i, ability in enumerate(self.cham_cham.abilities):
            ability_pos = (cham_cham_ability_start_x + i * 60, cham_cham_ability_y)
            ability.draw_icon(self.screen, ability_pos)
            ability.draw_tooltip(self.screen, ability_pos)
        
        # Draw Alice's abilities
        alice_ability_y = self.alice.position[1] + self.alice.image.get_height() + 35
        alice_ability_start_x = self.alice.position[0] + (self.alice.image.get_width() // 2) - (120)
        
        for i, ability in enumerate(self.alice.abilities):
            ability_pos = (alice_ability_start_x + i * 60, alice_ability_y)
            ability.draw_icon(self.screen, ability_pos)
            ability.draw_tooltip(self.screen, ability_pos)

        # Draw inventory
        self.inventory.draw(self.screen)
        
        # Draw turn counter
        self.draw_turn_counter()
        
        # Draw stage name
        font = pygame.font.Font(None, 36)
        stage_text = font.render("Farm Raid - Stage 4", True, (255, 255, 255))
        self.screen.blit(stage_text, (10, 10))
        
        # Draw battle log
        self.battle_log.draw()
        
        # Draw targeting icons if in targeting mode
        if self.targeting_mode:
            for target in self.targets:
                target.draw(self.screen)
        
        # Draw healing particles
        for particle in self.healing_particles[:]:
            particle_surface = pygame.Surface((particle['size'], particle['size']), pygame.SRCALPHA)
            pygame.draw.circle(
                particle_surface,
                particle['color'],
                (particle['size']//2, particle['size']//2),
                particle['size']//2
            )
            self.screen.blit(particle_surface, (int(particle['x']), int(particle['y'])))
            
        # Draw loot notifications
        self.loot_notification.update_and_draw(self.screen)

        # Draw tooltips last (on top of everything)
        TooltipManager().draw_all(self.screen)

        # Draw info window if it exists
        if hasattr(self, 'info_window'):
            self.screen.blit(self.info_window['surface'], self.info_window['position'])

        # Draw Cham Cham's passive bonus if it exists
        if hasattr(self.cham_cham, 'passive_bonus_damage') and self.cham_cham.passive_bonus_damage > 0:
            self.draw_passive_bonus(self.cham_cham)

        # Draw Hound's passive counter damage display if he exists and is alive
        if self.hound and self.hound.current_hp > 0:
            self.draw_passive_bonus(self.hound)

        # Draw end turn button if it's player's turn
        if self.current_turn == "player":
            # Draw button background
            pygame.draw.rect(self.screen, (60, 60, 60), self.end_turn_button, border_radius=10)
            pygame.draw.rect(self.screen, (100, 100, 100), self.end_turn_button, 2, border_radius=10)
            
            # Draw button text
            font = pygame.font.Font(None, 36)
            text = font.render("End Turn", True, (255, 255, 255))
            text_rect = text.get_rect(center=self.end_turn_button.center)
            self.screen.blit(text, text_rect)

        # Draw victory screen if showing
        if hasattr(self, 'show_victory_screen') and self.show_victory_screen:
            # Create semi-transparent overlay
            overlay = pygame.Surface((self.screen.get_width(), self.screen.get_height()))
            overlay.fill((0, 0, 0))
            overlay.set_alpha(128)
            self.screen.blit(overlay, (0, 0))
            
            # Create victory panel
            panel_width = 400
            panel_height = 300  # Increased height to accommodate both buttons
            panel_x = (self.screen.get_width() - panel_width) // 2
            panel_y = (self.screen.get_height() - panel_height) // 2
            
            # Draw panel background
            pygame.draw.rect(self.screen, (30, 30, 30), 
                            (panel_x, panel_y, panel_width, panel_height))
            pygame.draw.rect(self.screen, (100, 100, 100), 
                            (panel_x, panel_y, panel_width, panel_height), 2)
            
            # Draw victory text
            font = pygame.font.Font(None, 48)
            victory_text = font.render("Victory!", True, (255, 255, 255))
            text_rect = victory_text.get_rect(centerx=self.screen.get_width()//2, 
                                            centery=panel_y + 50)
            self.screen.blit(victory_text, text_rect)
            
            # Draw "Start Stage 5" button
            if hasattr(self, 'next_stage_button'):
                pygame.draw.rect(self.screen, (0, 100, 200), self.next_stage_button)
                pygame.draw.rect(self.screen, (100, 200, 255), self.next_stage_button, 2)
                
                button_text = font.render("Start Stage 5", True, (255, 255, 255))
                text_rect = button_text.get_rect(center=self.next_stage_button.center)
                self.screen.blit(button_text, text_rect)
            
            # Draw "Stage Select" button
            if hasattr(self, 'stage_select_button'):
                pygame.draw.rect(self.screen, (0, 100, 200), self.stage_select_button)
                pygame.draw.rect(self.screen, (100, 200, 255), self.stage_select_button, 2)
                
                button_text = font.render("Stage Select", True, (255, 255, 255))
                text_rect = button_text.get_rect(center=self.stage_select_button.center)
                self.screen.blit(button_text, text_rect)

    def draw_hp_bar(self, character):
        """Draw HP bar for a character"""
        # Calculate HP percentage
        hp_percentage = character.current_hp / character.max_hp
        
        # HP bar position (just below character sprite)
        bar_x = character.position[0]
        bar_y = character.position[1] + character.image.get_height() + 10
        
        # Draw background
        pygame.draw.rect(self.screen, (0, 0, 0, 180), 
                        (bar_x - 2, bar_y - 2, 254, 24), 
                        border_radius=10)
        
        # Calculate HP bar color based on percentage
        if hp_percentage > 0.6:
            main_color = (46, 204, 113)  # Green
        elif hp_percentage > 0.3:
            main_color = (241, 196, 15)  # Yellow
        else:
            main_color = (231, 76, 60)  # Red
        
        # Draw main HP bar
        current_hp_width = max(250 * hp_percentage, 0)
        if current_hp_width > 0:
            pygame.draw.rect(self.screen, main_color,
                            (bar_x, bar_y, current_hp_width, 20),
                            border_radius=8)
        
        # Draw HP text with shadow
        font = pygame.font.Font(None, 24)
        hp_text = f"{character.current_hp}/{character.max_hp}"
        text_surface = font.render(hp_text, True, (255, 255, 255))
        text_pos = (bar_x + 125 - text_surface.get_width()//2,
                    bar_y + 10 - text_surface.get_height()//2)
        
        # Draw text shadow
        shadow_surface = font.render(hp_text, True, (0, 0, 0))
        self.screen.blit(shadow_surface, (text_pos[0] + 1, text_pos[1] + 1))
        self.screen.blit(text_surface, text_pos) 

    def handle_events(self, events):
        for event in events:
            # Check for victory screen button click
            if hasattr(self, 'show_victory_screen') and self.show_victory_screen:
                if event.type == pygame.MOUSEBUTTONDOWN:
                    if hasattr(self, 'next_stage_button') and self.next_stage_button.collidepoint(event.pos):
                        self.completed = True
                        self.running = False
                        return True
                    elif hasattr(self, 'stage_select_button') and self.stage_select_button.collidepoint(event.pos):
                        self.completed = False  # Don't proceed to next stage
                        self.running = False  # Stop running current stage
                        return True

            # Add debug menu handling
            if event.type == pygame.MOUSEBUTTONDOWN and self.paused:
                menu_items = self.draw_menu()
                if self.menu_state == "debug":
                    if menu_items.get("damage_enemies") and menu_items["damage_enemies"].collidepoint(event.pos):
                        # Set both enemies HP to 1
                        if self.crazy_farmer.current_hp > 1:
                            self.crazy_farmer.current_hp = 1
                        if self.hound.current_hp > 1:
                            self.hound.current_hp = 1
                        self.battle_log.add_message("Debug: Set both enemies HP to 1!", "system")
                        return True

            # Handle info window events
            if hasattr(self, 'info_window'):
                if event.type == pygame.MOUSEBUTTONDOWN:
                    mouse_pos = event.pos
                    window_pos = self.info_window['position']
                    
                    # Check if clicked close button (X)
                    close_rect = pygame.Rect(
                        window_pos[0] + self.info_window['size'][0] - 40,  # 40 pixels from right edge
                        window_pos[1],  # Top of window
                        40, 40  # Size of close button area
                    )
                    
                    if close_rect.collidepoint(mouse_pos):
                        delattr(self, 'info_window')  # Remove the info window
                        return True

            # Handle inventory dragging
            if event.type == pygame.MOUSEBUTTONDOWN:
                # Check if clicked on inventory header
                inventory_header = pygame.Rect(
                    self.inventory.position[0],
                    self.inventory.position[1],
                    self.inventory.size[0],
                    40  # Header height
                )
                if inventory_header.collidepoint(event.pos):
                    self.dragging_inventory = True
                    self.inventory_drag_offset = (
                        self.inventory.position[0] - event.pos[0],
                        self.inventory.position[1] - event.pos[1]
                    )
                    return True

                # Handle right-click for character info
                if event.type == pygame.MOUSEBUTTONDOWN and event.button == 3:  # Right click
                    # Check if clicked on any living character
                    characters = [
                        char for char in [self.cham_cham, self.alice, self.crazy_farmer, self.hound]
                        if char is not None  # Only include characters that exist
                    ]
                    
                    for character in characters:
                        char_rect = pygame.Rect(
                            character.position[0],
                            character.position[1],
                            character.image.get_width(),
                            character.image.get_height()
                        )
                        if char_rect.collidepoint(event.pos):
                            self.show_character_info(character)
                            return True

            elif event.type == pygame.MOUSEBUTTONUP:
                self.dragging_inventory = False

            elif event.type == pygame.MOUSEMOTION and self.dragging_inventory:
                new_x = event.pos[0] + self.inventory_drag_offset[0]
                new_y = event.pos[1] + self.inventory_drag_offset[1]
                
                # Keep inventory within screen bounds
                new_x = max(0, min(new_x, self.screen.get_width() - self.inventory.size[0]))
                new_y = max(0, min(new_y, self.screen.get_height() - self.inventory.size[1]))
                
                self.inventory.position = [new_x, new_y]
                return True

            # Handle loot notification clicks first
            if event.type == pygame.MOUSEBUTTONDOWN:
                if self.loot_notification.handle_event(event):
                    return True

            # Handle battle log events
            if not (self.dragging_inventory or self.dragging_battle_log):
                if self.battle_log.handle_event(event):
                    return True

            # Handle ability clicks
            if event.type == pygame.MOUSEBUTTONDOWN and event.button == 1:  # Left click
                if self.current_turn == "player" and not self.waiting_for_turn:
                    if self.targeting_mode:
                        if self.handle_targeting_click(event.pos):
                            return True
                    else:
                        if self.handle_ability_clicks(event.pos):
                            return True

            # Handle inventory item clicks
            if event.type == pygame.MOUSEBUTTONDOWN:
                for slot in self.inventory.slots:
                    slot_rect = pygame.Rect(
                        self.inventory.position[0] + slot.position[0],
                        self.inventory.position[1] + slot.position[1],
                        50, 50
                    )
                    if slot_rect.collidepoint(event.pos) and slot.item:
                        if self.use_item(slot.item):
                            self.inventory.load_items(self.firebase)
                            return True

            # Handle parent class events
            if super().handle_events([event]):
                return True

            # Handle end turn button click
            if event.type == pygame.MOUSEBUTTONDOWN:
                if self.current_turn == "player" and self.end_turn_button.collidepoint(event.pos):
                    self.end_player_turn()
                    return True

        return False

    def handle_targeting_click(self, pos):
        """Handle clicks while in targeting mode"""
        if not self.targeting_mode:
            return False
        
        for target in self.targets:
            if target.rect.collidepoint(pos):
                self.targeting_mode = False
                ability = self.current_ability
                
                if ability.use():  # Start cooldown only if successfully used
                    if self.current_character == self.alice:
                        self.execute_alice_ability(ability, target.character)
                    elif self.current_character == self.cham_cham:
                        self.execute_cham_cham_ability(ability, target.character)
                
                self.current_ability = None
                self.targets.clear()
                return True
        
        # Click outside targets - cancel targeting
        self.targeting_mode = False
        self.current_ability = None
        self.targets.clear()
        return True

    def handle_ability_clicks(self, pos):
        """Handle clicks on character abilities"""
        if self.current_turn != "player" or self.waiting_for_turn:
            return False

        # Check Cham Cham's abilities
        cham_cham_ability_y = self.cham_cham.position[1] + self.cham_cham.image.get_height() + 35
        cham_cham_ability_start_x = self.cham_cham.position[0] + (self.cham_cham.image.get_width() // 2) - (120)
        
        for i, ability in enumerate(self.cham_cham.abilities):
            ability_rect = pygame.Rect(
                cham_cham_ability_start_x + i * 60,
                cham_cham_ability_y,
                50, 50
            )
            
            if ability_rect.collidepoint(pos):
                if ability.current_cooldown > 0:
                    self.battle_log.add_message(
                        f"{ability.name} is on cooldown for {ability.current_cooldown} turns!",
                        "warning"
                    )
                    return True

                if ability.name == "Fertilizer Heal":  # No targeting needed
                    if ability.use():
                        self.battle_log.add_message(
                            f"{self.cham_cham.name} uses Fertilizer Heal!",
                            "system"
                        )
                        buff = Buff("Fertilizer", ability.icon_path, 4, "lifesteal", 0.35)
                        self.cham_cham.add_buff(buff)
                        self.battle_log.add_message(
                            f"{self.cham_cham.name} gains Lifesteal for 4 turns!",
                            "system"
                        )
                        if ability.ends_turn:
                            self.end_player_turn()
                    return True
                else:  # Abilities that need targeting
                    self.current_character = self.cham_cham
                    self.setup_targeting(ability)
                    return True

        # Check Alice's abilities
        alice_ability_y = self.alice.position[1] + self.alice.image.get_height() + 35
        alice_ability_start_x = self.alice.position[0] + (self.alice.image.get_width() // 2) - (120)
        
        for i, ability in enumerate(self.alice.abilities):
            ability_rect = pygame.Rect(
                alice_ability_start_x + i * 60,
                alice_ability_y,
                50, 50
            )
            
            if ability_rect.collidepoint(pos):
                if ability.current_cooldown > 0:
                    self.battle_log.add_message(
                        f"{ability.name} is on cooldown for {ability.current_cooldown} turns!",
                        "warning"
                    )
                    return True

                if ability.name in ["Bunny Hop", "Thick Fur", "Carrot Dinner"]:  # Added Carrot Dinner
                    # Execute ability immediately without targeting
                    if ability.use():
                        self.execute_alice_ability(ability, None)
                    return True
                elif ability.name == "Punish Pounce":
                    self.current_character = self.alice
                    self.setup_targeting(ability)
                    return True

        return False

    def setup_targeting(self, ability):
        """Set up targeting mode for an ability"""
        self.targeting_mode = True
        self.current_ability = ability
        self.targets = []
        
        # Clear existing targets
        self.targets.clear()
        
        # Add targeting for each valid target
        if self.current_character == self.alice and ability.name == "Punish Pounce":
            # Add targeting for living enemies that aren't untargetable
            for enemy in [self.crazy_farmer, self.hound]:
                if enemy and enemy.current_hp > 0 and not enemy.buff_effects.get("untargetable", False):
                    self.targets.append(Target(
                        enemy,
                        None,
                        (enemy.position[0] + 100, enemy.position[1] + 200)
                    ))
        elif self.current_character == self.cham_cham:
            # Add targeting for Cham Cham's abilities
            for enemy in [self.crazy_farmer, self.hound]:
                if enemy and enemy.current_hp > 0 and not enemy.buff_effects.get("untargetable", False):
                    self.targets.append(Target(
                        enemy,
                        None,
                        (enemy.position[0] + 100, enemy.position[1] + 200)
                    ))
        
        if not self.targets:
            self.targeting_mode = False
            self.current_ability = None
            self.battle_log.add_message("No valid targets available!", "warning")

    def execute_ability(self, ability, target):
        """Execute Cham Cham's abilities"""
        if target is None:
            return

        if ability.name == "Scratch":
            total_damage = ability.damage + self.cham_cham.passive_bonus_damage
            damage_dealt = self.take_damage(target, total_damage)
            if damage_dealt:
                # Only increment passive after successful attack
                self.cham_cham.passive_bonus_damage += 10
                self.battle_log.add_message(
                    f"{self.cham_cham.name} uses Scratch! Deals {damage_dealt} damage!",
                    "damage"
                )
                self.battle_log.add_message(
                    f"Passive damage increased by 10! (Current: +{self.cham_cham.passive_bonus_damage})",
                    "system"
                )
                
                # Handle lifesteal
                if self.cham_cham.buff_effects.get("lifesteal", 0) > 0:
                    lifesteal_amount = int(damage_dealt * self.cham_cham.buff_effects["lifesteal"])
                    if lifesteal_amount > 0:
                        healing_done = self.cham_cham.heal(lifesteal_amount)
                        if healing_done:
                            self.battle_log.add_message(
                                f"{self.cham_cham.name} heals for {healing_done} HP from lifesteal!",
                                "heal"
                            )
                            self.create_healing_effect(self.cham_cham.position)

        elif ability.name == "Fertilizer Heal":
            # Apply lifesteal buff
            buff = Buff(
                "Fertilizer",
                ability.icon_path,
                4,  # 4 turns duration
                "lifesteal",
                0.35  # 35% lifesteal
            )
            # Remove any existing lifesteal buff
            self.cham_cham.buffs = [b for b in self.cham_cham.buffs if b.effect_type != "lifesteal"]
            self.cham_cham.add_buff(buff)
            self.battle_log.add_message(
                f"{self.cham_cham.name} gains 35% lifesteal for 4 turns!",
                "system"
            )

        elif ability.name == "Seed Boomerang":
            total_damage = ability.damage + self.cham_cham.passive_bonus_damage
            damage_dealt = self.take_damage(target, total_damage)
            if damage_dealt:
                self.battle_log.add_message(
                    f"{self.cham_cham.name} throws Seed Boomerang! Deals {damage_dealt} damage!",
                    "damage"
                )
                
                # Apply lifesteal for initial hit
                if self.cham_cham.buff_effects["lifesteal"] > 0:
                    lifesteal_amount = int(damage_dealt * self.cham_cham.buff_effects["lifesteal"])
                    if lifesteal_amount > 0:
                        healing_done = self.cham_cham.heal(lifesteal_amount)
                        if healing_done:
                            self.battle_log.add_message(
                                f"{self.cham_cham.name} heals for {healing_done} HP from lifesteal!",
                                "heal"
                            )
                            self.create_healing_effect(self.cham_cham.position)
                
                # Reduce Ability2 cooldown by 2 on initial hit
                fertilizer_heal = self.cham_cham.abilities[1]
                if fertilizer_heal.current_cooldown > 0:
                    fertilizer_heal.current_cooldown = max(0, fertilizer_heal.current_cooldown - 2)
                    self.battle_log.add_message(
                        f"Boomerang hit reduces Fertilizer Heal cooldown by 2! (Current: {fertilizer_heal.current_cooldown})",
                        "system"
                    )
                
                # Set up return hit
                self.boomerang_active = True
                self.boomerang_damage = total_damage
                self.battle_log.add_message(
                    "The boomerang will return next turn!",
                    "system"
                )

        elif ability.name == "Rapid Claws":
            self.battle_log.add_message(
                f"{self.cham_cham.name} unleashes Rapid Claws!",
                "system"
            )
            for hit in range(6):
                total_damage = ability.damage + self.cham_cham.passive_bonus_damage
                damage_dealt = self.take_damage(target, total_damage)
                if damage_dealt:
                    # Only increment passive after successful hit
                    self.cham_cham.passive_bonus_damage += 10
                    self.battle_log.add_message(
                        f"Rapid Claws hits for {damage_dealt} damage!",
                        "damage"
                    )
                    self.battle_log.add_message(
                        f"Passive damage increased by 10! (Current: +{self.cham_cham.passive_bonus_damage})",
                        "system"
                    )
                    
                    # Apply lifesteal if active
                    if self.cham_cham.buff_effects["lifesteal"] > 0:
                        lifesteal_amount = int(damage_dealt * self.cham_cham.buff_effects["lifesteal"])
                        if lifesteal_amount > 0:
                            healing_done = self.cham_cham.heal(lifesteal_amount)
                            if healing_done:
                                self.battle_log.add_message(
                                    f"{self.cham_cham.name} heals for {healing_done} HP from lifesteal!",
                                    "heal"
                                )
                                self.create_healing_effect(self.cham_cham.position)

        if ability.ends_turn:
            self.end_player_turn() 

    def start_player_turn(self):
        """Start the player's turn"""
        self.current_turn = "player"
        self.waiting_for_turn = False
        
        # Update buffs at start of turn
        self.update_buffs()
        
        # Handle boomerang return hit
        if self.boomerang_active:
            # Find a random living enemy for return hit
            living_enemies = [enemy for enemy in [self.crazy_farmer, self.hound] 
                             if enemy and enemy.current_hp > 0]  # Add check for None
            if living_enemies:
                target = random.choice(living_enemies)
                damage_dealt = self.take_damage(target, self.boomerang_damage)
                if damage_dealt:
                    self.battle_log.add_message(
                        f"The returning boomerang deals {damage_dealt} damage to {target.name}!",
                        "damage"
                    )
                    
                    # Apply lifesteal on return hit if buff is active
                    if self.cham_cham.buff_effects["lifesteal"] > 0:
                        lifesteal_amount = int(damage_dealt * self.cham_cham.buff_effects["lifesteal"])
                        if lifesteal_amount > 0:
                            healing_done = self.cham_cham.heal(lifesteal_amount)
                            if healing_done:
                                self.battle_log.add_message(
                                    f"{self.cham_cham.name} heals for {healing_done} HP from lifesteal!",
                                    "heal"
                                )
                                self.create_healing_effect(self.cham_cham.position)
                
                # Reduce Fertilizer Heal cooldown
                fertilizer_heal = self.cham_cham.abilities[1]
                if fertilizer_heal.current_cooldown > 0:
                    fertilizer_heal.current_cooldown = max(0, fertilizer_heal.current_cooldown - 2)
                    self.battle_log.add_message(
                        f"Boomerang return hit reduces Fertilizer Heal cooldown by 2! (Current: {fertilizer_heal.current_cooldown})",
                        "system"
                    )
        
        self.boomerang_active = False
        self.boomerang_damage = 0
        self.boomerang_target = None

        # Update cooldowns
        self.update_cooldowns()
        
        # Enable abilities
        self.enable_abilities()
        
        self.battle_log.add_message(
            f"Turn {self.turn_counter} - Player's turn!",
            "turn"
        )

    def take_damage(self, target, amount, attacker=None):
        if target is None or amount <= 0:
            return 0

        # Check for dodge chance
        total_dodge = target.buff_effects.get("dodge_chance", 0)
        if total_dodge > 0 and random.random() < total_dodge:
            self.battle_log.add_message(
                f"{target.name} dodges the attack!",
                "system"
            )
            return 0

        # Apply damage taken multiplier from buffs
        damage_multiplier = target.buff_effects.get("damage_taken_multiplier", 1.0)
        final_damage = int(amount * damage_multiplier)

        # Store initial HP to check for death
        initial_hp = target.current_hp

        # Set damage flash
        if target == self.cham_cham:
            self.damage_flash["cham_cham"] = pygame.time.get_ticks()
        elif target == self.alice:
            self.damage_flash["alice"] = pygame.time.get_ticks()
        elif target == self.crazy_farmer:
            self.damage_flash["crazy_farmer"] = pygame.time.get_ticks()
        elif target == self.hound:
            self.damage_flash["hound"] = pygame.time.get_ticks()

        # Deal damage
        damage_dealt = target.take_damage(final_damage)
        
        # Check for death
        if target.current_hp <= 0:
            if target == self.crazy_farmer or target == self.hound:
                self.handle_enemy_death(target)
                # Check if both enemies are dead
                if ((not self.crazy_farmer or self.crazy_farmer.current_hp <= 0) and 
                    (not self.hound or self.hound.current_hp <= 0)):
                    self.handle_stage_victory()

        # Apply Hound's lifesteal if active and he's the attacker
        if attacker == self.hound and damage_dealt > 0 and attacker.current_hp > 0:
            if attacker.buff_effects.get("hound_lifesteal", 0) > 0:
                lifesteal_amount = int(damage_dealt * attacker.buff_effects["hound_lifesteal"])
                if lifesteal_amount > 0:
                    healing_done = attacker.heal(lifesteal_amount)
                    if healing_done:
                        self.battle_log.add_message(
                            f"{attacker.name} heals for {healing_done} HP from Bloodthirst!",
                            "heal"
                        )
                        self.create_healing_effect(attacker.position)

        # Start attack animation with the correct attacker
        if attacker and attacker.current_hp > 0:
            self.start_attack_animation(attacker, target)
            
            # Wait for attack animation to complete
            while self.attacking:
                current_time = pygame.time.get_ticks()
                elapsed = current_time - self.attack_start
                
                if elapsed >= self.attack_duration:
                    self.attacking = False
                    if self.attacker:
                        self.attacker.position = self.original_pos
                    self.attacker = None
                    self.target = None
                    self.original_pos = None
                else:
                    # Update animation
                    self.update_attack_animation()
                    # Draw current frame
                    self.draw()
                    pygame.display.flip()
                    self.clock.tick(60)
            
            # Handle Hound's counter-attack passive AFTER the initial attack animation completes
            if target == self.hound and damage_dealt > 0 and target.current_hp > 0:
                counter_damage = int(damage_dealt * 0.05)  # 5% of damage taken
                self.hound.passive_counter_damage = counter_damage  # Store for display
                
                # Play counter-attack animation
                self.play_counter_animation(self.hound, attacker)
                
                # Execute counter-attack
                counter_dealt = self.take_damage(attacker, counter_damage, attacker=self.hound)
                if counter_dealt > 0:
                    self.battle_log.add_message(
                        f"{self.hound.name} counter-attacks for {counter_dealt} damage!",
                        "damage"
                    )
                    # Update passive display
                    self.hound.passive_display["value"] = str(counter_dealt)

        return damage_dealt

    def create_healing_effect(self, position):
        """Create healing particle effect from Stage 1"""
        for _ in range(20):
            particle = {
                'x': position[0] + random.randint(0, 250),
                'y': position[1] + random.randint(0, 350),
                'dx': random.uniform(-2, 2),
                'dy': random.uniform(-5, -2),
                'lifetime': random.randint(45, 75),
                'size': random.randint(3, 8),
                'color': (
                    random.randint(0, 100),
                    random.randint(200, 255),
                    random.randint(0, 100),
                    255
                )
            }
            self.healing_particles.append(particle) 

    def start_attack_animation(self, attacker, target):
        """Start the attack animation"""
        if attacker and target:
            self.attacking = True
            self.attack_start = pygame.time.get_ticks()
            self.attacker = attacker
            self.target = target
            self.original_pos = list(attacker.position)  # Convert to list to avoid tuple issues

    def update_attack_animation(self):
        """Update the attack animation with a simple forward and back motion"""
        if not self.attacking or not self.attacker or not self.target or not self.original_pos:
            # Reset all animation state when any required component is missing
            self.attacking = False
            self.attacker = None
            self.target = None
            self.original_pos = None
            return

        current_time = pygame.time.get_ticks()
        elapsed = current_time - self.attack_start
        
        if elapsed >= self.attack_duration:
            # Animation complete - reset all animation state
            self.attacking = False
            self.attacker.position = self.original_pos
            self.attacker = None
            self.target = None
            self.original_pos = None
            return

        # Calculate progress (0 to 1)
        t = elapsed / self.attack_duration

        # Calculate movement
        if t < 0.5:  # Moving towards target
            progress = t * 2  # Scale to 0-1 for first half
            self.attacker.position = (
                self.original_pos[0] + (self.target.position[0] - self.original_pos[0]) * progress * 0.3,
                self.original_pos[1] + (self.target.position[1] - self.original_pos[1]) * progress * 0.3
            )
        else:  # Moving back
            progress = (t - 0.5) * 2  # Scale to 0-1 for second half
            target_pos = (
                self.original_pos[0] + (self.target.position[0] - self.original_pos[0]) * 0.3,
                self.original_pos[1] + (self.target.position[1] - self.original_pos[1]) * 0.3
            )
            self.attacker.position = (
                target_pos[0] + (self.original_pos[0] - target_pos[0]) * progress,
                target_pos[1] + (self.original_pos[1] - target_pos[1]) * progress
            )

    def update(self):
        if not self.paused:
            current_time = pygame.time.get_ticks()
            
            # Update attack animation
            self.update_attack_animation()
            
            # Boss turn with thinking delay
            if self.current_turn == "enemy" and self.waiting_for_turn:
                if not self.ai_thinking:
                    self.ai_thinking = True
                    self.ai_think_start = current_time
                elif current_time - self.ai_think_start >= self.ai_think_duration:
                    self.enemy_turn()  # Call enemy_turn after thinking delay
                    self.ai_thinking = False

            # Update healing particles
            for particle in self.healing_particles[:]:
                particle['x'] += particle['dx']
                particle['y'] += particle['dy']
                particle['dy'] *= 0.95
                particle['lifetime'] -= 1
                
                if particle['lifetime'] <= 0:
                    self.healing_particles.remove(particle)
                else:
                    alpha = int((particle['lifetime'] / 75) * 255)

    def end_player_turn(self):
        """End player turn and start enemy turn"""
        # Check for living enemies (handle None enemies)
        enemies_alive = [e for e in [self.crazy_farmer, self.hound] if e and e.current_hp > 0]
        
        if enemies_alive:
            # Rearrange remaining enemy to center position if one is dead
            if len(enemies_alive) == 1:
                remaining_enemy = enemies_alive[0]
                # Center position calculation
                center_x = (self.screen.get_width() // 2) - 125
                center_y = 50  # Keep same Y position
                remaining_enemy.position = (center_x, center_y)
            
            self.current_turn = "enemy"
            self.waiting_for_turn = True
            self.ai_thinking = True
            self.ai_think_start = pygame.time.get_ticks()
            
            self.battle_log.add_message(
                f"Turn {self.turn_counter} - Enemy's turn!",
                "turn"
            )
        else:
            # No living enemies, trigger victory
            self.handle_stage_victory()

    def update_cooldowns(self):
        """Update cooldowns for all abilities"""
        # Update Cham Cham's ability cooldowns
        for ability in self.cham_cham.abilities:
            if ability.current_cooldown > 0:
                ability.current_cooldown -= 1
                print(f"Updated {self.cham_cham.name}'s {ability.name} cooldown: {ability.current_cooldown}")

        # Update Alice's ability cooldowns
        for ability in self.alice.abilities:
            if ability.current_cooldown > 0:
                ability.current_cooldown -= 1
                print(f"Updated {self.alice.name}'s {ability.name} cooldown: {ability.current_cooldown}")

        # Update enemy ability cooldowns (handle None enemies)
        for enemy in [self.crazy_farmer, self.hound]:
            if enemy and enemy.current_hp > 0:  # Check if enemy exists and is alive
                for ability in enemy.abilities:
                    if ability.current_cooldown > 0:
                        ability.current_cooldown -= 1

        # Update inventory item cooldowns
        for slot in self.inventory.slots:
            if slot.cooldown > 0:
                slot.cooldown -= 1
                print(f"Updated inventory slot cooldown: {slot.cooldown}")

    def enable_abilities(self):
        """Enable abilities that are not on cooldown"""
        # Enable Cham Cham's abilities
        for ability in self.cham_cham.abilities:
            if ability.current_cooldown <= 0:
                ability.enabled = True
            else:
                ability.enabled = False

        # Enable Alice's abilities
        for ability in self.alice.abilities:
            if ability.current_cooldown <= 0:
                ability.enabled = True
            else:
                ability.enabled = False

        # Update ability display
        for character in [self.cham_cham, self.alice]:
            for ability in character.abilities:
                if hasattr(ability, 'enabled'):
                    if ability.enabled:
                        ability.icon.set_alpha(255)  # Full opacity for enabled abilities
                    else:
                        ability.icon.set_alpha(128)  # Semi-transparent for disabled abilities

    def update_buffs(self):
        """Update buffs for all characters"""
        # Update player buffs
        for character in [self.cham_cham, self.alice]:
            if character.current_hp > 0:
                buffs_to_remove = []
                for buff in character.buffs:
                    if buff.duration > 0:
                        buff.duration -= 1
                        if buff.duration <= 0:
                            buffs_to_remove.append(buff)
                            # Reset buff effects
                            if buff.effect_type == "lifesteal":
                                character.buff_effects["lifesteal"] = 0
                            elif buff.effect_type == "damage_taken_multiplier":
                                character.buff_effects["damage_taken_multiplier"] = 1.0

                # Remove expired buffs
                for buff in buffs_to_remove:
                    character.buffs.remove(buff)

        # Update enemy buffs (handle None enemies)
        for enemy in [self.crazy_farmer, self.hound]:
            if enemy and enemy.current_hp > 0:  # Check if enemy exists and is alive
                buffs_to_remove = []
                for buff in enemy.buffs:
                    if buff.duration > 0:
                        buff.duration -= 1
                        if buff.duration <= 0:
                            buffs_to_remove.append(buff)
                            # Reset buff effects
                            if buff.effect_type == "chase":
                                enemy.buff_effects["damage_multiplier"] = 1.0
                                enemy.buff_effects["untargetable"] = False
                                self.battle_log.add_message(
                                    f"{enemy.name}'s Chase effects have expired!",
                                    "system"
                                )
                            elif buff.effect_type == "hound_lifesteal":
                                enemy.buff_effects["hound_lifesteal"] = 0
                                self.battle_log.add_message(
                                    f"{enemy.name}'s Bloodthirst has expired!",
                                    "system"
                                )
                            elif buff.effect_type == "damage_multiplier":
                                enemy.buff_effects["damage_multiplier"] = 1.0
                            elif buff.effect_type == "damage_reduction":
                                enemy.buff_effects["damage_multiplier"] = 1.0

                # Remove expired buffs
                for buff in buffs_to_remove:
                    enemy.buffs.remove(buff)

    def execute_crazy_farmer_ability(self, ability):
        """Execute Crazy Farmer's abilities"""
        if ability.name == "Slash":
            # Calculate damage including buff
            base_damage = ability.damage
            damage_multiplier = self.crazy_farmer.buff_effects.get("damage_multiplier", 1.0)
            final_damage = int(base_damage * damage_multiplier)
            
            # Start attack animation before dealing damage
            self.start_attack_animation(self.crazy_farmer, self.target)
            
            # Deal damage to both player characters
            targets = [self.cham_cham, self.alice]
            for target in targets:
                if target.current_hp > 0:
                    damage_dealt = self.take_damage(target, final_damage, attacker=self.crazy_farmer)
                    if damage_dealt:
                        self.battle_log.add_message(
                            f"{self.crazy_farmer.name} slashes {target.name} for {damage_dealt} damage!",
                            "damage"
                        )
        
        elif ability.name == "Drink Up!":
            # Heal first
            healing_done = self.crazy_farmer.heal(ability.healing)
            if healing_done:
                self.battle_log.add_message(
                    f"{self.crazy_farmer.name} heals for {healing_done} HP!",
                    "heal"
                )
                self.create_healing_effect(self.crazy_farmer.position)
            
            # Apply Drunk and Mad buff
            # Remove any existing damage multiplier buff
            self.crazy_farmer.buffs = [b for b in self.crazy_farmer.buffs 
                                      if b.effect_type != "damage_multiplier"]
            
            drunk_buff = Buff(
                "Drunk and Mad",
                ability.icon_path,
                4,  # 4 turns duration
                "damage_multiplier",
                1.2  # 20% damage increase
            )
            drunk_buff.description = "Damage increased by 20%\nDuration: 4 turns"
            
            self.crazy_farmer.add_buff(drunk_buff)
            self.crazy_farmer.buff_effects["damage_multiplier"] = 1.2
            
            self.battle_log.add_message(
                f"{self.crazy_farmer.name} becomes Drunk and Mad! Damage increased by 20% for 4 turns!",
                "system"
            )

        elif ability.name == "Sacrifice":
            # Calculate sacrifice amount (20% of current HP)
            sacrifice_amount = int(self.crazy_farmer.current_hp * 0.2)
            
            # Damage self
            self.crazy_farmer.take_damage(sacrifice_amount)
            self.battle_log.add_message(
                f"{self.crazy_farmer.name} sacrifices {sacrifice_amount} HP!",
                "damage"
            )
            
            # Heal Hound if alive
            if self.hound.current_hp > 0:
                healing_done = self.hound.heal(sacrifice_amount)
                if healing_done > 0:
                    self.battle_log.add_message(
                        f"{self.hound.name} is healed for {healing_done} HP from the sacrifice!",
                        "heal"
                    )
                    self.create_healing_effect(self.hound.position)
            else:
                self.battle_log.add_message(
                    f"{self.hound.name} is dead! Sacrifice was wasted!",
                    "warning"
                )

    def execute_hound_ability(self, ability, target):
        """Execute Hound's abilities"""
        if ability.name == "Bite":
            # Start attack animation before dealing damage
            self.start_attack_animation(self.hound, target)
            
            # Calculate damage with damage multiplier from buffs
            base_damage = ability.damage
            damage_multiplier = self.hound.buff_effects.get("damage_multiplier", 1.0)
            final_damage = int(base_damage * damage_multiplier)
            
            damage_dealt = self.take_damage(target, final_damage, attacker=self.hound)
            if damage_dealt:
                self.battle_log.add_message(
                    f"{self.hound.name} bites {target.name} for {damage_dealt} damage!",
                    "damage"
                )
                
                # 40% chance to apply bleed
                if random.random() < 0.4:
                    # Remove any existing bleed
                    target.buffs = [b for b in target.buffs if b.effect_type != "bleed"]
                    
                    # Apply new bleed
                    bleed = Buff(
                        "Bleed",
                        ability.icon_path,
                        5,  # 5 turns duration
                        "bleed",
                        0.01  # 1% max HP damage per turn
                    )
                    bleed.description = f"Taking {int(target.max_hp * 0.01)} damage per turn\nDuration: {bleed.duration} turns"
                    target.add_buff(bleed)
                    self.battle_log.add_message(
                        f"{target.name} is bleeding! Will take {int(target.max_hp * 0.01)} damage per turn for 5 turns!",
                        "system"
                    )
                    
                    # Reduce cooldown by 2 when bleed is applied
                    ability.current_cooldown = max(0, ability.current_cooldown - 2)
                    self.battle_log.add_message(
                        f"Successful bleed reduces Bite cooldown by 2!",
                        "system"
                    )

        elif ability.name == "Chase":
            # Remove any existing chase buff
            self.hound.buffs = [b for b in self.hound.buffs if b.effect_type != "chase"]
            
            # Add single chase buff that handles both effects
            chase_buff = Buff(
                "Chase",
                ability.icon_path,
                4,  # 4 turns duration
                "chase",  # Single effect type
                {
                    "damage_multiplier": 1.25,  # 25% damage increase
                    "untargetable": True
                }
            )
            chase_buff.description = "Damage increased by 25%\nUntargetable\nDuration: 4 turns"
            self.hound.add_buff(chase_buff)
            
            # Apply both effects
            self.hound.buff_effects["damage_multiplier"] = 1.25
            self.hound.buff_effects["untargetable"] = True
            
            self.battle_log.add_message(
                f"{self.hound.name} enters Chase mode! Gains 25% damage and becomes untargetable for 4 turns!",
                "system"
            )

        elif ability.name == "Bloodthirst":
            # Remove any existing bloodthirst buff
            self.hound.buffs = [b for b in self.hound.buffs if b.effect_type != "hound_lifesteal"]
            
            # Add bloodthirst buff
            bloodthirst_buff = Buff(
                "Bloodthirst",
                ability.icon_path,
                7,  # 7 turns duration
                "hound_lifesteal",  # Different from Cham Cham's lifesteal
                0.2  # 20% lifesteal
            )
            bloodthirst_buff.description = "Lifesteal 20% of damage dealt\nDuration: 7 turns"
            self.hound.add_buff(bloodthirst_buff)
            self.hound.buff_effects["hound_lifesteal"] = 0.2
            
            self.battle_log.add_message(
                f"{self.hound.name} enters Bloodthirst! Gains 20% lifesteal for 7 turns!",
                "system"
            )

    def execute_alice_ability(self, ability, target):
        """Execute Alice's abilities"""
        if ability.name == "Punish Pounce":
            # Start attack animation with Alice as attacker
            self.start_attack_animation(self.alice, target)
            
            # Deal damage
            damage_dealt = self.take_damage(target, ability.damage, attacker=self.alice)  # Pass attacker
            if damage_dealt:
                self.battle_log.add_message(
                    f"{self.alice.name} uses Punish Pounce! Deals {damage_dealt} damage!",
                    "damage"
                )
                
                # Apply stun debuff
                # Remove any existing stun first
                target.buffs = [b for b in target.buffs if b.effect_type != "stun"]
                
                stun_buff = Buff(
                    "Stunned",
                    ability.icon_path,
                    3,  # 3 turns duration
                    "stun",
                    True
                )
                stun_buff.description = "Cannot use abilities\nDuration: 3 turns"
                target.add_buff(stun_buff)
                target.buff_effects["stun"] = True
                
                self.battle_log.add_message(
                    f"{target.name} is stunned for 3 turns!",
                    "system"
                )
        
        elif ability.name == "Thick Fur":
            # Remove any existing damage reduction buff
            self.alice.buffs = [b for b in self.alice.buffs if b.effect_type != "damage_reduction"]
            
            # Add damage reduction buff
            thick_fur_buff = Buff(
                "Thick Fur",
                ability.icon_path,
                6,  # 6 turns duration
                "damage_reduction",
                0.6  # Reduce damage to 60% (40% reduction)
            )
            thick_fur_buff.description = "Damage taken reduced by 40%\nDuration: 6 turns"
            self.alice.add_buff(thick_fur_buff)
            self.alice.buff_effects["damage_taken_multiplier"] = 0.6
            
            self.battle_log.add_message(
                f"{self.alice.name} activates Thick Fur! Damage taken reduced by 40% for 6 turns!",
                "system"
            )
            
            if ability.ends_turn:
                self.end_player_turn()

        elif ability.name == "Bunny Hop":
            # Get list of living enemies (handle None enemies)
            living_enemies = [enemy for enemy in [self.crazy_farmer, self.hound] 
                             if enemy and enemy.current_hp > 0]
            
            if not living_enemies:
                self.battle_log.add_message("No valid targets for Bunny Hop!", "warning")
                return

            # Start with random target for first bounce
            current_target = random.choice(living_enemies)
            bounce_count = 1
            current_damage = ability.damage
            bounce_chances = [1.0, 0.8, 0.55, 0.4, 0.2, 0.1]  # Success chances for each bounce
            
            while bounce_count <= 6:
                # Update living enemies list
                living_enemies = [enemy for enemy in [self.crazy_farmer, self.hound] 
                                if enemy and enemy.current_hp > 0]
                
                # Stop if no more targets
                if not living_enemies:
                    self.battle_log.add_message(
                        f"Bunny Hop chain ends - no more targets!",
                        "system"
                    )
                    break
                
                # Start bounce animation
                self.play_bounce_animation(self.alice, current_target)
                
                # Deal damage
                damage_dealt = self.take_damage(current_target, current_damage, attacker=self.alice)
                if damage_dealt:
                    self.battle_log.add_message(
                        f"Bounce {bounce_count}: {self.alice.name} bounces on {current_target.name} for {damage_dealt} damage!",
                        "damage"
                    )
                
                bounce_count += 1
                if bounce_count > 6:
                    break
                
                # Check if next bounce succeeds
                if random.random() > bounce_chances[bounce_count - 1]:
                    self.battle_log.add_message(
                        f"Bunny Hop chain breaks after {bounce_count-1} bounces!",
                        "system"
                    )
                    break
                
                # Increase damage for next bounce
                current_damage += 100
                
                # Select random target for next bounce (can be same target)
                current_target = random.choice(living_enemies)
            
            # End turn after Bunny Hop completes
            self.end_player_turn()

        elif ability.name == "Carrot Dinner":
            # Apply healing
            healing_done = self.alice.heal(ability.healing)
            if healing_done > 0:
                self.battle_log.add_message(
                    f"{self.alice.name} eats a carrot and heals for {healing_done} HP!",
                    "heal"
                )
                self.create_healing_effect(self.alice.position)

    def enemy_turn(self):
        """Handle enemy turn logic"""
        if self.current_turn != "enemy" or not self.waiting_for_turn:
            return

        # Get living enemies that aren't stunned (handle None enemies)
        living_enemies = [enemy for enemy in [self.crazy_farmer, self.hound] 
                        if enemy and enemy.current_hp > 0 and not enemy.buff_effects.get("stun", False)]
        
        if not living_enemies:
            # No living enemies, stage should be over
            self.handle_stage_victory()
            return

        # Choose a random enemy to act
        acting_enemy = random.choice(living_enemies)
        
        # Get available abilities (not on cooldown)
        available_abilities = [a for a in acting_enemy.abilities if a.current_cooldown == 0]
        
        if available_abilities:
            # Choose random ability
            ability = random.choice(available_abilities)
            
            if ability.use():  # Start cooldown
                # Crazy Farmer Logic
                if acting_enemy == self.crazy_farmer:
                    possible_targets = [self.cham_cham, self.alice]
                    living_targets = [t for t in possible_targets if t.current_hp > 0]
                    if living_targets:
                        target = random.choice(living_targets)
                        self.target = target
                        self.execute_crazy_farmer_ability(ability)

                # Hound Logic
                else:  # acting_enemy == self.hound
                    if ability.name == "Bite":  # Only Bite needs target
                        possible_targets = [self.cham_cham, self.alice]
                        living_targets = [t for t in possible_targets if t.current_hp > 0]
                        if living_targets:
                            target = random.choice(living_targets)
                            self.execute_hound_ability(ability, target)
                    else:  # Chase and Bloodthirst don't need targets
                        self.execute_hound_ability(ability, None)

        # Increment turn counter and start player turn
        self.turn_counter += 1
        self.start_player_turn()

    def execute_cham_cham_ability(self, ability, target):
        """Execute Cham Cham's abilities"""
        if ability.name == "Scratch":
            # Start attack animation with Cham Cham as attacker
            self.start_attack_animation(self.cham_cham, target)
            
            # Calculate damage including passive
            total_damage = ability.damage + self.cham_cham.passive_bonus_damage
            damage_dealt = self.take_damage(target, total_damage, attacker=self.cham_cham)
            if damage_dealt:
                # Increase passive damage
                self.cham_cham.passive_bonus_damage += 10
                
                self.battle_log.add_message(
                    f"{self.cham_cham.name} uses Scratch! Deals {damage_dealt} damage!",
                    "damage"
                )
                self.battle_log.add_message(
                    f"Passive damage increased by 10! (Current: +{self.cham_cham.passive_bonus_damage})",
                    "system"
                )
                
                # Apply lifesteal if active
                if self.cham_cham.buff_effects["lifesteal"] > 0:
                    lifesteal_amount = int(damage_dealt * self.cham_cham.buff_effects["lifesteal"])
                    if lifesteal_amount > 0:
                        healing_done = self.cham_cham.heal(lifesteal_amount)
                        if healing_done:
                            self.battle_log.add_message(
                                f"{self.cham_cham.name} heals for {healing_done} HP from lifesteal!",
                                "heal"
                            )
                            self.create_healing_effect(self.cham_cham.position)
    
        elif ability.name == "Seed Boomerang":
            # Start attack animation
            self.start_attack_animation(self.cham_cham, target)
            
            # Calculate damage including passive
            total_damage = ability.damage + self.cham_cham.passive_bonus_damage
            damage_dealt = self.take_damage(target, total_damage, attacker=self.cham_cham)
            
            if damage_dealt:
                self.battle_log.add_message(
                    f"{self.cham_cham.name} throws Seed Boomerang! Deals {damage_dealt} damage!",
                    "damage"
                )
                
                # Apply lifesteal for initial hit
                if self.cham_cham.buff_effects["lifesteal"] > 0:
                    lifesteal_amount = int(damage_dealt * self.cham_cham.buff_effects["lifesteal"])
                    if lifesteal_amount > 0:
                        healing_done = self.cham_cham.heal(lifesteal_amount)
                        if healing_done:
                            self.battle_log.add_message(
                                f"{self.cham_cham.name} heals for {healing_done} HP from lifesteal!",
                                "heal"
                            )
                            self.create_healing_effect(self.cham_cham.position)
                
                # Reduce Fertilizer Heal cooldown
                fertilizer_heal = self.cham_cham.abilities[1]
                if fertilizer_heal.current_cooldown > 0:
                    fertilizer_heal.current_cooldown = max(0, fertilizer_heal.current_cooldown - 2)
                    self.battle_log.add_message(
                        f"Boomerang hit reduces Fertilizer Heal cooldown by 2! (Current: {fertilizer_heal.current_cooldown})",
                        "system"
                    )
                
                # Set up return hit
                self.boomerang_active = True
                self.boomerang_damage = total_damage
                self.boomerang_target = target
                self.battle_log.add_message(
                    "The boomerang will return next turn!",
                    "system"
                )
    
        elif ability.name == "Rapid Claws":
            # Start attack animation
            self.start_attack_animation(self.cham_cham, target)
            
            self.battle_log.add_message(
                f"{self.cham_cham.name} unleashes Rapid Claws!",
                "system"
            )
            
            for hit in range(6):
                self.cham_cham.passive_bonus_damage += 10
                total_damage = ability.damage + self.cham_cham.passive_bonus_damage
                damage_dealt = self.take_damage(target, total_damage)
                
                if damage_dealt:
                    self.battle_log.add_message(
                        f"Rapid Claws hits for {damage_dealt} damage!",
                        "damage"
                    )
                    self.battle_log.add_message(
                        f"Passive damage increased by 10! (Current: +{self.cham_cham.passive_bonus_damage})",
                        "system"
                    )
                    
                    # Apply lifesteal if active
                    if self.cham_cham.buff_effects["lifesteal"] > 0:
                        lifesteal_amount = int(damage_dealt * self.cham_cham.buff_effects["lifesteal"])
                        if lifesteal_amount > 0:
                            healing_done = self.cham_cham.heal(lifesteal_amount)
                            if healing_done:
                                self.battle_log.add_message(
                                    f"{self.cham_cham.name} heals for {healing_done} HP from lifesteal!",
                                    "heal"
                                )
                                self.create_healing_effect(self.cham_cham.position)
    
        if ability.ends_turn:
            self.end_player_turn()

    def draw_passive_bonus(self, character):
        """Draw passive bonus display for characters"""
        if character == self.hound and character.current_hp > 0:
            # Position at bottom right of character with padding
            padding = 20
            try:
                font = pygame.font.SysFont("segoeuiemoji", 20)
            except:
                font = pygame.font.Font(None, 20)
            
            bonus_text = font.render(f"⚔️ {character.passive_counter_damage}", True, character.passive_display["color"])
            
            # Position at bottom right with padding
            bonus_pos = (
                character.position[0] + character.image.get_width() - bonus_text.get_width() - padding,
                character.position[1] + character.image.get_height() - bonus_text.get_height() - padding
            )
            
            # Create box rect
            box_padding = 8
            box_rect = pygame.Rect(
                bonus_pos[0] - box_padding,
                bonus_pos[1] - box_padding,
                bonus_text.get_width() + box_padding * 2,
                bonus_text.get_height() + box_padding * 2
            )
            
            # Draw neon glow effect
            for i in range(8):
                alpha = int(120 * (1 - i/8))
                glow_surface = pygame.Surface((box_rect.width + i*2, box_rect.height + i*2), pygame.SRCALPHA)
                pygame.draw.rect(glow_surface, (*character.passive_display["color"], alpha), 
                               (0, 0, glow_surface.get_width(), glow_surface.get_height()), 
                               border_radius=10)
                self.screen.blit(glow_surface, 
                               (box_rect.x - i, box_rect.y - i))
            
            # Draw main box
            box_surface = pygame.Surface((box_rect.width, box_rect.height), pygame.SRCALPHA)
            pygame.draw.rect(box_surface, (30, 30, 30, 230), 
                            (0, 0, box_rect.width, box_rect.height), 
                            border_radius=10)
            self.screen.blit(box_surface, box_rect)
            
            # Draw text
            self.screen.blit(bonus_text, bonus_pos)

            # Add tooltip for passive
            mouse_pos = pygame.mouse.get_pos()
            if box_rect.collidepoint(mouse_pos):
                tooltip_text = (
                    "Counter-Attack Passive\n"
                    "───────────────\n"
                    f"• Counter-attacks for 5% of damage taken\n"
                    f"• Last counter damage: {self.hound.passive_counter_damage}"
                )
                TooltipManager().start_hover(id(self.cham_cham), tooltip_text, mouse_pos)
            else:
                TooltipManager().stop_hover(id(self.cham_cham))

    def play_counter_animation(self, attacker, target):
        """Play a quick counter-attack animation"""
        original_pos = list(attacker.position)
        
        # Store animation start time
        counter_start = pygame.time.get_ticks()
        counter_duration = 300  # Faster than normal attack (300ms vs 500ms)
        
        while pygame.time.get_ticks() - counter_start < counter_duration:
            current_time = pygame.time.get_ticks()
            elapsed = current_time - counter_start
            progress = elapsed / counter_duration
            
            if progress < 0.3:  # Quick forward lunge
                t = progress / 0.3
                attacker.position = (
                    original_pos[0] + (target.position[0] - original_pos[0]) * t * 0.4,
                    original_pos[1] + (target.position[1] - original_pos[1]) * t * 0.4
                )
            elif progress < 0.7:  # Brief pause at extended position
                pass
            else:  # Quick return
                t = (progress - 0.7) / 0.3
                target_pos = (
                    original_pos[0] + (target.position[0] - original_pos[0]) * 0.4,
                    original_pos[1] + (target.position[1] - original_pos[1]) * 0.4
                )
                attacker.position = (
                    target_pos[0] + (original_pos[0] - target_pos[0]) * t,
                    target_pos[1] + (original_pos[1] - target_pos[1]) * t
                )
            # Draw the current frame
            self.draw()
            pygame.display.flip()
            self.clock.tick(60)
        
        # Ensure character returns to original position
        attacker.position = original_pos
        self.draw()
        pygame.display.flip()

    def play_bounce_animation(self, attacker, target):
        """Play a bouncing animation"""
        original_pos = list(attacker.position)
        
        # Store animation start time
        bounce_start = pygame.time.get_ticks()
        bounce_duration = 250  # Faster than normal attack (250ms vs 500ms)
        
        while pygame.time.get_ticks() - bounce_start < bounce_duration:
            current_time = pygame.time.get_ticks()
            elapsed = current_time - bounce_start
            progress = elapsed / bounce_duration
            
            # Calculate arc motion
            if progress < 0.5:  # Going up and forward
                t = progress * 2
                arc_height = math.sin(t * math.pi) * 200  # Maximum height of 200 pixels
                attacker.position = (
                    original_pos[0] + (target.position[0] - original_pos[0]) * t,
                    original_pos[1] + (target.position[1] - original_pos[1]) * t - arc_height
                )
            else:  # Coming down and forward
                t = (progress - 0.5) * 2
                arc_height = math.sin((1 - t) * math.pi) * 200
                target_pos = target.position
                attacker.position = (
                    target_pos[0] + (original_pos[0] - target_pos[0]) * t,
                    target_pos[1] + (original_pos[1] - target_pos[1]) * t - arc_height
                )
            # Draw the current frame
            self.draw()
            pygame.display.flip()
            self.clock.tick(60)
        
        # Ensure character returns to original position
        attacker.position = original_pos
        self.draw()
        pygame.display.flip()

    def show_character_info(self, character):
        """Show detailed character info window"""
        window_width = 1000  # Increased from 800
        window_height = 800  # Increased from 600
        
        self.info_window = {
            'character': character,
            'position': ((self.screen.get_width() - window_width) // 2,
                        (self.screen.get_height() - window_height) // 2),
            'size': (window_width, window_height),
            'dragging': False,
            'resizing': False
        }
        
        self.update_info_window()

    def update_info_window(self):
        """Update the character info window content"""
        if not hasattr(self, 'info_window'):
            return
        
        character = self.info_window['character']
        window_width, window_height = self.info_window['size']
        
        # Create info window surface
        info_window = pygame.Surface((window_width, window_height))
        info_window.fill((40, 40, 40))  # Dark gray background
        
        # Add semi-transparent border
        pygame.draw.rect(info_window, (80, 80, 80), info_window.get_rect(), 2)
        
        # Draw title bar
        pygame.draw.rect(info_window, (60, 60, 60), (0, 0, window_width, 40))
        
        # Draw character image on the left (larger)
        char_image = pygame.transform.scale(character.image, (300, 420))
        info_window.blit(char_image, (30, 60))
        
        # Draw character name at the top
        font = pygame.font.Font(None, 48)
        name_text = font.render(character.name, True, (255, 255, 255))
        info_window.blit(name_text, (30, 10))
        
        # Draw close button
        close_text = font.render("×", True, (255, 255, 255))
        close_rect = close_text.get_rect(topright=(window_width - 20, 10))
        info_window.blit(close_text, close_rect)
        
        # Right side content
        content_x = 360
        content_y = 60
        content_width = window_width - content_x - 30
        
        # Draw passives section first if character has one
        if character in [self.cham_cham, self.hound]:
            font = pygame.font.Font(None, 36)
            small_font = pygame.font.Font(None, 28)
            
            # Draw "Passive" header
            passive_text = font.render("Passive", True, (255, 200, 100))
            info_window.blit(passive_text, (content_x, content_y))
            content_y += 40
            
            if character == self.cham_cham:
                # Draw Cham Cham's passive info
                passive_desc = (
                    "Scratch Mastery\n"
                    "───────────────\n"
                    "• Each Scratch hit permanently increases damage by 10\n"
                    f"• Current bonus damage: +{character.passive_bonus_damage}"
                )
            elif character == self.hound:
                # Draw Hound's passive info
                passive_desc = (
                    "Counter-Attack\n"
                    "───────────────\n"
                    "• Counter-attacks for 5% of damage taken\n"
                    f"• Last counter damage: {character.passive_counter_damage}"
                )
            
            # Draw passive description
            for i, line in enumerate(passive_desc.split('\n')):
                desc_text = small_font.render(line, True, (200, 200, 200))
                info_window.blit(desc_text, (content_x + 15, content_y + i * 25))
            
            content_y += len(passive_desc.split('\n')) * 25 + 20  # Add spacing after passive section
        
        # Draw "Abilities" header and rest of the content
        font = pygame.font.Font(None, 36)
        small_font = pygame.font.Font(None, 28)
        
        # Draw "Abilities" header
        abilities_text = font.render("Abilities", True, (255, 200, 100))
        info_window.blit(abilities_text, (content_x, content_y))
        content_y += 40
        
        # Draw abilities
        for ability in character.abilities:
            # Draw ability icon
            icon_size = 50
            try:
                icon_image = pygame.image.load(ability.icon_path)
                icon_image = pygame.transform.scale(icon_image, (icon_size, icon_size))
                info_window.blit(icon_image, (content_x, content_y))
            except (AttributeError, pygame.error):
                # Fallback if icon loading fails
                icon_surface = pygame.Surface((icon_size, icon_size))
                icon_surface.fill((60, 60, 60))
                pygame.draw.rect(icon_surface, (100, 100, 100), icon_surface.get_rect(), 1)
                info_window.blit(icon_surface, (content_x, content_y))
            
            # Draw ability name and description
            ability_name = font.render(ability.name, True, (255, 255, 255))
            info_window.blit(ability_name, (content_x + icon_size + 15, content_y))
            
            # Word wrap description
            desc_words = ability.description.split()
            desc_lines = []
            current_line = []
            for word in desc_words:
                current_line.append(word)
                test_line = " ".join(current_line)
                if small_font.size(test_line)[0] > content_width - icon_size - 15:
                    desc_lines.append(" ".join(current_line[:-1]))
                    current_line = [word]
            if current_line:
                desc_lines.append(" ".join(current_line))
            
            # Draw description lines
            for i, line in enumerate(desc_lines):
                if content_y + 35 + i * 25 > window_height - 20:
                    break
                desc_text = small_font.render(line, True, (200, 200, 200))
                info_window.blit(desc_text, (content_x + icon_size + 15, content_y + 35 + i * 25))
            
            content_y += max(len(desc_lines) * 25 + 45, icon_size + 20)
            
            # Break if we're running out of space
            if content_y > window_height - 40:
                break
        
        # Update window surface
        self.info_window['surface'] = info_window

    def handle_enemy_death(self, enemy):
        """Handle enemy death and drops"""
        if not hasattr(enemy, 'drops_handled'):
            self.battle_log.add_message(f"{enemy.name} has been defeated!", "system")
            
            # Generate and handle drops
            drops = self.generate_enemy_drops(enemy)
            for drop in drops:
                item = next((item for item in self.items_data["items"] 
                            if item["id"] == drop["id"]), None)
                if item:
                    if self.firebase.update_inventory(drop["id"], drop["quantity"]):
                        self.loot_notification.add_notification(
                            item["name"],
                            drop["quantity"],
                            item.get("rarity", "common"),
                            item.get("icon_path", "res/img/default_icon.png")
                        )
                        self.battle_log.add_message(
                            f"{enemy.name} dropped {drop['quantity']}x {item['name']}!",
                            "loot"
                        )
            
            enemy.drops_handled = True
            
            # Apply death effects and remove enemy
            if enemy == self.hound:
                self.hound = None
            elif enemy == self.crazy_farmer:
                self.crazy_farmer = None
                
            # Check if both enemies are dead
            if (not self.crazy_farmer or self.crazy_farmer.current_hp <= 0) and \
               (not self.hound or self.hound.current_hp <= 0):
                self.handle_stage_victory()

    def generate_enemy_drops(self, enemy):
        """Generate drops for a specific enemy"""
        drops = []
        
        # Each enemy has a chance to drop health potions
        if random.random() < 0.45:  # 45% chance
            drops.append({
                "id": "health_potion",
                "quantity": random.randint(1, 2)
            })
        
        # Special drops based on enemy type
        if enemy == self.crazy_farmer:
            # Higher chance for health potions
            if random.random() < 0.75:
                drops.append({
                    "id": "health_potion",
                    "quantity": random.randint(2, 3)
                })
            
            # Chance for CM currency
            if random.random() < 0.35:
                drops.append({
                    "id": "cm",
                    "quantity": random.randint(2000, 4000)
                })
        
        elif enemy == self.hound:
            # Chance for FM currency
            if random.random() < 0.25:
                drops.append({
                    "id": "fm",
                    "quantity": random.randint(500, 1000)
                })
        
        # Debug print to verify drops
        print(f"{enemy.name} Drops:", drops)
        
        return drops

    def handle_stage_victory(self):
        """Handle stage completion when both enemies are defeated"""
        if not hasattr(self, 'victory_screen_shown'):
            self.victory_screen_shown = True
            self.show_victory_screen = True
            self.completed = True
            self.battle_log.add_message("Victory! Both enemies have been defeated!", "system")
            
            # Create buttons
            button_width = 200
            button_height = 50
            spacing = 20  # Space between buttons
            
            # Position both buttons vertically centered
            total_height = button_height * 2 + spacing
            start_y = (self.screen.get_height() - total_height) // 2
            
            # Create "Start Stage 5" button
            self.next_stage_button = pygame.Rect(
                (self.screen.get_width() - button_width) // 2,
                start_y,
                button_width,
                button_height
            )
            
            # Create "Stage Select" button
            self.stage_select_button = pygame.Rect(
                (self.screen.get_width() - button_width) // 2,
                start_y + button_height + spacing,
                button_width,
                button_height
            )