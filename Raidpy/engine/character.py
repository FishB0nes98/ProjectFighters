import pygame

class Character:
    def __init__(self, name, max_hp, image_path, position):
        self.name = name
        self.max_hp = max_hp
        self.current_hp = max_hp
        self.position = position
        self.abilities = []
        self.buffs = []
        self.buff_effects = {
            "lifesteal": 0,
            "dormant": False,
            "damage_multiplier": 1.0,
            "dodge_chance": 0.0
        }
        self.damage_multiplier = 1.0  # Initialize damage multiplier for modifiers
        self.defense_multiplier = 1.0  # Initialize defense multiplier for modifiers
        self.passive_bonus_damage = 0  # Track passive damage bonus
        self.shield = 0  # Initialize shield amount
        self.passive_disabled = False  # Initialize passive disabled flag
        self.lifesteal_duration_bonus = 0  # Initialize lifesteal duration bonus
        self.lifesteal = 0.0  # Initialize lifesteal amount
        self.buff_duration_bonus = 0  # Initialize buff duration bonus
        self.passive_counter_damage = 0  # Track passive counter damage
        self.passive_display = {"color": (255, 50, 50)}  # Default passive display settings
        self.modifier_effect = None  # Store the active modifier effect
        
        # Load character image with error handling and webp support
        try:
            # First try loading directly
            self.image = pygame.image.load(image_path)
        except pygame.error:
            try:
                # If direct loading fails, try with convert_alpha()
                self.image = pygame.image.load(image_path).convert_alpha()
            except pygame.error as e:
                print(f"Error loading image {image_path}: {e}")
                # Create a placeholder image if loading fails
                self.image = pygame.Surface((250, 350))
                self.image.fill((100, 100, 100))  # Gray placeholder
        
        # Scale the image
        self.image = pygame.transform.scale(self.image, (250, 350))
        
        # HP bar properties
        self.hp_bar_width = 250  # Same width as character image
        self.hp_bar_height = 20
        self.hp_bar_position = (position[0], position[1] + 360)  # Just below character image
    
    def draw(self, screen, flash_color=None):
        # Draw character sprite
        if flash_color:
            flash_surface = pygame.Surface(self.image.get_size(), pygame.SRCALPHA)
            flash_surface.fill(flash_color)
            screen.blit(self.image, self.position)
            screen.blit(flash_surface, self.position)
        else:
            screen.blit(self.image, self.position)
        
        # Modern HP bar with gradient and glow effect
        hp_percentage = self.current_hp / self.max_hp
        
        # HP bar background with slight transparency
        bg_surface = pygame.Surface((self.hp_bar_width + 4, self.hp_bar_height + 4), pygame.SRCALPHA)
        pygame.draw.rect(bg_surface, (0, 0, 0, 180), (0, 0, self.hp_bar_width + 4, self.hp_bar_height + 4), border_radius=10)
        screen.blit(bg_surface, (self.hp_bar_position[0] - 2, self.hp_bar_position[1] - 2))
        
        # Calculate HP bar color based on percentage
        if hp_percentage > 0.6:
            main_color = (46, 204, 113)  # Healthy green
            glow_color = (46, 204, 113, 30)  # Green glow
        elif hp_percentage > 0.3:
            main_color = (241, 196, 15)  # Warning yellow
            glow_color = (241, 196, 15, 30)  # Yellow glow
        else:
            main_color = (231, 76, 60)  # Danger red
            glow_color = (231, 76, 60, 30)  # Red glow
        
        # Draw glow effect
        current_hp_width = max(self.hp_bar_width * hp_percentage, 0)
        for i in range(3):
            glow_surface = pygame.Surface((current_hp_width + 4, self.hp_bar_height + 4), pygame.SRCALPHA)
            pygame.draw.rect(glow_surface, glow_color, 
                            (0, 0, current_hp_width + 4, self.hp_bar_height + 4), 
                            border_radius=10)
            screen.blit(glow_surface, 
                       (self.hp_bar_position[0] - 2, self.hp_bar_position[1] - 2))
        
        # Draw main HP bar
        if current_hp_width > 0:
            hp_surface = pygame.Surface((current_hp_width, self.hp_bar_height), pygame.SRCALPHA)
            pygame.draw.rect(hp_surface, main_color, 
                            (0, 0, current_hp_width, self.hp_bar_height),
                            border_radius=8)
            screen.blit(hp_surface, self.hp_bar_position)
        
        # Draw HP text with shadow
        font = pygame.font.Font(None, 24)
        hp_text = f"{self.current_hp}/{self.max_hp}"
        
        # Draw text shadow
        text_shadow = font.render(hp_text, True, (0, 0, 0))
        text_pos = (self.hp_bar_position[0] + self.hp_bar_width//2 - text_shadow.get_width()//2,
                    self.hp_bar_position[1] + self.hp_bar_height//2 - text_shadow.get_height()//2)
        screen.blit(text_shadow, (text_pos[0] + 1, text_pos[1] + 1))
        
        # Draw main text
        text_surface = font.render(hp_text, True, (255, 255, 255))
        screen.blit(text_surface, text_pos)
        
        # Draw buffs
        if self.buffs:
            buff_start_x = self.position[0] + 10
            buff_start_y = self.position[1] + 10
            for i, buff in enumerate(self.buffs):
                buff.draw(screen, (buff_start_x, buff_start_y + i * 45))
        
        # Draw passive bonus if it exists
        self.draw_passive_bonus(screen)
    
    def draw_passive_bonus(self, screen):
        if self.passive_bonus_damage > 0:
            try:
                self.font = pygame.font.SysFont("segoeuiemoji", 20)  # Reduced from 28 to 20
            except:
                self.font = pygame.font.Font(None, 20)  # Reduced from 28 to 20
            
            bonus_text = self.font.render(f"⚔ +{self.passive_bonus_damage}", True, (255, 50, 50))
            
            # Position at bottom right with padding
            padding = 20
            bonus_pos = (
                self.position[0] + self.image.get_width() - bonus_text.get_width() - padding,
                self.position[1] + self.image.get_height() - bonus_text.get_height() - padding
            )
            
            # Create box rect
            box_padding = 8  # Slightly reduced padding to match smaller font
            box_rect = pygame.Rect(
                bonus_pos[0] - box_padding,
                bonus_pos[1] - box_padding,
                bonus_text.get_width() + box_padding * 2,
                bonus_text.get_height() + box_padding * 2
            )
            
            # Draw neon glow effect (thinner)
            for i in range(8):  # Reduced from 15 to 8 layers
                alpha = int(120 * (1 - i/8))  # Adjusted alpha
                glow_surface = pygame.Surface((box_rect.width + i*2, box_rect.height + i*2), pygame.SRCALPHA)
                pygame.draw.rect(glow_surface, (255, 50, 50, alpha), 
                               (0, 0, glow_surface.get_width(), glow_surface.get_height()), 
                               border_radius=10)
                screen.blit(glow_surface, 
                           (box_rect.x - i, box_rect.y - i))
            
            # Draw main box
            box_surface = pygame.Surface((box_rect.width, box_rect.height), pygame.SRCALPHA)
            pygame.draw.rect(box_surface, (30, 30, 30, 230), 
                            (0, 0, box_rect.width, box_rect.height), 
                            border_radius=10)
            screen.blit(box_surface, box_rect)
            
            # Draw text
            screen.blit(bonus_text, bonus_pos)
    
    def add_ability(self, ability):
        if len(self.abilities) < 4:  # Maximum 4 abilities
            self.abilities.append(ability)
    
    def take_damage(self, damage):
        """Take damage with modifier effects"""
        if damage <= 0:
            return 0
            
        # Check for Divine Shield
        if self.modifier_effect and self.modifier_effect.has_effect("divine_shield"):
            if self.modifier_effect.divine_shield_active:
                self.modifier_effect.divine_shield_active = False
                return 0
            
        # Apply defense multiplier from modifiers
        damage = round(damage / self.defense_multiplier)
        
        # Store initial HP to check for death
        initial_hp = self.current_hp
        
        # Apply damage to HP
        self.current_hp = max(0, self.current_hp - damage)
        
        # Handle Quick Learner modifier
        if self.modifier_effect and self.modifier_effect.has_effect("quick_learner"):
            self.modifier_effect.on_damage_taken()
            
        # Return actual damage dealt
        return initial_hp - self.current_hp
    
    def deal_damage(self, base_damage):
        """Calculate outgoing damage with modifier effects"""
        if self.modifier_effect:
            # Apply Power Surge modifier
            if self.modifier_effect.has_effect("power_surge"):
                base_damage = self.modifier_effect.apply_power_surge(base_damage)
                
        # Apply general damage multiplier
        final_damage = round(base_damage * self.damage_multiplier)
        return final_damage
    
    def heal(self, amount):
        """Heal with modifier effects"""
        if amount <= 0:
            return 0
            
        old_hp = self.current_hp
        self.current_hp = min(self.max_hp, self.current_hp + amount)
        
        # Handle modifier effects that trigger on healing
        if self.modifier_effect:
            self.modifier_effect.on_heal(self.current_hp - old_hp)
            
        return self.current_hp - old_hp  # Return actual amount healed
    
    def add_buff(self, buff):
        """Add buff with modifier effects"""
        # Apply buff duration bonus if available
        if hasattr(self, 'buff_duration_bonus') and buff.duration > 0:
            buff.duration += self.buff_duration_bonus
            
        # Add the buff
        self.buffs.append(buff)
        
        # Update buff effects
        if buff.effect_type == "lifesteal":
            self.buff_effects["lifesteal"] = buff.effect_value
        elif buff.effect_type == "dormant":
            self.buff_effects["dormant"] = True
        elif buff.effect_type == "damage_multiplier":
            self.buff_effects["damage_multiplier"] = buff.effect_value
        elif buff.effect_type == "shield":
            self.shield = buff.effect_value
    
    def update_buffs(self):
        remaining_buffs = []
        for buff in self.buffs:
            if buff.update():  # Only decrease duration when update() returns True
                remaining_buffs.append(buff)
            else:
                # Remove buff effects when expired
                if buff.effect_type == "lifesteal":
                    self.buff_effects["lifesteal"] = 0
                elif buff.effect_type == "dormant":
                    self.buff_effects["dormant"] = False
                elif buff.effect_type == "damage_multiplier":
                    self.buff_effects["damage_multiplier"] = 1.0  # Reset to normal damage
        self.buffs = remaining_buffs