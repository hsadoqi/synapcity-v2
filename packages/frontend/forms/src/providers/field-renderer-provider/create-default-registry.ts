import { NumberRenderer } from '../../components/number-renderer';
import { SelectRenderer } from '../../components/select-renderer';
import { TextRenderer } from '../../components/text-renderer';
import { ToggleRenderer } from '../../components/toggle-renderer';
import { FieldRendererRegistry } from './field-renderer-registry';

/** A registry with the built-in renderers; a new one each call, so it can be extended safely. */
export function createDefaultRegistry(): FieldRendererRegistry {
  return new FieldRendererRegistry()
    .register('text', TextRenderer)
    .register('email', TextRenderer)
    .register('password', TextRenderer)
    .register('textarea', TextRenderer)
    .register('number', NumberRenderer)
    .register('select', SelectRenderer)
    .register('checkbox', ToggleRenderer)
    .register('switch', ToggleRenderer);
}
