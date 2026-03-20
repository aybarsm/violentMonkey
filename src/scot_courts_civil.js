/// <reference types="@violentmonkey/types" />
/// <reference path="../lib/GM_config/types/index.d.ts" />
// ==UserScript==
// @name         Scot Courts - Civil
// @namespace    https://github.com/aybarsm
// @version      0.1
// @description  Scot Courts - Civil
// @author       aybarsm
// @match        https://civilonline.scotcourts.gov.uk/*
// @match        file:///Users/aybarsm/PersonalSync/Coding/js/Violentmonkey/dev/scot_courts_civil.html
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @grant        GM_registerMenuCommand
// @grant        GM_unregisterMenuCommand
// @grant        GM_addValueChangeListener
// @grant        GM_log
// @grant        GM.xmlHttpRequest
// @grant        GM_xmlHttpRequest
// @grant        GM_addStyle
// @grant        GM_getResourceText
// @grant        GM_download
// @require      https://greasyfork.org/scripts/420683-gm-config-sizzle/code/GM_config_sizzle.js?version=894369
// @require      https://cdn.jsdelivr.net/npm/not-a-toast@1.1.5/dist/not-a-toast.umd.js
// @resource     CSS_TOAST https://cdn.jsdelivr.net/npm/not-a-toast@1.1.5/dist/style.css
// @require      https://gist.githubusercontent.com/aybarsm/19817dd8ed2b5b397c4bee696bb9ba1c/raw/ba89e4d7460f4de9320d0a484caeef6d4020cd05/webdav-client.5.9.0.min.js
// ==/UserScript==

GM_addStyle(GM_getResourceText("CSS_TOAST"));

const defaults__ = {
    'meta': {
        'settings': {
            'registered': false,
        },
        'urlSearchParams': null,
    },
    'notifications': {
        // 'title': 'Scot Courts - Civil',
        // 'silent': false,
        'theme': 'carbon',
        'position': 'top-right',
    },
    'config': {
        'id': 'ScriptSettings',
        'title': 'Scot Courts - Civil: Settings',
        'fields': {
            'webdavUrl': {
                'label': 'WebDAV URL',
                'type': 'text',
                'default': '',
                'section': 'WebDAV Synchronisation Settings',
            },
            'webdavAuth': {
                'label': 'WebDAV Authentication',
                'type': 'select',
                'options': ['None', 'Basic', 'Token'],
                'default': 'None',
            },
            'webdavUser': {
                'label': 'WebDAV Username',
                'type': 'text',
                'default': '',
            },
            'webdavPass': {
                'label': 'WebDAV Password',
                'type': 'text',
                'default': '',
            },
            'devMode': {
                'label': 'Dev Mode',
                'type': 'checkbox',
                'options': ['Disabled', 'Enabled'],
                'default': 'Disabled',
            },
            'devReference': {
                'label': 'Case Reference',
                'type': 'text',
                'default': 'DevReference',
            },
            'devDocs': {
                'label': 'Docs File Url',
                'type': 'text',
                'default': 'http://127.0.0.1:8901/dev/scot_courts_civil-docs.json',
            },
        },
        'events': {
            'open': function(doc) {
                if (doc.getElementById('ScriptSettings_saveAndCloseBtn')) {
                    return; 
                }
                
                const saveBtn = doc.getElementById('ScriptSettings_saveBtn');
                const saveAndCloseBtn = saveBtn.cloneNode(true);
                
                saveAndCloseBtn.id = 'ScriptSettings_saveAndCloseBtn';
                saveAndCloseBtn.textContent = 'Save & Close';

                saveAndCloseBtn.addEventListener('click', () => {
                    GM_config.save();
                    GM_config.close();
                });

                saveBtn.parentNode.insertBefore(saveAndCloseBtn, saveBtn.nextSibling);
            },
            'save': function () {
                Utils.notify({'message': 'Settings saved.'});
            },
            'reset': function () {
                Utils.notify({'message': 'Settings restored to defaults.'});
            },
        },
        'css': `
            #ScriptSettings input[type="text"] {
                width: 100%;
            }
            #ScriptSettings select {
                width: 100%;
            }
            #ScriptSettings .config_var {
                margin-top: 5px !important;
                text-align: center !important;
            }
            #ScriptSettings .field_label {
                margin-bottom: 2px !important;
                text-align: center !important;
                font-size: 16px !important;
            }
        `
    }
}

class Utils {
    static isPlainObject(value) {
        return value != null && typeof value === 'object' && value.constructor === Object && !Array.isArray(value);
    }

