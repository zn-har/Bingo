import uuid

from django.db import models


class Player(models.Model):
    """A participant in the bingo game."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    phone = models.CharField(max_length=20, unique=True)
    qr_code = models.ImageField(upload_to="qrcodes/", blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class Task(models.Model):
    """A bingo task that appears on the board."""

    description = models.CharField(max_length=200)
    position = models.IntegerField(
        unique=True,
        help_text="Grid position 0-24 (left-to-right, top-to-bottom).",
    )

    class Meta:
        ordering = ["position"]

    def __str__(self):
        return f"[{self.position}] {self.description}"


class ScanRecord(models.Model):
    """Records a QR scan between two players for a specific task."""

    class VerificationStatus(models.TextChoices):
        PENDING = "pending", "Pending"
        APPROVED = "approved", "Approved"
        REJECTED = "rejected", "Rejected"

    scanner = models.ForeignKey(
        Player, on_delete=models.CASCADE, related_name="scans_made"
    )
    target = models.ForeignKey(
        Player, on_delete=models.CASCADE, related_name="scans_received"
    )
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name="scans")
    timestamp = models.DateTimeField(auto_now_add=True)
    verification_status = models.CharField(
        max_length=10,
        choices=VerificationStatus.choices,
        default=VerificationStatus.PENDING,
    )

    class Meta:
        unique_together = ("scanner", "task")
        ordering = ["-timestamp"]

    def __str__(self):
        return f"{self.scanner.name} scanned {self.target.name} for '{self.task.description}'"


class GameState(models.Model):
    """Singleton model tracking the overall game state."""

    game_active = models.BooleanField(default=True)
    max_winners = models.IntegerField(default=10)

    class Meta:
        verbose_name = "Game State"
        verbose_name_plural = "Game State"

    def save(self, *args, **kwargs):
        # Enforce singleton — always use pk=1
        self.pk = 1
        super().save(*args, **kwargs)

    @classmethod
    def get_instance(cls):
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj

    def __str__(self):
        status = "Active" if self.game_active else "Ended"
        return f"Game is {status}"


class Winner(models.Model):
    """Records a winner and their win type."""

    class WinType(models.TextChoices):
        ROW = "row", "Row"
        COLUMN = "column", "Column"
        DIAGONAL = "diagonal", "Diagonal"
        FULL = "full", "Full Board"

    player = models.ForeignKey(Player, on_delete=models.CASCADE, related_name="wins")
    win_type = models.CharField(max_length=10, choices=WinType.choices)
    won_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["won_at"]

    def __str__(self):
        return f"{self.player.name} won with {self.get_win_type_display()}"
