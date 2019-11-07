# Startup and shutdown:

Start postgres:

`docker run --name pg --rm -e POSTGRES_PASSWORD=mysecretpassword -d -p 5432:5432 postgres`

Stop postgres

`docker kill pg`

For psql prompt:

`docker exec -it pg psql -h localhost -U postgres`

## Alembic Migrations

To autogenerate a migration use the following:

`alembic revision --autogenerate -m "Some message"`

TO migrate a database to the most recent revision:

`alembic upgrade head`
