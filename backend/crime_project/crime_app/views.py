from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import CrimeReport
from .serializers import CrimeReportSerializer
from django.utils.timezone import now, timedelta

# Submit crime
@api_view(['POST'])
def submit_crime(request):
    serializer = CrimeReportSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response({"message": "Crime reported"})
    return Response(serializer.errors)

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

    prediction = [k for k,v in area_count.items() if v >= 3]

    return Response({"predicted_hotspots": prediction})