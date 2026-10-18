import { FileText } from 'lucide-react';

import type { ResourceConfig } from './resource-config';

export const DOCUMENTS: ResourceConfig = {
  labels: { plural: 'Documents', singular: 'document' },
  icon: FileText,
  emptyCopy: {
    title: 'Nothing written yet',
    global:
      "Your first document can be a list, a draft, or a half-formed thought. It doesn't have to be good yet.",
    space: (spaceName) =>
      `${spaceName} is still quiet. Add a document to give it something to hold.`,
  },
};
