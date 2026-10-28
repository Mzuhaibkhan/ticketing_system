from pydantic import BaseModel, ConfigDict
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

