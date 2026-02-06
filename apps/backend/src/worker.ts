import { bootstrapWorker } from '@vendure/core';
import { config } from './index';

async function startWorker() {
  const worker = await bootstrapWorker(config);
  await worker.startJobQueue();
  console.log('Vendure worker started and processing job queue');
}

if (require.main === module) {
  startWorker().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
