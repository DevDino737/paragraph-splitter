// ================= WORKSPACE LAYOUT =================
//
// This file is intentionally separate from main.js. It only ever adds/removes
// CSS classes and reads/writes a couple of localStorage keys - it never touches
// the paragraph-splitting or YouTube logic, so there's no risk of it breaking
// anything main.js already does.
//
// How it works:
//   - #workspace gets one of: layout-default / layout-side / layout-compact.
//     The actual positioning for each is defined in style.css via
//     grid-template-areas, so this file just swaps the class name.
//   - #toggleChat hides/shows the chatFrame iframe independently of the
//     existing #toggleStream checkbox (which still controls the whole
//     #youtube-section exactly like before).
//   - Both choices are remembered in localStorage so they persist on reload.

const STORAGE_KEY_LAYOUT = "workspaceLayout";
const STORAGE_KEY_CHAT_VISIBLE = "workspaceChatVisible";

const VALID_LAYOUTS = ["default", "side", "compact"];

document.addEventListener("DOMContentLoaded", () => {
  const workspace = document.getElementById("workspace");
  if (!workspace) return;

  initLayoutSwitcher(workspace);
  initChatToggle();
});

function initLayoutSwitcher(workspace) {
  const layoutButtons = document.querySelectorAll("[data-layout]");

  function applyLayout(layout) {
    if (!VALID_LAYOUTS.includes(layout)) layout = "default";

    workspace.classList.remove("layout-default", "layout-side", "layout-compact");
    workspace.classList.add(`layout-${layout}`);

    layoutButtons.forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.layout === layout);
    });
  }

  layoutButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const layout = btn.dataset.layout;
      applyLayout(layout);
      localStorage.setItem(STORAGE_KEY_LAYOUT, layout);
    });
  });

  const savedLayout = localStorage.getItem(STORAGE_KEY_LAYOUT) || "default";
  applyLayout(savedLayout);
}

function initChatToggle() {
  const toggleChat = document.getElementById("toggleChat");
  const chatFrame = document.getElementById("chatFrame");
  const youtubeSection = document.getElementById("youtube-section");

  if (!toggleChat || !chatFrame || !youtubeSection) return;

  function setChatVisible(visible) {
    chatFrame.hidden = !visible;
    youtubeSection.classList.toggle("chat-hidden", !visible);
  }

  toggleChat.addEventListener("change", () => {
    setChatVisible(toggleChat.checked);
    localStorage.setItem(STORAGE_KEY_CHAT_VISIBLE, String(toggleChat.checked));
  });

  const saved = localStorage.getItem(STORAGE_KEY_CHAT_VISIBLE);
  const chatVisible = saved === null ? true : saved === "true";

  toggleChat.checked = chatVisible;
  setChatVisible(chatVisible);
}