// ========================================
// Namevideo.js
// Quản lý tên video
// ========================================

function normalizeName(name) {
  if (!name) {
    return "Video không có tên";
  }

  const result = String(name).trim();

  return result.length > 0
    ? result
    : "Video không có tên";
}

function createVideoName(name, index) {
  return {
    id: index + 1,
    name: normalizeName(name)
  };
}

module.exports = {
  normalizeName,
  createVideoName
};
