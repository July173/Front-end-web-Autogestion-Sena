import React, { useState, useEffect } from 'react';
import { postApprentice } from '../../Api/Services/Apprentice';
import { postInstructor } from '../../Api/Services/Instructor';
import { getRegionales } from '../../Api/Services/Regional';
import { getSedes } from '../../Api/Services/Sede';
import { getCenters } from '../../Api/Services/Center';
import { getPrograms, getProgramFichas } from '../../Api/Services/Program';
import { getRoles } from '../../Api/Services/Rol';
import { getKnowledgeAreas } from '../../Api/Services/KnowledgeArea';
import ConfirmModal from '../ConfirmModal';
import { useDocumentTypes } from '../../hook/useDocumentTypes';
import { useContractTypes } from '../../hook/useContractTypes';
import type {
  Regional,
  Sede,
  Center,
  Program,
  KnowledgeArea,
  Ficha,
} from '../../Api/types/Modules/general.types';
import type { Role } from '../../Api/types/entities/role.types';
import type { CreateApprentice } from '../../Api/types/entities/apprentice.types';
import type { CreateInstructor } from '../../Api/types/entities/instructor.types';
import CustomSelect from '../CustomSelect';

/**
 * Validations for learner (aprendiz)
 * @param data - Learner data to validate
 * @returns Error message if validation fails, null otherwise
 */
