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
// @resource     CSS_PICO https://cdn.jsdelivr.net/npm/@picocss/pico@2/css/pico.min.css
// ==/UserScript==

const htmlContent = `
<dialog id="caseFilesContainer">
    <article>
        <header>
            <button aria-label="Close" rel="prev" class="close-modal"></button>
            <h3>Case Files</h3>
        </header>
        <div class="text-center"><h3>Loading Case Files</h3><span aria-busy="true"></span></div>
        <footer>
        </footer>
    </article>
</dialog>
`;

const htmlCss = `
    :root {
        --pico-font-size: 100%;
    }
    
    dialog article {
        max-width: 75% !important;
        max-height: 75% !important;
    }

    .text-center {;
        text-align: center !important;
    }
    
    .fs-xsm {
        --pico-font-size: 0.2rem;
        font-size: var(--pico-font-size) !important;
    }
    
    .fs-sm {
        --pico-font-size: 0.4rem;
        font-size: var(--pico-font-size) !important;
    }

    .fs-md {
        --pico-font-size: 0.6rem;
        font-size: var(--pico-font-size) !important;
    }

    .fs-lg {
        --pico-font-size: 0.8rem;
        font-size: var(--pico-font-size) !important;
    }
    
    .fs-xlg {
        --pico-font-size: 1rem;
        font-size: var(--pico-font-size) !important;
    }

    .btn-xsm {
        --pico-form-element-spacing-vertical: 0.15rem;
        --pico-form-element-spacing-horizontal: 0.2rem;
    }
    
    .btn-sm {
        --pico-form-element-spacing-vertical: 0.30rem;
        --pico-form-element-spacing-horizontal: 0.4rem;
    }

    .btn-md {
        --pico-form-element-spacing-vertical: 0.45rem;
        --pico-form-element-spacing-horizontal: 0.6rem;
    }

    .btn-lg {
        --pico-form-element-spacing-vertical: 0.6rem;
        --pico-form-element-spacing-horizontal: 0.75rem;
    }

    .btn-xlg {
        --pico-form-element-spacing-vertical: 0.75rem;
        --pico-form-element-spacing-horizontal: 1rem;
    }
`;

