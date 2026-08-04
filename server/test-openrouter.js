require('dotenv').config();
const { OpenRouterWorker } = require('./src/workers/openrouter.worker');

async function main() {
  try {
    const worker = new OpenRouterWorker();
    const result = await worker.run({
      messages: [{ role: 'user', content: 'Say "hello world" and nothing else.' }]
    });
    
    console.log('Result:', JSON.stringify(result, null, 2));
    
    console.log('\n--- Stream Test ---');
    const streamResult = await worker.run({
      messages: [{ role: 'user', content: 'Say "hello world" and nothing else, but stream it.' }],
      stream: true,
      onChunk: (chunk) => process.stdout.write(chunk)
    });
    
    console.log('\n\nStream Result Object:', JSON.stringify(streamResult, null, 2));

  } catch (error) {
    console.error('Error:', error);
  }
}

main();
