package com.pqc.core.migration;

import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import java.util.UUID;
import static org.assertj.core.api.Assertions.assertThat;

class PostgresV27MigrationTest {
    private DriverManagerDataSource dataSource; private String schema;
    @BeforeEach void setUp() { String url=com.pqc.core.testsupport.PostgresTestTargetGuard.requireUrl(); String user=com.pqc.core.testsupport.PostgresTestTargetGuard.requireUsername(); String pass=com.pqc.core.testsupport.PostgresTestTargetGuard.requirePassword(); dataSource=new DriverManagerDataSource(url,user,pass); schema="phase2_v27_"+UUID.randomUUID().toString().replace("-",""); new JdbcTemplate(dataSource).execute("CREATE SCHEMA "+schema); }
    @AfterEach void tearDown(){new JdbcTemplate(dataSource).execute("DROP SCHEMA IF EXISTS "+schema+" CASCADE");}
    @Test void extendsDiagnosisContractAfterV26(){Flyway.configure().dataSource(dataSource).schemas(schema).defaultSchema(schema).target("27").locations("classpath:db/migration").load().migrate(); JdbcTemplate jdbc=new JdbcTemplate(dataSource); assertThat(jdbc.queryForObject("SELECT version FROM "+schema+".flyway_schema_history WHERE success=TRUE ORDER BY installed_rank DESC LIMIT 1",String.class)).isEqualTo("27"); for(String column:new String[]{"affected_component","diagnosis_narrative","estimated_labor_units","safety_blocked","optimistic_version"}) assertThat(jdbc.queryForObject("SELECT count(*) FROM information_schema.columns WHERE table_schema=? AND table_name='service_diagnoses' AND column_name=?",Integer.class,schema,column)).isEqualTo(1); }
}
