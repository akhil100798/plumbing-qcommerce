import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';
import { apiClient, getAuthToken } from '../api/axiosClient';

export type JobPhoto = { id: number; uri: string; headers?: Record<string, string>; contentType: string; sizeBytes: number };

type PhotoResponse = { id: number; url: string; contentType: string; sizeBytes: number };

const toPhoto = async (photo: PhotoResponse): Promise<JobPhoto> => {
  const url = new URL(photo.url, apiClient.defaults.baseURL).toString();
  let uri = url;
  let headers: Record<string, string> | undefined;
  if (Platform.OS === 'web') {
    // Browser image elements cannot send the protected endpoint's bearer header.
    const response = await apiClient.get<Blob>(url, { responseType: 'blob' });
    uri = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error('Unable to load photo preview.'));
      reader.readAsDataURL(response.data);
    });
  } else {
    const token = await getAuthToken();
    if (token) headers = { Authorization: `Bearer ${token}` };
  }
  return { id: photo.id, uri, headers, contentType: photo.contentType, sizeBytes: photo.sizeBytes };
};

export const photoService = {
  list: async (jobId: string, phase: 'BEFORE' | 'AFTER'): Promise<JobPhoto[]> => {
    const response = await apiClient.get<PhotoResponse[]>(`/orders/${jobId}/photos/${phase}`);
    return Promise.all(response.data.map(toPhoto));
  },

  pickAndUpload: async (jobId: string, phase: 'BEFORE' | 'AFTER'): Promise<JobPhoto | null> => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) throw new Error('Photo library permission is required to upload work evidence.');
    const selected = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (selected.canceled || !selected.assets[0]) return null;
    const asset = selected.assets[0];
    if (!asset.mimeType || !['image/jpeg', 'image/png', 'image/webp'].includes(asset.mimeType)) {
      throw new Error('Choose a JPEG, PNG, or WebP image.');
    }
    if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) throw new Error('Image must not exceed 5 MB.');
    const body = new FormData();
    const webFile = (asset as unknown as { file?: File }).file;
    if (Platform.OS === 'web' && webFile) {
      body.append('file', webFile);
    } else {
      body.append('file', { uri: asset.uri, name: asset.fileName || `work-photo.${asset.mimeType.split('/')[1]}`, type: asset.mimeType } as unknown as Blob);
    }
    const response = await apiClient.post<PhotoResponse>(`/orders/${jobId}/photos/${phase.toLowerCase()}`, body, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return toPhoto(response.data);
  },

  imageHeaders: async () => {
    const token = await getAuthToken();
    return token ? { Authorization: `Bearer ${token}` } : undefined;
  },
};
