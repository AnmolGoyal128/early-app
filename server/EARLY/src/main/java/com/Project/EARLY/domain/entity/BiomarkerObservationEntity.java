package com.Project.EARLY.domain.entity;

import com.Project.EARLY.domain.enums.VerificationStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "biomarker_observations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BiomarkerObservationEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id", nullable = false)
    private PatientEntity patient;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "source_report_id")
    private MedicalReportEntity report;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "encounter_id")
    private ClinicalEncounterEntity encounter;

    @Column(name = "loinc_code", length = 30)
    private String loincCode;

    @Column(name = "test_name", nullable = false, length = 150)
    private String testName;

    @Column(name = "value_numeric", precision = 10, scale = 3)
    private BigDecimal valueNumeric;

    @Column(name = "value_text", length = 100)
    private String valueText;

    @Column(nullable = false, length = 50)
    private String unit;

    @Column(name = "reference_low", precision = 10, scale = 3)
    private BigDecimal referenceLow;

    @Column(name = "reference_high", precision = 10, scale = 3)
    private BigDecimal referenceHigh;

    @Column(name = "observed_at", nullable = false)
    private Instant observedAt;

    @Column(name = "ocr_confidence", precision = 4, scale = 3)
    private BigDecimal ocrConfidence;

    @Enumerated(EnumType.STRING)
    @Column(name = "verification_status", nullable = false, length = 30)
    @Builder.Default
    private VerificationStatus verificationStatus = VerificationStatus.PENDING_VERIFICATION;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "verified_by_user_id")
    private UserEntity verifiedBy;

    @Column(name = "verified_at")
    private Instant verifiedAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