    static deepMergeImmutable(source, target) {
        const output = structuredClone(target);

        for (const key in source) {
            if (!Object.prototype.hasOwnProperty.call(source, key)) continue;

            const sourceValue = source[key];

            if (this.isPlainObject(sourceValue) && this.isPlainObject(output[key])) {
                output[key] = this.deepMergeImmutable(output[key], sourceValue);
            } else {
                output[key] = sourceValue;
            }
        }

        return output;
    }

    static isValidJson(str) {
        if (typeof str !== 'string') return false;

        try {
            JSON.parse(str);
            return true;
        } catch {
            return false;
        }
    }

    static pathJoin(...segments) {
        if (segments.length == 0) return null;

        let meta = {
            'initial': null,
            'parts': [],
        }

        for (const [idx, val] of segments.entries()) {
            let segment = structuredClone(val).trim().replace(/^\/+|\/+$/g, '').trim();

            if (idx == 0 && segment.startsWith('http:')){
                meta.initial = 'http://';
            } else if (idx == 0 && segment.startsWith('https:')){
                meta.initial = 'https://';
            }

            if (idx == 0 && meta.initial){
                segment = this.strChopStart(segment, ...['http:', 'https:']).trim().replace(/^\/+|\/+$/g, '').trim();
            }

            if (segment == '') continue;

            segment.split('/').forEach((seg_) => {
                seg_ = seg_.trim().replace(/^\/+|\/+$/g, '').trim();
                
                if (seg_ != ''){
                    meta.parts.push(seg_);
                }
            });
        }

        if (meta.initial) meta.parts.unshift(meta.initial);

        return meta.parts.join('/');
    }

    static #strCasePrep(value) {
        return value
            .replace(/[^a-zA-Z0-9]+/g, ' ')
            .replace(/[-_\s]+/g, ' ')
            .trim();
    }

    static strStudly(value) {
        if (!value) return '';

        return this.#strCasePrep(value)
            .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
            .trim()
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join('');
    }

    static strSnake(value) {
        if (!value) return '';

        return this.#strCasePrep(value)
            .split(' ')
            .map((word, idx) => (idx === 0 ? word.toLowerCase() : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()))
            .join('');
    }

    static strChopStart(value, ...needle) {
        if (!value) return '';
        if (needle.length == 0) return value;

        for (const _ of needle) {
            value = value.startsWith(_) ? value.slice(_.length) : value;
        }

        return value;
    }

    static resolveDocumentFileDate(dateStr) {
        const datePart = dateStr.split('T')[0];
        const [year, month, day] = datePart.split('-');
        return `${year}${day}${month}`;
    }

    static resolveDocumentFileName(doc) {
        let parts = [
            this.resolveDocumentFileDate(doc['documentDate']),
            this.strStudly(doc['type']),
        ]

        for (const part_ of ['partyRoleName', 'documentReference']){
            if (!doc[part_]) continue;
            parts.push(doc[part_]);
        }
        
        let url = null
        try {
            url = new URL(doc['fileUrl']);
        }catch (error) {
            this.notify({'message': `Resolve Document File Extension Failed: ${doc['fileUrl']}`});
            this.log(`[${doc['fileUrl']}]`, error);
            return null; 
        }
        
        const fileUrlName = url.pathname.split('/').pop();
        const fileExtIndex = fileUrlName.lastIndexOf('.');
        
        if (fileExtIndex <= 0) {
            this.notify({'message': `Resolve Document File Extension Failed: ${doc['fileUrl']}`});
            this.log(`[${doc['fileUrl']}]`, doc);
            return null; 
        }
        
        const fileName = parts.join('_');
        const fileExt = fileUrlName.substring(fileExtIndex + 1);
        
        return `${fileName}.${fileExt}`;
    }

    static notify(options = {}) {
        if (!Object.hasOwn(options, 'message') || options.message.trim() == '') return;

        let defaults = defaults__['notifications'];
        toast(this.deepMergeImmutable(defaults, options))
    }

    static log(...args) {
        if (args.length == 0) return;
        GM_log(...args)
    }

    static #httpFailed(options, context) {
        this.notify({'message': `${options.method} Request Failed: ${options.url}`, 'silent': false});
        this.log(`[${options.method} : ${options.url}]`, context);
    }

    static #httpPrepare(options, resolver) {
        if (Object.hasOwn(options, 'onload')){
            options.onload = (response) => {
                if (response.status >= 200 && response.status < 300) {
                    resolver(response);
                } else {
                    this.#httpFailed(options, response);
                    resolver(null);
                }
            };
        }
        
        if (Object.hasOwn(options, 'onerror')){
            options.onerror = (error) => {
                this.#httpFailed(options, error);
                resolver(null);
            };
        }
        
        if (Object.hasOwn(options, 'ontimeout')){
            options.ontimeout = () => {
                this.#httpFailed(options, new Error('Request timed out'));
                resolver(null);
            }
        }
        
        if (Object.hasOwn(options, 'onabort')){
            options.onabort = () => {
                this.#httpFailed(options, new Error('Request timed out'));
                resolver(null);
            }
        }

        return options;
    }

    static httpRequest(options = {}) {
        options.method = options.method.toUpperCase();
        return new Promise((resolve) => {
            GM.xmlHttpRequest(this.#httpPrepare(options, resolve));
        });
    }

    static httpGet(options = {}) {
        options.method = 'GET';
        return this.httpRequest(options);
    }

    static httpPost(options = {}) {
        options.method = 'POST';
        return this.httpRequest(options);
    }

    static httpPut(options = {}) {
        options.method = 'PUT';
        return this.httpRequest(options);
    }

    static httpPatch(options = {}) {
        options.method = 'PATCH';
        return this.httpRequest(options);
    }

    static httpDelete(options = {}) {
        options.method = 'DELETE';
        return this.httpRequest(options);
    }
}

