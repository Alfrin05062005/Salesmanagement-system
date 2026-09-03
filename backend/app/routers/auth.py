from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth import verify_password, create_access_token
from app import models, schemas

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """
    OAuth2-compatible login. Accepts `username` and `password` as form fields
    (this is what makes /docs' 'Authorize' button and standard OAuth2 clients work).
    """
    user = db.query(models.User).filter(models.User.username == form_data.username).first()

    # Deliberately generic error message: do not reveal whether the username exists.
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is disabled")

    access_token = create_access_token(data={"sub": user.id, "role": user.role.value})
    return schemas.Token(access_token=access_token, role=user.role, full_name=user.full_name)
