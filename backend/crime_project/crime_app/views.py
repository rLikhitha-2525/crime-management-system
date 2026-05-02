from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import api_view, authentication_classes
from rest_framework import status
from rest_framework.authentication import SessionAuthentication
from rest_framework.response import Response
from .models import CrimeReport, UserNotification, CaseStatus
from .serializers import CrimeReportSerializer, UserNotificationSerializer
from django.utils.timezone import now, timedelta


class CsrfExemptSessionAuthentication(SessionAuthentication):
    def enforce_csrf(self, request):
        return


def _admin_required(request):
    if not request.user.is_authenticated:
        return Response({"error": "Authentication required"}, status=status.HTTP_401_UNAUTHORIZED)
    if not (request.user.is_staff or request.user.is_superuser):
        return Response({"error": "Admin access required"}, status=status.HTTP_403_FORBIDDEN)
    return None


def _notify_reporter(report, message):
    if report.reported_by_id:
        UserNotification.objects.create(
            user_id=report.reported_by_id,
            message=message,
            crime_report=report,
        )


@csrf_exempt
@api_view(['POST'])
def register_user(request):
    username = request.data.get("username")
    password = request.data.get("password")

    if not username or not password:
        return Response({"error": "username and password are required"}, status=status.HTTP_400_BAD_REQUEST)

    if User.objects.filter(username=username).exists():
        return Response({"error": "Username already exists"}, status=status.HTTP_400_BAD_REQUEST)

    user = User.objects.create_user(username=username, password=password)
    return Response(
        {
            "message": "Registration successful",
            "username": user.username,
            "is_admin": user.is_staff or user.is_superuser,
        },
        status=status.HTTP_201_CREATED
    )


