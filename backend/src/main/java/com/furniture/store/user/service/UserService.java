package com.furniture.store.user.service;

import com.furniture.store.exception.ResourceNotFoundException;
import com.furniture.store.user.dto.UserProfileDto;
import com.furniture.store.user.entity.User;
import com.furniture.store.user.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public UserProfileDto getUserProfile(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
        return UserProfileDto.fromEntity(user);
    }
}
