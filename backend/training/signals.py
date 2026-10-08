from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import Skill, UserSkillProgress


@receiver(post_save, sender=User)
def create_user_skill_progress(sender, instance, created, **kwargs):
    if created:
        skills = Skill.objects.all()

        for skill in skills:
            UserSkillProgress.objects.create(
                user=instance,
                skill=skill
            )