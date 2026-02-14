from django.urls import path

from . import views

urlpatterns = [
    path("register/", views.register_player, name="register"),
    path("player/<uuid:player_id>/", views.get_player, name="get-player"),
    path("board/<uuid:player_id>/", views.get_board, name="get-board"),
    path("scan/", views.submit_scan, name="submit-scan"),
    path("game-state/", views.get_game_state, name="game-state"),
    path("winners/", views.get_winners, name="winners"),
    path("tasks/", views.get_tasks, name="tasks"),
    path("player/<uuid:player_id>/scans/", views.get_player_scans, name="player-scans"),
]
