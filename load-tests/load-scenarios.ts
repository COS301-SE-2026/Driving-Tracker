export interface LoadScenario {
  name: string;
  vus: number;
  duration: string;
  rampUp?: string;
  description: string;
}

export const loadScenarios: Record<string, LoadScenario> = {
  smoke: {
    name: 'Smoke Test',
    vus: 2,
    duration: '10s',
    description: 'Quick test with minimal load to verify endpoints work',
  },
  light: {
    name: 'Light Load',
    vus: 10,
    duration: '30s',
    description: 'Light load test (10 concurrent users)',
  },
  moderate: {
    name: 'Moderate Load',
    vus: 20,
    duration: '60s',
    rampUp: '10s',
    description: 'Moderate load test (20 concurrent users, 10s ramp-up)',
  },
  stress: {
    name: 'Stress Test',
    vus: 25,
    duration: '120s',
    rampUp: '30s',
    description: 'Stress test (50 concurrent users, 30s ramp-up)',
  },
  spike: {
    name: 'Spike Test',
    vus: 100,
    duration: '30s',
    description: 'Sudden spike to 100 concurrent users',
  },
};

export function getScenario(name: string): LoadScenario {
  const scenario = loadScenarios[name];
  if (!scenario) {
    throw new Error(
      `Unknown scenario: ${name}. Available: ${Object.keys(loadScenarios).join(', ')}`
    );
  }
  return scenario;
}