FROM openjdk:17-slim AS builder

WORKDIR /app

COPY src/main/java/com/example/DataProcessor.java /app/DataProcessor.java

RUN javac DataProcessor.java

FROM openjdk:17-slim

WORKDIR /app

COPY --from=builder /app/DataProcessor.class .
COPY --from=builder /app/com /app/com

EXPOSE 9000

CMD ["java", "com.example.DataProcessor"]
