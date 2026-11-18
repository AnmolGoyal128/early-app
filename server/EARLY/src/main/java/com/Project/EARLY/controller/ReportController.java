package com.Project.EARLY.controller;

import com.Project.EARLY.domain.enums.ReportType;
import com.Project.EARLY.dto.common.ApiResponse;
import com.Project.EARLY.dto.report.MedicalReportDto;
import com.Project.EARLY.dto.report.VerifyReportPayload;
import com.Project.EARLY.security.UserPrincipal;
import com.Project.EARLY.service.ReportService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    @PostMapping(value = "/reports/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<MedicalReportDto>> uploadReport(
            @RequestParam("file") MultipartFile file,
            @RequestParam("patientId") UUID patientId,
            @RequestParam(value = "title", required = false) String title,
            @RequestParam(value = "reportType", required = false) ReportType reportType,
            @RequestParam(value = "reportDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate reportDate,
            @RequestParam(value = "sourceProviderName", required = false) String sourceProviderName,
            @AuthenticationPrincipal UserPrincipal actor) {

        MedicalReportDto report = reportService.uploadReport(
                file, patientId, title, reportType, reportDate, sourceProviderName, actor
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(report));
    }

    @GetMapping("/patients/{patientId}/reports")
    public ResponseEntity<ApiResponse<List<MedicalReportDto>>> getPatientReports(
            @PathVariable UUID patientId,
            @AuthenticationPrincipal UserPrincipal actor) {
        List<MedicalReportDto> reports = reportService.getReportsForPatient(patientId, actor);
        return ResponseEntity.ok(ApiResponse.success(reports));
    }

    @GetMapping("/reports/{reportId}")
    public ResponseEntity<ApiResponse<MedicalReportDto>> getReportById(
            @PathVariable UUID reportId,
            @AuthenticationPrincipal UserPrincipal actor) {
        MedicalReportDto report = reportService.getReportById(reportId, actor);
        return ResponseEntity.ok(ApiResponse.success(report));
    }

    @GetMapping("/reports/{reportId}/download")
    public ResponseEntity<Resource> downloadReport(
            @PathVariable UUID reportId,
            @AuthenticationPrincipal UserPrincipal actor) {
        Resource resource = reportService.downloadReport(reportId, actor);
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"report-" + reportId + ".pdf\"")
                .body(resource);
    }

    @PostMapping("/reports/{reportId}/verify")
    public ResponseEntity<ApiResponse<MedicalReportDto>> verifyReport(
            @PathVariable UUID reportId,
            @Valid @RequestBody VerifyReportPayload payload,
            @AuthenticationPrincipal UserPrincipal actor) {
        MedicalReportDto verified = reportService.verifyReport(reportId, payload, actor);
        return ResponseEntity.ok(ApiResponse.success(verified));
    }
}
