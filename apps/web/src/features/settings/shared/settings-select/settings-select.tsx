'use client';

import type { ReactNode } from 'react';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
} from '@synapcity/frontend-ui/core/select';

type SettingsSelectProps<T extends string> = {
  id: string;
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: ReactNode; icon?: ReactNode }[];
};

export function SettingsSelect<T extends string>({
  id,
  value,
  onChange,
  options,
}: SettingsSelectProps<T>) {
  const selected = options.find((option) => option.value === value);
  return (
    <Select
      value={value}
      onValueChange={(next) => {
        if (next !== null) onChange(next);
      }}
      items={options}
    >
      <SelectTrigger
        id={id}
        aria-describedby={`${id}-description`}
        className="w-full sm:w-48"
      >
        <SelectValue>
          <span className="flex items-center gap-2">
            {selected?.icon}
            {selected?.label}
          </span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.icon}
              {option.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
