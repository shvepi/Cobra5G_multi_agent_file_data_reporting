import asyncio
import logging
from backend_advisor_agent import BackendAdvisorAgent
from user_monitor_agent import UserMonitorAgent
from physical_layer_inspectorAgent_agent import PhysicalLayerInspectorAgent
from hermes_agent import HermesAgent  # Import HermesAgent



# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def start_agent(agent):
    """Helper function to start each agent."""
    await agent.main()

async def main():
    host = '172.24.176.1'
    hermes_agent_url = f'http://{host}:8081/receive_shared_data'  # Update Hermes URL for all agents

    # Instantiate each agent with a unique port
    backend_agent = BackendAdvisorAgent(host, 5555, hermes_agent_url)
    user_agent = UserMonitorAgent(host, 5556, hermes_agent_url)
    physical_layer_agent_agent = PhysicalLayerInspectorAgent(host, 5557, hermes_agent_url)

    # Instantiate Hermes agent
    hermes_agent = HermesAgent(host=host, port=8081)

    # Run all agents concurrently, including Hermes
    await asyncio.gather(
        start_agent(backend_agent),
        start_agent(user_agent),
        start_agent(physical_layer_agent_agent),
        hermes_agent.start()
    )

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except Exception as ex:
        logger.error(f"An error occurred: {ex}")
