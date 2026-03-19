FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
# Copy transport package as a proper Python package
COPY . ./transport/
EXPOSE 2525 1143 8025
CMD ["python", "-m", "uvicorn", "transport.app:app", "--host", "0.0.0.0", "--port", "8025"]
