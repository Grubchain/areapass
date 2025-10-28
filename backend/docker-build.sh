#!/bin/bash

APP=areapass-api
PROC=web

docker build \
  --platform linux/amd64 \
  --provenance=false \
  --sbom=false \
  --file=Dockerfile.web \
  -t registry.heroku.com/$APP/$PROC \
  --push .
