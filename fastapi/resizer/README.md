## Docker Build and Running

`docker build -t resizer .`

`docker run --rm -v /inputfile/directory:/run resizer /run/inputfile.jpeg 100x100`

## Deploying to Lambda

`docker run --rm --entrypoint "yarn deploy" resizer`
