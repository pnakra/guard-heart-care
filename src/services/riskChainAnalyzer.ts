// ============================================================
// Risk Chain Analyzer - Detects emergent risks from capability combinations
// ============================================================

import { RiskChain } from '@/types/ethicsV2';
import { SeverityLevel } from '@/types/ethics';
import { DetectedCapability, MisuseScenario } from '@/data/mockMisuseData';

interface ChainPattern {
  capabilities: string[];
  emergentRisk: string;
  severity: SeverityLevel;
  whyWorse: string;
  visualChain: string;
}

// Known dangerous capability combinations
const KNOWN_CHAINS: ChainPattern[] = [
  {
    capabilities: ['location-tracking', 'user-profiles'],
    emergentRisk: 'Location data combined with identity enables precise stalking of individuals',
    severity: 'critical',
    whyWorse: 'Location alone is less dangerous without identity; identity alone limits real-world harm',
    visualChain: 'user-profiles → identifies target → location-tracking → physical stalking',
  },
  {
    capabilities: ['ai-image-gen', 'image-upload'],
    emergentRisk: 'AI generation with user photos enables deepfake creation',
    severity: 'critical',
    whyWorse: 'AI generation without source material is less harmful; uploads without AI are just storage',
    visualChain: 'image-upload → provides source → ai-image-gen → creates synthetic media',
  },
  {
    capabilities: ['messaging', 'user-search'],
    emergentRisk: 'Discovery + messaging enables targeted harassment campaigns',
    severity: 'high',
    whyWorse: 'Search without contact limits stalking; messaging without search limits targeting',
    visualChain: 'user-search → finds target → messaging → harassment campaign',
  },
  {
    capabilities: ['location-tracking', 'messaging'],
    emergentRisk: 'Location + messaging enables coordinated physical-world threats',
    severity: 'critical',
    whyWorse: 'Threats gain credibility when attacker demonstrates location knowledge',
    visualChain: 'location-tracking → knows whereabouts → messaging → "I know where you are"',
  },
  {
    capabilities: ['ai-image-gen', 'user-profiles', 'messaging'],
    emergentRisk: 'Complete pipeline for synthetic media harassment with delivery mechanism',
    severity: 'critical',
    whyWorse: 'Each capability is concerning alone but together enable end-to-end abuse workflow',
    visualChain: 'user-profiles → get face → ai-image-gen → create fake → messaging → deliver threat',
  },
];

/**
 * Find capability chains that match detected capabilities
 */
function findMatchingChains(capabilities: DetectedCapability[]): ChainPattern[] {
  const capabilityIds = new Set(capabilities.map(c => c.id));
  
  return KNOWN_CHAINS.filter(chain =>
    chain.capabilities.every(reqCap => capabilityIds.has(reqCap))
  );
}

/**
 * Find chains from misuse scenarios that use multiple capabilities
 */
function findScenarioChains(
  scenarios: MisuseScenario[],
  capabilities: DetectedCapability[]
): ChainPattern[] {
  return scenarios
    .filter(s => s.capabilities.length >= 2)
    .map(scenario => {
      const caps = scenario.capabilities;
      return {
        capabilities: caps,
        emergentRisk: scenario.description,
        severity: scenario.severity as SeverityLevel,
        whyWorse: `These ${caps.length} capabilities combine to enable: ${scenario.title}`,
        visualChain: caps.join(' → '),
      };
    });
}

/**
 * Calculate risk contribution from a chain
 */
function calculateChainRiskContribution(
  chain: ChainPattern,
  capabilities: DetectedCapability[]
): number {
  const severityWeight: Record<SeverityLevel, number> = {
    critical: 4.0,
    high: 2.5,
    medium: 1.5,
    low: 0.5,
    safe: 0,
  };
  
  // Base risk from severity
  const baseRisk = severityWeight[chain.severity];
  
  // Multiply by number of high-risk capabilities involved
  const highRiskCount = chain.capabilities.filter(capId => {
    const cap = capabilities.find(c => c.id === capId);
    return cap?.riskLevel === 'high';
  }).length;
  
  const multiplier = 1 + (highRiskCount * 0.3);
  
  return Math.round(baseRisk * multiplier * 10) / 10;
}

/**
 * Find affected scenarios for a chain
 */
function findAffectedScenarios(
  chain: ChainPattern,
  scenarios: MisuseScenario[]
): string[] {
  return scenarios
    .filter(s => 
      chain.capabilities.some(cap => s.capabilities.includes(cap))
    )
    .map(s => s.id);
}

/**
 * Generate mitigation requirement text
 */
function generateMitigationRequirement(chain: ChainPattern): string {
  if (chain.capabilities.length === 2) {
    return `Fix BOTH capabilities - fixing only one leaves the chain exploitable`;
  }
  
  return `Address at least ${Math.ceil(chain.capabilities.length / 2)} of ${chain.capabilities.length} capabilities to break the chain`;
}

/**
 * Main function - analyze capabilities for risk chains
 */
export function analyzeRiskChains(
  capabilities: DetectedCapability[],
  scenarios: MisuseScenario[]
): RiskChain[] {
  const chains: RiskChain[] = [];
  const seenChains = new Set<string>();
  
  // Find known dangerous combinations
  const matchedChains = findMatchingChains(capabilities);
  
  for (const pattern of matchedChains) {
    const chainKey = pattern.capabilities.sort().join('-');
    if (seenChains.has(chainKey)) continue;
    seenChains.add(chainKey);
    
    chains.push({
      id: `chain-${chainKey}`,
      capabilities: pattern.capabilities,
      emergentRisk: pattern.emergentRisk,
      severity: pattern.severity,
      whyWorse: pattern.whyWorse,
      affectedScenarios: findAffectedScenarios(pattern, scenarios),
      mitigationRequires: generateMitigationRequirement(pattern),
      riskContribution: calculateChainRiskContribution(pattern, capabilities),
      visualChain: pattern.visualChain,
    });
  }
  
  // Find chains from scenarios that weren't in known patterns
  const scenarioChains = findScenarioChains(scenarios, capabilities);
  
  for (const pattern of scenarioChains) {
    const chainKey = pattern.capabilities.sort().join('-');
    if (seenChains.has(chainKey)) continue;
    seenChains.add(chainKey);
    
    chains.push({
      id: `scenario-chain-${chainKey}`,
      capabilities: pattern.capabilities,
      emergentRisk: pattern.emergentRisk,
      severity: pattern.severity,
      whyWorse: pattern.whyWorse,
      affectedScenarios: [pattern.capabilities[0]], // Link back to source scenario
      mitigationRequires: generateMitigationRequirement(pattern),
      riskContribution: calculateChainRiskContribution(pattern, capabilities),
      visualChain: pattern.visualChain,
    });
  }
  
  // Sort by risk contribution (highest first)
  return chains.sort((a, b) => b.riskContribution - a.riskContribution);
}

/**
 * Get chains that would be broken by fixing a specific capability
 */
export function getChainsAffectedByFix(
  capabilityId: string,
  chains: RiskChain[]
): RiskChain[] {
  return chains.filter(chain => chain.capabilities.includes(capabilityId));
}

/**
 * Calculate total chain risk contribution
 */
export function calculateTotalChainRisk(chains: RiskChain[]): number {
  // Don't double-count overlapping chains - use diminishing returns
  return chains.reduce((total, chain, index) => {
    const diminishingFactor = Math.pow(0.8, index);
    return total + (chain.riskContribution * diminishingFactor);
  }, 0);
}
