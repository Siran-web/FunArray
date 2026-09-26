package com.furniture.store.user.dto;

import com.furniture.store.user.entity.Role;
import com.furniture.store.user.entity.User;
import com.furniture.store.user.entity.UserStatus;

import java.time.Instant;

public record UserProfileDto(
        String id,
        String email,
        String firstName,
        String lastName,
        String phone,
        Role role,
        UserStatus status,
        Instant createdAt,
        Instant updatedAt
) {
    public static UserProfileDto fromEntity(User user) {
        return new UserProfileDto(
                user.getId(),
                user.getEmail(),
                user.getFirstName(),
                user.getLastName(),
                user.getPhone(),
                user.getRole(),
                user.getStatus(),
                user.getCreatedAt(),
                user.getUpdatedAt()
        );
    }
}
