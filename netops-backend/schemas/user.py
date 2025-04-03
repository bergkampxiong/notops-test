from pydantic import BaseModel
from typing import Optional

class Token(BaseModel):
    access_token: str
    token_type: str
    refresh_token: Optional[str] = None
    expires_in: Optional[int] = None

class TokenData(BaseModel):
    username: Optional[str] = None

class UserBase(BaseModel):
    username: str
    email: Optional[str] = None

class UserCreate(UserBase):
    password: str
    department: Optional[str] = None
    role: Optional[str] = "Operator"
    is_active: Optional[bool] = True
    totp_enabled: Optional[bool] = False

class UserInDB(UserBase):
    id: int
    is_active: bool
    hashed_password: str
    
    class Config:
        orm_mode = True

class UserOut(UserBase):
    id: int
    is_active: bool
    is_ldap_user: bool
    department: Optional[str]
    role: str
    totp_enabled: bool
    last_login: Optional[str]
    
    class Config:
        orm_mode = True 