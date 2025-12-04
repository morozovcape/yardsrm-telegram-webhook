export default async function handler(req, res) {
  const TOKEN = "7548667381:AAEtgXtcA-BSNHfaQIhRjLo5ALQHb_16yqE";
  const CHAT_ID = "383561012";
  const data = req.body;

  const msg = `
📩 Новая заявка с сайта
Имя: ${data.name}
Телефон: ${data.phone}
Сообщение: ${data.message}
  `;

  await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: CHAT_ID,
      text: msg,
      parse_mode: "HTML"
    })
  });

  res.status(200).json({ ok: true });
}
