package com.furniture.store.user.service;

import com.furniture.store.exception.ForbiddenException;
import com.furniture.store.exception.ResourceNotFoundException;
import com.furniture.store.user.dto.AddressDto;
import com.furniture.store.user.dto.CreateAddressRequest;
import com.furniture.store.user.dto.UpdateAddressRequest;
import com.furniture.store.user.entity.Address;
import com.furniture.store.user.entity.User;
import com.furniture.store.user.repository.AddressRepository;
import com.furniture.store.user.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class AddressService {

    private final AddressRepository addressRepository;
    private final UserRepository userRepository;

    public AddressService(AddressRepository addressRepository, UserRepository userRepository) {
        this.addressRepository = addressRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<AddressDto> getUserAddresses(String userId) {
        return addressRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(AddressDto::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public AddressDto getAddressById(String userId, String addressId) {
        Address address = findAndVerifyOwnership(userId, addressId);
        return AddressDto.fromEntity(address);
    }

    @Transactional
    public AddressDto createAddress(String userId, CreateAddressRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        List<Address> existingAddresses = addressRepository.findByUserIdOrderByCreatedAtDesc(userId);
        boolean isFirstAddress = existingAddresses.isEmpty();
        boolean shouldBeDefault = Boolean.TRUE.equals(request.isDefault()) || isFirstAddress;

        if (shouldBeDefault) {
            addressRepository.resetDefaultAddressesForUser(userId);
        }

        Address address = new Address(
                user,
                request.addressLine1().trim(),
                request.addressLine2() != null ? request.addressLine2().trim() : null,
                request.city().trim(),
                request.state().trim(),
                request.postalCode().trim(),
                request.country() != null && !request.country().isBlank() ? request.country().trim() : "India",
                shouldBeDefault
        );

        Address saved = addressRepository.save(address);
        return AddressDto.fromEntity(saved);
    }

    @Transactional
    public AddressDto updateAddress(String userId, String addressId, UpdateAddressRequest request) {
        Address address = findAndVerifyOwnership(userId, addressId);

        boolean shouldBeDefault = Boolean.TRUE.equals(request.isDefault());
        if (shouldBeDefault && !Boolean.TRUE.equals(address.getIsDefault())) {
            addressRepository.resetDefaultAddressesForUser(userId);
            address.setIsDefault(true);
        } else if (request.isDefault() != null) {
            address.setIsDefault(request.isDefault());
        }

        address.setAddressLine1(request.addressLine1().trim());
        address.setAddressLine2(request.addressLine2() != null ? request.addressLine2().trim() : null);
        address.setCity(request.city().trim());
        address.setState(request.state().trim());
        address.setPostalCode(request.postalCode().trim());
        if (request.country() != null && !request.country().isBlank()) {
            address.setCountry(request.country().trim());
        }

        Address updated = addressRepository.save(address);
        return AddressDto.fromEntity(updated);
    }

    @Transactional
    public void deleteAddress(String userId, String addressId) {
        Address address = findAndVerifyOwnership(userId, addressId);
        boolean wasDefault = Boolean.TRUE.equals(address.getIsDefault());

        addressRepository.delete(address);

        if (wasDefault) {
            // If default was deleted, promote another address to default if available
            List<Address> remaining = addressRepository.findByUserIdOrderByCreatedAtDesc(userId);
            if (!remaining.isEmpty()) {
                Address newDefault = remaining.get(0);
                newDefault.setIsDefault(true);
                addressRepository.save(newDefault);
            }
        }
    }

    @Transactional
    public AddressDto setDefaultAddress(String userId, String addressId) {
        Address address = findAndVerifyOwnership(userId, addressId);
        addressRepository.resetDefaultAddressesForUser(userId);
        address.setIsDefault(true);
        Address updated = addressRepository.save(address);
        return AddressDto.fromEntity(updated);
    }

    private Address findAndVerifyOwnership(String userId, String addressId) {
        Address address = addressRepository.findById(addressId)
                .orElseThrow(() -> new ResourceNotFoundException("Address not found with id: " + addressId));

        if (!address.getUser().getId().equals(userId)) {
            throw new ForbiddenException("You do not have permission to access this address.");
        }

        return address;
    }
}
