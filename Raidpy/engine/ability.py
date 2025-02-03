import pygame

class Tooltip:
    def __init__(self):
        self.hover_start = 0
        self.hover_delay = 500  # 0.5 seconds in milliseconds
        self.current_hover = None
        self.showing = False
        
    def draw(self, screen, text, pos):
        # Create semi-transparent background
        font = pygame.font.Font(None, 24)
        lines = text.split('\n')
        rendered_lines = [font.render(line, True, (255, 255, 255)) for line in lines]
        
        # Calculate box size
        width = max(line.get_width() for line in rendered_lines) + 20
        height = sum(line.get_height() for line in rendered_lines) + 10
        
        # Create background surface
        bg_surface = pygame.Surface((width, height), pygame.SRCALPHA)
        pygame.draw.rect(bg_surface, (0, 0, 0, 230), (0, 0, width, height), border_radius=5)
        
        # Position tooltip to avoid going off screen
        x = min(pos[0], screen.get_width() - width)
        y = pos[1] - height if pos[1] + height > screen.get_height() else pos[1]
        
        # Draw background
        screen.blit(bg_surface, (x, y))
        
        # Draw text
        current_y = y + 5
        for line in rendered_lines:
            screen.blit(line, (x + 10, current_y))
            current_y += line.get_height()

class Ability:
    def __init__(self, name, icon_path, damage=0, healing=0, cooldown=0, ends_turn=True):
        self.name = name
        self.icon_path = icon_path
        self.damage = damage
        self.healing = healing
        self.max_cooldown = cooldown
        self.current_cooldown = 0
        self.ends_turn = ends_turn
        
        # Load and scale ability icon
        self.icon = pygame.image.load(icon_path)
        self.icon = pygame.transform.scale(self.icon, (50, 50))
        self.icon_disabled = self.icon.copy()
        self.icon_disabled.fill((128, 128, 128), special_flags=pygame.BLEND_MULT)
        
        self.tooltip = Tooltip()
        self.description = self.get_description(name, damage, healing, cooldown)
    
    def get_description(self, name, damage, healing, cooldown):
        if name == "Boink":
            return f"Deal {damage} damage\n50% chance to deal double damage\nNo cooldown"
        elif name == "Apple Toss":
            return f"If used on ally: Heal for {healing} HP\nIf used on enemy: Deal {damage} damage and reduce their damage by 85% for 4 turns\nCooldown: {cooldown} turns"
        elif name == "Scratch":
            return f"Deal {damage} damage\nIncrease passive damage by 10\nNo cooldown"
        elif name == "Fertilizer Heal":
            return f"Gain 35% lifesteal for 4 turns\nCooldown: {cooldown} turns"
        elif name == "Seed Boomerang":
            return f"Deal {damage} damage twice (Scales with passive)\nEach hit reduces Fertilizer Heal cooldown by 2\nCooldown: {cooldown} turns"
        elif name == "Rapid Claws":
            return f"Strike 6 times for {damage} damage\nEach hit increases passive damage by 10\nCooldown: {cooldown} turns"
        elif name == "Root Strike":
            return f"Deal {damage} damage\nNo cooldown"
        elif name == "Go Dormant":
            return f"Heal for {healing}\nSkip 2 turns\nCooldown: {cooldown} turns"
        elif name == "Anger":
            return f"Triple damage for 3 turns\nCooldown: {cooldown} turns"
        elif name == "Carrot Grenade":
            return f"Deal {damage} damage\nHeal for 100% of damage dealt\nCooldown: {cooldown} turns"
        elif name == "Quick Shot":
            return f"Deal {damage} damage\nNo cooldown"
        elif name == "Targeted":
            return f"Place a mark on an enemy\nTarget takes 50% more damage from Nina for 10 turns\nDoesn't end turn\nCooldown: {cooldown} turns"
        elif name == "Hide":
            return f"Become untargetable by enemies\nHeal {healing} HP each turn\nBreaks when using Quick Shot\nCooldown: {cooldown} turns"
        return "No description available"
    
    def use(self):
        if self.current_cooldown == 0:
            self.current_cooldown = self.max_cooldown
            print(f"Used {self.name}, setting cooldown to {self.current_cooldown}")  # Debug print
            return True
        return False
    
    def update_cooldown(self):
        if self.current_cooldown > 0:
            self.current_cooldown -= 1
            print(f"Updated cooldown for {self.name}: {self.current_cooldown}")  # Debug print
    
    def draw_icon(self, screen, position):
        # Draw ability icon
        icon_to_draw = self.icon_disabled if self.current_cooldown > 0 else self.icon
        screen.blit(icon_to_draw, position)
        
        # Draw cooldown number if ability is on cooldown
        if self.current_cooldown > 0:
            # Create small circle background for cooldown number
            circle_radius = 12
            circle_pos = (position[0] + self.icon.get_width() - circle_radius,
                         position[1] + circle_radius)
            
            # Draw black circle background
            pygame.draw.circle(screen, (0, 0, 0), circle_pos, circle_radius)
            
            # Draw cooldown number
            font = pygame.font.Font(None, 24)
            cooldown_text = font.render(str(self.current_cooldown), True, (255, 255, 255))
            text_pos = (circle_pos[0] - cooldown_text.get_width()//2,
                       circle_pos[1] - cooldown_text.get_height()//2)
            screen.blit(cooldown_text, text_pos)
    
    def draw_tooltip(self, screen, position):
        # Handle tooltip separately
        mouse_pos = pygame.mouse.get_pos()
        ability_rect = pygame.Rect(position[0], position[1], 50, 50)
        
        if ability_rect.collidepoint(mouse_pos):
            current_time = pygame.time.get_ticks()
            if self.tooltip.current_hover != self:
                self.tooltip.current_hover = self
                self.tooltip.hover_start = current_time
            elif current_time - self.tooltip.hover_start >= self.tooltip.hover_delay:
                self.tooltip.draw(screen, self.description, mouse_pos)
        else:
            if self.tooltip.current_hover == self:
                self.tooltip.current_hover = None
    
    def update_cooldown(self):
        if self.current_cooldown > 0:
            self.current_cooldown -= 1
            print(f"Updated cooldown for {self.name}: {self.current_cooldown}")  # Debug print
    
    def use(self):
        if self.current_cooldown == 0:
            self.current_cooldown = self.max_cooldown
            print(f"Used {self.name}, setting cooldown to {self.current_cooldown}")  # Debug print
            return True
        return False 