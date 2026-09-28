// Netlify Function: Telegram bot webhook
// Bu fayl 24/7 Netlify serverida ishlaydi, hech qanday kompyuter yoqilib turishi shart emas.

const TELEGRAM_TOKEN = "8997483422:AAGJJrSCqemUpWmyPpI_WbdMX0zfb730TfY";
const CODECRAFT_API_URL = "https://codecraftapi.com/v1/chat/completions";
const CODECRAFT_API_KEY = "cc_ddTTa582NGQdGgHLw771PK32ZxRheEyqF3YJaOuVHjDhOpXp";
const MODEL = "claude-opus-5.5";

async function sendTelegram(chatId, text) {
  // Telegram xabar uzunligi cheklangan, shuning uchun uzun javoblarni bo'lib yuboramiz
  const chunks = [];
  let t = text || "(bo'sh javob)";
  while (t.length > 0) {
    chunks.push(t.slice(0, 4000));
    t = t.slice(4000);
  }
  for (const chunk of chunks) {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: chunk }),
    });
  }
}

exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 200, body: "OK" };
  }

  try {
    const update = JSON.parse(event.body || "{}");
    const message = update.message;
    if (!message || !message.text) {
      return { statusCode: 200, body: "OK" };
    }

    const chatId = message.chat.id;
    const text = message.text;

    if (text === "/start") {
      await sendTelegram(chatId, "Salom! 👋 Men AI yordamchiman. Menga istalgan savolingizni yozing.");
      return { statusCode: 200, body: "OK" };
    }

    const res = await fetch(CODECRAFT_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${CODECRAFT_API_KEY}`,
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 1,
        max_tokens: 4096,
        messages: [{ role: "user", content: text }],
      }),
    });

    const rawText = await res.text();
    let data;
    try {
      data = JSON.parse(rawText);
    } catch (e) {
      await sendTelegram(chatId, "⚠️ API'dan noto'g'ri javob keldi (" + res.status + "): " + rawText.slice(0, 300));
      return { statusCode: 200, body: "OK" };
    }

    if (!res.ok) {
      const detail = (data.error && data.error.message) || JSON.stringify(data);
      await sendTelegram(chatId, "⚠️ Xatolik (" + res.status + "): " + detail);
      return { statusCode: 200, body: "OK" };
    }

    const reply = (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || "(bo'sh javob)";
    await sendTelegram(chatId, reply);

    return { statusCode: 200, body: "OK" };
  } catch (err) {
    // Telegram doim 200 kutadi, aks holda qayta-qayta urinib, spam qiladi
    return { statusCode: 200, body: "OK" };
  }
};
