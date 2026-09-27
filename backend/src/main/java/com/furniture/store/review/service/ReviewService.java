package com.furniture.store.review.service;

import com.furniture.store.exception.ForbiddenException;
import com.furniture.store.exception.ResourceNotFoundException;
import com.furniture.store.product.entity.Product;
import com.furniture.store.product.repository.ProductRepository;
import com.furniture.store.review.dto.*;
import com.furniture.store.review.entity.Review;
import com.furniture.store.review.entity.ReviewStatus;
import com.furniture.store.review.repository.ReviewRepository;
import com.furniture.store.user.entity.User;
import com.furniture.store.user.repository.UserRepository;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    public ReviewService(
            ReviewRepository reviewRepository,
            ProductRepository productRepository,
            UserRepository userRepository
    ) {
        this.reviewRepository = reviewRepository;
        this.productRepository = productRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public ReviewDto createReview(String userId, String productId, CreateReviewRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + productId));

        Review review = new Review();
        review.setId(UUID.randomUUID().toString());
        review.setUser(user);
        review.setProduct(product);
        review.setRating(request.rating());
        review.setTitle(request.title().trim());
        review.setComment(request.comment().trim());
        review.setStatus(ReviewStatus.PUBLISHED);
        review.setCreatedAt(Instant.now());
        review.setUpdatedAt(Instant.now());

        Review saved = reviewRepository.save(review);
        return mapToDto(saved);
    }

    @Transactional(readOnly = true)
    public ProductReviewSummaryDto getProductReviews(String productId) {
        if (!productRepository.existsById(productId)) {
            throw new ResourceNotFoundException("Product not found with id: " + productId);
        }

        List<Review> reviews = reviewRepository.findByProductIdAndStatus(
                productId,
                ReviewStatus.PUBLISHED,
                Sort.by(Sort.Direction.DESC, "createdAt")
        );

        int totalReviews = reviews.size();
        double avgRating = totalReviews > 0
                ? reviews.stream().mapToInt(Review::getRating).average().orElse(0.0)
                : 0.0;

        Map<Integer, Long> distribution = reviews.stream()
                .collect(Collectors.groupingBy(Review::getRating, Collectors.counting()));
        for (int i = 1; i <= 5; i++) {
            distribution.putIfAbsent(i, 0L);
        }

        List<ReviewDto> dtoList = reviews.stream().map(this::mapToDto).toList();

        return new ProductReviewSummaryDto(
                Math.round(avgRating * 10.0) / 10.0,
                totalReviews,
                distribution,
                dtoList
        );
    }

    @Transactional(readOnly = true)
    public List<ReviewDto> getReviewsByProduct(String productId) {
        List<Review> reviews = reviewRepository.findByProductIdAndStatus(
                productId,
                ReviewStatus.PUBLISHED,
                Sort.by(Sort.Direction.DESC, "createdAt")
        );
        return reviews.stream().map(this::mapToDto).toList();
    }

    @Transactional
    public void deleteReview(String reviewId, String userId, boolean isAdmin) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Review not found with id: " + reviewId));

        if (!isAdmin && !review.getUser().getId().equals(userId)) {
            throw new ForbiddenException("You are not authorized to delete this review");
        }

        reviewRepository.delete(review);
    }

    @Transactional
    public ReviewDto updateReviewStatus(String reviewId, String statusStr) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Review not found with id: " + reviewId));

        ReviewStatus status = ReviewStatus.valueOf(statusStr.toUpperCase());
        review.setStatus(status);
        review.setUpdatedAt(Instant.now());

        Review saved = reviewRepository.save(review);
        return mapToDto(saved);
    }

    private ReviewDto mapToDto(Review review) {
        String userName = review.getUser().getFirstName() + " " + review.getUser().getLastName();
        return new ReviewDto(
                review.getId(),
                review.getProduct().getId(),
                review.getProduct().getName(),
                review.getUser().getId(),
                userName.trim(),
                review.getRating(),
                review.getTitle(),
                review.getComment(),
                review.getStatus().name(),
                review.getCreatedAt()
        );
    }
}
