from fastapi import Header


def is_ajax(x_requested_with: str = Header(None)):
    return x_requested_with == 'XMLHttpRequest'
