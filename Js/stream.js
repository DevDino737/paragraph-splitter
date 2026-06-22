import { accessToken } from "./state.js";
import { findLiveVideoIdForChannel } from "./youtubeApi.js";

export async function findAndLoadLiveStream() {
  if (!accessToken) throw new Error("Not logged in");

  const videoId = await findLiveVideoIdForChannel();

  return videoId;
}