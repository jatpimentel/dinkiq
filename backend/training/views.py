from django.shortcuts import render
from rest_framework.response import Response
from rest_framework.decorators import api_view
# Create your views here.

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
