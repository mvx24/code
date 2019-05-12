#!/usr/bin/env sh
./node_modules/.bin/jsdoc \
  --readme README.md \
  --destination ./docs \
  --recurse ./src
