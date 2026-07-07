package com.commai.engine;

import java.io.*;
import java.net.*;
import java.nio.charset.StandardCharsets;

/**
 * GeminiClient.java — Groq API integration (OpenAI-compatible)
 * Uses Groq's ultra-fast inference API with Llama 3.3 model.
 * Endpoint: https://api.groq.com/openai/v1/chat/completions
 */
public class GeminiClient {

    // ── Groq API Configuration ────────────────────────────────────
    private static final String API_KEY = System.getenv("GROQ_API_KEY") != null ? System.getenv("GROQ_API_KEY") : "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";
    private static final String MODEL    = "llama-3.3-70b-versatile";
    private static final String ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";

    public static boolean isConfigured() {
        return API_KEY != null && !API_KEY.isBlank() && API_KEY.startsWith("gsk_");
    }

    public static String getProviderName() {
        return "Groq (" + MODEL + ")";
    }

    /**
     * Calls Groq API and returns AI-generated feedback for a communication response.
     *
     * @param assessmentType  e.g. "oral", "written", "listening", "presentation"
     * @param prompt          The exercise prompt shown to the user
     * @param userResponse    The user's response to evaluate
     * @param criteriaScores  JSON string of scores e.g. {"clarity": 3.5, "fluency": 4.0}
     * @return AI feedback string, or null on failure
     */
    public static String getFeedback(String assessmentType, String prompt,
                                     String userResponse, String criteriaScores) {
        if (!isConfigured()) return null;

        String userMessage = buildPrompt(assessmentType, prompt, userResponse, criteriaScores);

        try {
            // Build OpenAI-compatible request body
            String requestBody = "{"
                + "\"model\":\"" + MODEL + "\","
                + "\"messages\":["
                + "{\"role\":\"system\",\"content\":" + jsonString(
                    "You are an expert communication coach. Give structured, encouraging, actionable feedback. "
                  + "Be specific, warm, and professional. Keep responses under 160 words.")
                + "},"
                + "{\"role\":\"user\",\"content\":" + jsonString(userMessage) + "}"
                + "],"
                + "\"temperature\":0.7,"
                + "\"max_tokens\":512,"
                + "\"top_p\":1,"
                + "\"stream\":false"
                + "}";

            URL url = URI.create(ENDPOINT).toURL();
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("POST");
            conn.setRequestProperty("Content-Type", "application/json");
            conn.setRequestProperty("Authorization", "Bearer " + API_KEY);
            conn.setDoOutput(true);
            conn.setConnectTimeout(12000);
            conn.setReadTimeout(20000);

            try (OutputStream os = conn.getOutputStream()) {
                os.write(requestBody.getBytes(StandardCharsets.UTF_8));
            }

            int code = conn.getResponseCode();
            InputStream is = (code < 400) ? conn.getInputStream() : conn.getErrorStream();
            String response = new String(is.readAllBytes(), StandardCharsets.UTF_8);

            if (code == 200) {
                String text = extractGroqText(response);
                System.out.println("[GroqClient] ✅ AI feedback generated (" + text.length() + " chars)");
                return text;
            } else {
                System.err.println("[GroqClient] API error " + code + ": " + response);
                return null;
            }

        } catch (Exception e) {
            System.err.println("[GroqClient] Request failed: " + e.getMessage());
            return null;
        }
    }

