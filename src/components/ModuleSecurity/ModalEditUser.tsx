import React, { useState, useEffect } from 'react';
import NotificationModal from '../NotificationModal';
import { putApprentice } from '../../Api/Services/Apprentice';
import { putInstructor } from '../../Api/Services/Instructor';
import { getUserById } from '../../Api/Services/User';
import { getRegionales } from '../../Api/Services/Regional';
import { getSedes } from '../../Api/Services/Sede';
import { getCenters } from '../../Api/Services/Center';
import { getPrograms, getProgramFichas } from '../../Api/Services/Program';
import { getRoles } from '../../Api/Services/Rol';
import { getKnowledgeAreas } from '../../Api/Services/KnowledgeArea';
import ConfirmModal from '../ConfirmModal';
import CustomSelect from '../CustomSelect';
import { useDocumentTypes } from '../../hook/useDocumentTypes';
import { useContractTypes } from '../../hook/useContractTypes';
import type { Regional, Sede, Center, Program, KnowledgeArea, Ficha } from '../../Api/types/Modules/general.types';
import type { Role } from '../../Api/types/entities/role.types';
import type { CreateApprentice } from '../../Api/types/entities/apprentice.types';
import type { CreateInstructor } from '../../Api/types/entities/instructor.types';

/**
 * Validations for learner (aprendiz)
 * @param data - Learner data to validate
 * @returns Error message if validation fails, null otherwise
 */
const validateApprentice = (data) => {
  if (!data.type_identification || !data.number_identification || !data.first_name || !data.first_last_name || !data.phone_number || !data.email || !data.program_id || !data.ficha_id) {
    return 'Todos los campos con * son obligatorios.';
  }
  if (isNaN(Number(data.number_identification))) {
    return 'El número de documento debe ser numérico.';
  }
  if (!/^[0-9]{10}$/.test(data.phone_number)) {
    return 'El teléfono debe tener 10 dígitos.';
  }
  if (!data.email.endsWith('@soy.sena.edu.co')) {
    return 'El correo de aprendiz debe terminar en @soy.sena.edu.co';
  }
  return null;
};

/**
 * Validations for instructor
 * @param data - Instructor data to validate
 * @returns Error message if validation fails, null otherwise
 */
const validateInstructor = (data) => {
  // helper: accept snake_case or camelCase and consider non-empty strings as present
  const present = (v) => {
    if (v === null || v === undefined) return false;
    if (typeof v === 'string') return v.trim() !== '';
    return true;
  };
  const getFirst = (obj, keys) => {
    for (const k of keys) {
      if (Object.prototype.hasOwnProperty.call(obj, k)) return obj[k];
    }
    return undefined;
  };

  if (
    !present(data.type_identification) ||
    !present(data.number_identification) ||
    !present(data.first_name) ||
    !present(data.first_last_name) ||
    !present(data.phone_number) ||
    !present(data.email) ||
    !present(getFirst(data, ['role_id', 'role'])) ||
    !present(getFirst(data, ['contractType', 'contract_type'])) ||
    !present(getFirst(data, ['contractStartDate', 'contract_start_date'])) ||
    !present(getFirst(data, ['contractEndDate', 'contract_end_date'])) ||
    !present(getFirst(data, ['knowledgeArea', 'knowledge_area'])) ||
    !present(getFirst(data, ['center_id', 'center'])) ||
    !present(getFirst(data, ['sede_id', 'sede'])) ||
    !present(getFirst(data, ['regional_id', 'regional']))
  ) {
    return 'Todos los campos son obligatorios excepto segundo nombre y segundo apellido.';
  }
  if (isNaN(Number(data.number_identification))) {
    return 'El número de documento debe ser numérico.';
  }
  if (!/^[0-9]{10}$/.test(data.phone_number)) {
    return 'El teléfono debe tener 10 dígitos.';
  }
  if (!data.email.endsWith('@sena.edu.co')) {
    return 'El correo de instructor debe terminar en @sena.edu.co';
  }
  return null;
};

