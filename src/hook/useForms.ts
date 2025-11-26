import { useCallback, useEffect, useState } from 'react';
import { getForms, postForm, filterForms } from '../Api/Services/Form';
import { Form as FormType } from '../Api/types/entities/form.types';

interface UseFormsResult {
  forms: FormType[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  createForm: (data: Partial<FormType>) => Promise<void>;
  applyFilter: (params: { search?: string; active?: string }) => Promise<void>;
}

export default function useForms(): UseFormsResult {
  const [forms, setForms] = useState<FormType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getForms();
      setForms(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const refresh = useCallback(async () => {
    await fetchAll();
  }, [fetchAll]);

  const createForm = useCallback(async (data: Partial<FormType>) => {
    setLoading(true);
    try {
      await postForm(data);
      await fetchAll();
    } finally {
      setLoading(false);
    }
  }, [fetchAll]);

  const applyFilter = useCallback(async (params: { search?: string; active?: string }) => {
    setLoading(true);
    setError(null);
    try {
      const data = await filterForms(params);
      setForms(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  return { forms, loading, error, refresh, createForm, applyFilter };
}
