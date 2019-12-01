"""
Exposes a generate_table function that will map a Pydantic model (DbBaseModel)
to SQLAlchemy database schema.

How the Pydantic mapping logic works:

* Any field ending with _id will become a ForeignKey and the type ForeignKey
should be used so it matches the type of the id it is references

* A default value of None needs to be explicitly provided to make a field nullable

* DO NOT USE SecretStr or SecretBytes, these don't encode into JSON or provide
values when calling dict() to insert into the database

* index=True and unique=True are valid arguments to Schema and
will create appropriate indexes on the server

* indexing on a PrimaryKey is automatic and not optional

* unique_together=(tuple of other fields, ) will create a unique constraint that
combines with other fields on the model

* on_update='<action>' and on_delete='<action>' are also valid for ForeignKey fields,
where valid actions are: "RESTRICT", "NO ACTION", "CASCADE" (default), "SET NULL", "SET DEFAULT"
Use the enum provided from database.types.ForeignKeyAction
See - https://www.postgresql.org/docs/9.3/ddl-constraints.html

* auto_now_add=True will set a Postgres supported DEFAULT NOW() to the column in postgresql

* auto_now=True is also supported, however it cannot be added the same as auto_now_add because
Postgres has no ON UPDATE on columns, so it is implemented as a default value when using the
save() method of a model

* One-To-One relationships are manually implemented by defining an _id on both models

* Many-To-Many relationships are manually implemented by creating a join table model with both _ids

* ForeignKeys must have the _id suffix

* ForeignKeys auto link to table matching the field name without the _id

* To avoid the auto link with ForeignKeys, specify a 'to' parameter in the Schema
e.g. author_id: ForeignKey = Schema(None, to='User')

* Generic ForeignKeys are created by adding generic=True to the schema, this simply skips adding the constraints on the table

* Embedding models via response_model() will assume that if an _id field is defined it will embed a
single object (as in ForeignKey and One-to-One relationships), otherwise it will embed a list
(as in ManytoMany or reverse ForeignKey relationships)

* To use the column types of ARRAY, JSON, HSTORE, or JSONB see the following mapping:
    list, tuple, set -> ARRAY[str]
    List[type], Tuple[type], Set[type] -> ARRAY[type]
    dict -> JSON
    Dict[str,str] -> HSTORE
    Json -> JSONB

"""

from datetime import datetime, date, time, timedelta
from enum import Enum
from pathlib import Path
from typing import get_type_hints
from uuid import UUID as UUID_Type

# https://github.com/samuelcolvin/pydantic/blob/master/pydantic/types.py
from pydantic.types import (
    ConstrainedDecimal,
    ConstrainedInt,
    ConstrainedStr,
    Decimal,
    EmailStr,
    IPvAnyAddress,
    IPvAnyInterface,
    IPvAnyNetwork,
    StrictStr,
    UrlStr,
    UUID1 as UUID1_Type,
)

from sqlalchemy import (
    Table,
    Column,
    Index,
    ForeignKey,
    UniqueConstraint,
    text,
    FetchedValue,
)
from sqlalchemy.types import TypeDecorator

# https://github.com/sqlalchemy/sqlalchemy/blob/master/lib/sqlalchemy/dialects/postgresql/__init__.py
from sqlalchemy.dialects.postgresql import (
    ARRAY,
    BIGINT,
    BOOLEAN,
    CIDR,
    DATE,
    ENUM,
    FLOAT,
    HSTORE,
    INET,
    INTEGER,
    INTERVAL,
    JSON,
    JSONB,
    NUMERIC,
    SMALLINT,
    TIME,
    TIMESTAMP,
    TEXT,
    UUID,
    VARCHAR,
)

from app import settings
from utils.casing import camel_to_snake_case
from utils.encryption import encrypt, decrypt
from .types import Json, PasswordStr, EncryptedStr, ForeignKeyAction

__all__ = ["generate_table"]


TABLE_CACHE = {}
ENUM_CACHE = {}


# https://docs.sqlalchemy.org/en/13/core/custom_types.html
class ENCRYPTEDTEXT(TypeDecorator):
    # pylint: disable=abstract-method

    impl = TEXT

    def process_bind_param(self, value, dialect):
        return encrypt(value)

    def process_result_value(self, value, dialect):
        return decrypt(value)


