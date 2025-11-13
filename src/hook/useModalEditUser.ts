import { useEffect, useState } from 'react';
import { getUserById } from '../Api/Services/User';
import { getRegionales } from '../Api/Services/Regional';
import { getSedes } from '../Api/Services/Sede';
import { getCenters } from '../Api/Services/Center';
import { getPrograms } from '../Api/Services/Program';
import { getRoles } from '../Api/Services/Rol';
import { getKnowledgeAreas } from '../Api/Services/KnowledgeArea';
import useApprenticeForm from './useApprenticeForm';
import useInstructorForm from './useInstructorForm';
import { putApprentice } from '../Api/Services/Apprentice';
import { putInstructor } from '../Api/Services/Instructor';
import { getUserById as fetchUser } from '../Api/Services/User';
import type { Regional, Sede, Center, Program, KnowledgeArea, Ficha } from '../Api/types/Modules/general.types';
import type { Role } from '../Api/types/entities/role.types';
import type { CreateApprentice } from '../Api/types/entities/apprentice.types';
import type { CreateInstructor } from '../Api/types/entities/instructor.types';

// Local loose types to avoid widespread `any` while keeping flexibility for API shapes
type LooseObj = Record<string, unknown>;

type ApprenticeAPI = LooseObj & {
  id?: number;
  ficha?: number | LooseObj | null;
  ficha_id?: number | string | null;
  programa?: LooseObj | number | null;
  program_id?: number;
  role?: number;
};

type InstructorAPI = LooseObj & {
  id?: number;
  centro?: LooseObj | number | null;
  center?: number | null;
  sede?: LooseObj | number | null;
  regional?: LooseObj | number | null;
  role?: number | null;
};

type APIUser = LooseObj & {
  apprentice?: ApprenticeAPI | null;
  instructor?: InstructorAPI | null;
  person?: LooseObj | null;
  email?: string | null;
  role?: LooseObj | null;
};

type TabType = 'aprendiz' | 'instructor';

type UseModalEditUserParams = {
  userId: string | number;
  initialTab?: TabType;
  onSuccess?: (data?: unknown) => void;
  onClose?: () => void;
};

