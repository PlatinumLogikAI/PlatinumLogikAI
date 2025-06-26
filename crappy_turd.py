import pygame
import random

# Game constants
WIDTH, HEIGHT = 400, 600
FPS = 60
GRAVITY = 0.25
FLAP_STRENGTH = -10
PIPE_GAP = 200
PIPE_WIDTH = 60
PIPE_SPEED = 2

# High score persistence
HIGH_SCORE_FILE = "highscore.txt"

def load_high_score():
    try:
        with open(HIGH_SCORE_FILE, "r") as f:
            return int(f.read().strip())
    except (IOError, ValueError):
        return 0


def save_high_score(score):
    try:
        with open(HIGH_SCORE_FILE, "w") as f:
            f.write(str(score))
    except IOError:
        pass

# Button colors
BTN_BG = (200, 200, 200)
BTN_FG = (0, 0, 0)

# Initialize pygame
pygame.init()
pygame.font.init()
FONT = pygame.font.SysFont(None, 48)
SCORE_FONT = pygame.font.SysFont(None, 36)
TITLE_FONT = pygame.font.SysFont(None, 72)

screen = pygame.display.set_mode((WIDTH, HEIGHT))
pygame.display.set_caption("Crappy Turd")
clock = pygame.time.Clock()


def draw_3d_text(surface, text, font, center, fg=(255, 215, 0), shadow=(0, 0, 0)):
    """Render text with a simple 3D shadow effect."""
    text_surf = font.render(text, True, shadow)
    shadow_rect = text_surf.get_rect(center=(center[0] + 4, center[1] + 4))
    surface.blit(text_surf, shadow_rect)
    text_surf = font.render(text, True, fg)
    text_rect = text_surf.get_rect(center=center)
    surface.blit(text_surf, text_rect)
    return text_rect


def draw_button(text, center):
    surf = SCORE_FONT.render(text, True, BTN_FG)
    rect = surf.get_rect(center=center)
    padded = rect.inflate(20, 10)
    pygame.draw.rect(screen, BTN_BG, padded)
    screen.blit(surf, rect)
    return padded


