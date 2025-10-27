"""Analyze and chart LLM dataset outputs for Cairo Coder.

This script supports two primary workflows:
- Define DSPy signatures for filtering/analyzing queries (existing behavior)
- Generate charts from an existing analyzed dataset (new, non-invasive)

Charts generated (from analyzed dataset records):
1) Repartition by category
2) Repartition by intent
3) Top leaves per category
4) Frameworks mentioned

Input formats supported:
- JSON array of runs
- JSON object with key "runs": [...]
- JSON Lines (jsonl), one run per line

Notes:
- By default, records with is_relevant != True are excluded. Use --include-irrelevant to include all.
"""

import argparse
import json
import os
import sys
from collections import Counter, defaultdict
from collections.abc import Iterable
from typing import Any

import dspy
from dspy.adapters.xml_adapter import XMLAdapter


class DatasetAnalyzer(dspy.Signature):
    """
    You are an expert analyst of developer/user queries in the Starknet ecosystem.
    Your job is to **multi-label** each query using the taxonomy below and also infer helpful metadata (intent, stage, difficulty, etc.).
    One query can (and often should) get multiple labels.

    ## Taxonomy

    Choose **leaf labels**. Also include their parent(s) in `hierarchy`.

    ### A. Ecosystem Areas

    * **DeFi**

      * **DeFi/Swaps-AMMs**
      * **DeFi/Lending-Borrowing**
      * **DeFi/Oracles**
      * **DeFi/Bridging-Interop**
      * **DeFi/Staking-Validators**
      * **DeFi/BTCFi**  *(Bitcoin staking/lending on Starknet or L2-bridge contexts)*
    * **NFTs**

      * **NFTs/ERC721**
      * **NFTs/ERC1155**
      * **NFTs/Metadata-TokenURI**
      * **NFTs/Marketplace**
    * **Gaming**

      * **Gaming/ECS-Dojo**
      * **Gaming/Onchain-Game-Logic**
    * **Wallets & AA**

      * **AA/Accounts (ArgentX, Braavos, OZ Account, class hash etc.)**
      * **AA/Paymaster**
      * **Wallets/Connect (starknetkit, Wallet API)**
      * **Auth/SNIP-12 (typed data, signMessage)**
    * **Tooling**

      * **Tooling/StarknetJS**
      * **Tooling/Starkli**
      * **Tooling/Starknet-Foundry (snforge, sncast)**
      * **Tooling/Scarb**
      * **Tooling/Scaffold-Stark**
      * **Tooling/Dojo**
      * **Tooling/Explorer (Voyager/Starkscan)**
    * **Cairo & Contracts**

      * **Cairo/Syntax-Language**
      * **Cairo/Stdlib-Builtins**
      * **Cairo/Storage-Events**
      * **Cairo/Testing**
      * **Cairo/Upgradability**
      * **Cairo/Components (OZ, SRC5, Ownable, AccessControl)**
      * **Cairo/Errors-Debugging**
      * **Cairo/Serialization (Serde/Bytes)**
    * **Transactions & Fees**

      * **TX/Structure-Versions**
      * **TX/Lifecycle-Statuses**
      * **TX/Fee-Estimation-ResourceBounds**
      * **TX/Bridging-Messages (L1<->L2)**
    * **Node & Infra**

      * **Infra/RPC-Methods**
      * **Infra/Sequencer-Mempool**
      * **Infra/Run-Node/Validators**
    * **Security**

      * **Security/Verification-Source**
      * **Security/Audits-BugBounty**
      * **Security/AccessControl**
    * **Docs & Versions**

      * **Docs/Where-Is**
      * **Versions/Latest-Tools**
    * **General**

      * **General/Starknet-Intro**
      * **General/Cairo-Intro**
      * **General/Tokenomics-STRK**
      * **General/Pricing-Value**
    """

    is_relevant: bool = dspy.OutputField(
        desc="""Whether the queries are in english AND related to:
        - Starknet smart contracts
        - Cairo programming language
        - Starknet network interactions
        - Starknet development tools, frameworks, libraries, and documentation
        - Starknet apps: lending, borrowing, staking, other DeFi protocols, etc.
        - Starknet apps: gaming, NFTs - and all other kinds of apps
        - BTCFi: Bitcoin-based Defi on starknet (staking, lending, etc)
        - yield, earnings, etc
        - General blockchain questions that could be related to Starknet
        - Generally - anything that could be related to Starknet or its ecosystem of apps.
        If you're unsure, mark the question as relevant.
        """
    )

    queries: list[str] = dspy.InputField(
        desc="List of questions asked by a user in a conversation related to Starknet, Cairo, and the blockchain ecosystem."
    )

    category: list[str] = dspy.OutputField(
        desc="""List of categories the query belongs to. Can be one of the following, or any other relevant category.
      * DeFi
      * NFTs
      * Gaming
      * Wallets & AA
      * Tooling
      * Cairo & Contracts
      * Starknet interactions: sdks, CLIs, etc.
      * Transactions & Fees
      * Node & Infra
      * Security
      * Docs & Versions
      * General
      """
    )
    leaf: list[str] = dspy.OutputField(
        desc="Leaf label of the query. Refer to the taxonomy above to determine the leaf label."
    )
    intents: list[str] = dspy.OutputField(
        desc="""Intents of the query. Can be one of the following, or any other relevant intents.
      * learn (understanding/intro/“what is”)
      * build (how to implement/make/sample)
      * debug (errors, failing tests, ABI mismatch)
      * integrate (frontend/backend, SDK wiring, ABI, RPC usage)
      * operate (deploy, verify, run node, fee, env setup)
      """
    )

    frameworks: list[str] = dspy.OutputField(
        desc="""Array of frameworks mentioned in the query. Can be one of the following, or any other starknet-related framework, or nothing.
      * starknet.js
      * starkli
      * scarb
      * starknet-foundry
      * sncast
      * dojo
    """
    )
    topic_summary: str = dspy.OutputField(
        desc="A short paragraph describing what the user wants: what's the main question, what's the context, what's the objective / deliverable, if any."
    )


