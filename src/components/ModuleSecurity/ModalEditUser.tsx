import React from 'react';
import NotificationModal from '../NotificationModal';
import ConfirmModal from '../ConfirmModal';
import CustomSelect from '../CustomSelect';
import { useDocumentTypes } from '../../hook/useDocumentTypes';
import { useContractTypes } from '../../hook/useContractTypes';
import useModalEditUser from '../../hook/useModalEditUser';
import type { CreateApprentice } from '../../Api/types/entities/apprentice.types';
import type { CreateInstructor } from '../../Api/types/entities/instructor.types';

const ModalEditUser = ({ userId, userRole, onClose, onSuccess }) => {
  const initialTab = userRole === 'aprendiz' ? 'aprendiz' : 'instructor';
  const {
    tab,
    setTab,
    loading,
    error,
    showNotification,
    setShowNotification,
    notificationMessage,
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
    startSubmit,
    confirmSubmit,
  } = useModalEditUser({ userId, initialTab, onSuccess, onClose });

  const { documentTypes } = useDocumentTypes();
  const { contractTypes } = useContractTypes();
  const documentTypesOptions = documentTypes.filter(opt => opt.id !== '').map(opt => ({ value: String(opt.id), label: String(opt.name) }));
  const contractTypesOptions = contractTypes.filter(opt => opt.id !== '').map(opt => ({ value: String(opt.id), label: String(opt.name) }));

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>, tipo: 'aprendiz' | 'instructor') => {
    const { name, value } = e.target;
    if (tipo === 'aprendiz') {
      setApprentice(prev => prev ? ({ ...(prev as Record<string, unknown>), [name]: value } as unknown as typeof prev) : prev);
    } else {
      setInstructor(prev => prev ? ({ ...(prev as Record<string, unknown>), [name]: value } as unknown as typeof prev) : prev);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startSubmit(tab);
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
                  onChange={value => handleAprChange('type_identification' as keyof CreateApprentice, value)}
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
                  value={apprentice.program ? String(apprentice.program) : ""}
                  onChange={value => {
                    // update canonical program field used by hooks and also keep programa_obj for display
                    handleAprChange('program' as keyof CreateApprentice, Number(value));
                    setApprentice(prev => prev ? ({ ...(prev as Record<string, unknown>), programa_obj: programas.find(p => p.id === Number(value)) || null, ficha_id: '' } as unknown as typeof prev) : prev);
                  }}
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
                  onChange={value => handleAprChange('ficha_id' as keyof CreateApprentice, value)}
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
                  onChange={value => handleInsChange('type_identification' as keyof CreateInstructor, Number(value))}
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
                  value={instructor.regional ? String(instructor.regional) : ""}
                  onChange={value => {
                    handleInsChange('regional' as keyof CreateInstructor, Number(value));
                    setInstructor(prev => prev ? ({ ...(prev as Record<string, unknown>), regional_obj: regionales.find(r => r.id === Number(value)) || null, center: 0, center_id: 0, sede: 0, sede_id: 0 } as unknown as typeof prev) : prev);
                  }}
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
                  value={instructor.center ? String(instructor.center) : ""}
                  onChange={value => {
                    handleInsChange('center' as keyof CreateInstructor, Number(value));
                    setInstructor(prev => prev ? ({ ...(prev as Record<string, unknown>), center_id: Number(value), centro_obj: centros.find(c => c.id === Number(value)) || null, sede: 0, sede_id: 0 } as unknown as typeof prev) : prev);
                  }}
                  options={centros.filter(c => c.active && c.regional === (instructor.regional)).map(opt => ({ value: String(opt.id), label: String(opt.name) }))}
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
                  value={instructor.sede ? String(instructor.sede) : ""}
                  onChange={value => {
                    handleInsChange('sede' as keyof CreateInstructor, Number(value));
                    setInstructor(prev => prev ? ({ ...(prev as Record<string, unknown>), sede_id: Number(value), sede_obj: sedes.find(s => s.id === Number(value)) || null } as unknown as typeof prev) : prev);
                  }}
                  options={sedes.filter(s => s.active && s.center === (instructor.center)).map(opt => ({ value: String(opt.id), label: String(opt.name) }))}
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
                  onChange={value => handleInsChange('knowledge_area' as keyof CreateInstructor, Number(value))}
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
                  onChange={value => handleInsChange('contract_type' as keyof CreateInstructor, value)}
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
                  onChange={value => handleInsChange('role' as keyof CreateInstructor, Number(value))}
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
                  onChange={value => handleInsChange('is_followup_instructor' as keyof CreateInstructor, value === 'true')}
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
          onConfirm={confirmSubmit}
          onCancel={() => setShowConfirm(false)}
        />
      </div>
    </div>
  );
};

export default ModalEditUser;