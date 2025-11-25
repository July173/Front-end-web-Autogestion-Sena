import { useCallback, useEffect, useRef, useState } from 'react';
import { getApprenticeDashboard } from '@/Api/Services/RequestAssignaton';
import { getEnterpriseById } from '@/Api/Services/Enterprise';
import { getModalityProductiveStages } from '@/Api/Services/ModalityProductiveStage';
import { getUserById } from '@/Api/Services/User';
import { User } from '@/Api/types/entities/user.types';

export interface DashboardData {
  has_request: boolean;
  request: {
    id: number;
    enterprise_name: string | null;
    location?: string | null;
    boss_name: string | null;
    modality: string | null;
    start_date: string | null;
    end_date: string | null;
    request_date: string | null;
    request_state: string | null;
    pdf_url: string | null;
  } | null;
  instructor: {
    id: number | null;
    first_name?: string | null;
    second_name?: string | null;
    first_last_name?: string | null;
    second_last_name?: string | null;
    email?: string | null;
    phone?: string | null;
    knowledge_area?: string | null;
    assigned_at?: string | null;
  } | null;
  request_state: string | null;
}

export default function useApprenticeDashboard(initialApprenticeId?: number) {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<User | null>(null);

  const lastFetchedApprenticeId = useRef<number | null>(null);

  const load = useCallback(async (apprenticeId?: number) => {
    try {
      setLoading(true);

      let effectiveApprenticeId: number | null = apprenticeId ?? null;

      // try to read user from local state or localStorage
      let currentUser: any = userData;
      if (!currentUser) {
        const stored = localStorage.getItem('user_dashboard');
        if (stored) {
          try {
            currentUser = JSON.parse(stored);
            setUserData(currentUser);
          } catch (e) {
            // ignore
          }
        }
      }

      if (!effectiveApprenticeId && currentUser?.id) {
        try {
          const fullUser: any = await getUserById(currentUser.id);
          effectiveApprenticeId = fullUser?.apprentice?.id ?? fullUser?.apprentice ?? null;
        } catch (e) {
          console.warn('Could not fetch full user to determine apprentice id', e);
        }
      }

      if (!effectiveApprenticeId) {
        setDashboardData({ has_request: false, request: null, instructor: null, request_state: null });
        return;
      }

      if (lastFetchedApprenticeId.current === effectiveApprenticeId) return;
      lastFetchedApprenticeId.current = effectiveApprenticeId;

      const response: any = await getApprenticeDashboard(effectiveApprenticeId);
      const raw = response?.data ?? response ?? null;

      if (!raw) {
        setDashboardData({ has_request: false, request: null, instructor: null, request_state: null });
        return;
      }

      const mappedRequest: any = {
        id: raw.id,
        enterprise_name: raw.enterprise_name ?? raw.enterprise ?? null,
        boss_name: raw.boss_name ?? raw.boss ?? null,
        modality: raw.modality_productive_stage ?? raw.modality ?? null,
        start_date: raw.start_date ?? raw.date_start_production_stage ?? null,
        end_date: raw.end_date ?? raw.date_end_production_stage ?? null,
        request_date: raw.request_date ?? raw.fecha_solicitud ?? null,
        request_state: raw.request_state ?? raw.state ?? null,
        pdf_url: raw.pdf_url ?? null,
      };

      const instructor = raw.instructor_id || raw.instructor_first_name || raw.instructor_email ? {
        id: raw.instructor_id ?? null,
        first_name: raw.instructor_first_name ?? null,
        second_name: raw.instructor_second_name ?? null,
        first_last_name: raw.instructor_first_last_name ?? null,
        second_last_name: raw.instructor_second_last_name ?? null,
        email: raw.instructor_email ?? null,
        phone: raw.instructor_phone_number ?? '',
        knowledge_area: raw.instructor_knowledge_area ?? null,
        assigned_at: raw.instructor_assigned_at ?? null,
      } : null;

      let normalizedState = raw.request_state ?? raw.state ?? null;
      if (normalizedState === 'ASIGNADO') normalizedState = 'ASIGNADO';
      else if (normalizedState === 'RECHAZADO') normalizedState = 'RECHAZADO';
      else normalizedState = 'EN_REVISION';

      const final: DashboardData = {
        has_request: true,
        request: mappedRequest,
        instructor,
        request_state: normalizedState,
      };

      try {
        const enterpriseId = raw.enterprise ?? raw.enterprise_id ?? null;
        if (enterpriseId) {
          const ent = await getEnterpriseById(Number(enterpriseId));
          if (ent) {
            final.request!.enterprise_name = ent.name || ent.empresa_nombre || ent.enterprise_name || String(ent.id);
            final.request!.location = ent.municipio || ent.ubicacion || ent.location || ent.address || ent.direccion || ent.city || null;
          }
        }

        const modalityCandidate = raw.modality_productive_stage ?? raw.modality ?? mappedRequest.modality ?? null;
        if (modalityCandidate) {
          if (typeof modalityCandidate === 'number' || /^[0-9]+$/.test(String(modalityCandidate))) {
            try {
              const modalities = await getModalityProductiveStages();
              const found = modalities.find(m => m.id === Number(modalityCandidate));
              if (found) final.request!.modality = (found as any).name_modality || (found as any).name || String(found.id);
              else final.request!.modality = String(modalityCandidate);
            } catch (e) {
              final.request!.modality = String(modalityCandidate);
            }
          } else {
            final.request!.modality = String(modalityCandidate);
          }
        }
      } catch (e) {
        console.warn('Enterprise or modality lookup failed', e);
      }

      setDashboardData(final);
    } catch (err: any) {
      console.error('Error al cargar dashboard (useApprenticeDashboard):', err);
    } finally {
      setLoading(false);
    }
  }, [userData]);

  useEffect(() => {
    load(initialApprenticeId);
  }, [initialApprenticeId, load]);

  const reload = useCallback(() => {
    // allow manual reload; clear lastFetched to force fetch
    lastFetchedApprenticeId.current = null;
    load(initialApprenticeId);
  }, [initialApprenticeId, load]);

  const showInstructor = !!dashboardData && dashboardData.request_state !== 'RECHAZADO' && !!dashboardData.instructor;

  return { dashboardData, loading, userData, reload, showInstructor };
}