    /**
     * Generates a unique question JSON using Groq.
     * @param systemPrompt Full instruction prompt describing the desired JSON format and content.
     * @return Raw response string from Groq (may include markdown — caller strips it).
     */
    public static String generateQuestion(String systemPrompt) {
        if (!isConfigured()) return null;
        try {
            String requestBody = "{"
                + "\"model\":\"" + MODEL + "\","
                + "\"messages\":["
                + "{\"role\":\"system\",\"content\":" + jsonString(
                    "You are a professional communication trainer. Generate unique, realistic assessment questions. "
                  + "Return ONLY valid JSON with no markdown fences, no explanation, just the raw JSON object.")
                + "},"
                + "{\"role\":\"user\",\"content\":" + jsonString(systemPrompt) + "}"
                + "],"
                + "\"temperature\":0.9,"
                + "\"max_tokens\":1024,"
                + "\"top_p\":1,"
                + "\"stream\":false"
                + "}";

            URL url = URI.create(ENDPOINT).toURL();
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("POST");
            conn.setRequestProperty("Content-Type", "application/json");
            conn.setRequestProperty("Authorization", "Bearer " + API_KEY);
            conn.setDoOutput(true);
            conn.setConnectTimeout(15000);
            conn.setReadTimeout(25000);

            try (OutputStream os = conn.getOutputStream()) {
                os.write(requestBody.getBytes(StandardCharsets.UTF_8));
            }

            int code = conn.getResponseCode();
            InputStream is = (code < 400) ? conn.getInputStream() : conn.getErrorStream();
            String response = new String(is.readAllBytes(), StandardCharsets.UTF_8);

            if (code == 200) {
                String text = extractGroqText(response);
                System.out.println("[GroqClient] ✅ Question generated (" + text.length() + " chars)");
                return text;
            } else {
                System.err.println("[GroqClient] Question gen error " + code + ": " + response);
                return null;
            }
        } catch (Exception e) {
            System.err.println("[GroqClient] generateQuestion failed: " + e.getMessage());
            return null;
        }
    }

    // ── Prompt builder ────────────────────────────────────────────
    private static String buildPrompt(String type, String prompt, String response, String scores) {
        return "Evaluate this " + type + " communication exercise.\n\n"
            + "EXERCISE PROMPT:\n" + prompt + "\n\n"
            + "USER RESPONSE:\n" + response + "\n\n"
            + "SCORES (out of 5 per criterion):\n" + scores + "\n\n"
            + "Provide feedback in exactly 3 short paragraphs:\n"
            + "1. Overall impression (1-2 sentences, start positively)\n"
            + "2. Top strength — cite a specific phrase or detail from the response\n"
            + "3. Key improvement tip — one concrete, actionable step\n\n"
            + "Keep it under 160 words. Be warm, specific, and encouraging.";
    }

    // ── Extract content from Groq/OpenAI response JSON ───────────
    // Response format: {"choices":[{"message":{"content":"..."}}]}
    private static String extractGroqText(String json) {
        // Find "content": "..." inside choices[0].message
        String marker = "\"content\":";
        int idx = json.indexOf(marker);
        if (idx < 0) return "AI feedback unavailable.";
        idx += marker.length();
        while (idx < json.length() && (json.charAt(idx) == ' ' || json.charAt(idx) == '\n')) idx++;
        if (idx >= json.length() || json.charAt(idx) != '"') return "AI feedback unavailable.";
        idx++; // skip opening quote
        StringBuilder sb = new StringBuilder();
        while (idx < json.length()) {
            char c = json.charAt(idx);
            if (c == '\\' && idx + 1 < json.length()) {
                char next = json.charAt(idx + 1);
                switch (next) {
                    case '"'  -> { sb.append('"');  idx += 2; }
                    case 'n'  -> { sb.append('\n'); idx += 2; }
                    case 't'  -> { sb.append('\t'); idx += 2; }
                    case 'r'  -> { idx += 2; } // skip \r
                    case '\\' -> { sb.append('\\'); idx += 2; }
                    default   -> { sb.append(c); idx++; }
                }
            } else if (c == '"') {
                break; // end of string
            } else {
                sb.append(c); idx++;
            }
        }
        return sb.toString().trim();
    }

    private static String jsonString(String s) {
        return "\"" + s.replace("\\", "\\\\")
                       .replace("\"", "\\\"")
                       .replace("\n", "\\n")
                       .replace("\r", "\\r")
                       .replace("\t", "\\t") + "\"";
    }
}
