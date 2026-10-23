import re

MAX_STOCK = 2_147_483_647


def validate_phone(value: str) -> str:
    value = value.strip()
    digits = re.sub(r"\D", "", value)
    if not re.fullmatch(r"\+?[0-9 ()-]+", value) or not 7 <= len(digits) <= 15:
        raise ValueError("Enter a valid phone number with 7 to 15 digits.")
    return value
