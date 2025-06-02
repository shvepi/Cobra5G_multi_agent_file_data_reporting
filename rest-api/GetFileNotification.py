from fastapi import FastAPI, Request

app = FastAPI()

@app.post("/callback")
async def callback(request: Request):
    # Parse the incoming request
    notification = await request.json()

    # Print the notification details to the console or log it
    print("Received notification:", notification)

    # Access file information
    if "fileInfoList" in notification:
        for file_info in notification["fileInfoList"]:
            print(f"File Location: {file_info['fileLocation']}")
            print(f"File Type: {file_info['fileDataType']}")
            print(f"File Ready Time: {file_info['fileReadyTime']}")

    return {"message": "Notification received"}
