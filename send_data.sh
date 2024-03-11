#!/usr/bin/env bash
DATA_URL="http://localhost:8080/api/readings"
SENSOR_NAME="\"outsidepi\""

JSON="'{\"sensorName\": $SENSOR_NAME, \"reading_value\": 63.33, \"reading_type\": 1 }'"

echo "$JSON"

curl -X PUT 'http://localhost:4000/api/readings' -H 'Content-Type: application/json' -d "{\"reading_value\": 72.39, \"sensorName\": \"office\", \"reading_type\": 1 }"
