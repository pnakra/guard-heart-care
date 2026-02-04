// ============================================================
// Deployment Context Detector - Scans repo for deployment clues
// ============================================================

import { DeploymentContext, DetectionResult, RiskModifiers } from '@/types/ethicsV2';

interface FileInfo {
  name: string;
  content: string;
}

// Platform detection patterns
const PLATFORM_PATTERNS: Record<string, { keywords: string[]; confidence: number }> = {
  'web-app': {
    keywords: ['react', 'vue', 'angular', 'next', 'vite', 'webpack'],
    confidence: 0.9,
  },
  'mobile-app': {
    keywords: ['react-native', 'expo', 'capacitor', 'ionic', 'flutter'],
    confidence: 0.9,
  },
  'desktop-app': {
    keywords: ['electron', 'tauri', 'nwjs'],
    confidence: 0.85,
  },
  'pwa': {
    keywords: ['service-worker', 'manifest.json', 'workbox'],
    confidence: 0.8,
  },
};

// Data residency patterns
const DATA_PATTERNS: Record<string, { keywords: string[]; confidence: number; risk: string }> = {
  'client-side-only': {
    keywords: ['localStorage', 'sessionStorage', 'indexedDB'],
    confidence: 0.85,
    risk: 'Medium - Client-side storage vulnerable to device access',
  },
  'server-side': {
    keywords: ['api/', 'fetch(', 'axios', 'supabase', 'firebase', 'prisma'],
    confidence: 0.9,
    risk: 'Depends on server security configuration',
  },
  'hybrid': {
    keywords: ['sync', 'offline', 'cache'],
    confidence: 0.75,
    risk: 'Mixed - Both client and server storage with sync',
  },
};

// Auth detection patterns
const AUTH_PATTERNS: Record<string, { keywords: string[]; confidence: number; risk: string }> = {
  'supabase-auth': {
    keywords: ['supabase.auth', '@supabase/auth', 'useSession'],
    confidence: 0.95,
    risk: 'Low - Established auth provider with security best practices',
  },
  'firebase-auth': {
    keywords: ['firebase/auth', 'onAuthStateChanged', 'firebase.auth'],
    confidence: 0.95,
    risk: 'Low - Established auth provider with security best practices',
  },
  'custom-auth': {
    keywords: ['jwt', 'jsonwebtoken', 'passport', 'bcrypt'],
    confidence: 0.8,
    risk: 'Medium - Custom auth requires careful implementation',
  },
  'none': {
    keywords: [],
    confidence: 0.95,
    risk: 'Variable - No auth may be appropriate or risky depending on data sensitivity',
  },
};

// Audience detection keywords
const AUDIENCE_KEYWORDS: Record<string, { patterns: string[]; riskModifier: number }> = {
  'children': {
    patterns: ['kids', 'children', 'minors', 'under 13', 'parental'],
    riskModifier: 1.5,
  },
  'teens-and-young-adults': {
    patterns: ['teen', 'young', 'student', 'college', 'youth', 'school'],
    riskModifier: 1.3,
  },
  'vulnerable-populations': {
    patterns: ['abuse', 'victim', 'survivor', 'mental health', 'crisis', 'recovery', 'addiction'],
    riskModifier: 1.4,
  },
  'general': {
    patterns: [],
    riskModifier: 1.0,
  },
};

/**
 * Detect platform from package.json and file structure
 */
function detectPlatform(files: FileInfo[]): DetectionResult {
  const packageJson = files.find(f => f.name === 'package.json');
  const allContent = files.map(f => f.content).join(' ').toLowerCase();
  const evidence: string[] = [];
  
  for (const [platform, config] of Object.entries(PLATFORM_PATTERNS)) {
    const matches = config.keywords.filter(kw => 
      allContent.includes(kw.toLowerCase())
    );
    
    if (matches.length > 0) {
      evidence.push(...matches.map(m => `Found '${m}' in dependencies`));
      return {
        detected: platform,
        confidence: config.confidence,
        evidence: evidence.slice(0, 3),
      };
    }
  }
  
  return {
    detected: 'web-app',
    confidence: 0.7,
    evidence: ['Defaulted to web-app based on project structure'],
  };
}

/**
 * Detect data residency patterns
 */
function detectDataResidency(files: FileInfo[]): DetectionResult {
  const allContent = files.map(f => f.content).join(' ');
  const evidence: string[] = [];
  
  let serverPatterns = 0;
  let clientPatterns = 0;
  
  for (const [type, config] of Object.entries(DATA_PATTERNS)) {
    const matches = config.keywords.filter(kw => allContent.includes(kw));
    
    if (type === 'server-side' && matches.length > 0) {
      serverPatterns = matches.length;
      evidence.push(...matches.map(m => `Server-side pattern: ${m}`));
    }
    if (type === 'client-side-only' && matches.length > 0) {
      clientPatterns = matches.length;
      evidence.push(...matches.map(m => `Client-side storage: ${m}`));
    }
  }
  
  if (serverPatterns > 0 && clientPatterns > 0) {
    return {
      detected: 'hybrid',
      confidence: 0.8,
      evidence: evidence.slice(0, 3),
      risk: 'Mixed storage model - verify both client and server security',
    };
  }
  
  if (serverPatterns > 0) {
    return {
      detected: 'server-side',
      confidence: 0.85,
      evidence: evidence.slice(0, 3),
      risk: DATA_PATTERNS['server-side'].risk,
    };
  }
  
  if (clientPatterns > 0) {
    return {
      detected: 'client-side-only',
      confidence: 0.85,
      evidence: evidence.slice(0, 3),
      risk: DATA_PATTERNS['client-side-only'].risk,
    };
  }
  
  return {
    detected: 'unknown',
    confidence: 0.5,
    evidence: ['No clear data storage patterns detected'],
    risk: 'Unable to assess data residency risk',
  };
}

