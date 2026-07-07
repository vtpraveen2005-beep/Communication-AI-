package com.commai.handlers;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.commai.util.CorsUtil;
import com.commai.util.JsonUtil;
import java.io.*;
import java.nio.file.*;

/**
 * StaticHandler.java — Serves all frontend static files
 * Maps requests to D:\Communication AI Java\frontend\
 */
public class StaticHandler implements HttpHandler {

    // Resolve frontend directory dynamically based on execution context
    private static final Path FRONTEND_DIR = resolveFrontendDir();

    private static Path resolveFrontendDir() {
        String envDir = System.getenv("FRONTEND_DIR");
        if (envDir != null && !envDir.isBlank()) return Path.of(envDir);
        Path cwd = Path.of(System.getProperty("user.dir"));
        if (Files.exists(cwd.resolve("frontend"))) return cwd.resolve("frontend");
        if (cwd.getParent() != null && Files.exists(cwd.getParent().resolve("frontend"))) return cwd.getParent().resolve("frontend");
        return cwd.resolve("frontend"); // Fallback
    }

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        if ("OPTIONS".equals(exchange.getRequestMethod())) {
            CorsUtil.handleOptions(exchange); return;
        }

        String path = exchange.getRequestURI().getPath();

        // Default to index.html
        if (path.equals("/") || path.isEmpty()) path = "/index.html";

        // Block path traversal attacks
        if (path.contains("..")) {
            send(exchange, 403, "text/plain", "Forbidden");
            return;
        }

        Path file = FRONTEND_DIR.resolve(path.substring(1));

        if (!Files.exists(file) || Files.isDirectory(file)) {
            // SPA fallback — serve index.html for unknown routes
            file = FRONTEND_DIR.resolve("index.html");
        }

        if (!Files.exists(file)) {
            send(exchange, 404, "text/plain", "Not Found");
            return;
        }

        String mime = getMimeType(file.toString());
        byte[] content = Files.readAllBytes(file);
        exchange.getResponseHeaders().add("Content-Type", mime);
        exchange.getResponseHeaders().add("Cache-Control", "no-cache");
        
        if ("HEAD".equalsIgnoreCase(exchange.getRequestMethod())) {
            exchange.getResponseHeaders().add("Content-Length", String.valueOf(content.length));
            exchange.sendResponseHeaders(200, -1);
            exchange.getResponseBody().close();
            return;
        }
        
        exchange.sendResponseHeaders(200, content.length);
        exchange.getResponseBody().write(content);
        exchange.getResponseBody().close();
    }

    private String getMimeType(String filename) {
        if (filename.endsWith(".html")) return "text/html; charset=utf-8";
        if (filename.endsWith(".css"))  return "text/css; charset=utf-8";
        if (filename.endsWith(".js"))   return "application/javascript; charset=utf-8";
        if (filename.endsWith(".json")) return "application/json";
        if (filename.endsWith(".png"))  return "image/png";
        if (filename.endsWith(".jpg") || filename.endsWith(".jpeg")) return "image/jpeg";
        if (filename.endsWith(".svg"))  return "image/svg+xml";
        if (filename.endsWith(".ico"))  return "image/x-icon";
        return "application/octet-stream";
    }

    private void send(HttpExchange ex, int code, String mime, String body) throws IOException {
        ex.getResponseHeaders().add("Content-Type", mime);
        byte[] b = body.getBytes("UTF-8");
        ex.sendResponseHeaders(code, b.length);
        ex.getResponseBody().write(b);
        ex.getResponseBody().close();
    }
}
