package com.commai.handlers;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.commai.engine.GeminiClient;
import com.commai.util.CorsUtil;
import com.commai.util.JsonUtil;
import java.io.*;

/**
 * HealthHandler.java — GET /api/health
 * Returns server health status and Gemini API configuration status.
 */
public class HealthHandler implements HttpHandler {

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        if ("OPTIONS".equals(exchange.getRequestMethod())) {
            CorsUtil.handleOptions(exchange); return;
        }

        String result = new JsonUtil.Builder()
            .put("status", "healthy")
            .put("server", "CommAI Java Server")
            .put("version", "1.0.0")
            .put("geminiConfigured", GeminiClient.isConfigured())
            .put("aiProvider", GeminiClient.isConfigured() ? GeminiClient.getProviderName() : "built-in")
            .build();

        CorsUtil.sendJson(exchange, 200, result);
    }
}
