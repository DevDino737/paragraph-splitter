// ================= AUTH GUARD =================
//
// Small shared helper used by youtubeApi.js. Google's implicit OAuth flow
// (see auth.js) issues access tokens that expire after about an hour and
// come with no refresh token, and the token client itself only exists on
// Login.html, not on this page. So there's no way to silently mint a new
// token here - the only real fix is to drop the stale token and send the
// user back through the same login redirect main.js already uses when
// there's no token at all.

export function isUnauthorized(response) {
  return response.status === 401;
}

export function handleUnauthorized() {
  localStorage.removeItem("accessToken");
  window.location.replace("Login files/Login.html");
}