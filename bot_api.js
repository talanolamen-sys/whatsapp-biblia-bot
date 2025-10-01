// ARQUIVO: bot_api.js (NO SEU VPS)

// --- MÓDULOS NECESSÁRIOS (Instale via npm install) ---
const express = require('express');
const { Client, LocalAuth } = require('whatsapp-web.js'); 
const qrcode = require('qrcode-terminal');
const fs = require('fs');

const app = express();
const port = 3000; // ⚠️ Certifique-se de que esta porta está aberta no Firewall do seu VPS!

// --- CONFIGURAÇÃO DO CLIENTE WHATSAPP ---
const client = new Client({
    authStrategy: new LocalAuth({ clientId: "portal_cristao_bot" }),
    // Adapte o puppeteerArgs se o seu VPS tiver problemas com a execução do Chrome
    puppeteer: { 
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    }
});

client.on('qr', (qr) => {
    // Escaneie este QR Code no seu celular (será exibido no terminal do VPS)
    qrcode.generate(qr, { small: true });
    console.log('QR CODE GERADO. Escaneie para conectar.');
});

client.on('ready', () => {
    console.log('✅ Cliente WhatsApp está pronto e conectado! API ONLINE.');
});

client.on('auth_failure', msg => {
    console.error('Falha de autenticação. Reinicie e escaneie o QR Code novamente.', msg);
});

client.on('disconnected', (reason) => {
    console.log('Cliente desconectado.', reason);
    // Reinicie o bot ou adote medidas de reconexão
});

client.initialize();

// --- CONFIGURAÇÃO DA API (ENDPOINT) ---
app.use(express.json()); // Para processar o JSON enviado do PHP (Hostinger)

// Endpoint que o seu cron.php chamará
app.post('/send-group-message', async (req, res) => {
    // group_id: IfUoLXjKBSg97i8C4qGwmO
    // message: "O texto formatado"
    const { group_id, message, token } = req.body; 
    
    // ⚠️ Adicione uma verificação de segurança (TOKEN) aqui, se necessário ⚠️
    // if (token !== 'seu_token_secreto') { return res.status(401).json({ status: 'error', reason: 'Token inválido' }); }

    // Verifica o status do cliente antes de enviar
    if (client.info && client.info.me) {
        try {
            // Formata o ID do grupo para o padrão do WhatsApp-web.js
            const chatId = group_id.includes('@g.us') ? group_id : `${group_id}@g.us`;
            
            // Tenta enviar a mensagem
            const response = await client.sendMessage(chatId, message);
            
            console.log(`[SUCESSO] Mensagem enviada para ${group_id}`);
            res.status(200).json({ status: 'sent', id: response.id._serialized });
            
        } catch (error) {
            console.error('[ERRO DE ENVIO]:', error);
            res.status(500).json({ status: 'error', reason: 'Erro ao enviar mensagem: ' + error.message });
        }
    } else {
        res.status(503).json({ status: 'error', reason: 'WhatsApp client não está conectado ou pronto.' });
    }
});

app.listen(port, () => {
    console.log(`🚀 API de envio rodando em http://localhost:${port}`);
});

// Arquivo de configuração de pacotes (package.json)
// Crie um arquivo package.json na mesma pasta com o conteúdo:
/*
{
  "name": "whatsapp-sender-api",
  "version": "1.0.0",
  "description": "API Gateway for WhatsApp scheduled messages.",
  "main": "bot_api.js",
  "scripts": {
    "start": "node bot_api.js"
  },
  "dependencies": {
    "express": "^4.19.2",
    "whatsapp-web.js": "^1.23.0",
    "qrcode-terminal": "^0.12.0"
  }
}
*/
