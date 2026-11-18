package com.Project.EARLY.security;

import com.Project.EARLY.domain.entity.UserEntity;
import com.Project.EARLY.domain.enums.UserRole;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.*;

@Getter
@AllArgsConstructor
@Builder
public class UserPrincipal implements UserDetails {

    private final UUID id;
    private final String email;
    private final String password;
    private final String fullName;
    private final UserRole role;
    private final boolean active;
    private final UUID patientId;
    private final UUID doctorId;
    private final UUID clinicId;
    private final Collection<? extends GrantedAuthority> authorities;

    public static UserPrincipal create(UserEntity user) {
        Set<GrantedAuthority> authorities = new HashSet<>();
        authorities.add(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()));

        // Role aliases for ecosystem compatibility
        if (user.getRole() == UserRole.CLINIC_ADMIN) {
            authorities.add(new SimpleGrantedAuthority("ROLE_HOSPITAL_ADMIN"));
        } else if (user.getRole() == UserRole.STAFF) {
            authorities.add(new SimpleGrantedAuthority("ROLE_LAB_TECHNICIAN"));
        }

        UUID patientId = null;
        UUID doctorId = null;
        UUID clinicId = null;

        if (user.getPatient() != null) {
            patientId = user.getPatient().getId();
        }
        if (user.getDoctor() != null) {
            doctorId = user.getDoctor().getId();
            if (user.getDoctor().getClinic() != null) {
                clinicId = user.getDoctor().getClinic().getId();
            }
        }

        return UserPrincipal.builder()
                .id(user.getId())
                .email(user.getEmail())
                .password(user.getPasswordHash())
                .fullName(user.getFullName())
                .role(user.getRole())
                .active(user.isActive())
                .patientId(patientId)
                .doctorId(doctorId)
                .clinicId(clinicId)
                .authorities(authorities)
                .build();
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

    @Override
    public String getPassword() {
        return password;
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return active;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return active;
    }
}
