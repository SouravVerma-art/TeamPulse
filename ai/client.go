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
	inner *openai.Client
	model string
}

// New creates a new AI client pointing to GitHub Models using the provided token.
func New(apiKey string) *Client {
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

// Complete sends a prompt to the model and returns the raw text response.
func (c *Client) Complete(ctx context.Context, prompt string) (string, error) {
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
		return "", fmt.Errorf("ai: generate content failed: %w", err)
	}

	if len(resp.Choices) == 0 {
		return "", fmt.Errorf("ai: empty response choices")
	}

	return resp.Choices[0].Message.Content, nil
}

// CompleteJSON sends a prompt and unmarshals the response into the target interface.
func (c *Client) CompleteJSON(ctx context.Context, prompt string, target any) error {
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
		return fmt.Errorf("ai: generate JSON content failed: %w", err)
	}

	if len(resp.Choices) == 0 {
		return fmt.Errorf("ai: empty response choices")
	}

	raw := resp.Choices[0].Message.Content

	// Many models wrap JSON in markdown blocks even when asked not to
	raw = strings.TrimSpace(raw)
	raw = strings.TrimPrefix(raw, "```json")
	raw = strings.TrimPrefix(raw, "```")
	raw = strings.TrimSuffix(raw, "```")
	raw = strings.TrimSpace(raw)

	if err := json.Unmarshal([]byte(raw), target); err != nil {
		return fmt.Errorf("ai: failed to parse JSON response: %w\nraw: %s", err, raw)
	}

	return nil
}
