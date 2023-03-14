import { Storage } from '@google-cloud/storage';
import fastify from 'fastify';
import { uid } from './internal/uid';
import { pipeline } from 'stream';
import { promisify } from 'util';
import { parseContentRange } from './internal/content-range';
import { parseContentLength } from './internal/content-length';

const gcsBucket = process.env.GCS_BUCKET || '';
const gcsObjectPrefix = process.env.GCS_PREFIX || 'uploads';
const pipe = promisify(pipeline);
const storage = new Storage({});

type FileUploadRecord = {
  id: string;
  uri: string;
  expires: number;
};

const db = {
  files: new Map<string, FileUploadRecord>(),
};

const server = fastify();

server.addContentTypeParser('*', (request, payload, done) => done(null));

/**
 * Upload a file:
 * curl -i -X POST --data-binary @${PATH_TO_FILE} \
 *   http://localhost:3000/files
 */
server.post('/files', async function create(req, res) {
  const id = uid();
  const name = `${gcsObjectPrefix}/${id}`;
  const file = storage.bucket(gcsBucket).file(name);
  const [uri] = await file.createResumableUpload();

  await pipe(
    req.raw,
    file.createWriteStream({
      resumable: true,
      uri,
    }),
  );

  const record: FileUploadRecord = {
    id,
    uri,
    expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
  };

  db.files.set(id, record);

  res.status(201).send(record);
});

/**
 * Resume an upload:
 */
server.patch('/files/:id', async function update(req, res) {
  const headers = req.headers;
  const params = req.params as any;
  const contentLength = parseContentLength(headers['content-length']);
  const contentRange = parseContentRange(headers['content-range']);

  const id = params.id;
  const file = db.files.get(id);

  if (!file) {
    throw { statusCode: 404, message: `No such file: ${id}` };
  }

  if (file.expires < Date.now()) {
    throw { statusCode: 410, message: `No such file: ${id}` };
  }

  const name = `${gcsObjectPrefix}/${id}`;
  const object = storage.bucket(gcsBucket).file(name);
  const rangeStart = contentRange?.rangeStart ?? 0;
  // const rangeEnd = contentRange?.rangeEnd ?? contentLength;

  await pipe(
    req.raw,
    object.createWriteStream({
      resumable: true,
      offset: rangeStart,
      uri: file.uri,
    }),
  );

  res.status(200).send({ ok: true });
});

async function start() {
  try {
    const address = await server.listen({ port: 3000, host: '0.0.0.0' });
    console.log(`Listening on ${address}`);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

if (require.main === module) {
  start();
}
