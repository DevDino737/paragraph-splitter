// Shared global state (simple version)

export let accessToken = localStorage.getItem("accessToken") || "";
export let tokenClient = null;

export let currentVideoId = null;
export let currentLiveChatId = null;

export let isSendingToYoutube = false;
export let isFindingLiveStream = false;
export let liveStreamPollId = null;

export let currentParts = [];

// setters (so other files can update safely)
export function setAccessToken(token) {
  accessToken = token;
}

export function setCurrentVideoId(id) {
  currentVideoId = id;
}

export function setCurrentLiveChatId(id) {
  currentLiveChatId = id;
}

export function setCurrentParts(parts) {
  currentParts = parts;
}