@csrf_exempt
@api_view(['POST'])
def login_user(request):
    username = request.data.get("username")
    password = request.data.get("password")

    if not username or not password:
        return Response({"error": "username and password are required"}, status=status.HTTP_400_BAD_REQUEST)

    user = authenticate(request, username=username, password=password)
    if not user:
        return Response({"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)

    login(request, user)
    return Response(
        {
            "message": "Login successful",
            "username": user.username,
            "is_admin": user.is_staff or user.is_superuser,
        }
    )


@csrf_exempt
@api_view(['POST'])
@authentication_classes([CsrfExemptSessionAuthentication])
def logout_user(request):
    logout(request)
    return Response({"message": "Logout successful"})


@api_view(['GET'])
@authentication_classes([CsrfExemptSessionAuthentication])
def current_user(request):
    if not request.user.is_authenticated:
        return Response({"error": "Not authenticated"}, status=status.HTTP_401_UNAUTHORIZED)

    return Response(
        {
            "username": request.user.username,
            "is_admin": request.user.is_staff or request.user.is_superuser,
        }
    )


@csrf_exempt
@api_view(['POST'])
@authentication_classes([CsrfExemptSessionAuthentication])
def submit_crime(request):
    if not request.user.is_authenticated:
        return Response({"error": "Authentication required"}, status=status.HTTP_401_UNAUTHORIZED)

    payload = request.data.copy()
    serializer = CrimeReportSerializer(data=payload)
    if serializer.is_valid():
        serializer.save(
            case_status=CaseStatus.PENDING,
            reported_by=request.user,
        )
        return Response({"message": "Crime reported"})
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
def get_crimes(request):
    """Public map + list: only open (approved) cases — not resolved or pending."""
    crimes = CrimeReport.objects.filter(case_status=CaseStatus.APPROVED).order_by("-created_at")
    serializer = CrimeReportSerializer(crimes, many=True)
    return Response(serializer.data)


@api_view(['GET'])
def get_alerts(request):
    last_week = now() - timedelta(days=7)
    crimes = CrimeReport.objects.filter(
        created_at__gte=last_week,
        case_status=CaseStatus.APPROVED,
    )

    area_count = {}
    for crime in crimes:
        key = f"{round(crime.latitude,2)}_{round(crime.longitude,2)}"
        # key = f"{round(crime.latitude, 3)}_{round(crime.longitude, 3)}"
        area_count[key] = area_count.get(key, 0) + 1

    zones = []

    for k, v in area_count.items():
        lat, lng = k.split("_")

        if v >= 10:
            level = "high"
        elif v >= 7:
            level = "medium"
        elif v >= 5:
            level = "low"
        else:
            continue

        zones.append({
            "lat": float(lat),
            "lng": float(lng),
            "count": v,
            "level": level
        })

    return Response({"zones": zones})


@api_view(['GET'])
def predict_crime(request):
    """Hotspot prediction uses approved + resolved (verified real incidents), not rejected or pending."""
    crimes = CrimeReport.objects.filter(
        case_status__in=[CaseStatus.APPROVED, CaseStatus.RESOLVED],
    )

    area_count = {}

    for c in crimes:
        key = f"{round(c.latitude,2)}_{round(c.longitude,2)}"
        area_count[key] = area_count.get(key, 0) + 1

    prediction = [k for k, v in area_count.items() if v >= 3]
    return Response({"predicted_hotspots": prediction})
    # for k, v in area_count.items():
    #     lat, lng = k.split("_")

    #     if 3 <= v < 5:
    #         predictions.append({
    #             "lat": float(lat),
    #             "lng": float(lng),
    #             "count": v
    #         })

    # return Response({"predicted_hotspots": predictions})


@api_view(['GET'])
@authentication_classes([CsrfExemptSessionAuthentication])
def my_reports(request):
    if not request.user.is_authenticated:
        return Response({"error": "Authentication required"}, status=status.HTTP_401_UNAUTHORIZED)

    reports = CrimeReport.objects.filter(reported_by=request.user).order_by("-created_at")
    serializer = CrimeReportSerializer(reports, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@authentication_classes([CsrfExemptSessionAuthentication])
def list_notifications(request):
    if not request.user.is_authenticated:
        return Response({"error": "Authentication required"}, status=status.HTTP_401_UNAUTHORIZED)

    items = UserNotification.objects.filter(user=request.user)[:50]
    serializer = UserNotificationSerializer(items, many=True)
    unread = UserNotification.objects.filter(user=request.user, read=False).count()
    return Response({"notifications": serializer.data, "unread_count": unread})


@csrf_exempt
@api_view(['POST'])
@authentication_classes([CsrfExemptSessionAuthentication])
def mark_notification_read(request, notification_id):
    if not request.user.is_authenticated:
        return Response({"error": "Authentication required"}, status=status.HTTP_401_UNAUTHORIZED)

    try:
        note = UserNotification.objects.get(id=notification_id, user=request.user)
    except UserNotification.DoesNotExist:
        return Response({"error": "Not found"}, status=status.HTTP_404_NOT_FOUND)

    note.read = True
    note.save(update_fields=["read"])
    return Response({"message": "OK"})


@api_view(['GET'])
@authentication_classes([CsrfExemptSessionAuthentication])
def admin_pending_reports(request):
    err = _admin_required(request)
    if err:
        return err

    reports = CrimeReport.objects.filter(case_status=CaseStatus.PENDING).order_by('-created_at')
    serializer = CrimeReportSerializer(reports, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@authentication_classes([CsrfExemptSessionAuthentication])
def admin_active_reports(request):
    err = _admin_required(request)
    if err:
        return err

    reports = CrimeReport.objects.filter(case_status=CaseStatus.APPROVED).order_by('-created_at')
    serializer = CrimeReportSerializer(reports, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@authentication_classes([CsrfExemptSessionAuthentication])
def admin_rejected_reports(request):
    err = _admin_required(request)
    if err:
        return err

    reports = CrimeReport.objects.filter(case_status=CaseStatus.REJECTED).order_by('-created_at')
    serializer = CrimeReportSerializer(reports, many=True)
    return Response(serializer.data)


@csrf_exempt
@api_view(['POST'])
@authentication_classes([CsrfExemptSessionAuthentication])
def admin_approve_report(request, report_id):
    err = _admin_required(request)
    if err:
        return err

    try:
        report = CrimeReport.objects.get(id=report_id)
    except CrimeReport.DoesNotExist:
        return Response({"error": "Report not found"}, status=status.HTTP_404_NOT_FOUND)

    if report.case_status != CaseStatus.PENDING:
        return Response({"error": "Report is not pending review"}, status=status.HTTP_400_BAD_REQUEST)

    report.case_status = CaseStatus.APPROVED
    report.save(update_fields=["case_status"])

    _notify_reporter(
        report,
        f'Your report "{report.title}" was approved and is now shown on the public map.',
    )
    return Response({"message": "Report approved"})


@csrf_exempt
@api_view(['DELETE'])
@authentication_classes([CsrfExemptSessionAuthentication])
def admin_reject_report(request, report_id):
    err = _admin_required(request)
    if err:
        return err

    try:
        report = CrimeReport.objects.get(id=report_id)
    except CrimeReport.DoesNotExist:
        return Response({"error": "Report not found"}, status=status.HTTP_404_NOT_FOUND)

    if report.case_status != CaseStatus.PENDING:
        return Response({"error": "Only pending reports can be rejected here"}, status=status.HTTP_400_BAD_REQUEST)

    report.case_status = CaseStatus.REJECTED
    report.save(update_fields=["case_status"])

    _notify_reporter(report, f'Your report "{report.title}" was rejected.')
    return Response({"message": "Report rejected"})


@csrf_exempt
@api_view(['POST'])
@authentication_classes([CsrfExemptSessionAuthentication])
def admin_resolve_report(request, report_id):
    err = _admin_required(request)
    if err:
        return err

    try:
        report = CrimeReport.objects.get(id=report_id)
    except CrimeReport.DoesNotExist:
        return Response({"error": "Report not found"}, status=status.HTTP_404_NOT_FOUND)

    if report.case_status != CaseStatus.APPROVED:
        return Response({"error": "Only active approved cases can be marked resolved"}, status=status.HTTP_400_BAD_REQUEST)

    report.case_status = CaseStatus.RESOLVED
    report.save(update_fields=["case_status"])

    _notify_reporter(
        report,
        f'Your report "{report.title}" was marked resolved. It no longer appears on the live map but still counts toward hotspot analysis.',
    )
    return Response({"message": "Case marked resolved"})
