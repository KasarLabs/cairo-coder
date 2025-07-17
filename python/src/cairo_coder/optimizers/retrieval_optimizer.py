import marimo

__generated_with = "0.14.11"
app = marimo.App(width="medium")


@app.cell
def _():
    from cairo_coder.dspy.query_processor import QueryProcessorProgram, CairoQueryAnalysis
    import dspy
    import os

    # Start mlflow for monitoring `mlflow ui --port 5000`

    import mlflow

    mlflow.set_tracking_uri("http://127.0.0.1:5000")
    mlflow.set_experiment("DSPy")
    mlflow.dspy.autolog()

    lm = dspy.LM('gemini/gemini-2.5-flash', max_tokens=10000)
    dspy.configure(lm=lm)
    retrieval_program = dspy.ChainOfThought(CairoQueryAnalysis)
    if not os.path.exists("optimized_retrieval_program.json"):
        raise FileNotFoundError("optimized_retrieval_program.json not found")
    retrieval_program.load("optimized_retrieval_program.json")
    return dspy, lm, retrieval_program


@app.cell
def _(dspy, retrieval_program):
    # Checking what responses look like without any Optimization / Training Set

    response = retrieval_program(query="Write a simple Cairo contract that implements a counter. Make it safe with Openzeppelin")
    print(response.search_queries)
    print(response.resources)

    dspy.inspect_history(n=1)
    return


