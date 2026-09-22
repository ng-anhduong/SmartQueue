import sgMail from "@sendgrid/mail";

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

function titleCase(str = "") {
  return str
    .replace(/_/g, " ")
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

function formatServiceName(raw) {
  if (!raw) return "Service";
  const t = titleCase(raw);
  return /service$/i.test(t) ? t : `${t} Service`;
}

export default async function handler(req, res) {
  // CORS for browser calls (localhost -> vercel)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") return res.status(405).end();

  const {
    customerEmail,
    customerName = "Customer",
    ticketNumber,
    branchId = "",
    branchName = "",
    serviceType = "",
    serviceName = "",
    counter = "",
    type = "call-next",
  } = req.body || {};

  if (!customerEmail || !ticketNumber) {
    return res.status(400).json({ error: "Missing email or ticketNumber" });
  }

  const from = process.env.FROM_EMAIL || "noreply@example.com";
  const branchDisplay = titleCase(branchName || branchId);
  const serviceDisplay = formatServiceName(serviceName || serviceType);

  const isNoShow = type === "no-show";

  const subject = isNoShow
    ? `You missed your turn: Ticket ${ticketNumber}`
    : `It's your turn: Ticket ${ticketNumber}`;

  const bodyText = isNoShow
    ? `Hello ${customerName},\nYour ticket ${ticketNumber} was called for ${serviceDisplay} at branch ${branchDisplay}, but we couldn't reach you. Please rejoin the queue if you still need service.`
    : `Hello ${customerName},\nYour ticket ${ticketNumber} is being called for ${serviceDisplay} at branch ${branchDisplay}. Please proceed to counter ${counter || "the counter"} now.`;

  const bodyHtml = isNoShow
    ? `<p>Hello ${customerName},</p>
       <p>Your ticket <strong>${ticketNumber}</strong> was called for <strong>${serviceDisplay}</strong> at branch ${branchDisplay}, but we couldn't reach you.</p>
       <p>Please rejoin the queue if you still need service.</p>`
    : `<p>Hello ${customerName},</p>
       <p>Your ticket <strong>${ticketNumber}</strong> is being called for <strong>${serviceDisplay}</strong> at branch ${branchDisplay}.</p>
       <p>Please proceed to counter ${counter || "the counter"} now.</p>`;

  const msg = {
    to: customerEmail,
    from,
    subject,
    text: bodyText,
    html: bodyHtml,
  };

  try {
    await sgMail.send(msg);
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("SendGrid error", err);
    return res.status(500).json({ error: "Failed to send email" });
  }
}
