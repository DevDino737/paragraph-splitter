import { accessToken } from "./state.js";

const CHANNEL_ID = "UCAtGANLX7I5N4wOBLH8Yq8Q";

// find live stream
export async function findLiveVideoIdForChannel() {
  const params = new URLSearchParams({
    part: "snippet",
    channelId: CHANNEL_ID,
    eventType: "live",
    type: "video",
    maxResults: "1",
  });

  const res = await fetch(
    `https://www.googleapis.com/youtube/v3/search?${params}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  const data = await res.json();

  const videoId = data.items?.[0]?.id?.videoId;
  if (!videoId) throw new Error("No live stream found");

  return videoId;
}

// get live chat id
export async function getLiveChatId(videoId) {
  const res = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?part=liveStreamingDetails&id=${videoId}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  const data = await res.json();

  const chatId = data.items?.[0]?.liveStreamingDetails?.activeLiveChatId;

  if (!chatId) throw new Error("No live chat found");

  return chatId;
}

// send message
export async function sendMessage(liveChatId, message) {
  const res = await fetch(
    "https://www.googleapis.com/youtube/v3/liveChat/messages?part=snippet",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        snippet: {
          liveChatId,
          type: "textMessageEvent",
          textMessageDetails: {
            messageText: message,
          },
        },
      }),
    }
  );

  const data = await res.json();

  if (!res.ok) throw new Error(data.error?.message || "Send failed");

  return data;
}