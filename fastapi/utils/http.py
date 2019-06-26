from aiohttp import ClientResponseError


async def decode_response(response):
    if response.status <= 400:
        if response.headers.get("CONTENT-TYPE", "").startswith("application/json") and (
            "CONTENT-LENGTH" not in response.headers
            or int(response.headers["CONTENT-LENGTH"])
        ):
            return await response.json()
    else:
        txt = await response.text()
        raise ClientResponseError(
            status=response.status,
            message=f"Request failed: {txt or response.reason}",
            history=response.history,
            request_info=response.request_info,
        )
    return None
