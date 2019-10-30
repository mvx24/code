import os

import aiohttp

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
