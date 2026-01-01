package com.example;

import com.sun.net.httpserver.HttpServer;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpExchange;

import java.io.IOException;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.nio.charset.StandardCharsets;

public class DataProcessor {
    private static final BlockingQueue<String> queue = new LinkedBlockingQueue<>();
    private static int processedCount = 0;

    public static void main(String[] args) throws IOException {
        int port = Integer.parseInt(System.getenv().getOrDefault("PORT", "9000"));
        
        // Start background processor
        ExecutorService executor = Executors.newSingleThreadExecutor();
        executor.submit(() -> {
            while (true) {
                try {
                    String data = queue.take();
                    processData(data);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    break;
                }
            }
        });

        HttpServer server = HttpServer.create(new InetSocketAddress(port), 0);
        
        server.createContext("/submit", new SubmitHandler());
        server.createContext("/status", new StatusHandler());
        server.createContext("/health", new HealthHandler());
        
        server.setExecutor(null);
        server.start();
        
        System.out.println("Data Processor started on port " + port);
    }

    static class SubmitHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (!"POST".equals(exchange.getRequestMethod())) {
                sendResponse(exchange, 405, "{\"error\":\"Method not allowed\"}");
                return;
            }

            String body = new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8);
            queue.offer(body);
            
            String response = String.format("{\"message\":\"Data queued\",\"queueSize\":%d}", queue.size());
            sendResponse(exchange, 202, response);
        }
    }

    static class StatusHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            String response = String.format(
                "{\"queueSize\":%d,\"processedCount\":%d}",
                queue.size(),
                processedCount
            );
            sendResponse(exchange, 200, response);
        }
    }

    static class HealthHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            sendResponse(exchange, 200, "{\"status\":\"healthy\"}");
        }
    }

    private static void sendResponse(HttpExchange exchange, int statusCode, String response) throws IOException {
        exchange.getResponseHeaders().set("Content-Type", "application/json");
        byte[] bytes = response.getBytes(StandardCharsets.UTF_8);
        exchange.sendResponseHeaders(statusCode, bytes.length);
        OutputStream os = exchange.getResponseBody();
        os.write(bytes);
        os.close();
    }

    private static void processData(String data) {
        try {
            // Simulate processing
            Thread.sleep(100);
            processedCount++;
            System.out.println("Processed: " + data + " (Total: " + processedCount + ")");
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
}
