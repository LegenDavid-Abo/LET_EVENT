export async function sendTicketEmail(input: {
  to: string; name: string; eventName: string; date: string; venue: string;
  ticketUrl: string; qrDataUrl: string; ticketNumber: string;
}) {
  const key = process.env.BREVO_API_KEY;
  if (!key) return { skipped: true };
  const html = `
  <div style="background:#07080c;padding:40px;font-family:Arial;color:#f7f7f8">
    <div style="max-width:620px;margin:auto;background:#111318;border:1px solid #292c34;border-radius:24px;padding:32px">
      <div style="font-size:13px;letter-spacing:3px;color:#a9adb8">EVENTLY</div>
      <h1 style="font-size:30px;margin:22px 0 8px">${escapeHtml(input.eventName)}</h1>
      <p>Hello ${escapeHtml(input.name)}, your registration is confirmed.</p>
      <p>${escapeHtml(input.date)} · ${escapeHtml(input.venue)}</p>
      <div style="text-align:center;margin:30px 0"><img src="${input.qrDataUrl}" width="240" height="240" alt="QR ticket"></div>
      <p>Ticket <b>${escapeHtml(input.ticketNumber)}</b></p>
      <p><a href="${input.ticketUrl}" style="color:#fff">Open your digital ticket</a></p>
    </div>
  </div>`;
  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "accept":"application/json","api-key":key,"content-type":"application/json" },
    body: JSON.stringify({
      sender: { email: process.env.BREVO_SENDER_EMAIL, name: process.env.BREVO_SENDER_NAME || "Evently" },
      to: [{ email: input.to, name: input.name }],
      subject: `Registration Confirmed — ${input.eventName}`,
      htmlContent: html
    })
  });
  if (!res.ok) throw new Error(`Brevo error ${res.status}: ${await res.text()}`);
  return res.json();
}
function escapeHtml(s:string) {
  return s.replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;" }[c]!));
}