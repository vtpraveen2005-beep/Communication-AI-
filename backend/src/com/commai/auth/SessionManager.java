package com.commai.auth;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * SessionManager.java — In-memory session token store
 * Tokens are UUID strings. Maps token → email.
 */
public class SessionManager {

    // token → email
    private static final Map<String, String> sessions = new ConcurrentHashMap<>();

    /** Create a new session for the given email. Returns the token. */
    public static String createSession(String email) {
        String token = UUID.randomUUID().toString().replace("-", "");
        sessions.put(token, email);
        return token;
    }

    /**
     * Validate a token. Returns the email of the logged-in user,
     * or null if the token is invalid / not found.
     */
    public static String validateSession(String token) {
        if (token == null || token.isBlank()) return null;
        return sessions.get(token.trim());
    }

    /** Remove a session (logout). */
    public static void removeSession(String token) {
        if (token != null) sessions.remove(token.trim());
    }

    /** Number of active sessions (for health endpoint). */
    public static int activeCount() { return sessions.size(); }
}
