"""
Converts async functions to sync functions for use in an interactive REPL.
"""

import asyncio

__all__ = ["run_sync", "make_sync"]


def run_sync(coro):
    loop = asyncio.get_event_loop()
    return loop.run_until_complete(coro)


def make_sync(func, instance=None):
    def inner(*args, **kwargs):
        return run_sync(func(*args, **kwargs))

    # Optionally, bind the function to an instance
    # given that func is an unbound method
    if instance:
        # pylint: disable=too-many-function-args
        bound = inner.__get__(instance, instance.__class__)
        setattr(instance, func.__name__, bound)
    return inner
