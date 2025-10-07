#!/usr/bin/env python3
"""
Docling PDF Extractor with OCR Support
Comprehensive PDF text extraction using Docling with parallel OCR processing
"""

import sys
import json
import io
import base64
from pathlib import Path
from typing import Dict, Any, Optional
import time

try:
    from docling.document_converter import DocumentConverter, PdfFormatOption
    from docling.datamodel.base_models import InputFormat, DocumentStream
    from docling.datamodel.pipeline_options import PdfPipelineOptions, EasyOcrOptions
except ImportError as e:
    print(json.dumps({
        "success": False,
        "error": f"Docling not installed: {e}",
        "text": "",
        "method": "error"
    }))
    sys.exit(1)


class DoclingExtractor:
    def __init__(self):
        """Initialize Docling extractor with OCR-enabled configuration"""
        # Configure pipeline with OCR enabled
        self.pipeline_options = PdfPipelineOptions()
        
        # Enable OCR with EasyOCR backend
        self.pipeline_options.do_ocr = True
        self.pipeline_options.do_table_structure = True
        self.pipeline_options.table_structure_options.do_cell_matching = True
        
        # Configure EasyOCR with parallel processing
        # force_full_page_ocr=False allows hybrid approach: text extraction + OCR for images
        ocr_options = EasyOcrOptions(
            force_full_page_ocr=False,  # Hybrid mode: OCR only for images/scanned parts
            lang=['en']  # English language support
        )
        self.pipeline_options.ocr_options = ocr_options
        
        # Initialize converter with OCR-enabled options
        self.converter = DocumentConverter(
            format_options={
                InputFormat.PDF: PdfFormatOption(
                    pipeline_options=self.pipeline_options
                )
            }
        )
    
    def extract_from_buffer(self, pdf_buffer: bytes, filename: str) -> Dict[str, Any]:
        """
        Extract text from PDF buffer using Docling with OCR
        
        Args:
            pdf_buffer: PDF file content as bytes
            filename: Original filename for reference
            
        Returns:
            Dictionary with extraction results
        """
        start_time = time.time()
        
        try:
            # Create document stream from buffer
            stream = io.BytesIO(pdf_buffer)
            doc_stream = DocumentStream(name=filename, stream=stream)
            
            print(f"Starting Docling extraction for {filename} ({len(pdf_buffer)} bytes)...", file=sys.stderr)
            
            # Convert document with OCR
            result = self.converter.convert(doc_stream)
            document = result.document
            
            # Extract text content
            text_content = ""
            
            # Get markdown content (includes OCR results)
            if hasattr(document, 'export_to_markdown'):
                text_content = document.export_to_markdown()
            else:
                # Fallback to direct text extraction
                text_content = str(document)
            
            duration = time.time() - start_time
            
            # Determine extraction method based on content analysis
            method = "docling-hybrid"
            if len(text_content.strip()) < 100:
                method = "docling-ocr-heavy"
            elif "This is an image-based PDF" in text_content:
                method = "docling-full-ocr"
            
            print(f"Docling extraction completed in {duration:.2f}s, extracted {len(text_content)} characters", file=sys.stderr)
            
            return {
                "success": True,
                "text": text_content,
                "method": method,
                "duration": duration,
                "character_count": len(text_content),
                "page_count": getattr(document, '_page_count', 0) or len(getattr(document, 'pages', []))
            }
            
        except Exception as e:
            duration = time.time() - start_time
            error_msg = str(e)
            
            print(f"Docling extraction failed after {duration:.2f}s: {error_msg}", file=sys.stderr)
            
            return {
                "success": False,
                "error": error_msg,
                "text": "",
                "method": "docling-error",
                "duration": duration
            }
    
    def extract_from_file(self, file_path: str) -> Dict[str, Any]:
        """
        Extract text from PDF file using Docling with OCR
        
        Args:
            file_path: Path to PDF file
            
        Returns:
            Dictionary with extraction results
        """
        try:
            with open(file_path, 'rb') as f:
                pdf_buffer = f.read()
            
            filename = Path(file_path).name
            return self.extract_from_buffer(pdf_buffer, filename)
            
        except Exception as e:
            return {
                "success": False,
                "error": f"File reading error: {e}",
                "text": "",
                "method": "file-error"
            }


def main():
    """Main entry point for the Docling extractor"""
    if len(sys.argv) < 2:
        print(json.dumps({
            "success": False,
            "error": "Usage: python docling_extractor.py <input_method> [data]",
            "text": "",
            "method": "usage-error"
        }))
        sys.exit(1)
    
    input_method = sys.argv[1]
    extractor = DoclingExtractor()
    
    try:
        if input_method == "file":
            # Extract from file path
            if len(sys.argv) < 3:
                raise ValueError("File path required for file method")
            
            file_path = sys.argv[2]
            result = extractor.extract_from_file(file_path)
            
        elif input_method == "buffer":
            # Extract from base64-encoded buffer
            if len(sys.argv) < 4:
                raise ValueError("Base64 data and filename required for buffer method")
            
            base64_data = sys.argv[2]
            filename = sys.argv[3]
            
            # Decode base64 buffer
            pdf_buffer = base64.b64decode(base64_data)
            result = extractor.extract_from_buffer(pdf_buffer, filename)
            
        else:
            raise ValueError(f"Unknown input method: {input_method}")
        
        # Output result as JSON
        print(json.dumps(result))
        
    except Exception as e:
        print(json.dumps({
            "success": False,
            "error": str(e),
            "text": "",
            "method": "main-error"
        }))
        sys.exit(1)


if __name__ == "__main__":
    main()