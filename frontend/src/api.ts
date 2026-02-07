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

class ApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = import.meta.env.VITE_API_URL || '';
  }

  async getArtikel(): Promise<Artikel[]> {
    try {
      const res = await fetch(`${this.baseUrl}/artikel`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return (await res.json()) || [];
    } catch (error) {
      console.error('Fehler beim Laden der Artikel:', error);
      throw new Error('Backend nicht erreichbar. Läuft der Server auf Port 8080?');
    }
  }

  async getListen(): Promise<Einkaufsliste[]> {
    try {
      const res = await fetch(`${this.baseUrl}/listen`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return (await res.json()) || [];
    } catch (error) {
      console.error('Fehler beim Laden der Listen:', error);
      throw new Error('Backend nicht erreichbar. Läuft der Server auf Port 8080?');
    }
  }

  async createListe(bezeichnung: string): Promise<Einkaufsliste> {
    const res = await fetch(`${this.baseUrl}/listen`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bezeichnung })
    });
    if (!res.ok) throw new Error('Fehler beim Erstellen der Liste');
    return res.json();
  }

  async deleteListe(id: number): Promise<void> {
    const res = await fetch(`${this.baseUrl}/listen/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Fehler beim Löschen der Liste');
  }

  async getPositionen(listeId: number): Promise<Einkaufsposition[]> {
    try {
      const res = await fetch(`${this.baseUrl}/listen/${listeId}/positionen`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return (await res.json()) || [];
    } catch (error) {
      console.error('Fehler beim Laden der Positionen:', error);
      throw error;
    }
  }

  async createPosition(listeId: number, artikel_name: string, bemerkung?: string): Promise<Einkaufsposition> {
    const res = await fetch(`${this.baseUrl}/listen/${listeId}/positionen`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ artikel_name, bemerkung })
    });
    if (!res.ok) throw new Error('Fehler beim Erstellen der Position');
    return res.json();
  }

  async updatePosition(id: number, data: { erledigt?: boolean; artikel_name?: string; bemerkung?: string }): Promise<Einkaufsposition> {
    const res = await fetch(`${this.baseUrl}/positionen/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Fehler beim Aktualisieren der Position');
    return res.json();
  }

  async deletePosition(id: number): Promise<void> {
    const res = await fetch(`${this.baseUrl}/positionen/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Fehler beim Löschen der Position');
  }
}

export const api = new ApiService();
