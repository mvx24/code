#!/usr/bin/env sh
cp ./build/node_modules/electron/path.txt ./build
electron-builder --mac --project=./build
