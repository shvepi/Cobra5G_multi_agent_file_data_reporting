import asyncio
import logging
import requests
from fastapi import FastAPI, Request
from pymongo import MongoClient
import uvicorn
from datetime import datetime, timedelta, timezone
from geopy.distance import geodesic

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

FILE_DATA_REPORTING_URL = "http://localhost:8080/fileDataReportingMnS/v1/files"


class HermesAgent:
    """
        The HermesAgent class processes anomaly data, identifies correlations based on predefined rules,
        and stores the enriched data in MongoDB.
    """

    def __init__(self, host="127.0.0.1", port=8081, mongo_uri="mongodb://localhost:27017", db_name="anomaly_data"):
        """
                Initializes the HermesAgent instance, FastAPI app, MongoDB client, and correlation rules.

                Args:
                    host (str): The host address for the FastAPI application.
                    port (int): The port number for the FastAPI application.
                    mongo_uri (str): The MongoDB connection URI.
                    db_name (str): The MongoDB database name.
        """
        self.host = host
        self.port = port
        self.app = FastAPI()
        self.client = MongoClient(mongo_uri)
        self.db = self.client[db_name]
        self.collection = self.db["anomalies"]
        self.app.post("/receive_shared_data")(self.receive_shared_data)

        # Define correlation rules
        self.correlation_rules = [
            {
                "name": "Radio Link Failures might be leading to frequent service access attempts",
                "anomalies": ["UNEXPECTED_RADIO_LINK_FAILURES", "TOO_FREQUENT_SERVICE_ACCESS"],
                "conditions": [
                    {"type": "ue_ids", "match": "intersection"},
                    {"type": "time", "match": "overlap", "threshold_minutes": 60}
                ]
            },
            {
                "name": "Unexpected UE Location could relate to Radio Link Failures",
                "anomalies": ["UNEXPECTED_UE_LOCATION", "UNEXPECTED_RADIO_LINK_FAILURES"],
                "conditions": [
                    {"type": "ue_ids", "match": "intersection"},
                    {"type": "location", "match": "proximity", "threshold_km": 5},
                    {"type": "time", "match": "overlap", "threshold_minutes": 30}
                ]
            },
            {
                "name": "A DDoS attack might be overloading network resources, leading to Radio Link Failures",
                "anomalies": ["UNEXPECTED_RADIO_LINK_FAILURES", "SUSPICION_OF_DDOS_ATTACK"],
                "conditions": [
                    {"type": "ue_ids", "match": "intersection"},
                    {"type": "time", "match": "overlap", "threshold_minutes": 30}
                ]
            },
            {
                "name": "Unexpected Large Rate Flows could be straining network resources and contribute to Radio Link Failures",
                "anomalies": ["UNEXPECTED_RADIO_LINK_FAILURES", "UNEXPECTED_LARGE_RATE_FLOWS"],
                "conditions": [
                    {"type": "ue_ids", "match": "intersection"},
                    {"type": "time", "match": "overlap", "threshold_minutes": 30}
                ]
            },
            {
                "name": "Long-lived flows might be consuming network resources leading to Radio Link Failures",
                "anomalies": ["UNEXPECTED_RADIO_LINK_FAILURES", "UNEXPECTED_LONG_LIVE_FLOWS"],
                "conditions": [
                    {"type": "ue_ids", "match": "intersection"},
                    {"type": "time", "match": "overlap", "threshold_minutes": 30}
                ]
            },
            {
                "name": "A DDoS attack might be overloading network resources, leading to Radio Link Failures",
                "anomalies": ["SUSPICION_OF_DDOS_ATTACK", "UNEXPECTED_RADIO_LINK_FAILURES"],
                "conditions": [
                    {"type": "ue_ids", "match": "intersection"},
                    {"type": "time", "match": "overlap", "threshold_minutes": 60}
                ]
            },
            {
                "name": "A DDoS attack might be causing Frequent Service Access Attempts",
                "anomalies": ["SUSPICION_OF_DDOS_ATTACK", "TOO_FREQUENT_SERVICE_ACCESS"],
                "conditions": [
                    {"type": "ue_ids", "match": "intersection"},
                    {"type": "time_interval", "match": "contains"}
                ]
            },
            {
                "name": "Frequent Service Access attempts might be causing Unexpected Large Rate Flows",
                "anomalies": ["UNEXPECTED_LARGE_RATE_FLOWS", "TOO_FREQUENT_SERVICE_ACCESS"],
                "conditions": [
                    {"type": "ue_ids", "match": "intersection"},
                    {"type": "time_interval", "match": "overlap"}
                ]
            },
            {
                "name": "Frequent service access might be causing Long-Lived Flows",
                "anomalies": ["UNEXPECTED_LONG_LIVE_FLOWS", "TOO_FREQUENT_SERVICE_ACCESS"],
                "conditions": [
                    {"type": "ue_ids", "match": "intersection"},
                    {"type": "time_interval", "match": "overlap"}
                ]
            },
            {
                "name": "Too Frequent Service Access might be due to Radio Link Failure",
                "anomalies": ["TOO_FREQUENT_SERVICE_ACCESS", "UNEXPECTED_RADIO_LINK_FAILURES"],
                "conditions": [
                    {"type": "ue_ids", "match": "intersection"},
                    {"type": "time", "match": "overlap", "threshold_minutes": 60}
                ]
            },
            {
                "name": "Too Frequent Service Access might be causing Unexpected Large Rate Flows",
                "anomalies": ["TOO_FREQUENT_SERVICE_ACCESS", "UNEXPECTED_LARGE_RATE_FLOWS"],
                "conditions": [
                    {"type": "ue_ids", "match": "intersection"},
                    {"type": "time", "match": "overlap", "threshold_minutes": 30}
                ]
            },
            {
                "name": "Too Frequent Service Access might be resulting in Long-Live Flows",
                "anomalies": ["TOO_FREQUENT_SERVICE_ACCESS", "UNEXPECTED_LONG_LIVE_FLOWS"],
                "conditions": [
                    {"type": "ue_ids", "match": "intersection"},
                    {"type": "time", "match": "overlap", "threshold_minutes": 30}
                ]
            },
            {
                "name": "Radio Link Failures might be leading to Unexpectedly Low Rate Flows",
                "anomalies": ["UNEXPECTED_LOW_RATE_FLOWS", "UNEXPECTED_RADIO_LINK_FAILURES"],
                "conditions": [
                    {"type": "ue_ids", "match": "intersection"},
                    {"type": "time", "match": "overlap", "threshold_minutes": 60}
                ]
            },
            {
                "name": "A DDoS attack might be leading to Low Rate Flows",
                "anomalies": ["UNEXPECTED_LOW_RATE_FLOWS", "SUSPICION_OF_DDOS_ATTACK"],
                "conditions": [
                    {"type": "ue_ids", "match": "intersection"},
                    {"type": "time", "match": "overlap", "threshold_minutes": 30}
                ]
            },
            {
                "name": "Large rate flows could temporarily be disrupting normal traffic, leading to unexpectedly Low Rate Flows",
                "anomalies": ["UNEXPECTED_LOW_RATE_FLOWS", "UNEXPECTED_LARGE_RATE_FLOWS"],
                "conditions": [
                    {"type": "ue_ids", "match": "intersection"},
                    {"type": "time", "match": "overlap", "threshold_minutes": 30}
                ]
            }
        ]

    def calculate_correlation_score(self, ue_ids_match, time_difference, time_threshold, rule_conditions, event,
                                    recent_event):
        """
        Calculates a correlation score based on the matching UE IDs, time difference,
        and rule-specific conditions.

        Args:
            ue_ids_match (bool): Whether UE IDs intersect.
            time_difference (timedelta): The difference between event and recent event timestamps.
            time_threshold (timedelta): The maximum allowable time difference for correlation.
            rule_conditions (list): The conditions defined in the correlation rule.
            event (dict): The current event being checked for correlation.
            recent_event (dict): The recent event being compared.

        Returns:
            float: The calculated correlation score.
        """
        # Initialize score components
        score = 0.0

        # Weight assignments
        weight_ue_ids = 0.3
        weight_time_proximity = 0.4
        weight_location_proximity = 0.3
        weight_additional_conditions = 0.1

        # print("\n--- Calculating Correlation Score ---")

        # 🛠 UE ID match contribution
        if ue_ids_match:
            score += weight_ue_ids
            # print(f"✔ UE ID Match: +{weight_ue_ids}")

        # 🛠 Time proximity contribution
        if time_difference <= time_threshold:
            time_proximity_score = 1 - (time_difference.total_seconds() / time_threshold.total_seconds())
            time_score = weight_time_proximity * time_proximity_score
            score += time_score
            # print(f"✔ Time Proximity: {time_proximity_score:.2f} * {weight_time_proximity} = +{time_score:.2f}")

        # 🛠 Rule-specific conditions
        for condition in rule_conditions:
            if condition["type"] == "location" and condition["match"] == "proximity":
                event_location = \
                event["eventNotifications"][0]["abnorBehavrs"][0].get("addtMeasInfo", {}).get("circums", [{}])[0].get(
                    "locArea", {})
                recent_location = \
                recent_event["eventNotifications"][0]["abnorBehavrs"][0].get("addtMeasInfo", {}).get("circums", [{}])[
                    0].get("locArea", {})

                if event_location and recent_location:
                    proximity_score = HermesAgent.calculate_proximity_score(event_location, recent_location,
                                                                            condition["threshold_km"])
                    loc_score = weight_location_proximity * proximity_score
                    score += loc_score
                    # print(
                    #     f"✔ Location Proximity: {proximity_score:.2f} * {weight_location_proximity} = +{loc_score:.2f}")

            if condition["type"] == "additional_metric":
                additional_metric_score = HermesAgent.calculate_additional_metric(event, recent_event, condition)
                add_score = weight_additional_conditions * additional_metric_score
                score += add_score
                # print(
                #     f"✔ Additional Metric: {additional_metric_score:.2f} * {weight_additional_conditions} = +{add_score:.2f}")

        # Ensure the score is within bounds (0 to 1)
        final_score = min(score, 1.0)
        # print(f"✅ Final Score: {final_score:.2f}")
        return final_score

    @staticmethod
    def calculate_proximity_score(location1, location2, threshold_km):
        """
        Calculate proximity score based on geographical locations.

        Args:
            location1 (dict): The first location with latitude and longitude.
            location2 (dict): The second location with latitude and longitude.
            threshold_km (float): Maximum distance in kilometers for full proximity score.

        Returns:
            float: A proximity score between 0 and 1.
        """
        coords1 = (location1.get("latitude"), location1.get("longitude"))
        coords2 = (location2.get("latitude"), location2.get("longitude"))

        distance_km = geodesic(coords1, coords2).kilometers
        return max(0.0, 1 - (distance_km / threshold_km))

    @staticmethod
    def calculate_additional_metric(event, recent_event, condition):
        """
        Calculates an additional metric score based on specific conditions such as signal quality,
        confidence, exception level, or ratio.

        Args:
            event (dict): The current event being checked.
            recent_event (dict): The recent event being compared.
            condition (dict): Specific condition details.

        Returns:
            float: A score between 0 and 1.
        """
        score = 0.0

        try:
            if condition["type"] == "signal_quality":
                event_signal = event["eventNotifications"][0]["abnorBehavrs"][0].get(
                    "addtMeasInfo", {}).get("nwPerfs", [{}])[0]
                recent_signal = recent_event["eventNotifications"][0]["abnorBehavrs"][0].get(
                    "addtMeasInfo", {}).get("nwPerfs", [{}])[0]

                if event_signal and recent_signal:
                    event_rsrp = float(event_signal.get("signalQuality", {}).get("RSRP", "-120 dBm").split()[0])
                    recent_rsrp = float(recent_signal.get("signalQuality", {}).get("RSRP", "-120 dBm").split()[0])
                    event_sinr = float(event_signal.get("signalQuality", {}).get("SINR", "0 dB").split()[0])
                    recent_sinr = float(recent_signal.get("signalQuality", {}).get("SINR", "0 dB").split()[0])

                    rsrp_diff = abs(event_rsrp - recent_rsrp)
                    sinr_diff = abs(event_sinr - recent_sinr)

                    score += max(0.0, 1 - rsrp_diff / 20) * 0.5
                    score += max(0.0, 1 - sinr_diff / 20) * 0.5

            elif condition["type"] == "confidence":
                event_confidence = event["eventNotifications"][0]["abnorBehavrs"][0].get("confidence", 0)
                recent_confidence = recent_event["eventNotifications"][0]["abnorBehavrs"][0].get("confidence", 0)

                score += min(event_confidence, recent_confidence) / 100

            elif condition["type"] == "exception_level":
                event_level = event["eventNotifications"][0]["abnorBehavrs"][0]["excep"].get("excepLevel", 0)
                recent_level = recent_event["eventNotifications"][0]["abnorBehavrs"][0]["excep"].get("excepLevel", 0)

                level_diff = abs(event_level - recent_level)
                score += max(0, 1 - level_diff / 5)

            elif condition["type"] == "ratio":
                event_ratio = event["eventNotifications"][0]["abnorBehavrs"][0].get("ratio", 0)
                recent_ratio = recent_event["eventNotifications"][0]["abnorBehavrs"][0].get("ratio", 0)

                ratio_diff = abs(event_ratio - recent_ratio)
                score += max(0, 1 - ratio_diff)

        except Exception as e:
            print(f"Error calculating metric: {e}")

        return min(score, 1.0)

    def check_correlation_rules(self, event, recent_events):
        """
        Checks correlations between the current event and recent events based on predefined rules.

        Args:
            event (dict): The current event being evaluated.
            recent_events (list): A list of recent events.

        Returns:
            list: A list of correlations matching the predefined rules.
        """
        correlations = []

        # Assume 'timeStampGen' is valid and in the correct format
        event_time_str = str(event['eventNotifications'][0]['timeStampGen'])
        event_time = datetime.fromisoformat(event_time_str).astimezone(timezone.utc)

        event_type = event['eventNotifications'][0]['abnorBehavrs'][0]['excep']['excepId']
        event_ue_ids = set(event['eventNotifications'][0]['abnorBehavrs'][0].get('supis', []))

        for rule in self.correlation_rules:
            if event_type in rule['anomalies']:
                for recent_event in recent_events:
                    recent_event_time_str = str(recent_event['eventNotifications'][0]['timeStampGen'])
                    recent_event_time = datetime.fromisoformat(recent_event_time_str).replace(tzinfo=timezone.utc)
                    recent_event_type = recent_event['eventNotifications'][0]['abnorBehavrs'][0]['excep']['excepId']
                    recent_event_ue_ids = set(recent_event['eventNotifications'][0]['abnorBehavrs'][0].get('supis', []))

                    # Skip same-type correlations
                    if event_type == recent_event_type:
                        continue

                    # Calculate time difference
                    time_difference = abs(event_time - recent_event_time)

                    time_threshold = timedelta(minutes=float(
                        next((cond["threshold_minutes"] for cond in rule["conditions"] if cond["type"] == "time"), 60)
                        # Default to 60 minutes if missing
                    ))

                    # Check UE IDs and time conditions
                    ue_ids_match = event_ue_ids & recent_event_ue_ids

                    time_condition_met = any(
                        cond["type"] == "time" and cond["match"] == "overlap" and time_difference <= time_threshold
                        for cond in rule["conditions"]
                    )




                    # Calculate correlation score
                    correlation_score = self.calculate_correlation_score(
                        ue_ids_match=bool(ue_ids_match),
                        time_difference=time_difference,
                        time_threshold=timedelta(minutes=float(
                            next((cond["threshold_minutes"] for cond in rule["conditions"] if cond["type"] == "time"),
                                 60)  # Default to 60 minutes if missing
                        )),
                        rule_conditions=rule["conditions"],
                        event=event,
                        recent_event=recent_event
                    )

                    if recent_event_type in rule['anomalies'] and ue_ids_match and time_condition_met:
                        correlations.append({
                            "rule_name": rule["name"],
                            "correlated_event_id": recent_event["_id"],
                            "correlation_score": correlation_score
                        })
                    # else:
                    #     logger.info(f"No correlation: Rule '{rule['name']}', "
                    #                 f"Event Type: {event_type}, Recent Type: {recent_event_type}, "
                    #                 f"UE ID Match: {bool(ue_ids_match)}, Time Condition Met: {time_condition_met}")
        return correlations

    def generate_file_content(self, event, correlation_data):
        """
        Generates the appropriate file structure for AMF, SMF, or UDM based on the event type.
        """
        event_notifications = event['eventNotifications'][0]
        abnormal_behavior = event_notifications['abnorBehavrs'][0]
        event_type = abnormal_behavior['excep']['excepId'].upper()  # Convert to uppercase
        supi = abnormal_behavior.get('supis', ["unknown"])[0]
        event_time = event_notifications['timeStampGen'].isoformat()

        # Extract dynamically instead of hardcoding
        location_info = abnormal_behavior.get('addtMeasInfo', {}).get('circums', [{}])[0]
        nw_perf_info = abnormal_behavior.get('addtMeasInfo', {}).get('nwPerfs', [{}])[0]

        tac = str(location_info.get('locArea', {}).get('tac', "000000"))
        plmn_id = location_info.get('locArea', {}).get('plmnId', {"mcc": "000", "mnc": "00"})
        eutra_cell_id = nw_perf_info.get('cellId', "000000")

        # Define mappings for AMF, SMF, and UDM
        AMF_EVENTS = {"UNEXPECTED_UE_LOCATION", "UNEXPECTED_RADIO_LINK_FAILURES"}
        SMF_EVENTS = {"UNEXPECTED_LONG_LIVE_FLOWS", "UNEXPECTED_LOW_RATE_FLOWS", "UNEXPECTED_LARGE_RATE_FLOW",
                      "SUSPICION_OF_DDOS_ATTACK"}
        UDM_EVENTS = {"TOO_FREQUENT_SERVICE_ACCESS"}

        # Generate file content based on event category
        if event_type in AMF_EVENTS:
            file_category = "Trace"
            file_component = "AMF"
            file_content = {
                "fileDataType": file_category,
                "fileComponent": file_component,
                "fileContent": {
                    "eventId": "AMF_UE_MOBILITY",
                    "supi": supi,
                    "eventTime": event_time,
                    "location": {
                        "tai": {
                            "plmnId": {"mcc": plmn_id.get("mcc", "000"), "mnc": plmn_id.get("mnc", "00")},
                            "tac": tac
                        },
                        "ecgi": {
                            "plmnId": {"mcc": plmn_id.get("mcc", "000"), "mnc": plmn_id.get("mnc", "00")},
                            "eutraCellId": eutra_cell_id
                        }
                    },
                    "correlation_data": correlation_data
                }
            }

        elif event_type in SMF_EVENTS:
            file_category = "Analytics"
            file_component = "SMF"
            file_content = {
                "fileDataType": file_category,
                "fileComponent": file_component,
                "fileContent": {
                    "eventId": "SMF_SESSION_ANOMALY",
                    "supi": supi,
                    "pduSessionId": abnormal_behavior.get('pduSessionId', "10"),
                    "dnn": abnormal_behavior.get('dnn', "internet"),
                    "snssai": abnormal_behavior.get('snssai', {"sst": 1, "sd": "000000"}),
                    "sessionType": "IPV4",
                    "trafficAnomaly": {
                        "type": event_type,
                        "ratio": abnormal_behavior.get('ratio', 0),
                        "confidence": abnormal_behavior.get('confidence', 0)
                    },
                    "correlation_data": correlation_data
                }
            }

        elif event_type in UDM_EVENTS:
            file_category = "Proprietary"
            file_component = "UDM"
            file_content = {
                "fileDataType": file_category,
                "fileComponent": file_component,
                "fileContent": {
                    "eventId": "UDM_UE_REACHABILITY",
                    "supi": supi,
                    "reachabilityStatus": "UNREACHABLE",
                    "timestamp": event_time,
                    "correlation_data": correlation_data
                }
            }

        else:
            return None  # No match found

        # Add metadata
        file_content.update({
            "fileReadyTime": datetime.now(timezone.utc).isoformat(),
            "fileExpirationTime": (datetime.now(timezone.utc) + timedelta(days=30)).isoformat(),
            "fileCompression": "zip",
            "fileFormat": "JSON"
        })

        return file_content


    def upload_file_to_reporting_system(self, file_data):
        """Uploads the generated file to the File Data Reporting System."""
        headers = {"Content-Type": "application/json"}
        try:
            response = requests.post(FILE_DATA_REPORTING_URL, headers=headers, json=file_data)
            if response.status_code == 201:
                logger.info(f"Successfully uploaded file. File ID: {response.json().get('fileId')}")
            else:
                logger.error(f"Failed to upload file. Status Code: {response.status_code}, Response: {response.text}")
        except Exception as e:
            logger.error(f"Error uploading file: {e}")

    async def receive_shared_data(self, request: Request):
        """
                Handles incoming event notifications, computes correlations, and stores the data.

                Args:
                    request (Request): The incoming HTTP request containing event data.

                Returns:
                    dict: A response indicating the success of the operation.
        """

        # Processing Start Time
        processing_start_time = datetime.now(timezone.utc)
        logger.info(f"[PROCESSING START] Hermes Received data at: {processing_start_time}")

        shared_data = await request.json()

        # Convert timeStampGen to timezone-aware datetime in UTC
        for notification in shared_data['eventNotifications']:
            notification['timeStampGen'] = datetime.fromisoformat(str(notification['timeStampGen'])).astimezone(
                timezone.utc)

        # Retrieve recent events to compare for correlation
        time_threshold = datetime.now(timezone.utc) - timedelta(minutes=60)

        recent_events = list(self.collection.find({
            "eventNotifications.timeStampGen": {
                "$gte": time_threshold
            }
        }))



        # Calculate correlations based on rules
        correlation_data = self.check_correlation_rules(shared_data, recent_events)

        # Add correlation data to the event document
        shared_data['correlation_data'] = correlation_data

        if correlation_data:
            file_data = self.generate_file_content(shared_data, correlation_data)
            self.upload_file_to_reporting_system(file_data)

        # Insert updated event data into MongoDB
        try:
            self.collection.insert_one(shared_data)
            # logger.info("Event stored with correlation data.")

            #  Processing End Time
            processing_end_time = datetime.now(timezone.utc)
            logger.info(f"[PROCESSING END] Hermes Processing completed at: {processing_end_time}")

            #  Calculate and Log Total Processing Time
            processing_duration = (processing_end_time - processing_start_time).total_seconds()
            logger.info(f"[PROCESSING TIME] Total Hermes processing time: {processing_duration:.2f} seconds")
        except Exception as e:
            logger.error(f"Failed to insert data: {e}")



        return {"status": "success"}

    async def start(self):
        server = uvicorn.Server(uvicorn.Config(self.app, host=self.host, port=self.port, log_level="info"))
        await server.serve()


# Usage example
if __name__ == "__main__":
    hermes_agent = HermesAgent(host="127.0.0.1", port=8081)


    async def standalone_start():
        await hermes_agent.start()


    try:
        asyncio.run(standalone_start())
    except Exception as ex:
        logger.error(f"An error occurred: {ex}")
