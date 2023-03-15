## Installation

```sh
npm install
```


## Starting the server

```sh
GCS_BUCKET=<your-bucket-name-here> \
GCS_PREFIX=<your-object-name-prefix-here> \
npm run dev
```


## Usage

```sh
PATH_TO_FILE_1=data/fox-00
PATH_TO_FILE_2=data/fox-01

# Start new upload
curl -i -X POST --data-binary @${PATH_TO_FILE_1} \
  -H "Content-Range: bytes 0-524287/*"
  http://localhost:3000/files

# Resume upload (replace {id} in url with id from previous response)
curl -i -X PATCH --data-binary @${PATH_TO_FILE_2} \
  -H "Content-Range: bytes 524288-809954/809955" \
  http://localhost:3000/files/{id}
```


## Helpful tips

To split a file into multiple parts:

```sh
split -n $NUMBER_OF_PARTS -d $INPUT_FILE_PATH $PREFIX
```

Example

Chunk by number (of files):
```sh
split -n 2 -d data/fox.jpg data/fox-
```

Chunk by size:
```sh
split -b 512K -d data/fox.jpg data/fox-
```
