UPDATE product_orders
SET status = 'READY_FOR_PICKUP'
WHERE status = 'READY';

ALTER TABLE product_orders
    DROP CONSTRAINT IF EXISTS product_orders_status_check;

ALTER TABLE product_orders
    ADD CONSTRAINT product_orders_status_check
    CHECK (status IN (
        'PENDING',
        'CONFIRMED',
        'PACKING',
        'READY_FOR_PICKUP',
        'OUT_FOR_DELIVERY',
        'DELIVERED',
        'FAILED',
        'CANCELLED'
    ));
