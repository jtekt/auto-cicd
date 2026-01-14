# Use a base image that has Python installed
FROM python:3.12-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy the requirements file to the container
COPY requirements.txt ./

# Install the Python dependencies
RUN {{INSTALL_COMMAND}}

# Copy the rest of the application code into the container
COPY . .

# Define environment variables
ENV PORT={{PORT}}

# Set the entry point for Streamlit
CMD ["streamlit", "run", "{{OUTPUT_PATH}}", "--server.port={{PORT}}", "--server.address=0.0.0.0", "--server.headless=true"]