@app.cell
def _(dspy):
    # Let's add some examples
    from dspy import Example

    # Note: we can add non-input fields in examples - others are considered labels or metadata
    example_dataset = [
            {
                "query": "Implement an ERC20 token with mint and burn mechanism",
                "search_queries": [
                    "Creating ERC20 tokens with Openzeppelin",
                    "Adding mint and burn entrypoints to ERC20",
                    "Writing Starknet Smart Contracts",
                    "Integrating Openzeppelin library in Cairo project",
                ],
                "resources": ["openzeppelin_docs", "cairo_book"],
            },
            {
                "query": "Refactor this contract to add access control on public functions",
                "search_queries": [
                    "Access control library for Cairo smart contracts",
                    "Asserting the caller of a contract entrypoint",
                    "Component for access control",
                    "Writing Starknet Smart Contracts",
                ],
                "resources": ["openzeppelin_docs", "cairo_book"],
            },
        {
            "query": "How do I write a basic hello world contract in Cairo?",
            "search_queries": [
                "Writing a simple smart contract in Cairo",
                "Basic entrypoints in Cairo contracts",
                "Starknet contract structure",
                "Getting started with Cairo programming"
            ],
            "resources": ["cairo_book", "starknet_docs"]
        },
        {
            "query": "Implement ERC721 NFT in Cairo language",
            "search_queries": [
                "Creating ERC721 tokens using OpenZeppelin in Cairo",
                "NFT contract implementation in Starknet",
                "Integrating OpenZeppelin library in Cairo project"
            ],
            "resources": ["openzeppelin_docs", "cairo_book"]
        },
        {
            "query": "How to emit events from a Cairo contract?",
            "search_queries": [
                "Emitting events in Starknet contracts",
                "Event handling in Cairo",
                "Indexing events for off-chain querying",
                "Cairo syntax for events"
            ],
            "resources": ["cairo_book"]
        },
        {
            "query": "Store a list of users in my smart contract",
            "search_queries": [
                "Declaring and accessing storage variables in Cairo",
                "Storage types for collections and dynamic arrays",
                "Reading and writing storage slots",
                "Storing arrays in Cairo"
            ],
            "resources": ["cairo_book"]
        },
        {
            "query": "Call another contract from my Cairo contract",
            "search_queries": [
                "Calling another contract from a Cairo contract",
                "Using dispatchers for external calls in Starknet",
                "Handling reentrancy in Cairo contracts",
                "Contract interfaces in Cairo"
            ],
            "resources": ["cairo_book", "openzeppelin_docs"]
        },
        {
            "query": "How to make my contract upgradable in Cairo?",
            "search_queries": [
                "Proxy patterns for upgradable contracts in Cairo",
                "Implementing upgradeable smart contracts on Starknet",
                "Using OpenZeppelin upgrades in Cairo",
                "Storage considerations for upgrades"
            ],
            "resources": ["openzeppelin_docs", "cairo_book"]
        },
        {
            "query": "Testing Cairo contracts, what's the best way?",
            "search_queries": [
                "Unit testing frameworks for Cairo",
                "Using Starknet Foundry for testing Starknet Contracts",
                "Writing test cases in Cairo",
                "Mocking dependencies in Cairo tests"
            ],
            "resources": ["cairo_book", "starknet_foundry"]
        },
        {
            "query": "Deploy a contract to Starknet using Cairo",
            "search_queries": [
                "Deployment scripts for Cairo contracts",
                "Using Starknet Foundry for Starknet deployment",
                "Declaring and deploying classes in Starknet",
            ],
            "resources": ["starknet_foundry", "cairo_book"]
        },
        {
            "query": "Working with arrays in Cairo programming",
            "search_queries": [
                "Array manipulation in Cairo",
                "Dynamic arrays vs fixed-size in Starknet",
                "Iterating over arrays in contract functions",
                "Storage arrays in Cairo"
            ],
            "resources": ["cairo_book", "cairo_by_example"]
        },
        {
            "query": "Difference between felt and uint256 in Cairo",
            "search_queries": [
                "Numeric types in Cairo: felt vs uint256",
                "Arithmetic operations with uint256",
                "Converting between felt and other types",
                "Overflow handling in Cairo math"
            ],
            "resources": ["cairo_book", "cairo_by_example"]
        },
        {
            "query": "Add ownership to my Cairo contract",
            "search_queries": [
                "Ownable component in OpenZeppelin Cairo",
                "Transferring ownership in Starknet contracts",
                "Access control patterns in Cairo",
                "Renouncing ownership safely"
            ],
            "resources": ["openzeppelin_docs", "cairo_book"]
        },
        {
            "query": "Make a pausable contract in Cairo",
            "search_queries": [
                "Pausable mixin for Cairo contracts",
                "Implementing pause and unpause functions",
                "Emergency stop mechanisms in Smart Contracts",
                "Access control for pausing smart contracts"
            ],
            "resources": ["openzeppelin_docs", "starknet_docs"]
        },
        {
            "query": "Timelock for delayed executions in Cairo",
            "search_queries": [
                "Timelock contracts using OpenZeppelin in Cairo",
                "Scheduling delayed transactions in Starknet",
                "Handling timestamps in Cairo",
                "Canceling timelocked operations"
            ],
            "resources": ["openzeppelin_docs", "cairo_book"]
        },
        {
            "query": "Build a voting system in Cairo",
            "search_queries": [
                "Governor contracts for DAO voting in Cairo",
                "Implementing voting logic in Starknet",
                "Proposal creation and voting mechanisms",
                "Quorum and vote counting in Cairo"
            ],
            "resources": ["openzeppelin_docs", "starknet_docs"]
        },
        {
            "query": "Integrate oracles into Cairo contract",
            "search_queries": [
                "Using Chainlink oracles in Starknet",
                "Fetching external data in Cairo contracts",
                "Oracle interfaces and callbacks",
                "Security considerations for oracles"
            ],
            "resources": ["cairo_book", "starknet_docs"]
        },
        {
            "query": "Handle errors properly in Cairo code",
            "search_queries": [
                "Error handling and panics in Cairo",
                "Custom error messages in Starknet contracts",
                "Assert and require equivalents in Cairo",
                "Reverting transactions safely"
            ],
            "resources": ["cairo_book", "cairo_by_example"]
        },
        {
            "query": "Tips to optimize gas in Cairo contracts",
            "search_queries": [
                "Gas optimization techniques for Starknet",
                "Reducing computation in Cairo functions",
                "Storage access minimization",
                "Benchmarking Cairo code performance"
            ],
            "resources": ["cairo_book", "cairo_by_example"]
        },
        {
            "query": "Migrate Solidity contract to Cairo",
            "search_queries": [
                "Porting Solidity code to Cairo syntax",
                "Differences between Solidity and Cairo",
                "Translating EVM opcodes to Cairo builtins",
                "Common pitfalls in migration"
            ],
            "resources": ["cairo_book", "starknet_docs"]
        },
        {
            "query": "Using external libraries in Cairo project",
            "search_queries": [
                "Importing libraries in Cairo contracts",
                "Using OpenZeppelin components",
                "Managing dependencies with Scarb",
                "Custom library development in Cairo"
            ],
            "resources": ["openzeppelin_docs", "cairo_book", "scarb_docs"]
        }
    ]

    data = [dspy.Example(**d, chat_history="").with_inputs('query', 'chat_history') for d in example_dataset]

    # Selecting one example
    example = data[0]
    print(example)

    return data, example


