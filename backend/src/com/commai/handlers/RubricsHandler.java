package com.commai.handlers;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.commai.util.CorsUtil;
import com.commai.util.JsonUtil;
import java.io.*;
import java.nio.file.*;

/**
 * RubricsHandler.java — GET /api/rubrics
 * Returns the scoring rubrics data
 */
public class RubricsHandler implements HttpHandler {

    private static final Path DATA_FILE = Path.of(
        System.getProperty("user.dir")).resolve("data/rubrics.json");

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        if ("OPTIONS".equals(exchange.getRequestMethod())) {
            CorsUtil.handleOptions(exchange); return;
        }
        try {
            String json = Files.readString(DATA_FILE);
            CorsUtil.sendJson(exchange, 200, JsonUtil.success(json));
        } catch (Exception e) {
            CorsUtil.sendJson(exchange, 500, JsonUtil.error("Failed to load rubrics: " + e.getMessage()));
        }
    }
}
