import { dispatch, getActions, STATE_CHANGE, } from '../state/store.js';
import createSettingsPanel from './settings.js';
import addWindowResizeCallback from '../view/windowresize.js';
import { getProcessorData } from '../core/processor-loader.js';

const settingsViews = [];
const panelsEl = document.querySelector('.panels');
const libraryEl = document.querySelector('.library');
const helpEl = document.querySelector('.help');
const prefsEl = document.querySelector('.prefs');
const editEl = document.querySelector('.edit');
const editContentEl = document.querySelector('.edit .panel__content');
const remoteEl = document.querySelector('.remote');
let panelHeaderHeight;

export function setup() {
  addEventListeners();
          
  // get panel header height from CSS.
  const style = getComputedStyle(document.body);
  panelHeaderHeight = parseInt(style.getPropertyValue('--header-height'), 10);
  
  addWindowResizeCallback(renderLayout);
  renderLayout();
}

function addEventListeners() {
  document.addEventListener(STATE_CHANGE, handleStateChanges);
}

/**
 * Create settings controls view for a processor.
 * @param  {Object} processor MIDI processor to control with the settings.
 */
function createSettingsViews(state) {
  const { processors, selectedID, } = state;
  processors.allIds.forEach((id, i) => {
    const processorData = processors.byId[id];
    let exists = settingsViews.some(view => view.getID() === id);
    if (!exists) {
      const settingsHTML = getProcessorData(processorData.type, 'settings');
      settingsViews.splice(i, 0, createSettingsPanel({
        data: processorData,
        store,
        parentEl: editContentEl,
        template: settingsHTML,
        isSelected: selectedID === processorData.id
      }));
    }
  });
}
        
/**
 * Delete settings controls view for a processor.
 * @param  {String} id MIDI processor ID.
 */
function deleteSettingsView(id) {
  settingsViews = settingsViews.reduce((accumulator, view) => {
    if (view.getID() === id) {
      view.terminate();
      return accumulator;
    }
    return [...accumulator, view];
  }, []);
}

/**
 * Handle state changes.
 * @param {Object} e 
 */
function handleStateChanges(e) {
  const { state, action, actions, } = e.detail;
  switch (action.type) {
              
    case actions.ADD_PROCESSOR:
      createSettingsViews(state);
      renderLayout();
      break;
              
    case actions.CREATE_PROJECT:
      setProject(state);
      showPanels(state);
      break;

    case actions.DELETE_PROCESSOR:
      deleteSettingsView(action.id);
      showPanels(state);
      selectSettingsView(state.selectedID);
      renderLayout();
      break;

    case actions.SELECT_PROCESSOR:
      selectSettingsView(action.id);

      // fallthrough intentional
    case actions.TOGGLE_MIDI_LEARN_MODE:
    case actions.TOGGLE_PANEL:
      showPanels(state);
      break;
  }
}

/**
 * Render the panels layout.
 * @param  {Boolean} leftColumn Render the left panel column.
 * @param  {Boolean} rightColumn Render the right panel column.
 */
function renderLayout(leftColumn = true, rightColumn = true) {
  if (leftColumn) {
    renderColumnLayout(prefsEl, remoteEl, false);
  }
  if (rightColumn) {
    renderColumnLayout(helpEl, editEl, true);
  }
}

/**
 * Render a column of the panels layout.
 * @param  {Object} topEl Bottom panel in the column.
 * @param  {Object} topEl Top panel in the column.
 * @param  {Boolean} isRightColumn True if the right column is being rendered.
 */  
function renderColumnLayout(topEl, btmEl, isRightColumn) {
  const totalHeight = panelsEl.clientHeight,
    columnWidth = document.querySelector('.panels__right').clientWidth,
    topWidth = topEl.clientWidth,
    btmWidth = btmEl.clientWidth,
    isTopVisible = topEl.dataset.show == 'true',
    isBtmVisible = btmEl.dataset.show == 'true',
    topViewportEl = topEl.querySelector('.panel__viewport'),
    btmViewportEl = btmEl.querySelector('.panel__viewport');
  
  let topHeight, btmHeight, topContentHeight, btmContentHeight;
  
  // reset heights before measuring them
  topViewportEl.style.height = 'auto';
  btmViewportEl.style.height = 'auto';
  
  topHeight = topEl.clientHeight,
  btmHeight = btmEl.clientHeight,
  topContentHeight = topEl.querySelector('.panel__content').clientHeight,
  btmContentHeight = btmEl.querySelector('.panel__content').clientHeight;
  
  if (isRightColumn && (topWidth + btmWidth < columnWidth)) {
    if (topContentHeight + panelHeaderHeight > totalHeight) {
      topViewportEl.style.height = totalHeight - panelHeaderHeight + 'px';
    } else {
      topViewportEl.style.height = 'auto';
    }
    if (btmContentHeight + panelHeaderHeight > totalHeight) {
      btmViewportEl.style.height = totalHeight - panelHeaderHeight + 'px';
    } else {
      btmViewportEl.style.height = 'auto';
    }
  } else {
    if (isTopVisible && isBtmVisible) {
      let combinedHeight = topContentHeight + btmContentHeight + (panelHeaderHeight * 2);
      if (combinedHeight > totalHeight) {
        if (topContentHeight + panelHeaderHeight < totalHeight / 2) {
          topViewportEl.style.height = prefsEl.topContentHeight + 'px';
          btmViewportEl.style.height = (totalHeight - topContentHeight - (panelHeaderHeight * 2)) + 'px';
        } else if (btmContentHeight + panelHeaderHeight < totalHeight / 2) {
          topViewportEl.style.height = (totalHeight - btmContentHeight - (panelHeaderHeight * 2)) + 'px';
          btmViewportEl.style.height = remoteEl.topContentHeight + 'px';
        } else {
          topViewportEl.style.height = ((totalHeight / 2) - panelHeaderHeight) + 'px';
          btmViewportEl.style.height = ((totalHeight / 2) - panelHeaderHeight) + 'px';
        }
      } else {
        topViewportEl.style.height = 'auto';
        btmViewportEl.style.height = 'auto';
      }
    } else if (isTopVisible) {
      if (topContentHeight + panelHeaderHeight > totalHeight) {
        topViewportEl.style.height = totalHeight - panelHeaderHeight + 'px';
      } else {
        topViewportEl.style.height = 'auto';
      }
    } else if (isBtmVisible) {
      if (btmContentHeight + panelHeaderHeight > totalHeight) {
        btmViewportEl.style.height = totalHeight - panelHeaderHeight + 'px';
      } else {
        btmViewportEl.style.height = 'auto';
      }
    }
  }
}

/**
 * Show the settings controls view for a processor.
 * @param  {String} id MIDI processor ID.
 */
function selectSettingsView(id) {
  settingsViews.forEach(view => view.select(id));
}

/**
 * Set up a new project, create th esetting views.
 * @param  {Object} state App state object.
 */
function setProject(state) {
  let i = settingsViews.length;
  while (--i >= 0) {
    deleteSettingsView(settingsViews[i].getID());
  }
  createSettingsViews(state);
}

/**
 * Set panels visibility.
 * @param  {Object} state App state.
 */ 
function showPanels(state) {
  helpEl.dataset.show = state.showHelpPanel;
  prefsEl.dataset.show = state.showPreferencesPanel;
  remoteEl.dataset.show = state.learnModeActive;
  editEl.dataset.show = state.showSettingsPanel;
  libraryEl.dataset.show = state.showLibraryPanel;
  renderLayout();
}
