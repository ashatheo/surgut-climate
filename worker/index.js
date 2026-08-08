const ALLOWED_ORIGINS = [
    'https://xn--86-6kc5ajgi3c.xn--p1ai',
    'https://xn--86-6kc5ajgi3c.xn--p1ai:443',
    'http://localhost:5500',
    'http://127.0.0.1:5500',
];

function corsHeaders(origin) {
    const allowOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
    return {
        'Access-Control-Allow-Origin': allowOrigin,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    };
}

function isValidPhone(phone) {
    const digits = phone.replace(/\D/g, '');
    return digits.length >= 10 && digits.length <= 11;
}

async function sendTelegramMessage(env, text) {
    const url = `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`;
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: env.TELEGRAM_CHAT_ID,
            text,
            parse_mode: 'HTML',
        }),
    });
    if (!res.ok) {
        throw new Error(`Telegram API error: ${res.status}`);
    }
}

export default {
    async fetch(request, env) {
        const origin = request.headers.get('Origin') || '';
        const headers = corsHeaders(origin);

        if (request.method === 'OPTIONS') {
            return new Response(null, { status: 204, headers });
        }

        if (request.method !== 'POST') {
            return new Response(JSON.stringify({ ok: false, error: 'method_not_allowed' }), {
                status: 405,
                headers: { ...headers, 'Content-Type': 'application/json' },
            });
        }

        let data;
        try {
            data = await request.json();
        } catch {
            return new Response(JSON.stringify({ ok: false, error: 'invalid_json' }), {
                status: 400,
                headers: { ...headers, 'Content-Type': 'application/json' },
            });
        }

        const name = (data.name || '').toString().trim().slice(0, 100);
        const phone = (data.phone || '').toString().trim().slice(0, 30);
        const source = (data.source || 'Сайт').toString().trim().slice(0, 100);
        const details = (data.details || '').toString().trim().slice(0, 500);

        if (!name || !phone || !isValidPhone(phone)) {
            return new Response(JSON.stringify({ ok: false, error: 'invalid_fields' }), {
                status: 400,
                headers: { ...headers, 'Content-Type': 'application/json' },
            });
        }

        const lines = [
            '🔔 <b>Новая заявка с сайта</b>',
            `📄 Страница: ${escapeHtml(source)}`,
            `👤 Имя: ${escapeHtml(name)}`,
            `📞 Телефон: ${escapeHtml(phone)}`,
        ];
        if (details) {
            lines.push(`📋 Детали: ${escapeHtml(details)}`);
        }

        try {
            await sendTelegramMessage(env, lines.join('\n'));
        } catch (err) {
            return new Response(JSON.stringify({ ok: false, error: 'telegram_failed' }), {
                status: 502,
                headers: { ...headers, 'Content-Type': 'application/json' },
            });
        }

        return new Response(JSON.stringify({ ok: true }), {
            status: 200,
            headers: { ...headers, 'Content-Type': 'application/json' },
        });
    },
};

function escapeHtml(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}
