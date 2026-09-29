// api/chat.js
const GEMINI_MODEL = 'gemini-3.8-flash';
const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 2000, 4000]; // 1с, 2с, 4с

async function callGemini(apiKey, systemPrompt, contents) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

    const body = {
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents,
        generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 500
        }
    };

    let lastError = null;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            // Успех
            if (response.ok) {
                const data = await response.json();
                return { ok: true, data };
            }

            // Получаем текст ошибки
            const errorData = await response.json().catch(() => ({}));
            const status = response.status;
            const errMsg = errorData.error?.message || `HTTP ${status}`;

            lastError = { status, message: errMsg };

            // Retry только на 503, 502, 504, 429 (временные ошибки)
            const retryable = [429, 502, 503, 504].includes(status);

            if (!retryable) {
                // 400, 401, 403, 404 — постоянные ошибки, retry бесполезен
                return { ok: false, status, error: errMsg };
            }

            // Если это была последняя попытка — выходим
            if (attempt === MAX_RETRIES) {
                return { ok: false, status, error: errMsg, exhausted: true };
            }

            // Ждём перед следующей попыткой
            const delay = RETRY_DELAYS[attempt] || 4000;
            console.log(`Attempt ${attempt + 1} failed (${status}): ${errMsg}. Retrying in ${delay}ms...`);
            await new Promise(r => setTimeout(r, delay));

        } catch (err) {
            // Сетевая ошибка — тоже retryable
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

    const apiKey = process.env.GEMINI_API_KEY;
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
    contents.push({ role: 'user', parts: [{ text: message }] });

    const result = await callGemini(apiKey, systemPrompt, contents);

    if (!result.ok) {
        // Если все retry исчерпаны — отдаём "мягкую" ошибку
        if (result.exhausted) {
            return res.status(200).json({
                reply: 'Извините, сейчас у меня технический перерыв. Пожалуйста, напишите нам на email или попробуйте через минуту.',
                _debug: result.error
            });
        }
        return res.status(result.status || 500).json({ error: result.error });
    }

    const data = result.data;
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text
        || 'Извините, не могу сейчас ответить. Свяжитесь с нами по email.';

    return res.status(200).json({ reply });
}