import aiohttp
import os

from .b2 import b2, b2_authorize_account, b2_get_bucket_id


def create_s3_download_url(bucket, key):
    key_id = os.getenv('AWS_ACCESS_KEY_ID')
    access_key = os.getenv('AWS_SECRET_ACCESS_KEY')
    assert key_id and access_key
    # https://boto3.amazonaws.com/v1/documentation/api/latest/reference/services/s3.html#S3.Client.generate_presigned_url
    import boto3
    s3 = boto3.client('s3')
    return s3.generate_presigned_url('get_object', {
        'Bucket': bucket,
        'Key': key,
    })


async def create_b2_download_url(bucket, file_name):
    """Returns a download URL"""
    async with aiohttp.ClientSession() as session:
        auth = await b2_authorize_account(session)
        bucket_id = await b2_get_bucket_id(session, auth, bucket)
        data = {'bucketId': bucket_id, 'fileNamePrefix': file_name, 'validDurationInSeconds': 3600}
        response = await b2(session, 'b2_get_upload_url', {}, auth, data)
        return f'{auth['downloadUrl']}/file/{bucket}/{file_name}'
