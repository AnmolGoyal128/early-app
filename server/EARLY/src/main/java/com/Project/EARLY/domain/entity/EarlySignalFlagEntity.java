package com.Project.EARLY.domain.entity;

import com.Project.EARLY.domain.enums.SignalStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "early_signal_flags")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EarlySignalFlagEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id", nullable = false)
    private PatientEntity patient;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rule_id", nullable = false)
    private PreventiveRuleEntity rule;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "observation_id")
    private BiomarkerObservationEntity observation;

    @Column(name = "clinician_message", nullable = false, columnDefinition = "TEXT")
    private String clinicianMessage;

    @Column(name = "patient_message", nullable = false, columnDefinition = "TEXT")
    private String patientMessage;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private SignalStatus status = SignalStatus.PENDING_REVIEW;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewed_by_doctor_id")
    private DoctorEntity reviewedByDoctor;

    @Column(name = "reviewed_at")
    private Instant reviewedAt;

    @Column(name = "clinician_note", columnDefinition = "TEXT")
    private String clinicianNote;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
