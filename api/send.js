// api/send.js — универсальный вебхук

export default async function handler(req, res) {
  // --- CORS, чтобы формы с любого домена могли слать запросы ---
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

  if (!TOKEN || !CHAT_ID) {
    return res.status(500).json({
      ok: false,
      error: 'Missing Telegram credentials',
    });
  }

  // ---------- ЧИТАЕМ ДАННЫЕ ИЗ ЗАПРОСА ----------
  let data = {};

  if (req.method === 'POST') {
    if (req.body && typeof req.body === 'object') {
      // Tilda / кастомный fetch с JSON
      data = req.body;
    } else if (typeof req.body === 'string') {
      // form-urlencoded или "сырой" JSON строкой
      try {
        data = JSON.parse(req.body);
      } catch {
        data = Object.fromEntries(new URLSearchParams(req.body));
      }
    }
  } else {
    // GET для тестов: ?name=...
    data = req.query || {};
  }

  // реферер страницы, откуда отправили форму
  const referer = req.headers.referer || req.headers.origin || '—';

  // достаём "чем является форма", если ты это передашь
  const formName =
    data.form_name ||
    data.form ||
    data.tour ||
    data.source ||
    'Без названия формы';

  // ---------- СБОР ТЕКСТА ДЛЯ ТЕЛЕГРАМА ----------
  const lines = [];

  lines.push('🧭 Новая заявка с сайта');
  lines.push('');
  lines.push(`Страница: ${referer}`);
  lines.push(`Форма / тур: ${formName}`);
  lines.push('');

  // красивое название полей
  const labels = {
    name: 'Имя',
    first_name: 'Имя',
    last_name: 'Фамилия',
    phone: 'Телефон',
    email: 'Email',
    date: 'Желаемая дата тура',
    tour: 'Тур',
    adults: 'Взрослых',
    kids: 'Детей',
    people: 'Кол-во человек',
    guests: 'Гостей',
    contact: 'Удобный способ связи',
    comment: 'Комментарий',
    message: 'Сообщение',
    budget: 'Бюджет',
    from: 'Источник',
    page: 'Страница',
  };

  // Эти поля мы уже вывели отдельно, не дублируем
  const skipKeys = new Set(['form', 'form_name', 'tour', 'source']);

  for (const [key, rawValue] of Object.entries(data)) {
    if (rawValue == null || rawValue === '') continue;
    if (skipKeys.has(key)) continue;

    const label = labels[key] || key;
    lines.push(`${label}: ${rawValue}`);
  }

  if (lines.length <= 5) {
    lines.push('Полей нет (проверь форму на сайте)');
  }

  const text = lines.join('\n');

  // ---------- ОТПРАВКА В TELEGRAM ----------
  try {
    const tgResponse = await fetch(
      `https://api.telegram.org/bot${TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: CHAT_ID,
          text,
          parse_mode: 'HTML',
        }),
      }
    );

    const tgData = await tgResponse.json();

    if (!tgResponse.ok || !tgData.ok) {
      console.error('Telegram error:', tgData);
      return res
        .status(500)
        .json({ ok: false, error: 'Telegram error', detail: tgData });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Server error:', err);
    return res
      .status(500)
      .json({ ok: false, error: 'Server error' });
  }
}
