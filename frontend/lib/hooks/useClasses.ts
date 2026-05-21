'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

export interface Class {
  id: string;
  name: string;
  section: string | null;
  academicYear: string;
  _count: { students: number };
}

export function useClasses() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<{ success: boolean; data: Class[] }>('/classes')
      .then((res) => setClasses(res.data.data))
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  return { classes, loading };
}
