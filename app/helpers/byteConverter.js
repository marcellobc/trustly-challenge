const BYTES = 1;
const KB = 1024;
const MB = KB * 1024;
const GB = MB * 1024;

const SIZE_EXT = { BYTES, KB, MB, GB };

module.exports = (size, ext) => parseInt(size * SIZE_EXT[ext.toUpperCase()]);
