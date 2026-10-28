from pydantic import BaseModel, ConfigDict, field_validator
from app.models.enums import AgentRole


class AgentBrief(BaseModel):
    id: int
    name: str

    model_config = ConfigDict(from_attributes=True)


class AgentOut(BaseModel):
    id: int
    name: str
    email: str
    role: AgentRole

    model_config = ConfigDict(from_attributes=True)


class LoginRequest(BaseModel):
    email: str
    password: str

    @field_validator("email")
    @classmethod
    def validate_email_format(cls, v: str) -> str:
        v = v.strip().lower()
        if not v or "@" not in v:
            raise ValueError("Invalid email format")
        return v


class LoginResponse(BaseModel):
    token: str
    agent: AgentOut
