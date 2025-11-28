# Use an official Python runtime as a parent image
FROM python:3.12-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy the requirements file into the container
COPY requirements.txt ./

# Install dependencies
RUN {{INSTALL_COMMAND}}

# Copy the rest of the application code
COPY . .

# Define environment variables
ENV PORT={{PORT}}

# Command to run FastAPI with Uvicorn
CMD ["uvicorn", "{{OUTPUT_MODULE_NAME}}:app", "--host", "0.0.0.0", "--port", "{{PORT}}", "--app-dir", "{{OUTPUT_DIRECTORY}}"]
