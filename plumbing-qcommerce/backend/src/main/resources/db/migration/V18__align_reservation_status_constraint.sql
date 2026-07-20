ALTER TABLE inventory_reservations DROP CONSTRAINT IF EXISTS inventory_reservations_status_check;
ALTER TABLE inventory_reservations ADD CONSTRAINT inventory_reservations_status_check CHECK (status IN (
    'PENDING',
    'CONFIRMED',
    'COMPLETED',
    'RELEASED'
));
