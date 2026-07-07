package com.commai.auth;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.*;

/**
 * UserStore.java — File-based user persistence using data/users.json
 * Pure Java, no external libraries.
 */
public class UserStore {

    private static Path dataFile;

    /** Called once at startup to set the data directory. */
    public static void init(String dataDir) {
        dataFile = Paths.get(dataDir, "users.json");
        if (!Files.exists(dataFile)) {
            try {
                Files.createDirectories(dataFile.getParent());
                Files.writeString(dataFile, "[]", StandardCharsets.UTF_8);
                System.out.println("[UserStore] Created " + dataFile);
            } catch (IOException e) {
                System.err.println("[UserStore] Could not create users.json: " + e.getMessage());
            }
        } else {
            System.out.println("[UserStore] Loaded users from " + dataFile);
        }
    }

    /* ── Public API ─────────────────────────────────────────────── */

    public static class AuthResult {
        public boolean success;
        public String  message;
        public User    user;
        public AuthResult(boolean ok, String msg, User u) { success=ok; message=msg; user=u; }
    }

    /** Register a new user. Returns AuthResult with success/error. */
    public static synchronized AuthResult register(String username, String email, String password) {
        if (username == null || username.isBlank()) return new AuthResult(false, "Username is required.", null);
        if (email    == null || email.isBlank())    return new AuthResult(false, "Email is required.", null);
        if (password == null || password.length() < 6) return new AuthResult(false, "Password must be at least 6 characters.", null);

        List<User> users = loadAll();
        for (User u : users) {
            if (u.email.equalsIgnoreCase(email.trim())) return new AuthResult(false, "An account with this email already exists.", null);
        }

        User newUser = new User(
            username.trim(),
            email.trim().toLowerCase(),
            sha256(password),
            Instant.now().toString()
        );
        users.add(newUser);
        saveAll(users);
        System.out.println("[UserStore] Registered: " + newUser.email);
        return new AuthResult(true, "Account created.", newUser);
    }

    /** Log in. Returns AuthResult with the user on success. */
    public static synchronized AuthResult login(String email, String password) {
        if (email == null || password == null) return new AuthResult(false, "Email and password required.", null);

        List<User> users = loadAll();
        String hash = sha256(password);
        for (User u : users) {
            if (u.email.equalsIgnoreCase(email.trim()) && u.passwordHash.equals(hash)) {
                System.out.println("[UserStore] Login OK: " + u.email);
                return new AuthResult(true, "Login successful.", u);
            }
        }
        return new AuthResult(false, "Invalid email or password.", null);
    }

    /** Find user by email. Returns null if not found. */
    public static synchronized User findByEmail(String email) {
        if (email == null) return null;
        for (User u : loadAll()) {
            if (u.email.equalsIgnoreCase(email.trim())) return u;
        }
        return null;
    }

    /** Increment assessment count for a user. */
    public static synchronized void incrementAssessmentCount(String email) {
        List<User> users = loadAll();
        for (User u : users) {
            if (u.email.equalsIgnoreCase(email)) {
                u.assessmentCount++;
                break;
            }
        }
        saveAll(users);
    }

    /* ── File I/O ────────────────────────────────────────────────── */

    private static List<User> loadAll() {
        if (dataFile == null) return new ArrayList<>();
        try {
            String content = Files.readString(dataFile, StandardCharsets.UTF_8).trim();
            if (content.isEmpty() || content.equals("[]")) return new ArrayList<>();
            return parseUserArray(content);
        } catch (IOException e) {
            System.err.println("[UserStore] Read error: " + e.getMessage());
            return new ArrayList<>();
        }
    }

    private static void saveAll(List<User> users) {
        if (dataFile == null) return;
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < users.size(); i++) {
            sb.append(users.get(i).toJson());
            if (i < users.size() - 1) sb.append(",");
        }
        sb.append("]");
        try {
            Files.writeString(dataFile, sb.toString(), StandardCharsets.UTF_8);
        } catch (IOException e) {
            System.err.println("[UserStore] Write error: " + e.getMessage());
        }
    }

    /** Very simple JSON array parser — splits on },{  */
    private static List<User> parseUserArray(String json) {
        List<User> list = new ArrayList<>();
        // Remove outer [ ]
        json = json.trim();
        if (json.startsWith("[")) json = json.substring(1);
        if (json.endsWith("]"))   json = json.substring(0, json.length() - 1);
        // Split objects by looking for "},{" boundaries
        List<String> objects = splitObjects(json.trim());
        for (String obj : objects) {
            obj = obj.trim();
            if (!obj.isEmpty()) {
                if (!obj.startsWith("{")) obj = "{" + obj;
                if (!obj.endsWith("}"))   obj = obj + "}";
                list.add(User.fromJson(obj));
            }
        }
        return list;
    }

    /** Split a comma-separated list of JSON objects at the top level */
    private static List<String> splitObjects(String s) {
        List<String> result = new ArrayList<>();
        int depth = 0, start = 0;
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            if (c == '{') depth++;
            else if (c == '}') { depth--; if (depth == 0) { result.add(s.substring(start, i + 1)); start = i + 2; } }
        }
        return result;
    }

    /* ── Hashing ────────────────────────────────────────────────── */

    private static String sha256(String input) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] hash = md.digest(input.getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder();
            for (byte b : hash) hex.append(String.format("%02x", b));
            return hex.toString();
        } catch (Exception e) {
            return input; // fallback (never happens for SHA-256)
        }
    }
}
