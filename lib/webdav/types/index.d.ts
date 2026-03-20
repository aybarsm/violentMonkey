import * as WebDavOriginal from 'webdav';

declare global {
    const WebDav: typeof WebDavOriginal;
}