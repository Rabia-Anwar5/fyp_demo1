"""Structured logging setup."""
import logging
import sys
from .config import settings

try:
    import structlog
    def setup_logging():
        logging.basicConfig(
            level=getattr(logging, settings.LOG_LEVEL, logging.INFO),
            stream=sys.stdout,
            format="%(message)s",
        )
        structlog.configure(
            processors=[
                structlog.contextvars.merge_contextvars,
                structlog.processors.add_log_level,
                structlog.processors.TimeStamper(fmt="iso"),
                structlog.dev.ConsoleRenderer() if settings.DEBUG else structlog.processors.JSONRenderer(),
            ],
            wrapper_class=structlog.make_filtering_bound_logger(
                getattr(logging, settings.LOG_LEVEL, logging.INFO)
            ),
            logger_factory=structlog.PrintLoggerFactory(),
        )

    logger = structlog.get_logger()
except ImportError:
    logging.basicConfig(
        level=getattr(logging, settings.LOG_LEVEL, logging.INFO),
        stream=sys.stdout,
        format="%(asctime)s [%(levelname)s] %(message)s",
    )
    class StandardLoggerWrapper:
        def __init__(self, l, ctx=None):
            self.l = l
            self.ctx = ctx or {}
        def bind(self, **kwargs):
            new_ctx = {**self.ctx, **kwargs}
            return StandardLoggerWrapper(self.l, new_ctx)
        def info(self, msg, **kwargs):
            extra = {**self.ctx, **kwargs}
            self.l.info(f"{msg} {extra}" if extra else msg)
        def warning(self, msg, **kwargs):
            extra = {**self.ctx, **kwargs}
            self.l.warning(f"{msg} {extra}" if extra else msg)
        def error(self, msg, **kwargs):
            extra = {**self.ctx, **kwargs}
            self.l.error(f"{msg} {extra}" if extra else msg)
        def debug(self, msg, **kwargs):
            extra = {**self.ctx, **kwargs}
            self.l.debug(f"{msg} {extra}" if extra else msg)

    def setup_logging():
        pass
    logger = StandardLoggerWrapper(logging.getLogger("catch-ai"))