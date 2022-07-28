#!/bin/sh
node /app/src/ingest --data=daily
node /app/src/ingest --data=monthly
node /app/src/ingest --data=yearly
