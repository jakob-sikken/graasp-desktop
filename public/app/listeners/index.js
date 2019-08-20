const loadSpace = require('./loadSpace');
const saveSpace = require('./saveSpace');
const getSpace = require('./getSpace');
const getSpaces = require('./getSpaces');
const deleteSpace = require('./deleteSpace');
const showSyncSpacePrompt = require('./showSyncSpacePrompt');
const syncSpace = require('./syncSpace');
const exportSpace = require('./exportSpace');
const showLoadSpacePrompt = require('./showLoadSpacePrompt');
const showExportSpacePrompt = require('./showExportSpacePrompt');
const showDeleteSpacePrompt = require('./showDeleteSpacePrompt');

module.exports = {
  loadSpace,
  saveSpace,
  getSpace,
  getSpaces,
  showSyncSpacePrompt,
  syncSpace,
  deleteSpace,
  exportSpace,
  showLoadSpacePrompt,
  showExportSpacePrompt,
  showDeleteSpacePrompt,
};
