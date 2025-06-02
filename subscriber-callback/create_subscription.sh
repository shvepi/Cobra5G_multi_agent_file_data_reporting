curl --location 'localhost:8080/fileDataReportingMnS/v1/subscriptions/' \
--header 'Content-Type: application/json' \
--data '{
    "consumerReference": "http://127.0.0.16:7777/callback",
    "filter": {
        "fileDataType": "Analytics"
    }
}'