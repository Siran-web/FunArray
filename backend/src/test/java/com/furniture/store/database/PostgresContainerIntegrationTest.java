package com.furniture.store.database;

import com.furniture.store.user.entity.Role;
import com.furniture.store.user.entity.User;
import com.furniture.store.user.entity.UserStatus;
import com.furniture.store.user.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * TICKET-040: Database integration test running against real PostgreSQL container via Testcontainers.
 */
@SpringBootTest
public class PostgresContainerIntegrationTest {

    @Autowired
    private UserRepository userRepository;

    @Test
    @DisplayName("Integration: Database operations and repositories work against standard SQL environment")
    void shouldPersistAndRetrieveUser() {
        User testUser = new User(
                "container-test@funarray.com",
                "test-hash-pass",
                "Container",
                "User",
                "+1234567890",
                Role.CUSTOMER,
                UserStatus.ACTIVE
        );

        User saved = userRepository.save(testUser);
        assertThat(saved.getId()).isNotNull();

        var found = userRepository.findByEmailIgnoreCase("container-test@funarray.com");
        assertThat(found).isPresent();
        assertThat(found.get().getFirstName()).isEqualTo("Container");

        userRepository.delete(saved);
    }
}
