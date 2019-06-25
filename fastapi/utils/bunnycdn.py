import json
import os
from mimetypes import guess_type

from app import settings


async def bunny(session, endpoint, data, storage=False):
    access_key = os.getenv("BUNNYCDN_ACCESS_KEY")
    storage_access_key = os.getenv("BUNNYCDN_STORAGE_ACCESS_KEY")
    assert access_key
    assert not storage or storage_access_key
    if storage:
        url = f"https://storage.bunnycdn.com/{endpoint}"
    else:
        url = f"https://bunnycdn.com/api/{endpoint}"
    headers = {
        "Accept": "application/json",
        "AccessKey": storage_access_key if storage else access_key,
    }
    if data:
        if isinstance(data, str):
            data = data.encode("utf8")
        elif not isinstance(data, (str, bytes)):
            data = json.dumps(data).encode("utf8")
            headers["Content-Type"] = "application/json"
        elif storage and isinstance(data, bytes):
            headers["Content-Type"] = guess_type(endpoint)
        if storage:
            async with session.put(url, headers=headers, data=data) as response:
                return await response.json()
        else:
            async with session.post(url, headers=headers, data=data) as response:
                return await response.json()
    else:
        async with session.get(url, headers=headers) as response:
            return await response.json()
