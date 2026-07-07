package com.commai.auth;

/**
 * User.java — Simple user model
 */
public class User {
    public String username;
    public String email;
    public String passwordHash;   // SHA-256 hex
    public String createdAt;
    public int    assessmentCount;

    public User() {}

    public User(String username, String email, String passwordHash, String createdAt) {
        this.username        = username;
        this.email           = email;
        this.passwordHash    = passwordHash;
        this.createdAt       = createdAt;
        this.assessmentCount = 0;
    }

    /** Serialise to one-line JSON (no external libraries) */
    public String toJson() {
        return "{"
            + "\"username\":"        + jsonStr(username)        + ","
            + "\"email\":"           + jsonStr(email)           + ","
            + "\"passwordHash\":"    + jsonStr(passwordHash)    + ","
            + "\"createdAt\":"       + jsonStr(createdAt)       + ","
            + "\"assessmentCount\":" + assessmentCount
            + "}";
    }

    /** Parse from a simple JSON object string (no nested objects) */
    public static User fromJson(String json) {
        User u = new User();
        u.username        = extractStr(json, "username");
        u.email           = extractStr(json, "email");
        u.passwordHash    = extractStr(json, "passwordHash");
        u.createdAt       = extractStr(json, "createdAt");
        String ac         = extractStr(json, "assessmentCount");
        try { u.assessmentCount = Integer.parseInt(ac); } catch (Exception e) { u.assessmentCount = 0; }
        return u;
    }

    private static String extractStr(String json, String key) {
        String search = "\"" + key + "\":";
        int idx = json.indexOf(search);
        if (idx < 0) return "";
        idx += search.length();
        while (idx < json.length() && json.charAt(idx) == ' ') idx++;
        if (idx >= json.length()) return "";
        // Number value (no quotes)
        if (json.charAt(idx) != '"') {
            int end = idx;
            while (end < json.length() && json.charAt(end) != ',' && json.charAt(end) != '}') end++;
            return json.substring(idx, end).trim();
        }
        // String value
        idx++; // skip opening quote
        StringBuilder sb = new StringBuilder();
        while (idx < json.length()) {
            char c = json.charAt(idx);
            if (c == '\\' && idx + 1 < json.length()) {
                char next = json.charAt(idx + 1);
                if (next == '"')  { sb.append('"');  idx += 2; }
                else if (next == 'n')  { sb.append('\n'); idx += 2; }
                else if (next == '\\') { sb.append('\\'); idx += 2; }
                else { sb.append(c); idx++; }
            } else if (c == '"') {
                break;
            } else {
                sb.append(c); idx++;
            }
        }
        return sb.toString();
    }

    private static String jsonStr(String s) {
        if (s == null) return "\"\"";
        return "\"" + s.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", "\\n") + "\"";
    }
}
