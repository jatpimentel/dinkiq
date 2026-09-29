from django.urls import path
from .views import skills

urlpatterns = [
    path('skills/', skills, name='skills'),
]