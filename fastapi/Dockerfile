FROM python:3.7

WORKDIR /opt/server
RUN python3 -m venv venv
RUN ./venv/bin/pip install --upgrade pip
COPY requirements.txt .
RUN ./venv/bin/pip install -r requirements.txt
COPY . .

ENV FASTAPI_DOCKER 1
ENTRYPOINT [ "./venv/bin/python", "server.py" ]
