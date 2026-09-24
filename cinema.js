 const roomId =
  new URLSearchParams(window.location.search).get("room");

const statusText = document.getElementById("status");
const creatorText = document.getElementById("creator");
const sourceText = document.getElementById("source");

const youtubePlayer =
  document.getElementById("youtubePlayer");

const videoPlayer =
  document.getElementById("videoPlayer");

const playBtn =
  document.getElementById("playBtn");

const pauseBtn =
  document.getElementById("pauseBtn");

const stopBtn =
  document.getElementById("stopBtn");

let room = null;
let updating = false;

function getYouTubeId(url) {

  try {

    const parsed = new URL(url);

    if (parsed.hostname.includes("youtu.be")) {
      return parsed.pathname.substring(1);
    }

    if (parsed.hostname.includes("youtube.com")) {
      return parsed.searchParams.get("v");
    }

  } catch (error) {
    return null;
  }

  return null;
}

function loadPlayer(url) {

  const youtubeId = getYouTubeId(url);

  if (youtubeId) {

    youtubePlayer.hidden = false;
    videoPlayer.hidden = true;

    youtubePlayer.src =
      `https://www.youtube.com/embed/${youtubeId}?enablejsapi=1`;

    return;
  }

  youtubePlayer.hidden = true;
  videoPlayer.hidden = false;

  videoPlayer.src = url;
}

async function loadRoom() {

  if (!roomId) {
    statusText.textContent = "❌ Không có mã phòng";
    return;
  }

  try {

    const response =
      await fetch(`/api/cinema/${roomId}`);

    if (!response.ok) {
      throw new Error("Room not found");
    }

    room = await response.json();

    creatorText.textContent = room.creator;
    sourceText.textContent = room.url;

    loadPlayer(room.url);

    statusText.textContent = "🟢 Đã kết nối";

  } catch (error) {

    statusText.textContent =
      "❌ Không tìm thấy phòng";
  }
}

async function syncState() {

  if (!roomId || updating) return;

  try {

    const response =
      await fetch(`/api/cinema/${roomId}`);

    if (!response.ok) return;

    const newRoom = await response.json();

    if (!room) {
      room = newRoom;
      return;
    }

    if (newRoom.updatedAt !== room.updatedAt) {

      room = newRoom;

      if (newRoom.playing) {

        if (!videoPlayer.hidden) {
          await videoPlayer.play().catch(() => {});
        }

      } else {

        if (!videoPlayer.hidden) {
          videoPlayer.pause();
        }
      }
    }

  } catch (error) {
    statusText.textContent = "🟡 Mất kết nối...";
  }
}

async function sendState(playing, currentTime) {

  if (!roomId) return;

  updating = true;

  try {

    await fetch(`/api/cinema/${roomId}`, {
      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify({
        playing,
        currentTime
      })
    });

  } catch (error) {

    console.error(error);

  } finally {

    updating = false;
  }
}

playBtn.onclick = async () => {

  if (!videoPlayer.hidden) {

    await videoPlayer.play();

    await sendState(
      true,
      videoPlayer.currentTime
    );
  }
};

pauseBtn.onclick = async () => {

  if (!videoPlayer.hidden) {

    videoPlayer.pause();

    await sendState(
      false,
      videoPlayer.currentTime
    );
  }
};

stopBtn.onclick = async () => {

  if (!videoPlayer.hidden) {

    videoPlayer.pause();

    videoPlayer.currentTime = 0;

    await sendState(false, 0);
  }
};

loadRoom();

setInterval(syncState, 1000);
