package com.Project.EARLY.service;

import com.Project.EARLY.domain.enums.ReportType;
import com.Project.EARLY.dto.report.MedicalReportDto;
import com.Project.EARLY.dto.report.VerifyReportPayload;
import com.Project.EARLY.security.UserPrincipal;
import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface ReportService {
    MedicalReportDto uploadReport(
            MultipartFile file,
            UUID patientId,
            String title,
            ReportType reportType,
            LocalDate reportDate,
            String sourceProviderName,
            UserPrincipal actor
    );
    List<MedicalReportDto> getReportsForPatient(UUID patientId, UserPrincipal actor);
    MedicalReportDto getReportById(UUID reportId, UserPrincipal actor);
    Resource downloadReport(UUID reportId, UserPrincipal actor);
    MedicalReportDto verifyReport(UUID reportId, VerifyReportPayload payload, UserPrincipal actor);
}
