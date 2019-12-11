from datetime import timedelta

from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from fastapi.security.oauth2 import OAuth2PasswordRequestFormStrict
from pydantic import BaseModel, validator
from starlette.status import HTTP_401_UNAUTHORIZED

from app import settings
from app.asgi import app
from dependencies import is_ajax
from models import User
from utils.password import check_password
from utils.tokens import create_token, revoke_token


class Token(BaseModel):
    access_token: str
    token_type: str
    expires_in: int
    refresh_token: str = None

    @validator("expires_in", pre=True, always=True)
    def convert_timedelta(cls, v):
        if isinstance(v, timedelta):
            return int(v.total_seconds())
        return v


@app.post("/oauth/authorize", response_model=Token)
async def authorize():
    # TODO figure out how to grab the query string and return an authorization
    # code to the redirect url
    pass


@app.post("/oauth/token", response_model=Token)
async def authorization_code_access_token(form_data):
    # TODO figure out how it exchanges for a normal access token
    pass


@app.post("/oauth/revoke", response_model=Token)
async def revoke_access_token(
    token: str = Depends(OAuth2PasswordBearer(tokenUrl="/oauth/login"))
):
    revoke_token(token)


@app.post("/oauth/implicit", response_model=Token)
async def implicit_access_token(form_data):
    # TODO figure out how it exchanges for a normal access token
    pass


@app.post("/oauth/login", response_model=Token)
async def password_access_token(
    form_data: OAuth2PasswordRequestFormStrict = Depends(),
    is_web: bool = Depends(is_ajax),
):
    # https://tools.ietf.org/html/rfc6749#section-4.3
    user = await User.get(User.c.email == form_data.username, True)
    if not user or not check_password(form_data.password, user.password):
        raise HTTPException(
            status_code=HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = (
        timedelta(seconds=settings.TOKEN_EXPIRATION) if is_web else timedelta.max
    )
    access_token = create_token(
        data={"sub": str(user.id)}, expires_delta=access_token_expires
    )
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "expires_in": access_token_expires,
    }
