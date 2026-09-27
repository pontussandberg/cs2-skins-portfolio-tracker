#!/usr/bin/env bash
# Build a self-contained bundle in ./dist that runs with plain `node server.js`.
# The bundle is pure JavaScript, so you can build it on your PC and copy it to the Pi:
#   bash deploy/package.sh
#   rsync -av --delete --exclude data --exclude .env.local dist/ pi@raspberrypi.local:/opt/csfloat-watcher/
set -euo pipefail
cd "$(dirname "$0")/.."

pnpm build
rm -rf dist
mkdir -p dist/.next
cp -r .next/standalone/. dist/
cp -r .next/static dist/.next/static
[ -d public ] && cp -r public dist/public
cp schema.graphql dist/schema.graphql
cp deploy/csfloat-watcher.service dist/
echo "Bundle ready in ./dist"
