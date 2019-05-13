"""
encrypt and decrypt functions that use Cryptodome and the AES
algorithm to encrypt and decrypt plain utf8 text
https://www.pycryptodome.org/en/latest/src/cipher/aes.html
"""

from base64 import b64encode, b64decode
from random import randint

from Cryptodome.Cipher import AES

from app import settings

__all__ = ['encrypt', 'decrypt']


# KEY should be 256 bits or 32 bytes
KEY = bytes(settings.SECRET_KEY, 'utf8')[:32]


def _pad(txt, block_size=16):
    padding = block_size - (len(txt) % block_size)
    return txt + '\0' + ''.join([chr(randint(ord('!'), ord('~'))) for x in range(padding - 1)])


def encrypt(plaintext, key=KEY):
    # AES block size requires the plaintext to be a multiple of 16-bytes
    plaintext = _pad(plaintext)
    cipher = AES.new(key, AES.MODE_EAX)
    ciphertext, tag = cipher.encrypt_and_digest(bytes(plaintext, 'utf8'))

    encoded_tag = b64encode(tag).decode('utf8')
    encoded_nonce = b64encode(cipher.nonce).decode('utf8')
    encoded_ciphertext = b64encode(ciphertext).decode('utf8')

    return f'$aes${encoded_tag}${encoded_nonce}${encoded_ciphertext}'


def decrypt(ciphertext, key=KEY):
    ciphertext = ciphertext.split('$')
    decoded_tag = b64decode(ciphertext[2])
    decoded_nonce = b64decode(ciphertext[3])
    decoded_ciphertext = b64decode(ciphertext[4])

    cipher = AES.new(key, AES.MODE_EAX, decoded_nonce)
    plaintext = cipher.decrypt_and_verify(decoded_ciphertext, decoded_tag)

    return plaintext.decode('utf8').split('\0')[0]
