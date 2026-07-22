"""Core package init."""

from app.core.exceptions import (
    InternMatchError,
    UserAlreadyExistsError,
    InvalidCredentialsError,
    UserNotFoundError,
    ResumeNotFoundError,
    InternshipNotFoundError,
    FileTooLargeError,
    UnsupportedFileTypeError,
    ApplicationAlreadyExistsError,
)
from app.core.dependencies import (
    get_current_user,
    get_current_admin,
    CurrentUser,
    CurrentAdmin,
)

__all__ = [
    "InternMatchError",
    "UserAlreadyExistsError",
    "InvalidCredentialsError",
    "UserNotFoundError",
    "ResumeNotFoundError",
    "InternshipNotFoundError",
    "FileTooLargeError",
    "UnsupportedFileTypeError",
    "ApplicationAlreadyExistsError",
    "get_current_user",
    "get_current_admin",
    "CurrentUser",
    "CurrentAdmin",
]
