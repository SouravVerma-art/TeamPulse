package handlers

import (
	"context"
	"testing"
	"time"

	"github.com/teampulse/backend/ai"
	"github.com/teampulse/backend/models"
)

func TestRunSwarmUsesDemoFallbackWithoutToken(t *testing.T) {
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()

	trace := make(chan models.TraceEvent, 32)
	go func() {
		for range trace {
		}
	}()

	brief, err := runSwarm(ctx, ai.New(""), nil, trace)
	close(trace)

	if err != nil {
		t.Fatalf("runSwarm returned error: %v", err)
	}
	if len(brief.AgentResults) != 3 {
		t.Fatalf("expected 3 agent results, got %d", len(brief.AgentResults))
	}
	if len(brief.Insights) == 0 {
		t.Fatal("expected fallback insights")
	}
	if brief.ConflictsFound == 0 {
		t.Fatal("expected fallback conflict detection")
	}
}
