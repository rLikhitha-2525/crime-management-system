from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import api_view, authentication_classes
from rest_framework import status
from rest_framework.authentication import SessionAuthentication
from rest_framework.response import Response
from .models import CrimeReport
from .serializers import CrimeReportSerializer
from django.utils.timezone import now, timedelta


class CsrfExemptSessionAuthentication(SessionAuthentication):
    def enforce_csrf(self, request):
        return


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
    payload["status"] = False
    serializer = CrimeReportSerializer(data=payload)
    if serializer.is_valid():
        serializer.save()
        return Response({"message": "Crime reported"})
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# Get crimes
@api_view(['GET'])
def get_crimes(request):
    crimes = CrimeReport.objects.filter(status=True)
    serializer = CrimeReportSerializer(crimes, many=True)
    return Response(serializer.data)

# Location-based alert
@api_view(['GET'])
def get_alerts(request):
    last_week = now() - timedelta(days=7)
    crimes = CrimeReport.objects.filter(created_at__gte=last_week, status=True)

    area_count = {}
    for crime in crimes:
        key = f"{round(crime.latitude,2)}_{round(crime.longitude,2)}"
        area_count[key] = area_count.get(key, 0) + 1

    high_risk = [k for k,v in area_count.items() if v >= 5]

    return Response({"high_risk_areas": high_risk})
@api_view(['GET'])
def predict_crime(request):
    crimes = CrimeReport.objects.all()

    area_count = {}

    for c in crimes:
        key = f"{round(c.latitude,2)}_{round(c.longitude,2)}"
        area_count[key] = area_count.get(key, 0) + 1

    prediction = [k for k, v in area_count.items() if v >= 3]

    return Response({"predicted_hotspots": prediction})


@api_view(['GET'])
def admin_pending_reports(request):
    if not request.user.is_authenticated:
        return Response({"error": "Authentication required"}, status=status.HTTP_401_UNAUTHORIZED)
    if not (request.user.is_staff or request.user.is_superuser):
        return Response({"error": "Admin access required"}, status=status.HTTP_403_FORBIDDEN)

    reports = CrimeReport.objects.filter(status=False).order_by('-created_at')
    serializer = CrimeReportSerializer(reports, many=True)
    return Response(serializer.data)


@csrf_exempt
@api_view(['POST'])
@authentication_classes([CsrfExemptSessionAuthentication])
def admin_approve_report(request, report_id):
    if not request.user.is_authenticated:
        return Response({"error": "Authentication required"}, status=status.HTTP_401_UNAUTHORIZED)
    if not (request.user.is_staff or request.user.is_superuser):
        return Response({"error": "Admin access required"}, status=status.HTTP_403_FORBIDDEN)

    try:
        report = CrimeReport.objects.get(id=report_id)
    except CrimeReport.DoesNotExist:
        return Response({"error": "Report not found"}, status=status.HTTP_404_NOT_FOUND)

    report.status = True
    report.save(update_fields=["status"])
    return Response({"message": "Report approved"})


@csrf_exempt
@api_view(['DELETE'])
@authentication_classes([CsrfExemptSessionAuthentication])
def admin_reject_report(request, report_id):
    if not request.user.is_authenticated:
        return Response({"error": "Authentication required"}, status=status.HTTP_401_UNAUTHORIZED)
    if not (request.user.is_staff or request.user.is_superuser):
        return Response({"error": "Admin access required"}, status=status.HTTP_403_FORBIDDEN)

    try:
        report = CrimeReport.objects.get(id=report_id)
    except CrimeReport.DoesNotExist:
        return Response({"error": "Report not found"}, status=status.HTTP_404_NOT_FOUND)

    report.delete()
    return Response({"message": "Report rejected"})