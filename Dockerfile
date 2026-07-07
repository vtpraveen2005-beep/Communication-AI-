# Use a lightweight official Java image
FROM eclipse-temurin:21-jdk-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy the backend and frontend folders into the container
COPY backend /app/backend
COPY frontend /app/frontend

# Change into the backend directory
WORKDIR /app/backend

# Compile the Java application from source
RUN mkdir -p out && \
    javac -encoding UTF-8 -d out \
    src/com/commai/*.java \
    src/com/commai/auth/*.java \
    src/com/commai/engine/*.java \
    src/com/commai/handlers/*.java \
    src/com/commai/util/*.java

# Start the Java server
CMD ["java", "-cp", "out", "com.commai.Main"]
