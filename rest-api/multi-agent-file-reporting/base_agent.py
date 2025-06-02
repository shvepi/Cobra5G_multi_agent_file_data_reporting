import logging
import aiohttp
import nest_asyncio
import uvicorn
from fastapi import FastAPI, Request, HTTPException
from contextlib import asynccontextmanager

# Apply nest_asyncio for compatibility with interactive environments
nest_asyncio.apply()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class BaseExaminerAgent:
    """
        A base class for creating an examiner agent that handles file notifications, fetches file details,
        and forwards data to a Hermes agent for further processing.
    """
    def __init__(self, host, port, file_types, hermes_agent_url):
        """
                Initializes the agent.

                Args:
                    host (str): Host address for the agent.
                    port (int): Port number for the agent.
                    file_types (list[str] or str): Types of files to handle notifications for.
                    hermes_agent_url (str): URL for the Hermes agent to send data to.
        """
        self.file_types = file_types if isinstance(file_types, list) else [file_types]
        self.hermes_agent_url = hermes_agent_url
        self.subscription_url = "http://localhost:8080/fileDataReportingMnS/v1/subscriptions/"
        self.host = host
        self.port = port

        # FastAPI instance with lifespan setup
        self.app = FastAPI(lifespan=self.lifespan_context)

        # Set up separate routes for each file type
        for file_type in self.file_types:
            self.app.post(f"/handle_{file_type.lower()}_file_notification")(self.create_file_handler(file_type))

    def create_file_handler(self, file_type):
        """
        Creates an asynchronous handler for file notifications.

        Args:
            file_type (str): The type of file this handler will process.

        Returns:
            Callable: A function to handle notifications.
        """
        async def handle_file_notification(request: Request):
            try:
                notification = await request.json()
                logger.info(f"Received {file_type} file notification: {notification}")

                file_info_list = notification.get("fileInfoList", [])
                if not file_info_list or not isinstance(file_info_list, list):
                    raise HTTPException(status_code=422, detail="Invalid fileInfoList structure")

                for file_info in file_info_list:
                    file_location = file_info.get("fileLocation")
                    route = f"/handle_{file_type.lower()}_file_notification"
                    logger.info(f"Registering route: {route}")
                    self.app.post(route)(self.create_file_handler(file_type))
                    if not file_location:
                        logger.error("File location missing in file information.")
                        continue

                    # Fetch and structure file details
                    file_details = await self.fetch_file_details(file_location)
                    if not file_details:
                        continue

                    # Prepare the data to send to Hermes
                    shared_data = {
                        "event_type": f"NEW_{file_type.upper()}_FILE",
                        "event_data": {
                            "_id": file_details.get("_id"),
                            "fileLocation": file_details["fileInfo"].get("fileLocation"),
                            "fileReadyTime": file_details["fileInfo"].get("fileReadyTime"),
                            "fileSize": file_details["fileInfo"].get("fileSize"),
                            "fileCompression": file_details["fileInfo"].get("fileCompression"),
                            "fileFormat": file_details["fileInfo"].get("fileFormat"),
                            "fileDataType": file_details["fileInfo"].get("fileDataType"),
                            "fileContent": {key: value for key, value in file_details.items() if key != "fileInfo"},
                            # Include additional content based on file type
                            **(file_details.get("analysisId") and {
                                "analysisId": file_details["analysisId"],
                                "findings": file_details.get("findings"),
                                "generatedOn": file_details.get("generatedOn")
                            } or {}),
                            **(file_details.get("vendorSpecificData") and {
                                "vendorSpecificData": file_details["vendorSpecificData"]
                            } or {}),
                            **(file_details.get("sessionId") and {
                                "sessionId": file_details["sessionId"],
                                "events": file_details.get("events")
                            } or {}),
                        }
                    }
                    # Send data to Hermes
                    await self.send_to_hermes(shared_data)
                return {"message": f"{file_type} notification processed"}

            except Exception as e:
                logger.error(f"Error processing {file_type} notification: {e}")
                raise HTTPException(status_code=422, detail="Invalid notification format")

        return handle_file_notification

    @asynccontextmanager
    async def lifespan_context(self, app: FastAPI):
        """
                Manages the startup and shutdown of the agent, including subscriptions.

                Args:
                    app (FastAPI): The FastAPI application.

                Yields:
                    None
        """
        await self.subscribe_to_multiple_files()
        yield  # Allow the application to start

    async def subscribe_to_multiple_files(self):
        """Subscribe to each file type defined in self.file_types."""
        for file_type in self.file_types:
            await self.subscribe_to_single_file_type(file_type)

    async def subscribe_to_single_file_type(self, file_type):
        """Subscribes to files of the specified file_type."""
        consumer_url = f"http://{self.host}:{self.port}/handle_{file_type.lower()}_file_notification"
        subscription_payload = {
            "consumerReference": consumer_url,
            "filter": {
                "fileDataType": file_type
            }
        }
        async with aiohttp.ClientSession() as session:
            async with session.post(self.subscription_url, json=subscription_payload) as response:
                if response.status != 201:
                    logger.error(f"Failed to subscribe to {file_type} files: {response.status}")
                else:
                    logger.info(f"Successfully subscribed to {file_type} files.")

    async def fetch_file_details(self, file_location):
        async with aiohttp.ClientSession() as session:
            async with session.get(file_location) as response:
                if response.status == 200:
                    file_details = await response.json()
                    logger.info(f"Fetched file details: {file_details}")
                    return file_details
                else:
                    logger.error(f"Failed to fetch file details from {file_location}. Status code: {response.status}")
                    return None

    async def send_to_hermes(self, shared_data):
        async with aiohttp.ClientSession() as session:
            async with session.post(self.hermes_agent_url, json=shared_data) as response:
                if response.status == 200:
                    logger.info(f"Data successfully sent to Hermes.")
                else:
                    logger.error(f"Failed to send data to Hermes. Status code: {response.status}")

    async def main(self):
        """Start the FastAPI server asynchronously."""
        config = uvicorn.Config(self.app, host=self.host, port=self.port, log_level="info")
        server = uvicorn.Server(config)
        await server.serve()

# Example usage
if __name__ == "__main__":
    host = '127.0.0.16'
    port = 5555
    hermes_agent_url = "http://localhost:8081/receive_shared_data"
    file_types = ["Trace", "Performance"]
    agent = BaseExaminerAgent(host, port, file_types, hermes_agent_url)

    try:
        agent.run()
    except Exception as ex:
        logger.error(f"An error occurred: {ex}")
