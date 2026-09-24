import { put, head, list } from '@vercel/blob';

const BASE_OPTS = { access: 'public', contentType: 'application/json', addRandomSuffix: false };

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
    await head(key);
    return true;
  } catch (err) {
    if (isNotFound(err)) return false;
    throw err;
  }
}

export async function getJson(key) {
  try {
    const meta = await head(key);
    const res = await fetch(meta.url);
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    if (isNotFound(err)) return null;
    throw err;
  }
}

export async function listJson(prefix) {
  const { blobs } = await list({ prefix });
  const results = await Promise.all(
    blobs.map(async (b) => {
      const res = await fetch(b.url);
      return res.ok ? res.json() : null;
    }),
  );
  return results.filter(Boolean);
}

function isNotFound(err) {
  return err?.name === 'BlobNotFoundError' || err?.status === 404 || err?.statusCode === 404;
}
