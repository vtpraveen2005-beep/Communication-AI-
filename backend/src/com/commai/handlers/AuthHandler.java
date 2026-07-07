package com.commai.handlers;

import com.commai.auth.*;
import com.commai.util.JsonUtil;
import com.sun.net.httpserver.*;

import java.io.*;
import java.nio.charset.StandardCharsets;

/**
 * AuthHandler.java — Handles all /api/auth/* routes
 *
 * POST /api/auth/register  { username, email, password }
 * POST /api/auth/login     { email, password }
 * POST /api/auth/logout    (requires Authorization header)
 * GET  /api/auth/me        (requires Authorization header)
 */
public class AuthHandler implements HttpHandler {

    @Override
    public void handle(HttpExchange ex) throws IOException {
        // CORS
        ex.getResponseHeaders().add("Access-Control-Allow-Origin", "*");
        ex.getResponseHeaders().add("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        ex.getResponseHeaders().add("Access-Control-Allow-Headers", "Content-Type, Authorization");
        if ("OPTIONS".equals(ex.getRequestMethod())) { ex.sendResponseHeaders(204, -1); return; }

        String path   = ex.getRequestURI().getPath();
        String method = ex.getRequestMethod();

        try {
            if (path.endsWith("/register") && "POST".equals(method)) {
                handleRegister(ex);
            } else if (path.endsWith("/login") && "POST".equals(method)) {
                handleLogin(ex);
            } else if (path.endsWith("/logout") && "POST".equals(method)) {
                handleLogout(ex);
            } else if (path.endsWith("/me") && "GET".equals(method)) {
                handleMe(ex);
            } else {
                sendJson(ex, 404, "{\"status\":\"error\",\"message\":\"Not found\"}");
            }
        } catch (Exception e) {
            System.err.println("[AuthHandler] Error: " + e.getMessage());
            sendJson(ex, 500, "{\"status\":\"error\",\"message\":\"Server error\"}");
        }
    }

    /* ── Register ─────────────────────────────────────────────── */
    private void handleRegister(HttpExchange ex) throws IOException {
        String body   = new String(ex.getRequestBody().readAllBytes(), StandardCharsets.UTF_8);
        String name   = JsonUtil.getString(body, "username");
        String email  = JsonUtil.getString(body, "email");
        String pass   = JsonUtil.getString(body, "password");

        UserStore.AuthResult result = UserStore.register(name, email, pass);
        if (!result.success) {
            sendJson(ex, 400, "{\"status\":\"error\",\"message\":" + jsonStr(result.message) + "}");
            return;
        }
        String token = SessionManager.createSession(result.user.email);
        sendJson(ex, 200, "{\"status\":\"ok\",\"token\":" + jsonStr(token)
            + ",\"user\":" + userJson(result.user) + "}");
    }

    /* ── Login ────────────────────────────────────────────────── */
    private void handleLogin(HttpExchange ex) throws IOException {
        String body  = new String(ex.getRequestBody().readAllBytes(), StandardCharsets.UTF_8);
        String email = JsonUtil.getString(body, "email");
        String pass  = JsonUtil.getString(body, "password");

        UserStore.AuthResult result = UserStore.login(email, pass);
        if (!result.success) {
            sendJson(ex, 401, "{\"status\":\"error\",\"message\":" + jsonStr(result.message) + "}");
            return;
        }
        String token = SessionManager.createSession(result.user.email);
        sendJson(ex, 200, "{\"status\":\"ok\",\"token\":" + jsonStr(token)
            + ",\"user\":" + userJson(result.user) + "}");
    }

    /* ── Logout ───────────────────────────────────────────────── */
    private void handleLogout(HttpExchange ex) throws IOException {
        String token = extractToken(ex);
        SessionManager.removeSession(token);
        sendJson(ex, 200, "{\"status\":\"ok\",\"message\":\"Logged out.\"}");
    }

    /* ── Me ───────────────────────────────────────────────────── */
    private void handleMe(HttpExchange ex) throws IOException {
        String token = extractToken(ex);
        String email = SessionManager.validateSession(token);
        if (email == null) {
            sendJson(ex, 401, "{\"status\":\"error\",\"message\":\"Unauthorized\"}");
            return;
        }
        User u = UserStore.findByEmail(email);
        if (u == null) {
            sendJson(ex, 404, "{\"status\":\"error\",\"message\":\"User not found\"}");
            return;
        }
        sendJson(ex, 200, "{\"status\":\"ok\",\"user\":" + userJson(u) + "}");
    }

    /* ── Helpers ──────────────────────────────────────────────── */
    private String extractToken(HttpExchange ex) {
        String auth = ex.getRequestHeaders().getFirst("Authorization");
        if (auth != null && auth.startsWith("Bearer ")) return auth.substring(7).trim();
        return null;
    }

    private String userJson(User u) {
        return "{\"username\":" + jsonStr(u.username)
            + ",\"email\":"    + jsonStr(u.email)
            + ",\"createdAt\":"+ jsonStr(u.createdAt)
            + ",\"assessmentCount\":" + u.assessmentCount + "}";
    }

    private String jsonStr(String s) {
        if (s == null) return "\"\"";
        return "\"" + s.replace("\\","\\\\").replace("\"","\\\"").replace("\n","\\n") + "\"";
    }

    private void sendJson(HttpExchange ex, int code, String json) throws IOException {
        byte[] bytes = json.getBytes(StandardCharsets.UTF_8);
        ex.getResponseHeaders().set("Content-Type", "application/json; charset=utf-8");
        ex.sendResponseHeaders(code, bytes.length);
        try (OutputStream os = ex.getResponseBody()) { os.write(bytes); }
    }
}
