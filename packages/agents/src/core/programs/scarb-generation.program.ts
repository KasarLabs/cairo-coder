import { ax, AxGen, f } from '@ax-llm/ax';

const ANSWER_DESCRIPTION = `Practical Scarb guidance and solutions.

Guidelines:
1. Focus on Scarb commands, configuration examples, and troubleshooting steps
2. Use TOML syntax highlighting for Scarb.toml configuration
3. Use bash syntax highlighting for commands
4. Include expected output when relevant
5. Keep explanations concise and action-oriented
6. For non-Scarb queries: I specialize in Scarb build tool assistance. Could you please ask a Scarb-specific question?
`;

export const scarbGenerationProgram: AxGen<
  {
    chat_history: string;
    query: string;
    context: string;
  },
  { answer: string }
> = ax`
  chat_history:${f.string('Previous messages from this conversation')},
  query:${f.string('The users Scarb-related query')},
  context:${f.string('Scarb documentation context')} ->
  answer:${f.string(ANSWER_DESCRIPTION)}
`;

// Set examples for Scarb response generation
scarbGenerationProgram.setExamples([
  {
    chat_history: '',
    query: 'How do I create a new Scarb project?',
    context:
      'scarb new creates a new Scarb project. Use --name to specify project name. Creates Scarb.toml and src/lib.cairo.',
    answer: `To create a new Scarb project:

\`\`\`bash
# Create a new project with a specific name
scarb new --name my_project

# Or create in the current directory
scarb new
\`\`\`

This creates:
- \`Scarb.toml\` - project configuration
- \`src/lib.cairo\` - main library file`,
  },
  {
    chat_history: 'Setting up dependencies',
    query: 'How do I add openzeppelin as a dependency?',
    context:
      'Dependencies are added to Scarb.toml under [dependencies] section. Use package_name = version format.',
    answer: `Add OpenZeppelin to your \`Scarb.toml\`:

\`\`\`toml
[dependencies]
openzeppelin = "2.0.0"

# Or specify from a Git repository
openzeppelin = { git = "https://github.com/OpenZeppelin/cairo-contracts.git", tag = "v2.0.0" }
\`\`\`

Then run:
\`\`\`bash
scarb build
\`\`\``,
  },
  {
    chat_history: '',
    query: 'Tell me about Python',
    context: 'Scarb is a build tool for Cairo projects.',
    answer:
      'I specialize in Scarb build tool assistance. Could you please ask a Scarb-specific question?',
  },
  {
    chat_history: '',
    query: 'How do I configure custom build scripts?',
    context: 'No relevant documentation found for this query.',
    answer:
      "I apologize, but I couldn't find specific information in the provided context about custom build scripts in Scarb. To help with your Scarb issue, could you please provide more details such as:\n- The exact error message you're seeing\n- Your Scarb.toml configuration\n- The Scarb command you're running\n- Your Scarb version (run 'scarb --version')",
  },
  {
    chat_history: '',
    query: 'How do I define a workspace in Scarb?',
    context:
      'To create a workspace, add the [workspace] table to Scarb.toml:\n\n```toml\n[workspace]\n# ...\n```\n\nAt minimum, a workspace has to have a member, either with a root package or as a virtual manifest.\n\n### Root package\n\nIf the [workspace] section is added to Scarb.toml that already defines a [package],\nthe package is the root package of the workspace.\nThe workspace root is the directory where the workspace’s Scarb.toml is located.\n\n```toml\n[workspace]\n\n[package]\nname = "hello_world" # the name of the package\nversion = "0.1.0"    # the current version, obeying semver\nauthors = ["Alice <a@example.com>", "Bob <b@example.com>"]\n```\n\n### Virtual workspace\n\nAlternatively, a Scarb.toml file can be created with a [workspace] section but without a [package] section.\nThis is called a virtual manifest.\nThis is typically useful when there isn’t a “primary” package, or you want to keep all the packages organized\nin separate directories.',
    answer: `To define a workspace in Scarb, add the [workspace] section to your root Scarb.toml:

\`\`\`toml
[workspace]
members = ["member1", "member2"]
\`\`\`

This creates a workspace with member packages in the specified directories. For a virtual workspace without a root package, omit [package] and list members.`,
  },
  {
    chat_history: '',
    query: 'Explain profiles in Scarb',
    context:
      '# Profiles\n\nProfiles provide a way to alter the compiler settings.\n\nScarb has 2 built-in profiles: \`dev\` and \`release\`.\nThe profile defaults to \`dev\` if not specified otherwise.\nIn addition to the built-in profiles, user can define custom profiles in the package manifest.\nProfile can be specified through the command line arguments, or with an environment variable.\n\nProfile can be changed in \`Scarb.toml\` manifest within the \`[profile]\` section.\nProfiles defined in dependencies will be ignored.\n\nProfile can alter the compiler settings (analog to manifest \`[cairo]\` section) and custom tool\nmetadata (from \`[tool]\` section).',
    answer: `Profiles in Scarb allow customizing compiler settings. Built-in profiles:

- \`dev\`: Default for development, enables debug features.
- \`release\`: Optimized for production.

Custom profiles inherit from built-ins. Example in Scarb.toml:

\`\`\`toml
[profile.release.cairo]
sierra-replace-ids = false
\`\`\`

Use with: scarb --profile release build`,
  },
  {
    chat_history: '',
    query: 'How do I add a dependency from a Git repository?',
    context:
      '## Specifying dependencies from Git repositories\n\nTo depend on a package located in a Git repository, the minimum information needed to specify is the location of the\nrepository with the \`git\` key:\n\n\`\`\`toml\n[dependencies]\nalexandria_math = { git = "https://github.com/keep-starknet-strange/alexandria.git" }\n\`\`\`\n\nScarb will fetch the \`git\` repository at this location and then look for a \`Scarb.toml\` for the requested package\nanywhere inside the Git repository\n(not necessarily at the root of it - for example, if repository contains multiple packages in subdirectories).\n\nSince no other information has been specified, Scarb assumes that it is intended to use the latest commit on the main\nbranch.\nYou can combine the \`git\` key with \`branch\`, \`tag\` and \`rev\` keys to specify something else.\nHere is an example of specifying that you want to use the latest commit on a branch named \`next\`:\n\n\`\`\`toml\n[dependencies]\nalexandria_math = { git = "https://github.com/keep-starknet-strange/alexandria.git", branch = "next" }\n\`\`\`\n\nAnything that is not a branch or tag falls under \`rev\`.\nThis can be a commit (short) hash, like \`rev = "1f06df93"\`, or a named reference exposed by the remote repository\nsuch as \`rev = "refs/pull/330/head"\`.\nWhat references are available varies by where the repository is hosted; GitHub in particular exposes a reference to the\nmost recent commit of every pull request as shown, but other Git hosts often provide something equivalent, possibly\nunder a different naming scheme.',
    answer: `To add a dependency from Git, add to Scarb.toml:

\`\`\`toml
[dependencies]
alexandria_math = { git = "https://github.com/keep-starknet-strange/alexandria.git", branch = "main" }
\`\`\`

You can specify branch, tag, or rev. Then run:

\`\`\`bash
scarb build
\`\`\`

Expected: Fetches and compiles the dependency.`,
  },
  {
    chat_history: '',
    query: 'How do I compile Starknet contracts with Scarb?',
    context:
      '/website/docs/extensions/starknet/contract-target.md:\n# Starknet Contract Target\n\nThe \`starknet-contract\` target allows to build the package as a [Starknet Contract](https://book.cairo-lang.org/ch13-00-introduction-to-starknet-smart-contracts.html).\nIt searches for all contract classes in the package, and builds a separate compiled JSON file each found class.\nGenerated file will be named with following pattern: \`[target name]_[contract name].contract_class.json\`.\n\nThis target accepts several configuration arguments, beside ones [shared among all targets](../../reference/targets#configuring-a-target), with default values for the default profile:\n\n\`\`\`toml\n[[target.starknet-contract]]\n# Enable Sierra codegen.\nsierra = true\n\n# Enable CASM codegen.\ncasm = false\n# Emit Python-powered hints in order to run compiled CASM class with legacy Cairo VM.\ncasm-add-pythonic-hints = false\n\n# Enable allowed libfuncs validation.\nallowed-libfuncs = true\n# Raise errors instead of warnings if disallowed libfuncs are found.\nallowed-libfuncs-deny = false\n# Reference to the libfuncs allowlist used for validation.\n# - Use \`allowed-libfuncs-list.name\` to use built-in named allowlist.\n# - Use \`allowed-libfuncs-list.path\` to read an allowlist from file.\nallowed-libfuncs-list = {} # Cairo compiler defined\n\n# Emit Starknet artifacts for contracts defined in dependencies.\nbuild-external-contracts = []\n\`\`\`\n\n## Usage\n\nTo enable Starknet contract compilation for a package, write a following line in \`Scarb.toml\`:\n\n\`\`\`toml\n[[target.starknet-contract]]\n\`\`\`\n\nThen, declare a dependency on the [\`starknet\` package](./starknet-package).\nIts version is coupled to Cairo version included in Scarb.\n\n\`\`\`toml-vue\n[dependencies]\nstarknet = "{{ rel.stable.starknetPackageVersionReq }}"\n\`\`\`',
    answer: `To compile Starknet contracts, add to Scarb.toml:

\`\`\`toml
[dependencies]
starknet = ">=2.11.4"

[[target.starknet-contract]]
\`\`\`

Run:

\`\`\`bash
scarb build
\`\`\`

This generates contract_class.json files for each contract. Configure sierra/casm as needed.`,
  },
  {
    chat_history: '',
    query: 'What to do if Scarb causes stack overflow?',
    context:
      "/website/docs/troubleshooting.md:\n# Troubleshooting\n\nIt is possible that you encounter some issues while working with Scarb.\nThis page lists some common issues and their possible solutions.\nBefore reporting an issue to the Scarb team, please make sure to check the following list.\n\n## Stack overflow\n\nIn case of a bug in the Cairo compiler implementation, it may consume too much stack space in some specific cases.\nUsually, this happens while compiling large Cairo codebases.\nThis often results in an error message like:\n\n\`\`\`\nthread 'main' has overflowed its stack\nfatal runtime error: stack overflow\nAborted (core dumped)\n\`\`\`\n\nUsually it does not seem to consume infinite amounts though, so you can try to confine it in an arbitrarily chosen\nbig memory chunk.\n\nTo run the Cairo compiler with a bigger stack size, you can use the \`RUST_MIN_STACK\` environmental variable.\nFor example, to set the stack size to 128MB, you can run:\n\n\`\`\`bash\nRUST_MIN_STACK=134217728 scarb build\n\`\`\`\n\nPlease note that this is a workaround and not a permanent solution.\nIf you encounter this issue, please report it to the compiler team at [Cairo issues].",
    answer: `Stack overflow may occur due to Cairo compiler bugs in large projects. As a workaround, increase stack size:

\`\`\`bash
RUST_MIN_STACK=134217728 scarb build
\`\`\`

If persists, report to Cairo GitHub issues with details: error message, Scarb.toml, command, and Scarb version.`,
  },
  {
    chat_history: '',
    query: 'How do I publish a package to registry?',
    context:
      '/website/docs/registries/publishing.md:\n# Publishing your package\n\nTo share your package, it must be packaged into an archive and uploaded to the registry.\nOnce uploaded, it will be available for other users to download and use.\n\n## Publishing the package\n\nTo upload your package, use the scarb publish command.\nBy default, this command will publish your package to the official [scarbs.xyz](https://scarbs.xyz) registry.\nThe publish command automatically [packages and verifies](#packaging-your-package) your package, so there is no need to\nrun \`scarb package\` beforehand.\n\nTo publish your package to a registry that supports package publishing, you need to authenticate using an API token with\nthe \`publish\` scope.\nFirst, log in to the registry and [in the dashboard](https://scarbs.xyz/dashboard) generate the API token.\nScarb will use the token to authenticate and complete the publishing process.\nThe token must be provided via the \`SCARB_REGISTRY_AUTH_TOKEN\` environment variable.\n\n\`\`\`shell\nSCARB_REGISTRY_AUTH_TOKEN=scrb_mytoken scarb publish\n\`\`\`\n\n> [!NOTE]\n> In case of any problems with publishing of your package to the registry\n> please reach out to us on [Telegram](https://t.me/scarbs_xyz) or [Discord](https://discord.gg/7YXj4Z2).\n\n### Publishing to a custom registrty\n\nYou can also publish your package to a custom registry by using the --index argument.\nThis allows you to specify the path to a local directory where you want to store your packages.\n\n\`\`\`shell\nscarb publish --index file:///Users/foo/bar\n\`\`\`',
    answer: `To publish to the official registry, run:

\`\`\`bash
SCARB_REGISTRY_AUTH_TOKEN=your_token scarb publish
\`\`\`

Obtain token from scarbs.xyz dashboard. For custom registry:

\`\`\`bash
scarb publish --index file:///path/to/registry
\`\`\`

Ensure publish=true in Scarb.toml. If issues, contact support.`,
  },
  {
    chat_history: '',
    query: 'How to define custom scripts in Scarb?',
    context: `/website/docs/reference/scripts.md:
# Scripts

Your package can define custom, cross-platform commands specific to a codebase.

## Defining commands

To define a custom command, add \`[scripts]\` section in your \`Scarb.toml\` file.
This consists of a mapping of command names to command definitions.
Each definition is a string that will be executed by the scripts shell.
For example:

\`\`\`toml
[scripts]
foo = "echo 'Hello'"
bar = "echo 'World!'"
\`\`\`

This section should not contain any values with type different from string, including subtables, arrays, or numbers.
In case the section is empty, it will be ignored.

> [!WARNING]
> In context of a workspace, the \`[scripts]\` section still needs to be defined on the package to take effect.
> Packages can inherit \`scripts\` section from workspace manifest, but only explicitly.
> See [Workspaces](./workspaces#scripts) page for more detailed information.

### Special script names

Some script names are reserved for special purposes and their execution might be associated with additional logic.
The following script names are reserved:

1. \`test\` - This script will be executed when you run \`scarb test\` command.
2. \`package\` - This script will be executed before the packaging process when you run \`scarb package\` command.

## Listing scripts

To list all available scripts, you can use \`scarb run\` command.
It will list all available scripts and their definitions.

For example:

\`\`\`shell
$ scarb run
Scripts available via \`scarb run\`:
bar                 : echo 'World!'
foo                 : echo 'Hello'
\`\`\`

## Running scripts

\`scarb run\` uses a cross-platform shell that's a subset of sh/bash to execute defined tasks.

To run a script, use \`scarb run <script>\` command.

For example:

\`\`\`bash
scarb run foo
\`\`\`

The script definition from \`Scarb.toml\` file will be parsed and executed by the scripts shell.`,
    answer: `Define custom scripts in Scarb.toml:

\`\`\`toml
[scripts]
greet = "echo Hello World"
\`\`\`

List scripts:

\`\`\`bash
scarb run
\`\`\`

Expected output: Lists available scripts.

Run:

\`\`\`bash
scarb run greet
\`\`\`

Output: Hello World`,
  },
]);