/**
 * Detect target audience from content
 */
function detectTargetAudience(files: FileInfo[], projectName: string): DetectionResult {
  const allContent = [
    projectName.toLowerCase(),
    ...files.map(f => f.content.toLowerCase()),
  ].join(' ');
  
  const evidence: string[] = [];
  let riskModifier = 1.0;
  let detectedAudience = 'general';
  let confidence = 0.6;
  
  for (const [audience, config] of Object.entries(AUDIENCE_KEYWORDS)) {
    const matches = config.patterns.filter(p => allContent.includes(p));
    
    if (matches.length > 0 && config.riskModifier > riskModifier) {
      detectedAudience = audience;
      riskModifier = config.riskModifier;
      evidence.push(...matches.map(m => `Found audience indicator: '${m}'`));
      confidence = Math.min(0.9, 0.6 + matches.length * 0.1);
    }
  }
  
  const riskLevel = riskModifier > 1.3 ? 'High' : riskModifier > 1.1 ? 'Medium' : 'Low';
  
  return {
    detected: detectedAudience,
    confidence,
    evidence: evidence.slice(0, 3),
    risk: `${riskLevel} - ${detectedAudience === 'general' ? 'General audience' : `${detectedAudience} population increases harm potential`}`,
  };
}

/**
 * Detect authentication model
 */
function detectAuthModel(files: FileInfo[]): DetectionResult {
  const allContent = files.map(f => f.content).join(' ');
  const evidence: string[] = [];
  
  for (const [authType, config] of Object.entries(AUTH_PATTERNS)) {
    if (authType === 'none') continue;
    
    const matches = config.keywords.filter(kw => allContent.includes(kw));
    
    if (matches.length > 0) {
      evidence.push(...matches.map(m => `Auth pattern detected: ${m}`));
      return {
        detected: authType,
        confidence: config.confidence,
        evidence: evidence.slice(0, 3),
        risk: config.risk,
      };
    }
  }
  
  return {
    detected: 'none',
    confidence: 0.9,
    evidence: ['No authentication libraries detected'],
    risk: 'Low for privacy, but limits abuse prevention capabilities',
  };
}

/**
 * Calculate risk modifiers based on deployment context
 */
function calculateRiskModifiers(
  baseScore: number,
  audience: DetectionResult,
  dataResidency: DetectionResult,
  auth: DetectionResult,
  files: FileInfo[]
): RiskModifiers {
  const allContent = files.map(f => f.content).join(' ').toLowerCase();
  
  // Vulnerable population modifier
  let vulnerablePopulation = 1.0;
  const vulnerableKeywords = ['abuse', 'victim', 'child', 'minor', 'crisis', 'mental health'];
  if (vulnerableKeywords.some(kw => allContent.includes(kw))) {
    vulnerablePopulation = 1.3;
  }
  
  // Sensitive content modifier
  let sensitiveContent = 1.0;
  const sensitiveKeywords = ['health', 'medical', 'financial', 'sexual', 'location', 'biometric'];
  const sensitiveMatches = sensitiveKeywords.filter(kw => allContent.includes(kw));
  if (sensitiveMatches.length >= 2) {
    sensitiveContent = 1.2;
  } else if (sensitiveMatches.length === 1) {
    sensitiveContent = 1.1;
  }
  
  // Lack of auth modifier (reduces risk if auth present)
  const lackOfAuth = auth.detected === 'none' ? 1.1 : 0.9;
  
  const totalModifier = Math.round(vulnerablePopulation * sensitiveContent * lackOfAuth * 100) / 100;
  const adjustedRiskScore = Math.min(10, Math.round(baseScore * totalModifier * 10) / 10);
  
  return {
    vulnerablePopulation,
    sensitiveContent,
    lackOfAuth,
    totalModifier,
    adjustedRiskScore,
  };
}

/**
 * Main function - detect deployment context from files
 */
export function detectDeploymentContext(
  files: FileInfo[],
  projectName: string,
  baseRiskScore: number
): DeploymentContext {
  const platform = detectPlatform(files);
  const dataResidency = detectDataResidency(files);
  const targetAudience = detectTargetAudience(files, projectName);
  const authenticationModel = detectAuthModel(files);
  
  const riskModifiers = calculateRiskModifiers(
    baseRiskScore,
    targetAudience,
    dataResidency,
    authenticationModel,
    files
  );
  
  return {
    platform,
    dataResidency,
    targetAudience,
    authenticationModel,
    riskModifiers,
  };
}
