export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:9090";

export const ENDPOINTS = {
  health:      `${API_BASE}/health`,
  brief:       `${API_BASE}/brief`,
  briefStream: `${API_BASE}/brief/stream`,
  settings:    `${API_BASE}/settings`,
  sendEmail:   `${API_BASE}/email/send`,
} as const;

export async function sendEmail(payload: { to: string; subject: string; body: string; ref_id?: string }) {
  const res = await fetch(ENDPOINTS.sendEmail, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to send email");
  return res.json();
}
