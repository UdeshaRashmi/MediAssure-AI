from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


from app.schemas.validation import MAX_STOCK, validate_phone


class InventoryCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True, allow_inf_nan=False)

    medicine: str = Field(min_length=1, max_length=160)
    generic: str = Field(min_length=1, max_length=160)
    category: str = Field(min_length=1, max_length=100)
    strength: str = Field(default="", max_length=80)
    requires_prescription: bool = True
    is_open: bool = False
    opening_hours: str = Field(default="", max_length=255)
    stock: int = Field(ge=0, le=MAX_STOCK, strict=True)
    reserved: int = Field(default=0, ge=0, le=MAX_STOCK, strict=True)
    reorder_level: int = Field(default=10, ge=0, le=MAX_STOCK, strict=True)
    pharmacy_name: str = Field(min_length=1, max_length=160)
    area: str = Field(min_length=1, max_length=255)
    contact_number: str = Field(min_length=1, max_length=32)
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)

    @field_validator("contact_number")
    @classmethod
    def valid_contact_number(cls, value: str) -> str:
        return validate_phone(value)

    @model_validator(mode="after")
    def validate_reserved_stock(self) -> "InventoryCreate":
        if self.reserved > self.stock:
            raise ValueError("Reserved stock cannot exceed total stock")
        return self