class TopicAnalyzer(dspy.Signature):
    """
    Your job is to analyze a list of topics present in a dataset and generate a comprehensive, structured report of the topics adressed, and their content.
    """

    topics: list[str] = dspy.InputField(desc="List of topics present in the dataset.")
    topic_analysis: str = dspy.OutputField(
        desc="A structured report of the topics adressed, and their content."
    )


def collect_counts(
    records: Iterable[dict[str, Any]], only_relevant: bool = True
) -> tuple[Counter, Counter, dict[str, Counter], Counter]:
    category_counts: Counter[str] = Counter()
    intent_counts: Counter[str] = Counter()
    leaves_by_category: dict[str, Counter[str]] = defaultdict(Counter)
    frameworks_counts: Counter[str] = Counter()

    for r in records:
        if only_relevant and not r["is_relevant"]:
            continue

        categories = r["category"]
        leaves = r["leaf"]
        intents = r["intents"] if "intents" in r else [r["intent"]]
        for intent in intents:
            intent_counts[intent] += 1

        for category in categories:
            category_counts[category] += 1
            for leaf in leaves:
                leaves_by_category[category][leaf] += 1

        for fw in r["frameworks"]:
            frameworks_counts[fw] += 1

    return category_counts, intent_counts, leaves_by_category, frameworks_counts


def plot_barh(ax, labels: list[str], counts: list[int], title: str, xlabel: str, color: str):
    ax.barh(labels, counts, color=color)
    ax.set_title(title)
    ax.set_xlabel(xlabel)
    for i, v in enumerate(counts):
        ax.text(v + (max(counts) * 0.01 if counts else 0.1), i, str(v), va="center")
    ax.invert_yaxis()


def save_fig(fig, out_path: str, dpi: int):
    fig.set_dpi(dpi)
    fig.tight_layout()
    fig.savefig(out_path, bbox_inches="tight")
    print(f"Saved: {out_path}")


