import { setAccessToken } from "./state.js";

const CLIENT_ID =
  "752087174359-fvqg51i8r2r22mt59ood82gni6ls62cl.apps.googleusercontent.com";

const SCOPES =
  "https://www.googleapis.com/auth/youtube https://www.googleapis.com/auth/userinfo.profile";

export let tokenClient = null;

export function initGoogleTokenClient(onLogin) {
  if (!window.google?.accounts?.oauth2) return false;

  tokenClient = window.google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPES,
    callback: async (response) => {
      setAccessToken(response.access_token);
      await onLogin?.();
    },
  });

  return true;
}

export function login() {
  if (tokenClient) {
    tokenClient.requestAccessToken();
  }
}

export async function fetchGoogleProfile(accessToken) {
  const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) throw new Error("Failed to load profile");
  return res.json();
}