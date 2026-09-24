const roomId =
  new URLSearchParams(window.location.search).get("room");

const statusText =
  document.getElementById("status");

const creatorText =
  document.getElementById("creator");

const sourceText =
  document.getElementById("source");

const youtubeContainer =
  document.getElementById("youtubeContainer");

const videoPlayer =
  document.getElementById("videoPlayer");

const playBtn =
  document.getElementById("playBtn");

const pauseBtn =
  document.getElementById("pauseBtn");

const stopBtn =
  document.getElementById("stopBtn");

let room = null;
let youtubePlayer = null;
let updating = false;
let youtubeReady = false;


// ==================================
// LẤY YOUTUBE VIDEO ID
// ==================================

function getYouTubeId(url) {

  try {

    const parsed = new URL(url);

    if (
      parsed.hostname === "youtu.be" ||
      parsed.hostname === "www.youtu.be"
    ) {
      return parsed.pathname.substring(1);
    }

    if (
      parsed.hostname.includes("youtube.com")
    ) {
      return parsed.searchParams.get("v");
    }

  } catch (error) {

    console.error(
      "YouTube URL error:",
      error
    );
  }

  return null;
}


// ==================================
// TẢI YOUTUBE API
// ==================================

function loadYouTubeAPI() {

  if (
    window.YT &&
    window.YT.Player
  ) {

    createYouTubePlayer();

    return;
  }

  const script =
    document.createElement("script");

  script.src =
    "https://www.youtube.com/iframe_api";

  document.head.appendChild(script);

  window.onYouTubeIframeAPIReady =
    createYouTubePlayer;
}


// ==================================
// TẠO YOUTUBE PLAYER
// ==================================

function createYouTubePlayer() {

  if (!room) return;

  const youtubeId =
    getYouTubeId(room.url);

  if (!youtubeId) return;

  youtubePlayer =
    new YT.Player(
      "youtubeContainer",
      {
        videoId: youtubeId,

        playerVars: {
          autoplay: 0,
          controls: 1,
          rel: 0,
          modestbranding: 1
        },

        events: {

          onReady: () => {

            youtubeReady = true;

            console.log(
              "🎬 YouTube Player Ready"
            );

          },

          onStateChange: event => {

            if (!youtubeReady) return;

            if (
              updating
            ) return;

            if (
              event.data ===
              YT.PlayerState.PLAYING
            ) {

              sendState(
                true,
                youtubePlayer.getCurrentTime()
              );

            }

            if (
              event.data ===
              YT.PlayerState.PAUSED
            ) {

              sendState(
                false,
                youtubePlayer.getCurrentTime()
              );

            }
          }
        }
      }
    );
}


// ==================================
// VIDEO TRỰC TIẾP
// ==================================

function loadDirectVideo() {

  youtubeContainer.innerHTML = "";

  youtubeContainer.style.display =
    "none";

  videoPlayer.hidden = false;

  videoPlayer.src = room.url;

}


// ==================================
// TẢI PLAYER
// ==================================

function loadPlayer() {

  if (!room) return;

  const youtubeId =
    getYouTubeId(room.url);

  if (youtubeId) {

    videoPlayer.hidden = true;

    youtubeContainer.style.display =
      "block";

    loadYouTubeAPI();

    return;
  }

  loadDirectVideo();
}


// ==================================
// TẢI PHÒNG
// ==================================

async function loadRoom() {

  if (!roomId) {

    statusText.textContent =
      "❌ Không có mã phòng";

    return;
  }

  try {

    const response =
      await fetch(
        `/api/cinema/${roomId}`
      );

    if (!response.ok) {

      throw new Error(
        "Room not found"
      );
    }

    room =
      await response.json();

    creatorText.textContent =
      room.creator;

    sourceText.textContent =
      room.url;

    loadPlayer();

    statusText.textContent =
      "🟢 Đã kết nối";

  } catch (error) {

    console.error(error);

    statusText.textContent =
      "❌ Không tìm thấy phòng";
  }
}


