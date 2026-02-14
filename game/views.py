import io
import os

import qrcode
from django.core.files.base import ContentFile
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import GameState, Player, ScanRecord, Task, Winner
from .serializers import (
    BoardCellSerializer,
    GameStateSerializer,
    PlayerRegistrationSerializer,
    PlayerSerializer,
    ScanRecordSerializer,
    ScanSubmitSerializer,
    WinnerSerializer,
)

FREE_SPACE_POSITION = 12


def _generate_qr(player):
    """Generate a QR code image containing the player's UUID."""
    img = qrcode.make(str(player.id), box_size=10, border=2)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    filename = f"qr_{player.id}.png"
    player.qr_code.save(filename, ContentFile(buf.read()), save=True)


def _check_wins(player):
    """Check if a player has completed a row, column, or full board."""
    completed_positions = set(
        ScanRecord.objects.filter(scanner=player).values_list("task__position", flat=True)
    )
    # Free space is always completed
    completed_positions.add(FREE_SPACE_POSITION)

    wins = []

    # Check rows
    for row in range(5):
        row_positions = set(range(row * 5, row * 5 + 5))
        if row_positions.issubset(completed_positions):
            wins.append("row")
            break

    # Check columns
    for col in range(5):
        col_positions = {col + row * 5 for row in range(5)}
        if col_positions.issubset(completed_positions):
            wins.append("column")
            break

    # Check full board
    if len(completed_positions) >= 25:
        wins.append("full")

    return wins


@api_view(["POST"])
def register_player(request):
    """Register a new player and generate their QR code."""
    serializer = PlayerRegistrationSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    # Check for existing player with same phone
    phone = serializer.validated_data["phone"]
    existing = Player.objects.filter(phone=phone).first()
    if existing:
        return Response(
            PlayerSerializer(existing, context={"request": request}).data,
            status=status.HTTP_200_OK,
        )

    player = serializer.save()
    _generate_qr(player)
    return Response(
        PlayerSerializer(player, context={"request": request}).data,
        status=status.HTTP_201_CREATED,
    )


@api_view(["GET"])
def get_player(request, player_id):
    """Get player details by ID."""
    try:
        player = Player.objects.get(id=player_id)
    except Player.DoesNotExist:
        return Response({"error": "Player not found"}, status=status.HTTP_404_NOT_FOUND)

    return Response(PlayerSerializer(player, context={"request": request}).data)


@api_view(["GET"])
def get_board(request, player_id):
    """Get the bingo board for a player with completion status."""
    try:
        player = Player.objects.get(id=player_id)
    except Player.DoesNotExist:
        return Response({"error": "Player not found"}, status=status.HTTP_404_NOT_FOUND)

    tasks = Task.objects.all()
    completed_task_ids = set(
        ScanRecord.objects.filter(scanner=player).values_list("task_id", flat=True)
    )

    cells = []
    for task in tasks:
        cells.append(
            {
                "task_id": task.id,
                "description": task.description,
                "position": task.position,
                "completed": task.id in completed_task_ids or task.position == FREE_SPACE_POSITION,
                "is_free_space": task.position == FREE_SPACE_POSITION,
            }
        )

    serializer = BoardCellSerializer(cells, many=True)
    return Response(serializer.data)


@api_view(["POST"])
def submit_scan(request):
    """Submit a QR scan to complete a task."""
    serializer = ScanSubmitSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    scanner_id = serializer.validated_data["scanner_id"]
    target_id = serializer.validated_data["target_id"]
    task_id = serializer.validated_data["task_id"]

    # Check game is active
    game = GameState.get_instance()
    if not game.game_active:
        return Response(
            {"error": "Game has ended"}, status=status.HTTP_403_FORBIDDEN
        )

    # Prevent self-scanning
    if scanner_id == target_id:
        return Response(
            {"error": "You cannot scan your own QR code"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Validate players exist
    try:
        scanner = Player.objects.get(id=scanner_id)
    except Player.DoesNotExist:
        return Response({"error": "Scanner not found"}, status=status.HTTP_404_NOT_FOUND)

    try:
        target = Player.objects.get(id=target_id)
    except Player.DoesNotExist:
        return Response({"error": "Target player not found"}, status=status.HTTP_404_NOT_FOUND)

    # Validate task exists
    try:
        task = Task.objects.get(id=task_id)
    except Task.DoesNotExist:
        return Response({"error": "Task not found"}, status=status.HTTP_404_NOT_FOUND)

    # Prevent duplicate scan for same task
    if ScanRecord.objects.filter(scanner=scanner, task=task).exists():
        return Response(
            {"error": "You already completed this task"},
            status=status.HTTP_409_CONFLICT,
        )

    # Create scan record
    scan = ScanRecord.objects.create(scanner=scanner, target=target, task=task)

    # Check for wins
    win_types = _check_wins(scanner)
    new_wins = []
    for win_type in win_types:
        if not Winner.objects.filter(player=scanner, win_type=win_type).exists():
            Winner.objects.create(player=scanner, win_type=win_type)
            new_wins.append(win_type)

    # Check if game should end
    total_winners = Winner.objects.values("player").distinct().count()
    if total_winners >= game.max_winners:
        game.game_active = False
        game.save()

    return Response(
        {
            "scan": ScanRecordSerializer(scan).data,
            "new_wins": new_wins,
            "game_active": game.game_active,
        },
        status=status.HTTP_201_CREATED,
    )


@api_view(["GET"])
def get_game_state(request):
    """Get the current game state."""
    game = GameState.get_instance()
    serializer = GameStateSerializer(game)
    return Response(serializer.data)


@api_view(["GET"])
def get_winners(request):
    """Get the list of winners."""
    winners = Winner.objects.select_related("player").all()
    serializer = WinnerSerializer(winners, many=True)
    return Response(serializer.data)


@api_view(["GET"])
def get_tasks(request):
    """Get all tasks."""
    tasks = Task.objects.all()
    from .serializers import TaskSerializer

    return Response(TaskSerializer(tasks, many=True).data)


@api_view(["GET"])
def get_player_scans(request, player_id):
    """Get all scans made by a specific player."""
    try:
        player = Player.objects.get(id=player_id)
    except Player.DoesNotExist:
        return Response({"error": "Player not found"}, status=status.HTTP_404_NOT_FOUND)

    scans = ScanRecord.objects.filter(scanner=player).select_related("target", "task")
    return Response(ScanRecordSerializer(scans, many=True).data)
