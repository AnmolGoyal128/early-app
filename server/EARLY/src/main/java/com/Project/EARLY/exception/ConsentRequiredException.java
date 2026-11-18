package com.Project.EARLY.exception;

import java.util.UUID;

public class ConsentRequiredException extends RuntimeException {
    private final UUID patientId;
    private final String reason;

    public ConsentRequiredException(String message) {
        super(message);
        this.patientId = null;
        this.reason = "NO_ACTIVE_CONSENT";
    }

    public ConsentRequiredException(UUID patientId, String reason, String message) {
        super(message);
        this.patientId = patientId;
        this.reason = reason;
    }

    public UUID getPatientId() {
        return patientId;
    }

    public String getReason() {
        return reason;
    }
}
