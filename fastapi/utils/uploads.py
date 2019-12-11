import hashlib
import mimetypes
import os
from urllib.parse import urlparse, quote

import aiofiles
import aiohttp

import models
from app import settings
from utils.b2 import b2, b2_authorize_account, b2_get_bucket_id


def create_s3_upload_url(bucket, key):
    """Returns a single presigned url string"""
    key_id = os.getenv("AWS_ACCESS_KEY_ID")
    access_key = os.getenv("AWS_SECRET_ACCESS_KEY")
    assert key_id and access_key
    # https://boto3.amazonaws.com/v1/documentation/api/latest/reference/services/s3.html#S3.Client.generate_presigned_url
    try:
        import boto3

        s3 = boto3.client("s3")
        return s3.generate_presigned_url("put_object", {"Bucket": bucket, "Key": key})
    except ImportError:
        pass


async def create_b2_upload_url(bucket, key):
    """
    Returns a dict with: key, bucketId, uploadUrl, and authorizationToken keys
    Client should upload to uploadUrl with the following headers added:
        "Authorization": authorizationToken
        "Content-Type": detected mime type
        "Content-Length": byte len
        "X-Bz-File-Name": key
        "X-Bz-Content-Sha1": sha1 hex
    """
    async with aiohttp.ClientSession() as session:
        auth = await b2_authorize_account(session)
        bucket_id = await b2_get_bucket_id(session, auth, bucket)
        response = await b2(
            session, "b2_get_upload_url", {}, auth, {"bucketId": bucket_id}
        )
        response["key"] = key
        return response


async def _download_media_upload(url, path, ext=None):
    # Download into url into path
    async with aiohttp.ClientSession() as session:
        if url.find("backblazeb2.com") != -1:
            auth = await b2_authorize_account(session)
            async with session.get(
                url, headers={"Authorization": auth["authorizationToken"]}
            ) as response:
                data = await response.read()
        else:
            async with session.get(url) as response:
                data = await response.read()
        if not ext:
            extensions = mimetypes.guess_all_extensions(response.content_type)
            extensions.sort(key=len, reverse=True)
            ext = extensions and extensions[0] or ".dat"
        path = path + ext
        async with aiofiles.open(path, "wb") as f:
            await f.write(data)
        return os.path.basename(path)


async def _media_streamer(filename):
    async with aiofiles.open(filename, "rb") as f:
        chunk = await f.read(64 * 1024)
        while chunk:
            yield chunk
            chunk = await f.read(64 * 1024)


async def _upload_media(filename, key):
    if settings.MEDIA_BUCKET_PROVIDER == "b2":
        upload_url = await create_b2_upload_url(settings.MEDIA_BUCKET, key)
        async with aiohttp.ClientSession() as session:
            hash_ = hashlib.sha1()
            async for chunk in _media_streamer(filename):
                hash_.update(chunk)
            headers = {
                "Authorization": upload_url["authorizationToken"],
                "Content-Length": str(os.path.getsize(filename)),
                "Content-Type": mimetypes.guess_type(key)[0],
                "X-Bz-File-Name": quote(key),
                "X-Bz-Content-Sha1": hash_.hexdigest(),
            }
            async with session.post(
                upload_url["uploadUrl"], headers=headers, data=_media_streamer(filename)
            ) as response:
                return await response.json()


async def resize_image(model_name, url, sizes, id_):
    # Download into shared /run/resizer directory
    id_ = str(id_)
    ext = os.path.splitext(urlparse(url).path)[1]
    sizes = ",".join(sizes)
    filename = await _download_media_upload(url, f"/run/resizer/{id_}", ext)
    async with aiohttp.ClientSession() as session:
        async with session.get(
            f"http://resizer:8005/?filename={filename}&sizes={sizes}"
        ) as response:
            result = await response.json()
            for size, path in result["paths"].items():
                # Upload to permanent storage (where key is not metadata)
                if size in sizes:
                    await _upload_media(
                        path, f"{size}/{id_[0:2]}/{id_[2:4]}/{id_[4:6]}/{filename}"
                    )
                # Delete the file
                os.remove(path)

            # Save the metadata into the database
            ModelCls = getattr(models, model_name)
            image = await ModelCls.get(id_)
            await image.save(result["metadata"], read_only=True)
            # Example metadata:
            # {"exif":{"DateTimeOriginal":1569428593,"ColorSpace":1,"ExifImageWidth":750,"ExifImageHeight":1334},"format":"jpeg","hasAlpha":false,"width":750,"height":1334}


async def transcode_video(model_name, url, sizes, id_):
    # Download into shared /run/transcoder directory
    id_ = str(id_)
    ext = os.path.splitext(urlparse(url).path)[1]
    sizes = ",".join(sizes)
    filename = await _download_media_upload(url, f"/run/transcoder/{id_}", ext)
    async with aiohttp.ClientSession() as session:
        async with session.get(
            f"http://transcoder:8006/?filename={filename}&sizes={sizes}"
        ) as response:
            result = await response.json()
            for size, path in result["paths"].items():
                # Upload to permanent storage (where key is not metadata)
                if size in sizes:
                    await _upload_media(
                        path, f"{size}/{id_[0:2]}/{id_[2:4]}/{id_[4:6]}/{filename}"
                    )
                # Delete the file
                os.remove(path)

            # Save the metadata into the database
            ModelCls = getattr(models, model_name)
            video = await ModelCls.get(id_)
            await video.save(result["metadata"], read_only=True)


async def delete_media(sizes, id_, ext):
    id_ = str(id_)
    if settings.MEDIA_BUCKET_PROVIDER == "b2":
        async with aiohttp.ClientSession() as session:
            auth = await b2_authorize_account(session)
            bucket_id = await b2_get_bucket_id(session, auth, settings.MEDIA_BUCKET)
            for size in sizes:
                key = f"{size}/{id_[0:2]}/{id_[2:4]}/{id_[4:6]}/{id_}{ext}"
                await b2(
                    session,
                    "b2_hide_file",
                    {},
                    auth,
                    {"bucketId": bucket_id, "fileName": key},
                )
