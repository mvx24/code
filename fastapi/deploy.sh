#!/usr/bin/env sh
DOCKER_HOST=tcp://0.0.0.0:2376 COMPOSE_FILE=docker-compose.yml:docker-compose.production.yml docker-compose up -d
