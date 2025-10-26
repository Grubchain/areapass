#!/bin/bash

APP=areapass-api
PROC=release

docker build \
  --platform linux/amd64 \
  --provenance=false \
  --sbom=false \
  -t registry.heroku.com/$APP/$PROC \
  -f Dockerfile.release \
  --push .
