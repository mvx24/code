import re
import sys
import unicodedata


def latinize(string):
    return (
        unicodedata.normalize("NFD", string).encode("ascii", "ignore").decode("utf-8")
    )


def normalize_tag(tag):
    return tag.replace(" ", "").lower().strip("#")


_HASHTAG_INVALID_CHARS = re.compile("[#!$%^&*\(\)\{\}\[\];?+=\-.,@\s\"']")


def normalize_hashtag(hashtag):
    """
    Only allow letters and digits.
    :param hashtag:
    :return:
    """
    return _HASHTAG_INVALID_CHARS.sub("", hashtag)


if sys.maxunicode > 0x10000:
    # For python builds with wide char support, otherwise a re error will be thrown
    _EMOJI_CHARS = re.compile(
        u"[\U0001F1E0-\U0001F6FF]|[\U00002702-\U000027B0]|[\U000024C2-\U0001F251]",
        flags=re.UNICODE,
    )
else:
    _EMOJI_CHARS = re.compile(
        u"[\U00002702-\U000027B0]|[\U000024C2-\U0001F251]", flags=re.UNICODE
    )


def remove_emojis(s, c="~"):
    return _EMOJI_CHARS.sub(c, s)
