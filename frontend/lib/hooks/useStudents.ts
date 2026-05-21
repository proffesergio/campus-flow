'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';

export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  rollNumber: string | null;
  photoUrl: string | null;
  guardianPhone: string;
  status: 'active' | 'inactive' | 'graduated' | 'transferred';
  class: { id: string; name: string; section: string | null };
}

export interface StudentsResponse {
  items: Student[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export interface StudentStats {
  total: number;
  active: number;
  thisMonth: number;
}

export function useStudents(params: {
  page?: number;
  limit?: number;
  search?: string;
  classId?: string;
  status?: string;
}) {
  const [data, setData] = useState<StudentsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<StudentsResponse & { success: boolean }>('/students', {
        params: { ...params, page: params.page ?? 1, limit: params.limit ?? 20 },
      });
      setData({ items: res.data.items, meta: res.data.meta });
    } catch {
      setError('Failed to load students');
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(params)]);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

export function useStudentStats() {
  const [stats, setStats] = useState<StudentStats | null>(null);

  useEffect(() => {
    api.get<{ success: boolean; data: StudentStats }>('/students/stats')
      .then((res) => setStats(res.data.data))
      .catch(() => null);
  }, []);

  return stats;
}
