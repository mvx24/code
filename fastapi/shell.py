#!./venv/bin/python -i
from databases import Database

from database import engine, DbBaseModel
from utils.sync import make_sync
from utils.sync import run_sync as sync  # pylint: disable=unused-import


DbBaseModel.select = make_sync(DbBaseModel.select)
DbBaseModel.read = make_sync(DbBaseModel.read)
DbBaseModel.save = make_sync(DbBaseModel.save)
DbBaseModel.delete = make_sync(DbBaseModel.delete)

make_sync(Database.connect, engine)
make_sync(Database.disconnect, engine)
make_sync(Database.fetch_all, engine)
make_sync(Database.fetch_one, engine)
make_sync(Database.fetch_val, engine)
make_sync(Database.execute, engine)
make_sync(Database.execute_many, engine)
make_sync(Database.iterate, engine)
