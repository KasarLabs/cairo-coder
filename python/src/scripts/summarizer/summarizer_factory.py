from enum import Enum

from .base_summarizer import BaseSummarizer, SummarizerConfig
from .mdbook_summarizer import MdbookSummarizer
from .doc_dump_summarizer import DocDumpSummarizer


class DocumentationType(Enum):
    """Supported documentation types"""
    MDBOOK = "mdbook"
    DOCDUMP = "docdump"
    # Future types can be added here
    # SPHINX = "sphinx"
    # DOCUSAURUS = "docusaurus"
    

class SummarizerFactory:
    """Factory for creating appropriate summarizer instances"""
    
    _summarizers: dict[DocumentationType, type[BaseSummarizer]] = {
        DocumentationType.MDBOOK: MdbookSummarizer,
        DocumentationType.DOCDUMP: DocDumpSummarizer,
    }
    
    @classmethod
    def create(cls, doc_type: DocumentationType, config: SummarizerConfig) -> BaseSummarizer:
        """Create a summarizer instance for the given documentation type"""
        if doc_type not in cls._summarizers:
            raise ValueError(
                f"Unsupported documentation type: {doc_type}. "
                f"Supported types: {', '.join(dt.value for dt in cls.get_supported_types())}"
            )
            
        summarizer_class = cls._summarizers[doc_type]
        return summarizer_class(config)
        
    @classmethod
    def get_supported_types(cls) -> list[DocumentationType]:
        """Get list of supported documentation types"""
        return list(cls._summarizers.keys())
        
    @classmethod
    def register_summarizer(
        cls, 
        doc_type: DocumentationType, 
        summarizer_class: type[BaseSummarizer]
    ):
        """Register a new summarizer type (for extensibility)"""
        cls._summarizers[doc_type] = summarizer_class
