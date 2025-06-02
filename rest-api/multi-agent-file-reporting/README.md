# Multi-Agent System README

## Multi-Agent System Overview
The multi-agent system consists of several Python-based agents utilizing FastAPI and MongoDB, orchestrated via Docker Compose. Each agent processes anomaly notifications, communicates with a Hermes agent, and stores correlation data.

## Components
- MongoDB: Central database for storing anomalies and correlations.
- File Data Reporting Service: Receives and handles file-based anomaly notifications.
- Backend Advisor Agent: Handles "Analytics" and "Proprietary" anomaly notifications.
- User Monitor Agent: Handles "Trace" and "Performance" notifications.
- Physical Layer Inspector Agent: Specializes in "Trace" notifications.
- Hermes Agent: Performs correlation and manages anomaly data storage.

## Directory Structure:
```
├── file-data-reporting/
│   ├── rest-api/
│   │   ├── file-generator.py
│   │   ├── Dockerfile # File-data-reporting and mongoDB Docker File
│   │   │   ├── docker-compose.yml          # Main Docker Compose file 
│   │   │   ├── multi-agent-file-reporting/
│   │   │   │   ├── backend_advisor_agent.py
│   │   │   │   ├── user_monitor_agent.py
│   │   │   │   ├── physical_layer_inspectorAgent_agent.py
│   │   │   │   ├── hermes_agent.py
│   │   │   │   ├── base_agent.py
│   │   │   │   ├── main.py
│   │   │   │   ├── requirements.txt
│   │   │   │   └── Dockerfile
```
## Prerequisites
- Docker
- Docker Compose

## Build and Run
Run the following commands in the root directory:

docker compose build
docker compose up -d

Access Services:
- Hermes Agent: http://localhost:8081
- Backend Advisor Agent: http://localhost:5555
- User Monitor Agent: http://localhost:5556
- Physical Layer Inspector Agent: http://localhost:5557
- MongoDB: mongodb://localhost:27017

Logs and Troubleshooting:
docker compose logs agents

Stopping Containers:
docker compose down

Cleaning MongoDB data (optional):
docker volume rm $(docker volume ls -q | grep mongodb-data)

Happy anomaly detection!
"""
