package com.pqc.core.document;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * MongoDB document — unstructured plumber service log
 * Stored in MongoDB because each job may have widely different fields
 */
@Document(collection = "service_logs")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ServiceLog {

    @Id
    private String id;

    private Long orderId;
    private Long plumberId;

    private String diagnosis;          // what was the problem
    private String workDone;           // what was fixed

    private List<PartUsed> partsUsed;  // hardware items from store

    private String plumberNotes;
    private String photoUrl;           // image proof of work

    private LocalDateTime loggedAt;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PartUsed {
        private String partName;
        private Integer quantity;
        private BigDecimal unitPrice;
    }
}
