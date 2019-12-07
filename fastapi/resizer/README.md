## Docker Build and Running

`docker build -t resizer .`

`docker run --rm -v /inputfile/directory:/run/resizer resizer /run/resizer/inputfile.jpeg 100x100`

## Docker as an HTTP Service

`docker run --rm -v /inputfile/directory:/run/resizer -p 8005:8005 resizer server`

`curl http://localhost:8005?filename=inputfile.jpeg&sizes=100x100`

## Deploying to Lambda

`docker run --rm --entrypoint "yarn deploy" resizer`
