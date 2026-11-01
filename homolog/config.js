export const CONFIG = Object.freeze({
  repository: "agelgustavo/cross-mansoes-tv",
  branch: "workout-content-homolog",
  workflow: "process-workout.yml",
  codeBranch: "main",
  environment: "homolog",
  maxBytes: 25 * 1024 * 1024,
  maxPages: 30,
});
export const rawURL = (path) =>
  `https://raw.githubusercontent.com/${CONFIG.repository}/${CONFIG.branch}/${path.split("/").map(encodeURIComponent).join("/")}`;
