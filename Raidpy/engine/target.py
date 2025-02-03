import pygame

class Target:
    def __init__(self, character, icon, position):
        self.character = character
        self.position = position
        self.rect = pygame.Rect(position[0], position[1], 50, 50)
        
        # Pre-create all highlight surfaces
        self.highlight_surfaces = []
        base_surface = pygame.Surface((80, 80), pygame.SRCALPHA)
        for alpha in range(50, 200, 20):
            surface = base_surface.copy()
            pygame.draw.circle(surface, (255, 0, 0, alpha), (40, 40), 35)
            self.highlight_surfaces.append(surface)
        
        # Handle both image paths and pre-loaded images
        if isinstance(icon, str):
            try:
                self.icon = pygame.image.load(icon)
                self.icon = pygame.transform.scale(self.icon, (50, 50))
            except pygame.error:
                # Create placeholder if loading fails
                self.icon = pygame.Surface((50, 50))
                self.icon.fill((100, 100, 100))
        else:
            # Use pre-loaded image
            self.icon = pygame.transform.scale(icon, (50, 50))
        
        self.last_pulse = 0
        self.current_surface = 0
        
    def draw(self, screen):
        # Update highlight every 50ms instead of every frame
        current_time = pygame.time.get_ticks()
        if current_time - self.last_pulse > 50:
            self.current_surface = (self.current_surface + 1) % len(self.highlight_surfaces)
            self.last_pulse = current_time
        
        # Draw pre-rendered highlight
        screen.blit(self.highlight_surfaces[self.current_surface], 
                   (self.position[0] - 15, self.position[1] - 15))
        
        # Draw icon
        screen.blit(self.icon, self.position)