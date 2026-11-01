import { test, expect } from "./fixtures.mjs";
import { readFileSync } from "node:fs";
const image = readFileSync("assets/simbolo_mansoes_azul.png");
const root = "https://api.github.com/repos/agelgustavo/cross-mansoes-tv";
async function mock(page, environment = "homolog") {
  const files = new Map([
    [
      "catalog.json",
      {
        data: { version: 1, environment, workouts: {} },
        sha: "catalog-0",
      },
    ],
    ["capabilities.json", { data: { ai: false }, sha: "cap-0" }],
  ]);
  let counter = 0;
  const writes = [];
  await page.route("https://raw.githubusercontent.com/**", async (route) => {
    const path = new URL(route.request().url()).pathname.split(
      `/workout-content-${environment}/`,
    )[1];
    const f = files.get(path);
    if (!f) return route.fulfill({ status: 404, body: "Not found" });
    if (path.startsWith("media/"))
      return route.fulfill({ body: image, contentType: "image/png" });
    return route.fulfill({ json: f.data });
  });
  await page.route("https://api.github.com/**", async (route) => {
    const request = route.request(),
      url = new URL(request.url());
    if (url.pathname === "/user")
      return route.fulfill({ json: { login: "coach" } });
    if (request.url() === root)
      return route.fulfill({ json: { permissions: { push: true } } });
    if (url.pathname.includes("/contents/")) {
      const path = url.pathname.split("/contents/")[1];
      const existing = files.get(path);
      if (request.method() === "GET") {
        if (!existing)
          return route.fulfill({ status: 404, json: { message: "not found" } });
        return route.fulfill({
          json: {
            sha: existing.sha,
            content: Buffer.from(JSON.stringify(existing.data)).toString(
              "base64",
            ),
          },
        });
      }
      const body = request.postDataJSON();
      if (body.branch !== `workout-content-${environment}`)
        throw Error("Production write");
      if ((existing?.sha || null) !== (body.sha || null))
        return route.fulfill({ status: 409, json: { message: "conflict" } });
      let data;
      try {
        data = JSON.parse(Buffer.from(body.content, "base64").toString());
      } catch {
        data = { binary: true };
      }
      const sha = "file-" + ++counter;
      files.set(path, { data, sha });
      writes.push({ path, data });
      return route.fulfill({ json: { content: { sha } } });
    }
    if (url.pathname.endsWith("/dispatches"))
      return route.fulfill({ status: 204 });
    return route.fulfill({ status: 404, json: { message: "unsupported" } });
  });
  return { files, writes };
}
async function connect(page) {
  await page.locator("#connection").click();
  await page.locator("#github-token").fill("test-only-token");
  await page.locator("#connect-form button[type=submit]").click();
  await expect(page.locator("#connect-dialog")).not.toBeVisible();
}
async function editor(page, base = "/homolog/") {
  await page.goto(base + "editor.html?date=2026-11-02");
  await expect(page.locator("#page-title")).toBeVisible();
}
test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-11-01T12:00:00Z"));
});
test("calendário separado: mais discreto, data correta e treinos existentes", async ({
  page,
}) => {
  await mock(page);
  await page.goto("/homolog/");
  await expect(page.locator('.day[data-date="2026-11-01"]')).toContainText(
    "Hybrid Run",
  );
  await page.locator('.day[data-date="2026-11-01"]').click();
  await expect(page.locator(".slide-count")).toHaveText("1 / 2");
  await page.keyboard.press("ArrowRight");
  await expect(page.locator(".slide-count")).toHaveText("2 / 2");
  await page.keyboard.press("Backspace");
  await page.locator('.add-workout[data-date="2026-11-02"]').click();
  await expect(page).toHaveURL(/editor.html\?date=2026-11-02/);
  await expect(page.locator("#date-label")).toContainText("2 de novembro");
});
test("upload, NRT, ordem, preview e rascunho persistente sem publicar", async ({
  page,
}, info) => {
  const { writes } = await mock(page);
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await editor(page);
  await page.locator("#page-title").fill("Aquecimento");
  await page
    .locator("#file")
    .setInputFiles({ name: "art.png", mimeType: "image/png", buffer: image });
  await expect(page.locator("#stage img")).toBeVisible();
  await expect(page.locator("#preview-title")).toHaveText("Aquecimento");
  await page.locator("#add-page").click();
  await page.locator("#page-title").fill("WOD livre");
  await page.locator("#move-up").click();
  await expect(page.locator("#preview-count")).toHaveText("1 / 2");
  await page.locator("#preview-button").click();
  await expect(page.locator("#preview-dialog")).toBeVisible();
  await page.keyboard.press("ArrowRight");
  await expect(page.locator("#large-preview img")).toBeVisible();
  await page.locator("#close-preview").click();
  await page.screenshot({ path: `output/editor-${info.project.name}.png` });
  await page.waitForTimeout(350);
  await page.reload();
  await expect(page.locator("#pages li")).toHaveCount(2);
  expect(writes).toHaveLength(0);
  expect(errors).toEqual([]);
});
test("salvar não publica; aprovar exige revisão e disponibiliza só na homologação", async ({
  page,
}) => {
  const { files, writes } = await mock(page);
  await editor(page);
  await connect(page);
  await page.locator("#page-title").fill("WOD");
  await page
    .locator("#file")
    .setInputFiles({ name: "art.png", mimeType: "image/png", buffer: image });
  await expect(page.locator("#stage img")).toBeVisible();
  await page.locator("#save").click();
  await expect(page.locator("#message")).toContainText("Rascunho salvo");
  expect(Object.keys(files.get("catalog.json").data.workouts)).toHaveLength(0);
  await expect(page.locator("#approve")).toBeDisabled();
  await page.locator("#reviewed").check();
  await page.locator("#approve").click();
  await expect(page.locator("#message")).toContainText("Aprovado");
  expect(
    files.get("catalog.json").data.workouts["2026-11-02/crossfit"].pages[0]
      .title,
  ).toBe("WOD");
  await page.goto("/homolog/");
  await expect(page.locator('.day[data-date="2026-11-02"]')).toContainText(
    "CrossFit",
  );
  await page.locator('.day[data-date="2026-11-02"]').click();
  await expect(page.locator(".poster-label")).toHaveText("WOD");
  expect(writes.some((w) => w.path.startsWith("media/"))).toBe(true);
});
test("conflito de edição não sobrescreve rascunho; alterações invalidam revisão", async ({
  page,
}) => {
  const { files } = await mock(page);
  await editor(page);
  await connect(page);
  await page.locator("#page-title").fill("WOD");
  await page
    .locator("#file")
    .setInputFiles({ name: "a.png", mimeType: "image/png", buffer: image });
  await page.locator("#save").click();
  await expect(page.locator("#message")).toContainText("Rascunho salvo");
  await page.locator("#reviewed").check();
  await page.locator("#page-title").fill("Novo título");
  await expect(page.locator("#reviewed")).not.toBeChecked();
  const saved = files.get("drafts/2026-11-02-crossfit.json");
  files.set("drafts/2026-11-02-crossfit.json", { ...saved, sha: "other-user" });
  await page.locator("#save").click();
  await expect(page.locator("#message")).toContainText("Outra edição");
  expect(files.get("drafts/2026-11-02-crossfit.json").sha).toBe("other-user");
});
test("HTML não executa script; conversão fica pendente e nunca autoaprova", async ({
  page,
}) => {
  const { files } = await mock(page);
  await editor(page);
  await connect(page);
  await page.locator("#page-title").fill("HTML");
  await page
    .locator("#file")
    .setInputFiles({
      name: "wod.html",
      mimeType: "text/html",
      buffer: Buffer.from(
        '<h1>20 Burpees</h1><script>parent.document.body.dataset.attacked="yes"</script>',
      ),
    });
  await expect(page.locator("#stage iframe")).toBeVisible();
  expect(await page.locator("body").getAttribute("data-attacked")).toBeNull();
  await expect(page.locator("#approve")).toBeDisabled();
  await expect(page.locator(".job")).toContainText("Aguardando");
  const job = [...files.entries()].find(([p]) => p.startsWith("jobs/"));
  expect(job[1].data.kind).toBe("convert");
  expect(Object.keys(files.get("catalog.json").data.workouts)).toHaveLength(0);
});
test("IA sem chave é explícita; textos podem ser salvos, não inventa resultados", async ({
  page,
}) => {
  await mock(page);
  await editor(page);
  await connect(page);
  await page.locator("#ai-tab").click();
  await page.locator("#workout-text").fill("FOR TIME\n10 Burpees");
  await page.locator("#prompt").fill("Gorila azul");
  await page.locator("#generate").click();
  await expect(page.locator("#message")).toContainText("IA ainda não ativada");
  await expect(page.locator("#stage img")).toHaveCount(0);
  await page.locator("#save").click();
  await expect(page.locator("#message")).toContainText("Rascunho salvo");
});
test("produção ganha o editor promovido, com identificação correta", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".add-workout").first()).toBeVisible();
  await expect(page.locator(".brand-sub")).not.toContainText("Homologação");
});
test("documento multipágina aguarda aceite, preserva ordem e pode ser aprovado", async ({
  page,
}) => {
  await page.clock.install({ time: new Date("2026-11-01T12:00:00Z") });
  const { files } = await mock(page);
  await editor(page);
  await connect(page);
  await page.locator("#page-title").fill("Adaptações");
  await page
    .locator("#file")
    .setInputFiles({
      name: "documento.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("%PDF-1.4 test"),
    });
  await expect(page.locator(".job")).toBeVisible();
  const [path, record] = [...files.entries()].find(([p]) =>
    p.startsWith("jobs/"),
  );
  const media = "media/" + "a".repeat(64) + ".png";
  files.set(media, { data: {}, sha: "media" });
  files.set(path, {
    ...record,
    data: {
      ...record.data,
      status: "complete",
      pages: [{ path: media }, { path: media }],
    },
  });
  await page.clock.fastForward(16000);
  await expect(page.locator("[data-job-action=accept]")).toBeVisible();
  await expect(page.locator("#pages li")).toHaveCount(1);
  await page.locator("[data-job-action=accept]").click();
  await expect(page.locator("#pages li")).toHaveCount(2);
  await expect(page.locator("#preview-title")).toHaveText("Adaptações · 1");
  await page.locator("#save").click();
  await expect(page.locator("#message")).toContainText("Rascunho salvo");
  await page.locator("#reviewed").check();
  await expect(page.locator("#approve")).toBeEnabled();
});
test("falha de upload não publica e o editor cabe também no celular", async ({
  page,
}) => {
  await mock(page);
  await editor(page);
  await connect(page);
  await page.locator("#page-title").fill("WOD");
  await page
    .locator("#file")
    .setInputFiles({ name: "a.png", mimeType: "image/png", buffer: image });
  await page.route("**/contents/media/**", (route) =>
    route.fulfill({ status: 503, json: { message: "unavailable" } }),
  );
  await page.locator("#save").click();
  await expect(page.locator("#message")).toContainText("503");
  await expect(page.locator("#approve")).toBeDisabled();
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
test("carregamento lento bloqueia edição até a data e o rascunho estarem prontos", async ({
  page,
}) => {
  await mock(page);
  await page.route(
    "https://raw.githubusercontent.com/**/catalog.json*",
    async (route) => {
      await new Promise((r) => setTimeout(r, 600));
      await route.fulfill({ json: { workouts: {} } });
    },
  );
  await page.goto("/homolog/editor.html?date=2026-11-03");
  await expect(page.locator("#workout-title")).toBeDisabled();
  await expect(page.locator("#page-title")).toBeVisible();
  await expect(page.locator("#workout-title")).toBeEnabled();
  await page.locator("#page-title").fill("Aquecimento");
  await expect(page.locator("#preview-title")).toHaveText("Aquecimento");
});

test('produção aprova na biblioteca de produção e não mistura rascunho de homologação',async({page,context})=>{
 const {files}=await mock(page,'production');await editor(page,'/');await expect(page.locator('.env')).toHaveText('PRODUÇÃO');await connect(page);await page.locator('#page-title').fill('WOD produção');await page.locator('#file').setInputFiles({name:'wod.png',mimeType:'image/png',buffer:image});await page.locator('#save').click();await expect(page.locator('#message')).toContainText('Rascunho salvo');await page.locator('#reviewed').check();await page.locator('#approve').click();await expect(page.locator('#message')).toContainText('TV de produção');expect(files.get('catalog.json').data.workouts['2026-11-02/crossfit'].pages[0].title).toBe('WOD produção');
 const homolog=await context.newPage();const other=await mock(homolog);await editor(homolog);await expect(homolog.locator('#page-title')).toHaveValue('');expect(Object.keys(other.files.get('catalog.json').data.workouts)).toHaveLength(0);await homolog.close();
});
