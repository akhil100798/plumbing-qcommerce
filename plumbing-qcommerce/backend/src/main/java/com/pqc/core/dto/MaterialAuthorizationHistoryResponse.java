package com.pqc.core.dto;

public record MaterialAuthorizationHistoryResponse(Long materialRequestId, Long materialItemId,
                                                    String authorizationState, String unit,
                                                    java.math.BigDecimal storeUnitPrice,
                                                    java.math.BigDecimal packedQuantity,
                                                    String productName) { }
