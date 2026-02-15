from rest_framework import serializers

from .models import GameState, Player, ScanRecord, Task, Winner


class PlayerSerializer(serializers.ModelSerializer):
    qr_code_url = serializers.SerializerMethodField()

    class Meta:
        model = Player
        fields = ["id", "name", "phone", "qr_code_url", "created_at"]
        read_only_fields = ["id", "qr_code_url", "created_at"]

    def get_qr_code_url(self, obj):
        if obj.qr_code:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.qr_code.url)
            return obj.qr_code.url
        return None


class PlayerRegistrationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Player
        fields = ["name", "phone"]
        extra_kwargs = {
            "phone": {"validators": []},
        }

    def validate_phone(self, value):
        digits = "".join(c for c in value if c.isdigit())
        if len(digits) != 10:
            raise serializers.ValidationError("Phone number must be exactly 10 digits.")
        return digits


class TaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = ["id", "description", "position"]


class ScanRecordSerializer(serializers.ModelSerializer):
    scanner_name = serializers.CharField(source="scanner.name", read_only=True)
    target_name = serializers.CharField(source="target.name", read_only=True)
    task_description = serializers.CharField(source="task.description", read_only=True)

    class Meta:
        model = ScanRecord
        fields = [
            "id",
            "scanner",
            "target",
            "task",
            "scanner_name",
            "target_name",
            "task_description",
            "timestamp",
            "verification_status",
        ]
        read_only_fields = ["timestamp", "verification_status"]


class ScanSubmitSerializer(serializers.Serializer):
    scanner_id = serializers.UUIDField()
    target_id = serializers.UUIDField()
    task_id = serializers.IntegerField()


class GameStateSerializer(serializers.ModelSerializer):
    winner_count = serializers.SerializerMethodField()

    class Meta:
        model = GameState
        fields = ["game_active", "max_winners", "winner_count"]

    def get_winner_count(self, obj):
        return Winner.objects.count()


class WinnerSerializer(serializers.ModelSerializer):
    player_name = serializers.CharField(source="player.name", read_only=True)

    class Meta:
        model = Winner
        fields = ["id", "player", "player_name", "win_type", "won_at"]


class BoardCellSerializer(serializers.Serializer):
    task_id = serializers.IntegerField()
    description = serializers.CharField()
    position = serializers.IntegerField()
    completed = serializers.BooleanField()
