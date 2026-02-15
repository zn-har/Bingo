from django.contrib import admin
from django.utils.html import format_html

from .models import GameState, Player, ScanRecord, Task, Winner


class ScanRecordInline(admin.TabularInline):
    model = ScanRecord
    fk_name = "scanner"
    extra = 0
    readonly_fields = ("target", "task", "timestamp", "verification_status")
    can_delete = False
    show_change_link = True
    verbose_name = "Scan Record"
    verbose_name_plural = "Scan Records"


@admin.register(Player)
class PlayerAdmin(admin.ModelAdmin):
    list_display = ("name", "phone", "scan_count", "created_at")
    search_fields = ("name", "phone")
    readonly_fields = ("id", "qr_code")
    inlines = [ScanRecordInline]

    def scan_count(self, obj):
        return obj.scans_made.count()

    scan_count.short_description = "Scans"


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ("position", "description")
    list_editable = ("description",)
    ordering = ("position",)
    search_fields = ("description",)


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
    list_display = ("__str__", "game_active", "max_winners", "allow_duplicate_scans")
    list_editable = ("game_active", "max_winners", "allow_duplicate_scans")

    def has_add_permission(self, request):
        # Prevent creating additional instances
        return not GameState.objects.exists()

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(Winner)
class WinnerAdmin(admin.ModelAdmin):
    list_display = ("player", "win_type", "won_at", "scan_count", "view_scans_link")
    list_filter = ("win_type",)
    readonly_fields = ("won_at", "player_scans")

    def scan_count(self, obj):
        return ScanRecord.objects.filter(scanner=obj.player).count()

    scan_count.short_description = "Total Scans"

    def view_scans_link(self, obj):
        return format_html(
            '<a href="/admin/game/scanrecord/?scanner__id__exact={}">View Scans</a>',
            obj.player_id,
        )

    view_scans_link.short_description = "Scan Records"

    def player_scans(self, obj):
        scans = ScanRecord.objects.filter(scanner=obj.player).select_related("target", "task")
        if not scans:
            return "No scan records"
        rows = []
        for s in scans:
            status_color = {"approved": "green", "rejected": "red"}.get(s.verification_status, "orange")
            rows.append(
                f"<tr><td>{s.task.description}</td>"
                f"<td>{s.target.name}</td>"
                f"<td>{s.timestamp.strftime('%Y-%m-%d %H:%M')}</td>"
                f'<td style="color:{status_color}">{s.verification_status}</td></tr>'
            )
        return format_html(
            '<table style="border-collapse:collapse;width:100%">'
            "<tr><th style='text-align:left;padding:4px 8px'>Task</th>"
            "<th style='text-align:left;padding:4px 8px'>Scanned Player</th>"
            "<th style='text-align:left;padding:4px 8px'>Time</th>"
            "<th style='text-align:left;padding:4px 8px'>Status</th></tr>"
            "{}</table>",
            format_html("".join(rows)),
        )

    player_scans.short_description = "Scan Records"
