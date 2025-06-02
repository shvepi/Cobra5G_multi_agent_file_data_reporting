# File Data Reporting & REST API  
*Supporting the Bachelor’s Thesis “Multi-Agent Root-Cause Analysis Framework for Private 5G Networks” by Petar Iliev

This repository contains two primary components developed as part of Petar Iliev’s Bachelor’s Thesis at Technische Universität Berlin:
1. **File Data Reporting** – a simulated NWDAF EventSubscription system implementing the 3GPP TS 28.532 File Data Reporting Service in TypeScript/Node.js.  
2. **REST API** – a TypeScript/Node.js implementation exposing endpoints for file management, subscriptions, and multi-agent reporting scripts used by the thesis’s multi-agent framework.

## Repository Structure

```
file-data-reporting/
├── rest-api/  
│   ├── Dockerfile                       # Docker setup for File Data Reporting + MongoDB  
│   ├── docker-compose.yml               # Main Docker Compose orchestrating REST API, MongoDB, and agents  
│   ├── file-generator.py                # Python script to generate and POST sample “file” reports  
│   ├── multi-agent-file-reporting/       # Sample Python agents for multi-agent reporting  
│   │   ├── backend_advisor_agent.py  
│   │   ├── user_monitor_agent.py  
│   │   ├── physical_layer_inspector_agent.py  
│   │   ├── hermes_agent.py  
│   │   ├── base_agent.py  
│   │   ├── main.py                       # Orchestration script for launching sample agents  
│   │   ├── requirements.txt  
│   │   └── Dockerfile                    # Docker image for running sample agents  
│   ├── .env.example                      # Template for environment variables (API_PORT, DB_URI, etc.)  
│   ├── .eslintrc.json                    # ESLint configuration for TypeScript/Node.js code quality  
│   ├── .prettierrc.json                  # Prettier formatting rules  
│   ├── OpenAPI_README.md                 # Instructions for regenerating clients/servers from OpenAPI spec  
│   ├── README.md                         # (This file) Overview, setup, and usage  
│   ├── docker-compose.yml                # Defines services: rest-api, mongo, and multi-agent containers  
│   ├── index.ts                          # Entry point: loads .env, connects to MongoDB, starts Express server  
│   ├── config.ts                         # Central configuration (PORT, BASE_PATH, DB_URI, etc.)  
│   ├── src/                              # Core REST API implementation  
│   │   ├── controllers/                  # Controllers for /files, /subscriptions endpoints  
│   │   ├── models/                       # Mongoose schemas for file metadata and subscriptions  
│   │   ├── routes/                       # Express routers wiring controllers to endpoints  
│   │   ├── services/                     # Business logic for file creation, retrieval, deletion, subscription  
│   │   ├── data-sources/                 # MongoDB connection setup and utility functions  
│   │   └── utils/                        # Shared utilities (error handling, request validation)  
│   ├── __tests__/                        # Unit, integration, and end-to-end tests  
│   │   ├── unit/  
│   │   ├── integration/  
│   │   └── fixtures/  
│   ├── tsconfig.json                     # TypeScript compiler settings (target, module, strictness)  
│   ├── jest.config.ts                    # Jest configuration for unit tests  
│   ├── jest.config.integ.ts              # Jest configuration for integration tests (connects to real MongoDB)  
│   ├── jest.config.e2e.ts                # Jest configuration for end-to-end tests (spins up server + DB)  
│   ├── package.json                      # Dependencies (Express, Mongoose, Jest, etc.) and npm scripts  
│   └── package-lock.json                 # Locked versions of all npm packages  
└── Bachelor_Thesis_final.pdf             # Full thesis document fileciteturn0file0  
```

## Thesis Context

This codebase was developed to simulate and validate the NWDAF EventSubscription functionality described in Petar Iliev’s Bachelor’s Thesis, “Multi-Agent Root-Cause Analysis Framework for Private 5G Networks” (March 25, 2025, Technische Universität Berlin) fileciteturn0file0. In environments without a live NWDAF deployment, the **File Data Reporting** service emulates TS 28.532-compliant event files. Downstream, a suite of Python “agents” (Physical Layer Inspector, User Monitor, Backend Advisor, Hermes) subscribe to these files, extract anomaly data, and perform correlation or root-cause analysis as described in Chapter 3 and Chapter 4 of the thesis.

## Getting Started

### Prerequisites
- **Docker & Docker Compose** (version > 20.10)  
- **Node.js** (LTS, e.g., 18.x) and **npm** (for local development/testing)  
- **Python 3.9+** (for running the sample agent scripts under `multi-agent-file-reporting/`)  

### Environment Variables
Copy `.env.example` to `.env` and configure before running:
```env
# REST API
API_PORT=3000
DB_URI=mongodb://mongo:27017/file-data-reporting

# File expiration (in seconds)
FILE_EXPIRATION_SECONDS=3600

# Other custom settings
BASE_PATH=/api/v1
```

