export const SAVE_KEY = 'berea-case-02:investigation';
// Leave corrupt/incompatible bytes untouched until an explicit confirmed restart.
export class Persistence {
  constructor(storage) { this.storage = storage; this.lastRaw = null; this.status = 'unsaved'; this.blocked = false; }
  read(restore) {
    try {
      this.lastRaw = this.storage.getItem(SAVE_KEY);
    } catch { this.status = 'unavailable'; return null; }
    if (this.lastRaw === null) { this.status = 'new'; return null; }
    try {
      const state = restore(JSON.parse(this.lastRaw));
      this.status = 'saved'; return state;
    } catch (error) {
      this.blocked = true; this.status = error.message === 'INCOMPATIBLE_SAVE' ? 'incompatible' : 'corrupt'; return null;
    }
  }
  save(state) {
    if (this.blocked) return false;
    try {
      if (this.storage.getItem(SAVE_KEY) !== this.lastRaw) { this.status = 'conflict'; this.blocked = true; return false; }
      const raw = JSON.stringify(state);
      this.storage.setItem(SAVE_KEY, raw); this.lastRaw = raw; this.status = 'saved'; return true;
    } catch { this.status = 'writeFailed'; return false; }
  }
  restart(state) {
    // No clear(): only this investigation's save may be replaced.
    try { this.lastRaw = this.storage.getItem(SAVE_KEY); }
    catch { this.lastRaw = null; }
    this.blocked = false; return this.save(state);
  }
}
