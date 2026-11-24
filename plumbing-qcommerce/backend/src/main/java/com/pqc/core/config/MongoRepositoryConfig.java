package com.pqc.core.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.data.mongodb.repository.config.EnableMongoRepositories;

@Configuration
@Profile("!staging & !prod")
@EnableMongoRepositories(basePackages = "com.pqc.core.document")
public class MongoRepositoryConfig {
}
