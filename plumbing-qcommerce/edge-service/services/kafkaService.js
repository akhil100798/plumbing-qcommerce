require('dotenv').config();
const { Kafka } = require('kafkajs');
const { findNearbyDeliveryPartners } = require('./deliveryService');

const kafka = new Kafka({
    clientId: 'edge-gateway',
    brokers: [process.env.KAFKA_BROKER || 'localhost:9092']
});

const consumer = kafka.consumer({ groupId: 'edge-websocket-group' });

/**
 * Shared helper: find nearby delivery partners and broadcast a DELIVERY_JOB_OFFER.
 * Works for both regular product orders AND plumber mid-job material orders.
 */
async function dispatchDeliveryPartners(io, data) {
    const nearbyPartners = await findNearbyDeliveryPartners(data.storeLongitude, data.storeLatitude, 10);
    const top3 = nearbyPartners.slice(0, 3);

    if (top3.length === 0) {
        console.log(`No active delivery partners found near store.`);
        return;
    }

    for (const partner of top3) {
        io.to(`delivery_${partner.partnerId}`).emit('DELIVERY_JOB_OFFER', {
            orderId: data.orderId,
            storeId: data.storeId,
            customerId: data.customerId,
            serviceOrderId: data.serviceOrderId || null,  // Phase 3 — present for material orders
            distance: partner.distance
        });
        console.log(`Pushed DELIVERY_JOB_OFFER for order ${data.orderId} to delivery_${partner.partnerId}`);
    }
}

async function connectKafka(io) {
    try {
        await consumer.connect();
        console.log(`Kafka Consumer connected to ${process.env.KAFKA_BROKER || 'localhost:9092'}`);

        await consumer.subscribe({ topic: 'order-accepted', fromBeginning: false });
        await consumer.subscribe({ topic: 'order-confirmed', fromBeginning: false });
        await consumer.subscribe({ topic: 'material-request-created', fromBeginning: false });
        await consumer.subscribe({ topic: 'material-order-confirmed', fromBeginning: false });

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

                if (topic === 'order-confirmed') {
                    try {
                        const data = JSON.parse(eventValue);
                        console.log(`[KAFKA] Order confirmed:`, data);
                        await dispatchDeliveryPartners(io, data);
                    } catch (err) {
                        console.error('Failed to handle order-confirmed event:', err);
                    }
                }

                // Phase 3: Plumber raised a mid-job material request
                // → Push a payment approval prompt to the customer
                if (topic === 'material-request-created') {
                    try {
                        const data = JSON.parse(eventValue);
                        console.log(`[KAFKA] Material request created:`, data);
                        io.to(`customer_${data.customerId}`).emit('MATERIAL_PAYMENT_REQUIRED', {
                            productOrderId: data.productOrderId,
                            serviceOrderId: data.serviceOrderId,
                            plumberName: data.plumberName,
                            totalAmount: data.totalAmount,
                            message: `Your plumber ${data.plumberName} needs parts for the job. Please approve the payment of ₹${data.totalAmount}.`
                        });
                        console.log(`Pushed MATERIAL_PAYMENT_REQUIRED to customer_${data.customerId}`);
                    } catch (err) {
                        console.error('Failed to handle material-request-created event:', err);
                    }
                }

                // Phase 3: Customer paid for parts → trigger delivery dispatch
                // AND notify the on-site plumber that parts are en route
                if (topic === 'material-order-confirmed') {
                    try {
                        const data = JSON.parse(eventValue);
                        console.log(`[KAFKA] Material order confirmed:`, data);
                        await dispatchDeliveryPartners(io, data);
                        // Notify the plumber at the job site
                        if (data.serviceOrderId) {
                            io.to(`service_${data.serviceOrderId}`).emit('PARTS_EN_ROUTE', {
                                productOrderId: data.orderId,
                                message: 'Parts approved and a delivery partner has been dispatched to your location.'
                            });
                            console.log(`Pushed PARTS_EN_ROUTE to service_${data.serviceOrderId} room`);
                        }
                    } catch (err) {
                        console.error('Failed to handle material-order-confirmed event:', err);
                    }
                }
            },
        });
    } catch (error) {
        console.error('Error connecting to Kafka:', error);
    }
}

module.exports = { connectKafka };