export default function useModalEditUser({ userId, initialTab, onSuccess, onClose }: UseModalEditUserParams) {
  const [tab, setTab] = useState<TabType>(initialTab === 'aprendiz' ? 'aprendiz' : 'instructor');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');

  const [regionales, setRegionales] = useState<Regional[]>([]);
  const [sedes, setSedes] = useState<Sede[]>([]);
  const [centros, setCentros] = useState<Center[]>([]);
  const [programas, setProgramas] = useState<Program[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [areas, setAreas] = useState<KnowledgeArea[]>([]);

  const { apprentice, setApprentice, fichas, handleChange: handleAprChange } = useApprenticeForm();
  const { instructor, setInstructor, handleChange: handleInsChange } = useInstructorForm();

  const [userData, setUserData] = useState<Record<string, unknown> | null>(null);

  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingSubmit, setPendingSubmit] = useState<TabType | null>(null);

  // Load selects
  useEffect(() => {
    getRegionales().then(setRegionales).catch(() => setRegionales([]));
    getSedes().then(setSedes).catch(() => setSedes([]));
    getCenters().then(setCentros).catch(() => setCentros([]));
    getPrograms().then(setProgramas).catch(() => setProgramas([]));
    getRoles().then(setRoles).catch(() => setRoles([]));
    getKnowledgeAreas().then(setAreas).catch(() => setAreas([]));
  }, []);

  // Safe accessor
  const getObjProp = <T = unknown>(obj: unknown, key: string): T | undefined => {
    if (!obj || typeof obj !== 'object') return undefined;
    const o = obj as Record<string, unknown>;
    return o[key] as T | undefined;
  };

  // Load and normalize user
  useEffect(() => {
    setLoading(true);
    setError('');
    fetchUser(String(userId))
      .then((data: APIUser) => {
        setUserData(data);
        if (data.apprentice) {
          setTab('aprendiz');
          const ap = data.apprentice as ApprenticeAPI;
          let ficha_id = '';
          let ficha_obj: Ficha | null = null;
          const fichaField = ap.ficha ?? ap.ficha_id;
          if (fichaField && typeof fichaField === 'object') {
            ficha_id = String(getObjProp<number>(fichaField, 'id') ?? '');
            ficha_obj = fichaField as unknown as Ficha;
          } else if (typeof fichaField === 'number') {
            ficha_id = String(fichaField);
          } else if (ap.ficha_id) {
            ficha_id = String(ap.ficha_id);
          }
          setApprentice(prev => ({ ...(prev as unknown as Record<string, unknown>), ...(ap as Record<string, unknown>), ...(data.person as Record<string, unknown>), email: (data.email as string) ?? '', program: getObjProp<number>(ap.programa as LooseObj ?? {}, 'id') || ap.program_id || ap.program_id || 0, programa_obj: (ap.programa as unknown as Program) || null, ficha_id, ficha_obj } as unknown as CreateApprentice));
        } else if (data.instructor) {
          const ins = data.instructor as InstructorAPI;
          setTab('instructor');
          setInstructor(prev => ({ ...(prev as unknown as Record<string, unknown>), ...(ins as Record<string, unknown>), ...(data.person as Record<string, unknown>), email: (data.email as string) ?? '', role: getObjProp<number>(data.role as LooseObj ?? {}, 'id') || ins.role || 0, knowledge_area: getObjProp<number>(ins, 'knowledge_area') || getObjProp<number>(ins, 'knowledgeArea') || 0, center: getObjProp<number>(ins.centro as LooseObj ?? {}, 'id') || ins.center || getObjProp<number>(ins, 'center_id') || 0, sede: getObjProp<number>(ins.sede as LooseObj ?? {}, 'id') || ins.sede || getObjProp<number>(ins, 'sede_id') || 0, regional: getObjProp<number>(ins.regional as LooseObj ?? {}, 'id') || ins.regional || getObjProp<number>(ins, 'regional_id') || 0, centro_obj: (ins.centro as unknown as Center) || null, sede_obj: (ins.sede as unknown as Sede) || null, regional_obj: (ins.regional as unknown as Regional) || null, contract_type: (ins.contract_type as string) || (ins.contractType as string) || '', is_followup_instructor: (ins.is_followup_instructor as boolean) ?? false } as unknown as CreateInstructor));
        }
      })
      .catch(() => setError('Error al cargar usuario'))
      .finally(() => setLoading(false));
  }, [userId, setApprentice, setInstructor]);

  // dependent selects for instructor
  useEffect(() => {
    if (tab === 'instructor' && instructor) {
      const filteredCenters = centros.filter((c: Center) => c.regional === instructor.regional);
      if (instructor.center && !filteredCenters.some((c: Center) => c.id === instructor.center)) {
        setInstructor(prev => prev ? { ...prev, center_id: 0, sede_id: 0 } : prev);
      }
      const filteredSedes = sedes.filter((s: Sede) => s.center === instructor.center);
      if (instructor.sede && !filteredSedes.some((s: Sede) => s.id === instructor.sede)) {
        setInstructor(prev => prev ? { ...prev, sede_id: 0 } : prev);
      }
    }
  }, [tab, instructor, centros, sedes, setInstructor]);

  // validations
  const validateApprenticeLocal = (data: unknown) => {
    const obj = data as LooseObj;
    const has = (k: string) => {
      const v = obj[k];
      return v !== undefined && v !== null && String(v).trim() !== '';
    };
    if (!has('type_identification') || !has('number_identification') || !has('first_name') || !has('first_last_name') || !has('phone_number') || !has('email') || (!has('program') && !has('program_id')) || !has('ficha_id')) {
      return 'Todos los campos con * son obligatorios.';
    }
    if (isNaN(Number(obj['number_identification']))) return 'El número de documento debe ser numérico.';
    if (!/^[0-9]{10}$/.test(String(obj['phone_number']))) return 'El teléfono debe tener 10 dígitos.';
    if (!String(obj['email']).endsWith('@soy.sena.edu.co')) return 'El correo de aprendiz debe terminar en @soy.sena.edu.co';
    return null;
  };

  const validateInstructorLocal = (data: unknown) => {
    const obj = data as LooseObj;
    const present = (v: unknown) => {
      if (v === null || v === undefined) return false;
      if (typeof v === 'string') return v.trim() !== '';
      return true;
    };
    const getFirst = (o: LooseObj, keys: string[]) => {
      for (const k of keys) if (Object.prototype.hasOwnProperty.call(o, k)) return o[k];
      return undefined;
    };
    if (
      !present(obj['type_identification']) ||
      !present(obj['number_identification']) ||
      !present(obj['first_name']) ||
      !present(obj['first_last_name']) ||
      !present(obj['phone_number']) ||
      !present(obj['email']) ||
      !present(getFirst(obj, ['role_id', 'role'])) ||
      !present(getFirst(obj, ['contractType', 'contract_type'])) ||
      !present(getFirst(obj, ['contractStartDate', 'contract_start_date'])) ||
      !present(getFirst(obj, ['contractEndDate', 'contract_end_date'])) ||
      !present(getFirst(obj, ['knowledgeArea', 'knowledge_area'])) ||
      !present(getFirst(obj, ['center_id', 'center'])) ||
      !present(getFirst(obj, ['sede_id', 'sede'])) ||
      !present(getFirst(obj, ['regional_id', 'regional']))
    ) {
      return 'Todos los campos son obligatorios excepto segundo nombre y segundo apellido.';
    }
    if (isNaN(Number(obj['number_identification']))) return 'El número de documento debe ser numérico.';
    if (!/^[0-9]{10}$/.test(String(obj['phone_number']))) return 'El teléfono debe tener 10 dígitos.';
    if (!String(obj['email']).endsWith('@sena.edu.co')) return 'El correo de instructor debe terminar en @sena.edu.co';
    return null;
  };

  const getBackendErrorMsg = (err: unknown) => {
    const e = err as LooseObj & { response?: { data?: unknown }; detail?: string; error?: string; message?: string };
    if (e?.response?.data) {
      if (typeof e.response.data === 'string') return e.response.data;
      const d = e.response.data as LooseObj;
      if (d?.detail) return d.detail as string;
      if (d?.error) return d.error as string;
      if (d?.message) return d.message as string;
      try {
        return Object.values(d).join(' ');
      } catch (err2) {
        return String(d);
      }
    }
    if (e?.detail) return e.detail;
    if (e?.error) return e.error;
    if (e?.message) return e.message;
    return 'Error al actualizar usuario';
  };

  const startSubmit = (tipo: TabType) => {
    setPendingSubmit(tipo);
    setShowConfirm(true);
  };

  const confirmSubmit = async () => {
    setShowConfirm(false);
    setLoading(true);
    setError('');
    if (pendingSubmit === 'aprendiz' && apprentice) {
      const errMsg = validateApprenticeLocal(apprentice);
      if (errMsg) {
        setError(errMsg);
        setLoading(false);
        setPendingSubmit(null);
        setNotificationMessage(errMsg);
        setShowNotification(true);
        return;
      }
      const nombres = apprentice.first_name.trim().split(' ');
      const apellidos = apprentice.first_last_name.trim().split(' ');
      const payload = {
        ...apprentice,
        first_name: nombres[0] || '',
        second_name: nombres.slice(1).join(' '),
        first_last_name: apellidos[0] || '',
        second_last_name: apellidos.slice(1).join(' '),
        role_id: getObjProp<number>(userData?.role, 'id') || getObjProp<number>(userData?.apprentice, 'role_id') || 0,
        program_id: Number(apprentice.program),
        ficha_id: String(apprentice.ficha_id ?? ''),
      };
      const apprenticeId = getObjProp<number>(userData?.apprentice, 'id') ?? userId;
      try {
        console.debug('PUT apprentice payload (pre-send)', payload);
        const apiPayload = {
          type_identification: String(payload.type_identification || ''),
          number_identification: String(payload.number_identification || ''),
          first_name: String(payload.first_name || ''),
          second_name: String(payload.second_name || ''),
          first_last_name: String(payload.first_last_name || ''),
          second_last_name: String(payload.second_last_name || ''),
          phone_number: String(payload.phone_number || ''),
          email: String(payload.email || ''),
          program: Number(payload.program_id || payload.program || 0),
          ficha: Number(payload.ficha_id ?? 0),
          ficha_id: String(payload.ficha_id ?? ''),
          role: Number(payload.role_id || payload.role || 0),
        };
        console.debug('PUT apprentice payload (for API)', apiPayload);
        const putResult = await putApprentice(String(apprenticeId), apiPayload as unknown as CreateApprentice);
        console.debug('PUT apprentice response', putResult);
        try {
          const refreshedUser = await getUserById(String(apprenticeId));
          if (refreshedUser && typeof refreshedUser === 'object') {
            const refreshedApprentice = refreshedUser.apprentice || null;
            const refreshedPerson = refreshedUser.person || null;
            if (refreshedApprentice) {
              const ra = refreshedApprentice as unknown as Record<string, unknown>;
              let fichaIdVal: string | number | undefined = undefined;
              let fichaObj: Ficha | null = null;
              if (ra['ficha_id'] !== undefined && ra['ficha_id'] !== null) {
                fichaIdVal = ra['ficha_id'] as string | number;
              } else if (ra['ficha'] !== undefined && ra['ficha'] !== null) {
                const fichaField = ra['ficha'];
                if (typeof fichaField === 'object') {
                  const fichaObjCandidate = fichaField as unknown as Ficha;
                  fichaIdVal = fichaObjCandidate.id as number | string;
                  fichaObj = fichaObjCandidate;
                } else {
                  fichaIdVal = fichaField as string | number;
                }
              }
              const normalizedAp: Record<string, unknown> = { ...(ra as Record<string, unknown>) };
              if (fichaIdVal !== undefined) normalizedAp['ficha_id'] = String(fichaIdVal);
              if (fichaObj) normalizedAp['ficha_obj'] = fichaObj;
              setApprentice(prev => prev ? ({ ...prev, ...(normalizedAp as unknown as Partial<CreateApprentice & { programa_obj?: Program | null; ficha_obj?: Ficha | null; }>) }) : (normalizedAp as unknown as CreateApprentice & { programa_obj?: Program | null; ficha_obj?: Ficha | null; }));
            }
            if (refreshedPerson) {
              setUserData(prev => prev ? ({ ...prev, person: refreshedPerson, apprentice: refreshedApprentice || prev?.apprentice }) : ({ ...refreshedUser }));
            } else {
              setUserData(prev => prev ? ({ ...prev, apprentice: refreshedApprentice || prev?.apprentice }) : ({ ...refreshedUser }));
            }
            try { if (onSuccess) onSuccess(refreshedUser); } catch (ex) { console.debug('onSuccess callback error', ex); }
          }
        } catch (reFetchErr) {
          console.debug('Error refetching user after apprentice PUT', reFetchErr);
        }
      } catch (err) {
        const backendMsg = getBackendErrorMsg(err);
        setError(backendMsg);
        setLoading(false);
        setPendingSubmit(null);
        setNotificationMessage(backendMsg);
        setShowNotification(true);
        return;
      }
    } else if (pendingSubmit === 'instructor' && instructor) {
      const errMsg = validateInstructorLocal(instructor);
      if (errMsg) {
        setError(errMsg);
        setLoading(false);
        setPendingSubmit(null);
        setNotificationMessage(errMsg);
        setShowNotification(true);
        return;
      }
      const nombres = instructor.first_name.trim().split(' ');
      const apellidos = instructor.first_last_name.trim().split(' ');
      const payload = {
        first_name: nombres[0] || '',
        second_name: nombres.slice(1).join(' '),
        first_last_name: apellidos[0] || '',
        second_last_name: apellidos.slice(1).join(' '),
        phone_number: String(instructor.phone_number || ''),
        type_identification: Number(instructor.type_identification),
        number_identification: String(instructor.number_identification || ''),
        email: String(instructor.email || ''),
        role_id: Number(instructor.role || 0),
        contract_type: String(instructor.contract_type || ''),
        contract_start_date: String(instructor.contract_start_date || ''),
        contract_end_date: String(instructor.contract_end_date || ''),
        knowledge_area_id: Number(instructor.knowledge_area || 0),
        center_id: Number(instructor.center || 0),
        sede_id: Number(instructor.sede || 0),
        regional_id: Number(instructor.regional || 0),
        is_followup_instructor: Boolean(instructor.is_followup_instructor),
      };
      console.debug('PUT instructor payload', payload);
      const instructorId = getObjProp<number>(userData?.instructor, 'id') ?? userId;
      try {
        const putResult = await putInstructor(String(instructorId), payload as unknown as CreateInstructor);
        console.debug('PUT instructor response', putResult);
        try {
          const refreshedUser = await getUserById(String(instructorId));
          if (refreshedUser && typeof refreshedUser === 'object') {
            const refreshedInstructor = refreshedUser.instructor || null;
            const refreshedPerson = refreshedUser.person || null;
            if (refreshedInstructor) setInstructor(prev => prev ? ({ ...prev, ...(refreshedInstructor as CreateInstructor) }) : (refreshedInstructor as CreateInstructor));
            if (refreshedPerson) {
              setUserData(prev => prev ? ({ ...prev, person: refreshedPerson, instructor: refreshedInstructor || prev?.instructor }) : ({ ...refreshedUser }));
            } else {
              setUserData(prev => prev ? ({ ...prev, instructor: refreshedInstructor || prev?.instructor }) : ({ ...refreshedUser }));
            }
            try { if (onSuccess) onSuccess(refreshedUser); } catch (ex) { console.debug('onSuccess callback error', ex); }
          }
        } catch (reFetchErr) {
          console.debug('Error refetching user after PUT', reFetchErr);
        }
      } catch (err) {
        const backendMsg = getBackendErrorMsg(err);
        setError(backendMsg);
        setLoading(false);
        setPendingSubmit(null);
        setNotificationMessage(backendMsg);
        setShowNotification(true);
        return;
      }
    }

    if (onSuccess) onSuccess();
    if (onClose) onClose();
    setLoading(false);
    setPendingSubmit(null);
  };

  return {
    tab,
    setTab,
    loading,
    error,
    showNotification,
    setShowNotification,
    notificationMessage,
    setNotificationMessage,
    regionales,
    sedes,
    centros,
    programas,
    roles,
    areas,
    fichas,
    apprentice,
    instructor,
    setApprentice,
    setInstructor,
    handleAprChange,
    handleInsChange,
    userData,
    showConfirm,
    setShowConfirm,
    pendingSubmit,
    setPendingSubmit,
    startSubmit,
    confirmSubmit,
    validateApprentice: validateApprenticeLocal,
    validateInstructor: validateInstructorLocal,
  };
}
