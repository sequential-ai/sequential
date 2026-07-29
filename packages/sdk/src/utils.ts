export const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export const calculateExponentialBackoff = (
  attempt: number,
  baseDelay = 1000,
  maxDelay = 10000
): number => {
  // exponential backoff with jitter
  const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
  const jitter = delay * 0.2 * Math.random();
  return delay + jitter;
};
