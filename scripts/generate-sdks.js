const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const rootDir = path.resolve(__dirname, '..');
const openApiSpec = path.join(rootDir, 'server', 'docs', 'openapi.yaml');

// Ensure OpenAPI spec exists
if (!fs.existsSync(openApiSpec)) {
    console.error(`Error: OpenAPI spec not found at ${openApiSpec}`);
    process.exit(1);
}

// Ensure @openapitools/openapi-generator-cli is installed
try {
    execSync('npx @openapitools/openapi-generator-cli version', { stdio: 'ignore' });
} catch (e) {
    console.log('Installing @openapitools/openapi-generator-cli...');
    execSync('npm install -g @openapitools/openapi-generator-cli', { stdio: 'inherit' });
}

console.log('--- Generating Python SDK ---');
const pythonOutputDir = path.join(rootDir, 'packages', 'sdk-python');
execSync(
    `npx @openapitools/openapi-generator-cli generate ` +
    `-i "${openApiSpec}" ` +
    `-g python ` +
    `-o "${pythonOutputDir}" ` +
    `--additional-properties=packageName=sequential_ai,packageVersion=0.1.0`,
    { stdio: 'inherit' }
);

console.log('--- Generating Node SDK ---');
const nodeOutputDir = path.join(rootDir, 'packages', 'sdk-node');
execSync(
    `npx @openapitools/openapi-generator-cli generate ` +
    `-i "${openApiSpec}" ` +
    `-g typescript-node ` +
    `-o "${nodeOutputDir}" ` +
    `--additional-properties=supportsES6=true`,
    { stdio: 'inherit' }
);

console.log('SDK generation complete.');