### Build & Run with Docker Compose
1. From the repo root:
   ```bash
   docker-compose up --build
   ```
2. This launches three containers:  
   - **rest-api** — Node.js service exposing `/files` and `/subscriptions`.  
   - **mongo** — MongoDB instance for persisting file metadata and subscriptions.  
   - **multi-agent** — Sample Python agents (built from `multi-agent-file-reporting/Dockerfile`), automatically subscribing to the REST API and posting anomaly reports to Hermes.

3. Confirm all services are healthy:  
   - REST API: `http://localhost:3000/api/v1/healthz` → `{ "status": "ok" }`  
   - MongoDB: Tail log for “waiting for connections” message.  
   - Multi-agent: Logs indicating “Subscribed to file notifications” and processing simulated events.

### Local Development (without Docker)
1. **REST API**  
   ```bash
   cd rest-api
   npm install
   npm run lint
   npm run test          # runs unit + integration + e2e tests
   npm run dev           # starts server with nodemon on configured port
   ```
   - Open `http://localhost:3000/api/v1/docs` to view Swagger UI and interact with the OpenAPI endpoints.

2. **Sample Agents**  
   ```bash
   cd rest-api/multi-agent-file-reporting
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   # Launch individual agents by running:
   python3 main.py     # Or run each agent module directly
   ```
   By default, each agent will register its subscription with the REST API and print logs when processing file notification events.

## Using the File Data Reporting Service

### Endpoints
- **GET /api/v1/files**  
  List all available file reports (supports query params: `category`, `limit`, `offset`).

- **POST /api/v1/files**  
  Create a new file report. Request body must follow TS 28.532 schema:  
  ```jsonc
  {
    "fileCategory": "Trace" | "Analytics" | "Proprietary" | "Performance",
    "fileComponent": "AMF" | "SMF" | "UDM",
    "notificationURI": "http://<agent-host>:<port>/notify",
    "expirySeconds": 3600,
    "eventNotifications": [ /* array of NWDAF EventSubscription messages */ ]
  }
  ```
  Returns `{ "fileId": "<generated-uuid>", "expiresAt": "<ISO-timestamp>" }`.

- **GET /api/v1/files/{fileId}**  
  Retrieve the contents of a single file report by its `fileId`.

- **DELETE /api/v1/files/{fileId}**  
  Delete a file report, removing it from storage.

- **POST /api/v1/files/create-many**  
  Bulk-create file reports (accepts an array of file payloads identical to `POST /api/v1/files`).

- **POST /api/v1/subscriptions**  
  Subscribe to file-notification events. Request body:
  ```jsonc
  {
    "fileCategoryFilter": ["Trace", "Analytics", "Proprietary", "Performance"],
    "notificationURI": "http://<agent-host>:<port>/notify"
  }
  ```
  Returns `{ "subscriptionId": "<uuid>" }`.

- **GET /api/v1/subscriptions/{subscriptionId}**  
  Retrieve an existing subscription’s details.

- **DELETE /api/v1/subscriptions/{subscriptionId}**  
  Remove a subscription to stop receiving file-notification callbacks.

### Example Flow
1. **Agent subscribes** (e.g., PhysicalLayerInspectorAgent):
   ```http
   POST /api/v1/subscriptions
   Content-Type: application/json

   {
     "fileCategoryFilter": ["Trace"],
     "notificationURI": "http://physical-agent:8001/notify"
   }
   ```
2. **File Generator** (in `rest-api/file-generator.py`) creates a `Trace` file with an “UNEXPECTED_RADIO_LINK_FAILURE” anomaly and does:
   ```python
   requests.post("http://localhost:3000/api/v1/files", json=generated_trace_payload)
   ```
3. **REST API** stores metadata in MongoDB, then issues a POST to `http://physical-agent:8001/notify`:
   ```jsonc
   {
     "fileId": "8d3f7a50-2c1a-4f2b-a6ea-3de89123ef4a",
     "fileCategory": "Trace",
     "notificationTimestamp": "2025-06-02T12:34:56.789Z"
   }
   ```
4. **PhysicalLayerInspectorAgent** receives the callback, does:
   ```python
   resp = await session.get(f"http://rest-api:3000/api/v1/files/{fileId}")
   file_contents = await resp.json()
   # Extract “UNEXPECTED_RADIO_LINK_FAILURE” event from file_contents["eventNotifications"]
   # POST structured anomaly to Hermes Agent at http://hermes-agent:9000/ingest
   ```
5. **HermesAgent** ingests multiple agent reports, applies correlation rules (e.g., linking “Too Frequent Service Access” with nearby “Radio Link Failures”), enriches the event, and inserts into MongoDB under a unified “anomaly” collection.

