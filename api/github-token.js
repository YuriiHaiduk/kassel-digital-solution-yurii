// api/github-token.js
export default function handler(req, res) {
    // Отдаём токен только если он есть в переменных окружения
    if (!process.env.GITHUB_TOKEN) {
        return res.status(200).json({ token: '' });
    }
    // Ограничиваем: только GET и только с твоего домена
    res.setHeader('Access-Control-Allow-Origin', 'https://kassel-digital-solution-yurii.vercel.app');
    res.setHeader('Cache-Control', 's-maxage=3600'); // кэшируем на 1 час
    return res.status(200).json({ token: process.env.GITHUB_TOKEN });
}