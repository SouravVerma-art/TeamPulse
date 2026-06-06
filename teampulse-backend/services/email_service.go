package services

import (
	"fmt"
	"io"
	"io/ioutil"
	"net/smtp"
	"os"

	"github.com/emersion/go-imap"
	"github.com/emersion/go-imap/client"
	"github.com/emersion/go-message/mail"
	"github.com/teampulse/backend/models"
)

type EmailService struct {
	IMAPServer string
	Email      string
	Password   string
}

func NewEmailService() *EmailService {
	return &EmailService{
		IMAPServer: "imap.gmail.com:993",
		Email:      os.Getenv("GMAIL_USER"),
		Password:   os.Getenv("GMAIL_APP_PASSWORD"),
	}
}

func (s *EmailService) FetchRecentEmails(limit int) ([]models.EmailLog, error) {
	if s.Email == "" || s.Password == "" {
		return nil, fmt.Errorf("GMAIL_USER or GMAIL_APP_PASSWORD not set")
	}

	// Connect to server
	c, err := client.DialTLS(s.IMAPServer, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to IMAP server: %v", err)
	}
	defer c.Logout()

	// Login
	if err := c.Login(s.Email, s.Password); err != nil {
		return nil, fmt.Errorf("failed to login: %v", err)
	}

	// Select INBOX
	mbox, err := c.Select("INBOX", false)
	if err != nil {
		return nil, fmt.Errorf("failed to select INBOX: %v", err)
	}

	if mbox.Messages == 0 {
		return nil, nil
	}

	// Get the last 'limit' messages
	from := uint32(1)
	if mbox.Messages > uint32(limit) {
		from = mbox.Messages - uint32(limit) + 1
	}
	seqset := new(imap.SeqSet)
	seqset.AddRange(from, mbox.Messages)

	// Get the message header and body
	var section imap.BodySectionName
	items := []imap.FetchItem{imap.FetchEnvelope, imap.FetchFlags, imap.FetchInternalDate, section.FetchItem()}

	messages := make(chan *imap.Message, limit)
	done := make(chan error, 1)
	go func() {
		done <- c.Fetch(seqset, items, messages)
	}()

	var emailLogs []models.EmailLog
	for msg := range messages {
		if msg == nil {
			continue
		}

		logEntry := models.EmailLog{
			ID:         fmt.Sprintf("%d", msg.SeqNum),
			From:       msg.Envelope.From[0].Address(),
			Subject:    msg.Envelope.Subject,
			ReceivedAt: msg.InternalDate,
			IsRead:     false,
			Priority:   "medium", // Default priority
		}

		for _, flag := range msg.Flags {
			if flag == imap.SeenFlag {
				logEntry.IsRead = true
				break
			}
		}

		// Parse body
		r := msg.GetBody(&section)
		if r != nil {
			mr, err := mail.CreateReader(r)
			if err == nil {
				for {
					p, err := mr.NextPart()
					if err == io.EOF {
						break
					} else if err != nil {
						break
					}

					switch h := p.Header.(type) {
					case *mail.InlineHeader:
						contentType, _, _ := h.ContentType()
						if contentType == "text/plain" {
							b, _ := ioutil.ReadAll(p.Body)
							logEntry.Body = string(b)
						}
					}
				}
			}
		}

		if logEntry.Body == "" {
			logEntry.Body = "(No plain text body found or failed to parse)"
		}

		emailLogs = append(emailLogs, logEntry)
	}

	if err := <-done; err != nil {
		return nil, fmt.Errorf("failed to fetch messages: %v", err)
	}

	return emailLogs, nil
}

func (s *EmailService) SendEmail(to, subject, body string) error {
	if s.Email == "" || s.Password == "" {
		return fmt.Errorf("GMAIL_USER or GMAIL_APP_PASSWORD not set")
	}

	// Connect to Gmail SMTP
	auth := smtp.PlainAuth("", s.Email, s.Password, "smtp.gmail.com")
	
	// Prepare message
	msg := []byte("To: " + to + "\r\n" +
		"Subject: " + subject + "\r\n" +
		"MIME-version: 1.0;\nContent-Type: text/plain; charset=\"UTF-8\";\r\n" +
		"\r\n" +
		body + "\r\n")

	// Send mail
	err := smtp.SendMail("smtp.gmail.com:587", auth, s.Email, []string{to}, msg)
	if err != nil {
		return fmt.Errorf("failed to send email: %v", err)
	}

	return nil
}
