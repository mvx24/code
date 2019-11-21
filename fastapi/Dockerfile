FROM python:3.7

WORKDIR /opt/digibook
COPY . .
RUN python3 -m venv venv
RUN ./venv/bin/pip install --upgrade pip
RUN ./venv/bin/pip install -r requirements.txt

ENV DIGIBOOK_DOCKER 1
ENTRYPOINT [ "./venv/bin/python", "run.py" ]
