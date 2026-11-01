import { CONFIG, rawURL } from "./config.js";
import {
  MODES,
  newDraft,
  keyOf,
  validDate,
  escapeHTML as esc,
  validateFile,
  extension,
  approve,
  validateDraft,
} from "./model.js";
import { GitHubStore, digest } from "./github.js";
import { localGet, localPut, normalizeImage } from "./local.js";
const $ = (id) => document.getElementById(id),
  store = new GitHubStore(),
  date = new URLSearchParams(location.search).get("date");
let draft,
  selected = 0,
  busy = false,
  dirty = false,
  urls = [],
  saveTimer,
  polling = false,
  aiReady = false;
const dateText = () =>
  new Date(date + "T12:00:00").toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
function message(text, error = false) {
  $("message").textContent = text;
  $("message").classList.toggle("error", error);
}
function requireAuth() {
  if (store.token) return true;
  $("connect-dialog").showModal();
  return false;
}
function changed() {
  dirty = true;
  $("reviewed").checked = false;
  updateApproval();
  clearTimeout(saveTimer);
  const snapshot = structuredClone(draft);
  saveTimer = setTimeout(
    () =>
      localPut(keyOf(snapshot.date, snapshot.mode), snapshot)
        .then(
          () =>
            ($("draft-state").textContent = "Rascunho salvo neste dispositivo"),
        )
        .catch(() =>
          message(
            "Não foi possível salvar neste dispositivo. Salve no GitHub antes de sair.",
            true,
          ),
        ),
    250,
  );
}
function updateApproval() {
  let ready = false;
  try {
    validateDraft(draft);
    ready = true;
  } catch {}
  $("approve").disabled = busy || !ready || !$("reviewed").checked;
}
async function run(fn) {
  if (busy) return;
  busy = true;
  $("fields").disabled = true;
  for (const id of ["save", "approve", "connection"]) $(id).disabled = true;
  try {
    await fn();
  } catch (e) {
    message(e.message, true);
  } finally {
    busy = false;
    $("fields").disabled = false;
    $("save").disabled = false;
    $("connection").disabled = false;
    updateApproval();
  }
}
function current() {
  return draft.pages[selected];
}
function imageURL(page) {
  if (page.blob) {
    const url = URL.createObjectURL(page.blob);
    urls.push(url);
    return url;
  }
  return page.path ? rawURL(page.path) : "";
}
function preview() {
  for (const url of urls) URL.revokeObjectURL(url);
  urls = [];
  const p = current(),
    title = p?.title || "Página sem título";
  $("preview-title").textContent = p ? title : "Sua página aparece aqui";
  $("preview-caption").textContent = p ? title : "";
  $("preview-count").textContent =
    `${p ? selected + 1 : 0} / ${draft.pages.length}`;
  $("preview-mode").textContent = MODES[draft.mode].toUpperCase();
  document.documentElement.style.setProperty(
    "--accent",
    draft.mode === "hybrid" ? "#2f9bf2" : "#ef303b",
  );
  $("stage").replaceChildren();
  const src = p && imageURL(p);
  if (src) {
    const img = document.createElement("img");
    img.src = src;
    img.alt = title;
    img.onerror = () =>
      message(
        "A imagem não carregou. Confira a conexão e tente novamente.",
        true,
      );
    $("stage").append(img);
  } else if (p?.html) {
    const iframe = document.createElement("iframe");
    iframe.setAttribute("sandbox", "");
    iframe.title = "Prévia do HTML enviado";
    iframe.srcdoc =
      "<meta http-equiv=\"Content-Security-Policy\" content=\"default-src 'none'; style-src 'unsafe-inline'; img-src data:; font-src data:;\">" +
      p.html;
    $("stage").append(iframe);
  } else {
    const box = document.createElement("div");
    box.className = "empty-preview";
    const h = document.createElement("h3");
    h.textContent =
      p?.status === "processing"
        ? "Preparando documento…"
        : p?.sourceName || "Sua próxima página";
    const t = document.createElement("p");
    t.textContent =
      p?.status === "processing"
        ? "A conversão preserva as páginas do arquivo. O resultado precisa da sua revisão."
        : "Escolha um arquivo ou prepare uma arte com IA.";
    box.append(h, t);
    $("stage").append(box);
  }
  $("preview-prev").disabled = selected <= 0;
  $("preview-next").disabled = selected >= draft.pages.length - 1;
  if ($("preview-dialog").open) {
    $("large-preview").replaceChildren(
      document.querySelector(".tv-shell").cloneNode(true),
    );
    wireLarge();
  }
}
function wireLarge() {
  const buttons = $("large-preview").querySelectorAll("button");
  buttons[0]?.addEventListener("click", () => select(selected - 1));
  buttons[1]?.addEventListener("click", () => select(selected + 1));
}
function select(i) {
  selected = Math.max(0, Math.min(i, draft.pages.length - 1));
  render();
}
function render() {
  $("mode").value = draft.mode;
  $("workout-title").value = draft.title;
  $("workout-text").value = draft.text;
  $("prompt").value = draft.prompt;
  $("pages").innerHTML = draft.pages
    .map(
      (p, i) =>
        `<li><button type="button" data-page="${i}" aria-current="${i === selected}">${i + 1} · ${esc(p.title || "Sem título")}</button></li>`,
    )
    .join("");
  $("page-fields").hidden = !current();
  $("page-title").value = current()?.title || "";
  $("move-up").disabled = selected === 0;
  $("move-down").disabled = selected === draft.pages.length - 1;
  $("jobs").innerHTML = (draft.jobs || [])
    .filter((j) => !j.accepted)
    .map(
      (j) =>
        `<div class="job"><strong>${esc(j.title)}</strong><p>${esc(j.error || { queued: "Aguardando processamento…", processing: "Processando…", complete: "Resultado pronto para revisão.", failed: "Não foi possível processar." }[j.status] || "Preparando…")}</p>${j.status === "complete" ? `<button data-job="${j.id}" data-job-action="accept">Usar resultado na prévia</button>` : ""}${j.dispatchFailed ? `<button data-job="${j.id}" data-job-action="retry">Reenviar processamento</button>` : ""}<button data-job="${j.id}" data-job-action="dismiss">Dispensar</button></div>`,
    )
    .join("");
  preview();
  updateApproval();
}
async function load(mode) {
  const local = await localGet(keyOf(date, mode)).catch(() => null);
  draft = local || newDraft(date, mode);
  selected = 0;
  dirty = !!local;
  if (!local) {
    try {
      const catalog = (await store.read("catalog.json")).data;
      const published = catalog?.workouts?.[keyOf(date, mode)];
      if (published) {
        draft.title = published.title;
        draft.pages = published.pages.map((p) => ({ ...p, status: "ready" }));
        draft.publishedRevision = published.revision;
      }
    } catch {
      message(
        "Sem conexão com o catálogo. Você pode preparar um rascunho local.",
        true,
      );
    }
  }
  if (!draft.pages.length)
    draft.pages.push({ id: crypto.randomUUID(), title: "", status: "empty" });
  render();
}
async function save() {
  clearTimeout(saveTimer);
  if (!store.token) throw Error("Conecte o GitHub antes de salvar.");
  for (const p of draft.pages) {
    if (p.blob) {
      const path = `media/${await digest(p.blob)}.png`;
      await store.upload(p.blob, path);
      p.path = path;
      p.status = p.pendingJobId ? "processing" : "ready";
      delete p.blob;
    }
  }
  const path = `drafts/${date}-${draft.mode}.json`;
  // The SHA is retained from the version actually opened, never silently replaced on conflict.
  const data = structuredClone(draft);
  delete data.cloudSha;
  const response = await store.write(path, data, draft.cloudSha || null);
  draft.cloudSha = response.content.sha;
  draft.revision = (draft.revision || 0) + 1;
  dirty = false;
  await localPut(keyOf(date, draft.mode), draft);
  render();
  $("draft-state").textContent =
    "Rascunho salvo no GitHub · ainda não aprovado";
}
async function connect(event) {
  event.preventDefault();
  const token = $("github-token").value;
  $("github-token").value = "";
  $("connect-error").textContent = "";
  try {
    const user = await store.connect(token);
    $("connection").textContent = `${user} · Sair`;
    $("connect-dialog").close();
    message(
      `Conectado. Os arquivos e rascunhos ficam na biblioteca de ${CONFIG.label}.`,
    );
    const remote = await store.read(`drafts/${date}-${draft.mode}.json`);
    if (remote.data) {
      if (!dirty) {
        draft = { ...remote.data, cloudSha: remote.sha };
        selected = 0;
        render();
      } else if (draft.cloudSha !== remote.sha) {
        message(
          "Existe um rascunho no GitHub diferente deste dispositivo. Baixe uma cópia local antes de reabrir o rascunho remoto.",
          true,
        );
        const b = document.createElement("button");
        b.textContent = "Abrir rascunho do GitHub";
        b.onclick = () => {
          downloadDraft();
          draft = { ...remote.data, cloudSha: remote.sha };
          dirty = false;
          render();
          changed();
          message("Rascunho do GitHub aberto. A cópia anterior foi baixada.");
        };
        $("message").append(" ", b);
      }
    }
    try {
      const caps = (await store.read("capabilities.json")).data;
      aiReady = !!caps?.ai;
      document.querySelector(".ai-notice").textContent = aiReady
        ? "IA disponível. A geração usa a API OpenAI e tem cobrança na conta do proprietário."
        : "IA ainda não ativada. Cadastre OPENAI_API_KEY nos segredos do GitHub; você pode salvar treino e prompt como rascunho.";
    } catch {}
    await poll();
  } catch (e) {
    $("connect-error").textContent = e.message;
  }
}
function downloadDraft() {
  const blob = new Blob(
    [
      JSON.stringify(
        { ...draft, pages: draft.pages.map(({ blob, ...p }) => p) },
        null,
        2,
      ),
    ],
    { type: "application/json" },
  );
  const url = URL.createObjectURL(blob),
    a = document.createElement("a");
  a.href = url;
  a.download = `rascunho-${date}-${draft.mode}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
async function createJob(kind, payload) {
  const id = crypto.randomUUID(),
    p = current();
  const job = {
    id,
    kind,
    status: "queued",
    title: p?.title || "Página",
    pageId: p?.id,
    date,
    mode: draft.mode,
    ...payload,
  };
  await store.write(`jobs/${id}.json`, job, null);
  if (kind !== "health" && p) {
    p.pendingJobId = id;
    p.status = "processing";
  }
  draft.jobs ||= [];
  draft.jobs.push(job);
  changed();
  try {
    await store.dispatch(id);
  } catch (e) {
    job.dispatchFailed = true;
    job.error =
      "Pedido salvo, mas o processamento não iniciou. Verifique a permissão Actions e use Reenviar processamento.";
  }
  render();
  await localPut(keyOf(date, draft.mode), draft);
}
async function importFile(file) {
  validateFile(file);
  const target = current();
  if (!target) throw Error("Adicione uma página primeiro.");
  if (
    ["png", "jpg", "jpeg", "webp", "gif", "bmp", "avif"].includes(
      extension(file.name),
    )
  ) {
    const blob = await normalizeImage(file);
    target.blob = blob;
    delete target.path;
    delete target.pendingJobId;
    delete target.html;
    target.sourceName = file.name;
    target.status = "local";
    if (!target.title) target.title = file.name.replace(/\.[^.]+$/, "");
    changed();
    render();
    message("Imagem pronta na prévia. Salve o rascunho antes de aprovar.");
    return;
  }
  if (!requireAuth()) return;
  const ext = extension(file.name),
    path = `sources/${await digest(file)}.${ext}`;
  await store.upload(file, path);
  if (["html", "htm"].includes(ext)) target.html = await file.text();
  target.sourceName = file.name;
  if (!target.title) target.title = file.name.replace(/\.[^.]+$/, "");
  await createJob("convert", { sourcePath: path, sourceName: file.name });
  message(
    "Arquivo enviado. A conversão vai preparar as páginas para revisão. Você pode continuar editando.",
  );
}
async function poll() {
  if (!store.token || polling || busy || !draft) return;
  polling = true;
  const mode = draft.mode;
  let updated = false;
  try {
    for (const job of draft.jobs || []) {
      if (
        job.accepted ||
        job.dispatchFailed ||
        !["queued", "processing"].includes(job.status)
      )
        continue;
      const remote = (await store.read(`jobs/${job.id}.json`)).data;
      if (draft.mode !== mode) return;
      if (remote && JSON.stringify(remote) !== JSON.stringify(job)) {
        updated = true;
        Object.assign(job, remote);
        if (job.kind === "health" && job.status === "complete") {
          aiReady = !!job.ai;
          job.accepted = true;
          document.querySelector(".ai-notice").textContent = aiReady
            ? "IA disponível. A geração usa a API OpenAI e tem cobrança na conta do proprietário."
            : "IA ainda não ativada. Cadastre OPENAI_API_KEY nos segredos do GitHub.";
        } else if (job.status === "complete")
          message(
            "Documento/arte pronto. Use o resultado na prévia e confira antes de aprovar.",
          );
      }
    }
    if (updated) {
      render();
      await localPut(keyOf(date, mode), draft);
    }
  } catch (e) {
    message(
      "Não foi possível consultar o processamento. Ele continua no GitHub; a consulta será repetida.",
      true,
    );
  } finally {
    polling = false;
  }
}
$("pages").onclick = (e) => {
  const b = e.target.closest("[data-page]");
  if (b && !busy) select(Number(b.dataset.page));
};
$("add-page").onclick = () => {
  if (draft.pages.length >= CONFIG.maxPages)
    return message("Limite de 30 páginas por treino.", true);
  draft.pages.push({ id: crypto.randomUUID(), title: "", status: "empty" });
  selected = draft.pages.length - 1;
  changed();
  render();
  $("page-title").focus();
};
$("page-title").oninput = (e) => {
  current().title = e.target.value;
  changed();
  preview();
  const b = $("pages").querySelector("[aria-current=true]");
  if (b) b.textContent = `${selected + 1} · ${e.target.value || "Sem título"}`;
};
$("workout-title").oninput = (e) => {
  draft.title = e.target.value;
  changed();
};
$("workout-text").oninput = (e) => {
  draft.text = e.target.value;
  changed();
};
$("prompt").oninput = (e) => {
  draft.prompt = e.target.value;
  changed();
};
$("mode").onchange = () =>
  run(async () => {
    clearTimeout(saveTimer);
    await localPut(keyOf(date, draft.mode), draft);
    await load($("mode").value);
  });
for (const [id, delta] of [
  ["move-up", -1],
  ["move-down", 1],
])
  $(id).onclick = () => {
    const n = selected + delta;
    if (n < 0 || n >= draft.pages.length) return;
    [draft.pages[n], draft.pages[selected]] = [
      draft.pages[selected],
      draft.pages[n],
    ];
    selected = n;
    changed();
    render();
  };
$("remove-page").onclick = () => $("remove-dialog").showModal();
$("cancel-remove").onclick = () => $("remove-dialog").close();
$("confirm-remove").onclick = () => {
  draft.pages.splice(selected, 1);
  selected = Math.max(0, selected - 1);
  changed();
  render();
  $("remove-dialog").close();
};
for (const tab of ["upload", "ai"])
  $(tab + "-tab").onclick = () => {
    for (const t of ["upload", "ai"]) {
      $(t + "-tab").setAttribute("aria-selected", String(t === tab));
      $(t + "-panel").hidden = t !== tab;
    }
  };
$("file").onchange = (e) => {
  const file = e.target.files[0];
  e.target.value = "";
  if (file) run(() => importFile(file));
};
$("dropzone").ondragover = (e) => {
  e.preventDefault();
  $("dropzone").classList.add("dragover");
};
$("dropzone").ondragleave = () => $("dropzone").classList.remove("dragover");
$("dropzone").ondrop = (e) => {
  e.preventDefault();
  $("dropzone").classList.remove("dragover");
  if (e.dataTransfer.files[0]) run(() => importFile(e.dataTransfer.files[0]));
};
$("connection").onclick = () => {
  if (store.token) {
    store.disconnect();
    $("connection").textContent = "Conectar GitHub";
    message("Desconectado. O token foi removido da memória.");
  } else $("connect-dialog").showModal();
};
$("close-connect").onclick = () => $("connect-dialog").close();
$("connect-form").onsubmit = connect;
$("save").onclick = () => {
  if (requireAuth())
    run(async () => {
      await save();
      message("Rascunho salvo. Ele ainda não aparece na TV.");
    });
};
$("reviewed").onchange = updateApproval;
$("approve").onclick = () => {
  if (!requireAuth()) return;
  run(async () => {
    if (!$("reviewed").checked)
      throw Error("Revise e confirme os dados primeiro.");
    validateDraft(draft);
    await save();
    const { data, sha } = await store.read("catalog.json");
    const revision = crypto.randomUUID();
    const next = approve(data || { environment: CONFIG.environment, workouts: {} }, draft, revision, store.user);
    await store.write("catalog.json", next, sha);
    draft.publishedRevision = revision;
    await localPut(keyOf(date, draft.mode), draft);
    try {
      await save();
    } catch {
      message(
        `Aprovado em ${CONFIG.label}, mas a cópia do rascunho não foi atualizada. Reabra o cadastro antes da próxima edição.`,
        true,
      );
      return;
    }
    $("reviewed").checked = false;
    message(
      `Aprovado e disponível na TV de ${CONFIG.label}.${CONFIG.environment === "homolog" ? " Produção não foi alterada." : ""}`,
    );
  });
};
$("preview-prev").onclick = () => select(selected - 1);
$("preview-next").onclick = () => select(selected + 1);
$("preview-button").onclick = () => {
  $("preview-dialog").showModal();
  preview();
};
$("close-preview").onclick = () => $("preview-dialog").close();
$("preview-dialog").addEventListener("keydown", (e) => {
  if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
    e.preventDefault();
    select(selected + (e.key === "ArrowRight" ? 1 : -1));
  }
});
$("library-button").onclick = () => {
  if (!requireAuth()) return;
  run(async () => {
    const paths = await store.library();
    $("library-grid").innerHTML = paths.length
      ? paths
          .map(
            (p, i) =>
              `<button type="button" data-path="${p}" aria-label="Selecionar imagem ${i + 1}"><img src="${rawURL(p)}" alt="Imagem ${i + 1}" loading="lazy"></button>`,
          )
          .join("")
      : "Nenhuma imagem salva ainda.";
    $("library-dialog").showModal();
  });
};
$("close-library").onclick = () => $("library-dialog").close();
$("library-grid").onclick = (e) => {
  const b = e.target.closest("[data-path]");
  if (!b) return;
  Object.assign(current(), { path: b.dataset.path, status: "ready" });
  delete current().blob;
  delete current().html;
  changed();
  render();
  $("library-dialog").close();
};
$("check-ai").onclick = () => {
  if (requireAuth())
    run(async () => {
      await createJob("health", {});
      message(
        "Verificação de IA solicitada. A disponibilidade será atualizada ao terminar.",
      );
    });
};
$("generate").onclick = () => {
  if (!requireAuth()) return;
  run(async () => {
    if (!aiReady)
      throw Error(
        "IA ainda não ativada: o proprietário precisa cadastrar OPENAI_API_KEY no GitHub. Salve o texto como rascunho por enquanto.",
      );
    if (!draft.text.trim()) throw Error("Informe o treino antes de gerar.");
    await createJob("generate", { text: draft.text, prompt: draft.prompt });
    message(
      "Geração solicitada. O resultado aparecerá para avaliação; não será publicado automaticamente.",
    );
  });
};
$("jobs").onclick = (e) => {
  const b = e.target.closest("[data-job]");
  if (!b || busy) return;
  const j = draft.jobs.find((j) => j.id === b.dataset.job);
  if (b.dataset.jobAction === "accept") {
    const index = draft.pages.findIndex((p) => p.id === j.pageId);
    if (index < 0)
      return message(
        "A página original foi removida. Crie outra página e tente novamente.",
        true,
      );
    if (draft.pages[index].pendingJobId !== j.id)
      return message(
        "Esta página já recebeu outro arquivo ou pedido. O resultado antigo não foi aplicado.",
        true,
      );
    if (
      j.kind === "generate" &&
      (j.text !== draft.text || j.prompt !== draft.prompt)
    )
      return message(
        "O treino ou o prompt mudou depois deste pedido. Gere uma nova versão para preservar as alterações.",
        true,
      );
    if (draft.pages.length - 1 + j.pages.length > CONFIG.maxPages)
      return message("O resultado ultrapassa o limite de 30 páginas.", true);
    const title = draft.pages[index].title || j.title;
    draft.pages.splice(
      index,
      1,
      ...j.pages.map((p, i) => ({
        id: crypto.randomUUID(),
        title: j.pages.length > 1 ? `${title} · ${i + 1}` : title,
        path: p.path,
        status: "ready",
      })),
    );
    j.accepted = true;
    selected = index;
    changed();
    render();
  } else if (b.dataset.jobAction === "dismiss") {
    j.accepted = true;
    const p = draft.pages.find((p) => p.pendingJobId === j.id);
    if (p) {
      delete p.pendingJobId;
      p.status = p.path ? "ready" : p.blob ? "local" : "empty";
    }
    changed();
    render();
  } else
    run(async () => {
      await store.dispatch(j.id);
      delete j.dispatchFailed;
      delete j.error;
      changed();
      render();
    });
};
window.addEventListener("beforeunload", (e) => {
  if (busy) {
    e.preventDefault();
    e.returnValue = "";
  }
});
if (!validDate(date)) {
  message(
    "Data inválida. Volte ao calendário e use o botão + do dia desejado.",
    true,
  );
  $("fields").disabled = true;
  $("save").disabled = true;
  $("preview-button").disabled = true;
} else {
  $("date-label").textContent = dateText();
  $("preview-date").textContent = date.split("-").reverse().join("/");
  await run(async () => {
    message("Carregando rascunho…");
    await load("crossfit");
    if ($("message").textContent === "Carregando rascunho…") message("");
  });
  setInterval(poll, 15000);
}
