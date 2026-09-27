import { fetchWithAuth } from './api';

export interface SavedRoomDesign {
  id: string;
  userId?: string;
  roomImageId?: string;
  roomImageUrl?: string;
  name: string;
  sceneData: string; // JSON containing placed furniture array & transforms
  createdAt: string;
  updatedAt: string;
}

export interface SaveDesignPayload {
  name: string;
  roomImageId?: string;
  roomImageUrl?: string;
  sceneData: string;
}

export const designApi = {
  saveDesign: (payload: SaveDesignPayload) =>
    fetchWithAuth<SavedRoomDesign>('/designs', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getDesigns: () => fetchWithAuth<SavedRoomDesign[]>('/designs'),

  getDesignById: (id: string) => fetchWithAuth<SavedRoomDesign>(`/designs/${id}`),

  updateDesign: (id: string, payload: SaveDesignPayload) =>
    fetchWithAuth<SavedRoomDesign>(`/designs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  renameDesign: (id: string, name: string) =>
    fetchWithAuth<SavedRoomDesign>(`/designs/${id}/rename`, {
      method: 'PATCH',
      body: JSON.stringify({ name }),
    }),

  deleteDesign: (id: string) =>
    fetchWithAuth<{ message: string }>(`/designs/${id}`, {
      method: 'DELETE',
    }),
};
