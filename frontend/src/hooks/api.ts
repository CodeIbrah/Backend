import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import type { ApiResponse, PaginatedResponse } from '../types';

interface UseApiOptions {
  autoFetch?: boolean;
}

interface UseApiReturn<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  fetch: () => Promise<void>;
  reset: () => void;
}

export function useApi<T>(endpoint: string, options: UseApiOptions = {}): UseApiReturn<T> {
  const { autoFetch = true } = options;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(autoFetch);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<ApiResponse<T>>(endpoint);
      setData(res.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch');
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  const reset = useCallback(() => {
    setData(null);
    setLoading(false);
    setError(null);
  }, []);

  useEffect(() => {
    if (autoFetch) fetch();
  }, [autoFetch, fetch]);

  return { data, loading, error, fetch, reset };
}

export async function login(email: string, password: string) {
  const res = await api.post<ApiResponse<{ accessToken: string; refreshToken: string; user: any }>>('/auth/login', { email, password });
  return res.data.data;
}

export async function register(email: string, password: string, name: string) {
  const res = await api.post<ApiResponse<{ accessToken: string; refreshToken: string; user: any }>>('/auth/register', { email, password, name });
  return res.data.data;
}

export async function fetchUsers(page = 1, limit = 10, search = '', role = '') {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (search) params.set('search', search);
  if (role) params.set('role', role);
  const res = await api.get<ApiResponse<PaginatedResponse<any>>>(`/users?${params}`);
  return res.data.data;
}

export async function createUser(data: { email: string; password: string; name: string; role: string }) {
  const res = await api.post<ApiResponse<any>>('/users', data);
  return res.data.data;
}

export async function updateUser(id: string, data: { name?: string; role?: string; isActive?: boolean }) {
  const res = await api.patch<ApiResponse<any>>(`/users/${id}`, data);
  return res.data.data;
}

export async function deleteUser(id: string) {
  const res = await api.delete<ApiResponse<any>>(`/users/${id}`);
  return res.data.data;
}

export async function fetchActivityLogs(page = 1, limit = 20, severity = '') {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (severity) params.set('severity', severity);
  const res = await api.get<ApiResponse<PaginatedResponse<any>>>(`/activity-logs?${params}`);
  return res.data.data;
}

export async function fetchHealth() {
  const res = await api.get<ApiResponse<any>>('/health');
  return res.data.data;
}

export async function fetchMetrics() {
  const res = await api.get<ApiResponse<any>>('/metrics');
  return res.data.data;
}

export async function fetchOpsStatus() {
  const res = await api.get<ApiResponse<any>>('/ops/status');
  return res.data.data;
}

export async function fetchAnalytics() {
  const res = await api.get<ApiResponse<any>>('/analytics');
  return res.data.data;
}

export async function fetchReports() {
  const res = await api.get<ApiResponse<any>>('/reports');
  return res.data.data;
}

export async function fetchPayments(page = 1, limit = 10) {
  const res = await api.get<ApiResponse<PaginatedResponse<any>>>(`/payments?page=${page}&limit=${limit}`);
  return res.data.data;
}
