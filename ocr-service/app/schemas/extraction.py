"""
Pydantic Extraction Schemas (Feature F18)

Defines strict models with:
- extra = "forbid"
- populate_by_name = True
- alias_generator = to_camel (supporting both camelCase and snake_case)
- per-field ocr_confidence in [0.000, 1.000]
- verification_status = "PENDING_VERIFICATION"
"""

from typing import Any, List, Literal, Optional
from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel


class BaseSchema(BaseModel):
    """Base schema enforcing strict extra forbidden and dual-alias generation."""
    model_config = ConfigDict(
        extra="forbid",
        populate_by_name=True,
        alias_generator=to_camel,
    )


class ExtractedObservation(BaseSchema):
    """Single extracted biomarker observation."""
    test_name: str = Field(..., min_length=1, max_length=150, description="Canonical test name")
    loinc_code: Optional[str] = Field(None, max_length=30, description="Standard LOINC code")
    value_numeric: Optional[float] = Field(None, description="Numeric measurement value")
    value_text: Optional[str] = Field(None, max_length=100, description="Qualitative text value if non-numeric")
    unit: str = Field(..., max_length=50, description="Measurement unit")
    reference_low: Optional[float] = Field(None, description="Lower bound of normal reference interval")
    reference_high: Optional[float] = Field(None, description="Upper bound of normal reference interval")
    is_abnormal: bool = Field(False, description="Flag indicating value falls outside normal reference interval")
    ocr_confidence: float = Field(..., ge=0.0, le=1.0, description="Per-observation confidence score (0.0 to 1.0)")
    verification_status: Literal["PENDING_VERIFICATION"] = Field(
        default="PENDING_VERIFICATION",
        description="Mandatory verification status, always PENDING_VERIFICATION upon extraction"
    )


class DocumentMetadata(BaseSchema):
    """Document level clinical metadata."""
    source_provider_name: Optional[str] = Field(None, max_length=200, description="Laboratory or clinic name")
    report_date: Optional[str] = Field(None, description="Report date in YYYY-MM-DD or standard format")
    report_type: str = Field(default="LAB_REPORT", description="Report category (LAB_REPORT, VITALS, etc.)")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Document metadata confidence score")


class PatientDemographics(BaseSchema):
    """Patient demographic details with Indian PII masked."""
    masked_name: str = Field(default="[PATIENT_NAME_REDACTED]", description="Masked patient name")
    masked_phone: Optional[str] = Field(default="[PHONE_REDACTED]", description="Masked mobile phone")
    masked_address: Optional[str] = Field(default="[ADDRESS_REDACTED]", description="Masked address")
    age: Optional[int] = Field(None, ge=0, le=150, description="Patient age in years")
    gender: Optional[str] = Field(None, description="Patient gender (MALE, FEMALE, OTHER)")


class ExtractionResponse(BaseSchema):
    """Structured extraction response envelope."""
    success: bool = Field(default=True, description="Indicates extraction success")
    extracted_at: str = Field(..., description="UTC ISO-8601 extraction timestamp")
    document_metadata: DocumentMetadata
    patient_demographics: PatientDemographics
    observations: List[ExtractedObservation] = Field(default_factory=list, description="Extracted clinical observations")
    warnings: List[str] = Field(default_factory=list, description="Parser warnings or unmapped line notices")


class HealthCheckResponse(BaseSchema):
    """Service health and readiness response."""
    status: str = Field("ok", description="Service status")
    service: str = Field("early-ocr-service", description="Service identifier")
    version: str = Field("1.0.0", description="Semantic version")
    timestamp: str = Field(..., description="UTC ISO-8601 timestamp")
    active_parsers: List[str] = Field(
        default_factory=lambda: ["CBC", "LIPID", "METABOLIC", "HBA1C", "THYROID", "VITALS"],
        description="List of active deterministic clinical parsers"
    )


class ErrorDetail(BaseSchema):
    """Structured error details."""
    code: str = Field(..., description="Error code identifier")
    message: str = Field(..., description="Human-readable error description")
    details: List[Any] = Field(default_factory=list, description="Additional error context or field errors")


class ErrorEnvelope(BaseSchema):
    """Standardized API error envelope matching Project EARLY API contract."""
    success: bool = Field(default=False, description="Always false for error envelope")
    data: Optional[Any] = Field(default=None, description="Data payload, null for errors")
    error: ErrorDetail
    timestamp: str = Field(..., description="UTC ISO-8601 timestamp")
