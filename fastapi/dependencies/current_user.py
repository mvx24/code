from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from jwt import decode, PyJWTError
from starlette.status import HTTP_401_UNAUTHORIZED

from app import settings
from models import User


CREDENTIALS_EXCEPTION = HTTPException(
    status_code=HTTP_401_UNAUTHORIZED,
    detail='Could not validate credentials',
    headers={'WWW-Authenticate': 'Bearer'},
)


DECODE_ARGS = {
    'key': settings.SECRET_KEY,
    'issuer': settings.TOKEN_ISSUER,
    'algorithms': [settings.TOKEN_ALGORITHM],
}


async def current_user(token: str = Depends(OAuth2PasswordBearer(tokenUrl='/oauth/login'))):
    try:
        payload = decode(token, **DECODE_ARGS)
        user_id: str = payload.get('sub')
        if not user_id:
            raise CREDENTIALS_EXCEPTION
    except PyJWTError:
        raise CREDENTIALS_EXCEPTION
    user = await User.get(user_id, True)
    if user is None:
        raise CREDENTIALS_EXCEPTION
    return user
