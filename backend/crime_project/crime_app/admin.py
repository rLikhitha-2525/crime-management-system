from django.contrib import admin
from .models import CrimeReport, UserNotification


@admin.register(CrimeReport)
class CrimeReportAdmin(admin.ModelAdmin):
    list_display = ("title", "crime_type", "case_status", "reported_by", "created_at")
    list_filter = ("case_status", "crime_type")


@admin.register(UserNotification)
class UserNotificationAdmin(admin.ModelAdmin):
    list_display = ("message", "user", "read", "created_at")
    list_filter = ("read",)
