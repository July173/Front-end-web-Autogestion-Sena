import ApprenticeSection from '../components/RequestForm/ApprenticeSection';
import CustomSelect from '../components/CustomSelect';
import EmpresaSection from '../components/RequestForm/EnterpriseSection';
import JefeSection from '../components/RequestForm/BossSection';
import TalentoHumanoSection from '../components/RequestForm/HumanTalentSection';
import PdfUploadSection from '../components/RequestForm/PdfUploadSection';
import { 
  JournalText,
  Person,
  Buildings,
  FileEarmarkPdf,
  BoxArrowUp,
  Send
} from 'react-bootstrap-icons';
import { useApprenticeData } from '../hook/useApprenticeData';
import { useRequestAssignation } from '../hook/useRequestAssignation';
import { useFormValidations } from '../hook/useFormValidations';
import { useEffect, useState } from "react";
import { getDocumentTypesWithEmpty } from '../Api/Services/TypeDocument';
import { requestAsignation } from '../Api/types/Modules/assign.types';
import NotificationModal from '../components/NotificationModal';
import ConfirmModal from '../components/ConfirmModal';
import TermsModal from '../components/Login/TermsModal';

// Colors used
const COLORS = {
  green: "#0C672D",
  green2: "#2D7430",
  green3: "#7BCC7C",
  green4: "#E7FFE8",
  white: "#FFFFFF",
  grey: "#686868",
  black: "#000000",
  error: "#DC395F",
};

