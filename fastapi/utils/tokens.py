from datetime import datetime, timedelta

import jwt

from app.settings import settings


def create_token(*, data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    to_encode['iss'] = settings.TOKEN_ISSUER
    if expires_delta:
        if expires_delta == timedelta.max:
            to_encode['aud'] = settings.TOKEN_AUDIENCE
        else:
            to_encode['exp'] = datetime.utcnow() + expires_delta
    else:
        to_encode['exp'] = datetime.utcnow() + timedelta(minutes=15)
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.TOKEN_ALGORITHM)
    return encoded_jwt


def revoke_token(token):
    pass
