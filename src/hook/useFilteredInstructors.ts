import { useCallback, useState } from 'react';
import { ENDPOINTS } from '@/Api/config/ConfigApi';
import { InstructorCustomList } from '@/Api/types/entities/instructor.types';

type Params = Record<string, string>;

export default function useFilteredInstructors(initialParams: Params = {}) {
  const [instructors, setInstructors] = useState<InstructorCustomList[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchInstructors = useCallback(async (params: Params = {}) => {
    setLoading(true);
    try {
      const payload = { ...initialParams, ...params };
      if (!payload.search) payload.search = '';
      payload.is_followup_instructor = 'true';
      const query = Object.entries(payload)
        .filter(([_, v]) => v !== undefined && v !== null)
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
        .join('&');
      const url = `${ENDPOINTS.instructor.filterInstructores}?${query}`;
      const res = await fetch(url);
      const data = await res.json();
      let items: unknown[] = [];
      if (Array.isArray(data)) items = data as unknown[];
  else if (data && Array.isArray((data as { data?: unknown }).data)) items = (data as { data?: unknown }).data as unknown[];
      // Map to InstructorCustomList conservatively
      const mapped = items.map((it) => {
        const obj = it as Record<string, unknown>;
        const assigned = (obj.assigned_learners as number) ?? (obj.assigned_count as number) ?? (obj.assigned as number) ?? 0;
        const max = (obj.max_assigned_learners as number) ?? (obj.max_assignments as number) ?? (obj.max as number) ?? 80;
        return {
          id: Number(obj.id as unknown as number),
          name: (obj.name as string) || `${(obj.first_name as string) || ''} ${(obj.first_last_name as string) || ''}`.trim(),
          knowledge_area: (obj.knowledge_area as string) ?? (obj.area as string) ?? undefined,
          email: obj.email as string | undefined,
          first_name: obj.first_name as string | undefined,
          second_name: obj.second_name as string | undefined,
          first_last_name: obj.first_last_name as string | undefined,
          second_last_name: obj.second_last_name as string | undefined,
          assigned_learners: Number(assigned),
          max_assigned_learners: Number(max),
          program: obj.program as string | number | undefined,
        } as InstructorCustomList;
      });
      setInstructors(mapped);
    } catch {
      setInstructors([]);
    } finally {
      setLoading(false);
    }
  }, [initialParams]);

  return { instructors, loading, fetchInstructors } as const;
}
