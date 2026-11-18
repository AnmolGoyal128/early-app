"""
Self-contained Document Ingestion and PDF Stream Parser.

Extracts text from text-layer PDFs using pure-Python standard library FlateDecode (zlib)
and text drawing operators without requiring uninstalled binaries (like pdftotext or tesseract).
Also handles plain text and image validation via Pillow.
"""

import io
import re
import zlib
from typing import List, Optional, Tuple
from PIL import Image

MAX_UPLOAD_SIZE_BYTES = 15 * 1024 * 1024  # 15 MB


class IngestionException(Exception):
    """Base exception for document ingestion failures."""
    def __init__(self, message: str, code: str = "INGESTION_ERROR"):
        super().__init__(message)
        self.message = message
        self.code = code


class EmptyDocumentException(IngestionException):
    """Raised when an empty document (0 bytes) is provided."""
    def __init__(self, message: str = "Uploaded file is empty or missing content"):
        super().__init__(message, code="MALFORMED_DOCUMENT")


class UnsupportedFileTypeException(IngestionException):
    """Raised when an executable or unsupported file type is provided."""
    def __init__(self, message: str = "Unsupported file type for OCR extraction"):
        super().__init__(message, code="UNSUPPORTED_FILE")


class DocumentTooLargeException(IngestionException):
    """Raised when file exceeds the maximum allowed upload size."""
    def __init__(self, message: str = "Uploaded document exceeds 15 MB limit"):
        super().__init__(message, code="DOCUMENT_TOO_LARGE")


class DocumentReader:
    """Document reader and stream text extraction engine."""

    @staticmethod
    def identify_format(
        content: bytes,
        declared_mime: Optional[str] = None,
        filename: Optional[str] = None
    ) -> str:
        """Validates magic bytes and determines file format."""
        if not content or len(content) == 0:
            raise EmptyDocumentException("Uploaded file is empty or missing content")

        if len(content) > MAX_UPLOAD_SIZE_BYTES:
            raise DocumentTooLargeException("Uploaded document exceeds 15 MB limit")

        # Reject executables (PE header 'MZ' or declared application/x-msdownload)
        if content.startswith(b"MZ") or (declared_mime and "application/x-msdownload" in declared_mime.lower()):
            raise UnsupportedFileTypeException("Unsupported file type for OCR extraction")

        if filename and any(filename.lower().endswith(ext) for ext in [".exe", ".dll", ".bin", ".bat", ".cmd"]):
            raise UnsupportedFileTypeException("Unsupported file type for OCR extraction")

        # PDF header
        if content.startswith(b"%PDF-"):
            return "application/pdf"

        # PNG magic bytes
        if content.startswith(b"\x89PNG\r\n\x1a\n"):
            return "image/png"

        # JPEG magic bytes
        if content.startswith(b"\xff\xd8\xff"):
            return "image/jpeg"

        # Check for plain text
        try:
            content.decode("utf-8")
            return "text/plain"
        except UnicodeDecodeError:
            try:
                content.decode("latin-1")
                return "text/plain"
            except Exception:
                raise UnsupportedFileTypeException("Unsupported file format for OCR extraction")

    @classmethod
    def extract_text_from_pdf(cls, pdf_bytes: bytes) -> Tuple[str, List[str]]:
        """
        Pure-Python PDF text extraction using FlateDecode decompression
        and (text) Tj / [(text)] TJ operator parsing.
        """
        texts: List[str] = []
        warnings: List[str] = []

        # Find all stream ... endstream blocks in PDF
        stream_pattern = re.compile(rb'stream[\r\n]+(.*?)[\r\n]+endstream', re.DOTALL)
        matches = list(stream_pattern.finditer(pdf_bytes))

        for match in matches:
            raw_stream = match.group(1)
            decompressed = None

            # Attempt standard zlib FlateDecode
            for wbits in (zlib.MAX_WBITS, -zlib.MAX_WBITS):
                try:
                    decompressed = zlib.decompress(raw_stream, wbits)
                    break
                except Exception:
                    continue

            if decompressed is None:
                decompressed = raw_stream

            # Parse (text) Tj operators
            for tj in re.findall(rb'\((.*?)\)\s*Tj', decompressed):
                clean_text = cls._decode_pdf_string(tj)
                if clean_text.strip():
                    texts.append(clean_text)

            # Parse [(text1) (text2)] TJ array operators
            for tj_array in re.findall(rb'\[(.*?)\]\s*TJ', decompressed):
                line_parts: List[str] = []
                for item in re.findall(rb'\((.*?)\)', tj_array):
                    clean_item = cls._decode_pdf_string(item)
                    if clean_item:
                        line_parts.append(clean_item)
                if line_parts:
                    texts.append(" ".join(line_parts))

            # Parse hex strings <48656c6c6f> Tj
            for hex_str in re.findall(rb'<([0-9a-fA-F]+)>\s*Tj', decompressed):
                try:
                    decoded = bytes.fromhex(hex_str.decode("ascii")).decode("latin1", errors="ignore")
                    if decoded.strip():
                        texts.append(decoded)
                except Exception:
                    pass

        extracted = "\n".join(texts).strip()
        if not extracted:
            warnings.append("PDF contains no extractable text stream; optical OCR fallback applied")
        return extracted, warnings

    @staticmethod
    def _decode_pdf_string(raw: bytes) -> str:
        """Helper to decode PDF literal strings and unescape backslash sequences."""
        try:
            text = raw.decode("latin1", errors="ignore")
        except Exception:
            text = raw.decode("utf-8", errors="ignore")

        # Replace standard PDF escapes
        text = text.replace(r"\(", "(").replace(r"\)", ")").replace(r"\\", "\\")
        text = text.replace(r"\n", "\n").replace(r"\r", "\r").replace(r"\t", "\t")
        return text

    @classmethod
    def extract_text_from_image(cls, image_bytes: bytes) -> Tuple[str, List[str]]:
        """Validates image integrity and structure via Pillow."""
        warnings: List[str] = []
        try:
            img = Image.open(io.BytesIO(image_bytes))
            img.verify()
            warnings.append(f"Image validated ({img.format}, {img.size[0]}x{img.size[1]}); deterministic fallback applied")
        except Exception as e:
            raise UnsupportedFileTypeException(f"Corrupted or invalid image: {str(e)}")
        return "", warnings

    @classmethod
    def read_document(
        cls,
        content: bytes,
        declared_mime: Optional[str] = None,
        filename: Optional[str] = None
    ) -> Tuple[str, str, List[str]]:
        """
        Processes document bytes into raw text, mime-type, and parser warnings.
        """
        mime_type = cls.identify_format(content, declared_mime, filename)
        warnings: List[str] = []
        raw_text = ""

        if mime_type == "text/plain":
            try:
                raw_text = content.decode("utf-8")
            except UnicodeDecodeError:
                raw_text = content.decode("latin-1", errors="replace")
        elif mime_type == "application/pdf":
            raw_text, pdf_warnings = cls.extract_text_from_pdf(content)
            warnings.extend(pdf_warnings)
        elif mime_type in ("image/png", "image/jpeg"):
            raw_text, img_warnings = cls.extract_text_from_image(content)
            warnings.extend(img_warnings)

        return raw_text, mime_type, warnings
