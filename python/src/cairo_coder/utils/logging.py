"""Logging configuration for Cairo Coder."""

import logging
import sys
from typing import Any, Dict

import structlog
from structlog.processors import JSONRenderer, TimeStamper, add_log_level


def setup_logging(level: str = "INFO", format_type: str = "json") -> None:
    """
    Configure logging for the application.
    
    Args:
        level: Log level (DEBUG, INFO, WARNING, ERROR).
        format_type: Output format (json or text).
    """
    # Configure standard logging
    logging.basicConfig(
        level=getattr(logging, level.upper()),
        stream=sys.stdout,
        format="%(message)s",
    )
    
    # Configure structlog
    processors = [
        TimeStamper(fmt="iso"),
        add_log_level,
        structlog.processors.format_exc_info,
    ]
    
    if format_type == "json":
        processors.append(JSONRenderer())
    else:
        processors.append(structlog.dev.ConsoleRenderer())
    
    structlog.configure(
        processors=processors,
        logger_factory=structlog.stdlib.LoggerFactory(),
        cache_logger_on_first_use=True,
    )


def get_logger(name: str) -> structlog.stdlib.BoundLogger:
    """
    Get a logger instance.
    
    Args:
        name: Logger name, typically __name__.
        
    Returns:
        Configured logger instance.
    """
    return structlog.get_logger(name)