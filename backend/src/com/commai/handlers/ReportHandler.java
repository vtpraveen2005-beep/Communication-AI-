package com.commai.handlers;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.commai.util.CorsUtil;
import com.commai.util.JsonUtil;
import java.io.*;
import java.nio.file.*;

/**
 * ReportHandler.java — POST /api/report
 * Generates a comprehensive assessment report from scores.
 *
 * Request body:
 * {
 *   "type": "written",
 *   "level": 1,
 *   "scores": [{"clarity":4,"grammar":3}, ...],
 *   "duration": 120000
 * }
 */
public class ReportHandler implements HttpHandler {

    private static final Path RUBRICS_FILE = Path.of(
        System.getProperty("user.dir")).resolve("data/rubrics.json");

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        if ("OPTIONS".equals(exchange.getRequestMethod())) {
            CorsUtil.handleOptions(exchange); return;
        }

        if (!"POST".equals(exchange.getRequestMethod())) {
            CorsUtil.sendJson(exchange, 405, JsonUtil.error("Method not allowed"));
            return;
        }

        try {
            String body    = CorsUtil.readBody(exchange);
            String type    = JsonUtil.getString(body, "type");
            int level      = JsonUtil.getInt(body, "level", 1);
            double overall = JsonUtil.getDouble(body, "overall", 0);

            // Determine level label
            String levelLabel;
            String emoji;
            String levelColor;

            if (overall >= 85) {
                levelLabel = "Excellent Communicator";
                emoji = "\\ud83c\\udfc6"; levelColor = "#10B981";
            } else if (overall >= 70) {
                levelLabel = "Proficient Communicator";
                emoji = "\\u2b50"; levelColor = "#3B82F6";
            } else if (overall >= 55) {
                levelLabel = "Developing Communicator";
                emoji = "\\ud83d\\udcc8"; levelColor = "#F59E0B";
            } else {
                levelLabel = "Beginner Communicator";
                emoji = "\\ud83d\\udcaa"; levelColor = "#EF4444";
            }

            // Load rubrics for recommendations
            String rubrics = "{}";
            try { rubrics = Files.readString(RUBRICS_FILE); } catch (Exception e) {}

            String result = new JsonUtil.Builder()
                .put("type", type)
                .put("level", level)
                .put("overall", overall)
                .put("levelLabel", levelLabel)
                .put("levelColor", levelColor)
                .put("emoji", emoji)
                .putRaw("rubrics", rubrics)
                .build();

            CorsUtil.sendJson(exchange, 200, JsonUtil.success(result));

        } catch (Exception e) {
            CorsUtil.sendJson(exchange, 500, JsonUtil.error("Report error: " + e.getMessage()));
        }
    }
}
