from django.contrib import admin
from django.urls import path
from crime_app import views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/register/', views.register_user),
    path('api/login/', views.login_user),
    path('api/logout/', views.logout_user),
    path('api/me/', views.current_user),
    path('api/report/', views.submit_crime),
    path('api/crimes/', views.get_crimes),
    path('api/alerts/', views.get_alerts),
    path('api/predict/', views.predict_crime),
    path('api/admin/pending/', views.admin_pending_reports),
    path('api/admin/approve/<int:report_id>/', views.admin_approve_report),
    path('api/admin/reject/<int:report_id>/', views.admin_reject_report),
]