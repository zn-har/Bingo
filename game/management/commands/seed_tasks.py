from django.core.management.base import BaseCommand

from game.models import GameState, Task

TASKS = [
    "Meet a Photographer",
    "Secret DJ Booth",
    "College Founder?",
    "1v1 Win",
    "Yellow Shirt Spot",
    "Volunteer High-five",
    "Visit Tech Lab",
    "First Fest Year",
    "Obstacle Course",
    "Mascot Selfie",
    "Find a Senior",
    "Food Court Check-in",
    "FREE SPACE",
    "Karaoke Hit",
    "Blue Pen Quest",
    "Spot the Dean",
    "Hidden Alley",
    "First Principal?",
    "Dance Battle",
    "Festival Merch",
    "Join a Flashmob",
    "Library Visit",
    "Mascot Name",
    "Robotics Demo",
    "Scan Final Poster",
]


class Command(BaseCommand):
    help = "Seed the database with 25 bingo tasks and initialize game state"

    def handle(self, *args, **options):
        if Task.objects.exists():
            self.stdout.write(self.style.WARNING("Tasks already exist — skipping seed."))
        else:
            for i, desc in enumerate(TASKS):
                Task.objects.create(description=desc, position=i)
            self.stdout.write(self.style.SUCCESS(f"Created {len(TASKS)} tasks."))

        GameState.get_instance()
        self.stdout.write(self.style.SUCCESS("Game state initialized."))
