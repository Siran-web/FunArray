package com.furniture.store.auth;

import com.furniture.store.auth.dto.AuthResponse;
import com.furniture.store.auth.dto.LoginRequest;
import com.furniture.store.auth.dto.RegisterRequest;
import com.furniture.store.auth.security.JwtTokenProvider;
import com.furniture.store.auth.security.TokenBlacklistService;
import com.furniture.store.auth.service.AuthService;
import com.furniture.store.exception.DuplicateResourceException;
import com.furniture.store.exception.UnauthorizedException;
import com.furniture.store.user.entity.Role;
import com.furniture.store.user.entity.User;
import com.furniture.store.user.entity.UserStatus;
import com.furniture.store.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class AuthServiceUnitTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtTokenProvider tokenProvider;

    @Mock
    private TokenBlacklistService tokenBlacklistService;

    @InjectMocks
    private AuthService authService;

    private User sampleUser;

    @BeforeEach
    void setUp() {
        sampleUser = new User(
                "customer@funarray.com",
                "encodedPasswordHash",
                "John",
                "Doe",
                "+919876543210",
                Role.CUSTOMER,
                UserStatus.ACTIVE
        );
        sampleUser.setId("user-123");
    }

    @Test
    @DisplayName("Unit: Register should successfully create customer and return auth token")
    void register_Success() {
        RegisterRequest request = new RegisterRequest(
                "customer@funarray.com",
                "Password123!",
                "John",
                "Doe",
                "+919876543210"
        );

        when(userRepository.existsByEmailIgnoreCase(anyString())).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("encodedPasswordHash");
        when(userRepository.save(any(User.class))).thenReturn(sampleUser);
        when(tokenProvider.generateAccessToken(any(), any(), any())).thenReturn("mock-access-token");
        when(tokenProvider.generateRefreshToken(any())).thenReturn("mock-refresh-token");
        when(tokenProvider.getExpirationMs()).thenReturn(3600000L);

        AuthResponse response = authService.register(request);

        assertThat(response).isNotNull();
        assertThat(response.accessToken()).isEqualTo("mock-access-token");
        assertThat(response.refreshToken()).isEqualTo("mock-refresh-token");
        assertThat(response.user().email()).isEqualTo("customer@funarray.com");
        verify(userRepository, times(1)).save(any(User.class));
    }

    @Test
    @DisplayName("Unit: Register should throw DuplicateResourceException if email exists")
    void register_EmailAlreadyExists() {
        RegisterRequest request = new RegisterRequest(
                "existing@funarray.com",
                "Password123!",
                "John",
                "Doe",
                null
        );

        when(userRepository.existsByEmailIgnoreCase(anyString())).thenReturn(true);

        assertThatThrownBy(() -> authService.register(request))
                .isInstanceOf(DuplicateResourceException.class)
                .hasMessageContaining("already exists");

        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("Unit: Login should succeed with valid email and password")
    void login_Success() {
        LoginRequest request = new LoginRequest("customer@funarray.com", "Password123!");

        when(userRepository.findByEmailIgnoreCase("customer@funarray.com")).thenReturn(Optional.of(sampleUser));
        when(passwordEncoder.matches("Password123!", "encodedPasswordHash")).thenReturn(true);
        when(tokenProvider.generateAccessToken(any(), any(), any())).thenReturn("mock-access-token");
        when(tokenProvider.generateRefreshToken(any())).thenReturn("mock-refresh-token");
        when(tokenProvider.getExpirationMs()).thenReturn(3600000L);

        AuthResponse response = authService.login(request);

        assertThat(response).isNotNull();
        assertThat(response.accessToken()).isEqualTo("mock-access-token");
        assertThat(response.user().email()).isEqualTo("customer@funarray.com");
    }

    @Test
    @DisplayName("Unit: Login should throw UnauthorizedException on wrong password")
    void login_WrongPassword() {
        LoginRequest request = new LoginRequest("customer@funarray.com", "WrongPassword!");

        when(userRepository.findByEmailIgnoreCase("customer@funarray.com")).thenReturn(Optional.of(sampleUser));
        when(passwordEncoder.matches("WrongPassword!", "encodedPasswordHash")).thenReturn(false);

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessageContaining("Email or password is incorrect");
    }

    @Test
    @DisplayName("Unit: Logout blacklists access and refresh tokens")
    void logout_BlacklistsTokens() {
        authService.logout("acc-tok", "ref-tok");
        verify(tokenBlacklistService, times(1)).blacklistToken("acc-tok");
        verify(tokenBlacklistService, times(1)).blacklistToken("ref-tok");
    }
}
