/// <reference types="@violentmonkey/types" />
/// <reference path="../lib/GM_config/types/index.d.ts" />
// ==UserScript==
// @name         Scot Courts - Civil Case File Sync
// @namespace    https://github.com/aybarsm
// @version      0.1
// @description  Scot Courts - Civil Case File Sync
// @author       aybarsm
// @match        https://civilonline.scotcourts.gov.uk/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @grant        GM_registerMenuCommand
// @grant        GM_unregisterMenuCommand
// @grant        GM_addValueChangeListener
// @grant        GM_log
// @grant        GM.xmlHttpRequest
// @grant        GM_addStyle
// @grant        GM_getResourceText
// @grant        GM_notification
// @require      https://greasyfork.org/scripts/420683-gm-config-sizzle/code/GM_config_sizzle.js?version=894369
// ==/UserScript==

const configSpec = {
    price: {
        name: "Price",
        type: "int",
        value: 100
    },
    name: {
        name: "Name",
        type: "str",
        value: "John Doe"
    },
};

const config = new GM_config(configSpec);

config.addEventListener("set", (e) => {
    const { prop, before, after } = e.detail;
    console.log(`Config ${prop} is modified from ${before} to ${after}`);
});

(function() {
    'use strict';
    
    // let vmCache = {
    //     'page': location.pathname.startsWith('/rooms/'),
    // }
    // let vmSettings = deepMergeImmutable(vmSettingsDefault, GM_getValue('scot_courts_civil', {}));
    
})();