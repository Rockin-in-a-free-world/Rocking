This repo contains some testing that demonstrates a 

- working docusaurus-compatible plugin
- remark modules cleaning up some of the imports

Let's redefine and extend the scope of this tooling then propose a plan to implement, given the current code: /Users/harriebickle/GitHub/Consensys/docs-template

Extend then rewire this tooling: /Users/harriebickle/GitHub/delete-rocking/Rocking-here/Rocking/porting-data/test-duplicate-data to bring 1 folder and 1 file from a different folder from public MetaMask docs site (https://docs.metamask.io/services) to this site: /Users/harriebickle/GitHub/Consensys/docs-template.

I will make you your own branch to work on at /Users/harriebickle/GitHub/Consensys/docs-template your readme is this named file: /Users/harriebickle/GitHub/Consensys/docs-template/docs/single-source/between-repos/port-data.md

Extended scope:

Docusaurus plugin + remark transforms (several are solved and ready for tests)
Function: Treat upstream (MetaMask) as the single content source for specified folders and page/s in the downstream site: a plugin (remark/rehype) rewrites links that fit given patterns, and gets images needed to include at/ahead of build time.

Pros
Single source of truth. You don’t duplicate content; Docusaurus reads directly from upstream (via git submodule, subtree, or checked‑out directory) and transforms it in memory.

Very fine‑grained control. Remark is good at AST‑level rewriting:

Replace only links matching patterns (e.g. /docs/public-networks/**).

Drop links that don’t match.

Rewrite image paths and conditionally include images.

Always up‑to‑date on build. No CI wiring to watch upstream; whenever upstream changes and you bump the submodule/branch, your build picks it up automatically.

Great for MD/MDX quirks. You can normalise front matter, convert ad‑hoc shortcodes to components, and enforce house style in one place.

To overcome less explicit review surface. Include a pr when changes occur upstream so you get a human‑readable “sync PR”, even if this is already merged due to build, someone still can revert if they dont approve the PR. You still have diff showing exactly what changed after rewriting.

This system uses yaml to control the systematic rewriting (paths, components, callouts).

Include some test coverage for the custom remark/rehype plugins and document the test coverage around them.

More on the GitHub CI that opens sync PRs

- A CI workflow watches upstream every 24 hrs at noon UTC), pulls changed Markdown/MDX + images, rewrites/organises them, and opens/updates PRs in your downstream repo.

Pros
Explicit, reviewable changes. Each upstream change becomes a PR with a concrete diff in your repo; maintainers review like any other code change.

Decoupled builds. Docusaurus sees plain local files; your build doesn’t depend on extra plumbing beyond normal MD/MDX support.

Easier to experiment/override. If you want to diverge from upstream on a page, you can reject or edit the sync PR for that file.

Good audit trail. Git history clearly shows “sync from upstream at commit X” with all link/image rewrites already applied.

Cons
More CI surface area. You’re now maintaining a sync script + workflow (likely with some AST or regex transforms) and dealing with auth, rate‑limits, and conflicts.

Potential PR noise. Busy upstream means a lot of sync PRs unless you batch them (e.g. scheduled weekly job).

Risk of drift. If sync PRs don’t get merged regularly, your docs lag upstream.

When this shines
You want humans in the loop for each upstream change (especially where downstream has its own navigation, product framing, or legal constraints).

The transformation rules are relatively stable, and you’re happy to apply them once per change in CI.

You care about a clear Git history in the downstream repo, not just runtime transforms.

No heavy plugin needed for porting; at most a small remark plugin for lightweight presentational tweaks.

Build uses local MD/MDX as if they were first‑class docs.

Retain the ability to evolve your link/image rewrite logic in a single CI script instead of weaving it deep into the site runtime.


