import { fetchWithAuth } from './api';
import { VisualizationSession, PlacedFurniture } from '../types/visualization';

export const visualizationApi = {
  createSession: (roomImageUrl?: string) =>
    fetchWithAuth<VisualizationSession>('/visualization/sessions', {
      method: 'POST',
      body: JSON.stringify({ roomImageUrl }),
    }),
  saveLayout: (sessionId: string, furniture: PlacedFurniture[]) =>
    fetchWithAuth<VisualizationSession>(`/visualization/sessions/${sessionId}/layout`, {
      method: 'PUT',
      body: JSON.stringify({ furniture }),
    }),
  uploadRoomImage: async (file: File): Promise<{ imageUrl: string }> => {
    const formData = new FormData();
    formData.append('image', file);
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1'}/visualization/room-images`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    const json = await response.json();
    return json.data;
  },
};
