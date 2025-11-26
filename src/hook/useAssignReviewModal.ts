import { useCallback, useEffect, useState } from 'react';
import { getFormRequestById, getRequestAsignationById, patchMessageRequest } from '@/Api/Services/RequestAssignaton';

interface PerformActionResult {
  success: boolean;
  error?: string;
  data?: any;
}

export default function useAssignReviewModal(
  requestId?: number,
  isOpen?: boolean,
  initialDetail?: any,
  initialMessages?: any[]
) {
  const [loading, setLoading] = useState(false);
  const [fetchedDetail, setFetchedDetail] = useState<any | null>(initialDetail ?? null);
  const [coordinatorMessage, setCoordinatorMessage] = useState<string>('');

  const fetchDetails = useCallback(async () => {
    if (!requestId) return;
    setLoading(true);
    try {
      // If both initial detail and messages are provided, use them and avoid network calls
      if (initialDetail && Array.isArray(initialMessages)) {
        setFetchedDetail(initialDetail ?? null);
        const coord = initialMessages.find((m: any) => String(m.whose_message || '').toUpperCase() === 'COORDINADOR');
        setCoordinatorMessage(coord ? (coord.content || coord.message || '') : '');
        return;
      }

      // If we have only initialDetail, fetch messages/raw
      if (initialDetail && !initialMessages) {
        setFetchedDetail(initialDetail ?? null);
        const rawResp = await getRequestAsignationById(Number(requestId));
        const raw = rawResp?.data ?? rawResp ?? {};
        const messages = Array.isArray(raw?.messages) ? raw.messages : (raw?.messages || []);
        const coord = messages.find((m: any) => String(m.whose_message || '').toUpperCase() === 'COORDINADOR');
        setCoordinatorMessage(coord ? (coord.content || coord.message || '') : '');
        return;
      }

      // If we have only initialMessages, fetch form detail
      if (!initialDetail && Array.isArray(initialMessages)) {
        const formResp = await getFormRequestById(Number(requestId));
        setFetchedDetail(formResp?.data ?? null);
        const coord = initialMessages.find((m: any) => String(m.whose_message || '').toUpperCase() === 'COORDINADOR');
        setCoordinatorMessage(coord ? (coord.content || coord.message || '') : '');
        return;
      }

      // Fallback: fetch both
      const [formResp, rawResp] = await Promise.all([
        getFormRequestById(Number(requestId)),
        getRequestAsignationById(Number(requestId)),
      ]);
      setFetchedDetail(formResp?.data ?? null);

      const raw = rawResp?.data ?? rawResp ?? {};
      const messages = Array.isArray(raw?.messages) ? raw.messages : (raw?.messages || []);
      const coord = messages.find((m: any) => String(m.whose_message || '').toUpperCase() === 'COORDINADOR');
      setCoordinatorMessage(coord ? (coord.content || coord.message || '') : '');
    } catch (e) {
      console.error('Error fetching request detail in hook:', e);
      setFetchedDetail(null);
      setCoordinatorMessage('');
    } finally {
      setLoading(false);
    }
  }, [requestId, initialDetail, initialMessages]);

  useEffect(() => {
    if (!isOpen) return;
    // fetch when modal opens and requestId available
    fetchDetails();
  }, [isOpen, fetchDetails]);

  const performAction = useCallback(async (opts: { type: 'APROBADO' | 'RECHAZADO'; content: string; fecha_inicio_contrato?: string; fecha_fin_contrato?: string; }) : Promise<PerformActionResult> => {
    if (!requestId) return { success: false, error: 'No request id' };
    setLoading(true);
    try {
      // Build payload: include message fields but do NOT include `request_state`.
      // The backend tends to create an automatic "Estado actualizado a..." message
      // when `request_state` is present; that system message may have `whose_message: null`.
      // To avoid duplicate/system messages we send only the instructor message here.
      const payload: any = {
        content: opts.content,
        type_message: opts.type,
        whose_message: 'INSTRUCTOR',
      };
      if (opts.fecha_inicio_contrato) payload.fecha_inicio_contrato = opts.fecha_inicio_contrato;
      if (opts.fecha_fin_contrato) payload.fecha_fin_contrato = opts.fecha_fin_contrato;

      // Build payload for both approval and rejection according to backend contract
      const fullPayload: any = {
        content: opts.content,
        type_message: opts.type,
        whose_message: 'INSTRUCTOR',
        // As requested, always send PRE-APROBADO for request_state
        request_state: 'PRE-APROBADO',
      };
      if (opts.fecha_inicio_contrato) fullPayload.fecha_inicio_contrato = opts.fecha_inicio_contrato;
      if (opts.fecha_fin_contrato) fullPayload.fecha_fin_contrato = opts.fecha_fin_contrato;

      const resp = await patchMessageRequest(Number(requestId), fullPayload);
      return { success: true, data: resp };
    } catch (e: any) {
      console.error('Error performing action in hook:', e);
      return { success: false, error: e?.message || String(e) };
    } finally {
      setLoading(false);
    }
  }, [requestId]);

  return {
    loading,
    fetchedDetail,
    coordinatorMessage,
    fetchDetails,
    performAction,
  };
}
