import logging
import numpy as np
from typing import List, Dict, Tuple, Any

logger = logging.getLogger(__name__)

# Global variables for models
_transformer_model = None
_faiss_index = None
_indexed_candidate_ids = []  # List of candidate UUID strings matching index row offsets


def get_embedding_model():
    """
    Singleton getter for SentenceTransformer model.
    """
    global _transformer_model
    if _transformer_model is None:
        try:
            from sentence_transformers import SentenceTransformer
            logger.info("Loading SentenceTransformer model 'all-MiniLM-L6-v2'...")
            _transformer_model = SentenceTransformer("all-MiniLM-L6-v2")
            logger.info("SentenceTransformer model loaded successfully.")
        except Exception as e:
            logger.error(f"Failed to load sentence-transformers: {e}")
            _transformer_model = "MOCK"
    return _transformer_model


def get_vector_dimension() -> int:
    return 384  # Dimension of all-MiniLM-L6-v2


def build_candidate_search_string(candidate: Dict[str, Any]) -> str:
    """
    Compiles candidate details into a single rich text block for embedding.
    Ensures semantic queries match locations, companies, domains, and skills.
    """
    skills_str = ", ".join(candidate.get("skills", []))
    companies_str = ", ".join(candidate.get("companies", []))
    education_str = ", ".join([edu.get("degree", "") for edu in candidate.get("education", [])])
    
    # Specific Domain/Skill mapping expansions for Step 6 examples
    domain_expansion = ""
    skills_lower = [s.lower() for s in candidate.get("skills", [])]
    
    # ServiceNow ITSM expansion
    if "servicenow" in skills_lower or "service-now" in skills_lower:
        domain_expansion += " ServiceNow Developer IT Service Management ITSM ITOM CMDB Discovery Incident Management Flow Designer Service Catalog"
    # Java Spring expansion
    if "java" in skills_lower or "spring" in skills_lower:
        domain_expansion += " Java Spring Boot Spring MVC Hibernate J2EE Microservices Maven REST APIs SQL Backend developer"
    # Python expansion
    if "python" in skills_lower or "fastapi" in skills_lower:
        domain_expansion += " Python developer FastAPI Django Flask backend REST API"
    
    profile_text = (
        f"Candidate Name: {candidate.get('name', 'Candidate')}. "
        f"Skills: {skills_str}. "
        f"Experience: {candidate.get('experience_years', 0)} years. "
        f"Location: {candidate.get('current_location', 'Remote')}. "
        f"Notice Period: {candidate.get('notice_period', 'Immediate')}. "
        f"Companies: {companies_str}. "
        f"Education: {education_str}. "
        f"Summary: {candidate.get('summary', '')}. "
        f"{domain_expansion}"
    )
    return profile_text


# In-memory numpy-based vector search engine fallback 
# to keep code 100% working even if native FAISS fails to bind.
class NumPyVectorIndex:
    def __init__(self):
        self.dimension = get_vector_dimension()
        self.vectors = []
        self.candidate_ids = []

    def add(self, vector: np.ndarray, candidate_id: str):
        self.vectors.append(vector)
        self.candidate_ids.append(candidate_id)

    def search(self, query_vector: np.ndarray, top_k: int) -> List[Tuple[str, float]]:
        if not self.vectors:
            return []
        
        # Calculate cosine similarities
        query_norm = query_vector / (np.linalg.norm(query_vector) + 1e-10)
        matrix = np.array(self.vectors)
        matrix_norms = np.linalg.norm(matrix, axis=1, keepdims=True) + 1e-10
        matrix_normed = matrix / matrix_norms
        
        similarities = np.dot(matrix_normed, query_norm)
        
        # Get top-k indices
        indices = np.argsort(similarities)[::-1][:top_k]
        return [(self.candidate_ids[idx], float(similarities[idx])) for idx in indices]


def get_faiss_index():
    """
    Retrieves or initializes the global FAISS index.
    """
    global _faiss_index
    if _faiss_index is None:
        try:
            import faiss
            dimension = get_vector_dimension()
            # IndexFlatIP uses Inner Product (Cosine Similarity if normalized)
            _faiss_index = faiss.IndexFlatIP(dimension)
            logger.info("FAISS IndexFlatIP initialized.")
        except ImportError:
            logger.warning("FAISS is not installed. Initializing NumPy fallback index.")
            _faiss_index = NumPyVectorIndex()
    return _faiss_index


def add_candidate_to_index(candidate_id: str, candidate_data: Dict[str, Any]):
    """
    Generates embedding for a single candidate profile and adds it to the search index.
    """
    model = get_embedding_model()
    index = get_faiss_index()
    
    profile_text = build_candidate_search_string(candidate_data)
    
    # Generate vector
    if model == "MOCK":
        # Make a deterministic mock vector
        np.random.seed(hash(candidate_id) % (2**32))
        vector = np.random.randn(get_vector_dimension()).astype('float32')
    else:
        vector = model.encode([profile_text])[0].astype('float32')
        
    # Normalize for cosine similarity
    norm = np.linalg.norm(vector)
    if norm > 0:
        vector = vector / norm
        
    # Index
    try:
        import faiss
        if isinstance(index, faiss.Index):
            # FAISS requires array shaped (1, dim)
            index.add(np.expand_dims(vector, axis=0))
            _indexed_candidate_ids.append(candidate_id)
        else:
            index.add(vector, candidate_id)
    except Exception:
        # Fallback to NumPyVectorIndex
        if not hasattr(index, "vectors"):
            # Re-init as numpy
            global _faiss_index
            _faiss_index = NumPyVectorIndex()
            _faiss_index.add(vector, candidate_id)
        else:
            index.add(vector, candidate_id)


def search_candidates(query_text: str, top_k: int = 10) -> List[Tuple[str, float]]:
    """
    Performs a semantic query match against the candidates index.
    Returns: List of tuples (candidate_uuid_str, similarity_score_float).
    """
    model = get_embedding_model()
    index = get_faiss_index()
    
    # Encode query
    if model == "MOCK":
        np.random.seed(hash(query_text) % (2**32))
        query_vector = np.random.randn(get_vector_dimension()).astype('float32')
    else:
        query_vector = model.encode([query_text])[0].astype('float32')
        
    norm = np.linalg.norm(query_vector)
    if norm > 0:
        query_vector = query_vector / norm
        
    try:
        import faiss
        if isinstance(index, faiss.Index):
            if index.ntotal == 0:
                return []
            # Search
            distances, indices = index.search(np.expand_dims(query_vector, axis=0), top_k)
            results = []
            for score, idx in zip(distances[0], indices[0]):
                if idx < 0 or idx >= len(_indexed_candidate_ids):
                    continue
                results.append((_indexed_candidate_ids[idx], float(score)))
            return results
        else:
            return index.search(query_vector, top_k)
    except Exception as e:
        logger.error(f"Vector search failed: {e}")
        # NumPy Fallback
        if hasattr(index, "search"):
            return index.search(query_vector, top_k)
        return []


def reset_index():
    """
    Flushes the in-memory index vectors.
    """
    global _faiss_index, _indexed_candidate_ids
    _faiss_index = None
    _indexed_candidate_ids = []
