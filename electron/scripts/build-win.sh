#!/usr/bin/env sh
mkdir -p ./build/scripts
cp ./scripts/notarize.js ./build/scripts
docker run --rm -ti \
  --env ELECTRON_CACHE="/root/.cache/electron" \
  --env ELECTRON_BUILDER_CACHE="/root/.cache/electron-builder" \
  -v ${PWD}/build:/project \
  -v ${PWD}/dist:/dist \
  -v electron-builder-win-node-modules:/project/node_modules \
  -v ~/.cache/electron:/root/.cache/electron \
  -v ~/.cache/electron-builder:/root/.cache/electron-builder \
  electronuserland/builder:wine \
  /bin/bash -c "yarn install && cp ./node_modules/electron/path.txt . && ./node_modules/.bin/electron-builder --win"
