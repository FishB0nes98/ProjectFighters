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

class Buff:
    def __init__(self, name, icon_path, duration, effect_type, effect_value):
        self.name = name
        self.duration = duration
        self.effect_type = effect_type
        self.effect_value = effect_value
        self.should_update = False  # Flag to control when duration updates
        
        # Load and scale buff icon
        self.icon = pygame.image.load(icon_path)
        self.icon = pygame.transform.scale(self.icon, (40, 40))
        
        self.tooltip = Tooltip()
        self.description = self.get_description(name, duration, effect_type, effect_value)
        
    def get_description(self, name, duration, effect_type, effect_value):
        if name == "Fertilizer":
            return f"Lifesteal: 35%\nDuration: {duration} turns"
        elif name == "Dormant":
            return f"Skip turns\nDuration: {duration} turns"
        elif name == "Anger":
            return f"Triple damage\nDuration: {duration} turns"
        return "No description available"
        
    def update(self):
        if self.should_update and self.duration > 0:
            self.duration -= 1
            self.should_update = False  # Reset flag after update
        return self.duration > 0
        
    def draw(self, screen, position):
        # Draw buff icon
        screen.blit(self.icon, position)
        
        # Draw duration counter with black background
        if self.duration > 0:
            # Create small circle background
            circle_radius = 10
            circle_pos = (position[0] + self.icon.get_width() - circle_radius,
                        position[1] + self.icon.get_height() - circle_radius)
            
            # Draw black circle background
            pygame.draw.circle(screen, (0, 0, 0), circle_pos, circle_radius)
            
            # Draw duration number
            font = pygame.font.Font(None, 20)
            duration_text = font.render(str(self.duration), True, (255, 255, 255))
            text_pos = (circle_pos[0] - duration_text.get_width()//2,
                       circle_pos[1] - duration_text.get_height()//2)
            screen.blit(duration_text, text_pos)
        
        # Handle tooltip
        self.draw_tooltip(screen, position)
        
    def draw_tooltip(self, screen, position):
        # Handle tooltip separately
        mouse_pos = pygame.mouse.get_pos()
        buff_rect = pygame.Rect(position[0], position[1], 40, 40)
        
        if buff_rect.collidepoint(mouse_pos):
            current_time = pygame.time.get_ticks()
            if self.tooltip.current_hover != self:
                self.tooltip.current_hover = self
                self.tooltip.hover_start = current_time
            elif current_time - self.tooltip.hover_start >= self.tooltip.hover_delay:
                self.tooltip.draw(screen, self.description, mouse_pos)
        else:
            if self.tooltip.current_hover == self:
                self.tooltip.current_hover = None