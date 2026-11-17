import { lazy } from 'react';

const RELOAD_FLAG = 'chat.chunkReload';

/**
 * Lazy-loads a page. After a new deploy, an open tab can still ask for a file from the previous
 * build, which no longer exists. In that case the page reloads once to get the new files.
 */
export function lazyWithReload(importer) {
  return lazy(async () => {
    try {
      const module = await importer();
      sessionStorage.removeItem(RELOAD_FLAG);
      return module;
    } catch (error) {
      if (!sessionStorage.getItem(RELOAD_FLAG)) {
        sessionStorage.setItem(RELOAD_FLAG, '1');
        window.location.reload();
        return new Promise(() => {});
      }
      throw error;
    }
  });
}
