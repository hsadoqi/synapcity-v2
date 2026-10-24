import { FileRenderer } from '../../components/file-renderer';
import { InputRenderer } from '../../components/input-renderer';
import { NumberRenderer } from '../../components/number-renderer';
import { SelectRenderer } from '../../components/select-renderer';
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
    .register('number', NumberRenderer)
    .register('select', SelectRenderer)
    .register('checkbox', ToggleRenderer)
    .register('switch', ToggleRenderer);
}
