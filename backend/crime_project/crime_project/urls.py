from django.contrib import admin
from django.urls import path
from crime_app import views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/report/', views.submit_crime),
    path('api/crimes/', views.get_crimes),
    path('api/alerts/', views.get_alerts),

    path('api/predict/', views.predict_crime),
]