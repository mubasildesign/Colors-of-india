// Boot: shell and global actions on every page, then the page module if it has one.
import { initGlobalActions } from "./js/core.js";
import { initShell } from "./js/shell.js";

initShell();
initGlobalActions();

const PAGE_MODULES = {
  home: "./js/pages/home.js",
  dictionary: "./js/pages/dictionary.js",
  explorer: "./js/pages/explorer.js",
  generator: "./js/pages/generator.js",
  ideas: "./js/pages/ideas.js",
  usage: "./js/pages/usage.js",
  gradients: "./js/pages/gradients.js",
  scene: "./js/pages/scene.js",
  theme: "./js/pages/theme.js",
  terminal: "./js/pages/terminal.js",
  today: "./js/pages/today.js",
  saved: "./js/pages/saved.js",
};

const page = document.body.dataset.page;
if (PAGE_MODULES[page]) {
  import(PAGE_MODULES[page])
    .then((m) => m.default(document.querySelector("[data-app-root]")))
    .catch((err) => console.error(err))
    .finally(() => document.querySelector("[data-loader]")?.remove());
}