def generate_charts(
    records: list[dict[str, Any]],
    out_dir: str,
    img_format: str = "png",
    dpi: int = 150,
    top_leaves_per_category: int = 5,
    max_categories_for_leaves: int = 8,
    include_irrelevant: bool = False,
    show: bool = False,
) -> None:
    import matplotlib.pyplot as plt

    (
        category_counts,
        intent_counts,
        leaves_by_category,
        frameworks_counts,
    ) = collect_counts(records, only_relevant=not include_irrelevant)

    os.makedirs(out_dir, exist_ok=True)

    # 1) Category
    cats, cat_vals = (
        zip(*category_counts.most_common(), strict=False) if category_counts else ([], [])
    )
    fig1, ax1 = plt.subplots(figsize=(9, max(3, 0.4 * max(3, len(cats)))))
    plot_barh(ax1, list(cats), list(cat_vals), "Repartition by Category", "Count", "tab:blue")
    save_fig(fig1, os.path.join(out_dir, f"category_repartition.{img_format}"), dpi)

    # 2) Intent
    intents, intent_vals = (
        zip(*intent_counts.most_common(), strict=False) if intent_counts else ([], [])
    )
    fig2, ax2 = plt.subplots(figsize=(8, max(3, 0.4 * max(3, len(intents)))))
    plot_barh(ax2, list(intents), list(intent_vals), "Repartition by Intent", "Count", "tab:green")
    save_fig(fig2, os.path.join(out_dir, f"intent_repartition.{img_format}"), dpi)

    # 3) Top leaves per top categories
    top_categories = [c for c, _ in category_counts.most_common(max_categories_for_leaves)]
    if not top_categories:
        top_categories = list(leaves_by_category.keys())[:max_categories_for_leaves]
    n = len(top_categories)
    if n:
        cols = min(3, n)
        rows = (n + cols - 1) // cols
        fig3, axes = plt.subplots(rows, cols, figsize=(6 * cols, 3.5 * rows))
        # Flatten axes in a robust way
        axes_list = (
            list(axes.flat) if hasattr(axes, "flat") else ([axes] if axes is not None else [])
        )
        for idx, cat in enumerate(top_categories):
            ax = axes_list[idx]
            leaf_counter = leaves_by_category.get(cat, Counter())
            leaves, leaf_vals = (
                zip(*leaf_counter.most_common(top_leaves_per_category), strict=False)
                if leaf_counter
                else ([], [])
            )
            ax.barh(list(leaves), list(leaf_vals), color="tab:purple")
            ax.set_title(f"{cat}: Top Leaves")
            ax.set_xlabel("Count")
            for i, v in enumerate(leaf_vals):
                ax.text(v + (max(leaf_vals) * 0.01 if leaf_vals else 0.1), i, str(v), va="center")
            ax.invert_yaxis()
        # Hide any remaining subplots
        for j in range(idx + 1, rows * cols):
            axes_list[j].axis("off")
        save_fig(fig3, os.path.join(out_dir, f"leaves_by_category.{img_format}"), dpi)

    # 4) Frameworks
    if frameworks_counts:
        fws, fw_vals = zip(*frameworks_counts.most_common(), strict=False)
        fig4, ax4 = plt.subplots(figsize=(8, max(3, 0.4 * max(3, len(fws)))))
        plot_barh(ax4, list(fws), list(fw_vals), "Frameworks Mentioned", "Count", "tab:orange")
        save_fig(fig4, os.path.join(out_dir, f"frameworks_repartition.{img_format}"), dpi)
    else:
        print("No frameworks found; skipping frameworks chart.")

    if show:
        plt.show()


