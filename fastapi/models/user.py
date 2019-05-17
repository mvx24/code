from datetime import datetime

from pydantic import EmailStr, Schema

from database.models import DbBaseModel
from database.types import PasswordStr


class User(DbBaseModel):
    email: EmailStr = Schema(..., index=True, unique=True)
    password: PasswordStr = Schema(..., write_only=True)
    is_confirmed: bool = Schema(False, read_only=True)
    is_staff: bool = Schema(False, read_only=True)
    is_admin: bool = Schema(False, read_only=True)
    joined: datetime = Schema(None, auto_now_add=True)
