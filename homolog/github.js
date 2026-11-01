import { CONFIG, rawURL } from "./config.js";
export async function timedFetch(url, options = {}, timeout = 30000) {
  const controller = new AbortController(),
    timer = setTimeout(() => controller.abort(), timeout);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}
export class GitHubStore {
  constructor() {
    this.token = "";
    this.user = "";
  }
  async request(path, options = {}) {
    if (!this.token)
      throw Error("Conecte sua conta do GitHub para salvar ou aprovar.");
    const response = await timedFetch(`https://api.github.com${path}`, {
      ...options,
      cache: "no-store",
      headers: {
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        Authorization: `Bearer ${this.token}`,
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...options.headers,
      },
    });
    if (!response.ok) {
      const e = new Error(
        response.status === 401
          ? "A conexão expirou. Conecte novamente."
          : response.status === 403
            ? "O GitHub recusou a operação. Confira as permissões ou o limite de acesso."
            : response.status === 409 || response.status === 422
              ? "Outra edição foi salva. Reabra o cadastro antes de salvar novamente."
              : `Não foi possível concluir no GitHub (${response.status}).`,
      );
      e.status = response.status;
      throw e;
    }
    return response.status === 204 ? null : response.json();
  }
  repo(path) {
    return `/repos/${CONFIG.repository}${path}`;
  }
  async connect(token) {
    this.token = token.trim();
    try {
      const user = await this.request("/user");
      const repo = await this.request(this.repo(""));
      if (!repo.permissions?.push)
        throw Error(
          "Sua conta não tem permissão para editar este repositório.",
        );
      this.user = user.login;
      return user.login;
    } catch (e) {
      this.disconnect();
      throw e;
    }
  }
  disconnect() {
    this.token = "";
    this.user = "";
  }
  async read(path) {
    if (this.token) {
      try {
        const r = await this.request(
          this.repo(`/contents/${path}?ref=${CONFIG.branch}`),
        );
        return {
          data: JSON.parse(
            new TextDecoder().decode(
              Uint8Array.from(atob(r.content.replace(/\s/g, "")), (c) =>
                c.charCodeAt(0),
              ),
            ),
          ),
          sha: r.sha,
        };
      } catch (e) {
        if (e.status === 404) return { data: null, sha: null };
        throw e;
      }
    }
    const r = await timedFetch(rawURL(path) + `?v=${Date.now()}`, {
      cache: "no-store",
    });
    if (r.status === 404) return { data: null, sha: null };
    if (!r.ok) throw Error("Não foi possível consultar os treinos.");
    return { data: await r.json(), sha: null };
  }
  async write(path, data, sha) {
    const bytes = new TextEncoder().encode(
      JSON.stringify(data, null, 2) + "\n",
    );
    return this.request(this.repo(`/contents/${path}`), {
      method: "PUT",
      body: JSON.stringify({
        message: `content(${CONFIG.environment}): ${path}`,
        branch: CONFIG.branch,
        content: toBase64(bytes),
        ...(sha ? { sha } : {}),
      }),
    });
  }
  async upload(blob, path) {
    // Immutable files are shared by hash; reusing a file does not duplicate it.
    try {
      const existing = await this.request(
        this.repo(`/contents/${path}?ref=${CONFIG.branch}`),
      );
      return existing.sha;
    } catch (e) {
      if (e.status !== 404) throw e;
    }
    try {
      return (
        await this.request(this.repo(`/contents/${path}`), {
          method: "PUT",
          body: JSON.stringify({
            message: `content(${CONFIG.environment}): adicionar arquivo à biblioteca`,
            branch: CONFIG.branch,
            content: toBase64(new Uint8Array(await blob.arrayBuffer())),
          }),
        })
      ).content.sha;
    } catch (e) {
      if (e.status === 422) {
        const r = await this.request(
          this.repo(`/contents/${path}?ref=${CONFIG.branch}`),
        );
        return r.sha;
      }
      throw e;
    }
  }
  async dispatch(id) {
    return this.request(
      this.repo(`/actions/workflows/${CONFIG.workflow}/dispatches`),
      {
        method: "POST",
        body: JSON.stringify({
          ref: CONFIG.codeBranch,
          inputs: { job_id: id, environment: CONFIG.environment },
        }),
      },
    );
  }
  async library() {
    const ref = await this.request(
      this.repo(`/git/ref/heads/${CONFIG.branch}`),
    );
    const tree = await this.request(
      this.repo(`/git/trees/${ref.object.sha}?recursive=1`),
    );
    return tree.tree
      .filter((f) => /^media\/[a-f0-9]{64}\.png$/.test(f.path))
      .map((f) => f.path);
  }
}
export function toBase64(bytes) {
  let s = "";
  for (let i = 0; i < bytes.length; i += 8192)
    s += String.fromCharCode(...bytes.subarray(i, i + 8192));
  return btoa(s);
}
export async function digest(blob) {
  return [
    ...new Uint8Array(
      await crypto.subtle.digest("SHA-256", await blob.arrayBuffer()),
    ),
  ]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
