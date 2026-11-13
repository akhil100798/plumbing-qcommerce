package com.pqc.core.config;

import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.core.env.Environment;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.Statement;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class DatabaseIsolationRuntimeGuardTest {

    @Test
    void rejectsFixkartPostgresNewInStagingProfile() {
        Environment env = mock(Environment.class);
        when(env.getActiveProfiles()).thenReturn(new String[]{"staging"});

        assertThrows(IllegalStateException.class, () ->
            DatabaseIsolationRuntimeGuard.validateJdbcUrl(
                "jdbc:postgresql://ep-silent-hill.render.com:5432/fixkart_postgres_new", env
            )
        );

        assertThrows(IllegalStateException.class, () ->
            DatabaseIsolationRuntimeGuard.validateJdbcUrl(
                "postgresql://admin:secret@localhost:5432/fixkart_postgres_new", env
            )
        );
    }

    @Test
    void rejectsRenderCloudHostInStagingProfile() {
        Environment env = mock(Environment.class);
        when(env.getActiveProfiles()).thenReturn(new String[]{"staging"});

        assertThrows(IllegalStateException.class, () ->
            DatabaseIsolationRuntimeGuard.validateJdbcUrl(
                "jdbc:postgresql://dpg-test-a.oregon-postgres.render.com:5432/staging_db", env
            )
        );
    }

    @Test
    void acceptsLocalStagingDatabaseUrl() {
        Environment env = mock(Environment.class);
        when(env.getActiveProfiles()).thenReturn(new String[]{"staging"});

        assertDoesNotThrow(() ->
            DatabaseIsolationRuntimeGuard.validateJdbcUrl(
                "jdbc:postgresql://127.0.0.1:5434/fixkart_staging_local", env
            )
        );
    }

    @Test
    void acceptsProductionUrlWhenProfileIsProd() {
        Environment env = mock(Environment.class);
        when(env.getActiveProfiles()).thenReturn(new String[]{"prod"});

        assertDoesNotThrow(() ->
            DatabaseIsolationRuntimeGuard.validateJdbcUrl(
                "jdbc:postgresql://dpg-test-a.oregon-postgres.render.com:5432/fixkart_postgres_new", env
            )
        );
    }

    @Test
    void verifiesLiveDatabaseConnectionIdentityThrowsOnProdDb() throws Exception {
        DataSource ds = mock(DataSource.class);
        Connection conn = mock(Connection.class);
        Statement stmt = mock(Statement.class);
        ResultSet rs = mock(ResultSet.class);
        Environment env = mock(Environment.class);

        when(env.getActiveProfiles()).thenReturn(new String[]{"staging"});
        when(ds.getConnection()).thenReturn(conn);
        when(conn.createStatement()).thenReturn(stmt);
        when(stmt.executeQuery("SELECT current_database(), current_user, version()")).thenReturn(rs);
        when(rs.next()).thenReturn(true);
        when(rs.getString(1)).thenReturn("fixkart_postgres_new");
        when(rs.getString(2)).thenReturn("postgres");
        when(rs.getString(3)).thenReturn("PostgreSQL 18");

        DatabaseIsolationRuntimeGuard guard = new DatabaseIsolationRuntimeGuard(ds, env);

        assertThrows(IllegalStateException.class, () -> guard.run(null));
    }

    @Test
    void verifiesLiveDatabaseConnectionIdentityAcceptsStagingDb() throws Exception {
        DataSource ds = mock(DataSource.class);
        Connection conn = mock(Connection.class);
        Statement stmt = mock(Statement.class);
        ResultSet rs = mock(ResultSet.class);
        ResultSet rsHost = mock(ResultSet.class);
        Environment env = mock(Environment.class);

        when(env.getActiveProfiles()).thenReturn(new String[]{"staging"});
        when(ds.getConnection()).thenReturn(conn);
        when(conn.createStatement()).thenReturn(stmt);
        when(stmt.executeQuery("SELECT current_database(), current_user, version()")).thenReturn(rs);
        when(rs.next()).thenReturn(true);
        when(rs.getString(1)).thenReturn("fixkart_staging_local");
        when(rs.getString(2)).thenReturn("fixkart_staging_user");
        when(rs.getString(3)).thenReturn("PostgreSQL 18.6");

        when(stmt.executeQuery("SELECT inet_server_addr()")).thenReturn(rsHost);
        when(rsHost.next()).thenReturn(true);
        when(rsHost.getObject(1)).thenReturn("127.0.0.1");

        DatabaseIsolationRuntimeGuard guard = new DatabaseIsolationRuntimeGuard(ds, env);

        assertDoesNotThrow(() -> guard.run(null));
    }
}
