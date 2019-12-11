from pydantic import Schema

from .media import Media, MediaSize


VIDEO_SIZES = (MediaSize.THUMBNAIL,)


class Video(Media):
    duration: int = Schema(
        0, title="The length of the video in seconds", read_only=True
    )
    silent: bool = Schema(
        False, title="Is the video missing an audio track", read_only=True
    )
    loop: bool = Schema(False, title="Should the video be shown in a loop")
