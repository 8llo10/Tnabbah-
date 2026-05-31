"""
Supabase JWT authentication helpers for tnabbah diagnostics.

The mobile app/web SPA authenticates with Supabase Auth and receives a
signed JWT (HS256, signed with ``SUPABASE_JWT_SECRET``). Every protected
endpoint in this backend must:

  1) Extract the bearer token from the ``Authorization`` header.
  2) Verify the signature + expiry against ``SUPABASE_JWT_SECRET``.
  3) Use the ``sub`` claim as the canonical user id.
  4) Refuse the request if the user id in the body/path/query does not
     match the authenticated user (``ensure_owner``).

Environment variables:
    SUPABASE_JWT_SECRET      — required, the HS256 secret from Supabase.
    SUPABASE_JWT_AUDIENCE    — defaults to "authenticated".
    TNABBAH_DISABLE_AUTH     — "true" to bypass JWT in local dev only.
    TNABBAH_DEV_USER_ID      — required when auth is disabled, used as
                               the synthetic user id for every request.
"""
from __future__ import annotations

import logging
import os
from typing import Optional

from fastapi import Header, HTTPException, status

try:
    import jwt  # PyJWT
except ImportError:  # pragma: no cover - dependency missing
    jwt = None  # type: ignore[assignment]

logger = logging.getLogger(__name__)

_SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET", "").strip()
_JWT_AUDIENCE = os.getenv("SUPABASE_JWT_AUDIENCE", "authenticated").strip() or "authenticated"
_AUTH_DISABLED = os.getenv("TNABBAH_DISABLE_AUTH", "false").lower() in ("true", "1", "yes", "on")
_DEV_USER_ID = os.getenv("TNABBAH_DEV_USER_ID", "").strip()


def _extract_bearer(authorization: Optional[str]) -> str:
    """Return the raw token from a ``Bearer <token>`` header, or 401."""
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Authorization header",
            headers={"WWW-Authenticate": "Bearer"},
        )
    parts = authorization.split(None, 1)
    if len(parts) != 2 or parts[0].lower() != "bearer" or not parts[1].strip():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Authorization header",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return parts[1].strip()


def verify_supabase_jwt(token: str) -> str:
    """Verify a Supabase HS256 JWT and return the ``sub`` (user id) claim."""
    if jwt is None:
        logger.error("PyJWT not installed; cannot verify Supabase token")
        raise HTTPException(status_code=503, detail="Authentication not configured")
    if not _SUPABASE_JWT_SECRET:
        logger.error("SUPABASE_JWT_SECRET is not set; refusing to authenticate")
        raise HTTPException(status_code=503, detail="Authentication not configured")

    try:
        payload = jwt.decode(
            token,
            _SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            audience=_JWT_AUDIENCE,
            options={"require": ["exp", "sub"]},
        )
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expired",
            headers={"WWW-Authenticate": 'Bearer error="invalid_token"'},
        )
    except jwt.InvalidTokenError as exc:
        logger.debug("JWT verification failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
            headers={"WWW-Authenticate": 'Bearer error="invalid_token"'},
        )

    sub = str(payload.get("sub") or "").strip()
    if not sub:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token missing sub")
    return sub


async def current_user(
    authorization: Optional[str] = Header(default=None, alias="Authorization"),
) -> str:
    """FastAPI dependency returning the authenticated Supabase user id.

    Setting ``TNABBAH_DISABLE_AUTH=true`` together with ``TNABBAH_DEV_USER_ID``
    bypasses verification — local development only. Never enable in production.
    """
    if _AUTH_DISABLED:
        if not _DEV_USER_ID:
            raise HTTPException(
                status_code=503,
                detail="Auth disabled but TNABBAH_DEV_USER_ID not set",
            )
        logger.warning("⚠️ Auth disabled — using TNABBAH_DEV_USER_ID for request")
        return _DEV_USER_ID

    token = _extract_bearer(authorization)
    return verify_supabase_jwt(token)


def ensure_owner(authenticated_uid: str, requested_user_id: str) -> None:
    """403 if the JWT subject does not match the user_id in the request."""
    if not requested_user_id or authenticated_uid != requested_user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: user_id does not match authenticated user",
        )
