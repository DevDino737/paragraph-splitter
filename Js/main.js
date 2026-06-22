import { splitTextTightly } from "./textSplitter.js";
import { findAndLoadLiveStream } from "./stream.js";
import { getLiveChatId, sendMessage } from "./youtubeApi.js";
import { setCurrentLiveChatId, setCurrentParts } from "./state.js";
import { showToast } from "./ui.js";

const SEND_DELAY_MS = 1200;

document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("paragraphInput");
  const output = document.getElementById("output");
  const splitBtn = document.getElementById("splitButton");
  const sendBtn = document.getElementById("sendAllBtn");
  const loadStreamBtn = document.getElementById("loadStreamBtn");
  const menuBtn = document.getElementById("menuBtn");
  const dropdownMenu = document.getElementById("dropdownMenu");
  const toggleSplit = document.getElementById("toggleSplit");
  const toggleStream = document.getElementById("toggleStream");
  const splitResults = document.getElementById("split-results");
  const youtubeSection = document.getElementById("youtube-section");
  const navbarUrlInput = document.getElementById("navbarUrlInput");
  const videoFrame = document.getElementById("videoFrame");
  const chatFrame = document.getElementById("chatFrame");
  const toast = document.getElementById("toast");
  const sendingIndicator = document.getElementById("youtubeSendingIndicator");
  const sendingText = document.getElementById("youtubeSendingText");
  const profilePic = document.getElementById("profilePic");
  const selectionToolbar = document.getElementById("selectionToolbar");
  const selectionSendBtn = selectionToolbar.querySelector("[data-action='send']");

  let currentParts = [];
  let currentVideoId = null;
  let liveChatId = null;

  const savedProfilePic = localStorage.getItem("userPic");
  if (savedProfilePic && profilePic) {
    profilePic.src = savedProfilePic;
    profilePic.hidden = false;
  }

  menuBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    dropdownMenu.classList.toggle("show");
  });

  document.addEventListener("click", (event) => {
    if (!dropdownMenu.contains(event.target) && event.target !== menuBtn) {
      dropdownMenu.classList.remove("show");
    }
  });

  updateSplitMode();

  toggleSplit.addEventListener("change", () => {
    updateSplitMode();
  });

  function updateSplitMode() {
    splitResults.hidden = !toggleSplit.checked;
    splitBtn.textContent = toggleSplit.checked ? "Split Paragraph" : "Send To Chat";
    sendBtn.hidden = !toggleSplit.checked;
  }

  toggleStream.addEventListener("change", () => {
    youtubeSection.hidden = !toggleStream.checked;
  });

  splitBtn.addEventListener("click", async () => {
    const didSplit = splitInputText();
    if (!didSplit) return;

    if (!toggleSplit.checked) {
      await sendCurrentParts(splitBtn, "Send To Chat");
    }
  });

  input.addEventListener("mouseup", updateSelectionToolbar);
  input.addEventListener("keyup", updateSelectionToolbar);
  input.addEventListener("select", updateSelectionToolbar);
  input.addEventListener("scroll", updateSelectionToolbar);
  input.addEventListener("blur", () => {
    setTimeout(() => {
      if (!selectionToolbar.matches(":hover")) hideSelectionToolbar();
    },
  120);
  });

  selectionSendBtn.addEventListener("click", async () => {
    const selectedText = getSelectedInputText();
    if (!selectedText) {
      hideSelectionToolbar();
      return;
    }

    currentParts = splitTextTightly(selectedText);
    setCurrentParts(currentParts);
    hideSelectionToolbar();
    await sendCurrentParts(selectionSendBtn, "Send");
  });

  function updateSelectionToolbar() {
    const selectedText = getSelectedInputText();
    if (!selectedText) {
      hideSelectionToolbar();
      return;
    }

    const position = getTextareaSelectionToolbarPosition(input);
    selectionToolbar.hidden = false;
    selectionToolbar.classList.add("show");
    selectionToolbar.style.left = `${position.left}px`;
    selectionToolbar.style.top = `${position.top}px`;
  }

  function hideSelectionToolbar() {
    selectionToolbar.classList.remove("show");
    selectionToolbar.hidden = true;
  }

  function getSelectedInputText() {
    return input.value.slice(input.selectionStart, input.selectionEnd).trim();
  }

  function getTextareaSelectionToolbarPosition(textarea) {
    const start = getTextareaSelectionPosition(textarea, textarea.selectionStart);
    const end = getTextareaSelectionPosition(textarea, textarea.selectionEnd);
    const sameLine = Math.abs(start.top - end.top) < 8;

    if (sameLine) {
      return {
        left: (start.left + end.left) / 2,
        top: start.top,
      };
    }

    return start;
  }

  function getTextareaSelectionPosition(textarea, selectionIndex) {
    const rect = textarea.getBoundingClientRect();
    const style = window.getComputedStyle(textarea);
    const mirror = document.createElement("div");
    const marker = document.createElement("span");
    const properties = [
      "boxSizing",
      "width",
      "fontFamily",
      "fontSize",
      "fontWeight",
      "lineHeight",
      "letterSpacing",
      "paddingTop",
      "paddingRight",
      "paddingBottom",
      "paddingLeft",
      "borderTopWidth",
      "borderRightWidth",
      "borderBottomWidth",
      "borderLeftWidth",
      "whiteSpace",
      "wordWrap",
    ];

    properties.forEach((property) => {
      mirror.style[property] = style[property];
    });

    mirror.style.position = "absolute";
    mirror.style.visibility = "hidden";
    mirror.style.overflow = "hidden";
    mirror.style.top = "0";
    mirror.style.left = "-9999px";
    mirror.style.whiteSpace = "pre-wrap";
    mirror.style.overflowWrap = "break-word";

    mirror.textContent = textarea.value.slice(0, selectionIndex);
    marker.textContent = textarea.value.slice(selectionIndex, selectionIndex + 1) || ".";
    mirror.appendChild(marker);
    document.body.appendChild(mirror);

    const markerRect = marker.getBoundingClientRect();
    const left = rect.left + window.scrollX + markerRect.left - mirror.getBoundingClientRect().left;
    const top =
      rect.top +
      window.scrollY +
      markerRect.top -
      mirror.getBoundingClientRect().top -
      textarea.scrollTop -
      42;

    mirror.remove();

    return {
      left: Math.max(rect.left + window.scrollX + 8, left),
      top: Math.max(rect.top + window.scrollY + 8, top),
    };
  }

  function splitInputText() {
    const text = input.value.trim();
    if (!text) {
      showToast(toast, "Paste text first.");
      return false;
    }

    currentParts = splitTextTightly(text);
    setCurrentParts(currentParts);

    output.innerHTML = "";
    currentParts.forEach((part) => {
      const div = document.createElement("div");
      div.className = "part";
      div.textContent = part;
      div.addEventListener("click", async () => {
        await navigator.clipboard.writeText(part);
        div.classList.add("copied");
        setTimeout(() => div.classList.remove("copied"), 600);
        showToast(toast, "Copied part.");
      });
      output.appendChild(div);
    });

    showToast(toast, `Split into ${currentParts.length} part(s).`);
    return true;
  }

  loadStreamBtn.addEventListener("click", loadCurrentStream);

  navbarUrlInput.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;

    event.preventDefault();
    loadCurrentStream();
  });

  navbarUrlInput.addEventListener("input", () => {
    loadStreamBtn.hidden = false;
  });

  async function loadCurrentStream() {
    try {
      setLoading(loadStreamBtn, true, "Loading...");
      currentVideoId = await getRequestedVideoId();
      loadVideoFrames(currentVideoId);
      liveChatId = null;
      loadStreamBtn.hidden = true;
      dropdownMenu.classList.remove("show");
      showToast(toast, "Stream loaded.");
    } catch (error) {
      showToast(toast, error.message);
    } finally {
      setLoading(loadStreamBtn, false, "Load Stream");
    }
  }

  sendBtn.addEventListener("click", () => {
    if (!currentParts.length) {
      showToast(toast, "Split text before sending.");
      return;
    }

    sendCurrentParts(sendBtn, "Send All To Chat");
  });

  async function sendCurrentParts(button, idleLabel) {
    try {
      setLoading(button, true, "Sending...");
      sendingIndicator.hidden = false;

      if (!currentVideoId) {
        currentVideoId = await getRequestedVideoId();
        loadVideoFrames(currentVideoId);
        loadStreamBtn.hidden = true;
      }

      if (!liveChatId) {
        liveChatId = await getLiveChatId(currentVideoId);
        setCurrentLiveChatId(liveChatId);
      }

      for (let i = 0; i < currentParts.length; i++) {
        sendingText.textContent = `Sending ${i + 1} of ${currentParts.length}...`;
        await sendMessage(liveChatId, currentParts[i]);
        await wait(SEND_DELAY_MS);
      }

      showToast(toast, "Done sending.");
    } catch (error) {
      showToast(toast, error.message);
    } finally {
      sendingIndicator.hidden = true;
      sendingText.textContent = "Sending to YouTube...";
      setLoading(button, false, idleLabel);
    }
  }

  async function getRequestedVideoId() {
    const pastedVideoId = parseYouTubeVideoId(navbarUrlInput.value);
    if (pastedVideoId) return pastedVideoId;
    return findAndLoadLiveStream();
  }

  function loadVideoFrames(videoId) {
    videoFrame.src = `https://www.youtube.com/embed/${videoId}`;

    if (location.hostname) {
      const domain = encodeURIComponent(location.hostname);
      chatFrame.src = `https://www.youtube.com/live_chat?v=${videoId}&embed_domain=${domain}`;
    }
  }
});

function parseYouTubeVideoId(value) {
  const raw = value.trim();
  if (!raw) return "";

  try {
    const url = new URL(raw);
    if (url.hostname.includes("youtu.be")) {
      return url.pathname.slice(1);
    }
    if (url.searchParams.has("v")) {
      return url.searchParams.get("v");
    }
    if (url.pathname.includes("/live/")) {
      return url.pathname.split("/live/")[1]?.split("/")[0] || "";
    }
    if (url.pathname.includes("/embed/")) {
      return url.pathname.split("/embed/")[1]?.split("/")[0] || "";
    }
  } catch {
    return raw;
  }

  return "";
}

function setLoading(button, isLoading, label) {
  button.disabled = isLoading;
  button.textContent = label;
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
