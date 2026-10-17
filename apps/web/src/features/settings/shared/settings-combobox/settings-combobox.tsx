'use client';

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '@synapcity/frontend-ui/core/combobox';

type Option<T extends string> = {
  value: T;
  label: string;
  /** Shown beside the label in the list, such as a timezone's UTC offset. */
  detail?: string;
  /** Other words a search should match, such as "Pacific" or "PDT". */
  keywords?: string;
};

type SettingsComboboxProps<T extends string> = {
  id: string;
  value: T;
  onChange: (value: T) => void;
  options: Option<T>[];
  placeholder?: string;
  empty?: string;
};

function matches<T extends string>(option: Option<T>, query: string) {
  const search = query.trim().toLocaleLowerCase();
  if (!search) return true;
  return [option.label, option.detail, option.keywords]
    .join(' ')
    .toLocaleLowerCase()
    .includes(search);
}

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
      filter={matches}
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
              <span className="flex min-w-0 flex-1 items-baseline justify-between gap-3">
                <span className="truncate">{option.label}</span>
                {option.detail && (
                  <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                    {option.detail}
                  </span>
                )}
              </span>
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