const defaults__ = {
    'meta': {
        'settings': {
            'registered': false,
        },
        'urlSearchParams': null,
        'cases': {},
    },
    'notifications': {
        'theme': 'carbon',
        'position': 'top-right',
    },
    'webdav': {
        'httpReqOptions': {
            'headers': {
                'Content-Type': 'application/xml; charset=utf-8',
                'Accept': 'application/xml',
            },
        },
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
            'webdavPath': {
                'label': 'WebDAV Path',
                'type': 'text',
                'default': '/ScotCourtsCivil',
            },
            'webdavAuth': {
                'label': 'WebDAV Authentication',
                'type': 'select',
                'options': ['None', 'Digest'],
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
                'type': 'select',
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
                if (GM_config._meta['btnSaveAndClose'] === true) {
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
                GM_config._meta['btnSaveAndClose'] = true;
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
    static value(value, ...args) {
        return value instanceof Function ? value(...args) : value;
    }

    static when(condition, value, defaultValue = null) {
        value = this.value(value);
        condition = condition instanceof Function ? condition(value) : condition;

        return condition ? value : this.value(defaultValue);
    }

    static with(value, callback){
        value = this.value(value);
        return callback(value);
    }

    static tap(value, callback){
        value = this.value(value);
        callback(value);

        return value;
    }

    static isObject(item) {
        return item && typeof item === 'object' && !Array.isArray(item);
    }

    static mergeLists(oldList, newList, strategy) {
        switch (strategy) {
            case 'append':
                return [...oldList, ...newList];
            case 'append_rp':
                return [...new Set([...oldList, ...newList])];
            case 'prepend':
                return [...newList, ...oldList];
            case 'prepend_rp':
                return [...new Set([...newList, ...oldList])];
            case 'keep':
                return oldList;
            case 'replace':
            default:
                return newList;
        }
    }

    static combine(options = {}, ...sources) {
        const { recursive = false, list_merge = 'replace' } = options;

        return sources.reduce((acc, source) => {
            const result = { ...acc };

            for (const key in source) {
                if (Object.prototype.hasOwnProperty.call(source, key)) {
                    const val = source[key];
                    const prev = result[key];

                    if (recursive && this.isObject(val) && this.isObject(prev)) {
                        result[key] = this.combine(options, prev, val);
                    } else if (Array.isArray(val) && Array.isArray(prev)) {
                        result[key] = this.mergeLists(prev, val, list_merge);
                    } else {
                        result[key] = val;
                    }
                }
            }

            return result;
        }, {});
    }

    static isValidUrl(str) {
        if (typeof str !== 'string') return false;
        
        try {
            return new URL(str);
        } catch (error) {
            return false;
        }
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

    static pathSegments(...segments) {
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

        if (meta.initial) meta.parts[0] = `${meta.initial}${meta.parts[0]}`;

        return meta.parts;
    }

    static pathJoin(...segments) {
        return this.pathSegments(...segments).join('/');
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

    static strCamel(value) {
        if (!value) return '';

        return this.#strCasePrep(value)
            .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
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

    static strChopEnd(value, ...needles) {
        if (!value) return '';
        if (needles.length === 0) return value;

        let result = value;

        for (const needle of needles) {
            if (typeof needle !== 'string') continue;
            if (needle === '') continue;

            if (result.endsWith(needle)) {
                result = result.slice(0, -needle.length);
            }
        }

        return result;
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

        toast(this.combine({'recursive': true}, defaults__['notifications'], options))
    }

    static log(...args) {
        if (args.length == 0) return;
        GM_log(...args)
    }

    static #httpFailed(options, context) {
        this.notify({'message': `${options.method} Request Failed: ${options.url}`});
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

    static isConfigFieldSelectBool(field) {
        return field['settings']['type'] === 'select' && field['settings']['options'].indexOf('Enabled') > -1 && field['settings']['options'].indexOf('Disabled') > -1
    }

    static async fromXML(xmlString, options = {}) {
        if (typeof xmlString !== 'string' || xmlString.trim() === '') return null;
        
        const onKey = (options['onKey'] ?? null) instanceof Function ? options['onKey'] : null;
        const onValue = (options['onValue'] ?? null) instanceof Function ? options['onValue'] : null;

        const xmlDoc = (new DOMParser()).parseFromString(xmlString, 'text/xml');
        
        const parseError = xmlDoc.getElementsByTagName('parsererror');
        if (parseError.length > 0) {
            console.log("Error parsing XML: " + parseError[0].textContent);
            return null;
        }

        function parseNode(node) {
            if (node.nodeType === Node.TEXT_NODE) {
                return node.nodeValue.trim();
            }

            const obj = {};

            if (node.attributes && node.attributes.length > 0) {
                for (let attr of node.attributes) {
                    const attrKey = onKey ? onKey(`@${attr.name}`) : `@${attr.name}`;
                    const attrValue = onValue ? onValue(attr.value, attrKey) : attr.value;
                    obj[attrKey] = attrValue;
                }
            }

            if (node.childNodes && node.childNodes.length > 0) {
                for (let child of node.childNodes) {
                    if (child.nodeType === Node.TEXT_NODE && !child.nodeValue.trim()) continue;

                    const childKey = onKey ? onKey(child.nodeName) : child.nodeName;
                    const childValue = onValue ? onValue(parseNode(child), childKey) : parseNode(child);

                    if (child.nodeType === Node.ELEMENT_NODE) {
                        if (!obj[childKey]) {
                            obj[childKey] = childValue;
                        } else {
                            if (!Array.isArray(obj[childKey])) {
                                obj[childKey] = [obj[childKey]];
                            }
                            obj[childKey].push(childValue);
                        }
                    } else if (child.nodeType === Node.TEXT_NODE) {
                        return childValue;
                    }
                }
            }

            return obj;
        }

        const primaryKey = onKey ? onKey(xmlDoc.documentElement.nodeName) : xmlDoc.documentElement.nodeName;
        const primaryValue = onValue ? onValue(parseNode(xmlDoc.documentElement), primaryKey) : parseNode(xmlDoc.documentElement);

        return {
            [primaryKey]: primaryValue
        };
    }
}

class WebDav {
    static async parseResponse(xmlString) {
        if (typeof xmlString !== 'string' || xmlString.trim() === '') return null;

        return Utils.fromXML(xmlString, {
            'onKey': (key) => {
                return Utils.strChopEnd(Utils.strChopStart(key.trim(), 'd:', 'D:').trim(), ':d', ':D').trim();
            },
        });
    }

    static async getHttpReqOptions(extras = {}) {
        return Utils.combine({'recursive': true}, defaults__['webdav']['httpReqOptions'], extras);
    }

    static async exists(url, depth = 0, options = {}) {
        let httpReqOptions = await this.getHttpReqOptions(options);
        httpReqOptions = Utils.combine({'recursive': true}, httpReqOptions, {
            'url': Utils.pathJoin(url),
            'method': 'PROPFIND',
            'headers': {
                'Depth': depth,
            },
        });
        
        return GM.xmlHttpRequest(httpReqOptions).then((response) => response.status === 207);
    }

    static async createDirectory(url, options = {}) {
        let httpReqOptions = await this.getHttpReqOptions(options);
        httpReqOptions = combine({'recursive': true}, httpReqOptions, {
            'url': Utils.pathJoin(url),
            'method': 'MKCOL',
        });

        return GM.xmlHttpRequest(httpReqOptions).then((response) => response.status === 201);
    }

    static async ensureDirectoryExists(url, options = {}) {
        let ret = true;
        let parts = [];
        
        for (const [idx, part] of Utils.pathSegments(vm.getCase('webdavurl')).entries()) {
            parts.push(part);
            
            if (idx > 0) {
                ret = await this.createDirectory(Utils.pathJoin(...parts), options);
                if (ret === false){
                    break;
                }
            }
        }

        return ret;
    }

    static resolveFileItem(item, baseUrl) {
        const pathRel = Utils.pathJoin(item['href']);
        const isDir = (item?.propstat?.prop?.resourcetype?.collection ?? null) !== null;
        return {
            'etag': item?.propstat?.prop?.getetag ?? null,
            'isDir': isDir,
            'isFile': !isDir,
            'lastmodified': item?.propstat?.prop?.lastmodified ?? null,
            'contentType': item?.propstat?.prop?.getcontenttype ?? null,
            'displayName': item?.propstat?.prop?.displayname ?? null,
            'path': {
                'rel': pathRel,
                'full': Utils.pathJoin(baseUrl, pathRel),
            },
        };
    }

    static async getDirectoryContents(url, depth = 1, options = {}) {
        let httpReqOptions = await this.getHttpReqOptions(options);
        
        httpReqOptions = Utils.combine({'recursive': true}, httpReqOptions, {
            'url': Utils.pathJoin(url),
            'method': 'PROPFIND',
            'headers': {
                'Accept': 'application/xml',
                'Depth': (depth <= 0 ? 'infinity' : depth),
            },
        });
        
        const pathSegments = Utils.pathSegments(httpReqOptions['url']);

        return GM.xmlHttpRequest(httpReqOptions)
        .then(
            (response) => response.status === 207 ? response.responseText : null
        )
        .then(async (xmlString) => {
            return (await this.parseResponse(xmlString))?.multistatus?.response ?? null;
        })
        .then((items) => {
            if (!items) return null;
            return items.map((item) => this.resolveFileItem(item, pathSegments[0]));
        })
    }
}

class UI {
    static isModelOpen(id) {
        return Utils.with(
            document.getElementById(id),
            (modal) => modal ? modal.hasAttribute('open') && modal.getAttribute('open') === true : null,
        );
    }

    static openModel(id) {
        if (UI.isModelOpen(id) !== false) return;

        document.getElementById(id).setAttribute('open', true);
        document.documentElement.classList.add('modal-is-open');    
    }

    static closeModel(id) {
        if (UI.isModelOpen(id) !== true) return;

        document.getElementById(id).removeAttribute('open');
        document.documentElement.classList.remove('modal-is-open');
    }

    static toggleModal(id) {
        const isModelOpen = UI.isModelOpen(id);
        if (isModelOpen === true){
            UI.closeModel(id);
        }else if (isModelOpen === false) {
            UI.openModel(id);
        }
    }
}

class ScriptController {
    #meta = {}

    constructor() {
        this.#meta = defaults__['meta'];

        GM_addStyle(GM_getResourceText("CSS_TOAST"));
        
        this.#meta.urlSearchParams = new URLSearchParams(window.location.search);

        GM_config.init(defaults__['config']);
        GM_config._meta = {}
        GM_registerMenuCommand('⚙️ Settings', () => !GM_config.isOpen ? GM_config.open() : null);

        if (this.hasCaseRef()) {
            GM_registerMenuCommand("📁 Case Files", () => UI.toggleModal('caseFilesContainer'));
            GM_addStyle(GM_getResourceText("CSS_PICO"));
            GM_addStyle(htmlCss);
            Utils.tap(
                document.createElement('div'),
                (gmContainer) => {
                    gmContainer.id = 'gmContainer';
                    gmContainer.innerHTML = htmlContent;
                    document.body.appendChild(gmContainer);
                }
            );
        }
    }

    isDevMode() {
        return GM_config.get('devMode') === 'Enabled';
    }

    isCasePage() {
        return this.isDevMode() || location.pathname.startsWith('/case-tracker');
    }

    getCaseRef() {
        const caseRef = (!this.isDevMode() ? this.getUrlSearchParams().get('reference') : GM_config.get('devReference')).trim();
        return !caseRef || caseRef === '' ? null : caseRef;
    }

    hasCaseRef() {
        return this.getCaseRef() !== null;
    }

    getWebdavUrl(...paths) {
        const webdavUrl = Utils.pathJoin(GM_config.get('webdavUrl')).trim();
        if (!Utils.isValidUrl(webdavUrl)) return null;

        return Utils.pathJoin(
            webdavUrl, 
            GM_config.get('webdavPath'),
            ...paths,
        );
    }

    async getCaseDocs() {
        if (this.isDevMode()){
            return await GM.xmlHttpRequest({
                'method': 'GET',
                'url': Utils.pathJoin(GM_config.get('devDocs')), 
            })
            .then((response) => {
                if (!response) return [];
                return JSON.parse(response.responseText).documents ?? [];
            });
        }
    }

    getUrlSearchParams() {
        return this.#meta.urlSearchParams
    }

    async initCase() {
        const caseRef = await this.getCase('ref');
        if (!caseRef || Object.hasOwn(this.#meta.cases, caseRef)) return;
        
        const caseWebdavUrl = await this.getCase('webdavurl');
        if (! await WebDav.exists(caseWebdavUrl, 0)){
            await WebDav.ensureDirectoryExists(caseWebdavUrl);
        }

        const caseFiles = await WebDav.getDirectoryContents(caseWebdavUrl, 1);
        
        let docs = [];

        this.#meta.cases[caseRef] = [];
    }

    getGmContainer() {
        return document.getElementById('gmContainer');
    }

    getCaseFilesContainer() {
        return this.getGmContainer()?.querySelector('#caseFilesContainer');
    }

    getCaseFilesHeader() {
        return this.getCaseFilesContainer()?.querySelector('article > header');
    }

    getCaseFilesBody() {
        return this.getCaseFilesContainer()?.querySelector('article > div');
    }

    getCaseFilesFooter() {
        return this.getCaseFilesContainer()?.querySelector('article > footer');
    }

    getMeta() {
        return this.#meta;
    }
}

const vm = new ScriptController();

(async function() {
    'use strict';

    console.log(vm.getCaseFilesFooter());
    // console.log(vm.hasCaseRef());
    // console.log(vm.getWebdavUrl('sadsad', 'sdsadsa'));
    // await vm.initCase();
    // const caseWebdavUrl = await vm.getCase('webdavurl');
    // WebDav.getDirectoryContents(caseWebdavUrl, 1).then(async (final) => {
    //     console.log(final);
    //     // console.log(JSON.stringify(final, null, 2));
    // });

    // vm.getCase('ref').then((ref_) => {
    //     if (ref_ == '') return;
    //     caseFilesHeader.querySelector('h3').innerText = `Case Files - Reference: ${ref_}`;

    // });

    // GM_registerMenuCommand("📁 Case Files", () => {
    //     UI.toggleModal("caseFilesContainer");
    // });

    // UI.toggleModal("caseFilesContainer");
    
    // await vm.getCase('docs')
    // .then(async (docs) => {
    //     const caseUrl = await vm.getCase('webdavurl');
    //     let resolved = [];

    //     for (const doc of docs) {
    //         const fileName = Utils.resolveDocumentFileName(doc);
    //         const fileDst = Utils.pathJoin(caseUrl, fileName);
    //         const fileExists = await WebDav.exists(fileDst);
    //         resolved.push({
    //             'id': doc['documentId'],
    //             'date': doc['documentDate'],
    //             'fileName': fileName,
    //             'src': doc['fileUrl'],
    //             'dst': fileDst,
    //             'exists': fileExists,
    //         });
    //     }

    //     return resolved
    // })
    // .then(async (resolved) => {
    //     const table = document.createElement('table');
    //     const thead = document.createElement('thead');
    //     const tbody = document.createElement('tbody');
    //     const headerRow = document.createElement('tr');

    //     for (const header of ['Sync', 'ID', 'Date', 'File Name', 'Exists']) {
    //         const th = document.createElement('th');
    //         // th.classList.add('text-center');
    //         th.setAttribute('scope', 'col');
    //         th.textContent = header;
    //         headerRow.appendChild(th);
    //     }

    //     thead.appendChild(headerRow);

    //     for (const doc of resolved) {
    //         const row = document.createElement('tr');
    //         row.setAttribute('data-case-id', doc['id']);
    //         row.setAttribute('data-case-status', (doc['exists'] ? 'exists' : 'missing'));
    //         row.innerHTML = `
    //             <td class="text-center"><input type="checkbox" class="case-file-checkbox" data-status="${(doc['exists'] ? 'exists' : 'missing')}" value="${doc['id']}"${(doc['exists'] ? '' : ' checked')}></td>
    //             <td>${doc['id']}</td>
    //             <td>${doc['date']}</td>
    //             <td>${doc['fileName']}</td>
    //             <td class="text-center" class="case-file-exists">${(doc['exists'] ? "✅" : "❌")}</td>
    //         `;
    //         tbody.appendChild(row);
    //     }

    //     table.appendChild(thead);
    //     table.appendChild(tbody);

    //     caseFilesBody.innerHTML = table.outerHTML;

    //     const containerActionButtons = document.createElement('div');
    //     containerActionButtons.classList.add('grid');
        
    //     for (const btnText of ['Select All', 'Unselect All', 'Select Missing']){
    //         const btnSelect = document.createElement('button');
    //         btnSelect.innerText = btnText;
    //         btnSelect.classList.add('outline', 'secondary', 'btn-sm');
            
    //         btnSelect.addEventListener('click', (e) => {
    //             const actionOp = Utils.strCamel(e.target.innerText);
                
    //             for (const checkBox of caseFilesBody.querySelectorAll('input.case-file-checkbox')){
    //                 if (actionOp === 'selectAll') {
    //                     checkBox.setAttribute('checked', '');
    //                 }else if (actionOp === 'unselectAll') {
    //                     checkBox.removeAttribute('checked');
    //                 }else if (actionOp === 'selectMissing'){
    //                     if (checkBox.getAttribute('data-status') === 'missing'){
    //                         checkBox.setAttribute('checked', '');
    //                     }else {
    //                         checkBox.removeAttribute('checked');
    //                     }
    //                 }
    //             }
    //         });

    //         containerActionButtons.appendChild(btnSelect);
    //     }
        
    //     const btnSync = document.createElement('button');
    //     btnSync.innerText = 'Synchronise Selected';
    //     btnSync.classList.add('btn-sm');
    //     containerActionButtons.appendChild(btnSync);

    //     caseFilesFooter.appendChild(containerActionButtons);
    // });
    

    // vm.getCase('docs').then((result) => {
    //     console.log({
    //         'result': result,
    //     })
    // });
})();