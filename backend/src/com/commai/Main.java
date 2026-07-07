package com.commai;

import com.sun.net.httpserver.HttpServer;
import java.io.IOException;
import java.net.InetSocketAddress;
import java.nio.file.Paths;
import java.util.concurrent.Executors;

/**
 * Main.java — Entry point for CommAI Java Server
 */
public class Main {

    public static final int PORT = System.getenv("PORT") != null ? Integer.parseInt(System.getenv("PORT")) : 8080;

    public static void main(String[] args) throws IOException {
        // Resolve data directory relative to the JAR location
        String dataDir = Paths.get("backend", "data").toAbsolutePath().toString();

        HttpServer server = HttpServer.create(new InetSocketAddress(PORT), 0);
        HttpRouter.register(server, dataDir);

        server.setExecutor(Executors.newFixedThreadPool(10));
        server.start();

        System.out.println("╔══════════════════════════════════════════════╗");
        System.out.println("║   CommAI Java Server — Running on port " + PORT + "   ║");
        System.out.println("╠══════════════════════════════════════════════╣");
        System.out.println("║  Open: http://localhost:" + PORT + "                  ║");
        System.out.println("║  Auth: /api/auth/login  /api/auth/register   ║");
        System.out.println("║  AI Q: /api/generate-question                ║");
        System.out.println("╚══════════════════════════════════════════════╝");
    }
}
