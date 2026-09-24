import { put, head, list, get, BlobNotFoundError } from '@vercel/blob';

// The store the user connected via the dashboard's Storage tab defaults to private
// access, and Vercel names its token BLOB_READ_WRITE_TOKEN_READ_WRITE_TOKEN rather
// than the plain BLOB_READ_WRITE_TOKEN the SDK falls back to — pass both explicitly.
const ACCESS = 'private';
const TOKEN = process.env.BLOB_READ_WRITE_TOKEN_READ_WRITE_TOKEN || process.env.BLOB_READ_WRITE_TOKEN;

const BASE_OPTS = { access: ACCESS, contentType: 'application/json', addRandomSuffix: false, token: TOKEN };

/**
 * allowOverwrite defaults to false: this makes the storage layer itself reject a second
 * write to the same key (blob throws) as a backstop for the immutability rule, on top of
 * the existence check callers do before writing.
 */
export async function putJson(key, data, { allowOverwrite = false } = {}) {
  const body = JSON.stringify(data);
  return put(key, body, { ...BASE_OPTS, allowOverwrite });
}

export async function existsKey(key) {
  try {
    await head(key, { token: TOKEN });
    return true;
  } catch (err) {
    if (isNotFound(err)) return false;
    throw err;
  }
}

export async function getJson(key) {
  const result = await get(key, { access: ACCESS, token: TOKEN });
  if (!result?.stream) return null;
  const text = await new Response(result.stream).text();
  return JSON.parse(text);
}

export async function listJson(prefix) {
  const { blobs } = await list({ prefix, token: TOKEN });
  const results = await Promise.all(blobs.map((b) => getJson(b.pathname)));
  return results.filter(Boolean);
}

function isNotFound(err) {
  // @vercel/blob's error classes don't set `err.name`, so `instanceof` is the reliable check.
  return err instanceof BlobNotFoundError || err?.status === 404 || err?.statusCode === 404;
}