def main(argv: list[str] | None = None):
    parser = argparse.ArgumentParser(
        description="Analyze and chart LLM dataset outputs (Cairo Coder)"
    )
    parser.add_argument(
        "--input", required=True, help="Path to analyzed dataset (JSON, {runs: [...]}, or JSONL)"
    )
    parser.add_argument(
        "--out-dir",
        default=os.path.join("python", "src", "scripts", "charts"),
        help="Directory to save charts",
    )
    parser.add_argument("--format", choices=["png", "svg", "pdf"], default="png")
    parser.add_argument("--dpi", type=int, default=150)
    parser.add_argument("--top-leaves-per-category", type=int, default=5)
    parser.add_argument("--max-categories-for-leaves", type=int, default=8)
    parser.add_argument("--include-irrelevant", action="store_true")
    parser.add_argument("--show", action="store_true")

    args = parser.parse_args(argv)

    dspy.configure(
        lm=dspy.LM("gemini/gemini-flash-lite-latest", max_tokens=30000, cache=False),
        adapter=XMLAdapter(),
    )
    with open(args.input) as f:
        dataset = json.load(f)

    runs = dataset["runs"]
    parallel_processor = dspy.Parallel(num_threads=12)
    analyzer = dspy.Predict(DatasetAnalyzer)
    demo1 = {
        "run_id": "178b8448-41d1-4d7d-b516-68a6473cef9b",
        "queries": [
            "How do I set up my staking node to accept BTC stakes? Where is the documentation?",
            "What are the technical requirements and steps involved in setting up a Starknet validator node, and how does this relate to participating in the BTC staking protocol?",
        ],
        "is_relevant": True,
        "category": "DeFi, Node & Infra, Docs & Versions",
        "leaf": "DeFi/BTCFi, Infra/Run-Node/Validators, Docs/Where-Is",
        "intents": ["operate"],
        "frameworks": [],
        "topic_summary": "The user is asking for documentation and technical steps to set up a Starknet staking/validator node capable of accepting BTC stakes, likely related to BTCFi activities.",
    }
    demo_1 = dspy.Example(
        queries=demo1["queries"],
        is_relevant=demo1["is_relevant"],
        category=demo1["category"],
        leaf=demo1["leaf"],
        intents=demo1["intents"],
        frameworks=demo1["frameworks"],
        topic_summary=demo1["topic_summary"],
    )
    demo2 = {
        "run_id": "178b8448-41d1-4d7d-b516-68a6473cef9b",
        "queries": [
            "How do I set up my staking node to accept BTC stakes? Where is the documentation?",
            "What are the technical requirements and steps involved in setting up a Starknet validator node, and how does this relate to participating in the BTC staking protocol?",
        ],
        "is_relevant": True,
        "category": "DeFi, Node & Infra, Docs & Versions",
        "leaf": "DeFi/BTCFi, Infra/Run-Node/Validators, Docs/Where-Is",
        "intents": ["operate"],
        "frameworks": [],
        "topic_summary": "The user is asking for documentation and technical steps to set up a Starknet staking/validator node capable of accepting BTC stakes, likely related to BTCFi activities.",
    }
    demo_2 = dspy.Example(
        queries=demo2["queries"],
        is_relevant=demo2["is_relevant"],
        category=demo2["category"],
        leaf=demo2["leaf"],
        intents=demo2["intents"],
        frameworks=demo2["frameworks"],
        topic_summary=demo2["topic_summary"],
    )
    analyzer.demos.extend([demo_1, demo_2])
    exec_pairs = [(analyzer, {"queries": run["queries"]}) for run in runs]
    results = parallel_processor(exec_pairs)
    for run, result in zip(runs, results, strict=False):
        run["is_relevant"] = result.is_relevant
        run["category"] = result.category
        run["leaf"] = result.leaf
        run["intents"] = result.intents
        run["frameworks"] = result.frameworks
        run["topic_summary"] = result.topic_summary

    try:
        topic_analyzer = dspy.Predict(TopicAnalyzer)
        all_topics = [run["topic_summary"] for run in runs]
        res = topic_analyzer(topics=all_topics)
        dataset["topic_analysis"] = res.topic_analysis
    except Exception as e:
        import traceback

        traceback.print_exc()
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(3)

    with open(f"{args.input.replace('.json', '_analyzed.json')}", "w") as f:
        json.dump(dataset, f, indent=4)

    try:
        generate_charts(
            records=runs,
            out_dir=args.out_dir,
            img_format=args.format,
            dpi=args.dpi,
            top_leaves_per_category=args.top_leaves_per_category,
            max_categories_for_leaves=args.max_categories_for_leaves,
            include_irrelevant=args.include_irrelevant,
            show=args.show,
        )
    except Exception as e:
        import traceback

        traceback.print_exc()
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(3)


if __name__ == "__main__":
    main()
