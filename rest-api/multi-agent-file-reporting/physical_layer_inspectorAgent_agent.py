import asyncio
import logging
from base_agent import BaseExaminerAgent
from fastapi import HTTPException, Request
from datetime import datetime, timedelta, timezone
import aiohttp

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class PhysicalLayerInspectorAgent(BaseExaminerAgent):
    def __init__(self, host, port, hermes_agent_url):
        # Initialize BaseExaminerAgent with only the "Trace" file type
        super().__init__(host, port, ["Trace"], hermes_agent_url)
        logger.info(f"PhysicalLayerInspector initialized with URL: {self.host}:{self.port}")

    async def send_to_hermes(self, shared_data):
        async with aiohttp.ClientSession() as session:
            #logger.info(f"Sending data to Hermes: {shared_data}")
            async with session.post(self.hermes_agent_url, json=shared_data) as response:
                if response.status == 200:
                    logger.info("Data successfully sent to Hermes.")
                else:
                    logger.error(f"Failed to send data to Hermes. Status code: {response.status}")

    def create_file_handler(self, file_type):
        """Creates a specialized handler function for Trace file notifications."""
        async def handle_file_notification(request: Request):
            """Handles notifications for Trace files."""
            try:
                # Processing start time
                processing_start_time = datetime.now(timezone.utc)
                logger.info(f"[PROCESSING START] File  Physical Agent notification received at: {processing_start_time}")


                notification = await request.json()
                #logger.info(f"Received Trace file notification: {notification}")

                file_info_list = notification.get("fileInfoList", [])
                if not file_info_list or not isinstance(file_info_list, list):
                    raise HTTPException(status_code=422, detail="Invalid fileInfoList structure")

                for file_info in file_info_list:
                    file_location = file_info.get("fileLocation")
                    if not file_location:
                        #logger.error("File location missing in file information.")
                        continue

                    # Fetch file details
                    file_details = await self.fetch_file_details(file_location)
                    if not file_details:
                        continue

                    # Process only relevant exceptions
                    excep_id = (
                        file_details.get("eventNotifications", [{}])[0]
                        .get("abnorBehavrs", [{}])[0]
                        .get("excep", {})
                        .get("excepId")
                    )
                    if excep_id != "UNEXPECTED_RADIO_LINK_FAILURES":
                        #logger.info("Ignoring non-UNEXPECTED_RADIO_LINK_FAILURES notification.")
                        return {"message": "Non-relevant Trace file ignored"}

                    # Prepare data to send to Hermes
                    shared_data = {key: value for key, value in file_details.items() if key != "fileInfo"}
                    await self.send_to_hermes(shared_data)

                    # Processing end time
                    processing_end_time = datetime.now(timezone.utc)
                    logger.info(f"[PROCESSING END] Physical Agent Processing completed at: {processing_end_time}")

                    # Calculate and log processing duration
                    processing_duration = (processing_end_time - processing_start_time).total_seconds()
                    logger.info(f"[PROCESSING TIME] Total Physical Agent processing time: {processing_duration:.2f} seconds")

                return {"message": "Trace notification processed"}

            except Exception as e:
                logger.error(f"Error processing Trace notification: {e}")
                raise HTTPException(status_code=422, detail="Invalid notification format")

        return handle_file_notification

# Running this as a standalone instance
if __name__ == "__main__":
    host = '127.0.0.16'
    port = 5558  # Use a unique port for the Trace agent
    hermes_agent_url = "http://localhost:8081/receive_shared_data"

    agent = PhysicalLayerInspectorAgent(host, port, hermes_agent_url)

    try:
        asyncio.run(agent.main())
    except Exception as ex:
        logger.error(f"An error occurred: {ex}")
