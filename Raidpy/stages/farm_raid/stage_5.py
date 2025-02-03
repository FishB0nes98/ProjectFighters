import pygame
from ..stage_base import Stage
from engine.character import Character
from engine.ability import Ability
from engine.inventory import Inventory
from engine.battle_log import BattleLog
from engine.buff import Buff
from engine.target import Target
from engine.loot_notification import LootNotification
from engine.tooltip import TooltipManager
import random
import math
import json
import os

class FarmStage5(Stage):
    def __init__(self, screen, firebase_manager):
        super().__init__(screen)
        self.firebase = firebase_manager
        self.ai_thinking = False
        self.ai_think_start = 0
        self.ai_think_duration = 2000
        self.damage_flash = {"player": 0, "boss": 0, "crows": 0}
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
        
        # Initialize crows list
        self.crows = []
        
        # Project root for loading items
        self.project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        self.items_path = os.path.join(self.project_root, 'data', 'items.json')
        
        try:
            with open(self.items_path, 'r') as f:
                self.items_data = json.load(f)
        except FileNotFoundError:
            print(f"Could not find items.json at {self.items_path}")
            self.items_data = {"items": []}

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
        self.background = pygame.image.load("Raidpy/res/img/Stage_5_BG.webp")
        self.scaled_bg = pygame.transform.scale(self.background, (1920, 1080))
        self.background = None  # Free up original memory

        screen_width = self.screen.get_width()
        screen_height = self.screen.get_height()

        # Create Raiden (player)
        raiden_x = (screen_width // 2) - 125
        raiden_y = screen_height - 450
        self.player = Character("Farmer Raiden", 8000, 
                              "Loading Screen/Farmer Raiden.png", 
                              (raiden_x, raiden_y))

        # Create Scarecrow (boss)
        boss_x = (screen_width // 2) - 125
        boss_y = 50
        self.boss = Character("Scarecrow", 15000,
                            "Raidpy/res/img/Scarecrow.webp",
                            (boss_x, boss_y))

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
            self.ai_thinking = False
            self.ai_think_start = 0
            # Make sure boss's Crow Call starts with no cooldown if boss goes first
            self.boss.abilities[0].current_cooldown = 0
            # Force boss turn immediately
            self.enemy_turn()

    def setup_abilities(self):
        # Raiden's abilities
        raiden_abilities = [
            ("Thunderball", "Raidpy/res/img/Raiden_A1.webp", 0, 0, 1, False),  # 1 turn cooldown, doesn't end turn
            ("Electric Shield", "Raidpy/res/img/Raiden_A2.webp", 0, 600, 9, True),  # 9 turn cooldown, shield ability
            ("Thundershock", "Raidpy/res/img/Raiden_A3.webp", 500, 0, 9, True),  # 9 turn cooldown
            ("Thunder Aura", "Raidpy/res/img/Raiden_A4.webp", 250, 0, 15, True),  # 15 turn cooldown, reflection ability
        ]

        # Add abilities with descriptions for Raiden
        for name, icon, damage, healing, cooldown, ends_turn in raiden_abilities:
            ability = Ability(name, icon, damage, healing, cooldown, ends_turn)
            if name == "Thunderball":
                ability.description = "Apply Thunder stack to target\nEach stack increases damage by 50%\nCooldown: 1 turn\nDoesn't end turn"
            elif name == "Electric Shield":
                ability.description = (
                    "Gain an electric shield for 3 turns\n"
                    "Shield amount: 600\n"
                    "Cooldown: 9 turns"
                )
            elif name == "Thundershock":
                ability.description = (
                    "Deal 500 damage to all enemies\n"
                    "• Damage increased by 50% per Thunder stack\n"
                    "• Example: 2 stacks = +100% damage\n"
                    "Cooldown: 9 turns"
                )
            elif name == "Thunder Aura":
                ability.description = (
                    "Surround yourself with electric energy for 5 turns\n"
                    "• Deals 250 damage to attackers\n"
                    "• Visible electric aura effect\n"
                    "Cooldown: 15 turns"
                )
            self.player.add_ability(ability)

        # Scarecrow's abilities
        scarecrow_abilities = [
            ("Crow Call", "Raidpy/res/img/Scarecrow_A1.webp", 0, 0, 3, True),  # 3 turn cooldown
            ("Fear", "Raidpy/res/img/Scarecrow_A2.webp", 0, 0, 5, True)  # Fear ability with 5 turn cooldown
        ]

        # Create abilities for Scarecrow
        for name, icon_path, damage, shield, cooldown, ends_turn in scarecrow_abilities:
            ability = Ability(name, icon_path, damage, shield, cooldown, ends_turn)
            
            # Create ability description
            if name == "Crow Call":
                ability.description = (
                    "Crow Call\n\n"
                    "Summons a crow that deals damage to Raiden\n"
                    "• Crow has peck ability that deals 400 damage\n"
                    "• Maximum 4 crows at once\n"
                    f"Cooldown: {cooldown} turns"
                )
            else:  # Fear ability
                ability.description = (
                    "Fear\n\n"
                    "Disables one of Raiden's abilities for 3 turns\n"
                    f"Cooldown: {cooldown} turns"
                )
            
            self.boss.add_ability(ability)

    def draw(self):
        # Use pre-scaled background
        self.screen.blit(self.scaled_bg, (0, 0))
        
        current_time = pygame.time.get_ticks()
        
        # Draw player with flash effect
        if current_time - self.damage_flash["player"] < self.damage_flash_duration:
            self.player.draw(self.screen, flash_color=(255, 0, 0, 128))
        else:
            self.player.draw(self.screen)
            
        # Draw player HP bar
        self.draw_hp_bar(self.player)

        # Draw boss with flash effect
        if self.boss.current_hp > 0:
            if current_time - self.damage_flash["boss"] < self.damage_flash_duration:
                self.boss.draw(self.screen, flash_color=(255, 0, 0, 128))
            else:
                self.boss.draw(self.screen)
            
            # Draw boss HP bar
            self.draw_hp_bar(self.boss)
            
            # Draw boss abilities
            boss_ability_y = self.boss.position[1] + self.boss.image.get_height() + 35
            boss_ability_start_x = self.boss.position[0] + (self.boss.image.get_width() // 2) - (60 // 2)  # Centered for single ability
            
            # Draw Crow Call ability icon and tooltip
            ability = self.boss.abilities[0]  # Crow Call
            ability_pos = (boss_ability_start_x, boss_ability_y)
            ability.draw_icon(self.screen, ability_pos)
            ability.draw_tooltip(self.screen, ability_pos)

        # Draw crows with flash effect
        for crow in self.crows:
            if crow.current_hp > 0:
                if current_time - self.damage_flash["crows"] < self.damage_flash_duration:
                    crow.draw(self.screen, flash_color=(255, 0, 0, 128))
                else:
                    crow.draw(self.screen)
                # Add this line to draw thunder stacks on crows
                if hasattr(crow, 'thunder_stacks') and crow.thunder_stacks > 0:
                    self.draw_thunder_stacks(crow)
                    
                # Draw crow ability (peck)
                crow_ability_y = crow.position[1] + crow.image.get_height() + 35
                crow_ability_start_x = crow.position[0] + (crow.image.get_width() // 2) - (60 // 2)  # Centered
                
                # Draw peck ability icon and tooltip
                ability = crow.abilities[0]  # peck ability
                ability_pos = (crow_ability_start_x, crow_ability_y)
                ability.draw_icon(self.screen, ability_pos)
                ability.draw_tooltip(self.screen, ability_pos)

        # Draw abilities
        ability_y = self.player.position[1] + self.player.image.get_height() + 35
        ability_start_x = (self.screen.get_width() // 2) - (120)  # Adjusted for 2 abilities, 60px each + spacing
        
        # Draw both ability icons and tooltips
        for i, ability in enumerate(self.player.abilities):
            ability_pos = (ability_start_x + i * 60, ability_y)
            
            # Check if ability is disabled
            is_disabled = any(buff.effect_type == "disable" and buff.target_ability == ability 
                             for buff in self.player.buffs)
            
            if is_disabled:
                # Create disabled effect (semi-transparent red overlay)
                disabled_surface = pygame.Surface((50, 50), pygame.SRCALPHA)
                disabled_surface.fill((255, 0, 0, 128))  # Semi-transparent red
                
                # Draw ability icon first
                ability.draw_icon(self.screen, ability_pos)
                # Then overlay the disabled effect
                self.screen.blit(disabled_surface, ability_pos)
            else:
                # Draw normally
                ability.draw_icon(self.screen, ability_pos)
            
            ability.draw_tooltip(self.screen, ability_pos)

        # Draw thunder stacks on boss if any
        if hasattr(self.boss, 'thunder_stacks') and self.boss.thunder_stacks > 0:
            self.draw_thunder_stacks(self.boss)

        # Draw inventory
        self.inventory.draw(self.screen)
        
        # Draw turn counter
        self.draw_turn_counter()
        
        # Draw stage name
        font = pygame.font.Font(None, 36)
        stage_text = font.render("Farm Raid - Stage 5", True, (255, 255, 255))
        self.screen.blit(stage_text, (10, 10))
        
        # Draw battle log
        self.battle_log.draw()
        
        # Draw targeting icons if in targeting mode
        if self.targeting_mode:
            for target in self.targets:
                target.draw(self.screen)
        
        # Draw healing particles
        for particle in self.healing_particles:
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

        # Draw tooltips last
        TooltipManager().draw_all(self.screen)

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

        # Draw Thunder Aura effect if active
        aura_buff = next((buff for buff in self.player.buffs if buff.effect_type == "thunder_aura"), None)
        if aura_buff:
            current_time = pygame.time.get_ticks()
            
            # Create multiple layers of electric effects
            for layer in range(3):  # 3 layers for depth
                base_radius = 140 + (layer * 20)
                offset = math.sin(current_time * 0.003) * 5
                
                num_particles = 12 + (layer * 4)
                angle = (current_time * (0.002 - layer * 0.0003)) % (2 * math.pi)
                
                for i in range(num_particles):
                    particle_angle = angle + (i * 2 * math.pi / num_particles)
                    wobble = math.sin(particle_angle * 3 + current_time * 0.005) * 10
                    radius = base_radius + wobble + offset
                    
                    x = self.player.position[0] + self.player.image.get_width() // 2 + math.cos(particle_angle) * radius
                    y = self.player.position[1] + self.player.image.get_height() // 2 + math.sin(particle_angle) * radius
                    
                    # Draw electric particle with size based on layer
                    particle_size = 8 - layer * 2
                    particle_surface = pygame.Surface((particle_size * 2, particle_size * 2), pygame.SRCALPHA)
                    
                    # Create gradient effect for particles (blue core with white outer glow)
                    alpha = 180 - (layer * 30)
                    pygame.draw.circle(particle_surface, (255, 255, 255, alpha), (particle_size, particle_size), particle_size)  # White outer glow
                    pygame.draw.circle(particle_surface, (0, 150, 255, alpha), (particle_size, particle_size), particle_size - 1)  # Blue core
                    
                    self.screen.blit(particle_surface, (x - particle_size, y - particle_size))
                    
                    # Draw electric arcs between particles
                    next_angle = particle_angle + (2 * math.pi / num_particles)
                    next_wobble = math.sin(next_angle * 3 + current_time * 0.005) * 10
                    next_radius = base_radius + next_wobble + offset
                    
                    next_x = self.player.position[0] + self.player.image.get_width() // 2 + math.cos(next_angle) * next_radius
                    next_y = self.player.position[1] + self.player.image.get_height() // 2 + math.sin(next_angle) * next_radius
                    
                    # Draw lightning-like connections with white highlights
                    for j in range(3):
                        offset_x = random.uniform(-2, 2)
                        offset_y = random.uniform(-2, 2)
                        # Draw white glow first
                        pygame.draw.line(
                            self.screen,
                            (255, 255, 255, 30),  # White glow
                            (x + offset_x, y + offset_y),
                            (next_x + offset_x, next_y + offset_y),
                            3
                        )
                        # Draw blue core
                        pygame.draw.line(
                            self.screen,
                            (0, 150, 255, 40),
                            (x + offset_x, y + offset_y),
                            (next_x + offset_x, next_y + offset_y),
                            2
                        )
            
            # Add lightning bolts
            if random.random() < 0.3:  # 30% chance each frame
                for _ in range(2):  # Draw 2 bolts
                    start_angle = random.uniform(0, 2 * math.pi)
                    start_radius = 160
                    start_x = self.player.position[0] + self.player.image.get_width() // 2 + math.cos(start_angle) * start_radius
                    start_y = self.player.position[1] + self.player.image.get_height() // 2 + math.sin(start_angle) * start_radius
                    
                    # Create zigzag lightning
                    points = [(start_x, start_y)]
                    current_x, current_y = start_x, start_y
                    for _ in range(3):  # 3 segments
                        angle = start_angle + random.uniform(-0.5, 0.5)
                        length = random.uniform(10, 20)
                        current_x += math.cos(angle) * length
                        current_y += math.sin(angle) * length
                        points.append((current_x, current_y))
                    
                    # Draw white glow
                    for i in range(len(points)-1):
                        pygame.draw.line(
                            self.screen,
                            (255, 255, 255, 150),  # White glow
                            points[i],
                            points[i+1],
                            4
                        )
                    # Draw blue core
                    for i in range(len(points)-1):
                        pygame.draw.line(
                            self.screen,
                            (0, 150, 255, 200),  # Blue core
                            points[i],
                            points[i+1],
                            2
                        )

        # Draw Scarecrow's abilities
        if self.boss and self.boss.current_hp > 0:
            boss_ability_y = self.boss.position[1] + self.boss.image.get_height() + 35
            boss_ability_start_x = self.boss.position[0] + (self.boss.image.get_width() // 2) - 30  # Center for 2 abilities
            
            # Draw both Crow Call and Fear abilities
            for i, ability in enumerate(self.boss.abilities):
                ability_pos = (boss_ability_start_x + i * 60, boss_ability_y)
                ability.draw_icon(self.screen, ability_pos)
                ability.draw_tooltip(self.screen, ability_pos)

    def draw_thunder_stacks(self, target):
        """Draw thunder stack counter on target"""
        if hasattr(target, 'thunder_stacks') and target.thunder_stacks > 0:
            try:
                font = pygame.font.SysFont("segoeuiemoji", 32)
            except:
                font = pygame.font.Font(None, 32)
            
            stack_text = f"⚡ {target.thunder_stacks}"
            text_surface = font.render(stack_text, True, (0, 150, 255))  # Changed to blue
            
            # Position above target
            x = target.position[0] + target.image.get_width() // 2 - text_surface.get_width() // 2
            y = target.position[1] - 30
            
            # Draw blue glow effect
            glow_surface = pygame.Surface((text_surface.get_width() + 10, text_surface.get_height() + 10), pygame.SRCALPHA)
            pygame.draw.rect(glow_surface, (0, 150, 255, 50), glow_surface.get_rect(), border_radius=5)  # Changed to blue
            self.screen.blit(glow_surface, (x - 5, y - 5))
            
            # Draw text
            self.screen.blit(text_surface, (x, y))

    def spawn_crow(self):
        """Spawn a new crow"""
        # Calculate position based on number of existing crows
        screen_width = self.screen.get_width()
        crow_count = len([crow for crow in self.crows if crow.current_hp > 0])
        
        if crow_count < 4:  # Maximum 4 crows
            # Calculate position relative to boss position
            boss_center_x = self.boss.position[0] + 125  # Center of boss
            crow_spacing = 300  # Space between crows
            
            # Alternate between left and right sides
            if crow_count % 2 == 0:  # Even numbers (0, 2) go right
                start_x = boss_center_x + 150  # Right side
                x_pos = start_x + ((crow_count // 2) * crow_spacing)
            else:  # Odd numbers (1, 3) go left
                start_x = boss_center_x - 150  # Left side
                x_pos = start_x - ((crow_count // 2) * crow_spacing)
            
            # Keep same y position as boss
            y_pos = self.boss.position[1]
            
            crow = Character(
                f"Crow {crow_count + 1}",
                500,  # 500 HP
                "Raidpy/res/img/Crow.webp",
                (x_pos, y_pos)
            )
            
            # Add peck ability to crow with correct icon path
            peck_ability = Ability(
                "peck",
                "Raidpy/res/img/Crow_Peck.webp",
                400,  # 400 damage
                0,
                0,  # No cooldown
                True  # Ends turn
            )
            peck_ability.description = "Deal 400 damage\nNo cooldown"
            crow.add_ability(peck_ability)
            
            self.crows.append(crow)
            self.rearrange_crows()
            
            self.battle_log.add_message(f"A new {crow.name} appears!", "system")
            return True
        return False

    def rearrange_crows(self):
        """Rearrange living crows to be evenly spaced"""
        living_crows = [crow for crow in self.crows if crow.current_hp > 0]
        
        if living_crows:
            boss_center_x = self.boss.position[0] + 125  # Center of boss
            
            for i, crow in enumerate(living_crows):
                if i < 2:  # First two crows on the left
                    crow.position = (boss_center_x - 400 - (i * 300), self.boss.position[1])  # Increased spacing on left
                else:  # Next two crows on the right
                    crow.position = (boss_center_x + 400 + ((i - 2) * 300), self.boss.position[1])  # Increased spacing on right
                
                # Force HP bar redraw for each crow
                self.draw_hp_bar(crow)

    def handle_events(self, events):
        for event in events:
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

    def handle_ability_clicks(self, pos):
        """Handle clicks on ability icons"""
        if self.current_turn != "player" or self.waiting_for_turn:
            return False

        ability_y = self.player.position[1] + self.player.image.get_height() + 35
        ability_start_x = (self.screen.get_width() // 2) - (120)  # Adjusted for 3 abilities

        # Check each ability
        for i, ability in enumerate(self.player.abilities):
            ability_rect = pygame.Rect(ability_start_x + i * 60, ability_y, 50, 50)
            
            if ability_rect.collidepoint(pos):
                # Check if ability is disabled
                if any(buff.effect_type == "disable" and buff.target_ability == ability 
                      for buff in self.player.buffs):
                    self.battle_log.add_message(
                        f"{ability.name} is disabled by Fear!",
                        "warning"
                    )
                    return True

                if ability.current_cooldown > 0:
                    self.battle_log.add_message(
                        f"{ability.name} is on cooldown for {ability.current_cooldown} turns!",
                        "warning"
                    )
                    return True

                if ability.name == "Thunderball":
                    self.setup_targeting(ability)
                elif ability.name == "Electric Shield":
                    self.execute_electric_shield(ability)
                elif ability.name == "Thundershock":
                    self.execute_thundershock(ability)
                elif ability.name == "Thunder Aura":
                    if ability.use():
                        self.execute_ability(ability, None)  # Thunder Aura doesn't need a target
                    return True
                return True

        return False

    def setup_targeting(self, ability):
        """Set up targeting mode for Thunderball"""
        self.targeting_mode = True
        self.current_ability = ability
        self.targets = []

        # Add boss as target if alive
        if self.boss.current_hp > 0:
            self.targets.append(Target(
                self.boss,
                "Raidpy/res/img/Scarecrow.webp",
                (self.boss.position[0] + 100, self.boss.position[1] + 200)
            ))

        # Add living crows as targets
        for crow in self.crows:
            if crow.current_hp > 0:
                self.targets.append(Target(
                    crow,
                    "Raidpy/res/img/Crow.webp",
                    (crow.position[0] + 100, crow.position[1] + 200)
                ))

        if not self.targets:
            self.targeting_mode = False
            self.current_ability = None
            self.battle_log.add_message("No valid targets available!", "warning")

    def handle_targeting_click(self, pos):
        """Handle clicks while in targeting mode"""
        if not self.targeting_mode:
            return False

        for target in self.targets:
            if target.rect.collidepoint(pos):
                self.targeting_mode = False
                ability = self.current_ability

                if ability.use():  # Start cooldown only if successfully used
                    self.execute_thunderball(ability, target.character)

                self.current_ability = None
                self.targets.clear()
                return True

        # Click outside targets - cancel targeting
        self.targeting_mode = False
        self.current_ability = None
        self.targets.clear()
        return True

    def execute_thunderball(self, ability, target):
        """Execute Thunderball ability"""
        # Play zap animation instead of attack animation
        self.play_zap_animation(self.player, target)

        # Initialize thunder_stacks if not present
        if not hasattr(target, 'thunder_stacks'):
            target.thunder_stacks = 0
            print(f"Initialized thunder_stacks for {target.name}")  # Debug print

        # Add thunder stack
        target.thunder_stacks += 1
        print(f"{target.name} now has {target.thunder_stacks} stacks")  # Debug print

        self.battle_log.add_message(
            f"{self.player.name} uses Thunderball!",
            "system"
        )
        self.battle_log.add_message(
            f"{target.name} now has {target.thunder_stacks} Thunder stacks! (+{int(target.thunder_stacks * 50)}% damage)",
            "system"
        )

        if ability.ends_turn:
            self.end_player_turn()

    def play_surge_animation(self, source, targets):
        """Play an electric surge channeling animation"""
        start_time = pygame.time.get_ticks()
        duration = 1000  # 1 second animation
        
        # Create points around the player in a circle
        num_points = 8
        radius = 100
        surge_points = []
        for i in range(num_points):
            angle = 2 * math.pi * i / num_points
            x = source.position[0] + source.image.get_width() // 2 + radius * math.cos(angle)
            y = source.position[1] + source.image.get_height() // 2 + radius * math.sin(angle)
            surge_points.append((x, y))
        
        while pygame.time.get_ticks() - start_time < duration:
            # Calculate progress (0 to 1)
            progress = (pygame.time.get_ticks() - start_time) / duration
            
            # Draw the current frame
            self.draw()
            
            # Source position
            center_pos = (
                source.position[0] + source.image.get_width() // 2,
                source.position[1] + source.image.get_height() // 2
            )
            
            # Draw surge effect
            surge_surface = pygame.Surface(self.screen.get_size(), pygame.SRCALPHA)
            
            # Draw rotating electric circle around player
            for i in range(num_points):
                # Calculate current point position with rotation
                angle = 2 * math.pi * (i / num_points + progress * 2)  # Rotate twice during animation
                x = center_pos[0] + radius * math.cos(angle)
                y = center_pos[1] + radius * math.sin(angle)
                
                # Draw lightning from center to point
                alpha = int(255 * (1 - progress))
                color = (0, 150, 255, alpha)  # Blue lightning
                
                # Draw multiple layers for glow effect
                for layer in range(3):
                    pygame.draw.line(surge_surface, color, center_pos, (x, y), 3 + layer*2)
            
            # After charging (halfway through), shoot lightning to all targets
            if progress > 0.5:
                attack_progress = (progress - 0.5) * 2  # Scale 0.5-1 to 0-1
                for target in targets:
                    target_pos = (
                        target.position[0] + target.image.get_width() // 2,
                        target.position[1] + target.image.get_height() // 2
                    )
                    
                    # Draw lightning bolts to each target
                    for i in range(3):  # Multiple layers for glow
                        alpha = int(255 * (1 - attack_progress))
                        color = (0, 150, 255, alpha)
                        
                        # Create jagged lightning path
                        points = [center_pos]
                        segments = 5
                        for s in range(1, segments):
                            t = s / segments
                            mid_x = center_pos[0] + (target_pos[0] - center_pos[0]) * t
                            mid_y = center_pos[1] + (target_pos[1] - center_pos[1]) * t
                            offset = 30 * (1-t) * math.sin(t * 10 + pygame.time.get_ticks() * 0.01)
                            points.append((mid_x + offset, mid_y))
                        points.append(target_pos)
                        
                        pygame.draw.lines(surge_surface, color, False, points, 3 + i*2)
            
            # Blit the surge effect
            self.screen.blit(surge_surface, (0, 0))
            pygame.display.flip()
            self.clock.tick(60)

    def execute_thundershock(self, ability):
        """Execute Thundershock ability"""
        # Get all valid targets (boss and crows)
        targets = []
        if self.boss.current_hp > 0:
            targets.append(self.boss)
        targets.extend([crow for crow in self.crows if crow.current_hp > 0])

        # Play surge animation first
        self.play_surge_animation(self.player, targets)

        # Set cooldown before dealing damage
        ability.current_cooldown = 9  # Set 9 turn cooldown

        # Deal damage to each target
        for target in targets:
            # Calculate damage based on thunder stacks
            base_damage = ability.damage
            if hasattr(target, 'thunder_stacks') and target.thunder_stacks > 0:
                stack_multiplier = 1 + (target.thunder_stacks * 0.5)  # Each stack adds 50%
                final_damage = int(base_damage * stack_multiplier)
                stacks = target.thunder_stacks
                target.thunder_stacks = 0  # Consume stacks
            else:
                final_damage = base_damage
                stacks = 0

            # Deal damage
            damage_dealt = self.take_damage(target, final_damage)
            
            if damage_dealt:
                if stacks > 0:
                    self.battle_log.add_message(
                        f"Thundershock hits {target.name} for {damage_dealt} damage! (+{int(stacks * 50)}% from {stacks} stacks, consumed all stacks)",
                        "damage"
                    )
                else:
                    self.battle_log.add_message(
                        f"Thundershock hits {target.name} for {damage_dealt} damage!",
                        "damage"
                    )

        if ability.ends_turn:
            self.end_player_turn()

    def enemy_turn(self):
        """Handle enemy turn logic"""
        if self.current_turn != "enemy" or not self.waiting_for_turn:
            return

        # Update cooldowns at the start of enemy turn
        self.update_cooldowns()

        # Handle boss actions first
        if self.boss.current_hp > 0:
            # Use boss ability
            self.use_boss_ability()
            
            # Handle crow actions after boss acts
            for crow in self.crows:
                if crow.current_hp > 0:
                    ability = crow.abilities[0]  # peck
                    if ability.use():
                        # Deal damage to player
                        damage_dealt = self.take_damage(self.player, ability.damage, attacker=crow)
                        if damage_dealt:
                            self.battle_log.add_message(
                                f"{crow.name} uses peck! Deals {damage_dealt} damage!",
                                "damage"
                            )
                            # Redraw after each crow attack
                            self.draw()
                            pygame.display.flip()
                            # Add small delay between crow attacks
                            pygame.time.wait(300)

        # Increment turn counter and start player turn
        self.turn_counter += 1
        self.current_turn = "player"
        self.waiting_for_turn = False
        self.battle_log.add_message(f"Turn {self.turn_counter} - Player's turn!", "turn")

    def take_damage(self, target, amount, attacker=None):
        """Handle damage dealing with shield and Thunder Aura reflection"""
        if not target or target.current_hp <= 0:
            return 0

        # Record damage time for flash effect
        if target == self.player:
            self.damage_flash["player"] = pygame.time.get_ticks()
        elif target == self.boss:
            self.damage_flash["boss"] = pygame.time.get_ticks()
        elif target in self.crows:
            self.damage_flash["crows"] = pygame.time.get_ticks()

        # Handle shield absorption first
        if hasattr(target, 'shield_amount') and target.shield_amount > 0:
            if target.shield_amount >= amount:
                # Shield absorbs all damage
                target.shield_amount -= amount
                
                # If shield is depleted, remove the buff
                if target.shield_amount <= 0:
                    target.buffs = [b for b in target.buffs if b.effect_type != "shield"]
                    target.shield_amount = 0
                
                # Create shield hit effect
                self.create_shield_hit_effect(target)
                return 0
            else:
                # Shield is broken, remaining damage goes to HP
                remaining_damage = amount - target.shield_amount
                target.shield_amount = 0
                target.buffs = [b for b in target.buffs if b.effect_type != "shield"]
                
                # Create shield break effect
                self.create_shield_break_effect(target)
                
                # Apply remaining damage
                target.current_hp = max(0, target.current_hp - remaining_damage)
                damage_dealt = remaining_damage
        else:
            # Normal damage without shield
            target.current_hp = max(0, target.current_hp - amount)
            damage_dealt = amount

        # Handle Thunder Aura reflection after damage is dealt
        if damage_dealt > 0 and attacker and target == self.player:
            # Check for Thunder Aura
            aura_buff = next((buff for buff in self.player.buffs if buff.effect_type == "thunder_aura"), None)
            if aura_buff:
                reflection_damage = aura_buff.effect_value
                # Deal reflection damage to attacker
                attacker.current_hp = max(0, attacker.current_hp - reflection_damage)
                self.battle_log.add_message(
                    f"{self.player.name}'s Thunder Aura reflects {reflection_damage} damage to {attacker.name}!",
                    "damage"
                )
                # Create electric effect on attacker
                self.create_thunder_reflection_effect(attacker)

        return damage_dealt

    def create_thunder_reflection_effect(self, target):
        """Create electric effect when Thunder Aura reflects damage"""
        num_particles = 15
        for _ in range(num_particles):
            angle = random.uniform(0, 2 * math.pi)
            speed = random.uniform(3, 6)
            size = random.randint(4, 8)
            
            particle = {
                'x': target.position[0] + target.image.get_width() // 2,
                'y': target.position[1] + target.image.get_height() // 2,
                'dx': math.cos(angle) * speed,
                'dy': math.sin(angle) * speed,
                'size': size,
                'color': (0, 150, 255, 255),  # Electric blue
                'lifetime': 45,
                'alpha': 255
            }
            self.healing_particles.append(particle)

    def handle_boss_death(self):
        """Handle Scarecrow's death and drops"""
        if not hasattr(self.boss, 'drops_handled'):
            self.battle_log.add_message(f"{self.boss.name} has been defeated!", "system")
            
            # Generate and handle drops
            drops = self.generate_boss_drops()
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
                            f"{self.boss.name} dropped {drop['quantity']}x {item['name']}!",
                            "loot"
                        )
            
            self.boss.drops_handled = True
            
            # Show victory screen
            if not hasattr(self, 'victory_screen_shown'):
                self.victory_screen_shown = True
                self.show_victory_screen = True
                self.completed = True
                self.battle_log.add_message("Congratulations! You've defeated the Scarecrow!")

    def handle_crow_death(self, crow):
        """Handle crow death"""
        if not hasattr(crow, 'drops_handled'):
            self.battle_log.add_message(f"{crow.name} has been defeated!", "system")
            crow.drops_handled = True

    def generate_boss_drops(self):
        """Generate drops for Scarecrow"""
        drops = []
        
        # Always drop 2-4 health potions
        drops.append({
            "id": "health_potion",
            "quantity": random.randint(2, 4)
        })
        
        # 50% chance for CM currency
        if random.random() < 0.5:
            drops.append({
                "id": "cm",
                "quantity": random.randint(3000, 6000)
            })
        
        # 25% chance for FM currency
        if random.random() < 0.25:
            drops.append({
                "id": "fm",
                "quantity": random.randint(750, 1500)
            })
        
        return drops

    def start_player_turn(self):
        """Start the player's turn"""
        self.current_turn = "player"
        self.waiting_for_turn = False
        
        # Update buffs at the start of turn
        self.update_buffs()
        
        # Handle Nina's hide healing at the start of turn
        hide_buff = next((buff for buff in self.player.buffs if buff.effect_type == "hide"), None)
        if hide_buff and self.player.current_hp > 0:
            healing = hide_buff.effect_value  # This is the 300 HP we set in the buff
            actual_healing = self.player.heal(healing)
            if actual_healing > 0:
                self.battle_log.add_message(
                    f"{self.player.name} heals for {actual_healing} HP while hidden!",
                    "heal"
                )
                self.create_healing_effect(self.player.position)
        
        # Update cooldowns
        self.update_cooldowns()
        
        # Enable abilities
        self.enable_abilities()
        
        self.battle_log.add_message(
            f"Turn {self.turn_counter} - Player's turn!",
            "turn"
        )

    def update_buffs(self):
        """Update buffs for each character"""
        # Update player buffs
        buffs_to_remove = []
        for buff in self.player.buffs:
            # Skip infinite duration buffs (like Hide)
            if buff.duration != -1:
                buff.duration -= 1
                if buff.duration <= 0:
                    buffs_to_remove.append(buff)
                    # Reset buff effects when expired
                    if buff.effect_type == "shield":
                        self.player.shield_amount = 0
                    elif buff.effect_type == "disable":
                        self.battle_log.add_message(
                            f"{buff.target_ability.name} is no longer disabled!",
                            "system"
                        )
                    
                    self.battle_log.add_message(
                        f"{self.player.name}'s {buff.name} expired!",
                        "system"
                    )

        # Remove expired buffs
        for buff in buffs_to_remove:
            self.player.buffs.remove(buff)

        # Update boss buffs if alive
        if self.boss and self.boss.current_hp > 0:
            buffs_to_remove = []
            for buff in self.boss.buffs:
                if buff.duration > 0:
                    buff.duration -= 1
                    if buff.duration <= 0:
                        buffs_to_remove.append(buff)
            
            # Remove expired buffs
            for buff in buffs_to_remove:
                self.boss.buffs.remove(buff)
                self.battle_log.add_message(
                    f"{self.boss.name}'s {buff.name} expired!",
                    "system"
                )

        # Update crow buffs
        for crow in self.crows:
            if crow.current_hp > 0:
                buffs_to_remove = []
                for buff in crow.buffs:
                    if buff.duration > 0:
                        buff.duration -= 1
                        if buff.duration <= 0:
                            buffs_to_remove.append(buff)
                
                # Remove expired buffs
                for buff in buffs_to_remove:
                    crow.buffs.remove(buff)
                    self.battle_log.add_message(
                        f"{crow.name}'s {buff.name} expired!",
                        "system"
                    )

    def end_player_turn(self):
        """End player turn and start enemy turn"""
        self.current_turn = "enemy"
        self.waiting_for_turn = True
        self.ai_thinking = False
        
        # Update turn counter message
        if self.boss.current_hp > 0:
            turn_message = f"Turn {self.turn_counter} - {self.boss.name}'s turn!"
        else:
            crow_count = len([crow for crow in self.crows if crow.current_hp > 0])
            turn_message = f"Turn {self.turn_counter} - {crow_count} Crows' turn!"
        
        self.battle_log.add_message(turn_message, "turn")

    def update(self):
        if not self.paused:
            current_time = pygame.time.get_ticks()
            
            # Update attack animation
            self.update_attack_animation()
            
            # Handle enemy turn with thinking delay
            if self.current_turn == "enemy" and self.waiting_for_turn:
                if not self.ai_thinking:
                    self.ai_thinking = True
                    self.ai_think_start = current_time
                elif current_time - self.ai_think_start >= self.ai_think_duration:
                    # Execute enemy turn
                    self.enemy_turn()
                    # Reset AI thinking state
                    self.ai_thinking = False
                    # Don't set waiting_for_turn or current_turn here, let enemy_turn handle it

            # Check win/lose conditions
            if self.boss.current_hp <= 0 and not self.crows:
                if not hasattr(self, 'victory_screen_shown'):
                    self.handle_boss_death()
            elif self.player.current_hp <= 0:
                self.completed = False
                self.running = False
                self.battle_log.add_message(f"Oh no! {self.player.name} was defeated. Try again!")

            # Update healing particles
            for particle in self.healing_particles[:]:
                particle['x'] += particle['dx']
                particle['y'] += particle['dy']
                particle['dy'] *= 0.95
                particle['lifetime'] -= 1
                
                if particle['lifetime'] <= 0:
                    self.healing_particles.remove(particle)
                else:
                    particle['alpha'] = int((particle['lifetime'] / 75) * 255)

    def update_cooldowns(self):
        """Update cooldowns for all abilities"""
        # Update player ability cooldowns
        for ability in self.player.abilities:
            if ability.current_cooldown > 0:
                ability.current_cooldown -= 1

        # Update boss ability cooldowns if alive
        if self.boss.current_hp > 0:
            for ability in self.boss.abilities:
                if ability.current_cooldown > 0:
                    ability.current_cooldown -= 1

        # Update crow ability cooldowns
        for crow in self.crows:
            if crow.current_hp > 0:
                for ability in crow.abilities:
                    if ability.current_cooldown > 0:
                        ability.current_cooldown -= 1

        # Update inventory item cooldowns
        for slot in self.inventory.slots:
            if slot.cooldown > 0:
                slot.cooldown -= 1

    def enable_abilities(self):
        """Enable abilities that are not on cooldown"""
        # Enable player abilities
        for ability in self.player.abilities:
            if ability.current_cooldown <= 0:
                ability.enabled = True
            else:
                ability.enabled = False

        # Update ability display
        for ability in self.player.abilities:
            if hasattr(ability, 'enabled'):
                if ability.enabled:
                    ability.icon.set_alpha(255)  # Full opacity for enabled abilities
                else:
                    ability.icon.set_alpha(128)  # Semi-transparent for disabled abilities

    def show_character_info(self, character):
        """Show detailed character info window when right-clicking"""
        window_width = 800
        window_height = 600
        
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
        
        # Draw abilities section
        content_x = 360
        content_y = 60
        content_width = window_width - content_x - 30
        
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
        
        # Draw shield bar (grey) overlaid on HP bar if character has shield
        if hasattr(character, 'shield_amount') and character.shield_amount > 0:
            shield_ratio = character.shield_amount / character.max_hp
            shield_width = 250 * shield_ratio
            shield_surface = pygame.Surface((shield_width, 20), pygame.SRCALPHA)
            pygame.draw.rect(shield_surface, (128, 128, 128, 128),  # Semi-transparent grey
                            (0, 0, shield_width, 20),
                            border_radius=8)
            self.screen.blit(shield_surface, (bar_x, bar_y))
        
        # Draw HP text with shadow
        font = pygame.font.Font(None, 24)
        hp_text = f"{character.current_hp}"
        if hasattr(character, 'shield_amount') and character.shield_amount > 0:
            hp_text += f" (+{character.shield_amount})"
        hp_text += f"/{character.max_hp}"
        
        text_surface = font.render(hp_text, True, (255, 255, 255))
        text_pos = (bar_x + 125 - text_surface.get_width()//2,
                    bar_y + 10 - text_surface.get_height()//2)
        
        # Draw text shadow
        shadow_surface = font.render(hp_text, True, (0, 0, 0))
        self.screen.blit(shadow_surface, (text_pos[0] + 1, text_pos[1] + 1))
        self.screen.blit(text_surface, text_pos)

    def create_healing_effect(self, position):
        """Create healing particle effect"""
        for _ in range(20):  # Create 20 particles
            particle = {
                'x': position[0] + random.randint(0, 250),  # Spread across character width
                'y': position[1] + random.randint(0, 350),  # Spread across character height
                'dx': random.uniform(-2, 2),
                'dy': random.uniform(-5, -2),  # Faster upward movement
                'lifetime': random.randint(45, 75),  # Varied lifetime
                'size': random.randint(3, 8),  # Varied sizes
                'color': (
                    random.randint(0, 100),     # R - dark to medium
                    random.randint(200, 255),   # G - bright
                    random.randint(0, 100),     # B - dark to medium
                    255                         # A - fully opaque
                )
            }
            self.healing_particles.append(particle)

    def use_item(self, item):
        """Handle item usage"""
        if item['id'] == 'health_potion':
            if self.current_turn == "player" and not self.waiting_for_turn:
                # Find the slot that contains this item
                slot = next((slot for slot in self.inventory.slots 
                           if slot.item and slot.item['id'] == item['id']), None)
                
                if slot and slot.cooldown <= 0:
                    healing = item['effect']['value']
                    actual_healing = self.player.heal(healing)
                    if actual_healing > 0:
                        self.battle_log.add_message(
                            f"Used Health Potion! Restored {actual_healing} HP",
                            "heal"
                        )
                        # Create healing particles
                        self.create_healing_effect(self.player.position)
                        # Start cooldown
                        slot.start_cooldown()
                        # Update Firebase inventory
                        self.firebase.update_inventory(item['id'], -1)
                        # Reload inventory to reflect changes
                        self.inventory.load_items(self.firebase)
                        return True
        return False

    def start_attack_animation(self, attacker, target):
        """Start the attack animation"""
        if attacker and target:
            self.attacking = True
            self.attack_start = pygame.time.get_ticks()
            self.attacker = attacker
            self.target = target
            self.original_pos = list(attacker.position)

    def update_attack_animation(self):
        """Update the attack animation with a simple forward and back motion"""
        if not self.attacking or not self.attacker or not self.target or not self.original_pos:
            return

        current_time = pygame.time.get_ticks()
        elapsed = current_time - self.attack_start
        
        if elapsed >= self.attack_duration:
            # Animation complete
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

    def play_zap_animation(self, source, target):
        """Play a lightning effect animation"""
        start_time = pygame.time.get_ticks()
        duration = 500  # 500ms animation
        
        while pygame.time.get_ticks() - start_time < duration:
            # Calculate progress (0 to 1)
            progress = (pygame.time.get_ticks() - start_time) / duration
            
            # Draw the current frame
            self.draw()
            
            # Draw lightning effect
            start_pos = (
                source.position[0] + source.image.get_width() // 2,
                source.position[1] + source.image.get_height() // 2
            )
            end_pos = (
                target.position[0] + target.image.get_width() // 2,
                target.position[1] + target.image.get_height() // 2
            )
            
            # Draw multiple lightning segments with glow
            for i in range(3):  # Draw 3 layers for glow effect
                alpha = int(255 * (1 - i/3) * (1 - progress))  # Fade out over time
                color = (0, 150, 255, alpha)  # Changed to blue
                
                # Create lightning surface
                lightning_surface = pygame.Surface(self.screen.get_size(), pygame.SRCALPHA)
                
                # Draw jagged line
                points = [start_pos]
                segments = 5
                for s in range(1, segments):
                    t = s / segments
                    mid_x = start_pos[0] + (end_pos[0] - start_pos[0]) * t
                    mid_y = start_pos[1] + (end_pos[1] - start_pos[1]) * t
                    # Add random offset
                    offset = 30 * (1-t) * math.sin(t * 10 + pygame.time.get_ticks() * 0.01)
                    points.append((mid_x + offset, mid_y))
                points.append(end_pos)
                
                # Draw the lightning
                pygame.draw.lines(lightning_surface, color, False, points, 3 + i*2)
                
                # Blit the lightning
                self.screen.blit(lightning_surface, (0, 0))
            
            pygame.display.flip()
            self.clock.tick(60)

    def execute_electric_shield(self, ability):
        """Execute Electric Shield ability"""
        # Create shield buff
        shield_buff = Buff(
            name="Electric Shield",
            icon_path=ability.icon_path,
            duration=3,
            effect_type="shield",
            effect_value=600
        )
        shield_buff.description = "Absorbs 600 damage\nDuration: 3 turns"
        
        # Add shield buff to player
        self.player.buffs = [b for b in self.player.buffs if b.effect_type != "shield"]
        self.player.add_buff(shield_buff)
        
        # Add shield value to player
        if not hasattr(self.player, 'shield_amount'):
            self.player.shield_amount = 0
        self.player.shield_amount = 600
        
        # Visual effect
        self.create_shield_effect()
        
        # Message
        self.battle_log.add_message(
            f"{self.player.name} gains an Electric Shield that absorbs 600 damage!",
            "system"
        )
        
        # Start cooldown
        ability.current_cooldown = ability.max_cooldown
        
        if ability.ends_turn:
            self.end_player_turn()

    def create_shield_effect(self):
        """Create visual effect for shield activation"""
        # Create electric particles around the player
        num_particles = 20
        for _ in range(num_particles):
            angle = random.uniform(0, 2 * math.pi)
            speed = random.uniform(2, 5)
            size = random.randint(3, 6)
            
            particle = {
                'x': self.player.position[0] + self.player.image.get_width() // 2,
                'y': self.player.position[1] + self.player.image.get_height() // 2,
                'dx': math.cos(angle) * speed,
                'dy': math.sin(angle) * speed,
                'size': size,
                'color': (30, 144, 255, 255),  # Electric blue
                'lifetime': 75,
                'alpha': 255
            }
            self.healing_particles.append(particle)

    def use_boss_ability(self):
        """Handle boss ability usage"""
        # First priority: Use Crow Call if available and less than 4 crows
        if self.boss.abilities[0].current_cooldown == 0 and len(self.crows) < 4:
            if self.boss.abilities[0].use():  # This will start the cooldown if successful
                self.use_crow_call()
                self.battle_log.add_message(f"{self.boss.name} uses Crow Call!")
        # Second priority: Use Fear if available
        elif self.boss.abilities[1].current_cooldown == 0:
            if self.boss.abilities[1].use():  # This will start the cooldown if successful
                self.use_fear()
                self.battle_log.add_message(f"{self.boss.name} uses Fear!")
        else:
            self.battle_log.add_message(f"{self.boss.name} does nothing this turn.")
        
        # Increment turn counter and start player turn
        self.turn_counter += 1
        self.start_player_turn()

    def use_crow_call(self):
        """Spawn a new crow"""
        # Calculate position based on number of existing crows
        crow_count = len([crow for crow in self.crows if crow.current_hp > 0])
        
        if crow_count < 4:  # Maximum 4 crows
            # Calculate position relative to boss position
            boss_center_x = self.boss.position[0] + 125  # Center of boss
            
            # Determine which side to spawn (left side first, then right)
            if crow_count < 2:  # First two crows go on the left
                x_pos = boss_center_x - 400 - (crow_count * 300)  # Increased spacing on left
            else:  # Next two crows go on the right
                x_pos = boss_center_x + 400 + ((crow_count - 2) * 300)  # Increased spacing on right
            
            # Keep same y position as boss
            y_pos = self.boss.position[1]
            
            crow = Character(
                f"Crow {crow_count + 1}",
                500,  # 500 HP
                "Raidpy/res/img/Crow.webp",
                (x_pos, y_pos)
            )
            
            # Add peck ability to crow with correct icon path
            peck_ability = Ability(
                "peck",
                "Raidpy/res/img/Crow_Peck.webp",
                400,  # 400 damage
                0,
                0,  # No cooldown
                True  # Ends turn
            )
            peck_ability.description = "Deal 400 damage\nNo cooldown"
            crow.add_ability(peck_ability)
            
            self.crows.append(crow)
            self.rearrange_crows()
            
            # Force HP bar redraw
            self.draw_hp_bar(crow)
            
            self.battle_log.add_message(f"A new {crow.name} appears!", "system")
            return True
        return False

    def rearrange_crows(self):
        """Rearrange living crows to be evenly spaced"""
        living_crows = [crow for crow in self.crows if crow.current_hp > 0]
        
        if living_crows:
            boss_center_x = self.boss.position[0] + 125  # Center of boss
            
            for i, crow in enumerate(living_crows):
                if i < 2:  # First two crows on the left
                    crow.position = (boss_center_x - 400 - (i * 300), self.boss.position[1])  # Increased spacing on left
                else:  # Next two crows on the right
                    crow.position = (boss_center_x + 400 + ((i - 2) * 300), self.boss.position[1])  # Increased spacing on right
                
                # Force HP bar redraw for each crow
                self.draw_hp_bar(crow)

    def execute_ability(self, ability, target):
        """Execute ability effects"""
        if ability.name == "Thunder Aura":
            # Create thunder aura buff
            aura_buff = Buff(
                name="Thunder Aura",
                icon_path=ability.icon_path,
                duration=5,  # 5 turns duration
                effect_type="thunder_aura",
                effect_value=250  # Reflection damage amount
            )
            aura_buff.description = "Deals 250 damage to attackers\nDuration: 5 turns"
            
            # Remove any existing thunder aura
            self.player.buffs = [b for b in self.player.buffs if b.effect_type != "thunder_aura"]
            self.player.add_buff(aura_buff)
            
            # Message
            self.battle_log.add_message(
                f"{self.player.name} surrounds themselves with electric energy!",
                "system"
            )
            
            # Start cooldown
            ability.current_cooldown = ability.max_cooldown
            
            if ability.ends_turn:
                self.end_player_turn()
            return

        elif ability.name == "Electric Shield":
            # Create shield buff
            shield_buff = Buff(
                name="Electric Shield",
                icon_path=ability.icon_path,
                duration=3,
                effect_type="shield",
                effect_value=600
            )
            shield_buff.description = "Absorbs 600 damage\nDuration: 3 turns"
            
            # Add shield buff to player
            self.player.buffs = [b for b in self.player.buffs if b.effect_type != "shield"]
            self.player.add_buff(shield_buff)
            
            # Add shield value to player
            if not hasattr(self.player, 'shield_amount'):
                self.player.shield_amount = 0
            self.player.shield_amount = 600
            
            # Visual effect
            self.create_shield_effect()
            
            # Message
            self.battle_log.add_message(
                f"{self.player.name} gains an Electric Shield that absorbs 600 damage!",
                "system"
            )
            
            # Start cooldown
            ability.current_cooldown = ability.max_cooldown
            
            if ability.ends_turn:
                self.end_player_turn()

    def use_fear(self):
        """Use Fear ability to disable one of Raiden's abilities"""
        # Randomly select one of Raiden's abilities that isn't already disabled
        available_abilities = [ability for ability in self.player.abilities 
                                 if not any(buff.effect_type == "disable" and buff.target_ability == ability 
                                          for buff in self.player.buffs)]
        
        if available_abilities:
            # Randomly choose an ability to disable
            disabled_ability = random.choice(available_abilities)
            
            # Create disable buff
            disable_buff = Buff(
                name=f"Fear: {disabled_ability.name} Disabled",
                icon_path=self.boss.abilities[1].icon_path,  # Fear ability icon
                duration=3,  # 3 turns duration
                effect_type="disable",
                effect_value=True
            )
            disable_buff.description = f"{disabled_ability.name} is disabled\nDuration: 3 turns"
            disable_buff.target_ability = disabled_ability  # Store which ability is disabled
            
            # Add buff to player
            self.player.buffs.append(disable_buff)
            
            self.battle_log.add_message(
                f"{self.boss.name}'s Fear disables {self.player.name}'s {disabled_ability.name} for 3 turns!",
                "system"
            )
        else:
            self.battle_log.add_message(
                f"{self.boss.name}'s Fear fails - no abilities available to disable!",
                "warning"
            )

    def create_shield_hit_effect(self, target):
        """Create visual effect when shield absorbs damage"""
        num_particles = 10
        for _ in range(num_particles):
            angle = random.uniform(0, 2 * math.pi)
            speed = random.uniform(3, 6)
            size = random.randint(4, 8)
            
            particle = {
                'x': target.position[0] + target.image.get_width() // 2,
                'y': target.position[1] + target.image.get_height() // 2,
                'dx': math.cos(angle) * speed,
                'dy': math.sin(angle) * speed,
                'size': size,
                'color': (135, 206, 235, 255),  # Sky blue
                'lifetime': 45,
                'alpha': 255
            }
            self.healing_particles.append(particle)

    def create_shield_break_effect(self, target):
        """Create visual effect when shield breaks"""
        num_particles = 15
        for _ in range(num_particles):
            angle = random.uniform(0, 2 * math.pi)
            speed = random.uniform(4, 8)
            size = random.randint(5, 10)
            
            particle = {
                'x': target.position[0] + target.image.get_width() // 2,
                'y': target.position[1] + target.image.get_height() // 2,
                'dx': math.cos(angle) * speed,
                'dy': math.sin(angle) * speed,
                'size': size,
                'color': (0, 191, 255, 255),  # Deep sky blue
                'lifetime': 60,
                'alpha': 255
            }
            self.healing_particles.append(particle)