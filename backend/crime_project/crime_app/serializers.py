from rest_framework import serializers
from .models import CrimeReport, UserNotification


class CrimeReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = CrimeReport
        fields = "__all__"
        read_only_fields = ("id", "case_status", "reported_by", "created_at")


class UserNotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserNotification
        fields = ("id", "message", "read", "created_at", "crime_report")
