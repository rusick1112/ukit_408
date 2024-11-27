const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const axios = require('axios');
const { WebSocketServer } = require('ws');

require('dotenv').config();

const app = express();
const PORT = 5000;

app.use(cors());
app.use(bodyParser.json());

// WebSocket-сервер
const wss = new WebSocketServer({ port: 5001 });
wss.on('connection', (ws) => {
    console.log('Клиент подключен');

    ws.on('message', async (data) => {
        const { messages } = JSON.parse(data);

        try {
            // Отправка запроса к API
            const response = await axios.post(
                'https://api.deepinfra.com/v1/openai/chat/completions',
                {
                    model: "meta-llama/Meta-Llama-3-8B-Instruct",
                    messages
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${process.env.DEEPINFRA_TOKEN}`
                    }
                }
            );

            // Отправка ответа клиенту
            if (response.data.choices && response.data.choices[0] && response.data.choices[0].message) {
                ws.send(JSON.stringify(response.data.choices[0].message));
            } else {
                throw new Error("Некорректный ответ от API");
            }
        } catch (error) {
            console.error('Ошибка при обращении к API:', error.message);
            ws.send(JSON.stringify({ role: 'error', content: 'Ошибка подключения к API' }));
        }
    });

    ws.on('close', () => console.log('Клиент отключился'));
});

app.listen(PORT, () => {
    console.log(`HTTP сервер запущен на порту: http://localhost:${PORT}`);
});
console.log('WebSocket сервер запущен: ws://localhost:5001');
