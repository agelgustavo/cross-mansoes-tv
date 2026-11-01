import { GitHubStore } from "./github.js";
import { mergeDays, catalogWorkout } from "./model.js";
import { rawURL, CONFIG } from "./config.js";
window.MansoesConfig = CONFIG;
const cacheKey = `${CONFIG.environment}-catalog`;
const store = new GitHubStore();
let catalog = { workouts: {} };
async function base(path) {
  const r = await fetch(CONFIG.siteURL + "data/" + path + "?v=" + Date.now(), {
    cache: "no-store",
  });
  if (r.status === 404) return { programs: {} };
  if (!r.ok) throw Error("Falha ao carregar treinos existentes.");
  const d = await r.json();
  for (const w of Object.values(d.programs || {}))
    for (const p of w.posters || [])
      p.src = new URL(p.src, CONFIG.siteURL).href;
  return d;
}
window.HomologContent = {
  async index() {
    const initial = await base("index.json");
    try {
      catalog = (await store.read("catalog.json")).data || { workouts: {} };
      localStorage.setItem(cacheKey, JSON.stringify(catalog));
    } catch {
      try {
        catalog =
          JSON.parse(localStorage.getItem(cacheKey)) || catalog;
      } catch {}
    }
    return mergeDays(initial, catalog);
  },
  async day(date) {
    const d = await base(date + ".json");
    for (const mode of ["crossfit", "hybrid"]) {
      const w = catalogWorkout(catalog, date, mode, rawURL);
      if (w) d.programs[mode] = w;
    }
    return d;
  },
};
window.resolveHomolog();
