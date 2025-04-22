require("dotenv").config();
const express = require("express");
const axios = require("axios");
const bodyParser = require("body-parser");

const app = express();
app.use(bodyParser.json());

const DEFAULT_PROMPT = process.env.DEFAULT_PROMPT;
const PORT = 3000;

// Webhook endpoint yang dipakai Whacenter
app.post("/webhook", async (req, res) => {
  const { from, message, source } = req.body;

  // ✅ Validasi payload
  if (!from || !message || source !== "WHACENTER") {
    return res.status(400).send("Invalid or unauthorized payload");
  }

  // ✅ Cek kalau pesan kosong
  if (message.trim() === "") {
    return res.send("Kosong, tidak dijawab");
  }

  try {
    console.log(`[WA] ${from} > ${message}`);

    // ✅ Proses ke Gemini
    const reply = await getGeminiReply(message);
    console.log(`[Gemini] ${reply}`);

    // // Kirim status mengetik
    // await axios.post(process.env.WHACENTER_API_URL, {
    //   device_id: process.env.WHACENTER_DEVICE_ID,
    //   number: from,
    //   typing: true,
    // });

    // ✅ Simulasi delay biar human-like
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // ✅ Kirim balasan via Whacenter
    await axios.post(process.env.WHACENTER_API_URL, {
      device_id: process.env.WHACENTER_DEVICE_ID,
      number: from,
      message: reply,
    });

    res.send("Reply sent");
  } catch (err) {
    console.error("Error handling message:", err.response?.data || err.message);
    res.status(500).send("Error handling message");
  }
});

// Fungsi interaksi ke Google Gemini 2.0 Flash
async function getGeminiReply(userMessage) {
  const prompt = `${DEFAULT_PROMPT}\nUser: ${userMessage}\nAI:`;

  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const reply = response.data.candidates?.[0]?.content?.parts?.[0]?.text;
    return reply || "Maaf, saya belum bisa memberikan jawaban saat ini.";
  } catch (err) {
    console.error("Error from Gemini:", err.response?.data || err.message);
    return "Maaf, terjadi kesalahan pada sistem AI.";
  }
}

// 🔥 Start server
app.listen(PORT, () =>
  console.log(`✅ Gemini WhatsApp Bot aktif di http://localhost:${PORT}`)
);
