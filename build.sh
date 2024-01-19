#!/usr/bin/env bash

docker build -f ./frontend/Dockerfile -t spex.frontend:latest .
docker tag spex.frontend:latest ghcr.io/genentech/spex.frontend:latest
docker push ghcr.io/genentech/spex.frontend:latest