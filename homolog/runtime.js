import { GitHubStore } from "./github.js";
import { mergeDays, catalogWorkout } from "./model.js";
import { rawURL } from "./config.js";
const store = new GitHubStore();
let catalog = { workouts: {} };
async function base(path) {
  const r = await fetch("../data/" + path + "?v=" + Date.now(), {
    cache: "no-store",
  });
  if (r.status === 404) return { programs: {} };
  if (!r.ok) throw Error("Falha ao carregar treinos existentes.");
  const d = await r.json();
  for (const w of Object.values(d.programs || {}))
    for (const p of w.posters || [])
      p.src = new URL("../" + p.src, location.href).href;
  return d;
}
window.HomologContent = {
  async index() {
    const initial = await base("index.json");
    try {
      catalog = (await store.read("catalog.json")).data || { workouts: {} };
      localStorage.setItem("homolog-catalog", JSON.stringify(catalog));
    } catch {
      try {
        catalog =
          JSON.parse(localStorage.getItem("homolog-catalog")) || catalog;
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