export default function RequestRegistration() {
  const { validatePhone, validateEndDate } = useFormValidations();
  const [phoneError, setPhoneError] = useState('');
  const [humanTalentPhoneError, setHumanTalentPhoneError] = useState('');
  const [dateError, setDateError] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { person, userData, apprenticeId, loading: userLoading, error: userError } = useApprenticeData();
  const {
    loading,
    error,
    formData,
    regionales,
    centrosFiltrados,
    sedesFiltradas,
    programas,
    fichas,
    modalidades, // Add modalities
    selectedRegional,
    selectedCenter,
    selectedProgram,
    updateFormData,
    updateSelectedRegional,
    updateSelectedCenter,
    updateSelectedProgram,
    submitRequest,
    uploadPdf,
    clearError
  } = useRequestAssignation();

  const [notification, setNotification] = useState<{
    isOpen: boolean;
    type: 'info' | 'warning' | 'success' | 'password-changed' | 'email-sent' | 'pending' | 'completed';
    title: string;
    message: string;
    key?: number;
  }>({
    isOpen: false,
    type: 'info',
    title: '',
    message: '',
    key: 0
  });

  const [showConfirm, setShowConfirm] = useState(false);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);

  // Calculate allowed range for end date (after declaring formData)
  let minEndDate = '';
  let maxEndDate = '';
  if (formData.date_start_contract) {
    const startDate = new Date(formData.date_start_contract);
    const endMonthDate = new Date(startDate);
    endMonthDate.setMonth(endMonthDate.getMonth() + 6);
    // First day of the month
    minEndDate = new Date(endMonthDate.getFullYear(), endMonthDate.getMonth(), 1).toISOString().split('T')[0];
    // Last day of the month
    maxEndDate = new Date(endMonthDate.getFullYear(), endMonthDate.getMonth() + 1, 0).toISOString().split('T')[0];
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        setNotification({
          isOpen: true,
          type: 'warning',
          title: 'Archivo inválido',
          message: 'Solo se permiten archivos PDF.'
        });
        return;
      }
      const maxSizeInBytes = 1024 * 1024;
      if (file.size > maxSizeInBytes) {
        setNotification({
          isOpen: true,
          type: 'warning',
          title: 'Archivo demasiado grande',
          message: 'El archivo no puede ser mayor a 1MB.'
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  const triggerFileInput = () => {
    document.getElementById('pdf-upload').click();
  };

  // State for dynamic document types
  const [documentTypes, setDocumentTypes] = useState<{ id: number | ""; name: string }[]>([]);
  useEffect(() => {
    getDocumentTypesWithEmpty().then(setDocumentTypes);
  }, []);

  // Function to get the document type name using dynamic data
  const getDocumentTypeName = (typeValue: string | number) => {
    const documentType = documentTypes.find(type => String(type.id) === String(typeValue));
    return documentType ? documentType.name : 'No especificado';
  };

  // Real-time validation for phone
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    updateFormData('boss_phone', value);
    setPhoneError(validatePhone(value));
  };

  const handleHumanTalentPhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    updateFormData('human_talent_phone', value);
    setHumanTalentPhoneError(validatePhone(value));
  };

  // Real-time validation for dates
  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const startValue = new Date(e.target.value).getTime();
    updateFormData('date_start_contract', startValue);
    
    // Clear previous error
    setDateError('');
    
    // If end date already exists, validate
    if (formData.date_end_contract) {
      setDateError(validateEndDate(startValue, formData.date_end_contract));
    }
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const endValue = new Date(e.target.value).getTime();
    updateFormData('date_end_contract', endValue);
    
    // Validate immediately with start date
    if (formData.date_start_contract) {
      setDateError(validateEndDate(formData.date_start_contract, endValue));
    } else {
      setDateError('Debe seleccionar primero la fecha de inicio');
    }
  };

  // New handle for form submit
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowConfirm(true);
  };

  // Real sending logic, only if user confirms
  const handleConfirmSend = async () => {
    setShowConfirm(false);
    clearError();
    // Helper to show notification after confirm closes
    const showNotification = (notif) => {
  setTimeout(() => setNotification({ ...notif, key: Date.now() }), 200); // force remount with unique key
    };
    if (!person) {
      showNotification({
        isOpen: true,
        type: 'warning',
        title: 'Datos de aprendiz no encontrados',
        message: 'No se encontraron los datos del aprendiz. Por favor, verifica tu sesión o comunícate con soporte.'
      });
      return;
    }
    if (!selectedFile) {
      showNotification({
        isOpen: true,
        type: 'warning',
        title: 'Archivo PDF requerido',
        message: 'Debes seleccionar un archivo PDF para continuar con la solicitud.'
      });
      return;
    }
    // Update formData with apprentice ID (from apprentice table)
    const updatedFormData: Partial<requestAsignation> = {
      ...formData,
      apprentice: Number(apprenticeId) || 0,
    };
    // Verify required fields
    const requiredFields = {
      apprenticeId: updatedFormData.apprentice!,
      fichaId: updatedFormData.ficha!,
      dateEndContract: updatedFormData.date_end_contract!,
      dateStartContract: updatedFormData.date_start_contract!,
      enterpriseName: updatedFormData.enterprise_name!,
      enterpriseNit: updatedFormData.enterprise_nit!,
      enterpriseLocation: updatedFormData.enterprise_location!,
      enterpriseEmail: updatedFormData.enterprise_email!,
      bossName: updatedFormData.boss_name!,
      bossPhone: updatedFormData.boss_phone!,
      bossEmail: updatedFormData.boss_email!,
      bossPosition: updatedFormData.boss_position!,
      humanTalentName: updatedFormData.human_talent_name!,
      humanTalentEmail: updatedFormData.human_talent_email!,
      humanTalentPhone: updatedFormData.human_talent_phone!,
      sede: updatedFormData.sede!,
      modalityProductiveStage: updatedFormData.modality_productive_stage!,
    };
    // Extra validations
    const bossPhoneValidation = validatePhone(updatedFormData.boss_phone ?? '');
    const humanTalentPhoneValidation = validatePhone(updatedFormData.human_talent_phone ?? '');
    const dateValidation = validateEndDate(updatedFormData.date_start_contract ?? null, updatedFormData.date_end_contract ?? null);
    // Filter only non-empty errors
    const validationErrors = [bossPhoneValidation, humanTalentPhoneValidation, dateValidation]
      .filter(error => error !== '');
    
    if (validationErrors.length > 0) {
      showNotification({
        isOpen: true,
        type: 'warning',
        title: 'Errores de validación',
        message: `Errores encontrados:\n${validationErrors.join('\n')}`
      });
      return;
    }

    Object.entries(requiredFields).forEach(([key, value]) => {
      const isEmpty = value === 0 || value === '' || value === null || value === undefined;
    });

    // Check which fields are empty
    const missingFields = Object.entries(requiredFields)
      .filter(([key, value]) => value === 0 || value === '' || value === null || value === undefined)
      .map(([key]) => key);

    if (missingFields.length > 0) {
      showNotification({
        isOpen: true,
        type: 'warning',
        title: 'Campos faltantes',
        message: `Faltan los siguientes campos: ${missingFields.join(', ')}`
      });
      return;
    }

    // PASS THE TRANSFORMED DATA TO SUBMIT
    try {
      console.log('Enviando datos principales:', updatedFormData);
      const requestId = await submitRequest(updatedFormData);
      console.log('ID de solicitud recibido:', requestId);
      if (requestId && selectedFile) {
        // Subir PDF con request_id como campo obligatorio
        let pdfUploadResult = null;
        try {
          console.log('Enviando PDF:', selectedFile, 'con request_id:', requestId);
          pdfUploadResult = await uploadPdf(selectedFile, requestId);
          console.log('Respuesta de uploadPdf:', pdfUploadResult);
        } catch (pdfErr) {
          console.error('Error al subir PDF:', pdfErr);
          showNotification({
            isOpen: true,
            type: 'warning',
            title: 'Error al subir PDF',
            message: pdfErr?.message || 'La solicitud fue enviada pero hubo un error al subir el archivo PDF.'
          });
          return;
        }
        if (pdfUploadResult && pdfUploadResult.ok !== false) {
          showNotification({
            isOpen: true,
            type: 'success',
            title: 'Solicitud enviada',
            message: 'La solicitud fue enviada exitosamente y el archivo PDF se ha subido correctamente.'
          });
        } else {
          showNotification({
            isOpen: true,
            type: 'warning',
            title: 'Error al subir PDF',
            message: 'La solicitud fue enviada pero hubo un error al subir el archivo PDF.'
          });
        }
      } else if (requestId) {
        showNotification({
          isOpen: true,
          type: 'success',
          title: 'Solicitud enviada',
          message: 'La solicitud fue enviada exitosamente.'
        });
      }
    } catch (err) {
      console.error('Error al enviar solicitud principal:', err);
      showNotification({
        isOpen: true,
        type: 'warning',
        title: 'Error al enviar solicitud',
        message: err?.message || 'Ocurrió un error inesperado al enviar la solicitud.'
      });
    }
  };

  if (userLoading) return <div className="p-8">Cargando información del aprendiz...</div>;
  if (userError) return <div className="p-8 text-red-500">{userError}</div>;
  if (!person) return <div className="p-8 text-orange-500">No se encontró la información del aprendiz.</div>;

  return (
    <>
      <NotificationModal
        key={notification.key}
        isOpen={notification.isOpen}
        onClose={() => setNotification({ ...notification, isOpen: false, key: Date.now() })}
        type={notification.type}
        title={notification.title}
        message={notification.message}
      />
      <ConfirmModal
        isOpen={showConfirm}
        title="¿Confirmar envío de solicitud?"
        message="¿Estás seguro de que deseas enviar el formulario?"
        confirmText="Sí, enviar"
        cancelText="Cancelar"
        onConfirm={handleConfirmSend}
        onCancel={() => setShowConfirm(false)}
      />
      <TermsModal isOpen={isTermsModalOpen} onClose={() => setIsTermsModalOpen(false)} />
      <div className="min-h-screen py-8 rounded-md" style={{ background: '#f8f9fa' }}>
        <div className="w-full max-w-4xl mx-auto px-4">
          <form onSubmit={handleFormSubmit}>
            <div className="flex items-center gap-3 mb-6 justify-center ">
              <div 
                className="flex items-center justify-center rounded-full" 
                style={{ width: 48, height: 48, backgroundColor: COLORS.green2 }}
              >
                <JournalText size={28} color={COLORS.white} />
              </div>
              <h1 className="font-bold text-3xl" style={{ color: COLORS.green2 }}>
                Formulario de Asignación
              </h1>
            </div>
            {/* Encabezado centrado */}
            <div className="w-full flex flex-col items-center justify-center mb-8 bg-white rounded-lg shadow-md p-6 border border-gray-200">
              
              <h2 className="font-semibold text-xl mb-4 text-center" style={{ color: COLORS.green2 }}>
                Asignación instructor acompañamiento etapa práctica
              </h2>
              <p className="text-sm text-gray-700 text-center max-w-2xl leading-relaxed">
                Únicamente para la alternativa de Contrato de Aprendizaje. Acepto el tratamiento de mis datos personales conforme a lo consagrado en el artículo 15 Constitución Política y en la Resolución No. 0924 del MINTIC.
              </p>
            </div>

            {/* Términos y condiciones */}
            <div className="w-full mb-6 bg-white rounded-lg   shadow-md p-4 border border-gray-200">
              <div className="flex items-start gap-3 mb-2">
                <input 
                  type="checkbox" 
                  id="terms" 
                  className="mt-1 accent-green-600" 
                  style={{ accentColor: COLORS.green }}
                  required 
                />
                <span className="text-sm text-gray-700">
                  Acepto los <button type="button" className="underline text-green-700 hover:text-green-900" onClick={() => setIsTermsModalOpen(true)}>Términos y Condiciones</button> del SENA.
                </span>
              </div>
            </div>

            {/* Selects de Regional, Centro, Sede (solo estos por fuera) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
                <CustomSelect
                  value={selectedRegional ? String(selectedRegional) : ""}
                  onChange={val => updateSelectedRegional(Number(val))}
                  options={regionales.map(r => ({ value: String(r.id), label: r.name }))}
                  label={`Regional *`}
                  placeholder="Seleccione..."
                  classNames={{
                    trigger: "w-full border-2 rounded-lg px-3 py-2 text-sm flex items-center justify-between bg-white",
                    label: "block text-sm font-medium mb-2",
                  }}
                />
              </div>

              <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
                <CustomSelect
                  value={selectedCenter ? String(selectedCenter) : ""}
                  onChange={val => updateSelectedCenter(Number(val))}
                  options={centrosFiltrados.map(c => ({ value: String(c.id), label: c.name }))}
                  label={`Centro de formación *`}
                  placeholder="Seleccione..."
                  classNames={{
                    trigger: "w-full border-2 rounded-lg px-3 py-2 text-sm flex items-center justify-between bg-white",
                    label: "block text-sm font-medium mb-2",
                  }}
                  disabled={!selectedRegional}
                />
              </div>

              <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
                <CustomSelect
                  value={formData.sede ? String(formData.sede) : ""}
                  onChange={val => updateFormData('sede', Number(val))}
                  options={sedesFiltradas.map(s => ({ value: String(s.id), label: s.name }))}
                  label={`Sede centro de formación *`}
                  placeholder="Seleccione..."
                  classNames={{
                    trigger: "w-full border-2 rounded-lg px-3 py-2 text-sm flex items-center justify-between bg-white",
                    label: "block text-sm font-medium mb-2",
                  }}
                  disabled={!selectedCenter}
                />
              </div>
            </div>

            // Datos del Aprendiz - campos pre-cargados + campos editables

            <ApprenticeSection
              person={{
                name: `${person?.first_name ?? ''} ${person?.second_name ?? ''} ${person?.first_last_name ?? ''} ${person?.second_last_name ?? ''}`.trim(),
                type_identification: person?.type_identification ?? 0,
                number_identificacion: person?.number_identification ? String(person.number_identification) : '',
                request_date: '', // No matching field in Person, leave blank or map from elsewhere if available
                id: person?.id ?? 0,
                request_state: '', // No matching field in Person, leave blank or map from elsewhere if available
              }}
              userData={userData}
              programas={programas}
              selectedProgram={selectedProgram}
              updateSelectedProgram={updateSelectedProgram}
              fichas={fichas.map(f => ({ id: f.id, file_number: String(f.file_number) }))}
              formData={{
                apprentice: formData.apprentice ?? 0,
                ficha: formData.ficha ?? 0,
                date_start_contract: formData.date_start_contract ?? 0,
                date_end_contract: formData.date_end_contract ?? 0,
                enterprise_name: formData.enterprise_name ?? '',
                enterprise_nit: formData.enterprise_nit ?? 0,
                enterprise_location: formData.enterprise_location ?? '',
                enterprise_email: formData.enterprise_email ?? '',
                boss_name: formData.boss_name ?? '',
                boss_phone: formData.boss_phone ?? 0,
                boss_email: formData.boss_email ?? '',
                boss_position: formData.boss_position ?? '',
                human_talent_name: formData.human_talent_name ?? '',
                human_talent_email: formData.human_talent_email ?? '',
                human_talent_phone: typeof formData.human_talent_phone === 'string' ? formData.human_talent_phone : String(formData.human_talent_phone ?? ''),
                sede: formData.sede ?? 0,
                modality_productive_stage: formData.modality_productive_stage ?? 0,
              }}
              updateFormData={updateFormData}
              modalidades={modalidades}
              dateError={dateError}
              minEndDate={minEndDate}
              maxEndDate={maxEndDate}
              handleStartDateChange={handleStartDateChange}
              handleEndDateChange={handleEndDateChange}
              getDocumentTypeName={getDocumentTypeName}
              documentTypes={documentTypes}
            />

            {/* Datos de la Empresa */}
            <EmpresaSection
              formData={{
                name_enterprise: formData.enterprise_name ?? '',
                nit_enterprise: formData.enterprise_nit ?? 0,
                locate: formData.enterprise_location ?? '',
                email_enterprise: formData.enterprise_email ?? '',
              }}
              updateFormData={(field, value) => {
                if (field === 'name_enterprise') updateFormData('enterprise_name', value);
                else if (field === 'nit_enterprise') updateFormData('enterprise_nit', value);
                else if (field === 'locate') updateFormData('enterprise_location', value);
                else if (field === 'email_enterprise') updateFormData('enterprise_email', value);
              }}
            />

            {/* Datos del Jefe Inmediato */}
            <JefeSection
              formData={{
                name_boss: formData.boss_name ?? '',
                email_boss: formData.boss_email ?? '',
                phone_number: typeof formData.boss_phone === 'string' ? Number(formData.boss_phone) : formData.boss_phone ?? 0,
                position: formData.boss_position ?? '',
              }}
              updateFormData={(field, value) => {
                if (field === 'name_boss') updateFormData('boss_name', value);
                else if (field === 'email_boss') updateFormData('boss_email', value);
                else if (field === 'phone_number') updateFormData('boss_phone', value);
                else if (field === 'position') updateFormData('boss_position', value);
              }}
              phoneError={phoneError}
              handlePhoneChange={handlePhoneChange}
            />

            {/* Datos del Encargado de contratación */}
            <TalentoHumanoSection
              formData={{
                name: formData.human_talent_name ?? '',
                email: formData.human_talent_email ?? '',
                phone_number: typeof formData.human_talent_phone === 'string' ? Number(formData.human_talent_phone) : formData.human_talent_phone ?? 0,
              }}
              updateFormData={(field, value) => {
                if (field === 'name') updateFormData('human_talent_name', value);
                else if (field === 'email') updateFormData('human_talent_email', value);
                else if (field === 'phone_number') updateFormData('human_talent_phone', value);
              }}
              humanTalentPhoneError={humanTalentPhoneError}
              handleHumanTalentPhoneChange={handleHumanTalentPhoneChange}
            />

            {/* Archivo PDF */}
            <div >
              
              <PdfUploadSection
                selectedFile={selectedFile}
                handleFileSelect={handleFileSelect}
                triggerFileInput={triggerFileInput}
              />
              
            </div>
            
            {/* Error handling */}
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="text-red-700">{error}</div>
              </div>
            )}

            {/* Botón enviar */}
            <div className="flex flex-col items-center">
              <button 
                type="submit" 
                disabled={loading}
                className={`w-full max-w-md font-bold py-4 rounded-lg text-lg flex items-center justify-center gap-3 transition-all duration-200 ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg transform hover:-translate-y-1'}`}
                style={{ 
                  backgroundColor: loading ? '#999' : COLORS.green,
                  color: COLORS.white 
                }}
              >
                <Send size={24} /> 
                {loading ? 'Enviando...' : 'Enviar Formulario'}
              </button>
              <p className="text-sm text-gray-600 mt-3 text-center">
                Asegúrate de completar todos los campos obligatorios (<span style={{ color: COLORS.error }}>*</span>)
              </p>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}