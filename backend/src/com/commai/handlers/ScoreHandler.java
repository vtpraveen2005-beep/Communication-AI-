package com.commai.handlers;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.commai.engine.ScoringEngine;
import com.commai.util.CorsUtil;
import com.commai.util.JsonUtil;
import java.io.*;
import java.util.*;

/**
 * ScoreHandler.java — POST /api/score
 * Receives a user response and returns NLP-based scores.
 *
 * Request body:
 * {
 *   "type": "written",
 *   "text": "User response text...",
 *   "criteria": ["grammar","structure","tone","clarity","completeness"],
 *   "keywords": ["request","leave","emergency"]
 * }
 *
 * For listening:
 * {
 *   "type": "listening",
 *   "correct": 4,
 *   "total": 5
 * }
 */
public class ScoreHandler implements HttpHandler {

    private final ScoringEngine engine = new ScoringEngine();

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
            String body = CorsUtil.readBody(exchange);
            String type = JsonUtil.getString(body, "type");

            Map<String, Double> scores;

            if ("listening".equals(type)) {
                int correct = JsonUtil.getInt(body, "correct", 0);
                int total   = JsonUtil.getInt(body, "total", 5);
                scores = engine.scoreListening(correct, total);
            } else {
                String text     = JsonUtil.getString(body, "text");
                List<String> criteria = extractArray(body, "criteria");
                List<String> keywords = extractArray(body, "keywords");

                if (criteria.isEmpty()) {
                    criteria = List.of("clarity", "structure", "vocabulary", "grammar", "coherence");
                }
                scores = engine.score(type, text, criteria, keywords);
            }

            // Build scores JSON
            JsonUtil.Builder sb = new JsonUtil.Builder();
            for (var entry : scores.entrySet()) {
                sb.put(entry.getKey(), Math.round(entry.getValue() * 10) / 10.0);
            }

            // Compute average
            double avg = scores.values().stream().mapToDouble(d -> d).average().orElse(0);
            double overall = Math.round(avg * 20); // percent

            String result = new JsonUtil.Builder()
                .putRaw("scores", sb.build())
                .put("overall", overall)
                .put("average", Math.round(avg * 10) / 10.0)
                .build();

            CorsUtil.sendJson(exchange, 200, JsonUtil.success(result));

        } catch (Exception e) {
            CorsUtil.sendJson(exchange, 500, JsonUtil.error("Scoring error: " + e.getMessage()));
        }
    }

    /** Extract a JSON array of strings by key (simple parser) */
    private List<String> extractArray(String json, String key) {
        List<String> list = new ArrayList<>();
        String search = "\"" + key + "\"";
        int idx = json.indexOf(search);
        if (idx < 0) return list;
        idx = json.indexOf("[", idx);
        if (idx < 0) return list;
        int end = json.indexOf("]", idx);
        if (end < 0) return list;
        String arr = json.substring(idx + 1, end);
        for (String s : arr.split(",")) {
            String t = s.trim().replaceAll("\"", "");
            if (!t.isEmpty()) list.add(t);
        }
        return list;
    }
}
