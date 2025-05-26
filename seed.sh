#!/bin/bash
set -e

if [ "$MOCK_INTEGRATIONS" != "true" ]; then
  echo "MOCK_INTEGRATIONS is not true. Skipping mock data import."
  exit 0
fi

DATA_DIR="/docker-entrypoint-initdb.d/mock-data"

if [ ! -d "$DATA_DIR" ]; then
  echo "Mock data directory $DATA_DIR not found."
  exit 0
fi

for file in "$DATA_DIR"/*.json; do
  [ -e "$file" ] || continue
  collection="$(basename "$file" .json)"
  echo "Importing $collection from $file"
  mongoimport --db "$MONGO_INITDB_DATABASE" --collection "$collection" --file "$file" --jsonArray --drop
done