# The following pydantic types having matching subclasses below:
# ConstrainedDecimal - Decimal
# ConstrainedFloat - float
# PositiveInt - ConstrainedInteger
# PositiveFloat - float
# NegativeInt - ConstrainedInteger
# NegativeFloat - float
# FilePath - Path
# DirectoryPath - Path
# UUID1 - UUID
# UUID3 - UUID
# UUID4 - UUID
# UUID5 - UUID
# SecretStr - Should not be used
# SecretBytes - Should not be used


def map_type(type_):
    # https://www.postgresql.org/docs/9.3/datatype.html
    sql_type = None

    # Map the type to a sql alchemy postgres type
    if hasattr(type_, "__origin__"):
        # List, Tuple, Set, and Dict from typing module
        # Assumed to only allow one subtype at a time
        # This matching is first because these typings
        # raise an exception when passed to issubclass()
        if issubclass(type_.__origin__, (list, tuple, set)):
            sql_type = ARRAY(map_type(type_.__args__[0]))
        if issubclass(type_.__origin__, dict):
            if type_.__args__ == (str, str):
                sql_type = HSTORE
            else:
                sql_type = JSON
    elif type_ is str:
        sql_type = TEXT
    elif type_ is int:
        sql_type = INTEGER
    elif type_ is bool:
        sql_type = BOOLEAN
    elif issubclass(type_, float):
        sql_type = FLOAT
    elif type_ is dict:
        sql_type = JSON
    elif type_ in (list, tuple, set):
        # Assumed to be an array of strings
        sql_type = ARRAY(VARCHAR(255))
    elif issubclass(type_, Decimal):
        if issubclass(type_, ConstrainedDecimal):
            sql_type = NUMERIC(precision=type_.max_digits, scale=type_.decimal_places)
        else:
            sql_type = NUMERIC
    elif issubclass(type_, Enum) and type_ in ENUM_CACHE:
        sql_type = ENUM_CACHE[type_]
    elif type_ is datetime:
        # defaults to timezone=False
        sql_type = TIMESTAMP
    elif type_ is date:
        sql_type = DATE
    elif type_ is time:
        # defaults to timezone=False
        sql_type = TIME
    elif type_ is timedelta:
        sql_type = INTERVAL
    elif issubclass(type_, PasswordStr):
        sql_type = VARCHAR(type_.hash_length)
    elif issubclass(type_, EncryptedStr):
        sql_type = ENCRYPTEDTEXT
    elif issubclass(type_, ConstrainedStr):
        sql_type = VARCHAR(type_.max_length)
    elif issubclass(type_, ConstrainedInt):
        lower = -2147483647
        upper = 2147483647
        if type_.gt is not None or type_.ge is not None:
            lower = max((type_.gt or -1) + 1, type_.ge or 0)
        if type_.lt is not None or type_.le is not None:
            upper = min((type_.lt or 1) - 1, type_.le or 0)
        # Both between -32768 and 32767
        if abs(lower) <= 32767 and abs(upper) <= 32767:
            sql_type = SMALLINT
        # Both between -2147483648 and 2147483647
        elif abs(lower) <= 2147483647 and abs(upper) <= 2147483647:
            sql_type = INTEGER
        # Both between -9223372036854775808 and 9223372036854775807
        elif abs(lower) <= 9223372036854775807 and abs(upper) <= 9223372036854775807:
            sql_type = BIGINT
        else:
            sql_type = NUMERIC
    elif type_ is EmailStr:
        # An email may be up to <64>@<255> long (320 chars) according to the validator
        # For practicality use a smaller size
        sql_type = VARCHAR(127)
    elif type_ is Json:
        sql_type = JSONB
    elif issubclass(type_, UUID_Type):
        # pg8000 - use as_uuid, otherwise SA attempts to create a UUID first for compiling queries
        # creating a UUID obj from a UUID obj throws an error and Pydantic fields are UUID objs
        # the logic for as_uuid is inverted for pg8000 vs the base implementation
        # https://github.com/sqlalchemy/sqlalchemy/blob/master/lib/sqlalchemy/dialects/postgresql/base.py#L1211
        # https://github.com/sqlalchemy/sqlalchemy/blob/master/lib/sqlalchemy/dialects/postgresql/pg8000.py#L129
        as_uuid = settings.DB_DRIVERNAME == "postgresql+pg8000"
        sql_type = UUID(as_uuid=as_uuid)
    elif issubclass(type_, UrlStr):
        sql_type = VARCHAR(type_.max_length)
    elif issubclass(type_, Path):
        # Paths don't seem to have a length limit so use TEXT
        sql_type = TEXT
    elif type_ is IPvAnyAddress or type_ is IPvAnyInterface:
        sql_type = INET
    elif type_ is IPvAnyNetwork:
        sql_type = CIDR
    elif type_ is StrictStr:
        sql_type = TEXT
    else:
        print(f"Error: Unsupported type {type_}")
    return sql_type


