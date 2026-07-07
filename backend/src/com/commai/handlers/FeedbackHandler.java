package com.commai.handlers;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.commai.engine.GeminiClient;
import com.commai.util.CorsUtil;
import com.commai.util.JsonUtil;
import java.io.*;

/**
 * FeedbackHandler.java — POST /api/feedback
 * Calls Gemini API to generate AI feedback on user responses.
 * Falls back to built-in heuristic feedback if API key is not configured.
 *
 * Request body:
 * {
 *   "type": "written",
 *   "prompt": "Write a professional email...",
 *   "response": "User response text...",
 *   "scores": "{\"grammar\":4, \"structure\":3}"
 * }
 */
public class FeedbackHandler implements HttpHandler {

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
            String body     = CorsUtil.readBody(exchange);
            String type     = JsonUtil.getString(body, "type");
            String prompt   = JsonUtil.getString(body, "prompt");
            String response = JsonUtil.getString(body, "response");
            String scores   = JsonUtil.getString(body, "scores");

            String feedback;
            boolean aiPowered;

            if (GeminiClient.isConfigured()) {
                // Use Gemini API
                feedback = GeminiClient.getFeedback(type, prompt, response, scores);
                aiPowered = feedback != null;
                if (feedback == null) {
                    feedback = generateFallbackFeedback(type, response, scores);
                    aiPowered = false;
                }
            } else {
                // Fallback: built-in heuristic feedback
                feedback = generateFallbackFeedback(type, response, scores);
                aiPowered = false;
            }

            String result = new JsonUtil.Builder()
                .put("feedback", feedback)
                .put("aiPowered", aiPowered)
                .put("model", aiPowered ? "gemini-2.0-flash" : "built-in")
                .build();

            CorsUtil.sendJson(exchange, 200, JsonUtil.success(result));

        } catch (Exception e) {
            CorsUtil.sendJson(exchange, 500, JsonUtil.error("Feedback error: " + e.getMessage()));
        }
    }

    /** Built-in heuristic feedback generator */
    private String generateFallbackFeedback(String type, String response, String scoresJson) {
        int wordCount = response.trim().isEmpty() ? 0 : response.trim().split("\\s+").length;

        StringBuilder fb = new StringBuilder();

        // Overall impression based on word count and generic analysis
        if (wordCount > 100) {
            fb.append("Great job providing a detailed response! Your answer shows depth and thoughtfulness. ");
        } else if (wordCount > 50) {
            fb.append("Good effort on your response. You covered the key points well. ");
        } else if (wordCount > 20) {
            fb.append("Your response covers some ground, but could benefit from more detail and examples. ");
        } else {
            fb.append("Your response is quite brief. Try to expand your thoughts with examples and reasoning. ");
        }

        fb.append("\\n\\n");

        // Type-specific feedback
        switch (type) {
            case "oral" -> {
                fb.append("For verbal communication, focus on speaking clearly and at a steady pace. ");
                fb.append("Use transition words like 'however', 'furthermore', and 'in conclusion' to structure your speech. ");
                fb.append("Practice the PREP method: Point, Reason, Example, Point.");
            }
            case "written" -> {
                fb.append("For written communication, ensure your response has a clear introduction, body, and conclusion. ");
                fb.append("Vary your sentence length for better readability and use precise vocabulary. ");
                fb.append("Remember to proofread for grammar and tone consistency.");
            }
            case "listening" -> {
                fb.append("Active listening improves with practice. Try the SQ3R method: Survey, Question, Read, Recite, Review. ");
                fb.append("Take mental notes about key facts, names, dates, and action items during conversations.");
            }
            case "presentation" -> {
                fb.append("Strong presentations follow the 'Tell them' rule: tell them what you'll say, say it, then tell them what you said. ");
                fb.append("Each slide should have a single clear message. End with a compelling call to action.");
            }
            default -> {
                fb.append("Keep practicing to improve your communication skills across all dimensions.");
            }
        }

        return fb.toString();
    }
}
