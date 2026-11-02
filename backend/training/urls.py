from django.urls import path
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from .views import register, skills, difficulties, lessons, user_progress, lesson_completions
from django.conf import settings
from django.conf.urls.static import static
from . import views
from . import assessment_views
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
    path("lessons/<int:lesson_id>/complete/", views.LessonCompleteView.as_view()),
    path("profile/", views.ProfileView.as_view()),
    path("change-password/", views.ChangePasswordView.as_view()),
    path("assessments/", assessment_views.AssessmentListView.as_view()),
    path("assessments/history/", assessment_views.AssessmentHistoryView.as_view()),
    path("assessments/attempts/<int:pk>/", assessment_views.AssessmentAttemptDetailView.as_view()),
    path("assessments/<int:pk>/", assessment_views.AssessmentDetailView.as_view()),
    path("assessments/<int:pk>/submit/", assessment_views.AssessmentSubmitView.as_view()),
    path("skills/<int:pk>/recommendations/", assessment_views.SkillRecommendationsView.as_view()),
    path("recommendations/", assessment_views.RecommendationsView.as_view()),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)