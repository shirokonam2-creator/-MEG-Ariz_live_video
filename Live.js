// ========================================
// Live.js
// Quản lý phiên Live / phát video
// ========================================

const {
  createVideoLinks
} = require("./Linkvideo");

const {
  normalizeName
} = require("./Namevideo");

const {
  createPlayOrder,
  getNextIndex,
  getVideoByOrder
} = require("./Thutuphat");

let activeLive = null;

// ========================================
// Tạo phiên Live
// ========================================

function createLive({
  owner,
  voiceChannel,
  videoName,
  links
}) {

  const videoLinks =
    createVideoLinks(links);

  if (videoLinks.length === 0) {
    throw new Error(
      "Không có link video."
    );
  }

  const name =
    normalizeName(videoName);

  const playOrder =
    createPlayOrder(videoLinks);

  activeLive = {
    owner,
    voiceChannel,
    videoName: name,
    videos: videoLinks,
    playOrder,
    currentIndex: 0,
    status: "playing",
    createdAt: Date.now()
  };

  return activeLive;
}

// ========================================
// Lấy Live hiện tại
// ========================================

function getLive() {
  return activeLive;
}

// ========================================
// Lấy video hiện tại
// ========================================

function getCurrentVideo() {

  if (!activeLive) {
    return null;
  }

  return getVideoByOrder(
    activeLive.videos,
    activeLive.currentIndex
  );
}

// ========================================
// Chuyển video tiếp theo
// ========================================

function nextVideo() {

  if (!activeLive) {
    return null;
  }

  const nextIndex =
    getNextIndex(
      activeLive.currentIndex,
      activeLive.videos.length
    );

  if (nextIndex === -1) {

    activeLive.status = "ended";

    return null;
  }

  activeLive.currentIndex =
    nextIndex;

  activeLive.status = "playing";

  return getCurrentVideo();
}

// ========================================
// Tạm dừng
// ========================================

function pauseLive() {

  if (!activeLive) {
    return false;
  }

  activeLive.status = "paused";

  return true;
}

// ========================================
// Tiếp tục
// ========================================

function resumeLive() {

  if (!activeLive) {
    return false;
  }

  activeLive.status = "playing";

  return true;
}

// ========================================
// Dừng Live
// ========================================

function stopLive() {

  if (!activeLive) {
    return false;
  }

  activeLive.status = "stopped";

  return true;
}

// ========================================
// Xóa phiên Live
// ========================================

function clearLive() {
  activeLive = null;
}

module.exports = {
  createLive,
  getLive,
  getCurrentVideo,
  nextVideo,
  pauseLive,
  resumeLive,
  stopLive,
  clearLive
};
