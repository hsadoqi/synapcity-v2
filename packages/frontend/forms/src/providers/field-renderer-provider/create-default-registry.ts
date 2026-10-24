import { ColorRenderer } from '../../components/color-renderer';
import { ComboboxRenderer } from '../../components/combobox-renderer';
import { DateRangeRenderer } from '../../components/date-range-renderer';
import { FileRenderer } from '../../components/file-renderer';
import { DatePickerRenderer } from '../../components/date-picker-renderer';
import { InputRenderer } from '../../components/input-renderer';
import { NumberRenderer } from '../../components/number-renderer';
import { RadioGroupRenderer } from '../../components/radio-group-renderer';
import { SelectRenderer } from '../../components/select-renderer';
import { TagsRenderer } from '../../components/tags-renderer';
import { TimeRenderer } from '../../components/time-renderer';
import { ToggleRenderer } from '../../components/toggle-renderer';
import { FieldRendererRegistry } from './field-renderer-registry';

/** A registry with the built-in renderers; a new one each call, so it can be extended safely. */
export function createDefaultRegistry(): FieldRendererRegistry {
  return new FieldRendererRegistry()
    .register('text', InputRenderer)
    .register('email', InputRenderer)
    .register('password', InputRenderer)
    .register('tel', InputRenderer)
    .register('url', InputRenderer)
    .register('search', InputRenderer)
    .register('textarea', InputRenderer)
    .register('file', FileRenderer)
    .register('date', DatePickerRenderer)
    .register('date-range', DateRangeRenderer)
    .register('time', TimeRenderer)
    .register('datetime-local', InputRenderer)
    .register('month', InputRenderer)
    .register('week', InputRenderer)
    .register('color', ColorRenderer)
    .register('range', NumberRenderer)
    .register('number', NumberRenderer)
    .register('select', SelectRenderer)
    .register('multiselect', ComboboxRenderer)
    .register('tags', TagsRenderer)
    .register('radio', RadioGroupRenderer)
    .register('checkbox', ToggleRenderer)
    .register('switch', ToggleRenderer);
}
