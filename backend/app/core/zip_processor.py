import io
import zipfile
import logging
from typing import List, Dict, Tuple, Any

logger = logging.getLogger(__name__)


def extract_pdf_text(file_bytes: bytes) -> str:
    """
    Extracts text content from a PDF file using pypdf.
    Falls back to raw text decoding if parsing fails.
    """
    try:
        import pypdf
        reader = pypdf.PdfReader(io.BytesIO(file_bytes))
        text = ""
        for page in reader.pages:
            text += page.extract_text() or ""
        if text.strip():
            return text.strip()
    except Exception as e:
        logger.error(f"Error parsing PDF file: {e}")
        
    try:
        return file_bytes.decode("utf-8", errors="ignore").strip()
    except Exception:
        return ""


def extract_docx_text(file_bytes: bytes) -> str:
    """
    Extracts text content from a DOCX file using python-docx.
    Falls back to raw text decoding if parsing fails.
    """
    try:
        import docx
        doc = docx.Document(io.BytesIO(file_bytes))
        paragraphs = [p.text for p in doc.paragraphs if p.text]
        text = "\n".join(paragraphs).strip()
        if text:
            return text
    except Exception as e:
        logger.error(f"Error parsing DOCX file: {e}")
        
    try:
        return file_bytes.decode("utf-8", errors="ignore").strip()
    except Exception:
        return ""


def process_zip_archive(zip_bytes: bytes) -> List[Dict[str, Any]]:
    """
    Extracts resumes from a uploaded ZIP archive.
    Returns a list of dictionaries containing:
        - file_name: str
        - file_type: str ('pdf' | 'docx')
        - raw_text: str
    """
    extracted_resumes = []
    
    try:
        with zipfile.ZipFile(io.BytesIO(zip_bytes)) as z:
            for file_info in z.infolist():
                # Ignore directories or system files
                if file_info.is_dir() or "__MACOSX" in file_info.filename or file_info.filename.startswith("."):
                    continue
                
                name = file_info.filename
                # Detect type
                if name.lower().endswith(".pdf"):
                    file_type = "pdf"
                    parser_fn = extract_pdf_text
                elif name.lower().endswith(".docx"):
                    file_type = "docx"
                    parser_fn = extract_docx_text
                else:
                    # Ignore other formats
                    continue
                
                try:
                    # Extract file content
                    file_data = z.read(file_info)
                    raw_text = parser_fn(file_data)
                    
                    if raw_text and len(raw_text) > 10:
                        extracted_resumes.append({
                            "file_name": name.split("/")[-1],
                            "file_type": file_type,
                            "raw_text": raw_text
                        })
                except Exception as ex:
                    logger.error(f"Failed to process file {name} from ZIP: {ex}")
                    continue
                    
    except Exception as e:
        logger.error(f"Failed to process ZIP archive: {e}")
        
    return extracted_resumes
