#!/usr/bin/env bash
DATA_URL="http://localhost:8080/api/readings"
SENSOR_NAME="\"outsidepi\""

JSON="'{\"sensorName\": $SENSOR_NAME, \"temperature\": 63.33 }'"

echo "$JSON"

curl -X PUT 'http://localhost:4000/api/readings' -H 'Content-Type: application/json' -d "{\"temperature\": 72.39, \"sensorName\": \"office\"}"
