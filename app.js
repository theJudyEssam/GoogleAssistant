const express = require('express');
const mqtt = require('mqtt');
const app = express();

// MQTT Configuration - Using free public broker for testing
const MQTT_BROKER = 'mqtt://broker.emqx.io:8883'; // Free public broker
// For your own broker, replace with: 'mqtt://your-esp32-ip:1883'

const mqttClient = mqtt.connect(MQTT_BROKER);

mqttClient.on('connect', () => {
    console.log('Connected to MQTT broker');
});

app.use(express.json());

// Webhook endpoint for Google Assistant
app.post('/webhook', (req, res) => {
    console.log('Google Assistant Request:', JSON.stringify(req.body, null, 2));
    
    const intent = req.body.handler?.name || req.body.intent?.name;
    const queryText = req.body.intent?.query || '';
    
    let ledCommand = '';
    let responseText = '';
    
    // Simple command parsing
    if (queryText.toLowerCase().includes('turn on') || 
        queryText.toLowerCase().includes('on') ||
        intent === 'led_on') {
        ledCommand = 'on';
        responseText = 'LED turned on';
    } else if (queryText.toLowerCase().includes('turn off') || 
               queryText.toLowerCase().includes('off') ||
               intent === 'led_off') {
        ledCommand = 'on';
        responseText = 'LED turned off';
    } else {
        responseText = 'Sorry, I didn\'t understand that command';
    }
    
    // Send to MQTT if we have a command
    if (ledCommand) {
        mqttClient.publish('esp32/led', ledCommand);
        console.log(`Sent to MQTT: ${ledCommand}`);
    }
    
    // Respond to Google Assistant
    res.json({
        prompt: {
            override: false,
            firstSimple: {
                speech: responseText,
                text: responseText
            }
        }
    });
});

// Health check
app.get('/', (req, res) => {
    res.json({ 
        status: 'OK', 
        mqtt_connected: mqttClient.connected,
        message: 'ESP32 LED Controller Webhook Ready'
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Webhook server running on port ${PORT}`);
});