6. **Dashboard** (React + Mapbox) polls Hermes’ REST endpoint (`GET /api/v1/correlations`) to render geospatial heatmaps, time-series charts, and correlation pairs, allowing network operators to visually inspect root causes in real time.

## Development Notes

- **TypeScript & Linting**  
  - The REST API is written in TypeScript, enforcing strict types. Run `npm run lint` before committing any changes.  
  - Prettier is configured via `.prettierrc.json` to enforce consistent formatting (2-space indentation, trailing commas).

- **Testing**  
  - Unit tests live under `__tests__/unit` and use Jest.  
  - Integration tests (`__tests__/integration`) spin up an in-memory MongoDB instance via `mongodb-memory-server` to validate controllers and services.  
  - End-to-End tests (`__tests__/e2e`) use Docker Compose to launch the full stack (REST API + MongoDB + sample agent), then simulate file generation and verify correlation outputs.

- **Containerization**  
  - `rest-api/Dockerfile` builds the Node.js service into a production image.  
  - `multi-agent-file-reporting/Dockerfile` builds a Python image with all sample agents installed, automatically launching them on container start.  
  - The top-level `docker-compose.yml` ties everything together—REST API on port 3000, MongoDB on 27017, and sample agents on their assigned ports.  
  - Environment variables can be overridden by supplying a custom `.env` file to Docker Compose (e.g., `docker-compose --env-file .env.prod up -d`).

## How This Supports the Bachelor’s Thesis

All components in this repository were designed to validate and demonstrate the concepts laid out in Petar Iliev’s Bachelor’s Thesis (March 25, 2025). Key relationships include:

- **TS 28.532 File Data Reporting**  
  Chapter 4 of the thesis describes simulating NWDAF EventSubscription by generating TS 28.532-compliant files containing trace, analytics, proprietary, and performance data. The `rest-api` module faithfully implements these endpoints and schemas.

- **Multi-Agent Framework**  
  Chapter 3 and Chapter 4 outline how specialized agents (Physical Layer Inspector, User Monitor, Backend Advisor, Hermes) subscribe to event files, process anomalies, and perform correlation analysis. The sample Python scripts under `multi-agent-file-reporting/` demonstrate:
  - **PhysicalLayerInspectorAgent** (subscribes to “Trace” files for “UNEXPECTED_RADIO_LINK_FAILURE”).  
  - **UserMonitorAgent** (subscribes to “Trace” + “Performance” files for “TOO_FREQUENT_SERVICE_ACCESS” and “UNEXPECTED_LOW_RATE_FLOW”).  
  - **BackendAdvisorAgent** (subscribes to “Analytics” + “Proprietary” files for “UNEXPECTED_LONG_LIVE_FLOW” and “SUSPICION_OF_DDOS_ATTACK”).  
  - **HermesAgent** performs the cross-agent correlation logic (binding e.g. “Radio Link Failures” within 500 meters of “Too Frequent Service Access” in a 2-minute window).  

- **Visualization & Root-Cause Analysis**  
  Chapter 5 and Chapter 6 describe how correlated anomalies are visualized (React + Mapbox dashboard) to enable operators to detect root causes quickly. The dashboard code (not included here) assumes a REST endpoint (`GET /api/v1/correlations`) that returns enriched anomaly pairs with location, timestamp, and confidence scores.

## Next Steps & Customization

- **Add New Agents**  
  - Create a subclass of `BaseAgent` in Python, specify `SUBSCRIBE_CATEGORIES`, and implement the custom filtering logic in `handle_event_notification()`.  
  - Update `docker-compose.yml` to include the new agent container.

- **Extend Correlation Rules**  
  - In `HermesAgent`, modify `correlation_rules.py` to add new rule definitions (e.g., correlating “High UE Speed” with “Frequent Handover Failures”).

- **Enhance Dashboard**  
  - Point the frontend’s API client to the correct backend URL.  
  - Add new visualization widgets (e.g., real-time anomaly histograms, KPI gauges).

- **Deploy to Kubernetes**  
  - Convert `docker-compose.yml` into Kubernetes manifests or Helm charts.  
  - Use Kubernetes Secrets/ConfigMaps to manage environment variables.

## References

- **Bachelor’s Thesis**: Petar Iliev, *Multi-Agent Root-Cause Analysis Framework for Private 5G Networks*, Technische Universität Berlin, March 25, 2025. fileciteturn0file0  
- **3GPP TS 28.532**: File Data Reporting Service  
- **3GPP TS 29.520**: Nnwdaf EventsSubscription schema

---

*This repository and its components were developed to demonstrate the feasibility, scalability, and effectiveness of a multi-agent root-cause analysis framework in private 5G environments, as described in the accompanying Bachelor’s Thesis.*  
