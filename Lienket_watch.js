// ========================================
// Lienket_watch.js
// Cầu nối /watch ↔ Live
// ========================================

const {
  createLive,
  getLive,
  getCurrentVideo,
  nextVideo,
  pauseLive,
  resumeLive,
  stopLive,
  clearLive,
  MAX_WATCH_LINKS
} = require("./Live");

// ========================================
// Tạo Live từ /watch
// ========================================

function startWatchLive({
  owner,
  voiceChannel,
  videoName,
  links
}) {

  if (!Array.isArray(links)) {
    throw new Error(
      "Danh sách link không hợp lệ."
    );
  }

  if (links.length > MAX_WATCH_LINKS) {
    throw new Error(
      `Chỉ được tối đa ${MAX_WATCH_LINKS} link video.`
    );
  }

  return createLive({
    owner,
    voiceChannel,
    videoName,
    links
  });
}

// ========================================
// Lấy Live
// ========================================

function getWatchLive() {
  return getLive();
}

// ========================================
// Video hiện tại
// ========================================

function getWatchCurrentVideo() {
  return getCurrentVideo();
}

// ========================================
// Video tiếp theo
// ========================================

function watchNext() {
  return nextVideo();
}

// ========================================
// Pause
// ========================================

function watchPause() {
  return pauseLive();
}

// ========================================
// Resume
// ========================================

function watchResume() {
  return resumeLive();
}

// ========================================
// Stop
// ========================================

function watchStop() {
  return stopLive();
}

// ========================================
// Xóa Live
// ========================================

function clearWatchLive() {
  clearLive();
}

module.exports = {

  MAX_WATCH_LINKS,

  startWatchLive,

  getWatchLive,

  getWatchCurrentVideo,

  watchNext,

  watchPause,

  watchResume,

  watchStop,

  clearWatchLive
};
