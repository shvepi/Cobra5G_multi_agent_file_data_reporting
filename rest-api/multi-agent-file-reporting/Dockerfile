FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY *.py ./

EXPOSE 5555 5556 5557 8081

ENTRYPOINT ["python", "main.py"]
