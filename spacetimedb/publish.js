import { execSync } from 'child_process';
import path from 'path';

const projectDir = process.cwd();
const dbName = 'spacetimedb-uorks';

console.log(`Publishing SpacetimeDB module from ${projectDir} to ${dbName}...`);

try {
    // Run build first explicitly
    console.log('Running build...');
    execSync('spacetime build', { stdio: 'inherit' });

    // Run publish
    // We explicitly pass the project path with quotes
    console.log('Running publish...');
    execSync(`spacetime publish -y --project-path "${projectDir}" ${dbName}`, { stdio: 'inherit' });

    console.log('Publish successful!');
} catch (err) {
    console.error('Publish failed:', err.message);
    process.exit(1);
}
