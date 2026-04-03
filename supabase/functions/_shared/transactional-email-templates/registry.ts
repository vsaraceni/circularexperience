/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'

export interface EditableField {
  label: string
  default: string
  placeholder: string
}

export interface TemplateEntry {
  component: React.ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  to?: string
  displayName?: string
  previewData?: Record<string, any>
  editableFields?: Record<string, EditableField>
}

import { template as dailyDigest } from './daily-digest.tsx'
import { template as callScheduledAlert } from './call-scheduled-alert.tsx'
import { template as dailyPerformance } from './daily-performance.tsx'

export const TEMPLATES: Record<string, TemplateEntry> = {
  'daily-digest': dailyDigest,
  'call-scheduled-alert': callScheduledAlert,
  'daily-performance': dailyPerformance,
}
