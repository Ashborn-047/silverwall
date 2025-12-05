FROM python:3.11-slim

WORKDIR /app

# Copy requirements and install dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend application code
COPY backend/ .

# Railway provides PORT env variable
ENV PORT=8000

# The CMD uses shell form to expand $PORT
CMD uvicorn main:app --host 0.0.0.0 --port $PORT
