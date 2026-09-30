// api/chat.js
const GROQ_MODEL = 'openai/gpt-oss-120b';
const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 2000, 4000];

async function callGroq(apiKey, systemPrompt, messages) {
    const url = 'https://api.groq.com/openai/v1/chat/completions';

    const body = {
        model: GROQ_MODEL,
        messages: [
            { role: 'system', content: systemPrompt },
            ...messages
        ],
        temperature: 0.7,
        max_tokens: 500
    };

    let lastError = null;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify(body)
            });

            if (response.ok) {
                const data = await response.json();
                return { ok: true, data };
            }

            const errorData = await response.json().catch(() => ({}));
            const status = response.status;
            const errMsg = errorData.error?.message || `HTTP ${status}`;

            lastError = { status, message: errMsg };

            // Retry только на 429, 502, 503, 504
            const retryable = [429, 502, 503, 504].includes(status);

            if (!retryable) {
                return { ok: false, status, error: errMsg };
            }

            if (attempt === MAX_RETRIES) {
                return { ok: false, status, error: errMsg, exhausted: true };
            }

            const delay = RETRY_DELAYS[attempt] || 4000;
            console.log(`Attempt ${attempt + 1} failed (${status}): ${errMsg}. Retrying in ${delay}ms...`);
            await new Promise(r => setTimeout(r, delay));

        } catch (err) {
            lastError = { status: 0, message: err.message };
            if (attempt === MAX_RETRIES) {
                return { ok: false, status: 0, error: err.message, exhausted: true };
            }
            const delay = RETRY_DELAYS[attempt] || 4000;
            await new Promise(r => setTimeout(r, delay));
        }
    }

    return { ok: false, status: 0, error: lastError?.message || 'Unknown error', exhausted: true };
}

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { message, history } = req.body || {};
    if (!message || typeof message !== 'string') {
        return res.status(400).json({ error: 'Message is required' });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: 'API key not configured' });
    }

    const systemPrompt = `Ты — ассистент digital-агентства Kassel Digital Solutions.

Мы помогаем бизнесу в Касселе и Германии:
- Создаём сайты под ключ (от 1500€, срок 3-4 недели)
- Настраиваем рекламу в соцсетях: TikTok, Instagram, Facebook (от 500€/мес)
- Создаём видео: рекламные ролики, Reels, TikTok-видео (от 800€ за ролик)
- Продвигаем в TikTok и Instagram (от 300€/мес)
- Ведём контент-маркетинг

Наши результаты: 120+ проектов, 40+ клиентов, 7+ лет опыта.

Контакты:
- Email: [укажи свой]
- Телефон: [укажи свой]
- Адрес: Kassel, Germany

Правила:
- Отвечай кратко (2-3 предложения), дружелюбно и по делу
- Если клиент пишет по-немецки — отвечай по-немецки
- Если по-английски — отвечай по-английски
- Если по-русски — отвечай по-русски
- Если не знаешь точного ответа — предложи связаться по email или телефону
- Не выдумывай цены и сроки, которых нет выше
- Не говори, что ты AI, если не спросят напрямую`;

    const messages = [];
    if (Array.isArray(history)) {
        for (const item of history.slice(-10)) {
            if (item.role === 'user' || item.role === 'assistant') {
                messages.push({
                    role: item.role === 'model' ? 'assistant' : 'user',
                    content: String(item.text || '')
                });
            }
        }
    }
    messages.push({ role: 'user', content: message });

    const result = await callGroq(apiKey, systemPrompt, messages);

    if (!result.ok) {
        if (result.exhausted) {
            return res.status(200).json({
                reply: 'Извините, сейчас у меня технический перерыв. Пожалуйста, напишите нам на email или попробуйте через минуту.',
                _debug: result.error
            });
        }
        return res.status(result.status || 500).json({ error: result.error });
    }

    const reply = result.data.choices?.[0]?.message?.content
        || 'Извините, не могу сейчас ответить. Свяжитесь с нами по email.';

    return res.status(200).json({ reply });
}