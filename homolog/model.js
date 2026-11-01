export const MODES = { crossfit: "CrossFit", hybrid: "Hybrid Run" };
export function validDate(value) {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !Number.isNaN(Date.parse(value)) &&
    new Date(value + "T12:00:00Z").toISOString().slice(0, 10) === value
  );
}
export const keyOf = (date, mode) => {
  if (!validDate(date) || !Object.hasOwn(MODES, mode))
    throw Error("Data ou modalidade inválida.");
  return `${date}/${mode}`;
};
export const escapeHTML = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
export function newDraft(date, mode) {
  keyOf(date, mode);
  return {
    date,
    mode,
    title: "",
    text: "",
    prompt: "",
    pages: [],
    revision: 0,
    publishedRevision: null,
  };
}
export function validateDraft(draft) {
  keyOf(draft.date, draft.mode);
  if (!Array.isArray(draft.pages) || !draft.pages.length)
    throw Error("Adicione ao menos uma página.");
  if (draft.pages.length > 30)
    throw Error("Use no máximo 30 páginas por treino.");
  const ids = new Set();
  for (const page of draft.pages) {
    if (!page.id || ids.has(page.id))
      throw Error("Identificação de página duplicada.");
    ids.add(page.id);
    if (!page.title?.trim() || page.title.length > 120)
      throw Error("Cada página precisa de um título de até 120 caracteres.");
    if (
      page.status !== "ready" ||
      !/^media\/[a-f0-9]{64}\.png$/.test(page.path || "")
    )
      throw Error(
        "Aguarde a conversão e salve todas as imagens antes de aprovar.",
      );
  }
  return true;
}
export function approve(catalog, draft, revision, actor) {
  validateDraft(draft);
  const key = keyOf(draft.date, draft.mode),
    previous = catalog.workouts?.[key];
  if ((previous?.revision ?? null) !== (draft.publishedRevision ?? null))
    throw Error(
      "Este treino foi atualizado por outra pessoa. Reabra o cadastro antes de aprovar.",
    );
  return {
    ...catalog,
    version: 1,
    environment: "homolog",
    workouts: {
      ...catalog.workouts,
      [key]: {
        date: draft.date,
        mode: draft.mode,
        title: draft.title || MODES[draft.mode],
        revision,
        approvedAt: new Date().toISOString(),
        approvedBy: actor,
        pages: draft.pages.map(({ id, title, path }) => ({ id, title, path })),
      },
    },
  };
}
export function mergeDays(base, catalog) {
  const days = structuredClone(base.days || {});
  for (const w of Object.values(catalog.workouts || {})) {
    if (!validDate(w.date) || !MODES[w.mode]) continue;
    days[w.date] = [...new Set([...(days[w.date] || []), w.mode])];
  }
  return { days };
}
export function catalogWorkout(catalog, date, mode, url) {
  const w = catalog.workouts?.[keyOf(date, mode)];
  if (!w) return null;
  return {
    title: w.title,
    posters: w.pages.map((p) => ({
      src: url(p.path),
      label: p.title,
      text: p.title,
    })),
  };
}
export const extension = (name) => name.split(".").pop().toLowerCase();
export const supported = [
  "png",
  "jpg",
  "jpeg",
  "webp",
  "gif",
  "avif",
  "bmp",
  "svg",
  "tif",
  "tiff",
  "heic",
  "heif",
  "pdf",
  "html",
  "htm",
  "docx",
  "doc",
  "odt",
  "rtf",
  "txt",
  "md",
  "pptx",
  "ppt",
  "odp",
  "xlsx",
  "xls",
  "ods",
];
export function validateFile(file) {
  if (!supported.includes(extension(file.name)))
    throw Error(
      "Formato não reconhecido. Use imagem, HTML, PDF, Word, OpenDocument, RTF, TXT, Markdown, PowerPoint ou planilha.",
    );
  if (!file.size || file.size > 25 * 1024 * 1024)
    throw Error("O arquivo deve ter entre 1 byte e 25 MB.");
}
