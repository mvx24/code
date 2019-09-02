"""
Implements DbBaseModel, a Pydantic base class for mapping some schema values
to SQLAlchemy.
"""

from typing import Set, Dict, List

from pydantic import BaseModel, Schema, validate_model
from sqlalchemy import text
from sqlalchemy.sql.expression import ClauseElement, Selectable

from utils.casing import camel_case_dict
from .engine import database, metadata
from .generation import generate_table
from .types import PrimaryKey

__all__ = ["DbBaseModel"]


MetaModel = type(BaseModel)


class DbMetaModel(MetaModel):
    # pylint: disable=no-self-argument

    def __init__(cls, _name, _bases, _dct):
        cls._table = None
        cls._response_class = None
        cls._response_model = None
        cls._write_only = set()
        cls._read_only = set()
        cls._read_only_defaults = dict()
        cls._auto_now = set()
        cls._auto_now_add = set()

        # Translate extra keys of each field Schema because openapi json expects camelCase
        if hasattr(cls, "__fields__"):
            for field in cls.__fields__.values():
                camel_case_dict(field.schema.extra)
                if field.schema.extra.get("auto_now"):
                    cls._auto_now.add(field.name)
                    field.schema.extra["read_only"] = True
                    field.schema.extra["readOnly"] = True
                if field.schema.extra.get("auto_now_add"):
                    cls._auto_now_add.add(field.name)
                    field.schema.extra["read_only"] = True
                    field.schema.extra["readOnly"] = True
                if field.schema.extra.get("writeOnly"):
                    cls._write_only.add(field.name)
                if field.schema.extra.get("readOnly"):
                    cls._read_only.add(field.name)
                    # Read-only fields cannot be required
                    # otherwise there will be no value to run INSERTs with
                    assert not field.required
                    # Default value of None is one of auto_now, server default, primary key etc.
                    # so don't use it for INSERTs
                    if field.default is not None:
                        cls._read_only_defaults[field.name] = field.default

        super().__init__(_name, _bases, _dct)

    @property
    def table(cls):
        if cls._table is None:
            cls._table = generate_table(cls, metadata)
        return cls._table

    @property
    def t(cls):
        if cls._table is None:
            cls._table = generate_table(cls, metadata)
        return cls._table

    @property
    def columns(cls):
        if cls._table is None:
            cls._table = generate_table(cls, metadata)
        return cls._table.c

    @property
    def c(cls):
        if cls._table is None:
            cls._table = generate_table(cls, metadata)
        return cls._table.c


