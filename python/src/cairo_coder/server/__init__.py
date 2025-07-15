"""
FastAPI server package for Cairo Coder.

This package contains the FastAPI microservice implementation for serving
the Cairo Coder RAG pipeline via HTTP and WebSocket endpoints.
"""

from .app import CairoCoderServer, create_app, app

__all__ = [
    "CairoCoderServer",
    "create_app", 
    "app"
]