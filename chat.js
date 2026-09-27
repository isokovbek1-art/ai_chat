// Netlify Function: /.netlify/functions/chat
// Bu kod Netlify serverida ishlaydi, API kalit shu yerda xavfsiz saqlanadi.
// Kalitni Netlify saytida: Site settings -> Environment variables -> CODECRAFT_API_KEY

exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  // Kalit shu yerga o'rnatildi. Bu xavfsiz, chunki bu fayl faqat
  // Netlify serverida ishlaydi va tashrif buyuruvchiga hech qachon yuborilmaydi.
  const API_KEY = process.env.CODECRAFT_API_KEY || "cc_ddTTa582NGQdGgHLw771PK32ZxRheEyqF3YJaOuVHjDhOpXp";
  const API_URL = "https://codecraftapi.com/v1/chat/completions";
  const MODEL = "claude-opus-5.5";

  if (!API_KEY) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "CODECRAFT_API_KEY sozlanmagan. Netlify -> Site settings -> Environment variables bo'limida qo'shing." }),
    };
  }

  try {
    const body = JSON.parse(event.body || "{}");
    const messages = body.messages || [];

    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 1,
        max_tokens: 4096,
        messages: messages,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      return {
        statusCode: res.status,
        body: JSON.stringify({ error: data.error?.message || JSON.stringify(data) }),
      };
    }

    const reply = data.choices?.[0]?.message?.content || JSON.stringify(data);
    return { statusCode: 200, body: JSON.stringify({ reply }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
