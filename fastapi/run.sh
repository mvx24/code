#!/usr/bin/env sh
COMPOSE_FILE=docker-compose.yml:docker-compose.development.yml docker-compose up --build