def generate_column(table_name, field, type_):
    name = field.name
    sql_type = map_type(type_)
    args = []
    kwargs = {"nullable": False}
    items = []

    # Indexing
    if field.schema.extra.get("index"):
        gin_types = (ARRAY, HSTORE, JSONB)
        if sql_type in gin_types or isinstance(sql_type, gin_types):
            items.append(Index(f"ix_{table_name}_{name}", name, postgresql_using="gin"))
            # For trigrams use the optional arg: postgresql_ops={name: 'gin_trgm_ops'}
        kwargs["index"] = True

    # Unique index
    if field.schema.extra.get("unique"):
        kwargs["index"] = True
        kwargs["unique"] = True

    # Unique together constraints
    if "unique_together" in field.schema.extra:
        unique_together = field.schema.extra["unique_together"]
        if isinstance(unique_together, str):
            unique_together = (unique_together,)
        unique_together = set(unique_together)
        unique_together.add(name)
        unique_together = sorted(unique_together)
        unique_name = f'uix_{table_name}_{"_".join(unique_together)}'
        items.append(UniqueConstraint(*unique_together, name=unique_name))

    # Check primary key and nullable
    if name == "id":
        kwargs["primary_key"] = True
        kwargs["index"] = True
        # No need to set autoincrement, it is already set for INTEGER types
        # https://docs.sqlalchemy.org/en/13/core/metadata.html#sqlalchemy.schema.Column.params.autoincrement
        if sql_type is UUID or isinstance(sql_type, UUID):
            # Support v1 and v4 (random), v1 is not recommended
            # because much of the UUID will remain the same as the MAC address
            if type_ is UUID1_Type:
                kwargs["server_default"] = text("uuid_generate_v1()")
            else:
                kwargs["server_default"] = text("uuid_generate_v4()")
    elif field.default is None and not field.required:
        kwargs["nullable"] = True

    # Check for foreign key constraints
    if name.endswith("_id") and not field.schema.extra.get("generic", False):
        foreign_table = camel_to_snake_case(field.schema.extra.get("to", name[:-3]))
        on_update = str(field.schema.extra.get("on_update", ForeignKeyAction.CASCADE))
        on_delete = str(field.schema.extra.get("on_delete", ForeignKeyAction.CASCADE))
        args.append(
            ForeignKey(f"{foreign_table}.id", onupdate=on_update, ondelete=on_delete)
        )

    # Auto now defaults
    if field.schema.extra.get("auto_now"):
        # Postgres doesn't have an ON UPDATE default value, so just mark
        # this column as having a returned value and implement the default in save()
        kwargs["server_onupdate"] = FetchedValue()
    if field.schema.extra.get("auto_now_add"):
        kwargs["server_default"] = text("NOW()")

    return (Column(name, sql_type, *args, **kwargs), items)


def generate_table(model, metadata):
    name = model.__name__
    if name in TABLE_CACHE:
        return TABLE_CACHE[name]
    columns = []
    schema_items = []
    table_name = camel_to_snake_case(name)
    for key, field in model.__fields__.items():
        if field.schema.extra.get("computed"):
            continue
        # Enums need to be created as special sql types so check for them first here
        # Alembic migrations do not need this however, so metadata is set to None
        type_ = get_type_hints(model)[key]
        if (
            isinstance(type_, type)
            and issubclass(type_, Enum)
            and type_ not in ENUM_CACHE
        ):
            enums = [o.value for o in type_]
            enum_name = camel_to_snake_case(type_.__name__)
            ENUM_CACHE[type_] = ENUM(
                *enums,
                name=enum_name,
                metadata=None
                if settings.DB_DRIVERNAME == "postgresql+pg8000"
                else metadata,
            )
        column, items = generate_column(table_name, field, type_)
        columns.append(column)
        schema_items.extend(items)
    table = Table(table_name, metadata, *columns, *schema_items)
    TABLE_CACHE[name] = table
    return table
