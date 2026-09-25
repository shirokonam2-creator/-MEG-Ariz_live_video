// ========================================
// Lienket_watch.js
// Kết nối /watch với Live
// ========================================

const {
  createLive,
  getLive,
  getCurrentVideo,
  nextVideo,
  pauseLive,
  resumeLive,
  stopLive,
  clearLive
} = require("./Live");

// ========================================
// Nhận dữ liệu từ /watch
// ========================================

function startWatchLive({
  owner,
  voiceChannel,
  videoName,
  links
}) {

  return createLive({
    owner,
    voiceChannel,
    videoName,
    links
  });
}

// ========================================
// Lấy trạng thái Live
// ========================================

function getWatchLive() {
  return getLive();
}

// ========================================
// Lấy video hiện tại
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
  startWatchLive,
  getWatchLive,
  getWatchCurrentVideo,
  watchNext,
  watchPause,
  watchResume,
  watchStop,
  clearWatchLive
};
