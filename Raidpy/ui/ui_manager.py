import pygame

class UIManager:
    def __init__(self, screen):
        self.screen = screen
        self.width = screen.get_width()
        self.height = screen.get_height()
        
        # Load UI assets
        self.load_assets()
        
    def load_assets(self):
        # Load UI elements (buttons, panels, etc.)
        self.panel_bg = pygame.image.load("assets/ui/panel_bg.png").convert_alpha()
        self.button_normal = pygame.image.load("assets/ui/button_normal.png").convert_alpha()
        self.button_hover = pygame.image.load("assets/ui/button_hover.png").convert_alpha()
    
    def fade_in(self, duration=1.0):
        fade = pygame.Surface((self.width, self.height))
        fade.fill((0, 0, 0))
        for alpha in range(255, 0, -5):
            fade.set_alpha(alpha)
            self.screen.blit(fade, (0, 0))
            pygame.display.flip()
            pygame.time.delay(5)
    
    def show_stage_complete(self, message):
        self.show_message(message, (0, 255, 0))
    
    def show_stage_failed(self, message):
        self.show_message(message, (255, 0, 0))
    
    def show_message(self, message, color):
        font = pygame.font.Font("assets/fonts/Roboto-Bold.ttf", 48)
        text = font.render(message, True, color)
        text_rect = text.get_rect(center=(self.width/2, self.height/2))
        
        panel = pygame.transform.scale(self.panel_bg, (text_rect.width + 40, text_rect.height + 40))
        panel_rect = panel.get_rect(center=(self.width/2, self.height/2))
        
        self.screen.blit(panel, panel_rect)
        self.screen.blit(text, text_rect)
        pygame.display.flip()
        pygame.time.delay(2000) 