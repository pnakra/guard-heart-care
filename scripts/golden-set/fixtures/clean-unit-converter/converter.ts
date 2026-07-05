// A plain, self-contained unit converter. No users, no data collection, no AI,
// no persuasion, no admin powers — should scan as clean / very low risk.

export function celsiusToFahrenheit(c: number): number {
  return (c * 9) / 5 + 32;
}

export function fahrenheitToCelsius(f: number): number {
  return ((f - 32) * 5) / 9;
}

export function milesToKilometers(miles: number): number {
  return miles * 1.60934;
}

export function kilometersToMiles(km: number): number {
  return km / 1.60934;
}

export function formatResult(value: number, unit: string): string {
  return `${Math.round(value * 100) / 100} ${unit}`;
}
