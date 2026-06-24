import { accessToken } from "./state.js";

export const CHANNEL_ID = "UCpOWvrgnLr6JlCR45HbT6vQ";

// find live stream
export async function findLiveVideoIdForChannel() {
  const liveSearchVideoId = await findLiveVideoIdFromSearch();
  if (liveSearchVideoId) return liveSearchVideoId;

  const recentVideoIds = await findRecentVideoIdsForChannel();
  const activeVideoId = await findActiveLiveVideoFromIds(recentVideoIds);
  if (activeVideoId) return activeVideoId;

  throw new Error("No live stream found. Try pasting the live video URL.");
}

async function findLiveVideoIdFromSearch() {
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
  if (!res.ok) throw new Error(data.error?.message || "Live stream search failed");

  return data.items?.[0]?.id?.videoId || "";
}

async function findRecentVideoIdsForChannel() {
  const params = new URLSearchParams({
    part: "snippet",
    channelId: CHANNEL_ID,
    type: "video",
    order: "date",
    maxResults: "10",
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
  if (!res.ok) throw new Error(data.error?.message || "Recent video search failed");

  return data.items
    ?.map((item) => item.id?.videoId)
    .filter(Boolean) || [];
}

async function findActiveLiveVideoFromIds(videoIds) {
  if (!videoIds.length) return "";

  const params = new URLSearchParams({
    part: "snippet,liveStreamingDetails",
    id: videoIds.join(","),
  });

  const res = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?${params}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || "Live video details failed");

  const activeLive = data.items?.find((item) => {
    const details = item.liveStreamingDetails;
    return (
      item.snippet?.liveBroadcastContent === "live" ||
      (details?.actualStartTime && !details?.actualEndTime)
    );
  });

  return activeLive?.id || "";
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
  if (!res.ok) throw new Error(data.error?.message || "Live chat lookup failed");

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
