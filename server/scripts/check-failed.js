const { Queue } = require('bullmq');
const Redis = require('ioredis');

const connection = new Redis('redis://localhost:6379');
const researchQueue = new Queue('researchQueue', { connection });

async function checkFailed() {
  const failed = await researchQueue.getFailed(0, 100);
  console.log(`Failed jobs count: ${failed.length}`);
  
  const extractFailed = failed.filter(j => j.name === 'EXTRACT');
  console.log(`EXTRACT Failed jobs count: ${extractFailed.length}`);
  if (extractFailed.length > 0) {
    for (let i = 0; i < Math.min(5, extractFailed.length); i++) {
      console.log(`Job: ${extractFailed[i].id}, Error: ${extractFailed[i].failedReason}`);
    }
  }
  
  process.exit(0);
}

checkFailed();
