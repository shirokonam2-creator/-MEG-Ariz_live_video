// ========================================
// Thutuphat.js
// Quản lý thứ tự phát
// ========================================

const MAX_WATCH_LINKS = 3;

function createPlayOrder(videos) {
  if (!Array.isArray(videos)) {
    return [];
  }

  return videos
    .slice(0, MAX_WATCH_LINKS)
    .map((video, index) => ({
      position: index + 1,
      videoId: video.id
    }));
}

function getNextIndex(currentIndex, total) {
  if (total <= 0) {
    return -1;
  }

  const nextIndex = currentIndex + 1;

  if (nextIndex >= total) {
    return -1;
  }

  return nextIndex;
}

function getVideoByOrder(videos, index) {
  if (!Array.isArray(videos)) {
    return null;
  }

  if (index < 0 || index >= videos.length) {
    return null;
  }

  return videos[index];
}

function hasReachedEnd(currentIndex, total) {
  return currentIndex >= total - 1;
}

module.exports = {
  MAX_WATCH_LINKS,
  createPlayOrder,
  getNextIndex,
  getVideoByOrder,
  hasReachedEnd
};
