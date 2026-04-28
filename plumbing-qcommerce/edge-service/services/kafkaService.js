require('dotenv').config();
const { Kafka } = require('kafkajs');

const kafka = new Kafka({
    clientId: 'edge-gateway',
    brokers: [process.env.KAFKA_BROKER || 'localhost:9092']
});

const consumer = kafka.consumer({ groupId: 'edge-websocket-group' });

async function connectKafka(io) {
    try {
        await consumer.connect();
        console.log(`Kafka Consumer connected to ${process.env.KAFKA_BROKER || 'localhost:9092'}`);

        await consumer.subscribe({ topic: 'order-accepted', fromBeginning: false });

        await consumer.run({
            eachMessage: async ({ topic, partition, message }) => {
                const eventValue = message.value.toString();
                const headers = message.headers;
                console.log(`[KAFKA] Topic: ${topic} | Value: ${eventValue}`);
                if (headers && Object.keys(headers).length > 0) {
                    console.log(`[KAFKA] Headers:`, JSON.stringify(headers));
                }
                
                // Format: ORDER_ACCEPTED:123:PLUMBER:45:CUSTOMER:99
                if (topic === 'order-accepted') {
                    const parts = eventValue.split(':');
                    if (parts.length === 6) {
                        const orderId = parts[1];
                        const plumberId = parts[3];
                        const customerId = parts[5];

                        // Bounce event back to specific customer's WebSocket room
                        io.to(`customer_${customerId}`).emit('PLUMBER_ASSIGNED', {
                            orderId,
                            plumberId,
                            message: "A plumber has accepted your order and is en route!"
                        });
                        console.log(`Pushed PLUMBER_ASSIGNED to customer_${customerId}`);
                    }
                }
            },
        });
    } catch (error) {
        console.error('Error connecting to Kafka:', error);
    }
}

module.exports = { connectKafka };
