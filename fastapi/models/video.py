from pydantic import Schema

from .media import Media, MediaSize

POSTER_SIZES = (MediaSize.THUMBNAIL, MediaSize.CARD)
VIDEO_SIZES = (MediaSize.STANDARD, MediaSize.ORIGINAL)


class Video(Media):
    duration: int = Schema(
        0, title="The length of the video in seconds", read_only=True
    )
    silent: bool = Schema(
        False, title="Is the video missing an audio track", read_only=True
    )
    loop: bool = Schema(False, title="Should the video be shown in a loop")
