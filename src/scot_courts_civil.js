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
        'is_': {
            'devMode': false,
            'casePage': false,
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
            'saveTo': {
                'label': 'Save Folder',
                'type': 'text',
                'default': '~/Downloads/ScotCourtsCivil',
                'section': 'Common Settings',
            },
            'dbIdent': {
                'label': 'Database Identifier',
                'type': 'text',
                'default': GM.info.uuid,
                'section': 'Database Settings',
            },
            'isDevMode': {
                'label': 'Dev Mode',
                'type': 'checkbox',
                'default': false,
                'size': '100%',
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
            'save': function () {
                ScriptController.notify({'text': 'Settings saved.'});
            },
            'reset': function () {
                ScriptController.notify({'text': 'Settings restored to defaults.'});
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

function isPlainObject(value) {
    return value != null && typeof value === 'object' && value.constructor === Object && !Array.isArray(value);
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

function isValidJson(str) {
    if (typeof str !== 'string') return false;

    try {
        JSON.parse(str);
        return true;
    } catch {
        return false;
    }
}

function strStudly(str) {
  if (!str) return '';

  return str
    .replace(/[-_\s]+/g, ' ')
    .trim()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
}

function strFileExtension(url) {
    try {
        const url = new URL(url);
        const path = url.pathname;
        const fileName = path.split('/').pop();
        const lastDotIndex = fileName.lastIndexOf('.');
        if (lastDotIndex <= 0) {
            return ''; 
        }
        return fileName.substring(lastDotIndex + 1).toLowerCase();
        
    } catch (error) {
        console.error("Invalid URL provided:", error);
        return '';
    }
}

class ScriptController {
    #meta = {}

    constructor() {
        this.#meta = defaults__['meta'];
        this.GMConfigInit();
        this.#meta.is_.devMode = GM_config.get('isDevMode');
        this.#meta.is_.casePage = location.pathname.startsWith('/case-tracker');
        this.#meta.urlSearchParams = new URLSearchParams(window.location.search);
        this.#meta.case.reference = this.getUrlSearchParams().get('reference');
    }

    is(of) {
        return this.#meta.is_[of]
    }

    getUrlSearchParams() {
        return this.#meta.urlSearchParams
    }

    getCase(of = '') {
        if (of.length == 0) {
            return this.#meta.case
        } else if (of == 'docs'){
            if (this.is('devMode')){
                return ScriptController.httpGet({
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

    static resolveDocumentFileDate(dateStr) {
        const datePart = dateStr.split('T')[0];
        const [year, month, day] = datePart.split('-');
        return `${year}${day}${month}`;
    }
    
    static resolveDocumentFileName(doc) {
        let parts = [
            ScriptController.resolveDocumentFileDate(doc['documentDate']),
            strStudly(doc['type']),
        ]

        for (const part_ of ['partyRoleName', 'documentReference']){
            if (!doc[part_]) continue;
            parts.push(doc[part_]);
        }
        
        let url = null
        try {
            url = new URL(doc['fileUrl']);
        }catch (error) {
            GM_notification({
                text: `Resolve Document File Extension Failed: ${doc['fileUrl']}`,
                title: 'Scot Courts - Civil',
                silent: false,
            });
            GM_log(`[${doc['fileUrl']}]`, error);
            return null; 
        }
        
        const fileUrlName = url.pathname.split('/').pop();
        const fileExtIndex = fileUrlName.lastIndexOf('.');
        
        if (fileExtIndex <= 0) {
            GM_notification({
                text: `Resolve Document File Extension Failed: ${doc['fileUrl']}`,
                title: 'Scot Courts - Civil',
                silent: false,
            });
            GM_log(`[${doc['fileUrl']}]`, doc);
            return null; 
        }
        
        const fileName = parts.join('_');
        const fileExt = fileUrlName.substring(fileExtIndex + 1);
        
        return `${fileName}.${fileExt}`;
    }

    static notify(options = {}) {
        let defaults = defaults__['notifications'];
        GM_notification(deepMergeImmutable(defaults, options))
    }

    static httpFailed(options, context) {
        ScriptController.notify({'text': `${options.method} Request Failed: ${options.url}`, 'silent': false});
        GM_log(`[${options.method} : ${options.url}]`, context);
    }

    static httpGet(options) {
        return new Promise((resolve) => {
            options.method = 'GET';
            options.onload = (response) => {
                if (response.status >= 200 && response.status < 300) {
                    resolve(response);
                } else {
                    ScriptController.httpFailed(options, response);
                    resolve(null);
                }
            };
            
            options.onerror = (error) => {
                ScriptController.httpFailed(options, error);
                resolve(null);
            };

            options.ontimeout = () => {
                ScriptController.httpFailed(options, new Error('Request timed out'));
                resolve(null);
            }

            options.onabort = () => {
                ScriptController.httpFailed(options, new Error('Request timed out'));
                resolve(null);
            }

            GM.xmlHttpRequest(options);
        });
    }
}

const vm = new ScriptController();

(function() {
    'use strict';

    if (!vm.is('devMode') && !vm.is('casePage')){
        return;
    }

    // GM_log('UUID: ', GM.info.uuid);
    
    // if (isDevMode){
        
    //     let resolved = []

    // vm.getCase('docs').then((docs_) => {
    //     let resolved = []
    //     for (const doc of docs_){
    //         resolved.push(ScriptController.resolveDocumentFileName(doc));
    //     }
    //     GM_log('Resolved DOCS: ', resolved);
    // });
    
        // const docs = await RequestController.get({url: GM_config.get('devDocs'), anonymous: true})
        // .then((response) => {
        //     if (!response) return [];
        //     // GM_log('DEV DOCS: ', JSON.parse(response.responseText));
        //     return JSON.parse(response.responseText).documents ?? [];
        // });

        

    //     // GM_log('Resolved DOCS: ', resolved);
        
    //     // GM_log('DEV DOCS: ', docs);
    // }
})();