package com.furniture.store.auth.dto;

import com.furniture.store.user.entity.Role;
import com.furniture.store.user.entity.User;
import com.furniture.store.user.entity.UserStatus;

import java.time.Instant;

public record UserSummaryDto(
        String id,
        String email,
        String firstName,
        String lastName,
        String phone,
        Role role,
        UserStatus status,
        Instant createdAt
) {
    public static UserSummaryDto fromEntity(User user) {
        return new UserSummaryDto(
                user.getId(),
                user.getEmail(),
                user.getFirstName(),
                user.getLastName(),
                user.getPhone(),
                user.getRole(),
                user.getStatus(),
                user.getCreatedAt()
        );
    }
}
