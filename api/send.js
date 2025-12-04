// api/send.js — универсальный вебхук

export default async function handler(req, res) {
  // ----- CORS -----
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const TOKEN   = process.env.TELEGRAM_BOT_TOKEN;
  const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

  if (!TOKEN || !CHAT_ID) {
    return res.status(500).json({
      ok: false,
      error: 'Missing Telegram credentials',
    });
  }

  // ----- ЧИТАЕМ ДАННЫЕ ИЗ ЗАПРОСА -----
  let data = {};

  if (req.method === 'POST') {
    // Если Vercel уже распарсил JSON
    if (req.body && typeof req.body === 'object') {
      data = req.body;
    } else if (typeof req.body === 'string') {
      // form-urlencoded или "сырой" JSON
      try {
        data = JSON.parse(req.body);
      } catch {
        data = Object.fromEntries(new URLSearchParams(req.body));
      }
    }
  } else {
    // GET — для тестов из браузера
    data = req.query || {};
  }

  // Нормализуем все значения в строки
  Object.keys(data).forEach((k) => {
    if (data[k] == null) data[k] = '';
    data[k] = String(data[k]).trim();
  });

  const {
    form_name,
    tour,
    page,
    name,
    phone,
    email,
    contact,
    date,
    comment,
  } = data;

  // ----- СТРОИМ КРАСИВЫЙ ТЕКСТ -----
  const lines = [];

  lines.push('🧭 <b>Новая заявка с сайта</b>');

  if (page)      lines.push(`Страница: ${page}`);
  if (form_name) lines.push(`Форма: ${form_name}`);
  if (tour)      lines.push(`Тур: ${tour}`);

  if (name || phone || email || contact || date || comment) {
    lines.push('');
  }

  if (name)    lines.push(`Имя: ${name}`);
  if (phone)   lines.push(`Телефон: ${phone}`);
  if (email)   lines.push(`Email: ${email}`);
  if (contact) lines.push(`Связаться через: ${contact}`);
  if (date)    lines.push(`Желаемая дата тура: ${date}`);

  if (comment) {
    lines.push('');
    lines.push('Комментарий:');
    lines.push(comment);
  }

  // Все дополнительные поля (если появятся в будущих формах)
  const systemKeys = new Set([
    'form_name',
    'tour',
    'page',
    'name',
    'phone',
    'email',
    'contact',
    'date',
    'comment',
  ]);

  const extra = Object.entries(data).filter(
    ([key, value]) => !systemKeys.has(key) && value !== ''
  );

  if (extra.length) {
    lines.push('');
    lines.push('Дополнительно:');
    extra.forEach(([key, value]) => {
      lines.push(`${key}: ${value}`);
    });
  }

  const text = lines.join('\n').trim() || 'Новая заявка (пустое сообщение)';

  // ----- ОТПРАВКА В TELEGRAM -----
  try {
    const tgRes = await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text,
        parse_mode: 'HTML',
      }),
    });

    const tgData = await tgRes.json();

    if (!tgRes.ok || !tgData.ok) {
      console.error('Telegram error:', tgData);
      return res.status(500).json({
        ok: false,
        error: 'Telegram error',
        detail: tgData,
      });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({
      ok: false,
      error: 'Server error',
    });
  }
}