class ScriptController {
    #meta = {}

    constructor() {
        this.#meta = defaults__['meta'];
        this.GMConfigInit();
        this.#meta.urlSearchParams = new URLSearchParams(window.location.search);
    }

    is(of, what = None) {
        of = Utils.strSnake(of);
        
        if (of == 'casePage') {
            return location.pathname.startsWith('/case-tracker');
        }
        
        if (what){
            return GM_config.get(of) === what;
        }else {
            field = GM_config.fields[of]
            isFieldBoolSelect = field['type'] === 'select' && field['options'].indexOf('Enabled') > -1 && field['options'].indexOf('Disabled') > -1
            if (isFieldBoolSelect){
                return GM_config.get(of) === 'Enabled';
            } else {
                Utils.notify(`Value if required to compare [${of}] field.`)
            }
        }
    }

    getUrlSearchParams() {
        return this.#meta.urlSearchParams
    }

    getCase(of = '') {
        of = of.trim().toLowerCase();

        if (of.length == 0) {
            return this.#meta.case
        } else if (['reference', 'ref'].indexOf(of) > -1){
            const caseRef = (!this.is('devMode') ? this.getUrlSearchParams().get('reference') : GM_config.get('devReference')).trim();
            return caseRef == '' ? 'unknownCaseReference' : caseRef;
        } else if (of == 'docs'){
            if (this.is('devMode')){
                return Utils.httpGet({
                    url: GM_config.get('devDocs'), 
                    anonymous: true,
                })
                .then((response) => {
                    if (!response) return [];
                    return JSON.parse(response.responseText).documents ?? [];
                });
            }

            return [];
        }else if (of == 'webdavurl'){
            return Utils.pathJoin(GM_config.get('webdavUrl'), 'ScotCortsCivil', this.getCase('ref'));
        }

        return this.#meta.case[of]
    }

    GMConfigInit(extras = {}) {
        if (!this.#meta.settings.registered) {
            GM_config.init(defaults__['config']);

            GM_registerMenuCommand(
                'Settings',
                function(event) {
                    if (!GM_config.isOpen) GM_config.open();
                },
                {
                    'id': 'menuSettings',
                    'title': 'Title - Settings',
                }
            );

            this.#meta.settings.registered = true;
        }else {
            const wasOpen = GM_config.isOpen;
            if (wasOpen) GM_config.close();
            GM_config.init(extras);
            if (wasOpen) GM_config.open();
        }
    }

    webdav(options = {}) {
        let base = {
            'headers': {},
        }

        if (!this.is('webdavAnon')){
            const webdavAuth = btoa(`${GM_config.get('webdavUser')}:${GM_config.get('webdavPass')}`);
            base.headers['Authorization'] = `Basic ${webdavAuth}`;
        }

        base = Utils.deepMergeImmutable(options, base);
        return Utils.httpRequest(base, base);
    }
}

const vm = new ScriptController();

async function httpReqq(options = {}) {
    return await GM.xmlHttpRequest(options);
}

(function() {
    'use strict';
    
    
})();