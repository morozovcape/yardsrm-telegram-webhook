export default async function handler(req, res) {
  // ⚠️ СЮДА — ПОСЛЕДНИЙ ТОКЕН ИЗ BotFather
  const TOKEN = "7548667381:AAHOjvdKq50leOQrE3N_ij6LrbgH3K7o5p0";
  // Твой chat_id из @userinfobot
  const CHAT_ID = "383561012";

  // Берём данные либо из body (POST), либо из query (GET)
  const src = req.method === "POST" ? req.body : req.query || {};

  const name = src.name || "—";
  const phone = src.phone || "—";
  const message = src.message || "—";

  const text = `
<b>Новая заявка с сайта</b>
Имя: ${name}
Телефон: ${phone}
Сообщение: ${message}
  `.trim();

  try {
    const tgResponse = await fetch(
      `https://api.telegram.org/bot${TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: CHAT_ID,
          text,
          parse_mode: "HTML",
        }),
      }
    );

    const tgData = await tgResponse.json();

    if (!tgResponse.ok || !tgData.ok) {
      console.error("Telegram error:", tgData);
      return res
        .status(500)
        .json({ ok: false, error: "Telegram error", detail: tgData });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Server error:", err);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
}
