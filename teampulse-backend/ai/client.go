package ai

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"

	openai "github.com/sashabaranov/go-openai"
)

// Client wraps the OpenAI client for GitHub Models.
type Client struct {
	inner   *openai.Client
	model   string
	offline bool
}

// New creates a new AI client pointing to GitHub Models using the provided token.
func New(apiKey string) *Client {
	if strings.TrimSpace(apiKey) == "" {
		return &Client{offline: true, model: "demo-fallback"}
	}

	config := openai.DefaultConfig(apiKey)
	config.BaseURL = "https://models.inference.ai.azure.com"

	c := openai.NewClientWithConfig(config)
	return &Client{
		inner: c,
		// Default to gpt-4o or gpt-4o-mini as they are common and capable models on GitHub Models.
		// Can be configured further if needed.
		model: "gpt-4o-mini",
	}
}

// Close is provided for compatibility with the previous interface if needed,
// though go-openai client doesn't require explicit closing.
func (c *Client) Close() {
	// No-op
}

// IsOffline returns true if the client is in demo fallback mode (no API key provided).
func (c *Client) IsOffline() bool {
	return c.offline
}

// Complete sends a prompt to the model and returns the raw text response.
func (c *Client) Complete(ctx context.Context, prompt string) (string, error) {
	if c.offline {
		return "", fmt.Errorf("ai: GITHUB_TOKEN not set; using demo fallback")
	}

	req := openai.ChatCompletionRequest{
		Model: c.model,
		Messages: []openai.ChatCompletionMessage{
			{
				Role:    openai.ChatMessageRoleUser,
				Content: prompt,
			},
		},
		Temperature: 0.3,
	}

	resp, err := c.inner.CreateChatCompletion(ctx, req)
	if err != nil {
		msg := err.Error()
		if strings.Contains(msg, "The `models` permission is required") {
			return "", fmt.Errorf("ai: 401 Unauthorized - Your GITHUB_TOKEN is missing the 'GitHub Models' account permission. Please go to GitHub Settings -> Developer Settings -> Fine-grained tokens -> [Your Token] -> Account permissions -> Models and set to 'Read-only'.")
		}
		return "", fmt.Errorf("ai: generate content failed: %w", err)
	}

	if len(resp.Choices) == 0 {
		return "", fmt.Errorf("ai: empty response choices")
	}

	return resp.Choices[0].Message.Content, nil
}

// CompleteJSON sends a prompt and unmarshals the response into the target interface.
func (c *Client) CompleteJSON(ctx context.Context, prompt string, target any) error {
	if c.offline {
		return fmt.Errorf("ai: GITHUB_TOKEN not set; using demo fallback")
	}

	req := openai.ChatCompletionRequest{
		Model: c.model,
		Messages: []openai.ChatCompletionMessage{
			{
				Role:    openai.ChatMessageRoleUser,
				Content: prompt,
			},
		},
		Temperature: 0.1, // Lower temperature for structured output
	}

	resp, err := c.inner.CreateChatCompletion(ctx, req)
	if err != nil {
		msg := err.Error()
		if strings.Contains(msg, "The `models` permission is required") {
			return fmt.Errorf("ai: 401 Unauthorized - Your GITHUB_TOKEN is missing the 'GitHub Models' account permission. Please go to GitHub Settings -> Developer Settings -> Fine-grained tokens -> [Your Token] -> Account permissions -> Models and set to 'Read-only'.")
		}
		return fmt.Errorf("ai: generate JSON content failed: %w", err)
	}

	if len(resp.Choices) == 0 {
		return fmt.Errorf("ai: empty response choices")
	}

	raw := resp.Choices[0].Message.Content

	// Many models wrap JSON in markdown blocks or include conversational filler
	raw = strings.TrimSpace(raw)
	
	// Find the first occurrence of [ or {
	startIndex := strings.IndexAny(raw, "[{")
	if startIndex != -1 {
		raw = raw[startIndex:]
	}
	
	// Find the last occurrence of ] or }
	endIndex := strings.LastIndexAny(raw, "}]")
	if endIndex != -1 {
		raw = raw[:endIndex+1]
	}

	if err := json.Unmarshal([]byte(raw), target); err != nil {
		return fmt.Errorf("ai: failed to parse JSON response: %w\nraw: %s", err, raw)
	}

	return nil
}
