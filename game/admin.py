from django.contrib import admin

from .models import GameState, Player, ScanRecord, Task, Winner


@admin.register(Player)
class PlayerAdmin(admin.ModelAdmin):
    list_display = ("name", "phone", "created_at")
    search_fields = ("name", "phone")
    readonly_fields = ("id", "qr_code")


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ("position", "description")
    ordering = ("position",)


@admin.register(ScanRecord)
class ScanRecordAdmin(admin.ModelAdmin):
    list_display = (
        "scanner",
        "target",
        "task",
        "timestamp",
        "verification_status",
    )
    list_filter = ("verification_status", "timestamp")
    search_fields = ("scanner__name", "target__name", "task__description")
    list_editable = ("verification_status",)
    readonly_fields = ("timestamp",)


@admin.register(GameState)
class GameStateAdmin(admin.ModelAdmin):
    list_display = ("game_active", "max_winners")

    def has_add_permission(self, request):
        # Prevent creating additional instances
        return not GameState.objects.exists()

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(Winner)
class WinnerAdmin(admin.ModelAdmin):
    list_display = ("player", "win_type", "won_at")
    list_filter = ("win_type",)
    readonly_fields = ("won_at",)
