const CLIENT_ID =
  "752087174359-fvqg51i8r2r22mt59ood82gni6ls62cl.apps.googleusercontent.com";

const SCOPES = [
  "https://www.googleapis.com/auth/youtube.force-ssl",
  "https://www.googleapis.com/auth/userinfo.profile"
].join(" ");

let tokenClient = null;

function initializeGoogle() {
  if (!window.google?.accounts?.oauth2) {
    console.error("Google library not loaded");
    return false;
  }

  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPES,

    callback: async (response) => {
      if (response.error) {
        console.error(response);
        document.getElementById("loginStatus").textContent =
          response.error_description || "Google Sign-In was cancelled or could not be completed.";
        const loginBtn = document.getElementById("loginBtn");
        loginBtn.textContent = "Sign in with Google";
        loginBtn.disabled = false;
        return;
      }

      const accessToken = response.access_token;

      localStorage.setItem("accessToken", accessToken);

      try {
        const profileResponse = await fetch(
          "https://www.googleapis.com/oauth2/v3/userinfo",
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (!profileResponse.ok) {
          throw new Error("Could not retrieve your Google profile.");
        }

        const user = await profileResponse.json();

        localStorage.setItem("userName", user.name || "User");
        localStorage.setItem("userPic", user.picture || "");

        document.getElementById(
          "loginStatus"
        ).textContent = `Logged in as ${user.name}`;

        window.location.href = "../index.html";
      } catch (err) {
        console.error(err);
        document.getElementById("loginStatus").textContent =
          "Sign-in failed. Please try again.";
        const loginBtn = document.getElementById("loginBtn");
        loginBtn.textContent = "Sign in with Google";
        loginBtn.disabled = false;
      }
    },
  });

  return true;
}

document.addEventListener("DOMContentLoaded", () => {
  const loginBtn = document.getElementById("loginBtn");
  const loginStatus = document.getElementById("loginStatus");

  // Initialize Google as soon as it's available
  const waitForGoogle = setInterval(() => {
    if (initializeGoogle()) {
      clearInterval(waitForGoogle);
    }
  }, 50);

  loginBtn.addEventListener("click", () => {
    if (!tokenClient) {
      loginStatus.textContent = "Loading Google Sign-In...";
      return;
    }

    // Show that something is happening
    loginBtn.textContent = "Loading...";
    loginBtn.disabled = true;
    loginStatus.textContent = "Opening Google Sign-In...";

      requestAnimationFrame(() => {
      // Ask Google to show consent so an older sign-in cannot reuse a token
      // that was issued before the YouTube chat permission was approved.
      tokenClient.requestAccessToken({ prompt: "consent" });
    });
  });

});
