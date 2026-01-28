from django.urls import path

from . import views

urlpatterns = [path("index.html", views.index, name="index"),
		     path("UserLogin.html", views.UserLogin, name="UserLogin"),
             path('', views.index, name='home'),
		     path("UserLoginAction", views.UserLoginAction, name="UserLoginAction"),
		     path("SingleImage.html", views.SingleImage, name="SingleImage"),
		     path("SingleImageAction", views.SingleImageAction, name="SingleImageAction"),
             path("api/login", views.login_api, name="login_api"),
             path("api/predict", views.predict_api, name="predict_api"),		     
		     
		    ]