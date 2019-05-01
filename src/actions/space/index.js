import { toastr } from 'react-redux-toastr';
import {
  GET_SPACES,
  FLAG_GETTING_SPACE,
  FLAG_GETTING_SPACES,
  FLAG_LOADING_SPACE,
  CLEAR_SPACE,
  GET_SPACE_SUCCEEDED,
  FLAG_EXPORTING_SPACE,
  FLAG_DELETING_SPACE,
  ON_SPACE_DELETED,
  FLAG_SAVING_SPACE,
  SAVE_SPACE_SUCCEEDED,
} from '../../types';
import {
  ERROR_ZIP_CORRUPTED,
  ERROR_JSON_CORRUPTED,
  ERROR_SPACE_ALREADY_AVAILABLE,
  ERROR_GENERAL,
  ERROR_DOWNLOADING_FILE,
} from '../../config/errors';
import { clearPhase } from '../phase';
import {
  DELETE_SPACE_CHANNEL,
  DELETED_SPACE_CHANNEL,
  EXPORT_SPACE_CHANNEL,
  EXPORTED_SPACE_CHANNEL,
  GET_SPACE_CHANNEL,
  GET_SPACES_CHANNEL,
  LOAD_SPACE_CHANNEL,
  LOADED_SPACE_CHANNEL,
  MESSAGE_DIALOG_RESPOND_CHANNEL,
  SAVE_DIALOG_PATH_SELECTED_CHANNEL,
  SHOW_MESSAGE_DIALOG_CHANNEL,
  SHOW_SAVE_DIALOG_CHANNEL,
  SAVE_SPACE_CHANNEL,
} from '../../config/channels';
import {
  // ERROR_DOWNLOADING_MESSAGE,
  ERROR_DELETING_MESSAGE,
  ERROR_DOWNLOADING_MESSAGE,
  ERROR_EXPORTING_MESSAGE,
  ERROR_GETTING_SPACE_MESSAGE,
  ERROR_JSON_CORRUPTED_MESSAGE,
  ERROR_MESSAGE_HEADER,
  ERROR_SAVING_SPACE_MESSAGE,
  ERROR_SPACE_ALREADY_AVAILABLE_MESSAGE,
  ERROR_ZIP_CORRUPTED_MESSAGE,
  SUCCESS_DELETING_MESSAGE,
  SUCCESS_EXPORTING_MESSAGE,
  SUCCESS_MESSAGE_HEADER,
  SUCCESS_SAVING_MESSAGE,
  SUCCESS_SPACE_LOADED_MESSAGE,
} from '../../config/messages';
import { createFlag, isErrorResponse } from '../common';
import { generateGetSpaceEndpoint } from '../../config/endpoints';
import { DEFAULT_GET_REQUEST } from '../../config/rest';

const flagGettingSpace = createFlag(FLAG_GETTING_SPACE);
const flagGettingSpaces = createFlag(FLAG_GETTING_SPACES);
const flagLoadingSpace = createFlag(FLAG_LOADING_SPACE);
const flagDeletingSpace = createFlag(FLAG_DELETING_SPACE);
const flagExportingSpace = createFlag(FLAG_EXPORTING_SPACE);
const flagSavingSpace = createFlag(FLAG_SAVING_SPACE);

// const getSpace = async ({ id, spaces }) => async (dispatch) => {
//   // raise flag
//   dispatch(flagGettingSpace(true));
//   // tell electron to download space
//   window.ipcRenderer.send(GET_SPACE_CHANNEL, { id, spaces });
//   // create listener
//   window.ipcRenderer.once(GET_SPACE_CHANNEL, (event, space) => {
//     // dispatch that the getter has succeeded
//     if (space === ERROR_GENERAL) {
//       toastr.error('Error', ERROR_DOWNLOADING_MESSAGE);
//     } else {
//       dispatch({
//         type: GET_SPACE_SUCCEEDED,
//         payload: space,
//       });
//     }
//     dispatch(flagGettingSpace(false));
//   });
//   // lower flag
//   //   // delete the listener
//   // });
// };

const getLocalSpace = async ({ id }) => async dispatch => {
  try {
    dispatch(flagGettingSpace(true));

    // tell electron to get space
    window.ipcRenderer.send(GET_SPACE_CHANNEL, { id });

    // create listener
    window.ipcRenderer.once(GET_SPACE_CHANNEL, async (event, space) => {
      // if there is no space offline, show error
      if (!space) {
        toastr.error('Error', ERROR_GETTING_SPACE_MESSAGE);
      } else {
        dispatch({
          type: GET_SPACE_SUCCEEDED,
          payload: space,
        });
      }
    });
  } catch (err) {
    toastr.error('Error', ERROR_GETTING_SPACE_MESSAGE);
  } finally {
    dispatch(flagGettingSpace(false));
  }
};

const getRemoteSpace = async ({ id }) => async dispatch => {
  try {
    dispatch(flagGettingSpace(true));

    const url = generateGetSpaceEndpoint(id);
    const response = await fetch(url, DEFAULT_GET_REQUEST);

    // throws if it is an error
    await isErrorResponse(response);

    const space = await response.json();
    dispatch({
      type: GET_SPACE_SUCCEEDED,
      payload: space,
    });
  } catch (err) {
    toastr.error('Error', ERROR_GETTING_SPACE_MESSAGE);
  } finally {
    dispatch(flagGettingSpace(false));
  }
};

