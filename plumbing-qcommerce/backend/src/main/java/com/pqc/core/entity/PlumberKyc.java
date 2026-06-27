package com.pqc.core.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity @Table(name="plumber_kyc") @Data @Builder @NoArgsConstructor @AllArgsConstructor
public class PlumberKyc {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @Column(nullable=false, unique=true) private Long plumberId;
    private String aadhaarNumberMasked;
    private String panNumberMasked;
    private Integer experienceYears;
    @Column(length=1000) private String serviceAreas;
    private String bankAccountMasked;
    private String documentStatus;
    @Builder.Default @Enumerated(EnumType.STRING) @Column(nullable=false) private PlumberKycStatus status = PlumberKycStatus.NOT_SUBMITTED;
    @Builder.Default @Enumerated(EnumType.STRING) @Column(nullable=false) private PlumberAvailabilityStatus availabilityStatus = PlumberAvailabilityStatus.OFFLINE;
    @Column(length=1000) private String availabilityReason;
    private LocalDateTime submittedAt;
    private LocalDateTime reviewedAt;
    private Long reviewedByAdminId;
    @Column(length=1000) private String rejectionReason;
}
