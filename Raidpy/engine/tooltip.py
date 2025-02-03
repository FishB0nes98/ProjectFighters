import pygame

class TooltipManager:
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance.tooltips = []
            cls._instance.font = pygame.font.Font(None, 24)
            cls._instance.hover_delay = 500  # 0.5 seconds
            cls._instance.hover_items = {}  # Track hovering state
        return cls._instance
    
    def start_hover(self, item_id, text, pos):
        current_time = pygame.time.get_ticks()
        if item_id not in self.hover_items:
            self.hover_items[item_id] = {
                'start_time': current_time,
                'text': text,
                'pos': pos
            }
    
    def stop_hover(self, item_id):
        if item_id in self.hover_items:
            del self.hover_items[item_id]
    
    def draw_all(self, screen):
        current_time = pygame.time.get_ticks()
        
        # Create a separate surface for all tooltips
        tooltip_surface = pygame.Surface(screen.get_size(), pygame.SRCALPHA)
        
        for item_id, hover_data in list(self.hover_items.items()):
            if current_time - hover_data['start_time'] >= self.hover_delay:
                # Prepare tooltip surface
                lines = hover_data['text'].split('\n')
                rendered_lines = [self.font.render(line, True, (255, 255, 255)) for line in lines]
                
                width = max(line.get_width() for line in rendered_lines) + 20
                height = sum(line.get_height() for line in rendered_lines) + 10
                
                # Position tooltip to avoid going off screen
                x = min(hover_data['pos'][0], screen.get_width() - width)
                y = hover_data['pos'][1] - height if hover_data['pos'][1] + height > screen.get_height() else hover_data['pos'][1]
                
                # Draw background
                pygame.draw.rect(tooltip_surface, (0, 0, 0, 230), (x, y, width, height), border_radius=5)
                
                # Draw text
                current_y = y + 5
                for line in rendered_lines:
                    tooltip_surface.blit(line, (x + 10, current_y))
                    current_y += line.get_height()
        
        # Finally, blit the tooltip surface onto the screen
        screen.blit(tooltip_surface, (0, 0))

class Tooltip:
    def __init__(self):
        self.hover_start = 0
        self.hover_delay = 500
        self.current_hover = None
        self.showing = False
        self.manager = TooltipManager()
        
    def draw(self, screen, text, pos):
        if not self.showing:
            return
            
        self.manager.add_tooltip(text, pos)