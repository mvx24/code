from typing import Dict

from pydantic import Schema

from .media import Media, MediaSize


IMAGE_SIZES = (
    MediaSize.THUMBNAIL,
    MediaSize.CARD,
    MediaSize.LARGE,
    MediaSize.NORMALIZED,
    MediaSize.ORIGINAL,
)


class Image(Media):
    has_alpha: bool = Schema(
        False, title="Image has transparent background", read_only=True
    )
    exif: Dict[str, str] = Schema({}, index=True, read_only=True)
