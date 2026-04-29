# Generated manually for case workflow + notifications

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


def forwards_status_to_case(apps, schema_editor):
    CrimeReport = apps.get_model("crime_app", "CrimeReport")
    for row in CrimeReport.objects.all():
        if getattr(row, "status", None) is True:
            row.case_status = "approved"
        else:
            row.case_status = "pending"
        row.save(update_fields=["case_status"])


class Migration(migrations.Migration):

    dependencies = [
        ("crime_app", "0002_crimereport_created_at"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddField(
            model_name="crimereport",
            name="case_status",
            field=models.CharField(
                choices=[
                    ("pending", "Pending review"),
                    ("approved", "Approved (on map)"),
                    ("resolved", "Resolved"),
                    ("rejected", "Rejected"),
                ],
                db_index=True,
                default="pending",
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name="crimereport",
            name="reported_by",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="crime_reports",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.RunPython(forwards_status_to_case, migrations.RunPython.noop),
        migrations.RemoveField(
            model_name="crimereport",
            name="status",
        ),
        migrations.CreateModel(
            name="UserNotification",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("message", models.CharField(max_length=500)),
                ("read", models.BooleanField(default=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "crime_report",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="notifications",
                        to="crime_app.crimereport",
                    ),
                ),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="notifications",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "ordering": ["-created_at"],
            },
        ),
    ]