const validateApprentice = (data) => {
  // Note: apprentice shape uses `program` and `ficha` (not program_id / ficha_id)
  if (!data.type_identification || !data.number_identification || !data.first_name || !data.first_last_name || !data.phone_number || !data.email || !data.program || !data.ficha_id) {
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
  // Use the keys present in CreateInstructor state: role, contract_type, contract_start_date, contract_end_date, knowledge_area, center, sede, regional
  if (!data.type_identification || !data.number_identification || !data.first_name || !data.first_last_name || !data.phone_number || !data.email || !data.role || !data.contract_type || !data.contract_start_date || !data.contract_end_date || !data.knowledge_area || !data.center || !data.sede || !data.regional) {
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

/**
 * Modal component for creating new users (learners or instructors) in the SENA system.
 * Provides a tabbed interface to switch between learner and instructor registration forms.
 * Handles form validation, data submission, and confirmation dialogs.
 * @param onClose - Callback function to close the modal
 * @param onSuccess - Callback function called after successful user creation
 */
const ModalCreateUser = ({ onClose, onSuccess }: { onClose?: () => void; onSuccess?: () => void }) => {
  // State for active tab (learner or instructor)
  const [tab, setTab] = useState<'aprendiz' | 'instructor'>('aprendiz');
  // Loading state for form submission
  const [loading, setLoading] = useState(false);
  // Error message state for validation or API errors
  const [error, setError] = useState('');

  // Hook to get document types dynamically
  const { documentTypes } = useDocumentTypes();
  const { contractTypes } = useContractTypes();
  // Transform document types to select options format
  const documentTypesOptions = documentTypes
    .filter(opt => opt.id !== '')
    .map(opt => ({ value: String(opt.id), label: String(opt.name) }));

  // Transform contract types to select options format
  const contractTypesOptions = contractTypes
    .filter(opt => opt.id !== '')
    .map(opt => ({ value: String(opt.id), label: String(opt.name) }));

  // State for dynamic selects data
  const [regionales, setRegionales] = useState<Regional[]>([]);
  const [sedes, setSedes] = useState<Sede[]>([]);
  const [centros, setCentros] = useState<Center[]>([]);
  const [programas, setProgramas] = useState<Program[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [areas, setAreas] = useState<KnowledgeArea[]>([]);
  const [fichas, setFichas] = useState<Ficha[]>([]);

  // State for apprentice form data
  const [apprentice, setApprentice] = useState<CreateApprentice>({
    type_identification: '',
    number_identification: '',
    first_name: '',
    second_name: '',
    first_last_name: '',
    second_last_name: '',
    phone_number: '',
    email: '',
    program: 0,
    ficha_id: '',
  });

  // State for instructor form data
  const [instructor, setInstructor] = useState<CreateInstructor>({
    first_name: '',
    second_name: '',
    first_last_name: '',
    second_last_name: '',
    phone_number: '',
    type_identification: 0,
    number_identification: '',
    email: '',
    role: 0,
    contract_type: '',
    contract_start_date: '',
    contract_end_date: '',
    knowledge_area: 0,
    center: 0,
    sede: 0,
    regional: 0,
    is_followup_instructor: false,
  });

  // Filter centers and sedes according to selection (after initializing states)
  const centrosFiltrados = centros.filter(c => c.regional === instructor.regional);
  const sedesFiltradas = sedes.filter(s => s.center === instructor.center);

  // State for confirmation modal
  const [showConfirm, setShowConfirm] = useState(false);
  // State to track which form is pending submission
  const [pendingSubmit, setPendingSubmit] = useState<'aprendiz' | 'instructor' | null>(null);

  // Load initial data for all select options on com  ponent mount
  useEffect(() => {
    // Load select data on modal mount
    getRegionales().then(setRegionales).catch(() => setRegionales([]));
    getSedes().then(setSedes).catch(() => setSedes([]));
    getCenters().then(setCentros).catch(() => setCentros([]));
    getPrograms().then(setProgramas).catch(() => setProgramas([]));
    getRoles().then(setRoles).catch(() => setRoles([]));
    getKnowledgeAreas().then(setAreas).catch(() => setAreas([]));
    // Initially fichas are not loaded until a program is selected
    setFichas([]);
  }, []);

  // Update fichas when selected program changes
  useEffect(() => {
    if (apprentice.program) {
      getProgramFichas(apprentice.program)
        .then(setFichas)
        .catch(() => setFichas([]));
    } else {
      setFichas([]);
    }
    // Clear selected ficha_id if program changes
    setApprentice(prev => ({ ...prev, ficha_id: '' }));
  }, [apprentice.program]);

  /**
   * Handles input changes for both learner and instructor forms
   * @param e - Change event from input or select
   * @param tipo - Type of form ('aprendiz' or 'instructor')
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>, tipo: 'aprendiz' | 'instructor') => {
    const { name, value } = e.target;
    if (tipo === 'aprendiz') {
      // If program changes, useEffect handles updating fichas and clearing ficha_id
      setApprentice(prev => ({ ...prev, [name]: value }));
    } else {
      setInstructor(prev => ({ ...prev, [name]: value }));
    }
  };

  /**
   * Handles form submission by showing confirmation modal
   * @param e - Form submit event
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPendingSubmit(tab);
    setShowConfirm(true);
  };

  /**
   * Handles confirmed submission after user confirms in modal
   * Performs validation, data transformation, and API calls
   */
  const handleConfirm = async () => {
    setShowConfirm(false);
    setLoading(true);
    setError('');
    let errorMsg = null;
    // Function to extract message from backend
    const getBackendErrorMsg = (err) => {
      if (err?.response?.data) {
        if (typeof err.response.data === 'string') {
          return err.response.data;
        } else if (err.response.data.detalle) {
          return err.response.data.detalle;
        } else if (err.response.data.error) {
          return err.response.data.error;
        } else if (err.response.data.message) {
          return err.response.data.message;
        } else {
          return Object.values(err.response.data).join(' ');
        }
      }
      return err?.message || 'Error al registrar usuario';
    };

    if (pendingSubmit === 'aprendiz') {
      errorMsg = validateApprentice(apprentice);
      if (errorMsg) {
        setError(errorMsg);
        setLoading(false);
        setPendingSubmit(null);
        return;
      }
      // Separate first and last names
      const nombres = apprentice.first_name.trim().split(' ');
      const apellidos = apprentice.first_last_name.trim().split(' ');
      const payload = {
        ...apprentice,
        first_name: nombres[0] || '',
        second_name: nombres.slice(1).join(' '),
        first_last_name: apellidos[0] || '',
        second_last_name: apellidos.slice(1).join(' '),
      };
      try {
        await postApprentice(payload);
      } catch (err) {
        setError(getBackendErrorMsg(err));
        setLoading(false);
        setPendingSubmit(null);
        return;
      }
    } else if (pendingSubmit === 'instructor') {
      errorMsg = validateInstructor(instructor);
      if (errorMsg) {
        setError(errorMsg);
        setLoading(false);
        setPendingSubmit(null);
        return;
      }
      // Separate first and last names for instructor
      const nombres = instructor.first_name.trim().split(' ');
      const apellidos = instructor.first_last_name.trim().split(' ');
      const payload = {
        first_name: nombres[0] || '',
        second_name: nombres.slice(1).join(' '),
        first_last_name: apellidos[0] || '',
        second_last_name: apellidos.slice(1).join(' '),
        phone_number: instructor.phone_number,
        type_identification: instructor.type_identification,
        number_identification: instructor.number_identification,
        email: instructor.email,
        role: instructor.role,
        contract_type: instructor.contract_type,
        contract_start_date: instructor.contract_start_date,
        contract_end_date: instructor.contract_end_date,
        knowledge_area: instructor.knowledge_area,
        sede: instructor.sede,
        is_followup_instructor: instructor.is_followup_instructor,
        // DO NOT send regional_id or center_id
      };
      try {
        await postInstructor(payload);
      } catch (err) {
        setError(getBackendErrorMsg(err));
        setLoading(false);
        setPendingSubmit(null);
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
        {/* Modal title */}
        <h2 className="text-xl font-bold mb-4">Registrar Nuevo Usuario-Sena</h2>
        {/* Tab bar for switching between learner and instructor forms */}
        <div className="flex mb-4 bg-gray-300 rounded-lg overflow-hidden p-2">
          <button
            className={`flex-1 py-2 font-semibold ${tab === 'aprendiz' ? 'bg-white rounded-xl shadow text-black' : 'text-gray-500'}`}
            onClick={() => setTab('aprendiz')}
          >
            Aprendiz
          </button>
          <button
            className={`flex-1 py-2 font-semibold ${tab === 'instructor' ? 'bg-white  rounded-xl shadow text-black' : 'text-gray-500'}`}
            onClick={() => setTab('instructor')}
          >
            Instructor
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          {/* Learner form fields */}
          {tab === 'aprendiz' ? (
            <div className="grid grid-cols-2 gap-5">

              <div>
                <label className="block text-sm">Tipo de documento <span className="text-red-600">*</span></label>
                <CustomSelect
                  value={apprentice.type_identification}
                  onChange={value => setApprentice(prev => ({ ...prev, type_identification: value }))}
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
                    setApprentice(prev => ({ ...prev, phone_number: onlyNumbers }));
                  }}
                  className="w-full border rounded-lg px-2 py-1 placeholder:text-xs"
                  placeholder="ej: 3102936537"
                  maxLength={10}
                />
              </div>
              <div>
                <label className="block text-sm">Programa de formación <span className="text-red-600">*</span></label>
                <CustomSelect
                  value={apprentice.program ? String(apprentice.program) : ""}
                  onChange={value => setApprentice(prev => ({ ...prev, program: Number(value) }))} options={programas.filter(opt => opt.active).map(opt => ({ value: String(opt.id), label: String(opt.name) }))}
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
                  value={apprentice.ficha_id}
                  onChange={value => setApprentice(prev => ({ ...prev, ficha_id: value }))}
                  options={fichas.filter(opt => opt.active).map(opt => ({ value: String(opt.id), label: String(opt.file_number || opt.id) }))}
                  placeholder="Seleccion  ar ..."
                  classNames={{
                    trigger: "w-full border rounded-lg px-2 py-2 text-xs flex items-center justify-between bg-white",
                    label: "hidden",
                  }}
                />
              </div>
            </div>


          ) : (
            // Instructor form fields with hierarchical selections
            <div className="grid grid-cols-2 gap-3">

              <div>
                <label className="block text-sm">Tipo de documento <span className="text-red-600">*</span></label>
                <CustomSelect
                  value={String(instructor.type_identification || '')}
                  onChange={value => setInstructor(prev => ({ ...prev, type_identification: Number(value) }))} options={documentTypesOptions}
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
                    setInstructor(prev => ({ ...prev, phone_number: onlyNumbers }));
                  }}
                  className="w-full border rounded px-2 py-1 placeholder:text-xs"
                  placeholder="ej: 3102936537"
                  maxLength={10}
                />
              </div>
              {/* Hierarchical selection: Regional -> Center -> Sede */}
              <div>
                <label className="block text-sm">Regional <span className="text-red-600">*</span></label>
                <CustomSelect
                  value={instructor.regional ? String(instructor.regional) : ""}
                  onChange={value => setInstructor(prev => ({ ...prev, regional: Number(value), center: 0, sede: 0 }))}
                  options={regionales.filter(opt => opt.id != null).map(opt => ({ value: String(opt.id), label: String(opt.name) }))}
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
                  value={instructor.center ? String(instructor.center) : ""}
                  onChange={value => setInstructor(prev => ({ ...prev, center_id: Number(value), sede_id: 0 }))}
                  options={centrosFiltrados.map(opt => ({ value: String(opt.id), label: String(opt.name) }))}
                  placeholder="Seleccionar ..."
                  classNames={{
                    trigger: "w-full border rounded-lg px-2 py-2 text-xs flex items-center justify-between bg-white",
                    label: "hidden",
                  }}
                />
              </div>
              <div>
                <label className="block text-sm">Sede <span className="text-red-600">*</span></label>
                <CustomSelect
                  value={instructor.sede ? String(instructor.sede) : ""}
                  onChange={value => setInstructor(prev => ({ ...prev, sede: Number(value) }))}
                  options={sedesFiltradas.map(opt => ({ value: String(opt.id), label: String(opt.name) }))}
                  placeholder="Seleccionar ..."
                  classNames={{
                    trigger: "w-full border rounded-lg px-2 py-2 text-xs flex items-center justify-between bg-white",
                    label: "hidden",
                  }}
                />
              </div>
              <div>
                <label className="block text-sm">Área de conocimiento <span className="text-red-600">*</span></label>
                <CustomSelect
                  value={instructor.knowledge_area ? String(instructor.knowledge_area) : ""}
                  onChange={value => setInstructor(prev => ({ ...prev, knowledge_area: Number(value) }))}
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
                  value={instructor.contract_type}
                  onChange={value => setInstructor(prev => ({ ...prev, contract_type: value }))}
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
                  onChange={value => setInstructor(prev => ({ ...prev, role: Number(value) }))}
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
                  onChange={value => setInstructor(prev => ({ ...prev, is_followup_instructor: value === "true" }))}
                  options={[{ value: "true", label: "Sí" }, { value: "false", label: "No" }]}
                  placeholder="Seleccionar ..."
                  classNames={{
                    trigger: "w-full border rounded-lg px-2 py-2 text-xs flex items-center justify-between bg-white",
                    label: "hidden",
                  }}
                />
              </div>
            </div>
          )}
          {/* Error message display */}
          {error && <div className="text-red-500 mt-2">{error}</div>}
          {/* Action buttons */}
          <div className="flex gap-4 mt-6">
            <button type="button" className="flex-1 bg-red-600 text-black py-2 rounded font-bold" onClick={onClose}>Cancelar</button>
            <button type="submit" className={`flex-1 ${tab === 'aprendiz' ? 'bg-green-600' : 'bg-green-700'} text-black py-2 rounded font-bold`} disabled={loading}>
              {loading ? 'Registrando...' : tab === 'aprendiz' ? 'Registrar aprendiz' : 'Registrar instructor'}
            </button>
          </div>
        </form>
        {/* Confirmation modal for form submission */}
        <ConfirmModal
          isOpen={showConfirm}
          title="¿Confirmar registro?"
          message={`¿Estás seguro de que deseas registrar este ${pendingSubmit === 'aprendiz' ? 'aprendiz' : 'instructor'}?`}
          confirmText="Sí, registrar"
          cancelText="Cancelar"
          onConfirm={handleConfirm}
          onCancel={() => setShowConfirm(false)}
        />
      </div>
    </div>
  );
};

export default ModalCreateUser;
