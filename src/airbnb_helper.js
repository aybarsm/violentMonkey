// ==UserScript==
// @name         AirBnB Helper
// @namespace    https://github.com/aybarsm
// @version      0.4
// @description  AirBnB Helper
// @author       aybarsm
// @match        https://www.airbnb.com/s/*
// @match        https://www.airbnb.com/rooms/*
// @match        https://www.airbnb.co.uk/s/*
// @match        https://www.airbnb.co.uk/rooms/*
// @require      https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js
// @resource     BOOTSTRAP_CSS https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css
// @grant        GM_log
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM.xmlHttpRequest
// @grant        GM_addStyle
// @grant        GM_getResourceText
// ==/UserScript==

(function() {
    'use strict';

    function isPlainObject(value) {
      return value != null &&
             typeof value === 'object' &&
             value.constructor === Object &&
             !Array.isArray(value);
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

    const vmSettingsDefault = {
        storage: {
            url: null
        },
        data: {
          discarded: [],
          rooms: {},
        },
        meta: {
          page: null,
          roomButton: false,
        },
    };

    let vmSettings = GM_getValue('airbnb_helper', {});
    vmSettings = deepMergeImmutable(vmSettingsDefault, vmSettings)

    const roomSettingsDefault = {
        discard: false,
        notes: '',
    };

    const buttonsStyle = `
        .page-wide-button {
            position: fixed;
            top: 10px;
            left: 10px;
            z-index: 99999 !important;
        }
        .vm-settings-button {
          opacity: 0.5;
        }
        .vm-settings-button:hover {
          opacity: 1;
        }
        .discard-room-button {
            color: white;
            padding: 8px 16px;
            border: 2px solid #333;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
            font-weight: bold;
            min-width: 100px;
            text-align: center;
            box-shadow: 0 2px 8px rgba(0,0,0,0.4);
            transition: all 0.2s ease;
        }
        .discard-room-button.room-not-discarded {
          background-color: rgba(0, 0, 0, 0.65);
          border-color: #333;
          opacity: 0.5;
        }
        .discard-room-button.room-not-discarded:hover {
          opacity: 1;
        }
        .discard-room-button.room-discarded {
          background-color: rgba(220, 38, 38, 0.9);
          border-color: #991b1b;
        }
        .discard-room-button.in-search-page {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            zIndex: 20;
        }
        .discard-room-button.in-room-page {
            position: fixed;
            top: 50%;
            left: 50px;
            z-index: 99999 !important;
        }
    `;

    const settingsModalStyle = `
        .modal { z-index: 100000 !important; }
        .modal-backdrop { z-index: 99999 !important; }
    `;

    const roomPageStyle = `

    `;

    const settingsModalHtml = `
       <button type="button" class="btn btn-primary btn-sm shadow vm-settings-button page-wide-button" data-bs-toggle="modal" data-bs-target="#vmSettings">⚙️</button>

      <div class="modal fade" id="vmSettings" tabindex="-1" aria-labelledby="modalLabel" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">
          <div class="modal-content">
          <div class="modal-header">
              <h5 class="modal-title" id="modalLabel">AirBnB Helper Settings</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
              <form id="vm-settings">
                <div class="mb-3">
                  <label class="form-label">WebDav JSON Storage URL</label>
                  <input type="url" class="form-control" id="storage.url" placeholder="https://example.com/airbnb.json">
                </div>
              </form>
          </div>
          <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
              <button type="button" class="btn btn-primary" id="save-vm-settings">Save changes</button>
          </div>
          </div>
        </div>
      </div>
      `;

    GM_addStyle(GM_getResourceText("BOOTSTRAP_CSS"));
    GM_addStyle(buttonsStyle);
    const container = document.createElement('div');

    function fetchDataFromStorage() {
        if (!vmSettings.storage.url) return Promise.resolve(null);

        return new Promise((resolve) => {
            GM.xmlHttpRequest({
                method: 'GET',
                url: vmSettings.storage.url,
                anonymous: true,
                onload: (response) => {
                    try {
                        if (response.status !== 200) {
                          console.error(`GET status ${response.status}`);
                          resolve(null)
                        }else if (!isValidJson(response.responseText)) {
                          console.error('Response is not a valid json string.');
                          resolve(null)
                        }else {
                          resolve(JSON.parse(response.responseText));
                        }
                    } catch (err) {
                        console.error('WebDAV fetch error:', err);
                        resolve(null);
                    }
                },
                onerror: (err) => {
                    console.error('WebDAV GM_xmlhttpRequest error:', err);
                    resolve(null);
                }
            });
        });
    }

    function saveDataToStorage() {
        if (!vmSettings.storage.url) return Promise.resolve(false);

        const currentData = GM_getValue('airbnb_helper', vmSettings).data

        return new Promise((resolve) => {
            GM.xmlHttpRequest({
                method: 'PUT',
                url: vmSettings.storage.url,
                data: JSON.stringify(currentData),
                headers: { 'Content-Type': 'application/json' },
                anonymous: true,
                onload: (response) => {
                    if (response.status >= 200 && response.status < 300) {
                        console.log('Data synced to WebDAV storage');
                        resolve(true);
                    } else {
                        console.error(`PUT failed: status ${response.status}`);
                        resolve(false);
                    }
                },
                onerror: (err) => {
                    console.error('WebDAV save GM_xmlhttpRequest error:', err);
                    resolve(false);
                }
            });
        });
    }

    async function loadData() {
      if (!vmSettings.storage.url) return;
      const initialData = await fetchDataFromStorage();
      if (!initialData) return;
      vmSettings.data = deepMergeImmutable(vmSettingsDefault.data, initialData)
      GM_setValue('airbnb_helper', vmSettings);
    }

    async function saveData() {
      GM_setValue('airbnb_helper', vmSettings);
      if (!vmSettings.storage.url) return;
      const result = await saveDataToStorage();
    }

    function getRoomIdFromCard(card) {
        const link = card.querySelector('a[href^="/rooms/"]');
        if (link) {
            const match = link.href.match(/\/rooms\/(\d+)/);
            if (match) return match[1];
        }
        return null;
    }

    function isRoomDiscarded(roomId) {
        const currentRooms = GM_getValue('airbnb_helper', vmSettings).data.rooms
        if (!Object.hasOwn(currentRooms, roomId) || !Object.hasOwn(currentRooms[roomId], "discard")) {
          return false
        }

        return currentRooms[roomId]["discard"] === true
    }

    function getRoomIdFromLocation() {
        const match = location.pathname.match(/\/rooms\/(\d+)/);
        if (match) return match[1];
        return null;
    }

    function updateDiscardButton(roomId, button) {
        if (isRoomDiscarded(roomId)) {
            button.classList.remove('room-not-discarded');
            button.classList.add('room-discarded');
            button.textContent = 'Discarded';
            GM_log(`Room ${roomId} discarded.`)
        } else {
            button.classList.remove('room-discarded');
            button.classList.add('room-not-discarded');
            button.textContent = 'Discard';
            GM_log(`Room ${roomId} removed from discarded.`);
        }
    }

    function toggleDiscard(roomId, button) {
        if (!Object.hasOwn(vmSettings.data.rooms, roomId)) vmSettings.data.rooms[roomId]=roomSettingsDefault;

        if (isRoomDiscarded(roomId)) {
            vmSettings.data.rooms[roomId]["discard"] = false
        } else {
            vmSettings.data.rooms[roomId]["discard"] = true
        }

        saveData();
        updateDiscardButton(roomId, button);
    }

    function makeDiscardButton() {
      let button = document.createElement('button');
      button.textContent = 'Discard';
      button.classList.add(...['discard-room-button'])

      return button;
    }

    async function resolveDiscardButtons() {
        if (vmSettings.meta.page === 'search'){
          const cards = document.querySelectorAll('div[data-testid="card-container"]');

          cards.forEach(card => {
              const roomId = getRoomIdFromCard(card);
              if (!roomId) return;
              let button = card.querySelector('.discard-room-button');

              if (button){
                updateDiscardButton(roomId, button);
                return;
              }

              button = makeDiscardButton();
              button.classList.add('in-search-page')
              updateDiscardButton(roomId, button)

              button.addEventListener('click', async () => {
                toggleDiscard(roomId, button)
              });

              card.style.position = 'relative';
              card.style.overflow = 'hidden';
              card.appendChild(button);
          });
        }else if (vmSettings.meta.page === 'room'){
          const roomId = getRoomIdFromLocation();

          if (!roomId) {
            console.error('Could not resolve room id.');
            return;
          }

          let button = container.querySelector('.discard-room-button');

          if (button){
            updateDiscardButton(roomId, button);
            return;
          }

          button = makeDiscardButton();
          button.classList.add('in-room-page')

          updateDiscardButton(roomId, button);

          button.addEventListener('click', async () => {
            toggleDiscard(roomId, button)
          });

          container.appendChild(button);
          document.body.appendChild(container);
        }
    }

    if (location.pathname.startsWith('/s/')){
      vmSettings.meta.page = 'search';
      GM_addStyle(settingsModalStyle);
      container.innerHTML = settingsModalHtml;
      document.body.appendChild(container);

      const vmSettingsSaveButton = document.getElementById('save-vm-settings');
      const vmSettingsForm = document.getElementById('vm-settings');
      if (vmSettings.storage.url) vmSettingsForm.elements['storage.url'].value = vmSettings.storage.url;
      vmSettingsSaveButton.addEventListener('click', () => {
          let storageUrl = vmSettingsForm.elements['storage.url'].value;
          if (storageUrl == null || storageUrl.trim() === '') storageUrl=null;
          if (storageUrl !== vmSettings.storage.url) vmSettings.storage.url = storageUrl;
          saveData();
      });
    }else if (location.pathname.startsWith('/rooms/')) {
      vmSettings.meta.page = 'room';
    }

    loadData();
    resolveDiscardButtons();
    setInterval(resolveDiscardButtons, 1500);
})();