package com.commai;

import com.commai.auth.UserStore;
import com.commai.handlers.*;
import com.sun.net.httpserver.HttpServer;

/**
 * HttpRouter.java — Registers all URL routes
 */
public class HttpRouter {

    public static void register(HttpServer server, String dataDir) {
        // Initialise user store
        UserStore.init(dataDir);

        // ── Static file serving ──────────────────────────────────
        server.createContext("/",                       new StaticHandler());

        // ── Auth routes ──────────────────────────────────────────
        server.createContext("/api/auth/register",      new AuthHandler());
        server.createContext("/api/auth/login",         new AuthHandler());
        server.createContext("/api/auth/logout",        new AuthHandler());
        server.createContext("/api/auth/me",            new AuthHandler());

        // ── Assessment API ───────────────────────────────────────
        server.createContext("/api/questions",          new QuestionsHandler());
        server.createContext("/api/rubrics",            new RubricsHandler());
        server.createContext("/api/score",              new ScoreHandler());
        server.createContext("/api/feedback",           new FeedbackHandler());
        server.createContext("/api/report",             new ReportHandler());
        server.createContext("/api/health",             new HealthHandler());

        // ── Dynamic question generation (Groq-powered) ───────────
        server.createContext("/api/generate-question",  new QuestionGeneratorHandler());
    }
}
