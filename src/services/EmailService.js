/**
 * Send "you're up next" email via an external HTTPS endpoint.
 * Set VITE_EMAIL_API_URL in your environment to avoid hardcoding.
 */
const EMAIL_API_URL =
  import.meta.env.VITE_EMAIL_API_URL ||
  "https://YOUR-EMAIL-ENDPOINT/api/sendCallNextEmail";

export async function sendCallNextEmail(payload) {
  if (!payload?.customerEmail) return;
  try {
    const res = await fetch(EMAIL_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error(
        "[EmailService] call-next email failed",
        res.status,
        res.statusText,
        text
      );
    }
  } catch (err) {
    console.error("Failed to send call-next email:", err, {
      endpoint: EMAIL_API_URL,
    });
    // Do not throw; don't block staff flow.
  }
}
