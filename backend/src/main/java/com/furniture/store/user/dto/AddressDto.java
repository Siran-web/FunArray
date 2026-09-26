package com.furniture.store.user.dto;

import com.furniture.store.user.entity.Address;
import java.time.Instant;

public record AddressDto(
        String id,
        String addressLine1,
        String addressLine2,
        String city,
        String state,
        String postalCode,
        String country,
        boolean isDefault,
        Instant createdAt
) {
    public static AddressDto fromEntity(Address address) {
        return new AddressDto(
                address.getId(),
                address.getAddressLine1(),
                address.getAddressLine2(),
                address.getCity(),
                address.getState(),
                address.getPostalCode(),
                address.getCountry(),
                Boolean.TRUE.equals(address.getIsDefault()),
                address.getCreatedAt()
        );
    }
}
