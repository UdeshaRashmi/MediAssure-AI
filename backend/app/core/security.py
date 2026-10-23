from hashlib import pbkdf2_hmac
from hmac import compare_digest
from secrets import token_hex

def hash_password(password: str) -> str:
    salt = token_hex(16)
    digest = pbkdf2_hmac("sha256", password.encode(), bytes.fromhex(salt), 600_000).hex()
    return f"pbkdf2_sha256$600000${salt}${digest}"


def verify_password(password: str, stored: str) -> bool:
    try:
        algorithm, rounds, salt, expected = stored.split("$")
        if algorithm != "pbkdf2_sha256":
            return False
        actual = pbkdf2_hmac("sha256", password.encode(), bytes.fromhex(salt), int(rounds)).hex()
        return compare_digest(actual, expected)
    except (ValueError, TypeError):
        return False


DUMMY_HASH = hash_password("invalid-account-password")
