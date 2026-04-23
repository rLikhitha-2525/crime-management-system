from django.db import models
class CrimeReport(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField()
    crime_type = models.CharField(max_length=50)
    latitude = models.FloatField()
    longitude = models.FloatField()
    status = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title