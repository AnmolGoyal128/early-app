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

import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@ActiveProfiles("test")
class AuthControllerIntegrationTests {

    @Autowired
    private WebApplicationContext context;

    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(context)
                .apply(springSecurity())
                .build();
    }

    @Test
    @DisplayName("Auth: Login with valid seeded doctor credentials succeeds")
    void testLoginSuccess() throws Exception {
        Map<String, String> loginReq = Map.of(
                "email", "priya.nair@metropolitanhealth.in",
                "password", "Password@123"
        );

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.accessToken").isString())
                .andExpect(jsonPath("$.data.refreshToken").isString())
                .andExpect(jsonPath("$.data.user.role").value("DOCTOR"))
                .andExpect(jsonPath("$.data.user.fullName").value("Dr. Priya Nair, MD"));
    }

    @Test
    @DisplayName("Auth: Login with bad credentials returns 401 UNAUTHORIZED")
    void testLoginFailure() throws Exception {
        Map<String, String> loginReq = Map.of(
                "email", "priya.nair@metropolitanhealth.in",
                "password", "WrongPassword"
        );

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginReq)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error.code").value("UNAUTHORIZED"));
    }

    @Test
    @DisplayName("Auth: Register new patient and fetch /auth/me")
    void testRegisterAndGetMe() throws Exception {
        String uniqueEmail = "patient." + System.currentTimeMillis() + "@example.com";
        Map<String, Object> registerReq = Map.of(
                "email", uniqueEmail,
                "password", "SecurePass@123",
                "fullName", "Ananya Sen",
                "phone", "+91 91234 56789",
                "role", "PATIENT",
                "dateOfBirth", "1995-07-15",
                "gender", "FEMALE",
                "bloodGroup", "O+"
        );

        MvcResult result = mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.accessToken").isString())
                .andExpect(jsonPath("$.data.user.role").value("PATIENT"))
                .andReturn();

        String json = result.getResponse().getContentAsString();
        String accessToken = objectMapper.readTree(json).path("data").path("accessToken").asText();

        // Call /auth/me with Bearer token
        mockMvc.perform(get("/api/v1/auth/me")
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.email").value(uniqueEmail))
                .andExpect(jsonPath("$.data.role").value("PATIENT"));
    }
}
