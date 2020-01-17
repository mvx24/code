"""
Implements DbBaseModel, a Pydantic base class for mapping some schema values
to SQLAlchemy.
"""

from datetime import datetime, timezone
from typing import get_type_hints, Set, Dict, List

from pydantic import BaseModel, Schema, validate_model, validator, Extra
from pydantic.validators import _VALIDATORS
from sqlalchemy import text, literal_column, String, func
from sqlalchemy.sql.expression import ClauseElement, Selectable, union_all, select

from utils.casing import camel_case_dict, camel_to_snake_case
from .engine import database, metadata
from .generation import generate_table
from .types import PrimaryKey

__all__ = ["DbBaseModel", "AbstractDbBaseModel", "RequestData"]


MetaModel = type(BaseModel)


# Add a global datetime validator to make all datetimes naive utc times by default
def remove_tzinfo(dt):
    if dt.tzinfo:
        dt = dt.astimezone(timezone.utc)
        dt = dt.replace(tzinfo=None)
    return dt


for field_type_, funcs in _VALIDATORS:
    remove_tzinfo_added = False
    if field_type_ is datetime:
        funcs.append(remove_tzinfo)
        remove_tzinfo_added = True
    if not remove_tzinfo:
        print(f"\033[1;31mError on adding global timezone removal validator!\033[0m")
        exit(1)


class DbMetaModel(MetaModel):
    # pylint: disable=no-self-argument

    def __init__(cls, _name, _bases, _dct):
        cls._table = None
        cls._response_class = None
        cls._response_model = None
        cls._write_only = set()
        cls._read_only = set()
        cls._read_only_defaults = dict()
        cls._computed = set()
        cls._auto_now = set()
        cls._auto_now_add = set()

        # Remove the _type/subclass_name field from AbstractDbBaseModel
        # as this will be a non-abstract class
        if hasattr(cls, "__fields__"):
            if "subclass_name" in cls.__fields__:
                del cls.__fields__["subclass_name"]
        if hasattr(cls, "__validators__"):
            if "subclass_name" in cls.__validators__:
                del cls.__validators__["subclass_name"]

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
                if field.schema.extra.get("computed"):
                    cls._computed.add(field.name)

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
    async def get(cls, clause_or_row_id, parse=True):
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
    async def get_or_create(cls, clause_or_row_id, **defaults):
        obj = await cls.get(clause_or_row_id)
        if not obj:
            obj = cls(**defaults)
        return obj

    @classmethod
    async def read(
        cls, clause_or_select=None, order_by=None, start=None, stop=None, parse=True
    ):
        """
        Read rows from the database.
        Optionally give ordering, limits, and parsed into model instances.
        order_by an be a single column or array of columns such as:
        table.c.first_name, table.c.first_name.asc(), table.c.first_name.desc(),
        (table.c.first_name.asc(), table.c.last_name.asc())
        """
        if not isinstance(clause_or_select, Selectable):
            query = cls.table.select()
            if clause_or_select is not None:
                query = query.where(clause_or_select)
        else:
            query = clause_or_select
        if order_by is not None:
            if isinstance(order_by, (list, tuple)):
                query = query.order_by(*order_by)
            else:
                query = query.order_by(order_by)
        if start is not None:
            query = query.offset(start)
        if stop is not None:
            num = stop - (start or 0)
            query = query.limit(num)
        rows = await database.fetch_all(query)
        if parse:
            rows = cls.parse_rows(rows)
        return rows

    @classmethod
    async def expand(cls, type_, model_or_models):
        """
        Given a list of homogeneous models expand their embedded fields.
        TODO: make recursive where response_models also get expanded
        TODO: support a reverse relationship key other than model_snake_case_id
        """
        expanded = []
        single = not isinstance(model_or_models, (list, tuple))
        if single:
            model_or_models = [model_or_models]
        ids = (m.id for m in model_or_models)
        for model in model_or_models:
            expanded.append(model.dict())
        for embedded in type_._embedded:
            embedded_id = f"{embedded}_id"
            related_type = type_.__fields__[embedded].type_
            related = related_type.get(type_.c.id.in_(ids))
            related = {r.id: r for r in related}
            for data in expanded:
                data[embedded] = await related.get(data[embedded_id])
        for embedded in type_._embedded_list:
            reverse_id = f"{camel_to_snake_case(cls.__name__)}_id"
            related_type = type_.__fields__[embedded].type_
            for data in expanded:
                data[embedded] = await related_type.read(
                    getattr(related_type.c, reverse_id) == data["id"]
                )
        expanded = [type_(**data) for data in expanded]
        if single:
            return expanded[0]
        return expanded

    async def save(self, update_values=None, read_only=False, force_insert=False):
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
            exclude = {"id", *cls._read_only, *cls._computed}
        else:
            exclude = {"id", *cls._computed}
        if update_values:
            if isinstance(update_values, BaseModel):
                update_values = update_values.dict()
            if not read_only:
                self.assign(
                    **{k: v for k, v in update_values.items() if k not in exclude}
                )
            else:
                self.assign(**update_values)
        values = self.dict(exclude=exclude)
        if self.is_new or force_insert:
            if not read_only:
                values.update(cls._read_only_defaults)
                self.assign(**cls._read_only_defaults)
            if force_insert:
                values["id"] = self.id
            query = table.insert().values(values).return_defaults()
            result = await database.fetch_one(query)
            if not force_insert:
                self.id = result["id"]
            for name in cls._auto_now_add:
                if name in result:
                    setattr(self, name, result[name])
        else:
            # Implement the auto_now functionality
            for name in cls._auto_now:
                if not read_only or not update_values or name not in update_values:
                    values[name] = text("NOW()")
            query = (
                table.update()
                .where(table.c.id == self.id)
                .values(values)
                .return_defaults()
            )
            result = await database.fetch_one(query)
            for name in cls._auto_now:
                if (
                    not read_only or not update_values or name not in update_values
                ) and name in result:
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
        self.id = None
        return self

    @classmethod
    async def count(cls, clause=None):
        query = select([func.count()]).select_from(cls.table)
        if isinstance(clause, ClauseElement):
            query = query.where(clause)
        return await database.fetch_val(query)

    @classmethod
    def response_model(
        cls, name=None, remove: Set[str] = None, embed: Dict[str, BaseModel] = None
    ):
        # Return the same model if there is no field changes
        if not remove and not embed and not cls._write_only:
            return cls
        # Return the basic cached version if only _write_only changes are needed
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
            key: get_type_hints(cls)[key]
            for key in cls.__fields__
            if key not in exclude
        }
        namespace["_embedded"] = set()
        namespace["_embedded_list"] = set()
        for key, model in embed.items():
            # All embedded models should also be response_models to remove write_only fields
            # TODO: expand will also need to support this
            # if issubclass(model, DbBaseModel):
            #     model = model.response_model()
            key_id = f"{key}_id"
            # If embedding a ForeignKey assume that it is a single model, otherwise a list
            if key_id in cls.__fields__:
                field = cls.__fields__[key_id]
                namespace[key] = (
                    None if field.default is None and not field.required else ...
                )
                namespace["__annotations__"][key] = model
                namespace["_embedded"].add(key)
            else:
                namespace[key] = []
                namespace["__annotations__"][key] = List[model]
                namespace["_embedded_list"].add(key)
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

        # Revert config from a AbstractDbBaseModel base class
        allow_population_by_alias = False


