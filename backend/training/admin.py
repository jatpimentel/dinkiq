from django.contrib import admin
from .models import Skill,Difficulty,Lesson,Drill, UserSkillProgress
# Register your models here.

admin.site.register(Skill)
admin.site.register(Difficulty)
admin.site.register(Lesson)
admin.site.register(Drill)
admin.site.register(UserSkillProgress)