import { ColorRenderer } from '../../components/field-renderers/color-renderer';
import { ComboboxRenderer } from '../../components/field-renderers/combobox-renderer';
import { DateRangeRenderer } from '../../components/field-renderers/date-range-renderer';
import { FileRenderer } from '../../components/field-renderers/file-renderer';
import { DatePickerRenderer } from '../../components/field-renderers/date-picker-renderer';
import { InputRenderer } from '../../components/field-renderers/input-renderer';
import { NumberRenderer } from '../../components/field-renderers/number-renderer';
import { RadioGroupRenderer } from '../../components/field-renderers/radio-group-renderer';
import { SearchRenderer } from '../../components/field-renderers/search-renderer';
import { SelectRenderer } from '../../components/field-renderers/select-renderer';
import { TagsRenderer } from '../../components/field-renderers/tags-renderer';
import { TimeRenderer } from '../../components/field-renderers/time-renderer';
import { ToggleRenderer } from '../../components/field-renderers/toggle-renderer';
import { FieldRendererRegistry } from '../field-renderer-registry';

/** A registry with the built-in renderers; a new one each call, so it can be extended safely. */
export function createDefaultRegistry(): FieldRendererRegistry {
  return new FieldRendererRegistry()
    .register('text', InputRenderer)
    .register('email', InputRenderer)
    .register('password', InputRenderer)
    .register('tel', InputRenderer)
    .register('url', InputRenderer)
    .register('search', SearchRenderer)
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
