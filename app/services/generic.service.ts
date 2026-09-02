import { AxiosRequestConfig, AxiosResponse } from 'axios';
import apiClient from './apiClient';

export const genericGet = <Response>(endpoint: string, config?: AxiosRequestConfig): Promise<AxiosResponse<Response>> =>
  apiClient.get<Response>(endpoint, config);
export const genericCreate = <Request, Response>(endpoint: string, data?: Request, config?: AxiosRequestConfig): Promise<AxiosResponse<Response>> =>
  apiClient.post<Response>(endpoint, data, config);
export const genericUpdate = <Request, Response>(endpoint: string, data?: Request): Promise<AxiosResponse<Response>> =>
  apiClient.put<Response>(endpoint, data);
export const genericDelete = <Response>(endpoint: string): Promise<AxiosResponse<Response>> => apiClient.delete<Response>(endpoint);
