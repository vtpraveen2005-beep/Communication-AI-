package com.commai.engine;

import java.util.*;

/**
 * ScoringEngine.java — Java NLP-based communication scoring engine
 * Evaluates text responses across multiple criteria using linguistic heuristics.
 */
public class ScoringEngine {

    // ── Master score dispatcher ──────────────────────────────────
    public Map<String, Double> score(String type, String text, List<String> criteria, List<String> keywords) {
        Map<String, Double> scores = new LinkedHashMap<>();
        if (text == null || text.trim().length() < 5) {
            for (String c : criteria) scores.put(c, 1.0);
            return scores;
        }

        String[] words     = text.trim().split("\\s+");
        String[] sentences = text.split("[.!?]+");
        String lower       = text.toLowerCase();

        // Relevance check: heavily penalize answers that miss all keywords
        double relevanceMultiplier = 1.0;
        if (keywords != null && !keywords.isEmpty()) {
            long found = keywords.stream().filter(kw -> lower.contains(kw.toLowerCase())).count();
            double keywordRatio = (double) found / keywords.size();
            if (found == 0) relevanceMultiplier = 0.3;
            else if (keywordRatio < 0.3) relevanceMultiplier = 0.6;
            else if (keywordRatio < 0.6) relevanceMultiplier = 0.85;
        }

        for (String criterion : criteria) {
            double val = switch (criterion) {
                case "clarity"          -> scoreClarity(sentences);
                case "fluency"          -> scoreFluency(lower, words.length);
                case "vocabulary"       -> scoreVocabulary(words);
                case "confidence"       -> scoreConfidence(lower, words.length);
                case "structure"        -> scoreStructure(lower);
                case "grammar"          -> scoreGrammar(text, sentences);
                case "tone"             -> scoreTone(lower);
                case "persuasion"       -> scorePersuasion(lower);
                case "reasoning"        -> scoreReasoning(lower, keywords);
                case "storytelling"     -> scoreStorytelling(lower);
                case "completeness"     -> scoreCompleteness(lower, keywords);
                case "descriptiveness"  -> scoreDescriptiveness(lower);
                case "argumentation"    -> scoreArgumentation(lower, sentences.length);
                case "formality"        -> scoreFormalityLevel(lower);
                case "coherence"        -> scoreCoherence(lower);
                case "creativity"       -> scoreCreativity(words);
                case "analysis"         -> scoreAnalysis(lower);
                case "narrative-flow"   -> scoreNarrativeFlow(lower, sentences);
                case "originality"      -> scoreOriginality(lower, words);
                case "critical-thinking"-> scoreCriticalThinking(lower);
                default                 -> 3.0;
            };
            
            // Apply relevance penalty to the heuristic score
            scores.put(criterion, Math.min(5.0, Math.max(1.0, val * relevanceMultiplier)));
        }
        return scores;
    }

    // ── Listening MCQ scorer ─────────────────────────────────────
    public Map<String, Double> scoreListening(int correct, int total) {
        double pct = (double) correct / Math.max(1, total);
        Map<String, Double> s = new LinkedHashMap<>();
        s.put("comprehension",      clamp(1 + pct * 4));
        s.put("accuracy",           clamp(1 + pct * 4));
        s.put("retention",          clamp(1 + pct * 3.5));
        s.put("critical-listening", clamp(1 + pct * 3));
        s.put("note-taking",        clamp(2 + pct * 2));
        return s;
    }

    // ── Individual criterion algorithms ─────────────────────────

    private double scoreClarity(String[] sentences) {
        if (sentences.length == 0) return 2;
        double avgLen = Arrays.stream(sentences)
            .filter(s -> !s.isBlank())
            .mapToInt(s -> s.trim().split("\\s+").length)
            .average().orElse(10);
        if (avgLen < 5)  return 2;
        if (avgLen <= 20) return 5;
        if (avgLen <= 30) return 4;
        return 3;
    }

    private double scoreFluency(String lower, int wordCount) {
        String[] fillers = {"um", "uh", "like", "you know", "basically", "literally"};
        long fillerCount = Arrays.stream(fillers)
            .mapToLong(f -> countOccurrences(lower, f)).sum();
        double ratio = fillerCount / (double) Math.max(1, wordCount);
        if (ratio > 0.1)  return 2;
        if (ratio > 0.05) return 3;
        if (wordCount > 80) return 5;
        if (wordCount > 50) return 4;
        return 3;
    }

    private double scoreVocabulary(String[] words) {
        Set<String> unique = new HashSet<>();
        int totalLen = 0;
        for (String w : words) {
            String clean = w.toLowerCase().replaceAll("[^a-z]", "");
            if (!clean.isEmpty()) { unique.add(clean); totalLen += clean.length(); }
        }
        double ratio  = unique.size() / (double) Math.max(1, words.length);
        double avgLen = totalLen / (double) Math.max(1, words.length);
        double score  = 3;
        if (ratio > 0.7) score++;
        if (avgLen > 5.5) score++;
        if (ratio < 0.4) score--;
        if (avgLen < 4)  score--;
        return score;
    }

