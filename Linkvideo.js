// ========================================
// Linkvideo.js
// Quản lý danh sách link video
// ========================================

function normalizeLinks(links) {
  if (!Array.isArray(links)) {
    return [];
  }

  return links
    .map(link => String(link).trim())
    .filter(link => link.length > 0);
}

function createVideoLinks(links) {
  return normalizeLinks(links).map((link, index) => ({
    id: index + 1,
    link
  }));
}

function getLink(video) {
  if (!video) {
    return null;
  }

  return video.link || null;
}

module.exports = {
  normalizeLinks,
  createVideoLinks,
  getLink
}; 
