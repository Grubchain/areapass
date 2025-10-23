#!/bin/bash

APP=areapass-api
PROC=web

docker build \
  --platform linux/amd64 \
  --provenance=false \
  --sbom=false \
  -t registry.heroku.com/$APP/$PROC \
  --push .
