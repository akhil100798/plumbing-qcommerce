package com.pqc.core.migration;

import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import java.util.UUID;
import static org.assertj.core.api.Assertions.assertThat;

class PostgresV28MigrationTest {
    private DriverManagerDataSource dataSource; private String schema;
    @BeforeEach void setUp(){String url=com.pqc.core.testsupport.PostgresTestTargetGuard.requireUrl();String user=com.pqc.core.testsupport.PostgresTestTargetGuard.requireUsername();String pass=com.pqc.core.testsupport.PostgresTestTargetGuard.requirePassword();dataSource=new DriverManagerDataSource(url,user,pass);schema="phase2_v28_"+UUID.randomUUID().toString().replace("-","");new JdbcTemplate(dataSource).execute("CREATE SCHEMA "+schema);}
    @AfterEach void tearDown(){new JdbcTemplate(dataSource).execute("DROP SCHEMA IF EXISTS "+schema+" CASCADE");}
    @Test void addsRevisionCancellationAndCurrentIndexes(){Flyway.configure().dataSource(dataSource).schemas(schema).defaultSchema(schema).locations("classpath:db/migration").target("28").load().migrate();JdbcTemplate jdbc=new JdbcTemplate(dataSource);assertThat(jdbc.queryForObject("SELECT version FROM "+schema+".flyway_schema_history WHERE success=TRUE ORDER BY installed_rank DESC LIMIT 1",String.class)).isEqualTo("28");for(String c:new String[]{"revision_of_diagnosis_id","cancelled_at"})assertThat(jdbc.queryForObject("SELECT count(*) FROM information_schema.columns WHERE table_schema=? AND table_name='service_diagnoses' AND column_name=?",Integer.class,schema,c)).isEqualTo(1);assertThat(jdbc.queryForObject("SELECT count(*) FROM pg_indexes WHERE schemaname=? AND indexname in ('uq_service_diagnosis_one_draft','uq_service_diagnosis_one_submitted')",Integer.class,schema)).isEqualTo(2);}
}
