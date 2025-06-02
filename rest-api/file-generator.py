import requests
import random
import time
from faker import Faker
from datetime import datetime, timedelta, timezone
import json

# Initialize Faker instance
fake = Faker()

# API endpoint configuration
API_BASE_URL = 'http://localhost:8080/fileDataReportingMnS/v1'
FILES_ENDPOINT = 'http://localhost:8080/fileDataReportingMnS/v1/files'

# Anomaly cases with file type mappings
ANOMALY_FILE_TYPE_MAPPING = {
    'Unexpected_UE_Location': 'Trace',
    'Unexpected_Long_Live_Flows': 'Analytics',
    'Suspicion_of_DDoS_Attack': 'Proprietary',
    'Too_Frequent_Service_Access': 'Performance',
    'Unexpected_Radio_Link_Failures': 'Trace',
    'Unexpected_Low_Rate_Flows': 'Performance',
    'Unexpected_Large_Rate_Flow': 'Analytics'
}

# Compression and format options
FILE_COMPRESSIONS = ['zip']
FILE_FORMATS = ['JSON']

common_supis = [f"imsi-{fake.random_number(digits=15, fix_len=True)}" for _ in range(5)]
base_time = datetime.now(timezone.utc)

BERLIN_COORDS = {
    "lat_min": 52.3,  # Lower bound for latitude
    "lat_max": 52.7,  # Upper bound for latitude
    "lon_min": 13.0,  # Lower bound for longitude
    "lon_max": 13.7   # Upper bound for longitude
}
def generate_berlin_coordinates():
    return {
        "longitude": round(random.uniform(BERLIN_COORDS["lon_min"], BERLIN_COORDS["lon_max"]), 6),
        "latitude": round(random.uniform(BERLIN_COORDS["lat_min"], BERLIN_COORDS["lat_max"]), 6),
        "tac": fake.random_number(digits=5, fix_len=True)
    }
