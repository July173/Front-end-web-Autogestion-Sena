import React, { useState } from 'react';
import { Search } from 'lucide-react';
import CustomSelect from './CustomSelect';
import ProgramAutocomplete from './ProgramAutocomplete';

/**
 * Configuration interface for select dropdowns in the filter bar.
 * Defines the structure for each select element including options and behavior.
 */
interface SelectConfig {
  /** Unique name identifier for the select field */
  name: string;
  /** Current selected value */
  value: string;
  /** Array of available options for the select */
  options: Array<{ value: string; label: string }>;
  /** Placeholder text to display when no option is selected */
  placeholder?: string;
  /** Whether this select should use autocomplete functionality */
  autocomplete?: boolean;
}

/**
 * Props interface for the FilterBar component.
 * Defines the properties needed to configure the filter bar behavior.
 */
interface FilterBarProps {
  /** Callback function called whenever filters change, receives filter parameters */
  onFilter: (params: Record<string, string>) => void;
  /** Optional width for the search input field */
  inputWidth?: string;
  /** Placeholder text for the search input. Defaults to "Buscar..." */
  searchPlaceholder?: string;
  /** Array of select configurations to render additional filter dropdowns */
  selects?: SelectConfig[];
}

/**
 * FilterBar component - A comprehensive search and filter interface.
 *
 * This component provides a search input field combined with multiple select dropdowns
 * for advanced filtering capabilities. It supports both regular selects and program
 * autocomplete functionality. All filter changes are communicated through the onFilter callback.
 *
 * Features:
 * - Search input with icon
 * - Multiple configurable select dropdowns
 * - Special program autocomplete support
 * - Automatic filter state management
 * - Clear all filters functionality
 *
 * @example
 * ```tsx
 * const filterConfigs = [
 *   {
 *     name: 'status',
 *     value: '',
 *     options: [
 *       { value: 'active', label: 'Active' },
 *       { value: 'inactive', label: 'Inactive' }
 *     ],
 *     placeholder: 'Select Status'
 *   }
 * ];
 *
 * <FilterBar
 *   onFilter={(params) => console.log('Filters:', params)}
 *   searchPlaceholder="Search items..."
 *   selects={filterConfigs}
 * />
 * ```
 *
 * @param props - The component props
 * @returns A filter bar with search input and select dropdowns
 */
const FilterBar: React.FC<FilterBarProps> = ({
  onFilter,
  inputWidth,
  searchPlaceholder = 'Buscar...',
  selects = [],
}) => {
  // State for search input value
  const [search, setSearch] = useState('');

  // State for all select dropdown values, initialized from selects config
  const [selectValues, setSelectValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    selects.forEach(sel => {
      initial[sel.name] = sel.value || '';
    });
    return initial;
  });

  // State for program autocomplete selection
  const [programOption, setProgramOption] = useState<{ value: string; label: string } | null>(null);

  // Handle search input changes and trigger filter callback
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearch(value);
    onFilter({ search: value, ...selectValues });
  };

  // Handle select dropdown changes and trigger filter callback
  const handleSelectChange = (name: string, value: string) => {
    const newSelects = { ...selectValues, [name]: value };
    setSelectValues(newSelects);
    onFilter({ search, ...newSelects, programa: programOption?.value || '' });
  };

  // Handle program autocomplete changes and trigger filter callback
  const handleProgramChange = (option: { value: string; label: string } | null) => {
    setProgramOption(option);
    onFilter({ search, ...selectValues, programa: option?.value || '' });
  };

  // Clear all filters and reset to initial state
  const handleClear = () => {
    setSearch('');
    const cleared: Record<string, string> = {};
    selects.forEach(sel => {
      cleared[sel.name] = '';
    });
    setSelectValues(cleared);
    setProgramOption(null);
    onFilter({ search: '', ...cleared, programa: '' });
  };

  return (
    <div className="flex flex-wrap gap-2 mb-6 items-center">
      {/* Search input with search icon */}
      <div className="relative" style={{ width: inputWidth || '320px' }}>
        <input
          type="text"
          placeholder={searchPlaceholder}
          value={search}
          onChange={handleSearchChange}
          className="border rounded px-3 py-2 w-full pl-9"
          style={{ width: '100%' }}
        />
        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400">
          <Search size={18} />
        </span>
      </div>

      {/* Render select dropdowns based on configuration */}
      {selects.map(sel => (
        sel.name === 'programa' ? (
          // Special handling for program autocomplete
          <div key={sel.name} style={{ minWidth: '320px', maxWidth: '220px', display: 'flex', alignItems: 'center', gap: '0px' }}>
            <ProgramAutocomplete
              value={programOption}
              onChange={handleProgramChange}
              placeholder={sel.placeholder || 'Programa'}
            />

          </div>
        ) : (
          // Regular select dropdown
          <div key={sel.name} style={{ minWidth: '190px', maxWidth: '220px' }}>
            <CustomSelect
              value={selectValues[sel.name] === '' ? 'all' : selectValues[sel.name]}
              onChange={val => handleSelectChange(sel.name, val === 'all' ? '' : val)}
              options={[
                { value: 'all', label: sel.placeholder || 'Todos' },
                ...sel.options.filter(opt => opt.value !== '')
              ]}
              placeholder={sel.placeholder || 'Todos'}
              label={''}
              classNames={{
                trigger: 'border rounded px-3 py-2 w-full flex items-center justify-between h-10 min-h-[40px]',
                content: 'bg-white border border-gray-300 rounded-lg shadow-lg z-50',
                item: 'px-4 py-2 cursor-pointer hover:bg-[#bdbdbd] hover:text-white focus:bg-[#bdbdbd] focus:text-gray-700 rounded-md flex items-center gap-2',
              }}
            />
          </div>
        )
      ))}
    </div>
  );
};

export default FilterBar;
