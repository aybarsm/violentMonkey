// ==UserScript==
// @name         Scot Civil Case File Sync
// @namespace    https://github.com/aybarsm
// @version      0.4
// @description  Scot Civil Case File Sync
// @author       aybarsm
// @match        https://civilonline.scotcourts.gov.uk/my-cases
// @match        https://civilonline.scotcourts.gov.uk/case-tracker*
// @require      https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/js/bootstrap.bundle.min.js
// @resource     BOOTSTRAP_CSS https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/css/bootstrap.min.css
// @grant        GM_log
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM.xmlHttpRequest
// @grant        GM_addStyle
// @grant        GM_getResourceText
// @grant        GM_notification
// ==/UserScript==

function isValidJson(data) {
    if (typeof data !== 'string') return false;

    try {
        JSON.parse(data);
        return true;
    } catch {
        return false;
    }
}

function isPlainObject(data) {
    return data != null && typeof data === 'object' && data.constructor === Object && !Array.isArray(data);
}

function deepMergeImmutable(source, target) {
    const output = structuredClone(target);

    for (const key in source) {
        if (!Object.prototype.hasOwnProperty.call(source, key)) continue;

        const sourceValue = source[key];

        if (isPlainObject(sourceValue) && isPlainObject(output[key])) {
            output[key] = deepMergeImmutable(output[key], sourceValue);
        } else {
            output[key] = sourceValue;
        }
    }

    return output;
}

const vmSettingsDefault = {
    cases: {},
};

(function() {
    'use strict';

    GM_config.init({
        id: "ScotCourts_Civil",
        title: "Scot Courts - Civil",
        fields: {
            amazon: {
                type: "checkbox",
                label: "Amazon",
                title: "Uncheck if you don't use Amazon Prime Video",
                section: "Main Settings",
                default: true,
            },
        }
    });
    
    // let vmCache = {
    //     'page': location.pathname.startsWith('/rooms/'),
    // }
    // let vmSettings = deepMergeImmutable(vmSettingsDefault, GM_getValue('scot_courts_civil', {}));
    
})();