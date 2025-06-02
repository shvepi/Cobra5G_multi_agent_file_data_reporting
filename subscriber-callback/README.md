# Subscriber Callback Server

Here is an example of a subscriber (e.g. NWDAF) callback server for the File Data Reporting service. A subscription to the File Data Reporting service would need to be created first before being able to receive file notifications through POST requests.

## Prerequisites

Create a subscription for file notifications. See the API [documentation](../rest-api/src/api/openapi.yaml) for details on what files you can subscribe to:

```bash
./create_subscription.sh
```

## Running the server

The server was tested to run with Python version 3.12.0.  
Install the required dependencies:

```bash
pip install -r requirements.txt
```

Run the server:

```bash
python callback_server.py
```
