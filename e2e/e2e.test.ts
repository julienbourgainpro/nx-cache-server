import { execSync } from 'node:child_process';
import { join } from 'node:path';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { test } from 'node:test';

function generateRandomString(length: number) {
  return Math.random().toString(36).substring(2, 2 + length);
}

test('Remote Cache should store and retrieve cache artifacts', async () => {
  const workspaceName = generateRandomString(10);

  rmSync('tmp', { recursive: true, force: true });
  mkdirSync('tmp', { recursive: true });

  execSync(
    `npx -y create-nx-workspace@20.8 --name=${workspaceName} --preset=react-monorepo --interactive=false --workspaceType=integrated --appName=web --e2eTestRunner=none --unitTestRunner=none --skipGit`,
    { cwd: join(process.cwd(), 'tmp'), stdio: 'inherit' },
  );

  const workspacePath = join(process.cwd(), 'tmp', workspaceName);

  writeFileSync(
    join(workspacePath, '.env'),
    'NX_SELF_HOSTED_REMOTE_CACHE_SERVER=http://localhost:3000\nNX_SELF_HOSTED_REMOTE_CACHE_ACCESS_TOKEN=test-token\n',
    { flag: 'a' },
  );

  const firstBuild = execSync('npx nx build web --verbose', {
    cwd: workspacePath,
    env: {
      ...process.env,
      NX_SELF_HOSTED_REMOTE_CACHE_SERVER: 'http://localhost:3000',
      NX_SELF_HOSTED_REMOTE_CACHE_ACCESS_TOKEN: 'test-token',
    },
    encoding: 'utf8',
  });

  if (!firstBuild.includes('Successfully ran target build for project web')) {
    console.log(firstBuild);
    throw new Error('Expected cache miss on first build');
  }

  const secondBuild = execSync('npx nx build web', {
    cwd: workspacePath,
    env: {
      ...process.env,
      NX_SELF_HOSTED_REMOTE_CACHE_SERVER: 'http://localhost:3000',
      NX_SELF_HOSTED_REMOTE_CACHE_ACCESS_TOKEN: 'test-token',
    },
    encoding: 'utf8',
  });

  if (!secondBuild.includes('Nx read the output from the cache instead')) {
    console.log(secondBuild);
    throw new Error('Expected cache hit on second build');
  }
});
