import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import { getPrograms } from '@/Api/Services/Program';

/**
 * Type definition for select options in the autocomplete component.
 * Represents a selectable option with value and display label.
 */
interface OptionType {
  /** Unique identifier value for the option */
  value: string;
  /** Display text shown to the user */
  label: string;
}

/**
 * Props interface for the ProgramAutocomplete component.
 * Defines the properties needed for program selection functionality.
 */
interface ProgramAutocompleteProps {
  /** Currently selected program option */
  value: OptionType | null;
  /** Callback function called when selection changes */
  onChange: (option: OptionType | null) => void;
  /** Placeholder text shown when no option is selected. Defaults to "Programa" */
  placeholder?: string;
}

/**
 * ProgramAutocomplete component - Autocomplete dropdown for program selection.
 *
 * This component provides a searchable dropdown for selecting training programs.
 * It fetches program data from the API on mount and includes a "All programs"
 * option at the top. The component uses react-select for enhanced UX with
 * search, clear, and loading states.
 *
 * Features:
 * - Asynchronous program data loading from API
 * - Searchable dropdown with react-select
 * - "All programs" option included by default
 * - Loading state during data fetch
 * - Clearable selection
 * - Custom styling for consistent UI
 * - Responsive design with min/max width constraints
 *
 * @param props - The component props
 * @returns An autocomplete dropdown for program selection
 *
 * @example
 * ```tsx
 * <ProgramAutocomplete
 *   value={selectedProgram}
 *   onChange={(option) => setSelectedProgram(option)}
 *   placeholder="Select a program"
 * />
 * ```
 */
const ProgramAutocomplete: React.FC<ProgramAutocompleteProps> = ({ value, onChange, placeholder }) => {
  // State for available program options
  const [options, setOptions] = useState<OptionType[]>([]);

  // Loading state during API fetch
  const [loading, setLoading] = useState(false);

  // Fetch programs from API on component mount
  useEffect(() => {
    setLoading(true);
    getPrograms()
      .then((programs: { id: number; name: string }[]) => {
        // Transform API data to select options, adding "All programs" option
        setOptions([
          { value: 'TODOS', label: 'Todos los programas' },
          ...programs.map((p) => ({ value: String(p.id), label: p.name })),
        ]);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <Select
      value={value}
      onChange={onChange}
      options={options}
      isClearable
      isSearchable
      placeholder={placeholder || 'Programa'}
      isLoading={loading}
      styles={{
        // Container styling with responsive width constraints
        container: (base) => ({ ...base, minWidth: 220, maxWidth: 320, height: 40, display: 'flex', alignItems: 'center' }),
        // Control (input container) styling
        control: (base) => ({
          ...base,
          minHeight: 40,
          height: 40,
          borderRadius: 8,
          borderColor: '#d1d5db',
          boxShadow: 'none',
          fontSize: '1rem',
        }),
        // Value container (selected value display area)
        valueContainer: (base) => ({ ...base, height: 40, padding: '0 8px', display: 'flex', alignItems: 'center' }),
        // Input field styling
        input: (base) => ({ ...base, margin: 0, padding: 0 }),
        // Indicators container (dropdown arrow, clear button)
        indicatorsContainer: (base) => ({ ...base, height: 40 }),
        // Placeholder text styling
        placeholder: (base) => ({ ...base, fontSize: '1rem', color: '#000' }),
        // Individual option styling with hover effects
        option: (base, state) => ({
          ...base,
          fontSize: '1rem',
          backgroundColor: state.isFocused ? '#bdbdbd' : '#fff',
          color: state.isFocused ? '#000' : '#222',
        }),
        // Dropdown menu container with z-index for proper layering
        menu: (base) => ({ ...base, zIndex: 50 }),
      }}
    />
  );
};

export default ProgramAutocomplete;
