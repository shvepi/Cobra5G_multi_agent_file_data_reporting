import uvicorn
import datetime
from typing import Union
from enum import Enum
from random import randrange
from fastapi import FastAPI, Response, status
from pydantic import BaseModel

from argparse import ArgumentParser


class FileDataType(str, Enum):
    Performance = "Performance"
    Analytics = "Analytics"
    Trace = "Trace"
    Proprietary = "Proprietary"


class FileInfo(BaseModel):
    fileLocation: str
    fileSize: int | None = None
    fileReadyTime: str
    fileExpirationTime: str | None = None
    fileCompression: str | None = None
    fileFormat: str | None = None
    fileDataType: FileDataType


class NotificationType(str, Enum):
    notifyFileReady = "notifyFileReady"
    notifyFilePreparationError = "notifyFilePreparationError"


class NotifyFileReady(BaseModel):
    href: str | None = None
    notificationId: int | None = None
    notificationType: NotificationType
    eventTime: str
    systemDN: str
    fileInfoList: list[FileInfo]
    additionalText: str | None = None


app = FastAPI()


@app.post("/callback", status_code=204)
def read_callback(notifyFileReady: NotifyFileReady):
    num = randrange(10)
    if num <= 3:
        print(f"[{datetime.datetime.now()}] Simulating error")
        return Response(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)
    if notifyFileReady.fileInfoList:
        print(f"fileInfoList size: {len(notifyFileReady.fileInfoList)}\n")
        for fileInfo in notifyFileReady.fileInfoList:
            print(
                f"fileInfo: {fileInfo.model_dump_json(indent=3, exclude_unset=True)}\n"
            )
            # do something with fileInfo
    print(f"[{datetime.datetime.now().astimezone().isoformat()}]")
    return


@app.post("/callback/{status_code}")
def read_callback(
    notifyFileReady: NotifyFileReady, status_code: int, response: Response
):
    if (
        status_code == 408
        or status_code == 429
        or status_code == 500
        or status_code == 503
    ):
        print(f"Retryable error: {status_code}")
        response.status_code = status_code
        return {"status": status_code}
    if notifyFileReady.fileInfoList:
        print(f"fileInfoList size: {len(notifyFileReady.fileInfoList)}\n")
        print(f"fileInfoList: {notifyFileReady.fileInfoList}\n")

        # for fileInfo in notifyFileReady.fileInfoList:
        # print(f"fileInfo: {fileInfo.model_dump_json(indent=3)}\n")
        # do something with fileInfo
    print(f"[{datetime.datetime.now().astimezone().isoformat()}]")
    return {"notifyFileReady": notifyFileReady.href}


def argparser() -> ArgumentParser:
    """Returns command line arguments parser."""
    parser = ArgumentParser()

    parser.add_argument("--api_host", type=str, default="127.0.0.16")

    parser.add_argument("--api_port", type=int, default=7777)

    return parser


def main():
    args = argparser().parse_args()

    try:
        uvicorn.run(app, host=args.api_host, port=args.api_port)
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main()
