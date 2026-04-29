from django.conf import settings
from django.db import models


class CaseStatus(models.TextChoices):
    PENDING = "pending", "Pending review"
    APPROVED = "approved", "Approved (on map)"
    RESOLVED = "resolved", "Resolved"
    REJECTED = "rejected", "Rejected"


class CrimeReport(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField()
    crime_type = models.CharField(max_length=50)
    latitude = models.FloatField()
    longitude = models.FloatField()
    case_status = models.CharField(
        max_length=20,
        choices=CaseStatus.choices,
        default=CaseStatus.PENDING,
        db_index=True,
    )
    reported_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="crime_reports",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title


class UserNotification(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notifications",
    )
    message = models.CharField(max_length=500)
    read = models.BooleanField(default=False)
    crime_report = models.ForeignKey(
        CrimeReport,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="notifications",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.message[:50]
