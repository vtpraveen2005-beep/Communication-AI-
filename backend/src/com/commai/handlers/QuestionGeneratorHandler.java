package com.commai.handlers;

import com.commai.auth.SessionManager;
import com.commai.engine.GeminiClient;
import com.commai.util.JsonUtil;
import com.sun.net.httpserver.*;

import java.io.*;
import java.nio.charset.StandardCharsets;

/**
 * QuestionGeneratorHandler.java
 * POST /api/generate-question  { type, level }
 *
 * Uses Groq (Llama 3.3) to generate a unique, fresh question JSON every call.
 * Returns a question in the same format as questions.json so the frontend
 * can drop it in seamlessly.
 */
public class QuestionGeneratorHandler implements HttpHandler {

    @Override
    public void handle(HttpExchange ex) throws IOException {
        ex.getResponseHeaders().add("Access-Control-Allow-Origin", "*");
        ex.getResponseHeaders().add("Access-Control-Allow-Methods", "POST, OPTIONS");
        ex.getResponseHeaders().add("Access-Control-Allow-Headers", "Content-Type, Authorization");
        if ("OPTIONS".equals(ex.getRequestMethod())) { ex.sendResponseHeaders(204, -1); return; }

        if (!"POST".equals(ex.getRequestMethod())) {
            sendJson(ex, 405, err("Method not allowed")); return;
        }

        // Auth check
        String token = extractToken(ex);
        if (SessionManager.validateSession(token) == null) {
            sendJson(ex, 401, err("Unauthorized")); return;
        }

        String body  = new String(ex.getRequestBody().readAllBytes(), StandardCharsets.UTF_8);
        String type  = JsonUtil.getString(body, "type");
        String level = JsonUtil.getString(body, "level");
        if (type == null || type.isBlank()) type = "written";
        int lvl = 1;
        try { lvl = Integer.parseInt(level); } catch (Exception ignored) {}

        String question = generateQuestion(type, lvl);
        if (question == null) {
            // Fallback to a canned question if Groq fails
            question = fallback(type, lvl);
        }

        sendJson(ex, 200, "{\"status\":\"ok\",\"data\":" + question + "}");
    }

    /* ── Groq prompt ─────────────────────────────────────────── */
    private String generateQuestion(String type, int level) {
        String levelName = level == 1 ? "beginner" : level == 2 ? "intermediate" : "advanced";
        String prompt    = buildSystemPrompt(type, levelName);

        String raw = GeminiClient.generateQuestion(prompt);
        if (raw == null) return null;

        // Extract JSON block from the response (Groq may wrap it in markdown)
        String extracted = extractJsonBlock(raw);
        if (extracted == null) return null;

        // Inject level field if missing
        if (!extracted.contains("\"level\"")) {
            extracted = extracted.substring(0, extracted.lastIndexOf('}'))
                      + ",\"level\":" + level + "}";
        }
        System.out.println("[QuestionGenerator] Generated " + type + " L" + level);
        return extracted;
    }

    private String buildSystemPrompt(String type, String level) {
        return switch (type) {
            case "oral" -> """
                Generate a unique verbal communication exercise for a %s level student.
                Return ONLY valid JSON with NO markdown, no explanation, just the JSON object.
                Format:
                {
                  "id": "oral_<random 4-digit number>",
                  "type": "oral",
                  "level": <1|2|3>,
                  "duration": <60-120 seconds>,
                  "prompt": "<a specific, interesting, real-world speaking prompt — NOT generic>",
                  "criteria": ["clarity","fluency","vocabulary","confidence","structure"],
                  "keywords": ["<5-8 topic-relevant words>"]
                }
                Make the prompt unique, specific and engaging. Do NOT use placeholders.
                """.formatted(level);

            case "written" -> """
                Generate a unique timed writing exercise for a %s level student.
                Return ONLY valid JSON — no markdown, no explanation, just the JSON object.
                Format:
                {
                  "id": "written_<random 4-digit number>",
                  "type": "written",
                  "level": <1|2|3>,
                  "duration": <300-600 seconds>,
                  "title": "<short prompt type name, e.g. 'Business Email' or 'Persuasive Essay'>",
                  "prompt": "<specific, interesting writing task — NOT generic>",
                  "minWords": <50-100>,
                  "maxWords": <150-300>,
                  "expectedElements": ["<3-5 structural elements expected>"],
                  "sampleKeywords": ["<5 relevant vocabulary words>"],
                  "criteria": ["grammar","structure","tone","coherence","vocabulary"]
                }
                Make the prompt unique and relevant to modern professional life.
                """.formatted(level);

            case "listening" -> """
                Generate a unique active listening exercise for a %s level student.
                Return ONLY valid JSON — no markdown, no explanation, just the JSON object.
                Format:
                {
                  "id": "listening_<random 4-digit number>",
                  "type": "listening",
                  "level": <1|2|3>,
                  "scenario": "<short scenario title>",
                  "content": "<a realistic workplace/social scenario passage, 100-150 words>",
                  "questions": [
                    { "q": "<comprehension question>", "options": ["A","B","C","D"], "answer": <0-3> },
                    { "q": "<question>", "options": ["A","B","C","D"], "answer": <0-3> },
                    { "q": "<question>", "options": ["A","B","C","D"], "answer": <0-3> },
                    { "q": "<question>", "options": ["A","B","C","D"], "answer": <0-3> },
                    { "q": "<question>", "options": ["A","B","C","D"], "answer": <0-3> }
                  ],
                  "criteria": ["comprehension","retention","accuracy","critical-thinking"],
                  "duration": 120
                }
                Make the passage realistic and the questions test genuine comprehension.
                """.formatted(level);

            case "presentation" -> """
                Generate a unique presentation skills exercise for a %s level student.
                Return ONLY valid JSON — no markdown, no explanation, just the JSON object.
                Format:
                {
                  "id": "presentation_<random 4-digit number>",
                  "type": "presentation",
                  "level": <1|2|3>,
                  "context": "<realistic presentation scenario — e.g. product pitch, project update>",
                  "slides": [
                    { "label": "Introduction", "prompt": "<what to cover>", "placeholder": "<example>", "minWords": 40 },
                    { "label": "Main Content", "prompt": "<what to cover>", "placeholder": "<example>", "minWords": 80 },
                    { "label": "Conclusion",   "prompt": "<what to cover>", "placeholder": "<example>", "minWords": 40 }
                  ],
                  "criteria": ["structure","clarity","persuasion","vocabulary","completeness"]
                }
                Make the scenario specific and modern (tech, business, social impact).
                """.formatted(level);

            default -> buildSystemPrompt("written", level);
        };
    }

