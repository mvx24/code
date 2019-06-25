from datetime import datetime, timedelta

from fastapi import HTTPException
import jwt
from starlette.status import HTTP_401_UNAUTHORIZED

from app import settings


CREDENTIALS_EXCEPTION = HTTPException(
    status_code=HTTP_401_UNAUTHORIZED,
    detail="Could not validate credentials",
    headers={"WWW-Authenticate": "Bearer"},
)


DECODE_ARGS = {
    "key": settings.SECRET_KEY,
    "issuer": settings.TOKEN_ISSUER,
    "algorithms": [settings.TOKEN_ALGORITHM],
}


def create_token(*, data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    to_encode["iss"] = settings.TOKEN_ISSUER
    if expires_delta:
        if expires_delta == timedelta.max:
            to_encode["aud"] = settings.TOKEN_AUDIENCE
        else:
            to_encode["exp"] = datetime.utcnow() + expires_delta
    else:
        to_encode["exp"] = datetime.utcnow() + timedelta(minutes=15)
    encoded_jwt = jwt.encode(
        to_encode, settings.SECRET_KEY, algorithm=settings.TOKEN_ALGORITHM
    )
    return encoded_jwt


def revoke_token(token):
    pass
