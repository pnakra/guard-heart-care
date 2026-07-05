// Shared types for detected capabilities and misuse scenarios. These were once
// exported from a mock-data fixture (`src/data/mockMisuseData.ts`); they now live
// here as real domain types, decoupled from any sample data.

export interface DetectedCapability {
  id: string;
  name: string;
  description: string;
  riskLevel: 'low' | 'medium' | 'high';
  detectedIn: string[];
}

export interface MisuseScenario {
  id: string;
  title: string;
  description: string;
  capabilities: string[]; // IDs of capabilities that enable this
  severity: 'medium' | 'high' | 'critical';
  realWorldExample?: string;
  mitigations: string[];
}