def create_anomaly_file():
    """
        Generates and sends a simulated anomaly file to the API endpoint. The file's content
        is based on random attributes and pre-defined anomaly types.

        The function:
        1. Selects a random anomaly type.
        2. Creates the corresponding event notification structure.
        3. Populates additional information based on the anomaly type.
        4. Sends the generated file as a POST request to the API.

        Returns:
            None
    """
    anomaly_type = random.choices(
        list(ANOMALY_FILE_TYPE_MAPPING.keys()),
        weights=[1, 1, 0.5, 1, 1, 0.5, 0.5]
    )[0]

    file_data_type = ANOMALY_FILE_TYPE_MAPPING[anomaly_type]
    file_ready_time = (base_time + timedelta(seconds=random.randint(0, 180))).isoformat(timespec='seconds')
    expiration_time = (base_time + timedelta(days=random.randint(1, 30))).isoformat(timespec='seconds')
    subscription_id = fake.uuid4()

    supi = random.choice([random.choice(common_supis), f"imsi-{fake.random_number(digits=15, fix_len=True)}"])

    # Base notification structure
    event_notification = {
        "subscriptionId": subscription_id,
        "eventNotifications": [
            {
                "event": "ABNORMAL_BEHAVIOUR",
                "expiry": expiration_time,
                "timeStampGen": file_ready_time,
                "abnorBehavrs": [
                    {
                        "supis": [supi],
                        "excep": {
                            "excepId": anomaly_type.upper().replace(" ", "_"),
                            "excepLevel": random.randint(1, 5),
                            "excepTrend": random.choice(["UP", "STABLE", "DOWN"])
                        },
                        "dnn": "internet",
                        "snssai": {
                            "sst": random.randint(1, 3),
                            "sd": "".join([str(random.randint(0, 9)) for _ in range(6)])
                        },
                        "ratio": random.uniform(0, 1),
                        "confidence": random.randint(70, 100)
                    }
                ]
            }
        ]
    }

    # Additional details based on anomaly type
    if anomaly_type == 'Unexpected_UE_Location':
        event_notification["eventNotifications"][0]["abnorBehavrs"][0]["addtMeasInfo"] = {
            "circums": [
                {
                    "freq": random.uniform(0, 1),
                    "tm": fake.iso8601(),
                    "locArea": generate_berlin_coordinates(),
                    "vol": random.randint(100, 1000)
                }
            ]
        }

    elif anomaly_type == 'Unexpected_Long_Live_Flows':
        event_notification["eventNotifications"][0]["abnorBehavrs"][0]["addtMeasInfo"] = {
            "svcExps": [
                {
                    "svcExprc": {
                        "serviceQuality": random.uniform(0.1, 1.0),
                        "expectedPerformance": "Extended Duration"
                    },
                    "svcExprcVariance": random.uniform(0, 0.3),
                    "supis": [f"imsi-{fake.random_number(digits=15, fix_len=True)}"],
                    "snssai": {
                        "sst": random.randint(1, 3),
                        "sd": "".join([str(random.randint(0, 9)) for _ in range(6)])
                    },
                    "appId": fake.uuid4(),
                    "srvExpcType": "LONG_SESSION",
                    "ueLocs": [generate_berlin_coordinates()],
                    "upfInfo": {
                        "upfName": "ExtendedSessionUPF",
                        "upfIpAddress": fake.ipv4()
                    },
                    "dnai": "dna1-network",
                    "appServerInst": fake.domain_name(),
                    "confidence": random.randint(70, 100),
                    "dnn": "internet",
                    "networkArea": {
                        "areaCode": random.randint(1000, 9999),
                        "locationId": fake.uuid4()
                    },
                    "nsiId": fake.uuid4(),
                    "ratio": random.uniform(0.1, 1.0),
                    "ratFreq": {
                        "frequencyBand": random.choice(["700MHz", "2.6GHz"]),
                        "ratType": "LTE"
                    },
                    "pduSesInfo": {
                        "sessionId": fake.uuid4(),
                        "status": "ACTIVE"
                    }
                }
            ]
        }

    elif anomaly_type == 'Suspicion_of_DDoS_Attack':
        event_notification["eventNotifications"][0]["abnorBehavrs"][0]["addtMeasInfo"] = {
            "ddosAttack": {
                "ipv4Addrs": [fake.ipv4()],
                "ipv6Addrs": [fake.ipv6()]
            },
            "circums": [
                {
                    "freq": random.uniform(0, 1),
                    "tm": fake.iso8601(),
                    "locArea": generate_berlin_coordinates(),
                    "vol": random.randint(100, 1000)
                }
            ]
        }

    elif anomaly_type == 'Too_Frequent_Service_Access':
        event_notification["eventNotifications"][0]["abnorBehavrs"][0]["addtMeasInfo"] = {
            "svcExps": [
                {
                    "svcExprc": {
                        "serviceQuality": random.uniform(0.1, 1.0),
                        "expectedPerformance": "Normal"
                    },
                    "svcExprcVariance": random.uniform(0, 0.3),
                    "supis": [f"imsi-{fake.random_number(digits=15, fix_len=True)}"],
                    "snssai": {
                        "sst": random.randint(1, 3),
                        "sd": "".join([str(random.randint(0, 9)) for _ in range(6)])
                    },
                    "appId": fake.uuid4(),
                    "srvExpcType": "NORMAL_BANDWIDTH",
                    "ueLocs": [generate_berlin_coordinates()],
                    "upfInfo": {
                        "upfName": "ExampleUPF",
                        "upfIpAddress": fake.ipv4()
                    },
                    "dnai": "dna1-network",
                    "appServerInst": fake.domain_name(),
                    "confidence": random.randint(70, 100),
                    "dnn": "internet",
                    "networkArea": {
                        "areaCode": random.randint(1000, 9999),
                        "locationId": fake.uuid4()
                    },
                    "nsiId": fake.uuid4(),
                    "ratio": random.uniform(0.1, 1.0),
                    "ratFreq": {
                        "frequencyBand": random.choice(["700MHz", "2.6GHz"]),
                        "ratType": "LTE"
                    },
                    "pduSesInfo": {
                        "sessionId": fake.uuid4(),
                        "status": "ACTIVE"
                    }
                }
            ]
        }

    elif anomaly_type == 'Unexpected_Radio_Link_Failures':
        event_notification["eventNotifications"][0]["abnorBehavrs"][0]["addtMeasInfo"] = {
            "nwPerfs": [
                {
                    "cellId": fake.uuid4(),
                    "failureCount": random.randint(1, 10),
                    "failureType": random.choice(['Signal loss', 'Failed handover']),
                    "signalQuality": {
                        "RSRP": f"{random.uniform(-120, -80):.2f} dBm",
                        "SINR": f"{random.uniform(-10, 20):.2f} dB"
                    },
                    "neighboringCells": [fake.uuid4() for _ in range(3)],
                    "networkSlice": random.choice(['SliceA', 'SliceB', 'SliceC']),
                    "details": "Unexpected radio link failures detected"
                }
            ]
        }

    elif anomaly_type == 'Unexpected_Low_Rate_Flow' or anomaly_type == 'Unexpected_Large_Rate_Flow':
        event_notification["eventNotifications"][0]["abnorBehavrs"][0]["addtMeasInfo"] = {
            "svcExps": [
                {
                    "svcExprc": {
                        "serviceQuality": random.uniform(0.1, 1.0),
                        "expectedPerformance": "Moderate"
                    },
                    "svcExprcVariance": random.uniform(0, 0.3),
                    "supis": [f"imsi-{fake.random_number(digits=15, fix_len=True)}"],
                    "snssai": {
                        "sst": random.randint(1, 3),
                        "sd": "".join([str(random.randint(0, 9)) for _ in range(6)])
                    },
                    "appId": fake.uuid4(),
                    "srvExpcType": "HIGH_BANDWIDTH",
                    "ueLocs": [generate_berlin_coordinates()],
                    "upfInfo": {
                        "upfName": "ExampleUPF",
                        "upfIpAddress": fake.ipv4()
                    },
                    "dnai": "dna1-network",
                    "appServerInst": fake.domain_name(),
                    "confidence": random.randint(70, 100),
                    "dnn": "internet",
                    "networkArea": {
                        "areaCode": random.randint(1000, 9999),
                        "locationId": fake.uuid4()
                    },
                    "nsiId": fake.uuid4(),
                    "ratio": random.uniform(0.1, 1.0),
                    "ratFreq": {
                        "frequencyBand": random.choice(["700MHz", "2.6GHz"]),
                        "ratType": "5G"
                    },
                    "pduSesInfo": {
                        "sessionId": fake.uuid4(),
                        "status": "ACTIVE"
                    }
                }
            ]
        }

    # Validate that 'timeStampGen' is present and in the correct format
    for notification in event_notification["eventNotifications"]:
        if "timeStampGen" not in notification or not isinstance(notification["timeStampGen"], str):
            print(f"ERROR: Missing or invalid 'timeStampGen' for subscription ID: {subscription_id}")
        else:
            print(f"'timeStampGen' is valid: {notification['timeStampGen']} for subscription ID: {subscription_id}")
    # Construct the payload with the event notification
    payload = {
        'fileDataType': file_data_type,
        'fileContent': event_notification,
        'fileReadyTime': file_ready_time,
        'fileSize': random.randint(1024, 104857600),
        'fileExpirationTime': expiration_time,
        'fileCompression': random.choice(FILE_COMPRESSIONS),
        'fileFormat': random.choice(FILE_FORMATS)
    }

    print(json.dumps(payload, indent=2))
    try:
        response = requests.post(FILES_ENDPOINT, headers={'Content-Type': 'application/json'}, data=json.dumps(payload))
        if response.status_code == 201:
            file_id = response.json().get('fileId')
            print(f"Successfully created file for {anomaly_type} with ID: {file_id} at {datetime.now(timezone.utc)}")
        else:
            print(f"Failed to create file for {anomaly_type}. Status Code: {response.status_code}")
            print(f"Response: {response.text}")
    except Exception as e:
        print(f"An error occurred: {e}")


def main():
    """
        Main function to generate and send anomaly files at regular intervals.

        The function:
        1. Sets the number of files to generate.
        2. Calls the file generation function at specified intervals.

        Returns:
            None
    """
    num_files = 10  # Adjust as needed
    time_interval = 15  # Adjust as needed

    for _ in range(num_files):
        create_anomaly_file()
        time.sleep(time_interval)


if __name__ == "__main__":
    main()
