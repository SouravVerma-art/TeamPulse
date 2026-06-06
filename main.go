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
		log.Println("GITHUB_TOKEN not set; running with deterministic demo fallbacks")
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "9090"
	}

	// ── AI client ─────────────────────────────────────────────────────────
	aiClient := ai.New(apiKey)
	defer aiClient.Close()
	log.Println("AI client initialised")

	// ── Handlers ──────────────────────────────────────────────────────────────
	h := handlers.New(aiClient)

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
	mux.HandleFunc("/email/send", h.SendEmail)
	mux.HandleFunc("/settings", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodGet {
			h.GetSettings(w, r)
		} else if r.Method == http.MethodPost {
			h.UpdateSettings(w, r)
		} else {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		}
	})

	// ── CORS ────────────────────────────────────────────────────────────────
	allowedOrigins := []string{
		"http://localhost:3000",
		"http://localhost:3001",
		"http://localhost:5050",
	}
	if extraOrigin := os.Getenv("ALLOWED_ORIGIN"); extraOrigin != "" {
		allowedOrigins = append(allowedOrigins, extraOrigin)
	}

	c := cors.New(cors.Options{
		AllowedOrigins: allowedOrigins,
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
		log.Printf("TeamPulse backend running on :%s", port)
		log.Println("   GET  /health")
		log.Println("   POST /brief        - full JSON brief")
		log.Println("   GET  /brief/stream - SSE live trace")
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
	log.Println("server stopped cleanly")
}
