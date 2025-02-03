import pygame

class DebugWindow:
    def __init__(self, screen):
        self.screen = screen
        self.visible = False
        self.show_fps = False
        self.position = [50, 50]
        self.size = [200, 150]
        self.dragging = False
        self.drag_offset = (0, 0)
        self.font = pygame.font.Font(None, 24)
        self.clock = pygame.time.Clock()
        
    def handle_event(self, event):
        if event.type == pygame.KEYDOWN and event.key == pygame.K_F5:
            self.visible = not self.visible
            return True
            
        if not self.visible:
            return False
            
        if event.type == pygame.MOUSEBUTTONDOWN:
            mouse_pos = pygame.mouse.get_pos()
            # Check checkbox
            checkbox_rect = pygame.Rect(self.position[0] + 10, self.position[1] + 40, 20, 20)
            if checkbox_rect.collidepoint(mouse_pos):
                self.show_fps = not self.show_fps
            # Check header for dragging
            elif self.is_point_in_header(mouse_pos):
                self.dragging = True
                self.drag_offset = (self.position[0] - mouse_pos[0],
                                  self.position[1] - mouse_pos[1])
                
        elif event.type == pygame.MOUSEBUTTONUP:
            self.dragging = False
            
        elif event.type == pygame.MOUSEMOTION and self.dragging:
            mouse_pos = pygame.mouse.get_pos()
            self.position[0] = mouse_pos[0] + self.drag_offset[0]
            self.position[1] = mouse_pos[1] + self.drag_offset[1]
            
        return True
        
    def is_point_in_header(self, point):
        header = pygame.Rect(
            self.position[0],
            self.position[1],
            self.size[0],
            30
        )
        return header.collidepoint(point)
        
    def draw(self):
        if not self.visible:
            return
            
        # Draw window
        surface = pygame.Surface(self.size, pygame.SRCALPHA)
        pygame.draw.rect(surface, (30, 30, 30, 230), (0, 0, *self.size))
        pygame.draw.rect(surface, (100, 100, 100), (0, 0, *self.size), 2)
        
        # Draw header
        pygame.draw.rect(surface, (50, 50, 50, 255), (0, 0, self.size[0], 30))
        title = self.font.render("Debug", True, (220, 220, 220))
        surface.blit(title, (10, 5))
        
        # Draw FPS checkbox
        checkbox_rect = pygame.Rect(10, 40, 20, 20)
        pygame.draw.rect(surface, (220, 220, 220), checkbox_rect, 2)
        if self.show_fps:
            pygame.draw.line(surface, (220, 220, 220), (12, 50), (28, 40), 2)
            pygame.draw.line(surface, (220, 220, 220), (28, 40), (38, 45), 2)
            
        # Draw checkbox label
        fps_label = self.font.render("Show FPS", True, (220, 220, 220))
        surface.blit(fps_label, (40, 40))
        
        # Draw current FPS if enabled
        if self.show_fps:
            fps = int(self.clock.get_fps())
            fps_text = self.font.render(f"FPS: {fps}", True, (220, 220, 220))
            surface.blit(fps_text, (10, 70))
        
        self.screen.blit(surface, self.position) 