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

export const mockCapabilities: DetectedCapability[] = [
  {
    id: 'image-upload',
    name: 'Image Upload',
    description: 'Users can upload image files to the application',
    riskLevel: 'medium',
    detectedIn: ['src/components/ProfileEditor.tsx', 'src/components/PostCreator.tsx'],
  },
  {
    id: 'user-profiles',
    name: 'User Profiles with Photos',
    description: 'Public user profiles displaying photos and personal information',
    riskLevel: 'medium',
    detectedIn: ['src/pages/Profile.tsx', 'src/components/UserCard.tsx'],
  },
  {
    id: 'location-tracking',
    name: 'Geolocation Access',
    description: 'Application requests access to user location data',
    riskLevel: 'high',
    detectedIn: ['src/hooks/useLocation.ts', 'src/components/NearbyUsers.tsx'],
  },
  {
    id: 'messaging',
    name: 'Direct Messaging',
    description: 'Users can send private messages to each other',
    riskLevel: 'medium',
    detectedIn: ['src/components/Chat.tsx', 'src/pages/Messages.tsx'],
  },
  {
    id: 'user-search',
    name: 'User Search & Discovery',
    description: 'Users can search for and discover other users',
    riskLevel: 'low',
    detectedIn: ['src/components/SearchBar.tsx', 'src/pages/Explore.tsx'],
  },
  {
    id: 'ai-image-gen',
    name: 'AI Image Generation',
    description: 'Integration with AI image generation APIs',
    riskLevel: 'high',
    detectedIn: ['src/utils/aiGenerate.ts', 'src/components/ImageGenerator.tsx'],
  },
];

export const mockMisuseScenarios: MisuseScenario[] = [
  {
    id: 'deepfakes',
    title: 'Synthetic Media / Deepfakes',
    description: 'AI image generation combined with user photos could enable creation of non-consensual synthetic images or deepfakes.',
    capabilities: ['ai-image-gen', 'image-upload', 'user-profiles'],
    severity: 'critical',
    realWorldExample: 'In 2023, AI-generated intimate images were used to harass and extort victims, with some cases leading to suicide.',
    mitigations: [
      'Implement content moderation for AI-generated images',
      'Add invisible watermarks to all AI-generated content',
      'Prohibit face-swapping or person-specific generation',
      'Require consent verification for images involving real people',
    ],
  },
  {
    id: 'stalking',
    title: 'Location-Based Stalking',
    description: 'Location tracking combined with user profiles enables stalkers to track victims\' movements and whereabouts.',
    capabilities: ['location-tracking', 'user-profiles', 'user-search'],
    severity: 'critical',
    realWorldExample: 'Dating apps have been exploited to stalk individuals, with some cases resulting in physical harm or death.',
    mitigations: [
      'Fuzz or delay location data (show approximate areas, not exact locations)',
      'Allow users to hide from specific people',
      'Implement rate limiting on location queries',
      'Add "ghost mode" to hide location temporarily',
    ],
  },
  {
    id: 'harassment',
    title: 'Targeted Harassment Campaigns',
    description: 'Direct messaging combined with user discovery enables coordinated harassment of individuals.',
    capabilities: ['messaging', 'user-search', 'user-profiles'],
    severity: 'high',
    realWorldExample: 'Social platforms have been used to organize "dogpiling" harassment campaigns against individuals.',
    mitigations: [
      'Implement message filtering and reporting',
      'Allow users to restrict who can message them',
      'Detect and limit mass-messaging patterns',
      'Provide easy blocking and muting tools',
    ],
  },
  {
    id: 'catfishing',
    title: 'Identity Fraud / Catfishing',
    description: 'Image upload and profile features could be used to impersonate real people or create fake identities.',
    capabilities: ['image-upload', 'user-profiles', 'messaging'],
    severity: 'high',
    realWorldExample: 'Romance scams using fake profiles cost victims $1.3 billion in 2022 according to the FTC.',
    mitigations: [
      'Offer optional identity verification badges',
      'Implement reverse image search on uploads',
      'Add profile authenticity indicators',
      'Educate users about verification status',
    ],
  },
];

export const getCapabilityById = (id: string): DetectedCapability | undefined => {
  return mockCapabilities.find(c => c.id === id);
};

export const getScenariosByCapability = (capabilityId: string): MisuseScenario[] => {
  return mockMisuseScenarios.filter(s => s.capabilities.includes(capabilityId));
};
