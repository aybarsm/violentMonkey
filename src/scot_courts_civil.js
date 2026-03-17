/// <reference types="@violentmonkey/types" />
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
// @require      https://github.com/PRO-2684/GM_config/releases/download/v1.2.2/config.min.js#md5=c45f9b0d19ba69bb2d44918746c4d7ae
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