class AbstractDbBaseModel(BaseModel):
    """
    Abstract base model for utilizing a common set of fields for different models and
    easily selecting them all together with a union operation.
    """

    # Fields when using this model to return parsed results from union()
    id: PrimaryKey = Schema(None, read_only=True)
    subclass_name: str = Schema("", alias="_type", computed=True)

    @validator("subclass_name", pre=True, always=True)
    def set_type_from_name(cls, value):
        return value or cls.__name__

    class Config:
        # pylint: disable=too-few-public-methods

        # The _type literal column doesn't work without this
        # and referencing subclass_name from the query won't work
        allow_population_by_alias = True

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
    async def union(
        cls, subclasses, clauses=None, order_by=None, start=None, stop=None, parse=True
    ):
        """
        Perform a union across multiple subclasses (tables) and combining into a single abstract base class model.
        """
        queries = []
        common = {f.name for f in cls.__fields__.values()}
        for i, subcls in enumerate(subclasses):
            columns = [c for c in subcls.columns if c.name in common]
            columns.append(
                literal_column(f"'{subcls.__name__}'", String).label("_type")
            )
            query = select(columns)
            if clauses is not None:
                if isinstance(clauses, (list, tuple)):
                    query = query.where(clauses[i])
                else:
                    query = query.where(clauses)
            if order_by:
                if isinstance(order_by, (list, tuple)):
                    query = query.order_by(order_by[i])
                else:
                    query = query.order_by(order_by)
            queries.append(query)
        query = union_all(*queries)
        if start is not None:
            query = query.offset(start)
        if stop is not None:
            num = stop - (start or 0)
            query = query.limit(num)
        rows = await database.fetch_all(query)
        if parse:
            rows = cls.parse_rows(rows)
        return rows


class RequestData(BaseModel):
    class Config:
        extra = Extra.allow

