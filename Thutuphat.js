// ========================================
// Thutuphat.js
// Quản lý thứ tự phát video
// ========================================

function createPlayOrder(videos) {
  if (!Array.isArray(videos)) {
    return [];
  }

  return videos.map((video, index) => ({
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

module.exports = {
  createPlayOrder,
  getNextIndex,
  getVideoByOrder
};
