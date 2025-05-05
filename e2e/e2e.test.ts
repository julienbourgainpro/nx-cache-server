import $ from '@david/dax';
import { beforeAll, describe, it } from '@std/testing/bdd';
import { join } from '@std/path/join';

function generateRandomString(length: number) {
  return Math.random().toString(36).substring(2, 2 + length);
}

describe('Remote Cache', () => {
  const workspaceName = generateRandomString(10);

  beforeAll(async () => {
    await $`rm -rf tmp`;
    await $`mkdir -p tmp`;

    await $`npx -y create-nx-workspace@20.8 --name=${workspaceName} --preset=react-monorepo --interactive=false --workspaceType=integrated --appName=web --e2eTestRunner=none --unitTestRunner=none --skipGit`
      .cwd(join(Deno.cwd(), 'tmp'));
  });

  it('should store and retrieve cache artifacts', async () => {
    const workspacePath = join(Deno.cwd(), 'tmp', workspaceName);

    try {
      // Configure Nx to use our cache server
      await $`echo 'NX_SELF_HOSTED_REMOTE_CACHE_SERVER=http://localhost:3000' >> .env`
        .cwd(workspacePath);
      await $`echo 'NX_SELF_HOSTED_REMOTE_CACHE_ACCESS_TOKEN=test-token' >> .env`
        .cwd(workspacePath);

      // First build - should miss cache
      const firstBuild = await $`npx nx build web --verbose`
        .cwd(workspacePath)
        .env('NX_SELF_HOSTED_REMOTE_CACHE_SERVER', 'http://localhost:3000')
        .env('NX_SELF_HOSTED_REMOTE_CACHE_ACCESS_TOKEN', 'test-token')
        .printCommand().stdout('inheritPiped');

      // Verify cache miss
      if (
        !firstBuild.stdout.includes(
          'Successfully ran target build for project web',
        )
      ) {
        console.log(firstBuild.stdout);
        throw new Error('Expected cache miss on first build');
      }

      // Second build - should hit cache
      const secondBuild = await $`npx nx build web`
        .cwd(workspacePath)
        .env('NX_SELF_HOSTED_REMOTE_CACHE_SERVER', 'http://localhost:3000')
        .env('NX_SELF_HOSTED_REMOTE_CACHE_ACCESS_TOKEN', 'test-token')
        .printCommand().stdout('inheritPiped');

      // Verify cache hit
      if (
        !secondBuild.stdout.includes(
          'Nx read the output from the cache instead',
        )
      ) {
        console.log(secondBuild.stdout);
        throw new Error('Expected cache hit on second build');
      }
    } catch (error) {
      throw error;
    }
  });
});
