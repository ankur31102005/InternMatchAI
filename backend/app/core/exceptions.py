"""
Custom application exceptions with HTTP status codes.
"""

from fastapi import HTTPException, status


class InternMatchError(Exception):
    """Base exception for all application errors."""
    pass


class UserAlreadyExistsError(InternMatchError):
    pass


class InvalidCredentialsError(InternMatchError):
    pass


class UserNotFoundError(InternMatchError):
    pass


class ResumeNotFoundError(InternMatchError):
    pass


class InternshipNotFoundError(InternMatchError):
    pass


class FileTooLargeError(InternMatchError):
    pass


class UnsupportedFileTypeError(InternMatchError):
    pass


class ApplicationAlreadyExistsError(InternMatchError):
    pass


class InternshipNotActiveError(InternMatchError):
    pass


# ── HTTP Exception Factories ──────────────────────────────────

def http_400(detail: str) -> HTTPException:
    return HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=detail)


def http_401(detail: str = "Not authenticated") -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=detail,
        headers={"WWW-Authenticate": "Bearer"},
    )


def http_403(detail: str = "Forbidden") -> HTTPException:
    return HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=detail)


def http_404(detail: str = "Not found") -> HTTPException:
    return HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=detail)


def http_409(detail: str) -> HTTPException:
    return HTTPException(status_code=status.HTTP_409_CONFLICT, detail=detail)


def http_422(detail: str) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=detail
    )
