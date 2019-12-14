import { memoize } from './selectors.js';
import { setConfig } from '../core/config.js';

export default function createStore(specs = {}, my = {}) {
    const STATE_CHANGE = 'STATE_CHANGE';

    let that = {},
        actions = specs.actions,
        reducers = specs.reducers,
        currentState,

        init = () => {
            currentState = reducers.reduce();
        },
        
        dispatch = (action) => {
            // thunk or not
            if (typeof action === 'function') {
                const resultActionObject = action(dispatch, getState, getActions);
                if (resultActionObject) {
                    dispatch(resultActionObject);
                }
            } else {
                currentState = reducers.reduce(currentState, action, actions);
                memoize(currentState, action, actions);
                document.dispatchEvent(new CustomEvent(STATE_CHANGE, { detail: {
                    state: currentState,
                    action: action,
                    actions: actions
                }}));
            }
        }, 
        
        getActions = () => {
            return actions;
        },
        
        getState = () => {
            return currentState;
        },
        
        persist = () => {
            const name = 'persist';
            window.addEventListener('beforeunload', e => {
                localStorage.setItem(name, JSON.stringify(currentState));
            });
            let data = localStorage.getItem(name);
            if (data) {
                dispatch(getActions().setProject(JSON.parse(data)));
            } else {
                dispatch(getActions().createProject());
            }
        };
        
    that = specs.that || {};

    init();
    
    that.STATE_CHANGE = STATE_CHANGE;
    that.dispatch = dispatch;
    that.getActions = getActions;
    that.getState = getState;
    that.persist = persist;
    return that;
}
