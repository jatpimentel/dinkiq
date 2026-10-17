from django.urls import path
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from .views import register, skills, difficulties, lessons, user_progress, lesson_completions
from django.conf import settings
from django.conf.urls.static import static
from . import views
urlpatterns = [
    path('login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('register/', register, name='register'),
    path('skills/', skills, name='skills'),
    path('difficulties/', difficulties, name='difficulties'),
    path('lessons/', lessons, name='lessons' ),
    path('progress/', user_progress, name="user_progress"),
    path('lesson-completions/', lesson_completions, name="lesson-completions"),
    path("api/skills/", views.skill_list),
    path("contact/", views.ContactCreateView.as_view()),
    path("dashboard/", views.DashboardView.as_view()),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)