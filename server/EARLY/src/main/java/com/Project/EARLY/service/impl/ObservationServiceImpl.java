package com.Project.EARLY.service.impl;

import com.Project.EARLY.domain.entity.BiomarkerObservationEntity;
import com.Project.EARLY.domain.enums.AuditAction;
import com.Project.EARLY.domain.enums.ConsentScope;
import com.Project.EARLY.domain.enums.VerificationStatus;
import com.Project.EARLY.dto.observation.BiomarkerObservationDto;
import com.Project.EARLY.dto.observation.BiomarkerTrendDto;
import com.Project.EARLY.dto.observation.TrendPointDto;
import com.Project.EARLY.mapper.ObservationMapper;
import com.Project.EARLY.repository.BiomarkerObservationRepository;
import com.Project.EARLY.security.UserPrincipal;
import com.Project.EARLY.service.AuditService;
import com.Project.EARLY.service.ConsentService;
import com.Project.EARLY.service.ObservationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class ObservationServiceImpl implements ObservationService {

    private final BiomarkerObservationRepository observationRepository;
    private final ObservationMapper observationMapper;
    private final ConsentService consentService;
    private final AuditService auditService;

    @Override
    @Transactional(readOnly = true)
    public List<BiomarkerObservationDto> getObservations(
            UUID patientId,
            String testName,
            String loincCode,
            VerificationStatus status,
            Instant fromDate,
            Instant toDate,
            UserPrincipal actor) {

        consentService.assertAccess(actor, patientId, ConsentScope.FULL_HISTORY);

        List<BiomarkerObservationEntity> observations = observationRepository.findFiltered(
                patientId,
                (testName != null && !testName.isBlank()) ? testName.trim() : null,
                (loincCode != null && !loincCode.isBlank()) ? loincCode.trim() : null,
                status,
                fromDate,
                toDate
        );

        auditService.logEvent(
                actor.getId(),
                actor.getRole().name(),
                AuditAction.OBSERVATIONS_QUERIED.name(),
                "OBSERVATION",
                patientId,
                null,
                Map.of("patientId", patientId.toString(), "count", observations.size())
        );

        return observations.stream()
                .map(observationMapper::toDto)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<BiomarkerTrendDto> getTrends(UUID patientId, UserPrincipal actor) {
        consentService.assertAccess(actor, patientId, ConsentScope.FULL_HISTORY);

        List<BiomarkerObservationEntity> verifiedObs = observationRepository.findVerifiedForTrends(patientId);

        // Group by test name (case-insensitive)
        Map<String, List<BiomarkerObservationEntity>> grouped = new LinkedHashMap<>();
        for (BiomarkerObservationEntity obs : verifiedObs) {
            if (obs.getValueNumeric() != null) {
                grouped.computeIfAbsent(obs.getTestName(), k -> new ArrayList<>()).add(obs);
            }
        }

        List<BiomarkerTrendDto> trendList = new ArrayList<>();
        for (Map.Entry<String, List<BiomarkerObservationEntity>> entry : grouped.entrySet()) {
            String testName = entry.getKey();
            List<BiomarkerObservationEntity> obsList = entry.getValue();

            // Sort points chronological
            obsList.sort(Comparator.comparing(BiomarkerObservationEntity::getObservedAt));

            BiomarkerObservationEntity first = obsList.get(0);
            String unit = first.getUnit();
            BigDecimal refLow = first.getReferenceLow();
            BigDecimal refHigh = first.getReferenceHigh();

            List<TrendPointDto> points = obsList.stream().map(o -> {
                boolean isAbnormal = false;
                if (refLow != null && o.getValueNumeric().compareTo(refLow) < 0) {
                    isAbnormal = true;
                } else if (refHigh != null && o.getValueNumeric().compareTo(refHigh) > 0) {
                    isAbnormal = true;
                }
                return new TrendPointDto(o.getObservedAt(), o.getValueNumeric(), isAbnormal, o.getId());
            }).toList();

            trendList.add(new BiomarkerTrendDto(testName, unit, refLow, refHigh, points));
        }

        auditService.logEvent(
                actor.getId(),
                actor.getRole().name(),
                AuditAction.TRENDS_VIEWED.name(),
                "OBSERVATION",
                patientId,
                null,
                Map.of("patientId", patientId.toString(), "seriesCount", trendList.size())
        );

        return trendList;
    }
}
