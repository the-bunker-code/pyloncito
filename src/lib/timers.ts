export function cancelableTimeout(callback: () => void, milliseconds: number): () => void {
  const id = window.setTimeout(callback, milliseconds);
  return () => window.clearTimeout(id);
}

export function wait(milliseconds: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Aborted', 'AbortError'));
      return;
    }

    const id = window.setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, milliseconds);

    function onAbort(): void {
      window.clearTimeout(id);
      reject(new DOMException('Aborted', 'AbortError'));
    }

    signal?.addEventListener('abort', onAbort, { once: true });
  });
}
