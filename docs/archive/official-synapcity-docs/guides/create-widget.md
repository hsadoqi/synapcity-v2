# Guide: Create a Widget

Use this guide when adding a new dashboard widget.

---

## Strict implementation checklist

### 1. Define the widget purpose clearly

Before building, answer:

- what information this widget surfaces
- which feature owns the source data
- whether the widget is read-only or interactive
- what should appear in view mode
- what should appear in edit mode or inspector mode

### 2. Create a widget definition

```ts
export const documentCardWidget: WidgetDefinition<DocumentCardWidgetConfig> = {
  id: 'document-card',
  label: 'Document Card',
  category: 'documents',
  defaultSize: { w: 4, h: 3 },
  minSize: { w: 3, h: 2 },
  defaultConfig: {
    showUpdatedAt: true,
    previewLength: 180,
  },
  render: DocumentCardWidget,
  inspector: DocumentCardWidgetInspector,
}
```

### 3. Define a typed config schema

```ts
type DocumentCardWidgetConfig = {
  documentId?: string | null
  showUpdatedAt: boolean
  previewLength: number
}
```

Config must be serializable and small.

### 4. Create a renderer with standard states

The renderer must support:

- loading state
- empty state
- error state
- compact layout behavior
- accessible actions
- calm visual treatment

### 5. Add an inspector if the widget is configurable

The inspector should:

- edit widget config only
- leave source data ownership with the owning feature
- be available in edit mode

### 6. Register the widget

```ts
widgetRegistry.register(documentCardWidget)
```

### 7. Persist widget instances through the dashboard model

A widget instance should be stored with the dashboard, not as a standalone top-level object.

### 8. Test the widget

Every widget should have tests for:

- rendering with default config
- missing source data
- inspector updates
- minimum-size behavior
- view/edit mode behavior
- source-data ownership

---

## Widget boundaries

- widgets may reference source documents by ID
- widgets must not own source document content
- widgets must not directly import dashboard internals beyond the contract they receive
- widgets must not duplicate the entire document object in config
- widgets should not introduce project/reference/resource/runbook assumptions in V0

---

## Naming conventions

- widget ids: lowercase kebab-case
- widget definition names: `camelCaseWidget`
- widget config types: `PascalCaseWidgetConfig`

---

## Future exploration

- widget presets
- richer inspector patterns
- future organization widgets
- inline actions such as creating a new document from a widget
