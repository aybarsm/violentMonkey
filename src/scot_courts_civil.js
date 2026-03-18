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
// @grant        GM_addStyle
// @grant        GM_getResourceText
// @grant        GM_notification
// @grant        GM_download
// @require      https://greasyfork.org/scripts/420683-gm-config-sizzle/code/GM_config_sizzle.js?version=894369
// ==/UserScript==

const defaults__ = {
    'meta': {
        'settings': {
            'registered': false,
        },
        'case': {
            'reference': null,
        },
        'urlSearchParams': null,
    },
    'notifications': {
        'title': 'Scot Courts - Civil',
        'silent': false,
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
            'isWebdavAnon': {
                'label': 'Anonymous Account',
                'type': 'checkbox',
                'default': false,
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
            'isDevMode': {
                'label': 'Dev Mode',
                'type': 'checkbox',
                'default': false,
                'section': 'Development Settings',
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
                Utils.notify({'text': 'Settings saved.'});
            },
            'reset': function () {
                Utils.notify({'text': 'Settings restored to defaults.'});
            },
        },
        'css': `
            #ScriptSettings input[type="text"] {
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

    static #strEach(str, callback) {
        for (let idx = 0; idx < text.length; idx++) {
            callback(str[idx], idx)
        }
    }

    static isStrUppercase(value) {
        return /^[A-Z].*$/.test(value)
    }

    static #strCasePrep(value) {
        return value
            .replace(/[^a-zA-Z0-9]+/g, ' ')
            .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
            .replace(/[-_\s]+/g, ' ')
            .trim();
    }

    static strStudly(value) {
        if (!value) return '';

        return this.#strCasePrep(value)
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
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
            this.notify({'text': `Resolve Document File Extension Failed: ${doc['fileUrl']}`});
            this.log(`[${doc['fileUrl']}]`, error);
            return null; 
        }
        
        const fileUrlName = url.pathname.split('/').pop();
        const fileExtIndex = fileUrlName.lastIndexOf('.');
        
        if (fileExtIndex <= 0) {
            this.notify({'text': `Resolve Document File Extension Failed: ${doc['fileUrl']}`});
            this.log(`[${doc['fileUrl']}]`, doc);
            return null; 
        }
        
        const fileName = parts.join('_');
        const fileExt = fileUrlName.substring(fileExtIndex + 1);
        
        return `${fileName}.${fileExt}`;
    }

    static notify(options = {}) {
        if (!Object.hasOwn(options, 'text') || options.text.trim() == '') return;

        let defaults = defaults__['notifications'];
        GM_notification(this.deepMergeImmutable(defaults, options))
    }

    static log(...args) {
        if (args.length == 0) return;
        GM_log(...args)
    }

    static #httpFailed(options, context) {
        this.notify({'text': `${options.method} Request Failed: ${options.url}`, 'silent': false});
        this.log(`[${options.method} : ${options.url}]`, context);
    }

    static #httpPrepare(options, resolver) {
        options.onload = (response) => {
            if (response.status >= 200 && response.status < 300) {
                resolver(response);
            } else {
                this.#httpFailed(options, response);
                resolver(null);
            }
        };
        
        options.onerror = (error) => {
            this.#httpFailed(options, error);
            resolver(null);
        };

        options.ontimeout = () => {
            this.#httpFailed(options, new Error('Request timed out'));
            resolver(null);
        }

        options.onabort = () => {
            this.#httpFailed(options, new Error('Request timed out'));
            resolver(null);
        }

        return options;
    }

    static #httpRequest(options, method) {
        return new Promise((resolve) => {
            options.method = method.toUpperCase();
            GM.xmlHttpRequest(this.#httpPrepare(options, resolve));
        });
    }

    static httpGet(options) {
        return this.#httpRequest(options, 'GET');
    }

    static httpPost(options) {
        return this.#httpRequest(options, 'POST');
    }

    static httpPut(options) {
        return this.#httpRequest(options, 'PUT');
    }

    static httpPatch(options) {
        return this.#httpRequest(options, 'PATCH');
    }

    static httpDelete(options) {
        return this.#httpRequest(options, 'DELETE');
    }
}

class ScriptController {
    #meta = {}

    constructor() {
        this.#meta = defaults__['meta'];
        this.GMConfigInit();
        this.#meta.urlSearchParams = new URLSearchParams(window.location.search);
        this.#meta.case.reference = this.getUrlSearchParams().get('reference');
    }

    is(of) {
        of = Utils.strStudly(Utils.strChopStart(of.trim(), 'is'));
        
        if (of == 'CasePage') {
            return location.pathname.startsWith('/case-tracker');
        } else if (['DevMode', 'WebdavAnon'].indexOf(of) > -1) {
            return GM_config.get(`is${of}`);
        }

        // if (of == 'devMode') {
        //     return GM_config.get('isDevMode');
        // } else if (of == 'webdavAnon') {
        //     return GM_config.get('isWebdavAnon');
        // } else 
    }

    getUrlSearchParams() {
        return this.#meta.urlSearchParams
    }

    getCase(of = '') {
        if (of.length == 0) {
            return this.#meta.case
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
}

const vm = new ScriptController();

(function() {
    'use strict';
    
    if (!vm.is('devMode') && !vm.is('casePage')){
        return;
    }

    vm.getCase('docs').then((docs_) => {
        let resolved = []
        for (const doc of docs_){
            resolved.push(Utils.resolveDocumentFileName(doc));
        }
        Utils.log('Resolved Docs: ', resolved)
    });

})();