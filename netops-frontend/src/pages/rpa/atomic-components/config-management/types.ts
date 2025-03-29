export interface ConfigFile {
  id: string;
  name: string;
  type: string;
  content: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
  device_type: string;
  status: string;
  versions?: Array<{
    version: number;
    content: string;
    comment: string;
    created_at: string;
    created_by: string;
  }>;
}

export interface ConfigGeneratorProps {
  templates: ConfigFile[];
  onSave: (config: any) => void;
}

export interface ConfigParameter {
  name: string;
  type: string;
  required: boolean;
  default?: any;
  description?: string;
} 