// ==================================
// ĐỒNG BỘ PHÒNG
// ==================================

async function syncState() {

  if (
    !roomId ||
    updating
  ) {
    return;
  }

  try {

    const response =
      await fetch(
        `/api/cinema/${roomId}`
      );

    if (!response.ok) {
      return;
    }

    const newRoom =
      await response.json();

    if (!room) {

      room = newRoom;

      return;
    }

    if (
      newRoom.updatedAt !==
      room.updatedAt
    ) {

      room = newRoom;

      applyRoomState();
    }

  } catch (error) {

    statusText.textContent =
      "🟡 Mất kết nối...";
  }
}


// ==================================
// ÁP DỤNG TRẠNG THÁI
// ==================================

function applyRoomState() {

  if (!room) return;


  // ------------------------------
  // YOUTUBE
  // ------------------------------

  if (
    youtubePlayer &&
    youtubeReady
  ) {

    const current =
      youtubePlayer.getCurrentTime();

    const target =
      room.currentTime;

    if (
      Math.abs(
        current - target
      ) > 2
    ) {

      youtubePlayer.seekTo(
        target,
        true
      );
    }

    if (room.playing) {

      youtubePlayer.playVideo();

    } else {

      youtubePlayer.pauseVideo();
    }

    return;
  }


  // ------------------------------
  // VIDEO TRỰC TIẾP
  // ------------------------------

  if (!videoPlayer.hidden) {

    if (
      Math.abs(
        videoPlayer.currentTime -
        room.currentTime
      ) > 2
    ) {

      videoPlayer.currentTime =
        room.currentTime;
    }

    if (room.playing) {

      videoPlayer
        .play()
        .catch(() => {});

    } else {

      videoPlayer.pause();
    }
  }
}


// ==================================
// GỬI TRẠNG THÁI
// ==================================

async function sendState(
  playing,
  currentTime
) {

  if (!roomId) return;

  updating = true;

  try {

    await fetch(
      `/api/cinema/${roomId}`,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json"
        },

        body: JSON.stringify({
          playing,
          currentTime
        })
      }
    );

  } catch (error) {

    console.error(
      "Sync error:",
      error
    );

  } finally {

    updating = false;
  }
}


// ==================================
// NÚT PLAY
// ==================================

playBtn.onclick =
  async () => {

    if (
      youtubePlayer &&
      youtubeReady
    ) {

      youtubePlayer.playVideo();

      await sendState(
        true,
        youtubePlayer.getCurrentTime()
      );

      return;
    }

    if (!videoPlayer.hidden) {

      await videoPlayer
        .play()
        .catch(() => {});

      await sendState(
        true,
        videoPlayer.currentTime
      );
    }
  };


// ==================================
// NÚT PAUSE
// ==================================

pauseBtn.onclick =
  async () => {

    if (
      youtubePlayer &&
      youtubeReady
    ) {

      const time =
        youtubePlayer.getCurrentTime();

      youtubePlayer.pauseVideo();

      await sendState(
        false,
        time
      );

      return;
    }

    if (!videoPlayer.hidden) {

      videoPlayer.pause();

      await sendState(
        false,
        videoPlayer.currentTime
      );
    }
  };


// ==================================
// NÚT STOP
// ==================================

stopBtn.onclick =
  async () => {

    if (
      youtubePlayer &&
      youtubeReady
    ) {

      youtubePlayer.pauseVideo();

      youtubePlayer.seekTo(
        0,
        true
      );

      await sendState(
        false,
        0
      );

      return;
    }

    if (!videoPlayer.hidden) {

      videoPlayer.pause();

      videoPlayer.currentTime = 0;

      await sendState(
        false,
        0
      );
    }
  };


// ==================================
// KHỞI ĐỘNG
// ==================================

loadRoom();

setInterval(
  syncState,
  1000
); 
