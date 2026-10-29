const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
const token = process.env.CLOUDFLARE_API_TOKEN;
const workerName = process.env.CLOUDFLARE_WORKER_NAME ?? 'pyloncito';
const previewBranch = process.env.CLOUDFLARE_PREVIEW_BRANCH ?? 'develop';
const previewName = process.env.CLOUDFLARE_PREVIEW_NAME ?? 'dev';
const dryRun = process.env.DRY_RUN === '1';
const apiBase = 'https://api.cloudflare.com/client/v4';

if (!accountId || !token) {
  process.stderr.write('Set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN.\n');
  process.exitCode = 1;
} else {
  try {
    await main();
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}

async function api(path, options = {}) {
  const response = await fetch(`${apiBase}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  const body = await response.json();
  if (!response.ok || body.success === false) {
    const message = body.errors?.map((item) => item.message).join('; ') ?? response.statusText;
    throw new Error(`${options.method ?? 'GET'} ${path}: ${message}`);
  }
  return body.result;
}

async function main() {
  const scripts = await api(`/accounts/${accountId}/workers/scripts`);
  const worker = scripts.find((script) => script.id === workerName || script.name === workerName);
  if (!worker) throw new Error(`Worker not found: ${workerName}`);
  if (!worker.tag) throw new Error(`Worker tag missing for ${workerName}`);

  const triggers = await api(`/accounts/${accountId}/builds/workers/${worker.tag}/triggers`);
  const production = triggers.find((trigger) => trigger.branch_includes?.includes('main'));
  const preview = triggers.find((trigger) => trigger !== production);

  if (!production) throw new Error('Production trigger not found. Check Builds in the dashboard.');
  if (!preview) {
    throw new Error(
      'Preview trigger not found. Enable Preview Builds in the Worker dashboard and rerun.',
    );
  }

  const productionPayload = {
    build_command: 'pnpm build',
    deploy_command: 'npx wrangler deploy',
    root_directory: '/',
    branch_includes: ['main'],
    branch_excludes: [],
  };
  const previewPayload = {
    build_command: 'pnpm build',
    deploy_command: `npx wrangler preview --name ${previewName}`,
    root_directory: '/',
    branch_includes: [previewBranch],
    branch_excludes: [],
  };

  process.stdout.write(`Worker: ${workerName} (${worker.tag})\n`);
  process.stdout.write(`Production trigger: ${production.trigger_uuid}\n`);
  process.stdout.write(`Preview trigger: ${preview.trigger_uuid}\n`);

  if (dryRun) {
    process.stdout.write(`Production patch: ${JSON.stringify(productionPayload)}\n`);
    process.stdout.write(`Preview patch: ${JSON.stringify(previewPayload)}\n`);
    return;
  }

  await api(`/accounts/${accountId}/builds/triggers/${production.trigger_uuid}`, {
    method: 'PATCH',
    body: JSON.stringify(productionPayload),
  });
  await api(`/accounts/${accountId}/builds/triggers/${preview.trigger_uuid}`, {
    method: 'PATCH',
    body: JSON.stringify(previewPayload),
  });

  process.stdout.write(`Production builds only from main.\n`);
  process.stdout.write(`Preview builds only from ${previewBranch}, named ${previewName}.\n`);
}
