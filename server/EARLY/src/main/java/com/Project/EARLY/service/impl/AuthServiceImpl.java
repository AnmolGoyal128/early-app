package com.Project.EARLY.service.impl;

import com.Project.EARLY.domain.entity.ClinicEntity;
import com.Project.EARLY.domain.entity.DoctorEntity;
import com.Project.EARLY.domain.entity.PatientEntity;
import com.Project.EARLY.domain.entity.UserEntity;
import com.Project.EARLY.domain.enums.Gender;
import com.Project.EARLY.domain.enums.UserRole;
import com.Project.EARLY.dto.auth.AuthResponse;
import com.Project.EARLY.dto.auth.LoginRequest;
import com.Project.EARLY.dto.auth.RefreshTokenRequest;
import com.Project.EARLY.dto.auth.RegisterRequest;
import com.Project.EARLY.dto.auth.UserProfileDto;
import com.Project.EARLY.exception.ConflictException;
import com.Project.EARLY.exception.ResourceNotFoundException;
import com.Project.EARLY.exception.UnauthorizedException;
import com.Project.EARLY.mapper.UserMapper;
import com.Project.EARLY.repository.ClinicRepository;
import com.Project.EARLY.repository.DoctorRepository;
import com.Project.EARLY.repository.PatientRepository;
import com.Project.EARLY.repository.UserRepository;
import com.Project.EARLY.security.JwtTokenProvider;
import com.Project.EARLY.security.UserPrincipal;
import com.Project.EARLY.service.AuthService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    private final ClinicRepository clinicRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;
    private final UserMapper userMapper;

    @Override
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new ConflictException("Email already in use: " + request.email());
        }

        UserEntity user = UserEntity.builder()
                .email(request.email().toLowerCase().trim())
                .passwordHash(passwordEncoder.encode(request.password()))
                .fullName(request.fullName().trim())
                .phone(request.phone())
                .role(request.role())
                .isActive(true)
                .build();

        UserEntity savedUser = userRepository.save(user);

        if (request.role() == UserRole.PATIENT) {
            PatientEntity patient = PatientEntity.builder()
                    .user(savedUser)
                    .dateOfBirth(request.dateOfBirth() != null ? request.dateOfBirth() : LocalDate.of(1990, 1, 1))
                    .gender(request.gender() != null ? request.gender() : Gender.OTHER)
                    .bloodGroup(request.bloodGroup())
                    .abhaNumber(request.abhaNumber())
                    .build();
            patientRepository.save(patient);
            savedUser.setPatient(patient);
        } else if (request.role() == UserRole.DOCTOR) {
            ClinicEntity clinic = null;
            if (request.clinicId() != null) {
                clinic = clinicRepository.findById(request.clinicId()).orElse(null);
            }
            if (clinic == null) {
                // If no clinic passed, link to first clinic or default
                clinic = clinicRepository.findAll().stream().findFirst().orElse(null);
            }
            DoctorEntity doctor = DoctorEntity.builder()
                    .user(savedUser)
                    .clinic(clinic)
                    .medicalRegNumber(request.medicalRegNumber() != null ? request.medicalRegNumber() : "REG-PENDING")
                    .specialization(request.specialization() != null ? request.specialization() : "General Practice")
                    .build();
            doctorRepository.save(doctor);
            savedUser.setDoctor(doctor);
        }

        UserPrincipal principal = UserPrincipal.create(savedUser);
        String accessToken = tokenProvider.generateAccessToken(principal);
        String refreshToken = tokenProvider.generateRefreshToken(principal);

        return new AuthResponse(accessToken, refreshToken, userMapper.toProfileDto(savedUser));
    }

    @Override
    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        UserEntity user = userRepository.findByEmail(request.email().toLowerCase().trim())
                .orElseThrow(() -> new UnauthorizedException("Invalid email or password"));

        if (!user.isActive()) {
            throw new UnauthorizedException("Account is disabled");
        }

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new UnauthorizedException("Invalid email or password");
        }

        UserPrincipal principal = UserPrincipal.create(user);
        String accessToken = tokenProvider.generateAccessToken(principal);
        String refreshToken = tokenProvider.generateRefreshToken(principal);

        return new AuthResponse(accessToken, refreshToken, userMapper.toProfileDto(user));
    }

    @Override
    @Transactional(readOnly = true)
    public AuthResponse refreshToken(RefreshTokenRequest request) {
        String token = request.refreshToken();
        if (!tokenProvider.validateToken(token)) {
            throw new UnauthorizedException("Invalid or expired refresh token");
        }

        UUID userId = tokenProvider.getUserIdFromToken(token);
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new UnauthorizedException("User not found"));

        if (!user.isActive()) {
            throw new UnauthorizedException("Account is disabled");
        }

        UserPrincipal principal = UserPrincipal.create(user);
        String newAccessToken = tokenProvider.generateAccessToken(principal);
        String newRefreshToken = tokenProvider.generateRefreshToken(principal);

        return new AuthResponse(newAccessToken, newRefreshToken, userMapper.toProfileDto(user));
    }

    @Override
    @Transactional(readOnly = true)
    public UserProfileDto getCurrentProfile(UserPrincipal actor) {
        UserEntity user = userRepository.findById(actor.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + actor.getId()));
        return userMapper.toProfileDto(user);
    }
}
