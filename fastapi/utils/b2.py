import json
import os
from base64 import b64encode

from utils.http import decode_response


async def b2(session, endpoint, headers, auth=None, data=None):
    if endpoint.startswith("https://"):
        url = endpoint
    else:
        origin = auth["apiUrl"] if auth else "https://api.backblazeb2.com"
        url = f"{origin}/b2api/v2/{endpoint}"
    headers["Accept"] = "application/json"
    if auth:
        headers.setdefault("Authorization", auth["authorizationToken"])
    if data:
        if isinstance(data, str):
            data = data.encode("utf-8")
        elif not isinstance(data, (str, bytes)):
            data = json.dumps(data).encode("utf-8")
            headers["Content-Type"] = "application/json"
        async with session.post(url, headers=headers, data=data) as response:
            return await decode_response(response)
    else:
        async with session.get(url, headers=headers) as response:
            return await decode_response(response)


async def b2_authorize_account(session):
    app_key_id = os.getenv("B2_APPLICATION_KEY_ID")
    app_key = os.getenv("B2_APPLICATION_KEY")
    assert app_key_id and app_key
    encoded = b64encode(f"{app_key_id}:{app_key}".encode("utf-8")).decode("utf-8")
    return await b2(
        session, "b2_authorize_account", headers={"Authorization": f"Basic {encoded}"}
    )


BUCKET_ID_CACHE = {}


async def b2_get_bucket_id(session, auth, bucket):
    if bucket in BUCKET_ID_CACHE:
        return BUCKET_ID_CACHE[bucket]
    buckets = await b2(
        session, "b2_list_buckets", {}, auth, {"accountId": auth["accountId"]}
    )
    updates = {entry["bucketName"]: entry["bucketId"] for entry in buckets["buckets"]}
    BUCKET_ID_CACHE.update(updates)
    return updates.get(bucket)
