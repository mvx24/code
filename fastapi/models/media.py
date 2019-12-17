from datetime import datetime
from enum import Enum
from typing import Set

from pydantic import Schema, validator, constr

from database.models import AbstractDbBaseModel
from database.types import ForeignKey, HttpUrl


def _id_path(id_, size, ext="jpeg"):
    id_ = str(id_)
    return f"{size}/{id_[0:2]}/{id_[2:4]}/{id_[4:6]}/{id_}.{ext}"


class MediaSize(str, Enum):
    THUMBNAIL = "150x150"
    CARD = "450"
    LARGE = "x720"
    NORMALIZED = "x"

    POSTER = "poster"
    STANDARD = "x480"
    WIDESCREEN = "x1080"

    ORIGINAL = "original"


class MediaFormat(str, Enum):
    UNKNOWN = "unknown"
    PNG = "png"
    JPEG = "jpeg"
    TIFF = "tiff"
    WEBP = "webp"
    HEIC = "heic"

    MPEG4 = "mp4"
    WEBM = "webm"
    QUICKTIME = "mov"
    OGG = "ogv"
    FLASH = "flv"
    MOBILE = "3gp"
    GIF = "gif"

    def __str__(self):
        return self.value


class Media(AbstractDbBaseModel):
    user_id: ForeignKey
    name: constr(max_length=63) = Schema("", index=True)
    caption: str = ""
    size: int = Schema(0, title="Size in bytes", read_only=True)
    width: int = Schema(0, title="Pixel width", read_only=True)
    height: int = Schema(0, title="Pixel height", read_only=True)
    format: MediaFormat = Schema(MediaFormat.UNKNOWN, read_only=True)
    tags: Set[str] = Schema(set(), index=True)
    created: datetime = Schema(None, auto_now_add=True)
    updated: datetime = Schema(None, auto_now=True)

    thumbnail_url: HttpUrl = Schema("http://default.example", computed=True)
    card_url: HttpUrl = Schema("http://default.example", computed=True)
    large_url: HttpUrl = Schema("http://default.example", computed=True)
    normalized_url: HttpUrl = Schema("http://default.example", computed=True)
    original_url: HttpUrl = Schema("http://default.example", computed=True)
    poster_url: HttpUrl = Schema("http://default.example", computed=True)

    @validator("thumbnail_url", pre=True, always=True)
    def set_thumbnail_url(cls, v, values):
        if values and values.get("id"):
            return f"https://media.digibook.app/{_id_path(values['id'], MediaSize.THUMBNAIL)}"
        return v

    @validator("card_url", pre=True, always=True)
    def set_card_url(cls, v, values):
        if values and values.get("id"):
            return (
                f"https://media.digibook.app/{_id_path(values['id'], MediaSize.CARD)}"
            )
        return v

    @validator("large_url", pre=True, always=True)
    def set_large_url(cls, v, values):
        if values and values.get("id"):
            return (
                f"https://media.digibook.app/{_id_path(values['id'], MediaSize.LARGE)}"
            )
        return v

    @validator("normalized_url", pre=True, always=True)
    def set_normalized_url(cls, v, values):
        if values and values.get("id"):
            return f"https://media.digibook.app/{_id_path(values['id'], MediaSize.NORMALIZED)}"
        return v

    @validator("poster_url", pre=True, always=True)
    def set_poster_url(cls, v, values):
        if values and values.get("id"):
            return (
                f"https://media.digibook.app/{_id_path(values['id'], MediaSize.POSTER)}"
            )
        return v

    @validator("original_url", pre=True, always=True)
    def set_original_url(cls, v, values):
        if values and values.get("id"):
            return f"https://media.digibook.app/{_id_path(values['id'], MediaSize.ORIGINAL)}"
        return v
