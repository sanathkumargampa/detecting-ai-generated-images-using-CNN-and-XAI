from django.db import models
from django.contrib.auth.models import User

# Create your models here.
class AnalysisLog(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    image_path = models.CharField(max_length=255)
    is_real = models.BooleanField()
    confidence = models.FloatField()
    real_prob = models.FloatField(default=0.0)
    fake_prob = models.FloatField(default=0.0)
    explanation_image = models.TextField(blank=True, null=True)  # Base64 encoded XAI visualization
    explanation_text = models.TextField(blank=True, null=True)   # Text explanation
    image_hash = models.CharField(max_length=64, blank=True, null=True)  # MD5 hash for duplicate detection
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.timestamp}"
