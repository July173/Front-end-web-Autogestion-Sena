import { useState, useEffect } from 'react';
import { requestAsignation } from '../Api/types/Modules/assign.types';
import { 
  Regional,
  Sede,
  Center,
  Program,
  Ficha,
} from '../Api/types/Modules/general.types';
import { getRegionales } from '../Api/Services/Regional';
import { getSedes } from '../Api/Services/Sede';
import { getCenters } from '../Api/Services/Center';
import { getPrograms, getProgramFichas } from '../Api/Services/Program';
import { postRequestAssignation, postPdfRequest } from '../Api/Services/RequestAssignaton';
import { getModalityProductiveStages, ModalityProductiveStage } from '../Api/Services/ModalityProductiveStage';

export const useRequestAssignation = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  
  // States for selects
  const [regionales, setRegionales] = useState<Regional[]>([]);
  const [centros, setCentros] = useState<Center[]>([]);
  const [sedes, setSedes] = useState<Sede[]>([]);
  const [programas, setProgramas] = useState<Program[]>([]);
  const [fichas, setFichas] = useState<Ficha[]>([]);
  const [modalidades, setModalidades] = useState<ModalityProductiveStage[]>([]);

  // States for the form
  const [formData, setFormData] = useState<Partial<requestAsignation>>({
    apprentice: 0,
    ficha: 0,
    date_end_contract: 0,
    date_start_contract: 0,
    enterprise_name: '',
    enterprise_nit: 0,
    enterprise_location: '',
    enterprise_email: '',
    boss_name: '',
    boss_phone: 0,
    boss_email: '',
    boss_position: '',
    human_talent_name: '',
    human_talent_email: '',
    human_talent_phone: '',
    sede: 0,
    modality_productive_stage: 0,
  });

  // Auxiliary states for cascade selection
  const [selectedRegional, setSelectedRegional] = useState<number>(0);
  const [selectedCenter, setSelectedCenter] = useState<number>(0);
  const [selectedProgram, setSelectedProgram] = useState<number>(0);

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [regionalesData, centrosData, sedesData, programasData, modalidadesData] = await Promise.all([
          getRegionales(),
          getCenters(),
          getSedes(),
          getPrograms(),
          getModalityProductiveStages(),
        ]);
        
        setRegionales(regionalesData);
        setCentros(centrosData);
        setSedes(sedesData);
        setProgramas(programasData);
        setModalidades(modalidadesData);
      } catch (err) {
        setError('Error al cargar los datos iniciales');
      }
    };

    loadInitialData();
  }, []);

  // Update fichas when program changes
  useEffect(() => {
    if (selectedProgram) {
      getProgramFichas(selectedProgram)
        .then(setFichas)
        .catch(() => {
          setFichas([]);
          setError('Error al cargar las fichas del programa');
        });
    } else {
      setFichas([]);
    }
    // Clear selected ficha
    setFormData(prev => ({ ...prev, fichaId: 0 }));
  }, [selectedProgram]);

  // Filters for cascade selection
  const centrosFiltrados = centros.filter(c => c.regional === selectedRegional);
  const sedesFiltradas = sedes.filter(s => s.center === selectedCenter);

  // Functions to update the form
  const updateFormData = (field: keyof requestAsignation, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const updateSelectedRegional = (regionalId: number) => {
    setSelectedRegional(regionalId);
    setSelectedCenter(0);
    setFormData(prev => ({ ...prev, sede: 0 }));
  };

  const updateSelectedCenter = (centerId: number) => {
    setSelectedCenter(centerId);
    setFormData(prev => ({ ...prev, sede: 0 }));
  };

  const updateSelectedProgram = (programId: number) => {
    setSelectedProgram(programId);
  };

  // Function to submit the request - MODIFY TO RECEIVE DATA
  const submitRequest = async (dataToSubmit?: Partial<requestAsignation>): Promise<number | null> => {
    setLoading(true);
    setError('');

    // Use the data passed as parameter or from state
    const finalData: Partial<requestAsignation> = dataToSubmit || formData;
    try {
      // Validate required basic data
      const { apprentice, ficha, sede } = finalData;
      if (!apprentice || !ficha || !sede) {
        throw new Error(`Faltan datos requeridos: apprentice_id(${apprentice}), ficha_id(${ficha}), sede_id(${sede})`);
      }

  const response = await postRequestAssignation(finalData as requestAsignation);
  return response.data?.id || null;
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Error al enviar la solicitud');
      }
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Function to upload PDF
  const uploadPdf = async (file: File, requestId?: number): Promise<boolean> => {
    setLoading(true);
    setError('');

    try {
      await postPdfRequest(file, requestId);
      return true;
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Error al subir el archivo PDF');
      }
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    // Estados
    loading,
    error,
    formData,
    
    // Data for selects
    regionales,
    centrosFiltrados,
    sedesFiltradas,
    programas: programas.filter(p => p.active),
    fichas: fichas.filter(f => f.active),
    modalidades: modalidades.filter(m => m.active === true),
    
    // Auxiliary states
    selectedRegional,
    selectedCenter,
    selectedProgram,
    
    // Funciones - ACTUALIZAR SIGNATURE DE SUBMITREQUEST
    updateFormData,
    updateSelectedRegional,
    updateSelectedCenter,
    updateSelectedProgram,
    submitRequest, // Ahora puede recibir datos como parámetro
    uploadPdf,
    
    // Function to clear errors
    clearError: () => setError(''),
  };
};