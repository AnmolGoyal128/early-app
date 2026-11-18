package com.Project.EARLY;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import java.util.Map;

import static org.hamcrest.Matchers.*;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@ActiveProfiles("test")
class ClinicalFlowIntegrationTests {

    @Autowired
    private WebApplicationContext context;

    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private String doctorToken;
    private String patientToken;
    private final String aaravPatientId = "22222222-2222-2222-2222-222222221001";
    private final String clinicId = "11111111-1111-1111-1111-111111111001";

    @BeforeEach
    void setUp() throws Exception {
        mockMvc = MockMvcBuilders.webAppContextSetup(context)
                .apply(springSecurity())
                .build();
        // Login as Dr. Priya Nair
        MvcResult docLogin = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "email", "priya.nair@metropolitanhealth.in",
                                "password", "Password@123"
                        ))))
                .andExpect(status().isOk())
                .andReturn();
        doctorToken = objectMapper.readTree(docLogin.getResponse().getContentAsString())
                .path("data").path("accessToken").asText();

        // Login as Aarav Sharma
        MvcResult patLogin = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "email", "aarav.sharma@example.com",
                                "password", "Password@123"
                        ))))
                .andExpect(status().isOk())
                .andReturn();
        patientToken = objectMapper.readTree(patLogin.getResponse().getContentAsString())
                .path("data").path("accessToken").asText();
    }

    @Test
    @DisplayName("Dual Projection: Doctor sees clinical metrics, Patient sees calm guidance without jargon")
    void testDualLanguageEarlySignalProjection() throws Exception {
        // 1. Doctor View: includes ruleCode and clinicianMessage
        mockMvc.perform(get("/api/v1/patients/" + aaravPatientId + "/signals")
                        .header("Authorization", "Bearer " + doctorToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data", hasSize(greaterThanOrEqualTo(1))))
                .andExpect(jsonPath("$.data[0].ruleCode").isNotEmpty())
                .andExpect(jsonPath("$.data[0].clinicianMessage").isNotEmpty());

        // 2. Patient View: ruleCode and clinicianMessage must be stripped, patientMessage present
        mockMvc.perform(get("/api/v1/patients/" + aaravPatientId + "/signals")
                        .header("Authorization", "Bearer " + patientToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data", hasSize(greaterThanOrEqualTo(1))))
                .andExpect(jsonPath("$.data[0].ruleCode").doesNotExist())
                .andExpect(jsonPath("$.data[0].clinicianMessage").doesNotExist())
                .andExpect(jsonPath("$.data[0].patientMessage").isNotEmpty())
                .andExpect(jsonPath("$.data[0].ruleTitle").value("Health Indicator Review"));
    }

    @Test
    @DisplayName("Biomarkers & Trends: Returns longitudinal series formatted for Recharts")
    void testBiomarkerTrends() throws Exception {
        mockMvc.perform(get("/api/v1/patients/" + aaravPatientId + "/observations/trends")
                        .header("Authorization", "Bearer " + doctorToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data", hasSize(greaterThanOrEqualTo(1))))
                .andExpect(jsonPath("$.data[0].testName").isNotEmpty())
                .andExpect(jsonPath("$.data[0].points", hasSize(greaterThanOrEqualTo(1))))
                .andExpect(jsonPath("$.data[0].points[0].valueNumeric").isNumber());
    }

    @Test
    @DisplayName("Timeline: Returns chronological timeline containing reports and follow-ups")
    void testPatientTimeline() throws Exception {
        mockMvc.perform(get("/api/v1/patients/" + aaravPatientId + "/timeline")
                        .header("Authorization", "Bearer " + doctorToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data", hasSize(greaterThanOrEqualTo(1))));
    }

    @Test
    @DisplayName("Rules Catalog: Returns all active clinician-approved preventive rules")
    void testPreventiveRules() throws Exception {
        mockMvc.perform(get("/api/v1/rules")
                        .header("Authorization", "Bearer " + doctorToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data", hasSize(greaterThanOrEqualTo(4))));
    }

    @Test
    @DisplayName("Clinic Dashboard: Returns triage counters and worklist")
    void testClinicDashboard() throws Exception {
        mockMvc.perform(get("/api/v1/clinic/dashboard/summary")
                        .header("Authorization", "Bearer " + doctorToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.totalPatients").isNumber())
                .andExpect(jsonPath("$.data.followUpsOverdue").isNumber());

        mockMvc.perform(get("/api/v1/clinic/follow-ups")
                        .header("Authorization", "Bearer " + doctorToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data", hasSize(greaterThanOrEqualTo(1))));
    }

    @Test
    @DisplayName("Correction Requests: Patient can submit correction request and clinic can view")
    void testCorrectionRequestFlow() throws Exception {
        Map<String, String> requestBody = Map.of(
                "requestedChange", "Please correct observation date for blood pressure to 2026-08-21"
        );

        mockMvc.perform(post("/api/v1/correction-requests")
                        .header("Authorization", "Bearer " + patientToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestBody)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.status").value("OPEN"));

        mockMvc.perform(get("/api/v1/correction-requests")
                        .header("Authorization", "Bearer " + doctorToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data", hasSize(greaterThanOrEqualTo(1))));
    }
}
