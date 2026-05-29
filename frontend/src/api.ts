import {
  cacheArtikel, getCachedArtikel,
  cacheListen, getCachedListen, addCachedListe, removeCachedListe,
  cachePositionen, getCachedPositionen, addCachedPosition, updateCachedPosition, removeCachedPosition,
  addToSyncQueue, getSyncQueue, processSyncQueue
} from './offlineStore';

export interface Artikel {
  id: number;
  name: string;
}

export interface Einkaufsliste {
  id: number;
  bezeichnung: string;
  erstellt_am: string;
}

export interface Einkaufsposition {
  id: number;
  liste_id: number;
  artikel_name: string;
  bemerkung?: string;
  erledigt: boolean;
}

type SyncListener = (pendingCount: number) => void;

class ApiService {
  private baseUrl: string;
  private _online = navigator.onLine;
  private syncListeners: SyncListener[] = [];

  constructor() {
    this.baseUrl = import.meta.env.VITE_API_URL || '';

    window.addEventListener('online', () => {
      this._online = true;
      this.syncPendingChanges();
    });
    window.addEventListener('offline', () => {
      this._online = false;
    });
  }

  get isOnline(): boolean {
    return this._online;
  }

  onSyncChange(listener: SyncListener): void {
    this.syncListeners.push(listener);
  }

  private async notifySyncListeners(): Promise<void> {
    const queue = await getSyncQueue();
    this.syncListeners.forEach(l => l(queue.length));
  }

  async getPendingCount(): Promise<number> {
    const queue = await getSyncQueue();
    return queue.length;
  }

  async syncPendingChanges(): Promise<void> {
    const { success } = await processSyncQueue(this.baseUrl);
    if (success > 0) {
      await this.notifySyncListeners();
    }
  }

  // --- Artikel ---

  async getArtikel(): Promise<Artikel[]> {
    try {
      const res = await fetch(`${this.baseUrl}/artikel`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: Artikel[] = (await res.json()) || [];
      await cacheArtikel(data);
      this._online = true;
      return data;
    } catch {
      const cached = await getCachedArtikel();
      if (cached.length > 0) {
        this._online = false;
        return cached;
      }
      throw new Error('Backend nicht erreichbar und keine Offline-Daten verfügbar.');
    }
  }

  // --- Listen ---

  async getListen(): Promise<Einkaufsliste[]> {
    try {
      const res = await fetch(`${this.baseUrl}/listen`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: Einkaufsliste[] = (await res.json()) || [];
      await cacheListen(data);
      this._online = true;
      return data;
    } catch {
      const cached = await getCachedListen();
      if (cached.length > 0) {
        this._online = false;
        return cached;
      }
      throw new Error('Backend nicht erreichbar und keine Offline-Daten verfügbar.');
    }
  }

  async createListe(bezeichnung: string): Promise<Einkaufsliste> {
    try {
      const res = await fetch(`${this.baseUrl}/listen`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bezeichnung })
      });
      if (!res.ok) throw new Error('Fehler beim Erstellen der Liste');
      const newListe: Einkaufsliste = await res.json();
      await addCachedListe(newListe);
      return newListe;
    } catch {
      // Offline: create temporary local entry
      const tempListe: Einkaufsliste = {
        id: -Date.now(), // negative temp ID
        bezeichnung,
        erstellt_am: new Date().toISOString()
      };
      await addCachedListe(tempListe);
      await addToSyncQueue({
        method: 'POST',
        url: '/listen',
        body: JSON.stringify({ bezeichnung })
      });
      await this.notifySyncListeners();
      return tempListe;
    }
  }

  async deleteListe(id: number): Promise<void> {
    try {
      const res = await fetch(`${this.baseUrl}/listen/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Fehler beim Löschen der Liste');
      await removeCachedListe(id);
    } catch {
      await removeCachedListe(id);
      if (id > 0) { // Only sync if it was a real server ID
        await addToSyncQueue({ method: 'DELETE', url: `/listen/${id}` });
        await this.notifySyncListeners();
      }
    }
  }

  // --- Positionen ---

  async getPositionen(listeId: number): Promise<Einkaufsposition[]> {
    try {
      const res = await fetch(`${this.baseUrl}/listen/${listeId}/positionen`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: Einkaufsposition[] = (await res.json()) || [];
      await cachePositionen(listeId, data);
      this._online = true;
      return data;
    } catch {
      this._online = false;
      return getCachedPositionen(listeId);
    }
  }

  async createPosition(listeId: number, artikel_name: string, bemerkung?: string): Promise<Einkaufsposition> {
    try {
      const res = await fetch(`${this.baseUrl}/listen/${listeId}/positionen`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ artikel_name, bemerkung })
      });
      if (!res.ok) throw new Error('Fehler beim Erstellen der Position');
      const newPos: Einkaufsposition = await res.json();
      await addCachedPosition(newPos);
      return newPos;
    } catch {
      const tempPos: Einkaufsposition = {
        id: -Date.now(),
        liste_id: listeId,
        artikel_name,
        bemerkung,
        erledigt: false
      };
      await addCachedPosition(tempPos);
      await addToSyncQueue({
        method: 'POST',
        url: `/listen/${listeId}/positionen`,
        body: JSON.stringify({ artikel_name, bemerkung })
      });
      await this.notifySyncListeners();
      return tempPos;
    }
  }

  async updatePosition(id: number, data: { erledigt?: boolean; artikel_name?: string; bemerkung?: string }): Promise<Einkaufsposition> {
    try {
      const res = await fetch(`${this.baseUrl}/positionen/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error('Fehler beim Aktualisieren der Position');
      const updated: Einkaufsposition = await res.json();
      await updateCachedPosition(id, data);
      return updated;
    } catch {
      await updateCachedPosition(id, data);
      if (id > 0) {
        await addToSyncQueue({
          method: 'PATCH',
          url: `/positionen/${id}`,
          body: JSON.stringify(data)
        });
        await this.notifySyncListeners();
      }
      return { id, liste_id: 0, artikel_name: '', bemerkung: '', erledigt: false, ...data } as Einkaufsposition;
    }
  }

  async deletePosition(id: number): Promise<void> {
    try {
      const res = await fetch(`${this.baseUrl}/positionen/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Fehler beim Löschen der Position');
      await removeCachedPosition(id);
    } catch {
      await removeCachedPosition(id);
      if (id > 0) {
        await addToSyncQueue({ method: 'DELETE', url: `/positionen/${id}` });
        await this.notifySyncListeners();
      }
    }
  }
}

export const api = new ApiService();
