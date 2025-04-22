require('dotenv').config();
const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

// Prompt bisa kamu ubah-ubah sesuai bisnis kamu
const DEFAULT_PROMPT = process.env.DEFAULT_PROMPT;

// 🔥 Listen dari WhatsApp Webhook (via Whacenter)
app.post('/webhook', async (req, res) => {
    const { number, message } = req.body;

    if (!number || !message) return res.status(400).send("Invalid payload");

    try {
        // 💬 Generate balasan dari Gemini AI
        const reply = await getGeminiReply(message);

        // 🚀 Kirim balasan via Whacenter
        await axios.post(process.env.WHACENTER_API_URL, {
            device_id: process.env.WHACENTER_DEVICE_ID,
            number: number,
            message: reply
        });

        res.send("Reply sent");
    } catch (err) {
        console.error(err);
        res.status(500).send("Error handling message");
    }
});

// Fungsi untuk interaksi ke Gemini (Google AI)
async function getGeminiReply(userMessage) {
    const prompt = `${DEFAULT_PROMPT}\nUser: ${userMessage}\nAI:`;

    const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
            contents: [{ parts: [{ text: prompt }] }]
        }
    );

    return response.data.candidates?.[0]?.content?.parts?.[0]?.text || "Maaf, saya tidak bisa menjawab saat ini.";
}

// Run server
const PORT = 3000;
app.listen(PORT, () => console.log(`Bot aktif di http://localhost:${PORT}`));
