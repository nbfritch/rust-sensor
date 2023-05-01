#!/usr/bin/env bash
DATA_URL="http://localhost:3000/api/readings"
SENSOR_NAME="\"outsidepi\""
TEMPF=$(echo "$READING" | jq .temp_f)
RTIME=$(echo "$READING" | jq .time)

JSON="'{\"sensorName\": $SENSOR_NAME, \"temperature\": 63.33 }'"

echo "$JSON"
sh -c "curl -X PUT $DATA_URL -H 'Content-Type: application/json' -d $JSON"
