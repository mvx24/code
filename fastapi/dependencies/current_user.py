from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer
from jwt import decode, PyJWTError

from models import User
from utils.tokens import DECODE_ARGS, CREDENTIALS_EXCEPTION


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
