from django.urls import path
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from .views import register, skills, difficulties, lessons, user_progress

urlpatterns = [
    path('login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('register/', register, name='register'),
    path('skills/', skills, name='skills'),
    path('difficulties/', difficulties, name='difficulties'),
    path('lessons/', lessons, name='lessons' ),
    path('progress/', user_progress, name="user_progress"),
]