    /* ── Fallback question (if Groq unavailable) ─────────────── */
    private String fallback(String type, int level) {
        return switch (type) {
            case "oral" -> "{\"id\":\"oral_fallback\",\"type\":\"oral\",\"level\":" + level
                + ",\"duration\":90,\"prompt\":\"Describe your ideal working environment and the qualities that make a team productive.\""
                + ",\"criteria\":[\"clarity\",\"fluency\",\"vocabulary\",\"confidence\",\"structure\"]"
                + ",\"keywords\":[\"collaboration\",\"productivity\",\"communication\",\"environment\"]}";
            case "listening" -> "{\"id\":\"listen_fallback\",\"type\":\"listening\",\"level\":" + level
                + ",\"scenario\":\"Team Meeting\""
                + ",\"content\":\"During the quarterly review, Sarah presented sales data showing a 12% increase in Q3. The team discussed three key drivers: improved customer onboarding, a new referral program, and better product documentation. However, the support team raised concerns about response times, which had increased by 18% over the same period. The manager suggested a dedicated support sprint in Q4 and asked for volunteers to lead it. David and Priya agreed to co-lead the initiative.\""
                + ",\"questions\":["
                + "{\"q\":\"By what percentage did sales increase in Q3?\",\"options\":[\"8%\",\"10%\",\"12%\",\"15%\"],\"answer\":2},"
                + "{\"q\":\"How many key drivers of growth were mentioned?\",\"options\":[\"2\",\"3\",\"4\",\"5\"],\"answer\":1},"
                + "{\"q\":\"What increased by 18%?\",\"options\":[\"Sales\",\"Support response times\",\"Referrals\",\"Documentation\"],\"answer\":1},"
                + "{\"q\":\"What was proposed for Q4?\",\"options\":[\"Product launch\",\"A dedicated support sprint\",\"A new referral program\",\"Budget cuts\"],\"answer\":1},"
                + "{\"q\":\"Who agreed to co-lead the Q4 initiative?\",\"options\":[\"Sarah and David\",\"David and Priya\",\"Sarah and Priya\",\"The manager and David\"],\"answer\":1}"
                + "],\"criteria\":[\"comprehension\",\"retention\",\"accuracy\"],\"duration\":120}";
            default -> "{\"id\":\"written_fallback\",\"type\":\"written\",\"level\":" + level
                + ",\"duration\":480,\"title\":\"Professional Email\""
                + ",\"prompt\":\"Write a professional email to your team announcing a schedule change for next week's product demo. Include the new date, reason for the change, and any preparation required.\""
                + ",\"minWords\":80,\"maxWords\":200"
                + ",\"expectedElements\":[\"subject line\",\"greeting\",\"reason\",\"new details\",\"call to action\"]"
                + ",\"sampleKeywords\":[\"rescheduled\",\"confirm\",\"preparation\",\"agenda\",\"attendance\"]"
                + ",\"criteria\":[\"grammar\",\"structure\",\"tone\",\"coherence\",\"formality\"]}";
        };
    }

    /* ── Helpers ──────────────────────────────────────────────── */
    private String extractJsonBlock(String raw) {
        // Try to find a JSON object in the response (Groq may add markdown fences)
        int start = raw.indexOf('{');
        int end   = raw.lastIndexOf('}');
        if (start < 0 || end < 0 || end <= start) return null;
        return raw.substring(start, end + 1);
    }

    private String extractToken(HttpExchange ex) {
        String auth = ex.getRequestHeaders().getFirst("Authorization");
        if (auth != null && auth.startsWith("Bearer ")) return auth.substring(7).trim();
        return null;
    }

    private String err(String msg) {
        return "{\"status\":\"error\",\"message\":\"" + msg + "\"}";
    }

    private void sendJson(HttpExchange ex, int code, String json) throws IOException {
        byte[] bytes = json.getBytes(StandardCharsets.UTF_8);
        ex.getResponseHeaders().set("Content-Type", "application/json; charset=utf-8");
        ex.sendResponseHeaders(code, bytes.length);
        try (OutputStream os = ex.getResponseBody()) { os.write(bytes); }
    }
}
