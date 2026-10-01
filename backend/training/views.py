from django.shortcuts import render
from rest_framework.response import Response
from rest_framework.decorators import api_view
from django.contrib.auth.models import User
from rest_framework import status
# Create your views here.

@api_view(['POST'])
def register(request):
    username = request.data.get("username")
    email = request.data.get("email")
    password = request.data.get("password")

    if not username or not password:
        return Response(
            {"error": "Username and passowrd are required."},
            status=status.HTTP_400_BAD_REQUEST
        )

    if User.objects.filter(username=username).exists():
        return Response(
            {"error": "Username already exists."},
            status=status.HTTP_400_BAD_REQUEST
        )

    user = User.objects.create_user(
        username=username,
        email=email,
        password=password
    )

    return Response(
        {
            "message": "User created successfully.",
            "username": user.username,
        },
        status=status.HTTP_201_CREATED
    )



@api_view(['GET'])
def skills(request):
    return Response([
        {
            "id": 1,
            "name": "Dinking"
        },
        {
            "id": 2,
            "name": "Serving"
        },
        {
            "id": 3,
            "name": "Third Shot Drop"
        }
    ])