    private double scoreConfidence(String lower, int wordCount) {
        String[] uncertain = {"i think", "maybe", "i guess", "sort of", "kind of", "i'm not sure", "perhaps"};
        String[] confident = {"i believe", "i am certain", "clearly", "definitely", "certainly", "i recommend", "i know"};
        long u = Arrays.stream(uncertain).filter(lower::contains).count();
        long c = Arrays.stream(confident).filter(lower::contains).count();
        double score = 3 + c - u;
        if (wordCount > 100) score++;
        return score;
    }

    private double scoreStructure(String lower) {
        boolean hasIntro      = lower.matches("(?s)(firstly|to begin|let me|today i|in this|introduction).*");
        boolean hasConclusion = lower.contains("in conclusion") || lower.contains("to summarize") ||
                                lower.contains("finally") || lower.contains("in summary") || lower.contains("overall");
        boolean hasTransitions= lower.contains("however") || lower.contains("furthermore") ||
                                lower.contains("in addition") || lower.contains("moreover") ||
                                lower.contains("for example") || lower.contains("because");
        return 2 + (hasIntro ? 1 : 0) + (hasConclusion ? 1 : 0) + (hasTransitions ? 1 : 0);
    }

    private double scoreGrammar(String text, String[] sentences) {
        int issues = 0;
        // Check for doubled words
        String[] words = text.split("\\s+");
        for (int i = 1; i < words.length; i++) {
            if (words[i].equalsIgnoreCase(words[i-1])) issues++;
        }
        // Check sentences not starting with capital
        for (String s : sentences) {
            String t = s.trim();
            if (!t.isEmpty() && Character.isLowerCase(t.charAt(0))) issues++;
        }
        double ratio = issues / (double) Math.max(1, words.length);
        if (ratio < 0.01) return 5;
        if (ratio < 0.03) return 4;
        if (ratio < 0.06) return 3;
        if (ratio < 0.10) return 2;
        return 1;
    }

    private double scoreTone(String lower) {
        String[] formal   = {"regarding", "furthermore", "therefore", "sincerely", "i would like", "please", "kindly", "respectfully"};
        String[] informal = {"hey", "gonna", "wanna", "kinda", "lol", "btw", "ok ", "yeah"};
        long f = Arrays.stream(formal).filter(lower::contains).count();
        long i = Arrays.stream(informal).filter(lower::contains).count();
        return clamp(3 + f - i * 2);
    }

    private double scorePersuasion(String lower) {
        String[] persuasive = {"should", "must", "important", "essential", "critical", "benefit", "advantage", "recommend", "urge", "compelling"};
        long matches = Arrays.stream(persuasive).filter(lower::contains).count();
        return clamp(2 + Math.min(3, matches));
    }

    private double scoreReasoning(String lower, List<String> keywords) {
        String[] reasonWords = {"because", "therefore", "thus", "since", "as a result", "hence", "consequently", "due to"};
        long r = Arrays.stream(reasonWords).filter(lower::contains).count();
        long k = keywords.stream().filter(kw -> lower.contains(kw.toLowerCase())).count();
        double kwScore = Math.min(2, k * 2.0 / Math.max(1, keywords.size()));
        return clamp(2 + r + kwScore);
    }

    private double scoreStorytelling(String lower) {
        String[] narrative = {"suddenly", "then", "after that", "eventually", "as a result", "i felt", "i realized", "i learned", "i remember", "it was"};
        long matches = Arrays.stream(narrative).filter(lower::contains).count();
        return clamp(2 + matches);
    }

    private double scoreCompleteness(String lower, List<String> elements) {
        if (elements.isEmpty()) return 3;
        long found = elements.stream().filter(e -> lower.contains(e.toLowerCase())).count();
        return Math.max(1, Math.round(1 + (found * 4.0 / elements.size())));
    }

    private double scoreDescriptiveness(String lower) {
        String[] descriptors = {"vivid", "bright", "dark", "quiet", "warm", "cold", "soft", "sharp", "smooth", "rough", "beautiful", "elegant", "stunning", "cozy", "spacious", "serene"};
        String[] sensory     = {"see", "hear", "feel", "smell", "taste", "look", "sound", "appear"};
        long d = Arrays.stream(descriptors).filter(lower::contains).count();
        long s = Arrays.stream(sensory).filter(lower::contains).count();
        return clamp(2 + Math.min(2, d) + Math.min(1, s));
    }

