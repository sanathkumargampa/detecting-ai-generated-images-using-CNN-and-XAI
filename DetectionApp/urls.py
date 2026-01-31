from django.urls import path
from . import views

urlpatterns = [
    # Legacy routes (kept for backward compatibility)
    path('', views.index, name='home'),
    path('index.html', views.index, name='index'),
    
    # API endpoints
    path('api/login', views.login_api, name='login_api'),
    path('api/register', views.register_api, name='register_api'),
    path('api/logout', views.logout_api, name='logout_api'),
    path('api/reset-password', views.reset_password_api, name='reset_password_api'),
    path('api/history', views.history_api, name='history_api'),
    path('api/predict', views.predict_api, name='predict_api'),
    
    # Admin API endpoints
    path('api/admin/logs', views.admin_logs_api, name='admin_logs_api'),
    path('api/admin/user/<int:user_id>', views.admin_user_api, name='admin_user_api'),
]