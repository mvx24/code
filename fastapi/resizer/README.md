## Docker Build and Running

`docker build -t resizer .`

`docker run --rm -v /inputfile/directory:/run/resizer resizer /run/resizer/inputfile.jpeg 100x100`

## Docker as an HTTP Service

`docker run -d --name resizer --rm -v ${PWD}/input:/run/resizer -p 8005:8005 resizer server`

`curl http://localhost:8005?filename=inputfile.jpeg&sizes=100x100`

## Deploying to Lambda

`docker run --rm --entrypoint "yarn deploy" resizer`

## Command line and server args

Run as `node index.js (inputfile) (w1)x(h1) (w2)x(h2) ...`

HTTP requests should run as `http://host:8005/?filename=(filename)&sizes=(w1)x(h1),(w2)x(h2),...`

Where `filename` is relative to `/run/resizer` when `NODE_ENV === 'production'` otherwise the current directory of the server.

Sizes my also be left blank and provided as an environment variable `SIZES` where each size is separated by a comma and no spaces.

## Specifying sizes

Each size should be given as `(width)x(height)`, where either width or height may be omitted. By default a normalized jpeg will be generated with a size of "`x`" regardless if included in the sizes or not. Also, by default the original file will be left intact and returned with a path value of "`original`"

## Output

The original input file may be renamed to have a normalized extension, lowercased and standardized - for example `.jpg` -> `.jpeg` etc. This will be indicated in the output `paths`.

Files will be output into the same directory as the input file along with a metadata file:

- `(filename)-x.jpeg` - as a normalized/rotated jpeg
- `(filename)-(width)x(height).jpeg` - for each size given as an argument
- `(filename)-metadata.json` - containing meta and exif data

Additionally, data will be output either as an HTTP response or via stdout as serialized JSON with the following structure:

- `paths` - an object containing keys for each `(width)x(height)` size, "`x`" normalized file, "`original`" input file, and "`metadata`" files, where values are the absolute paths of each.
- `metadata` - containing the same contents of the metadata.json file