class DbBaseModel(BaseModel, metaclass=DbMetaModel):
    id: PrimaryKey = Schema(None, read_only=True)

    @property
    def is_new(self):
        return self.id is None

    def assign(self, **new_values):
        """
        Validate then assign multiple values if no errors are raised.
        """
        values = self.dict()
        values.update(new_values)
        self.__values__.update(validate_model(self, values)[0])

    @classmethod
    def parse_row(cls, row):
        """
        Convenience method for generating new instance from a RowProxy.
        """
        return cls(**{key: row[key] for key in row.keys()})

    @classmethod
    def parse_rows(cls, rows):
        """
        Convenience method for generating a list of new instances from a ResultProxy.
        """
        return [cls.parse_row(r) for r in rows]

    @classmethod
    async def get(cls, clause_or_row_id, parse=False):
        """
        Get a single model from the database based on id.
        """
        if not isinstance(clause_or_row_id, ClauseElement):
            clause_or_row_id = cls.c.id == clause_or_row_id
        query = cls.table.select().where(clause_or_row_id)
        result = await database.fetch_one(query)
        obj = result
        if parse and obj:
            obj = cls.parse_row(obj)
        return obj

    @classmethod
    async def read(cls, clause_or_select=None, parse=False, start=None, stop=None):
        """
        Read rows from the database, optionally limited and parsed into model instances.
        """
        if not isinstance(clause_or_select, Selectable):
            query = cls.table.select().where(clause_or_select)
        else:
            query = clause_or_select
        if start is not None:
            query = query.offset(start)
        if stop is not None:
            num = stop - (start or 0)
            query = query.limit(num)
        rows = await database.fetch_all(query)
        if parse:
            rows = cls.parse_rows(rows)
        return rows

    async def save(self, update_values=None, read_only=False):
        """
        Insert or update the model with the database.
        Set read_only=True to force writing fields that are publicly read_only.

        NOTE: update_values should NOT be **update_values
        otherwise read_only could get set by some external data
        """
        # pylint: disable=protected-access, no-value-for-parameter
        cls = self.__class__
        table = cls.table
        if not read_only:
            exclude = {"id", *cls._read_only}
        else:
            exclude = {"id"}
        if update_values:
            if not read_only:
                self.assign(
                    **{k: v for k, v in update_values.items() if k not in exclude}
                )
            else:
                self.assign(**update_values)
        values = self.dict(exclude=exclude)
        if self.is_new:
            if not read_only:
                values.update(cls._read_only_defaults)
                self.assign(**cls._read_only_defaults)
            query = table.insert().values(values).return_defaults()
            result = await database.fetch_one(query)
            self.id = result["id"]
            for name in cls._auto_now_add:
                if name in result:
                    setattr(self, name, result[name])
        else:
            # Implement the auto_now functionality
            for name in cls._auto_now:
                values.setdefault(name, text("NOW()"))
            query = (
                table.update()
                .where(table.c.id == self.id)
                .values(values)
                .return_defaults()
            )
            result = await database.fetch_one(query)
            for name in cls._auto_now:
                if name in result:
                    setattr(self, name, result[name])
        return self

    async def delete(self):
        """
        Delete the model from the database.
        """
        # pylint: disable=protected-access, no-value-for-parameter
        table = self.__class__.table
        query = table.delete().where(table.c.id == self.id)
        await database.execute(query)
        return self

    @classmethod
    def response_model(
        cls, name=None, remove: Set[str] = None, embed: Dict[str, BaseModel] = None
    ):
        if not remove and not embed and cls._response_model:
            return cls._response_model
        if not name:
            name = cls.__name__
        if not remove:
            remove = set()
        if not embed:
            embed = {}
        # Copy all the fields by splitting into the values (schemas) and annotation types
        exclude = remove | set([f"{key}_id" for key in embed.keys()]) | cls._write_only
        namespace = {
            key: cls.__fields__[key].schema
            for key in cls.__fields__
            if key not in exclude
        }
        namespace["__annotations__"] = {
            key: cls.__fields__[key].type_
            for key in cls.__fields__
            if key not in exclude
        }
        for key, model in embed.items():
            # All embedded models should also be response_models to remove write_only fields
            if issubclass(model, DbBaseModel):
                model = model.response_model()
            key_id = f"{key}_id"
            # If embedding a ForeignKey assume that it is a single model, otherwise a list
            if key_id in cls.__fields__:
                field = cls.__fields__[key_id]
                namespace[key] = (
                    None if field.default is None and not field.required else ...
                )
                namespace["__annotations__"][key] = model
            else:
                namespace[key] = []
                namespace["__annotations__"][key] = List[model]
        # Copy the config
        namespace["Config"] = cls.__config__
        response_model_cls = type(name, (BaseModel,), namespace)
        # Copy validators after type() since they are already compiled into
        # generic validator functions - no easy way to put them back into a new namespace
        response_model_cls.__validators__.update(
            {
                key: cls.__validators__[key]
                for key in cls.__validators__
                if key not in exclude
            }
        )
        # Cache for later if it is the basic version
        if not remove and not embed:
            cls._response_model = response_model_cls
        return response_model_cls

    # Common Config for all models
    class Config:
        # pylint: disable=too-few-public-methods

        # NOTE: that constr and conbytes both take a strip_whitespace argument
        # which is False by default. Need to set to true because the false by
        # default overrides the config value
        anystr_strip_whitespace = True
        use_enum_values = True
        validate_assignment = True