const getSpaces = () => dispatch => {
  dispatch(flagGettingSpaces(true));
  window.ipcRenderer.send(GET_SPACES_CHANNEL);
  // create listener
  window.ipcRenderer.once(GET_SPACES_CHANNEL, (event, spaces) => {
    // dispatch that the getter has succeeded
    dispatch({
      type: GET_SPACES,
      payload: spaces,
    });
    dispatch(flagGettingSpaces(false));
  });
};

const saveSpace = async ({ space }) => async dispatch => {
  try {
    dispatch(flagSavingSpace(true));

    // tell electron to get space
    window.ipcRenderer.send(SAVE_SPACE_CHANNEL, { space });

    // create listener
    window.ipcRenderer.once(SAVE_SPACE_CHANNEL, async (event, response) => {
      // if there is no response, show error
      if (!response) {
        return toastr.error(ERROR_MESSAGE_HEADER, ERROR_SAVING_SPACE_MESSAGE);
      }

      switch (response) {
        case ERROR_SPACE_ALREADY_AVAILABLE:
          return toastr.error(
            ERROR_MESSAGE_HEADER,
            ERROR_SPACE_ALREADY_AVAILABLE_MESSAGE
          );

        case ERROR_DOWNLOADING_FILE:
          return toastr.error(ERROR_MESSAGE_HEADER, ERROR_DOWNLOADING_MESSAGE);

        // todo: check that it is actually a space before dispatching success
        default:
          toastr.success(SUCCESS_MESSAGE_HEADER, SUCCESS_SAVING_MESSAGE);
          return dispatch({
            type: SAVE_SPACE_SUCCEEDED,
            payload: response,
          });
      }
    });
  } catch (err) {
    toastr.error(ERROR_MESSAGE_HEADER, ERROR_SAVING_SPACE_MESSAGE);
  } finally {
    dispatch(flagSavingSpace(false));
  }
};

const clearSpace = () => dispatch => {
  dispatch(clearPhase());
  return dispatch({
    type: CLEAR_SPACE,
  });
};

const exportSpace = (id, spaces, spaceName) => dispatch => {
  dispatch(flagExportingSpace(true));
  window.ipcRenderer.send(SHOW_SAVE_DIALOG_CHANNEL, spaceName);
  window.ipcRenderer.once(
    SAVE_DIALOG_PATH_SELECTED_CHANNEL,
    (event, archivePath) => {
      if (archivePath) {
        window.ipcRenderer.send(EXPORT_SPACE_CHANNEL, {
          archivePath,
          id,
          spaces,
        });
      } else {
        dispatch(flagExportingSpace(false));
      }
    }
  );
  window.ipcRenderer.once(EXPORTED_SPACE_CHANNEL, (event, newSpaces) => {
    switch (newSpaces) {
      case ERROR_GENERAL:
        toastr.error('Error', ERROR_EXPORTING_MESSAGE);
        break;
      default:
        toastr.success('Success', SUCCESS_EXPORTING_MESSAGE);
    }
    dispatch(flagExportingSpace(false));
  });
};

const deleteSpace = ({ id }) => dispatch => {
  dispatch(flagDeletingSpace(true));
  window.ipcRenderer.send(SHOW_MESSAGE_DIALOG_CHANNEL);
  window.ipcRenderer.once(MESSAGE_DIALOG_RESPOND_CHANNEL, (event, respond) => {
    if (respond === 1) {
      window.ipcRenderer.send(DELETE_SPACE_CHANNEL, { id });
    } else {
      dispatch(flagExportingSpace(false));
    }
  });
  window.ipcRenderer.once(DELETED_SPACE_CHANNEL, (event, deletedReply) => {
    switch (deletedReply) {
      case ERROR_GENERAL:
        toastr.error('Error', ERROR_DELETING_MESSAGE);
        break;
      default:
        toastr.success('Success', SUCCESS_DELETING_MESSAGE);
        dispatch({
          type: ON_SPACE_DELETED,
          payload: true,
        });
    }
    dispatch(flagDeletingSpace(false));
  });
};

const loadSpace = ({ fileLocation }) => dispatch => {
  dispatch(flagLoadingSpace(true));
  window.ipcRenderer.send(LOAD_SPACE_CHANNEL, { fileLocation });
  window.ipcRenderer.once(LOADED_SPACE_CHANNEL, (event, newSpaces) => {
    switch (newSpaces) {
      case ERROR_ZIP_CORRUPTED:
        toastr.error('Error', ERROR_ZIP_CORRUPTED_MESSAGE);
        break;
      case ERROR_JSON_CORRUPTED:
        toastr.error('Error', ERROR_JSON_CORRUPTED_MESSAGE);
        break;
      case ERROR_SPACE_ALREADY_AVAILABLE:
        toastr.error('Error', ERROR_SPACE_ALREADY_AVAILABLE_MESSAGE);
        break;
      default:
        toastr.success('Success', SUCCESS_SPACE_LOADED_MESSAGE);
        dispatch({
          type: GET_SPACES,
          payload: newSpaces,
        });
    }
    dispatch(flagLoadingSpace(false));
  });
};

const getSpace = ({ id }) => dispatch => {
  if (window.navigator.onLine) {
    dispatch(getRemoteSpace({ id }));
  } else {
    dispatch(getLocalSpace({ id }));
  }
};

export {
  loadSpace,
  clearSpace,
  deleteSpace,
  exportSpace,
  getRemoteSpace,
  getLocalSpace,
  getSpaces,
  getSpace,
  saveSpace,
};
