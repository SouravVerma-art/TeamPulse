package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/joho/godotenv"
	"github.com/rs/cors"
	"github.com/teampulse/backend/ai"
	"github.com/teampulse/backend/handlers"
)

func main() {
	// ── Config ────────────────────────────────────────────────────────────────
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, falling back to environment variables")
	}

	apiKey := os.Getenv("GITHUB_TOKEN")
	if apiKey == "" {
		log.Fatal("GITHUB_TOKEN environment variable is required")
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "9090"
	}

	// ── AI client ─────────────────────────────────────────────────────────
	gClient := ai.New(apiKey)
	defer gClient.Close()
	log.Println("✓ AI client initialised")

	// ── Handlers ──────────────────────────────────────────────────────────────
	h := handlers.New(gClient)

	// ── Router ────────────────────────────────────────────────────────────────
	mux := http.NewServeMux()
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/" {
			http.NotFound(w, r)
			return
		}
		fmt.Fprintf(w, "TeamPulse Backend is running on port %s", port)
	})
	mux.HandleFunc("/health", h.Health)
	mux.HandleFunc("/brief", h.Brief)
	mux.HandleFunc("/brief/stream", h.BriefStream)

	// ── CORS ──────────────────────────────────────────────────────────────────
	// Allow Next.js dev server and production frontend
	c := cors.New(cors.Options{
		AllowedOrigins: []string{
			"http://localhost:3000",
			"http://localhost:3001",
			"http://localhost:5050",
			"https://teampulse.vercel.app", // update with your prod domain
		},
		AllowedMethods: []string{"GET", "POST", "OPTIONS"},
		AllowedHeaders: []string{"Content-Type", "Authorization"},
	})

	// ── Server ────────────────────────────────────────────────────────────────
	srv := &http.Server{
		Addr:         ":" + port,
		Handler:      c.Handler(mux),
		ReadTimeout:  30 * time.Second,
		WriteTimeout: 120 * time.Second, // longer for SSE streams
		IdleTimeout:  60 * time.Second,
	}

	// ── Graceful shutdown ─────────────────────────────────────────────────────
	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt, syscall.SIGTERM)

	go func() {
		log.Printf("🚀 TeamPulse backend running on :%s", port)
		log.Println("   GET  /health")
		log.Println("   POST /brief        — full JSON brief")
		log.Println("   GET  /brief/stream — SSE live trace")
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("server error: %v", err)
		}
	}()

	<-stop
	log.Println("shutting down...")

	shutCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := srv.Shutdown(shutCtx); err != nil {
		log.Fatalf("shutdown error: %v", err)
	}
	log.Println("✓ server stopped cleanly")
}