def start_screen(high_score):
    while True:
        screen.fill((135, 206, 250))
        draw_3d_text(screen, "Crappy Turd", TITLE_FONT, (WIDTH // 2, HEIGHT // 4))
        instr = SCORE_FONT.render("Press SPACE to flap", True, BTN_FG)
        screen.blit(instr, (WIDTH // 2 - instr.get_width() // 2, HEIGHT // 3))
        hs_surf = SCORE_FONT.render(f"High Score: {high_score}", True, BTN_FG)
        screen.blit(hs_surf, (WIDTH // 2 - hs_surf.get_width() // 2, HEIGHT // 3 + 40))
        start_rect = draw_button("Start", (WIDTH // 2, HEIGHT // 2))
        quit_rect = draw_button("Quit", (WIDTH // 2, HEIGHT // 2 + 60))
        pygame.display.flip()

        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                return False
            if event.type == pygame.MOUSEBUTTONDOWN:
                if start_rect.collidepoint(event.pos):
                    return True
                if quit_rect.collidepoint(event.pos):
                    return False
            if event.type == pygame.KEYDOWN:
                if event.key == pygame.K_SPACE:
                    return True


def game_over_screen(score, high_score):
    while True:
        screen.fill((135, 206, 250))
        over = SCORE_FONT.render(f"Game Over! Score: {score}", True, (255, 0, 0))
        screen.blit(over, (WIDTH // 2 - over.get_width() // 2, HEIGHT // 3))
        hs_surf = SCORE_FONT.render(f"High Score: {high_score}", True, BTN_FG)
        screen.blit(hs_surf, (WIDTH // 2 - hs_surf.get_width() // 2, HEIGHT // 3 + 40))
        restart_rect = draw_button("Restart", (WIDTH // 2, HEIGHT // 2))
        quit_rect = draw_button("Quit", (WIDTH // 2, HEIGHT // 2 + 60))
        pygame.display.flip()

        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                return False
            if event.type == pygame.MOUSEBUTTONDOWN:
                if restart_rect.collidepoint(event.pos):
                    return True
                if quit_rect.collidepoint(event.pos):
                    return False
            if event.type == pygame.KEYDOWN:
                if event.key == pygame.K_SPACE:
                    return True

# Poo character
class Poo:
    def __init__(self):
        self.x = WIDTH // 4
        self.y = HEIGHT // 2
        self.vel = 0
        self.emoji = "\U0001F4A9"  # Poo emoji
        self.open_image = FONT.render(self.emoji, True, (139, 69, 19))
        # create a copy for the blink frame by drawing "eyelids" over the eyes
        self.closed_image = self.open_image.copy()
        w, h = self.closed_image.get_size()
        lid_w = int(w * 0.15)
        lid_h = int(h * 0.08)
        left_lid = pygame.Rect(int(w * 0.3), int(h * 0.3), lid_w, lid_h)
        right_lid = pygame.Rect(int(w * 0.55), int(h * 0.3), lid_w, lid_h)
        pygame.draw.rect(self.closed_image, (139, 69, 19), left_lid)
        pygame.draw.rect(self.closed_image, (139, 69, 19), right_lid)
        self.image = self.open_image
        self.rect = self.image.get_rect(center=(self.x, self.y))
        self.blink_timer = random.randint(120, 240)
        self.blink_frames = 0

    def flap(self):
        self.vel = FLAP_STRENGTH

    def nudge_up(self):
        """Small upward boost for fine control."""
        self.vel += FLAP_STRENGTH / 2

    def nudge_down(self):
        """Small downward push for fine control."""
        self.vel -= FLAP_STRENGTH / 2

    def blink(self):
        """Blink for a short moment, called when scoring."""
        self.blink_frames = 5

    def update(self):
        self.vel += GRAVITY
        self.y += self.vel
        self.y = max(0, min(HEIGHT, self.y))
        self.rect.centery = self.y

        # handle blinking
        if self.blink_timer <= 0:
            if self.blink_frames == 0:
                self.blink_frames = 5
                self.blink_timer = random.randint(120, 240)
        else:
            self.blink_timer -= 1

        if self.blink_frames > 0:
            self.blink_frames -= 1
            self.image = self.closed_image
        else:
            self.image = self.open_image

    def draw(self, surface):
        surface.blit(self.image, self.rect)

# Pipe obstacle
class Pipe:
    def __init__(self, x):
        self.x = x
        self.top_height = random.randint(50, HEIGHT - PIPE_GAP - 50)
        self.passed = False

    def update(self):
        self.x -= PIPE_SPEED

    def offscreen(self):
        return self.x + PIPE_WIDTH < 0

    def draw(self, surface):
        # top pipe
        top_rect = pygame.Rect(self.x, 0, PIPE_WIDTH, self.top_height)
        # bottom pipe
        bottom_rect = pygame.Rect(
            self.x,
            self.top_height + PIPE_GAP,
            PIPE_WIDTH,
            HEIGHT - (self.top_height + PIPE_GAP),
        )
        pygame.draw.rect(surface, (0, 100, 0), top_rect)
        pygame.draw.rect(surface, (0, 100, 0), bottom_rect)
        return top_rect, bottom_rect

    def get_rects(self):
        top_rect = pygame.Rect(self.x, 0, PIPE_WIDTH, self.top_height)
        bottom_rect = pygame.Rect(
            self.x,
            self.top_height + PIPE_GAP,
            PIPE_WIDTH,
            HEIGHT - (self.top_height + PIPE_GAP),
        )
        return top_rect, bottom_rect


def check_collision(poo_rect, pipes):
    for pipe in pipes:
        top_rect, bottom_rect = pipe.get_rects()
        if poo_rect.colliderect(top_rect) or poo_rect.colliderect(bottom_rect):
            return True
    return False

def game_loop():
    poo = Poo()
    pipes = [Pipe(WIDTH + 600)]
    score = 0

    while True:
        clock.tick(FPS)
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                return None
            if event.type == pygame.KEYDOWN:
                if event.key == pygame.K_SPACE:
                    poo.flap()
                elif event.key == pygame.K_UP:
                    poo.nudge_up()
                elif event.key == pygame.K_DOWN:
                    poo.nudge_down()

        poo.update()
        if pipes[-1].x < WIDTH - 250:
            pipes.append(Pipe(WIDTH + 350))
        for pipe in list(pipes):
            pipe.update()
            if pipe.offscreen():
                pipes.remove(pipe)
            if not pipe.passed and pipe.x + PIPE_WIDTH < poo.x:
                pipe.passed = True
                score += 1
                poo.blink()

        screen.fill((135, 206, 250))
        poo.draw(screen)
        for pipe in pipes:
            pipe.draw(screen)
        score_surf = SCORE_FONT.render(f"Score: {score}", True, (0, 0, 0))
        screen.blit(score_surf, (10, 10))
        pygame.display.flip()

        if check_collision(poo.rect, pipes):
            return score


def main():
    high_score = load_high_score()
    while True:
        if not start_screen(high_score):
            break
        score = game_loop()
        if score is None:
            break
        if score > high_score:
            high_score = score
            save_high_score(high_score)
        if not game_over_screen(score, high_score):
            break
    pygame.quit()

if __name__ == "__main__":
    main()
