"""Logging configuration for Cairo Coder.

Goals:
- Respect environment log level (e.g., LOG_LEVEL=INFO|DEBUG|...)
- Only emit our own package logs (silence dependencies by default)
"""

from __future__ import annotations

import logging
import logging.config

import structlog


def _coerce_level(level: str | int | None, default: int = logging.INFO) -> int:
    if isinstance(level, int):
        return level
    if not level:
        return default
    name = str(level).upper()
    return getattr(logging, name, default)


def setup_logging(level: str | int = "INFO", format_type: str = "json") -> None:
    """
    Configure logging for the application using structlog + stdlib logging.

    - Level is read from argument (defaults to "INFO").
      Pass os.environ.get("LOG_LEVEL") to respect environment if desired.
    - Only the "cairo_coder" logger is configured with a handler; all other
      loggers stay silent unless explicitly configured.

    Args:
        level: Log level (e.g. "DEBUG", "INFO", or an int).
        format_type: "json" or "console".
    """
    lvl = _coerce_level(level)

    timestamper = structlog.processors.TimeStamper(fmt="iso")
    pre_chain = [
        structlog.stdlib.add_log_level,
        structlog.stdlib.ExtraAdder(),
        timestamper,
    ]

    # Configure stdlib logging so only our package logger emits.
    # - disable_existing_loggers=True silences already-created 3rd-party loggers
    # - root has no handlers (so propagation to root won't emit)
    # - our package logger ("cairo_coder") has the console handler
    is_console = (format_type or "").lower() == "console"

    logging.config.dictConfig(
        {
            "version": 1,
            "disable_existing_loggers": False,
            "formatters": {
                "console": {
                    "()": structlog.stdlib.ProcessorFormatter,
                    "processors": [
                        structlog.stdlib.ProcessorFormatter.remove_processors_meta,
                        structlog.dev.ConsoleRenderer(colors=True),
                    ],
                    "foreign_pre_chain": pre_chain,
                },
                "json": {
                    "()": structlog.stdlib.ProcessorFormatter,
                    "processors": [
                        structlog.stdlib.ProcessorFormatter.remove_processors_meta,
                        structlog.processors.JSONRenderer(),
                    ],
                    "foreign_pre_chain": pre_chain,
                },
            },
            "handlers": {
                "console": {
                    "class": "logging.StreamHandler",
                    "level": "NOTSET",  # filter by logger level
                    "formatter": "console" if is_console else "json",
                    "stream": "ext://sys.stdout",
                }
            },
            "loggers": {
                # Our package namespace only.
                "cairo_coder": {
                    "handlers": ["console"],
                    "level": logging.getLevelName(lvl),
                    "propagate": False,
                },
                "dspy": {
                    "handlers": ["console"],
                    "level": logging.getLevelName(lvl),
                    "propagate": False,
                },
            },
            "root": {
                "level": "WARNING",
                "handlers": [],  # keep root silent
            },
        }
    )

    # Configure structlog. The filtering bound logger short-circuits work
    # below the selected level for speed.
    structlog.configure(
        processors=[
            structlog.stdlib.add_log_level,
            structlog.stdlib.PositionalArgumentsFormatter(),
            timestamper,
            structlog.processors.StackInfoRenderer(),
            structlog.processors.format_exc_info,
            # Prepare for ProcessorFormatter from stdlib logging
            structlog.stdlib.ProcessorFormatter.wrap_for_formatter,
        ],
        logger_factory=structlog.stdlib.LoggerFactory(),
        wrapper_class=structlog.make_filtering_bound_logger(lvl),
        cache_logger_on_first_use=True,
    )
