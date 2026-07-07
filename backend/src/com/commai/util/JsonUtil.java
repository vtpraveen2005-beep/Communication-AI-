package com.commai.util;

/**
 * JsonUtil.java — Lightweight JSON builder and parser
 * No external libraries required.
 */
public class JsonUtil {

    // ── Simple JSON value extractor ──────────────────────────────
    public static String getString(String json, String key) {
        String search = "\"" + key + "\"";
        int idx = json.indexOf(search);
        if (idx < 0) return "";
        idx += search.length();
        // skip whitespace and colon
        while (idx < json.length() && (json.charAt(idx) == ' ' || json.charAt(idx) == ':')) idx++;
        if (idx >= json.length()) return "";
        char first = json.charAt(idx);
        if (first == '"') {
            // string value
            int start = idx + 1;
            int end = json.indexOf('"', start);
            while (end > 0 && json.charAt(end - 1) == '\\') end = json.indexOf('"', end + 1);
            return end > 0 ? json.substring(start, end) : "";
        } else {
            // number/boolean
            int start = idx;
            int end = start;
            while (end < json.length() && json.charAt(end) != ',' && json.charAt(end) != '}' && json.charAt(end) != ']') end++;
            return json.substring(start, end).trim();
        }
    }

    public static int getInt(String json, String key, int defaultVal) {
        try { return Integer.parseInt(getString(json, key)); }
        catch (Exception e) { return defaultVal; }
    }

    public static double getDouble(String json, String key, double defaultVal) {
        try { return Double.parseDouble(getString(json, key)); }
        catch (Exception e) { return defaultVal; }
    }

    // ── Simple JSON object builder ───────────────────────────────
    public static class Builder {
        private final StringBuilder sb = new StringBuilder("{");
        private boolean first = true;

        private void comma() {
            if (!first) sb.append(",");
            first = false;
        }

        public Builder put(String key, String value) {
            comma();
            sb.append("\"").append(escape(key)).append("\":\"").append(escape(value)).append("\"");
            return this;
        }

        public Builder put(String key, int value) {
            comma();
            sb.append("\"").append(escape(key)).append("\":").append(value);
            return this;
        }

        public Builder put(String key, double value) {
            comma();
            sb.append("\"").append(escape(key)).append("\":").append(String.format("%.2f", value));
            return this;
        }

        public Builder put(String key, boolean value) {
            comma();
            sb.append("\"").append(escape(key)).append("\":").append(value);
            return this;
        }

        public Builder putRaw(String key, String rawValue) {
            comma();
            sb.append("\"").append(escape(key)).append("\":").append(rawValue);
            return this;
        }

        public String build() {
            return sb.toString() + "}";
        }
    }

    // ── Array builder ────────────────────────────────────────────
    public static class ArrayBuilder {
        private final StringBuilder sb = new StringBuilder("[");
        private boolean first = true;

        public ArrayBuilder add(String value) {
            if (!first) sb.append(",");
            sb.append("\"").append(escape(value)).append("\"");
            first = false;
            return this;
        }

        public ArrayBuilder addRaw(String raw) {
            if (!first) sb.append(",");
            sb.append(raw);
            first = false;
            return this;
        }

        public String build() { return sb.toString() + "]"; }
    }

    // ── Error/Success wrappers ───────────────────────────────────
    public static String success(String data) {
        return new Builder().put("status", "ok").putRaw("data", data).build();
    }

    public static String error(String message) {
        return new Builder().put("status", "error").put("message", message).build();
    }

    // ── Escape special characters ────────────────────────────────
    public static String escape(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r")
                .replace("\t", "\\t");
    }
}
