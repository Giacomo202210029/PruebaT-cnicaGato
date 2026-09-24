import { put, head, list, BlobNotFoundError } from '@vercel/blob';

// Vercel's Storage tab connects a Blob store under a prefixed name
// (BLOB_READ_WRITE_TOKEN_READ_WRITE_TOKEN) rather than the plain
// BLOB_READ_WRITE_TOKEN the SDK defaults to — pass it explicitly, with the
// plain name as a fallback for setups where it *is* the default var.
const TOKEN = process.env.BLOB_READ_WRITE_TOKEN_READ_WRITE_TOKEN || process.env.BLOB_READ_WRITE_TOKEN;

const BASE_OPTS = { access: 'public', contentType: 'application/json', addRandomSuffix: false, token: TOKEN };

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
  try {
    const meta = await head(key, { token: TOKEN });
    const res = await fetch(meta.url);
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    if (isNotFound(err)) return null;
    throw err;
  }
}

export async function listJson(prefix) {
  const { blobs } = await list({ prefix, token: TOKEN });
  const results = await Promise.all(
    blobs.map(async (b) => {
      const res = await fetch(b.url);
      return res.ok ? res.json() : null;
    }),
  );
  return results.filter(Boolean);
}

function isNotFound(err) {
  // @vercel/blob's error classes don't set `err.name`, so `instanceof` is the reliable check.
  return err instanceof BlobNotFoundError || err?.status === 404 || err?.statusCode === 404;
}
