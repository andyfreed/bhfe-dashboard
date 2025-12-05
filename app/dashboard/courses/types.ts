// Type definitions for WordPress course sync and inspection

export interface MetaKeyData {
  type: string
  is_array?: boolean
  is_object?: boolean
  sample_value?: string | number | boolean | object | null
}

export interface MetaKeysResponse {
  unique_meta_keys: number
  total_courses_checked: number
  taxonomies?: string[]
  meta_keys?: Record<string, MetaKeyData>
  note?: string
}

export interface CourseInspectionData {
  id: number
  title: string
  post_status: string
  version_content?: Record<string, unknown>
  all_meta?: Record<string, unknown>
}

export interface InspectionResponse {
  courses_inspected: number
  common_meta?: Record<string, unknown>
  courses?: CourseInspectionData[]
}
