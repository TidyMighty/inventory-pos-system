from django.contrib.auth import get_user_model
from rest_framework import permissions, status, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .permissions import IsAdmin
from .serializers import UserCreateSerializer, UserSerializer

User = get_user_model()


class LoginView(APIView):
    """
    POST /api/auth/login/  {username, password}
    -> {access, refresh, user: {...}}

    Matches frontend/src/api/auth.js, which reads data.access / data.refresh.
    A plain APIView (rather than SimpleJWT's default TokenObtainPairView) so
    we can also hand back the user's role/branch in the same response —
    the frontend needs that to decide what to show without a second request.
    """

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        username = request.data.get("username")
        password = request.data.get("password")

        if not username or not password:
            return Response(
                {"detail": "Username and password are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = User.objects.filter(username=username).first()
        if user is None or not user.check_password(password) or not user.is_active:
            return Response(
                {"detail": "Invalid credentials."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        refresh = RefreshToken.for_user(user)
        return Response(
            {
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "user": UserSerializer(user).data,
            }
        )


class UserViewSet(viewsets.ModelViewSet):
    """
    Admin-only user management: GET/POST /api/users/, GET/PATCH/DELETE /api/users/{id}/
    """

    queryset = User.objects.all().order_by("username")
    permission_classes = [IsAdmin]

    def get_serializer_class(self):
        if self.action == "create":
            return UserCreateSerializer
        return UserSerializer
