module.exports = async ({ github, context }) => {
  const newTag = process.env.NEW_TAG;
  const repository = process.env.REPOSITORY;

  const { data } = await github.rest.repos.generateReleaseNotes({
    owner: context.repo.owner,
    repo: context.repo.repo,
    tag_name: newTag,
  });

  const dockerInfo = `
As with all our previous releases, you can find the Docker images:
- [Backend](https://ghcr.io/${repository}/backend:${newTag})
- [Ingester](https://ghcr.io/${repository}/ingester:${newTag})
`;

  await github.rest.repos.createRelease({
    owner: context.repo.owner,
    repo: context.repo.repo,
    tag_name: newTag,
    name: data.name,
    body: data.body + dockerInfo,
    draft: true,
    prerelease: false,
  });
};