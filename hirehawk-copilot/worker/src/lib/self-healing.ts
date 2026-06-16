export enum FailureType {
  F1_HALLUCINATION = "hallucination",
  F2_EXECUTION = "execution_error",
  F3_REASONING = "reasoning_inconsistency",
}

export class SelfHealingError extends Error {
  constructor(public failureType: FailureType, public original: Error, public attempts: number) {
    super(`${failureType} after ${attempts} attempts: ${original.message}`);
  }
}

function classify(e: Error): FailureType {
  const m = e.message.toLowerCase();
  if (/timeout|rate limit|429|503|fetch failed|network/.test(m)) return FailureType.F2_EXECUTION;
  if (/hallucinat|fabricat|not supported by evidence|schema/.test(m)) return FailureType.F1_HALLUCINATION;
  return FailureType.F3_REASONING;
}

export async function selfHealing<T>(
  fn: (correctiveContext?: string) => Promise<T>,
  opts: { maxRetries?: number; baseDelay?: number; fallback?: T } = {}
): Promise<T> {
  const { maxRetries = 3, baseDelay = 10, fallback } = opts; // default low delay for fast tests
  let corrective: string | undefined;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn(corrective);
    } catch (e: any) {
      const type = classify(e);
      if (attempt < maxRetries) {
        corrective = `PREVIOUS ATTEMPT FAILED (${type}): ${e.message}. Fix this in your next response — do not repeat the mistake.`;
        const isRateLimit = /429|rate limit/.test(e.message.toLowerCase());
        const delay = isRateLimit ? Math.max(baseDelay * 2 ** (attempt - 1), 1000) : baseDelay * 2 ** (attempt - 1);
        await new Promise((r) => setTimeout(r, delay));
      } else {
        if (fallback !== undefined) return fallback;
        throw new SelfHealingError(type, e, maxRetries);
      }
    }
  }
  throw new Error("unreachable");
}

export class CircuitBreaker {
  private failures = 0;
  private lastFailure = 0;
  private state: "CLOSED" | "OPEN" | "HALF_OPEN" = "CLOSED";
  constructor(private threshold = 3, private recoveryMs = 60000) {}

  getState() {
    return this.state;
  }

  async call<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === "OPEN") {
      if (Date.now() - this.lastFailure > this.recoveryMs) {
        this.state = "HALF_OPEN";
      } else {
        throw new Error(`Circuit OPEN — retry in ${this.recoveryMs}ms`);
      }
    }
    try {
      const result = await fn();
      if (this.state === "HALF_OPEN") {
        this.state = "CLOSED";
        this.failures = 0;
      }
      return result;
    } catch (e) {
      this.failures++;
      this.lastFailure = Date.now();
      if (this.failures >= this.threshold) {
        this.state = "OPEN";
      }
      throw e;
    }
  }
}
