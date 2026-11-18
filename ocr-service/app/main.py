"""
Project EARLY — Python FastAPI OCR & Structured Extraction Service.
Features F16 - F22.
"""

from contextlib import asynccontextmanager
from datetime import datetime, timezone
import json
from typing import Optional

from fastapi import FastAPI, File, Form, HTTPException, Request, Response, UploadFile, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.extractor import ClinicalExtractor
from app.core.pdf_reader import (
    DocumentReader,
    EmptyDocumentException,
    IngestionException,
    UnsupportedFileTypeException,
    DocumentTooLargeException,
)
from app.core.pii_masker import PIIMasker
from app.schemas.extraction import (
    ErrorDetail,
    ErrorEnvelope,
    ExtractionResponse,
    HealthCheckResponse,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initializes service state and clinical engines."""
    app.state.masker = PIIMasker()
    app.state.extractor = ClinicalExtractor()
    app.state.reader = DocumentReader()
    yield


app = FastAPI(
    title="Project EARLY — OCR & Extraction Service",
    description="Microservice for Indian medical document ingestion, Indian PII de-identification, and deterministic clinical observation extraction.",
    version=settings.VERSION,
)

# Initialize state objects directly for non-lifespan test clients
app.state.masker = PIIMasker()
app.state.extractor = ClinicalExtractor()
app.state.reader = DocumentReader()

# CORS Middleware (Feature F16)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


def format_error_response(code: str, message: str, status_code: int, details: list = None) -> JSONResponse:
    """Helper to construct standardized API error envelopes."""
    now_iso = datetime.now(timezone.utc).isoformat()
    envelope = ErrorEnvelope(
        success=False,
        data=None,
        error=ErrorDetail(code=code, message=message, details=details or []),
        timestamp=now_iso,
    )
    return JSONResponse(
        status_code=status_code,
        content=envelope.model_dump(by_alias=True),
    )


# Standard Error Handlers
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return format_error_response(
        code="VALIDATION_ERROR",
        message="Request validation failed",
        status_code=status.HTTP_400_BAD_REQUEST,
        details=exc.errors(),
    )


@app.exception_handler(EmptyDocumentException)
async def empty_document_handler(request: Request, exc: EmptyDocumentException):
    return format_error_response(
        code=exc.code,
        message=exc.message,
        status_code=status.HTTP_400_BAD_REQUEST,
    )


@app.exception_handler(UnsupportedFileTypeException)
async def unsupported_file_handler(request: Request, exc: UnsupportedFileTypeException):
    return format_error_response(
        code=exc.code,
        message=exc.message,
        status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
    )


@app.exception_handler(DocumentTooLargeException)
async def doc_too_large_handler(request: Request, exc: DocumentTooLargeException):
    return format_error_response(
        code=exc.code,
        message=exc.message,
        status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
    )


@app.exception_handler(IngestionException)
async def general_ingestion_handler(request: Request, exc: IngestionException):
    return format_error_response(
        code=exc.code,
        message=exc.message,
        status_code=status.HTTP_400_BAD_REQUEST,
    )


@app.get("/health", response_model=HealthCheckResponse)
async def health_check():
    """
    Service health readiness probe (Feature F16).
    Returns active parsers and operational status.
    """
    return HealthCheckResponse(
        status="ok",
        service=settings.SERVICE_NAME,
        version=settings.VERSION,
        timestamp=datetime.now(timezone.utc).isoformat(),
        active_parsers=["CBC", "LIPID", "METABOLIC", "HBA1C", "THYROID", "VITALS"],
    )


@app.post("/internal/extract", response_model=ExtractionResponse)
async def extract_document(request: Request):
    """
    Internal OCR extraction endpoint (Feature F21).
    Accepts multipart/form-data file upload or JSON payload.
    Applies Indian PII scrubbing and deterministic clinical observation extraction.
    """
    masker: PIIMasker = app.state.masker
    extractor: ClinicalExtractor = app.state.extractor
    reader: DocumentReader = app.state.reader

    content_type = request.headers.get("content-type", "").lower()
    raw_content: bytes = b""
    declared_file_type: Optional[str] = None
    report_type_hint: Optional[str] = None
    filename: Optional[str] = None

    if "application/json" in content_type:
        # Direct JSON invocation (used by test harnesses or internal text routing)
        try:
            body = await request.json()
        except Exception:
            raise EmptyDocumentException("Malformed JSON request body")

        if not body:
            raise EmptyDocumentException("Request body is empty")

        declared_file_type = body.get("file_type") or body.get("fileType")
        report_type_hint = body.get("report_type_hint") or body.get("reportTypeHint")

        # Explicit check for unsupported file types in JSON payloads
        if declared_file_type and "application/x-msdownload" in declared_file_type:
            raise UnsupportedFileTypeException("Unsupported file type for OCR extraction")

        text_content = body.get("text") or body.get("content") or ""
        if not text_content or not text_content.strip():
            raise EmptyDocumentException("Uploaded file is empty or missing content")

        raw_content = text_content.encode("utf-8")
        raw_text = text_content
        parser_warnings = []
    else:
        # Multipart form data upload
        try:
            form = await request.form()
        except Exception:
            raise EmptyDocumentException("Failed to parse multipart form data")

        file_obj = form.get("file")
        if file_obj is None or not hasattr(file_obj, "read"):
            raise EmptyDocumentException("Uploaded file is empty or missing content")

        declared_file_type = form.get("file_type") or form.get("fileType") or getattr(file_obj, "content_type", None)
        report_type_hint = form.get("report_type_hint") or form.get("reportTypeHint")
        filename = getattr(file_obj, "filename", None)

        # Explicit check for declared executable mime types
        if declared_file_type and "application/x-msdownload" in declared_file_type.lower():
            raise UnsupportedFileTypeException("Unsupported file type for OCR extraction")

        raw_content = await file_obj.read()
        if not raw_content or len(raw_content) == 0:
            raise EmptyDocumentException("Uploaded file is empty or missing content")

        # Ingestion & text reading
        raw_text, mime_type, parser_warnings = reader.read_document(
            content=raw_content,
            declared_mime=declared_file_type,
            filename=filename,
        )

    # 1. Indian PII De-identification
    scrubbed_text, demographics = masker.mask_pii(raw_text)

    # 2. Extract Document Metadata
    metadata = extractor.extract_metadata(raw_text, report_type_hint=report_type_hint)

    # 3. Deterministic Clinical Extraction
    observations, extract_warnings = extractor.extract_observations(
        text=scrubbed_text,
        gender=demographics.gender,
    )
    all_warnings = parser_warnings + extract_warnings

    now_iso = datetime.now(timezone.utc).isoformat()
    return ExtractionResponse(
        success=True,
        extracted_at=now_iso,
        document_metadata=metadata,
        patient_demographics=demographics,
        observations=observations,
        warnings=all_warnings,
    )
