"""
PasswordStr and EncryptedStr are two additional Pydantic fields which are not hidden once pulled
from the database unlike SecretStr.
"""
import re
from enum import Enum
from typing import Dict

from pydantic import PositiveInt, constr, ConstrainedStr, UUID4
from pydantic.class_validators import make_generic_validator

from app import settings
from utils.password import is_hashed_password, hash_password, PASSWORD_HASH_LEN


# PrimaryKey normally should be set to pydantic.types.PositiveInt or pydantic.types.UUID4
if settings.PRIMARY_KEY_AS_UUID:
    PrimaryKey = UUID4
else:
    PrimaryKey = PositiveInt
ForeignKey = PrimaryKey
HStore = Dict[str, str]


class ForeignKeyAction(str, Enum):
    """
    The various actions to take on a foreign key on update or delete
    https://www.postgresql.org/docs/9.3/ddl-constraints.html
    """
    RESTRICT = 'RESTRICT'
    NO_ACTION = 'NO ACTION'
    CASCADE = 'CASCADE'
    SET_NULL = 'SET NULL'
    SET_DEFAULT = 'SET DEFAULT'

    def __str__(self):
        return self.value


class PasswordStr(str):
    """
    Type suitable to hash and store a password in the database.
    ALWAYS remember to set write_only=True in the Schema for any field of this type.
    """
    strip_whitespace = True
    min_length = 6
    max_length = 64
    curtail_length = None
    regex = re.compile(r'^\S*$')
    hash_length = PASSWORD_HASH_LEN

    @classmethod
    def __get_constr_validators__(cls):
        constr_type = constr(
            strip_whitespace=cls.strip_whitespace,
            min_length=cls.min_length,
            max_length=cls.max_length,
            curtail_length=cls.curtail_length,
            regex=cls.regex,
        )
        if not hasattr(cls, '_constr_validators'):
            cls._constr_validators = [
                make_generic_validator(v) for v in constr_type.__get_validators__()
            ]
        return cls._constr_validators

    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, value: str, values, field, config) -> str:
        # Because pydantic doesn't allow bypassing validators
        # under certain conditions - apply them here instead
        if not is_hashed_password(value):
            for validator in cls.__get_constr_validators__():
                value = validator(cls, value, values, field, config)
            value = hash_password(value)
        return value


def passwordstr(
        *,
        strip_whitespace: bool = True,
        min_length: int = 6,
        max_length: int = 64,
        curtail_length: int = None,
        regex: str = r'^\S*$',
):
    namespace = dict(
        strip_whitespace=strip_whitespace,
        min_length=min_length,
        max_length=max_length,
        curtail_length=curtail_length,
        regex=regex and re.compile(regex),
        hash_length=PASSWORD_HASH_LEN,
    )
    return type('PasswordStrValue', (PasswordStr,), namespace)


class EncryptedStr(ConstrainedStr):
    """
    Type suitable to encrypt and store text in the database.
    ALWAYS remember to set write_only=True in the Schema for any field of this type.
    """
    strip_whitespace = False
    min_length = None
    max_length = None
    curtail_length = None
    regex = None


def encryptedstr(
        *,
        strip_whitespace: bool = False,
        min_length: int = None,
        max_length: int = None,
        curtail_length: int = None,
        regex: str = None,
):
    namespace = dict(
        strip_whitespace=strip_whitespace,
        min_length=min_length,
        max_length=max_length,
        curtail_length=curtail_length,
        regex=regex and re.compile(regex),
    )
    return type('EncryptedStrValue', (EncryptedStr, ), namespace)
