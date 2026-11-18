package com.Project.EARLY.domain.entity;

import com.Project.EARLY.domain.enums.ExtractionStatus;
import com.Project.EARLY.domain.enums.ReportType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "medical_reports")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MedicalReportEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id", nullable = false)
    private PatientEntity patient;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "uploaded_by_user_id", nullable = false)
    private UserEntity uploadedBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "clinic_id")
    private ClinicEntity clinic;

    @Column(nullable = false)
    private String title;

    @Enumerated(EnumType.STRING)
    @Column(name = "report_type", nullable = false, length = 50)
    private ReportType reportType;

    @Column(name = "source_provider_name", length = 200)
    private String sourceProviderName;

    @Column(name = "report_date", nullable = false)
    private LocalDate reportDate;

    @Column(name = "file_storage_key", nullable = false, length = 500)
    private String fileStorageKey;

    @Column(name = "file_mime_type", nullable = false, length = 100)
    private String fileMimeType;

    @Column(name = "file_sha256", nullable = false, length = 64)
    private String fileSha256;

    @Enumerated(EnumType.STRING)
    @Column(name = "extraction_status", nullable = false, length = 30)
    @Builder.Default
    private ExtractionStatus extractionStatus = ExtractionStatus.PROCESSING;

    @Column(name = "raw_ocr_json", columnDefinition = "TEXT")
    private String rawOcrJson;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @OneToMany(mappedBy = "report", cascade = CascadeType.ALL)
    @Builder.Default
    private List<BiomarkerObservationEntity> observations = new ArrayList<>();
}
