"""
Password hashing functions that uses scrypt built-in to Python.
"""

from base64 import b64encode, b64decode
from hashlib import scrypt
from os import urandom

__all__ = ["is_hashed_password", "hash_password", "check_password"]


PASSWORD_HASH_LEN = 187


def is_hashed_password(password):
    return len(password) == PASSWORD_HASH_LEN and password.startswith("$scrypt-")


def hash_password(password, salt=None):
    password = bytes(password, "utf8")
    if not salt:
        salt = urandom(64)
    else:
        salt = b64decode(salt)

    # Use recommended parameters from - https://godoc.org/golang.org/x/crypto/scrypt
    # maxmem needs to be greater than the approximate requirements of 128*N*r*p bytes
    hashed = scrypt(
        password, salt=salt, n=(2 ** 15), r=8, p=1, maxmem=(1024 * 1024 * 40), dklen=64
    )
    encoded_salt = b64encode(salt).decode("utf8")
    encoded_hashed = b64encode(hashed).decode("utf8")

    # Return modular crypt format. Not a standard but guess something close.
    # Where "$scrypt" indicates the algorithm and "-0" indicates
    # the version of the set of parameters used (N, r, p) (2**15, 8, 1)
    # If upgrading the hash parameters, increment the version number and
    # change the function to check passwords with different parameter sets
    # https://passlib.readthedocs.io/en/stable/modular_crypt_format.html
    return f"$scrypt-0${encoded_salt}${encoded_hashed}"


def check_password(password, hashed):
    salt = hashed.split("$")[2]
    return hash_password(password, salt) == hashed
