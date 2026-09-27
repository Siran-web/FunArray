package com.furniture.store.visualization.dto;

import jakarta.validation.constraints.NotBlank;

public record RenameDesignRequest(
        @NotBlank(message = "Design name cannot be blank")
        String name
) {}
