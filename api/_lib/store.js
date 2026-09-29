// Data store backed by a GitHub repo (not Vercel Blob): every "record" is a JSON file
// committed to a dedicated branch, read/written via GitHub's Contents API. GitHub's REST
// API gives 5,000 authenticated requests/hour, flat and free — no metered "advanced
// request" billing tier like Vercel Blob has, which is what burned through that quota
// well before the competition even started. At our scale (a few writes/day, a poll every
// few minutes) this has enormous headroom.
const API_BASE = 'https://api.github.com';
const OWNER = process.env.DATA_REPO_OWNER;
const REPO = process.env.DATA_REPO_NAME;
const BRANCH = process.env.DATA_REPO_BRANCH || 'data-store';
const TOKEN = process.env.GITHUB_DATA_TOKEN;
const PREFIX = 'data/';

function assertConfigured() {
  if (!OWNER || !REPO || !TOKEN) {
    throw new Error('DATA_REPO_OWNER, DATA_REPO_NAME y GITHUB_DATA_TOKEN deben estar configurados.');
  }
}

function authHeaders(extra = {}) {
  return {
    authorization: `Bearer ${TOKEN}`,
    accept: 'application/vnd.github+json',
    'x-github-api-version': '2022-11-28',
    ...extra,
  };
}

function contentsUrl(path) {
  return `${API_BASE}/repos/${OWNER}/${REPO}/contents/${PREFIX}${path}?ref=${encodeURIComponent(BRANCH)}`;
}

async function getFile(key) {
  assertConfigured();
  const res = await fetch(contentsUrl(key), { headers: authHeaders() });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GitHub GET ${key} failed: ${res.status} ${await res.text()}`);
  return res.json();
}

export async function getJson(key) {
  const file = await getFile(key);
  if (!file) return null;
  return JSON.parse(Buffer.from(file.content, 'base64').toString('utf-8'));
}

export async function existsKey(key) {
  return (await getFile(key)) !== null;
}

/**
 * allowOverwrite defaults to false: GitHub's Contents API rejects a PUT without the
 * current file's `sha` when a file already exists there, so omitting `sha` here is the
 * storage-level immutability backstop — the same role @vercel/blob's allowOverwrite:false
 * played before.
 */
export async function putJson(key, data, { allowOverwrite = false } = {}) {
  assertConfigured();
  const body = {
    message: `data: ${key}`,
    content: Buffer.from(JSON.stringify(data)).toString('base64'),
    branch: BRANCH,
  };

  if (allowOverwrite) {
    const existing = await getFile(key);
    if (existing) body.sha = existing.sha;
  }

  const res = await fetch(`${API_BASE}/repos/${OWNER}/${REPO}/contents/${PREFIX}${key}`, {
    method: 'PUT',
    headers: authHeaders({ 'content-type': 'application/json' }),
    body: JSON.stringify(body),
  });

  if (res.status === 409 || res.status === 422) {
    throw new Error('already_exists');
  }
  if (!res.ok) {
    throw new Error(`GitHub PUT ${key} failed: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

async function listDir(prefix) {
  assertConfigured();
  const dirPath = prefix.endsWith('/') ? prefix.slice(0, -1) : prefix;
  const res = await fetch(contentsUrl(dirPath), { headers: authHeaders() });
  if (res.status === 404) return [];
  if (!res.ok) throw new Error(`GitHub LIST ${prefix} failed: ${res.status} ${await res.text()}`);
  const entries = await res.json();
  return Array.isArray(entries) ? entries.filter((e) => e.type === 'file') : [];
}

export async function listJson(prefix) {
  const files = await listDir(prefix);
  const results = await Promise.all(files.map((f) => getJson(f.path.slice(PREFIX.length))));
  return results.filter(Boolean);
}

/** Admin-only reset tool: wipes every file under a prefix. Returns how many were deleted. */
export async function deleteAll(prefix) {
  const files = await listDir(prefix);
  await Promise.all(
    files.map((f) =>
      fetch(`${API_BASE}/repos/${OWNER}/${REPO}/contents/${f.path}`, {
        method: 'DELETE',
        headers: authHeaders({ 'content-type': 'application/json' }),
        body: JSON.stringify({ message: `data: delete ${f.path}`, sha: f.sha, branch: BRANCH }),
      }),
    ),
  );
  return files.length;
}
