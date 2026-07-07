package com.pqc.core.migration;

import com.pqc.core.entity.ProductOrderStatus;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ProductOrderStatusMigrationTest {

    @Test
    void productOrderStatusConstraintMigrationIncludesEveryApplicationStatus() throws IOException {
        InputStream migrationStream = getClass().getClassLoader()
                .getResourceAsStream("db/migration/V11__align_product_order_status_constraint.sql");

        assertNotNull(migrationStream, "Expected V11 product order status constraint migration");

        String migrationSql = new String(migrationStream.readAllBytes(), StandardCharsets.UTF_8);
        assertTrue(migrationSql.contains("product_orders_status_check"));
        assertTrue(migrationSql.contains("READY_FOR_PICKUP"));
        assertTrue(migrationSql.contains("UPDATE product_orders"));

        for (ProductOrderStatus status : ProductOrderStatus.values()) {
            assertTrue(
                    migrationSql.contains("'" + status.name() + "'"),
                    () -> "Expected V11 migration to include product order status " + status.name()
            );
        }
    }
}
