// api/chat.js
export default async function handler(req, res) {
    // Разрешаем только POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // CORS — чтобы запросы с твоего же домена проходили
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { message, history } = req.body || {};
    if (!message || typeof message !== 'string') {
        return res.status(400).json({ error: 'Message is required' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: 'API key not configured' });
    }

    // === КОНТЕКСТ ДЛЯ БОТА ===
    // Это то, что бот "знает". Меняй/дополняй когда нужно.
    const systemPrompt = `Ты — ассистент digital-агентства Kassel Digital Solutions.

Мы помогаем бизнесу в Касселе и Германии:
- Создаём сайты под ключ (от 1500€, срок 3-4 недели)
- Настраиваем рекламу в соцсетях: TikTok, Instagram, Facebook (от 500€/мес)
- Создаём видео: рекламные ролики, Reels, TikTok-видео (от 800€ за ролик)
- Продвигаем в TikTok и Instagram (от 300€/мес)
- Ведём контент-маркетинг

Наши результаты: 120+ проектов, 40+ клиентов, 7+ лет опыта.

Контакты:
- Email: muster@gmail.com   
- Телефон: +2223334445555
- Адрес: Kassel, Germany

Правила:
- Отвечай кратко (2-3 предложения), дружелюбно и по делу
- Если клиент пишет по-немецки — отвечай по-немецки
- Если по-английски — отвечай по-английски
- Если по-русски — отвечай по-русски
- Если не знаешь точного ответа — предложи связаться по email или телефону
- Не выдумывай цены и сроки, которых нет выше
- Не говори, что ты AI, если не спросят напрямую`;

    // Собираем историю диалога для контекста (последние 10 сообщений)
    const contents = [];
    if (Array.isArray(history)) {
        for (const item of history.slice(-10)) {
            if (item.role === 'user' || item.role === 'model') {
                contents.push({
                    role: item.role,
                    parts: [{ text: String(item.text || '') }]
                });
            }
        }
    }
    // Добавляем текущее сообщение
    contents.push({ role: 'user', parts: [{ text: message }] });

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    system_instruction: {
                        parts: [{ text: systemPrompt }]
                    },
                    contents,
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 500
                    }
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            console.error('Gemini error:', data);
            return res.status(response.status).json({
                error: data.error?.message || 'Gemini API error'
            });
        }

        const reply =
            data.candidates?.[0]?.content?.parts?.[0]?.text ||
            'Извините, не могу сейчас ответить. Свяжитесь с нами по email.';

        return res.status(200).json({ reply });
    } catch (err) {
        console.error('Chat handler error:', err);
        return res.status(500).json({ error: 'Internal error: ' + err.message });
    }
}