@echo off
echo Starting Django Backend...
start "Django Server" cmd /k "python manage.py runserver"

echo Starting React Frontend...
cd frontend
start "React Server" cmd /k "npm run dev"