@app.cell
def _(dspy):
    # Defining our metrics here.
    from typing import List
    class RetrievalRecallPrecision(dspy.Signature):
        """
        Compare a system's retrieval response to the expected search queries and resources to compute recall and precision.
        If asked to reason, enumerate key ideas in each response, and whether they are present in the expected output.
        """

        query: str = dspy.InputField()
        expected_search_queries: List[str] = dspy.InputField()
        expected_resources: List[str] = dspy.InputField()
        system_search_queries: List[str] = dspy.InputField()
        system_resources: List[str] = dspy.InputField()
        recall: float = dspy.OutputField(desc="fraction (out of 1.0) of expected output covered by the system response")
        precision: float = dspy.OutputField(desc="fraction (out of 1.0) of system response covered by the expected output")


    class DecompositionalRetrievalRecallPrecision(dspy.Signature):
        """
        Compare a system's retrieval response to the expected search queries and resources to compute recall and precision of key ideas.
        You will first enumerate key ideas in each response, discuss their overlap, and then report recall and precision.
        """

        query: str = dspy.InputField()
        expected_search_queries: List[str] = dspy.InputField()
        expected_resources: List[str] = dspy.InputField()
        system_search_queries: List[str] = dspy.InputField()
        system_resources: List[str] = dspy.InputField()
        expected_key_ideas: str = dspy.OutputField(desc="enumeration of key ideas in the expected search queries and resources")
        system_key_ideas: str = dspy.OutputField(desc="enumeration of key ideas in the system search queries and resources")
        discussion: str = dspy.OutputField(desc="discussion of the overlap between expected and system output")
        recall: float = dspy.OutputField(desc="fraction (out of 1.0) of expected output covered by the system response")
        precision: float = dspy.OutputField(desc="fraction (out of 1.0) of system response covered by the expected output")


    def f1_score(precision, recall):
        precision, recall = max(0.0, min(1.0, precision)), max(0.0, min(1.0, recall))
        return 0.0 if precision + recall == 0 else 2 * (precision * recall) / (precision + recall)


    class RetrievalF1(dspy.Module):
        def __init__(self, threshold=0.66, decompositional=False):
            self.threshold = threshold

            if decompositional:
                self.module = dspy.ChainOfThought(DecompositionalRetrievalRecallPrecision)
            else:
                self.module = dspy.ChainOfThought(RetrievalRecallPrecision)

        def forward(self, example, pred, trace=None):
            scores = self.module(
                query=example.query,
                expected_search_queries=example.search_queries,
                expected_resources=example.resources,
                system_search_queries=pred.search_queries,
                system_resources=pred.resources
            )
            # TODO: we should assign a small amount of the score on the correctness of the resources used.
            score_semantic = f1_score(scores.precision, scores.recall)
            score_resource_jaccard = jaccard(set(example.resources), set(pred.resources))

            # 0.7 for semantic, 0.3 for resource jaccard
            score = 0.7 * score_semantic + 0.3 * score_resource_jaccard

            return score if trace is None else score >= self.threshold

    # Helper for Jaccard Index
    def jaccard(set_a: set, set_b: set) -> float:
        intersection = set_a & set_b
        union = set_a | set_b
        if len(union) == 0:
            return 1.0  # Both sets are empty, perfect match
        return len(intersection) / len(union)


    return (RetrievalF1,)


@app.cell
def _(RetrievalF1, example, retrieval_program):
    # Start evaluation process
    # Instantiate the metric.
    metric = RetrievalF1(decompositional=True)

    # Produce a prediction from our `retrieval_program` module, using the `example` above as input.
    pred = retrieval_program(**example.inputs())

    # Compute the metric score for the prediction.
    score = metric(example, pred)

    print(f"Question: \t {example.query}\n")
    print(f"Gold Response: \t {example.search_queries}, {example.resources}\n")
    print(f"Predicted Response: \t {pred.search_queries}, {pred.resources}\n")
    print(f"Semantic F1 Score: {score:.2f}")

    # Semantic F1 score ranks is ~0.56, which is ok-ish. Now, the real work is to make sure these queries are _actually_ good to research the vector store.
    return (metric,)


@app.cell
def _(data, metric, retrieval_program):
    # On all the test-set
    from dspy.evaluate import Evaluate


    # Let's now divide into a train and test set - half half
    train_set = data[: len(data) // 2]
    test_set = data[len(data) // 2 :]



    # Set up the evaluator, which can be re-used in your code.
    print(f"Evaluating on dataset with len {len(test_set)}")
    evaluator = Evaluate(devset=test_set, num_threads=3, display_progress=True, display_table=10)

    # Launch evaluation.
    evaluator(retrieval_program, metric=metric)
    return Evaluate, test_set, train_set


@app.cell
def _(lm):
    cost = sum([x['cost'] for x in lm.history if x['cost'] is not None])  # cost in USD, as calculated by LiteLLM for certain providers
    print(cost)
    print([x['cost'] for x in lm.history])
    print(len(lm.history))
    return


@app.cell
def _(dspy, metric, retrieval_program, train_set):
    # Let's now use the optimizer - then, we'll run the eval again

    mipro_optimizer = dspy.MIPROv2(
        metric=metric,
        auto="medium",
    )
    optimized_retrieval_program = mipro_optimizer.compile(
        retrieval_program,
        trainset=train_set,
        max_bootstrapped_demos=5,
        requires_permission_to_run=False,
        minibatch=False,
    )
    return (optimized_retrieval_program,)


@app.cell
def _(Evaluate, metric, optimized_retrieval_program, test_set):
    # On all the test-set

    # Set up the evaluator, which can be re-used in your code.
    print(f"Evaluating on dataset with len {len(test_set)}")
    evaluator_optimized = Evaluate(devset=test_set, num_threads=3, display_progress=True, display_table=10)

    # Launch evaluation.
    evaluator_optimized(optimized_retrieval_program, metric=metric)

    # Previous score -> 45; New Score -> 52. Better but not _significantly_ !
    return


@app.cell
def _(optimized_retrieval_program):
    optimized_retrieval_program.save("optimized_retrieval_program.json")

    return


@app.cell
def _(dspy):
    dspy.inspect_history()
    return


@app.cell
def _():
    return


if __name__ == "__main__":
    app.run()
