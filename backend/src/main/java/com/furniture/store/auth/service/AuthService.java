package com.furniture.store.auth.service;

import com.furniture.store.auth.dto.AuthResponse;
import com.furniture.store.auth.dto.LoginRequest;
import com.furniture.store.auth.dto.RefreshTokenRequest;
import com.furniture.store.auth.dto.RegisterRequest;
import com.furniture.store.auth.dto.UserSummaryDto;
import com.furniture.store.auth.security.JwtTokenProvider;
import com.furniture.store.auth.security.TokenBlacklistService;
import com.furniture.store.exception.DuplicateResourceException;
import com.furniture.store.exception.UnauthorizedException;
import com.furniture.store.user.entity.Role;
import com.furniture.store.user.entity.User;
import com.furniture.store.user.entity.UserStatus;
import com.furniture.store.user.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;
    private final TokenBlacklistService tokenBlacklistService;

    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtTokenProvider tokenProvider,
            TokenBlacklistService tokenBlacklistService
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenProvider = tokenProvider;
        this.tokenBlacklistService = tokenBlacklistService;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String normalizedEmail = request.email().trim().toLowerCase();
        if (userRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            throw new DuplicateResourceException("An account with this email already exists.");
        }

        String hashedPassword = passwordEncoder.encode(request.password());

        User user = new User(
                normalizedEmail,
                hashedPassword,
                request.firstName().trim(),
                request.lastName().trim(),
                request.phone() != null ? request.phone().trim() : null,
                Role.CUSTOMER,
                UserStatus.ACTIVE
        );

        User savedUser = userRepository.save(user);

        String accessToken = tokenProvider.generateAccessToken(savedUser.getId(), savedUser.getEmail(), savedUser.getRole());
        String refreshToken = tokenProvider.generateRefreshToken(savedUser.getId());
        long expiresIn = tokenProvider.getExpirationMs() / 1000;

        return AuthResponse.of(accessToken, refreshToken, expiresIn, UserSummaryDto.fromEntity(savedUser));
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        String normalizedEmail = request.email().trim().toLowerCase();
        User user = userRepository.findByEmailIgnoreCase(normalizedEmail)
                .orElseThrow(() -> new UnauthorizedException("Email or password is incorrect."));

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new UnauthorizedException("Email or password is incorrect.");
        }

        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new UnauthorizedException("Your account is " + user.getStatus().name().toLowerCase() + ". Please contact support.");
        }

        String accessToken = tokenProvider.generateAccessToken(user.getId(), user.getEmail(), user.getRole());
        String refreshToken = tokenProvider.generateRefreshToken(user.getId());
        long expiresIn = tokenProvider.getExpirationMs() / 1000;

        return AuthResponse.of(accessToken, refreshToken, expiresIn, UserSummaryDto.fromEntity(user));
    }

    @Transactional(readOnly = true)
    public AuthResponse refresh(RefreshTokenRequest request) {
        String refreshToken = request.refreshToken();
        if (!tokenProvider.validateToken(refreshToken) || !tokenProvider.isRefreshToken(refreshToken)) {
            throw new UnauthorizedException("Invalid or expired refresh token.");
        }

        String userId = tokenProvider.getUserIdFromToken(refreshToken);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UnauthorizedException("User associated with refresh token not found."));

        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new UnauthorizedException("User account is inactive.");
        }

        String newAccessToken = tokenProvider.generateAccessToken(user.getId(), user.getEmail(), user.getRole());
        String newRefreshToken = tokenProvider.generateRefreshToken(user.getId());
        long expiresIn = tokenProvider.getExpirationMs() / 1000;

        return AuthResponse.of(newAccessToken, newRefreshToken, expiresIn, UserSummaryDto.fromEntity(user));
    }

    public void logout(String accessToken, String refreshToken) {
        if (accessToken != null && !accessToken.isBlank()) {
            tokenBlacklistService.blacklistToken(accessToken);
        }
        if (refreshToken != null && !refreshToken.isBlank()) {
            tokenBlacklistService.blacklistToken(refreshToken);
        }
    }
}
