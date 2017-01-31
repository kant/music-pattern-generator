/**
 * Processor setting view for a linear integer type parameter,
 * which has a slider and a number field.
 * @namespace WH
 */

window.WH = window.WH || {};

(function (ns) {
    
    function createIntegerSettingView(specs, my) {
        var that,
            rangeEl,
            numberEl,
            
            init = function() {
                rangeEl = my.el.getElementsByClassName('settings__range')[0];
                rangeEl.setAttribute('min', my.param.getProperty('min'));
                rangeEl.setAttribute('max', my.param.getProperty('max'));
                rangeEl.value = my.param.getValue();
                rangeEl.addEventListener('input', onChange);
                rangeEl.addEventListener('change', onChange);
                
                numberEl = my.el.getElementsByClassName('settings__number')[0];
                numberEl.setAttribute('min', my.param.getProperty('min'));
                numberEl.setAttribute('max', my.param.getProperty('max'));
                numberEl.value = my.param.getValue();
                numberEl.addEventListener('change', onChange);
                
                my.param.addChangedCallback(changedCallback);
            },
            
            onChange = function(e) {
                my.param.setValue(e.target.value);
            },
            
            changedCallback = function(parameter, oldValue, newValue) {
                rangeEl.value = newValue;
                numberEl.value = newValue;
            };
        
        my = my || {};
        
        that = ns.createBaseSettingView(specs, my);
        
        init();
        
        return that;
    };

    ns.createIntegerSettingView = createIntegerSettingView;

})(WH);