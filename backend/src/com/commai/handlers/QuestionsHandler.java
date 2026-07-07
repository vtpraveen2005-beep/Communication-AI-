package com.commai.handlers;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.commai.util.CorsUtil;
import com.commai.util.JsonUtil;
import java.io.*;
import java.nio.file.*;

/**
 * QuestionsHandler.java — GET /api/questions?type=oral&level=1
 * Returns the question bank from data/questions.json
 */
public class QuestionsHandler implements HttpHandler {

    private static final Path DATA_FILE = Path.of(
        System.getProperty("user.dir")).resolve("data/questions.json");

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        if ("OPTIONS".equals(exchange.getRequestMethod())) {
            CorsUtil.handleOptions(exchange); return;
        }

        try {
            String json = Files.readString(DATA_FILE);
            String query = exchange.getRequestURI().getQuery();
            String type  = extractParam(query, "type");
            String level = extractParam(query, "level");

            // If type is specified, extract just that section
            if (type != null && !type.isEmpty()) {
                String section = extractJsonArray(json, type, level);
                CorsUtil.sendJson(exchange, 200, JsonUtil.success(section));
            } else {
                CorsUtil.sendJson(exchange, 200, JsonUtil.success(json));
            }
        } catch (Exception e) {
            CorsUtil.sendJson(exchange, 500, JsonUtil.error("Failed to load questions: " + e.getMessage()));
        }
    }

    private String extractParam(String query, String key) {
        if (query == null) return null;
        for (String part : query.split("&")) {
            String[] kv = part.split("=", 2);
            if (kv.length == 2 && kv[0].equals(key)) return kv[1];
        }
        return null;
    }

    private String extractJsonArray(String json, String type, String levelStr) {
        // Find the top-level key matching type
        String search = "\"" + type + "\"";
        int idx = json.indexOf(search);
        if (idx < 0) return "[]";
        idx = json.indexOf("[", idx);
        if (idx < 0) return "[]";

        // Find matching bracket
        int depth = 0, start = idx;
        for (int i = idx; i < json.length(); i++) {
            if (json.charAt(i) == '[') depth++;
            else if (json.charAt(i) == ']') {
                depth--;
                if (depth == 0) { return json.substring(start, i + 1); }
            }
        }
        return "[]";
    }
}
