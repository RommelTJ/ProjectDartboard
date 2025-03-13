import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { 
  DetectionResponse,
  CameraImageResponse,
  DeleteImagesResponse
} from './types';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    // In development with Vite, we use the proxy in vite.config.ts
    // In production, the API URL is relative to the frontend
    this.client = axios.create({
      baseURL: '/api',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add response interceptor for consistent error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response) {
          return Promise.reject({
            status: error.response.status,
            data: error.response.data,
          });
        }
        return Promise.reject({
          status: 500,
          data: { error: 'Network Error' },
        });
      }
    );
  }

  // Dart detection
  async predictDarts(file: File): Promise<DetectionResponse> {
    const formData = new FormData();
    formData.append('file', file);
    
    const config: AxiosRequestConfig = {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    };
    
    const response = await this.client.post<DetectionResponse>('/predict', formData, config);
    return response.data;
  }

  // Camera images
  async getLatestImage(): Promise<Blob> {
    const response = await this.client.get<Blob>('/camera/images/latest', {
      responseType: 'blob'
    });
    return response.data;
  }

  async captureImage(): Promise<CameraImageResponse> {
    const response = await this.client.post<CameraImageResponse>('/camera/images');
    return response.data;
  }

  async deleteAllImages(): Promise<DeleteImagesResponse> {
    const response = await this.client.delete<DeleteImagesResponse>('/camera/images');
    return response.data;
  }
}

const apiClient = new ApiClient();
export default apiClient;