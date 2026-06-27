ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE users
ADD CONSTRAINT users_role_check
CHECK (
    role IN (
        'CUSTOMER',
        'PLUMBER',
        'STORE_MANAGER',
        'DELIVERY_PARTNER',
        'ADMIN',
        'SUPER_ADMIN',
        'OPERATIONS_ADMIN',
        'PLUMBER_MANAGER',
        'FINANCE_ADMIN',
        'SUPPORT_ADMIN',
        'MARKETING_ADMIN'
    )
);
