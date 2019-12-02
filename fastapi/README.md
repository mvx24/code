# Startup and shutdown:

Start postgres:

`docker run -v pgbackups:/var/pgbackups --name pg --rm -e POSTGRES_PASSWORD=mysecretpassword -d -p 5432:5432 postgres`

Stop postgres

`docker kill pg`

For psql prompt:

`docker exec -it pg psql -h localhost -U postgres`

## Alembic Migrations

To autogenerate a migration use the following:

`alembic revision --autogenerate -m "Some message"`

TO migrate a database to the most recent revision:

`alembic upgrade head`

## Backup

`docker exec -it pg pg_dump -d postgres -h localhost -U postgres -F c -f /var/pgbackups/backup.dat`

## Restore

`docker exec -it pg pg_restore -c -d postgres -h localhost -U postgres /var/pgbackups/backup.dat`

_NOTE_: Be sure to run `alembic upgrade head` first before restore:

## Copy Backup

`docker cp pg:/var/pgbackups/backup.dat ./backup.dat`
