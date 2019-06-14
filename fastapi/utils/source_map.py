import aiohttp

from app import settings
from utils.bunnycdn import bunny
from utils.downloads import create_s3_download_url, create_b2_download_url


async def download_source_map(filename):
    if not settings.SOURCEMAP_BUCKET or not settings.SOURCEMAP_BUCKET_PROVIDER:
        return ''
    bucket = settings.SOURCEMAP_BUCKET
    provider = settings.SOURCEMAP_BUCKET_PROVIDER
    if provider == 'b2':
        url = await create_b2_download_url(bucket, filename)
        async with aiohttp.ClientSession() as session:
            async with session.get(url) as response:
                return await response.text()
    elif provider == 'bunnycdn':
        async with aiohttp.ClientSession() as session:
            return await bunny(session, f'{bucket}/{filename}', None, True)
    elif provider == 's3':
        url = create_s3_download_url(bucket, filename)
        async with aiohttp.ClientSession() as session:
            async with session.get(url) as response:
                return await response.text()
