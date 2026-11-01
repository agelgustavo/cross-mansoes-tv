const environment = typeof document !== "undefined" && document.documentElement.dataset.environment === "production" ? "production" : "homolog";
export const CONFIG = Object.freeze({
  repository: "agelgustavo/cross-mansoes-tv",
  branch: `workout-content-${environment}`,
  workflow: "process-workout.yml",
  codeBranch: "main",
  environment,
  label: environment === "production" ? "produção" : "homologação",
  siteURL: new URL("../", import.meta.url).href,
  maxBytes: 25 * 1024 * 1024,
  maxPages: 30,
});
export const rawURL = (path) =>
  `https://raw.githubusercontent.com/${CONFIG.repository}/${CONFIG.branch}/${path.split("/").map(encodeURIComponent).join("/")}`;
