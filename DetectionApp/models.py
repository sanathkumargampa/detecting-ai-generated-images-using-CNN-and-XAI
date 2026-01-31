from django.db import models
from django.contrib.auth.models import User

class UserProfile(models.Model):
    """Extended user profile for additional fields"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    mobile = models.CharField(max_length=20, blank=True, null=True, unique=True)
    
    def __str__(self):
        return f"{self.user.username}'s profile"

class AnalysisLog(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    image_path = models.CharField(max_length=255)
    is_real = models.BooleanField()
    confidence = models.FloatField()
    real_prob = models.FloatField(default=0.0)
    fake_prob = models.FloatField(default=0.0)
    explanation_image = models.TextField(blank=True, null=True)
    explanation_text = models.TextField(blank=True, null=True)
    image_hash = models.CharField(max_length=64, blank=True, null=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.timestamp}"

