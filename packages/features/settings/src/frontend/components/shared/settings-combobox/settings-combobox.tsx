'use client';

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '@synapcity/frontend-ui/core/combobox';

type Option<T extends string> = { value: T; label: string };

type SettingsComboboxProps<T extends string> = {
  id: string;
  value: T;
  onChange: (value: T) => void;
  options: Option<T>[];
  placeholder?: string;
  empty?: string;
};

/** A searchable SettingsSelect, for lists too long to scroll through. */
export function SettingsCombobox<T extends string>({
  id,
  value,
  onChange,
  options,
  placeholder = 'Search…',
  empty = 'No matches.',
}: SettingsComboboxProps<T>) {
  const selected = options.find((option) => option.value === value) ?? null;
  return (
    <Combobox
      items={options}
      value={selected}
      onValueChange={(next) => {
        if (next) onChange(next.value);
      }}
      itemToStringLabel={(option) => option.label}
      isItemEqualToValue={(option, current) => option.value === current.value}
    >
      <ComboboxInput
        id={id}
        aria-describedby={`${id}-description`}
        placeholder={placeholder}
        className="w-full sm:w-64"
      />
      <ComboboxContent>
        <ComboboxEmpty>{empty}</ComboboxEmpty>
        <ComboboxList>
          {(option: Option<T>) => (
            <ComboboxItem key={option.value} value={option}>
              {option.label}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