    private double scoreArgumentation(String lower, int sentenceCount) {
        String[] argWords = {"argue", "claim", "evidence", "proof", "study", "research", "data", "statistic", "fact", "prove"};
        long matches = Arrays.stream(argWords).filter(lower::contains).count();
        return clamp(2 + Math.min(3, matches));
    }

    private double scoreFormalityLevel(String lower) {
        return scoreTone(lower);
    }

    private double scoreCoherence(String lower) {
        String[] transitions = {"however", "furthermore", "in addition", "moreover", "first", "second", "third",
                                "finally", "in conclusion", "therefore", "as a result", "for example", "for instance", "additionally"};
        long matches = Arrays.stream(transitions).filter(lower::contains).count();
        return clamp(2 + Math.min(3, matches));
    }

    private double scoreCreativity(String[] words) {
        Set<String> unique = new HashSet<>();
        for (String w : words) unique.add(w.toLowerCase().replaceAll("[^a-z]", ""));
        double ratio = unique.size() / (double) Math.max(1, words.length);
        String text  = String.join(" ", words).toLowerCase();
        boolean hasMetaphor = text.contains("like a") || text.contains("as if") ||
                              text.contains("feels like") || text.contains("imagine") || text.contains("as though");
        return clamp(2 + (ratio > 0.7 ? 1 : 0) + (hasMetaphor ? 1 : 0) + (words.length > 150 ? 1 : 0));
    }

    private double scoreAnalysis(String lower) {
        String[] analytical = {"however", "on one hand", "on the other hand", "in contrast", "while", "although",
                               "despite", "considering", "reveals", "indicates", "suggests", "implies", "analysis"};
        long matches = Arrays.stream(analytical).filter(lower::contains).count();
        return clamp(2 + Math.min(3, matches));
    }

    private double scoreNarrativeFlow(String lower, String[] sentences) {
        String[] flowWords = {"then", "next", "after", "before", "as", "when", "while", "suddenly", "eventually", "finally"};
        long matches = Arrays.stream(flowWords).filter(lower::contains).count();
        // Check sentence length variance
        double[] lens = Arrays.stream(sentences)
            .filter(s -> !s.isBlank())
            .mapToDouble(s -> s.trim().split("\\s+").length).toArray();
        double variance = lens.length > 1 ? variance(lens) : 0;
        return clamp(2 + Math.min(2, matches) + (variance > 10 ? 1 : 0));
    }

    private double scoreOriginality(String lower, String[] words) {
        String[] clichés = {"at the end of the day", "thinking outside the box", "low hanging fruit",
                            "move the needle", "game changer", "paradigm shift", "synergy"};
        long clichéCount = Arrays.stream(clichés).filter(lower::contains).count();
        Set<String> unique = new HashSet<>();
        for (String w : words) unique.add(w.toLowerCase());
        double ratio = unique.size() / (double) Math.max(1, words.length);
        return clamp(4 - clichéCount + (ratio > 0.75 ? 1 : 0));
    }

    private double scoreCriticalThinking(String lower) {
        String[] critical = {"however", "on the other hand", "in contrast", "while", "although",
                             "question", "challenge", "assumption", "evidence", "consider", "perspective",
                             "argue", "counter", "evaluate", "assess"};
        long matches = Arrays.stream(critical).filter(lower::contains).count();
        return clamp(2 + Math.min(3, matches));
    }

    // ── Aggregate final score ────────────────────────────────────
    public static double computeOverall(List<Map<String, Double>> allScores) {
        double sum = 0; int count = 0;
        for (Map<String, Double> m : allScores)
            for (double v : m.values()) { sum += v; count++; }
        return count == 0 ? 0 : Math.round((sum / count) * 20);
    }

    public static Map<String, Double> aggregateCriteria(List<Map<String, Double>> allScores) {
        Map<String, List<Double>> acc = new LinkedHashMap<>();
        for (Map<String, Double> m : allScores)
            m.forEach((k, v) -> acc.computeIfAbsent(k, x -> new ArrayList<>()).add(v));
        Map<String, Double> result = new LinkedHashMap<>();
        acc.forEach((k, vals) -> result.put(k, Math.round(vals.stream().mapToDouble(d -> d).average().orElse(0) * 10) / 10.0));
        return result;
    }

    // ── Utilities ────────────────────────────────────────────────
    private double clamp(double val) { return Math.min(5.0, Math.max(1.0, val)); }

    private long countOccurrences(String text, String sub) {
        int count = 0, idx = 0;
        while ((idx = text.indexOf(sub, idx)) != -1) { count++; idx += sub.length(); }
        return count;
    }

    private double variance(double[] arr) {
        double mean = Arrays.stream(arr).average().orElse(0);
        return Arrays.stream(arr).map(v -> Math.pow(v - mean, 2)).average().orElse(0);
    }
}