const ModalEditUser = ({ userId, userRole, onClose, onSuccess }) => {
  // userRole: string ('aprendiz' o cualquier otro rol)
  const [tab, setTab] = useState<'aprendiz' | 'instructor'>(userRole === 'aprendiz' ? 'aprendiz' : 'instructor');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const { documentTypes } = useDocumentTypes();
  const { contractTypes } = useContractTypes();
  const documentTypesOptions = documentTypes.filter(opt => opt.id !== '').map(opt => ({ value: String(opt.id), label: String(opt.name) }));
  const contractTypesOptions = contractTypes.filter(opt => opt.id !== '').map(opt => ({ value: String(opt.id), label: String(opt.name) }));

  // State for dynamic selects
  const [regionales, setRegionales] = useState<Regional[]>([]);
  const [sedes, setSedes] = useState<Sede[]>([]);
  const [centros, setCentros] = useState<Center[]>([]);
  const [programas, setProgramas] = useState<Program[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [areas, setAreas] = useState<KnowledgeArea[]>([]);
  const [fichas, setFichas] = useState<Ficha[]>([]);

  // State for complete user data
  const [userData, setUserData] = useState(null);
  // states for aprendiz and instructor forms data
  const [apprentice, setApprentice] = useState<(
    CreateApprentice & {
      programa_obj?: Program | null;
      ficha_obj?: Ficha | null;
      ficha_id?: string | number;
      program_id?: string | number;
    }
  ) | null>(null);
  const [instructor, setInstructor] = useState<(CreateInstructor & {
    regional_obj?: Regional | null;
    centro_obj?: Center | null;
    sede_obj?: Sede | null;
  }) | null>(null);

  // For dependent selects
  // For dependent selects: now filtered directly in render

  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingSubmit, setPendingSubmit] = useState<'aprendiz' | 'instructor' | null>(null);

  useEffect(() => {
    // Load select data on modal mount
    getRegionales().then(setRegionales).catch(() => setRegionales([]));
    getSedes().then(setSedes).catch(() => setSedes([]));
    getCenters().then(setCentros).catch(() => setCentros([]));
    getPrograms().then(setProgramas).catch(() => setProgramas([]));
    getRoles().then(setRoles).catch(() => setRoles([]));
    getKnowledgeAreas().then(setAreas).catch(() => setAreas([]));
  }, []);

  // Load complete user data when opening modal
  useEffect(() => {
    setLoading(true);
    setError('');
    import('../../Api/Services/User').then(({ getUserById }) => {
      getUserById(userId)
        .then(data => {
          setUserData(data);
          if (data.apprentice) {
            setTab('aprendiz');
            let ficha_id = '';
            let ficha_obj = null;
            // Si ficha es un objeto
            if (data.apprentice.ficha && typeof data.apprentice.ficha === 'object') {
              ficha_id = data.apprentice.ficha.id ? String(data.apprentice.ficha.id) : '';
              ficha_obj = data.apprentice.ficha;
            } else if (typeof data.apprentice.ficha === 'number') {
              ficha_id = String(data.apprentice.ficha);
            } else if (data.apprentice.ficha_id) {
              ficha_id = String(data.apprentice.ficha_id);
            }
            setApprentice({
              ...data.apprentice,
              ...data.person,
              email: data.email,
              program_id: data.apprentice.programa?.id || data.apprentice.program_id || 0,
              programa_obj: data.apprentice.programa || null,
              ficha_id,
              ficha_obj,
            });
          } else if (data.instructor) {
            setTab('instructor');
            setInstructor({
              ...data.instructor,
              ...data.person,
              email: data.email,
              // Normalize numeric fields for selects
              role: data.role?.id || data.instructor.role || 0,
              knowledge_area: data.instructor.knowledge_area || data.instructor.knowledgeArea || 0,
              center: data.instructor.centro?.id || data.instructor.center || data.instructor.center_id || 0,
              sede: data.instructor.sede?.id || data.instructor.sede || data.instructor.sede_id || 0,
              regional: data.instructor.regional?.id || data.instructor.regional || data.instructor.regional_id || 0,
              centro_obj: data.instructor.centro || null,
              sede_obj: data.instructor.sede || null,
              regional_obj: data.instructor.regional || null,
              contract_type: data.instructor.contract_type || data.instructor.contractType || "",
              is_followup_instructor: data.instructor.is_followup_instructor ?? false,
            });
          }
        })
        .catch(() => setError('Error al cargar usuario'))
        .finally(() => setLoading(false));
    });
  }, [userId]);

  // Update fichas when selected program changes (only for apprentice)
  const prevProgramIdRef = React.useRef<number | undefined>(undefined);
  useEffect(() => {
    if (tab === 'aprendiz' && apprentice && apprentice.program_id && prevProgramIdRef.current !== Number(apprentice.program_id)) {
      prevProgramIdRef.current = Number(apprentice.program_id);
      getProgramFichas(apprentice.program_id)
        .then(fichasApi => {
          setFichas(fichasApi);
          setApprentice(prev => {
            if (!prev) return prev;
            const fichaValida = fichasApi.some(f => String(f.id) === String(prev.ficha_id));
            return fichaValida ? prev : { ...prev, ficha_id: '' };
          });
        })
        .catch(() => setFichas([]));
    } else if (tab !== 'aprendiz' || !apprentice?.program_id) {
      setFichas([]);
      prevProgramIdRef.current = undefined;
    }
  }, [tab, apprentice]);

  // When instructor loads, ensure dependent selects are updated
  useEffect(() => {
    if (tab === 'instructor' && instructor) {
      // Filter centers based on selected regional
      const filteredCenters = centros.filter(c => c.regional === instructor.regional);
      if (instructor.center && !filteredCenters.some(c => c.id === instructor.center)) {
        setInstructor(prev => prev ? { ...prev, center_id: 0, sede_id: 0 } : prev);
      }

      // Filter sedes based on selected center
      const filteredSedes = sedes.filter(s => s.center === instructor.center);
      if (instructor.sede && !filteredSedes.some(s => s.id === instructor.sede)) {
        setInstructor(prev => prev ? { ...prev, sede_id: 0 } : prev);
      }
    }
  }, [tab, instructor, centros, sedes]);

  const handleChange = (e, tipo) => {
    const { name, value } = e.target;
    if (tipo === 'aprendiz') {
      setApprentice(prev => prev ? { ...prev, [name]: value } : prev);
    } else {
      setInstructor(prev => prev ? { ...prev, [name]: value } : prev);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setPendingSubmit(tab);
    setShowConfirm(true);
  };

  const handleConfirm = async () => {
    setShowConfirm(false);
    setLoading(true);
    setError('');
    let errorMsg = null;

    // Función para extraer el mensaje del backend
    const getBackendErrorMsg = (err) => {
      // Axios error
      if (err?.response?.data) {
        if (typeof err.response.data === 'string') {
          return err.response.data;
        } else if (err.response.data.detail) {
          return err.response.data.detail;
        } else if (err.response.data.error) {
          return err.response.data.error;
        } else if (err.response.data.message) {
          return err.response.data.message;
        } else {
          return Object.values(err.response.data).join(' ');
        }
      }
      // Native fetch error (sometimes error is directly the response json)
      if (err?.detail) {
        return err.detail;
      }
      if (err?.error) {
        return err.error;
      }
      if (err?.message) {
        return err.message;
      }
      return 'Error al actualizar usuario';
    };

    if (pendingSubmit === 'aprendiz' && apprentice) {
      errorMsg = validateApprentice(apprentice);
      if (errorMsg) {
        setError(errorMsg);
        setLoading(false);
        setPendingSubmit(null);
        setNotificationMessage(errorMsg);
        setShowNotification(true);
        return;
      }
      // Split first and last names
      const nombres = apprentice.first_name.trim().split(' ');
      const apellidos = apprentice.first_last_name.trim().split(' ');
      const payload = {
        ...apprentice,
        first_name: nombres[0] || '',
        second_name: nombres.slice(1).join(' '),
        first_last_name: apellidos[0] || '',
        second_last_name: apellidos.slice(1).join(' '),
        role_id: userData?.role?.id || userData?.apprentice?.role_id || 0,
        program_id: Number(apprentice.program_id),
        ficha_id: String(apprentice.ficha_id ?? ''),
      };
      // Use learner id if available
      const apprenticeId = userData?.apprentice?.id ? userData.apprentice.id : userId;
      try {
        // Debug payload to inspect what is being sent to the server
        console.debug('PUT apprentice payload (pre-send)', payload);
        // Build minimal API payload matching CreateApprentice shape
        const apiPayload = {
          type_identification: String(payload.type_identification || ''),
          number_identification: String(payload.number_identification || ''),
          first_name: String(payload.first_name || ''),
          second_name: String(payload.second_name || ''),
          first_last_name: String(payload.first_last_name || ''),
          second_last_name: String(payload.second_last_name || ''),
          phone_number: String(payload.phone_number || ''),
          email: String(payload.email || ''),
          // CreateApprentice expects `program` (not program_id)
          program: Number(payload.program_id || payload.program || 0),
          // Include both `ficha` (numeric) and `ficha_id` (string) so we satisfy whichever field the API expects
          ficha: Number(payload.ficha_id ?? 0),
          ficha_id: String(payload.ficha_id ?? ''),
          // Role field name expected is `role`
          role: Number(payload.role_id || payload.role || 0),
        };
        console.debug('PUT apprentice payload (for API)', apiPayload);
        const putResult = await putApprentice(String(apprenticeId), apiPayload as unknown as CreateApprentice); console.debug('PUT apprentice response', putResult);
        // Re-fetch full user to verify persistence and update UI
        try {
          const refreshedUser = await getUserById(String(apprenticeId));
          console.debug('Refetched user after apprentice PUT', refreshedUser);
          if (refreshedUser && typeof refreshedUser === 'object') {
            const refreshedApprentice = refreshedUser.apprentice || null;
            const refreshedPerson = refreshedUser.person || null;
            if (refreshedApprentice) {
              // Normalize refreshed apprentice: backend may return ficha or ficha_id or ficha object
              const ra = refreshedApprentice as unknown as Record<string, unknown>;
              let fichaIdVal: string | number | undefined = undefined;
              let fichaObj: Ficha | null = null;
              if (ra['ficha_id'] !== undefined && ra['ficha_id'] !== null) {
                fichaIdVal = ra['ficha_id'] as string | number;
              } else if (ra['ficha'] !== undefined && ra['ficha'] !== null) {
                const fichaField = ra['ficha'];
                if (typeof fichaField === 'object') {
                  const fichaObjCandidate = fichaField as unknown as Ficha;
                  fichaIdVal = fichaObjCandidate.id as number | string; // id exists on Ficha
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
            try {
              if (onSuccess) onSuccess(refreshedUser);
            } catch (callErr) {
              console.debug('onSuccess callback threw', callErr);
            }
          }
        } catch (reFetchErr) {
          console.debug('Error refetching user after apprentice PUT', reFetchErr);
        }
      } catch (err) {
        console.log('Error recibido:', err);
        if (err && typeof err === 'object') {
          Object.keys(err).forEach(key => {
            console.log('Error key:', key, 'value:', err[key]);
          });
        }
        const backendMsg = getBackendErrorMsg(err);
        setError(backendMsg);
        setLoading(false);
        setPendingSubmit(null);
        setNotificationMessage(backendMsg);
        setShowNotification(true);
        return;
      }
    } else if (pendingSubmit === 'instructor' && instructor) {
      errorMsg = validateInstructor(instructor);
      if (errorMsg) {
        setError(errorMsg);
        setLoading(false);
        setPendingSubmit(null);
        setNotificationMessage(errorMsg);
        setShowNotification(true);
        return;
      }
      // Split first and last names for instructor
      const nombres = instructor.first_name.trim().split(' ');
      const apellidos = instructor.first_last_name.trim().split(' ');
      // Build payload matching CreateInstructor shape (use *_id fields for relations)
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
      // Debug: log payload
      console.debug('PUT instructor payload', payload);
      // Use instructor id if available
      const instructorId = userData?.instructor?.id ? userData.instructor.id : userId;
      try {
        const putResult = await putInstructor(String(instructorId), payload as unknown as CreateInstructor);
        console.debug('PUT instructor response', putResult);
        // Re-fetch full user to verify persistence (UI renders using getUserById)
        try {
          const refreshedUser = await getUserById(String(instructorId));
          console.debug('Refetched user after PUT', refreshedUser);
          // Merge refreshed instructor and person into local state so modal shows updated values
          if (refreshedUser && typeof refreshedUser === 'object') {
            const refreshedInstructor = refreshedUser.instructor || null;
            const refreshedPerson = refreshedUser.person || null;
            if (refreshedInstructor) {
              setInstructor(prev => prev ? ({ ...prev, ...(refreshedInstructor as CreateInstructor) }) : (refreshedInstructor as CreateInstructor));
            }
            if (refreshedPerson) {
              setUserData(prev => prev ? ({ ...prev, person: refreshedPerson, instructor: refreshedInstructor || prev?.instructor }) : ({ ...refreshedUser }));
            } else {
              setUserData(prev => prev ? ({ ...prev, instructor: refreshedInstructor || prev?.instructor }) : ({ ...refreshedUser }));
            }
            // Inform parent with refreshed data if onSuccess accepts it
            try {
              if (onSuccess) onSuccess(refreshedUser);
            } catch (callErr) {
              // ignore if parent doesn't expect an argument
            }
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className={`bg-white rounded-xl p-6 w-full max-w-lg shadow-lg relative ${tab === 'instructor' ? 'max-h-[90vh] overflow-y-auto' : ''}`}>
        <h2 className="text-xl font-bold mb-4">Editar Usuario-Sena</h2>
        <form onSubmit={handleSubmit}>
          {tab === 'aprendiz' && apprentice ? (
            <div className="grid grid-cols-2 gap-5">
              {/* the campo rol id not remplace and edit*/}
              <div>
                <label className="block text-sm">Tipo de documento <span className="text-red-600">*</span></label>
                <CustomSelect
                  value={apprentice.type_identification ? String(apprentice.type_identification) : ""}
                  onChange={value => setApprentice(prev => prev ? { ...prev, type_identification: value } : prev)}
                  options={documentTypesOptions}
                  placeholder="Seleccionar ..."
                  classNames={{
                    trigger: "w-full border rounded-lg px-2 py-2 text-xs flex items-center justify-between bg-white",
                    label: "hidden",
                  }}
                />
              </div>
              <div>
                <label className="block text-sm">Número de documento <span className="text-red-600">*</span></label>
                <input name="number_identification" value={apprentice.number_identification} onChange={e => handleChange(e, 'aprendiz')} className="w-full border rounded-lg px-2 py-1 placeholder:text-xs" placeholder="ej: 12324224" />
              </div>
              <div>
                <label className="block text-sm">Nombres <span className="text-red-600">*</span></label>
                <input name="first_name" value={apprentice.first_name} onChange={e => handleChange(e, 'aprendiz')} className="w-full border rounded-lg px-2 py-1 placeholder:text-xs" placeholder="Nombres completos" />
              </div>
              <div>
                <label className="block text-sm">Apellidos <span className="text-red-600">*</span></label>
                <input name="first_last_name" value={apprentice.first_last_name} onChange={e => handleChange(e, 'aprendiz')} className="w-full border rounded-lg px-2 py-1 placeholder:text-xs" placeholder="Apellidos completos" />
              </div>
              <div>
                <label className="block text-sm">Correo Electrónico <span className="text-red-600">*</span></label>
                <input name="email" value={apprentice.email} onChange={e => handleChange(e, 'aprendiz')} className="w-full border rounded-lg px-2 py-1 placeholder:text-xs" placeholder="ej: ejemplo@soy.sena.edu.co" />
              </div>
              <div>
                <label className="block text-sm">Teléfono <span className="text-red-600">*</span></label>
                <input
                  type="tel"
                  inputMode="numeric"
                  pattern="\d*"
                  name="phone_number"
                  value={apprentice.phone_number}
                  onChange={e => {
                    const onlyNumbers = e.target.value.replace(/\D/g, '');
                    setApprentice(prev => prev ? { ...prev, phone_number: onlyNumbers } : prev);
                  }}
                  className="w-full border rounded-lg px-2 py-1 placeholder:text-xs"
                  placeholder="ej: 3102936537"
                  maxLength={10}
                />
              </div>
              <div>
                <label className="block text-sm">Programa de formación <span className="text-red-600">*</span></label>
                <CustomSelect
                  value={apprentice.programa_obj ? String(apprentice.programa_obj.id) : (apprentice.program_id ? String(apprentice.program_id) : "")}
                  onChange={value => setApprentice(prev => prev ? { ...prev, program_id: Number(value), programa_obj: programas.find(p => p.id === Number(value)) || null, ficha_id: '' } : prev)}
                  options={programas.filter(opt => opt.active).map(opt => ({ value: String(opt.id), label: String(opt.name) }))}
                  placeholder="Seleccionar ..."
                  classNames={{
                    trigger: "w-full border rounded-lg px-2 py-2 text-xs flex items-center justify-between bg-white",
                    label: "hidden",
                  }}
                />
              </div>
              <div>
                <label className="block text-sm">Ficha <span className="text-red-600">*</span></label>
                <CustomSelect
                  value={apprentice.ficha_id ? String(apprentice.ficha_id) : ""}
                  onChange={value => setApprentice(prev => prev ? { ...prev, ficha_id: value } : prev)}
                  options={fichas.filter(opt => opt.active).map(opt => ({ value: String(opt.id), label: String(opt.file_number || opt.id) }))}
                  placeholder="Seleccionar ..."
                  classNames={{
                    trigger: "w-full border rounded-lg px-2 py-2 text-xs flex items-center justify-between bg-white",
                    label: "hidden",
                  }}
                />
              </div>
            </div>
          ) : tab === 'instructor' && instructor ? (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm">Tipo de documento <span className="text-red-600">*</span></label>
                <CustomSelect
                  value={instructor.type_identification ? String(instructor.type_identification) : ""}
                  onChange={value => setInstructor(prev => prev ? { ...prev, type_identification: Number(value) } : prev)}
                  options={documentTypesOptions}
                  placeholder="Seleccionar ..."
                  classNames={{
                    trigger: "w-full border rounded-lg px-2 py-2 text-xs flex items-center justify-between bg-white",
                    label: "hidden",
                  }}
                />
              </div>
              <div>
                <label className="block text-sm">Número de documento <span className="text-red-600">*</span></label>
                <input name="number_identification" value={instructor.number_identification} onChange={e => handleChange(e, 'instructor')} className="w-full border rounded px-2 py-1 placeholder:text-xs" placeholder="ej: 12324224" />
              </div>
              <div>
                <label className="block text-sm">Nombres <span className="text-red-600">*</span></label>
                <input name="first_name" value={instructor.first_name} onChange={e => handleChange(e, 'instructor')} className="w-full border rounded px-2 py-1 placeholder:text-xs" placeholder="Nombres completos" />
              </div>
              <div>
                <label className="block text-sm">Apellidos <span className="text-red-600">*</span></label>
                <input name="first_last_name" value={instructor.first_last_name} onChange={e => handleChange(e, 'instructor')} className="w-full border rounded px-2 py-1 placeholder:text-xs" placeholder="Apellidos completos" />
              </div>
              <div>
                <label className="block text-sm">Correo Electrónico <span className="text-red-600">*</span></label>
                <input name="email" value={instructor.email} onChange={e => handleChange(e, 'instructor')} className="w-full border rounded px-2 py-1 placeholder:text-xs" placeholder="ej: user@sena.edu.co" />
              </div>
              <div>
                <label className="block text-sm">Teléfono <span className="text-red-600">*</span></label>
                <input
                  type="tel"
                  inputMode="numeric"
                  pattern="\d*"
                  name="phone_number"
                  value={instructor.phone_number}
                  onChange={e => {
                    const onlyNumbers = e.target.value.replace(/\D/g, '');
                    setInstructor(prev => prev ? { ...prev, phone_number: onlyNumbers } : prev);
                  }}
                  className="w-full border rounded px-2 py-1 placeholder:text-xs"
                  placeholder="ej: 3102936537"
                  maxLength={10}
                />
              </div>
              <div>
                <label className="block text-sm">Regional <span className="text-red-600">*</span></label>
                <CustomSelect
                  value={instructor.regional_obj ? String(instructor.regional_obj.id) : (instructor.regional ? String(instructor.regional) : "")}
                  onChange={value => setInstructor(prev => prev ? { ...prev, regional: Number(value), regional_obj: regionales.find(r => r.id === Number(value)) || null, center: 0, center_id: 0, sede: 0, sede_id: 0 } : prev)}
                  options={regionales.filter(opt => opt.active).map(opt => ({ value: String(opt.id), label: String(opt.name) }))}
                  placeholder="Seleccionar ..."
                  classNames={{
                    trigger: "w-full border rounded-lg px-2 py-2 text-xs flex items-center justify-between bg-white",
                    label: "hidden",
                  }}
                />
              </div>
              <div>
                <label className="block text-sm">Centro <span className="text-red-600">*</span></label>
                <CustomSelect
                  value={instructor.centro_obj ? String(instructor.centro_obj.id) : (instructor.center ? String(instructor.center) : "")}
                  onChange={value => setInstructor(prev => prev ? { ...prev, center: Number(value), center_id: Number(value), centro_obj: centros.find(c => c.id === Number(value)) || null, sede: 0, sede_id: 0 } : prev)}
                  options={centros.filter(c => c.active && c.regional === (instructor.regional || instructor.regional_obj?.id)).map(opt => ({ value: String(opt.id), label: String(opt.name) }))}
                  placeholder="Seleccionar ..."
                  classNames={{
                    trigger: "w-full border rounded-lg px-2 py-2 text-xs flex items-center justify-between bg-white",
                    label: "hidden",
                  }}
                  disabled={!instructor.regional}
                />
              </div>
              <div>
                <label className="block text-sm">Sede <span className="text-red-600">*</span></label>
                <CustomSelect
                  value={instructor.sede_obj ? String(instructor.sede_obj.id) : (instructor.sede ? String(instructor.sede) : "")}
                  onChange={value => setInstructor(prev => prev ? { ...prev, sede: Number(value), sede_id: Number(value), sede_obj: sedes.find(s => s.id === Number(value)) || null } : prev)}
                  options={sedes.filter(s => s.active && s.center === (instructor.center || instructor.centro_obj?.id)).map(opt => ({ value: String(opt.id), label: String(opt.name) }))}
                  placeholder="Seleccionar ..."
                  classNames={{
                    trigger: "w-full border rounded-lg px-2 py-2 text-xs flex items-center justify-between bg-white",
                    label: "hidden",
                  }}
                  disabled={!instructor.center}
                />
              </div>
              <div>
                <label className="block text-sm">Área de conocimiento <span className="text-red-600">*</span></label>
                <CustomSelect
                  value={instructor.knowledge_area ? String(instructor.knowledge_area) : ""}
                  onChange={value => setInstructor(prev => prev ? { ...prev, knowledge_area: Number(value) } : prev)}
                  options={areas.filter(opt => opt.active).map(opt => ({ value: String(opt.id), label: String(opt.name) }))}
                  placeholder="Seleccionar ..."
                  classNames={{
                    trigger: "w-full border rounded-lg px-2 py-2 text-xs flex items-center justify-between bg-white",
                    label: "hidden",
                  }}
                />
              </div>
              <div>
                <label className="block text-sm">Tipo de contrato <span className="text-red-600">*</span></label>
                <CustomSelect
                  value={instructor.contract_type ? String(instructor.contract_type) : ""}
                  onChange={value => setInstructor(prev => prev ? { ...prev, contract_type: value } : prev)}
                  options={contractTypesOptions}
                  placeholder="Seleccionar ..."
                  classNames={{
                    trigger: "w-full border rounded-lg px-2 py-2 text-xs flex items-center justify-between bg-white",
                    label: "hidden",
                  }}
                />
              </div>
              <div>
                <label className="block text-sm">Fecha inicio contrato <span className="text-red-600">*</span></label>
                <input type="date" name="contract_start_date" value={instructor.contract_start_date} onChange={e => handleChange(e, 'instructor')} className="w-full border rounded-lg px-2 py-2 text-xs" />
              </div>
              <div>
                <label className="block text-sm">Fecha fin de contrato <span className="text-red-600">*</span></label>
                <input
                  type="date"
                  name="contract_end_date"
                  value={instructor.contract_end_date}
                  onChange={e => handleChange(e, 'instructor')}
                  className="w-full border rounded-lg px-2 py-2 text-xs"
                  min={instructor.contract_start_date || undefined}
                />
              </div>
              <div>
                <label className="block text-sm">Rol <span className="text-red-600">*</span></label>
                <CustomSelect
                  value={instructor.role ? String(instructor.role) : ""}
                  onChange={value => setInstructor(prev => prev ? { ...prev, role: Number(value) } : prev)}
                  options={roles.filter(opt => opt.active && opt.type_role?.toLowerCase() !== 'aprendiz').map(opt => ({ value: String(opt.id), label: String(opt.type_role) }))}
                  placeholder="Seleccionar ..."
                  classNames={{
                    trigger: "w-full border rounded-lg px-2 py-2 text-xs flex items-center justify-between bg-white",
                    label: "hidden",
                  }}
                />
              </div>
              <div>
                <label className="block text-sm">¿Instructor de seguimiento? <span className="text-red-600">*</span></label>
                <CustomSelect
                  value={instructor.is_followup_instructor ? "true" : "false"}
                  onChange={value => setInstructor(prev => prev ? { ...prev, is_followup_instructor: value === "true" } : prev)}
                  options={[{ value: "true", label: "Sí" }, { value: "false", label: "No" }]}
                  placeholder="Seleccionar ..."
                  classNames={{
                    trigger: "w-full border rounded-lg px-2 py-2 text-xs flex items-center justify-between bg-white",
                    label: "hidden",
                  }}
                />
              </div>
            </div>
          ) : null}
          {/* Mensaje de error clásico (puedes quitarlo si solo quieres el modal) */}
          {error && <div className="text-red-500 mt-2">{error}</div>}
          {/* NotificationModal para errores del backend */}
          <NotificationModal
            isOpen={showNotification}
            onClose={() => setShowNotification(false)}
            type="warning"
            title="Error al actualizar"
            message={notificationMessage}
          />
          <div className="flex gap-4 mt-6">
            <button type="button" className="flex-1 bg-red-600 text-black py-2 rounded font-bold" onClick={onClose}>Cancelar</button>
            <button type="submit" className={`flex-1 ${tab === 'aprendiz' ? 'bg-green-600' : 'bg-green-700'} text-black py-2 rounded font-bold`} disabled={loading}>
              {loading ? 'Actualizando...' : tab === 'aprendiz' ? 'Actualizar aprendiz' : 'Actualizar instructor'}
            </button>
          </div>
        </form>
        <ConfirmModal
          isOpen={showConfirm}
          title="¿Confirmar actualización?"
          message={`¿Estás seguro de que deseas actualizar este ${pendingSubmit === 'aprendiz' ? 'aprendiz' : 'instructor'}?`}
          confirmText="Sí, actualizar"
          cancelText="Cancelar"
          onConfirm={handleConfirm}
          onCancel={() => setShowConfirm(false)}
        />
      </div>
    </div>
  );
};

export default ModalEditUser;