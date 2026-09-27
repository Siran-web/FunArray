package com.furniture.store.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.furniture.store.common.ApiResponse;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 1)
public class RateLimitingFilter extends OncePerRequestFilter {

    private final Map<String, RequestBucket> clientBuckets = new ConcurrentHashMap<>();
    private final ObjectMapper objectMapper;

    // Rate limits per minute
    public static final int AUTH_LIMIT_PER_MINUTE = 30;
    public static final int PAYMENT_LIMIT_PER_MINUTE = 40;
    public static final int GENERAL_LIMIT_PER_MINUTE = 180;

    public RateLimitingFilter() {
        this.objectMapper = new ObjectMapper();
        this.objectMapper.registerModule(new JavaTimeModule());
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        // Skip rate limiting for static/swagger docs/health
        String uri = request.getRequestURI();
        if (uri.startsWith("/v3/api-docs") || uri.startsWith("/swagger-ui") || uri.equals("/api/v1/health") || uri.startsWith("/actuator")) {
            filterChain.doFilter(request, response);
            return;
        }

        String clientIp = extractClientIp(request);
        int limit = GENERAL_LIMIT_PER_MINUTE;
        String bucketPrefix = "gen:";

        if (uri.contains("/auth/")) {
            limit = AUTH_LIMIT_PER_MINUTE;
            bucketPrefix = "auth:";
        } else if (uri.contains("/payments/")) {
            limit = PAYMENT_LIMIT_PER_MINUTE;
            bucketPrefix = "pay:";
        }

        String bucketKey = bucketPrefix + clientIp;
        long currentWindow = System.currentTimeMillis() / 60000;

        RequestBucket bucket = clientBuckets.compute(bucketKey, (k, existing) -> {
            if (existing == null || existing.window() != currentWindow) {
                return new RequestBucket(currentWindow, new AtomicInteger(1));
            }
            existing.count().incrementAndGet();
            return existing;
        });

        // Periodic bucket cleanup to prevent memory growth
        if (clientBuckets.size() > 5000) {
            clientBuckets.entrySet().removeIf(e -> e.getValue().window() < currentWindow);
        }

        if (bucket.count().get() > limit) {
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.setHeader("Retry-After", "60");

            ApiResponse<Void> errorResponse = ApiResponse.error(
                    "RATE_LIMIT_EXCEEDED",
                    "Rate limit exceeded. Maximum " + limit + " requests allowed per minute. Please try again later."
            );

            response.getWriter().write(objectMapper.writeValueAsString(errorResponse));
            return;
        }

        filterChain.doFilter(request, response);
    }

    private String extractClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isBlank()) {
            return xForwardedFor.split(",")[0].trim();
        }
        String realIp = request.getHeader("X-Real-IP");
        if (realIp != null && !realIp.isBlank()) {
            return realIp.trim();
        }
        return request.getRemoteAddr() != null ? request.getRemoteAddr() : "127.0.0.1";
    }

    private record RequestBucket(long window, AtomicInteger count) {}
}
