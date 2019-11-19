"""
Middleware for adding X-Frame-Options to all responses.
"""
from starlette.middleware.base import BaseHTTPMiddleware

__all__ = ["XFrameHeaderMiddleware"]


X_FRAME_HEADER = "X-Frame-Options"
X_FRAME_SAME_ORIGIN = "sameorigin"


class XFrameHeaderMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        response = await call_next(request)
        if X_FRAME_HEADER not in response.headers:
            response.headers[X_FRAME_HEADER] = X_FRAME_SAME_ORIGIN
        return response
