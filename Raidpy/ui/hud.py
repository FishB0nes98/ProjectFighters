import pygame

class HUD:
    def __init__(self, screen):
        self.screen = screen
        self.width = screen.get_width()
        self.height = screen.get_height()
        
        # Load HUD assets
        self.health_bar = pygame.image.load("assets/ui/health_bar.png").convert_alpha()
        self.health_fill = pygame.image.load("assets/ui/health_fill.png").convert_alpha()
        self.score_icon = pygame.image.load("assets/ui/score_icon.png").convert_alpha()
        self.timer_icon = pygame.image.load("assets/ui/timer_icon.png").convert_alpha()
        
        self.font = pygame.font.Font("assets/fonts/Roboto-Bold.ttf", 24)
        
    def update(self, health, score, time):
        self.health = health
        self.score = score
        self.time = time
        
    def draw(self):
        # Draw health bar
        health_rect = pygame.Rect(20, 20, 200 * (self.health/100), 30)
        pygame.draw.rect(self.screen, (40, 40, 40), pygame.Rect(20, 20, 200, 30))
        pygame.draw.rect(self.screen, (255, 50, 50), health_rect)
        
        # Draw score
        score_text = self.font.render(f"Score: {self.score}", True, (255, 255, 255))
        self.screen.blit(score_text, (self.width - 200, 20))
        
        # Draw timer
        time_text = self.font.render(f"Time: {self.time:.1f}", True, (255, 255, 255))
        self.screen.blit(time_text, (self.width - 200, 60)) 