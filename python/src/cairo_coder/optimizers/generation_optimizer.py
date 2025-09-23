import marimo

__generated_with = "0.16.0"
app = marimo.App(width="medium")


@app.cell
def _():

    import os

    import dspy

    # Start mlflow for monitoring `mlflow ui --port 5000`
    from dspy.adapters.xml_adapter import XMLAdapter

    from cairo_coder.dspy.document_retriever import SourceFilteredPgVectorRM
    from cairo_coder.server.app import get_vector_store_config

    # Ensure the env var for optimizer is loaded (controls DB connection)
    if os.getenv("OPTIMIZER_RUN") is None:
        os.environ["OPTIMIZER_RUN"] = "true"
    assert os.getenv("OPTIMIZER_RUN") is not None, "OPTIMIZER_RUN should be active."

    # Ensure that LANGSMITH_TRACING is inactive (false)
    if os.getenv("LANGSMITH_TRACING"):
        os.environ["LANGSMITH_TRACING"] = "false"
    assert os.getenv("LANGSMITH_TRACING") != "true", "LANGSMITH_TRACING should be inactive."

    # mlflow.set_tracking_uri("http://127.0.0.1:5000")
    # mlflow.set_experiment("DSPy")
    # mlflow.dspy.autolog()

    ## Setup VectorDB for document retrieval
    embedder = dspy.Embedder("openai/text-embedding-3-large", dimensions=1536, batch_size=512)
    vector_store_config = get_vector_store_config()
    vector_db = SourceFilteredPgVectorRM(
        db_url=vector_store_config.dsn,
        pg_table_name=vector_store_config.table_name,
        embedding_func=embedder,
        content_field="content",
        fields=["id", "content", "metadata"],
        k=5,  # Default k, will be overridden by retriever
        embedding_model="text-embedding-3-large",
        include_similarity=True,
    )

    # Programs to be optimized: QueryProcessing --> OptimizedQuery --> Document retrieval
    lm = dspy.LM("gemini/gemini-2.5-flash", max_tokens=15000, cache=False)
    dspy.configure(lm=lm, adapter=XMLAdapter())
    return XMLAdapter, dspy, os, vector_db, vector_store_config


@app.cell
def _(dspy, vector_db, vector_store_config):
    # Checking what responses look like without any Optimization / Training Set
    from cairo_coder.dspy.document_retriever import DocumentRetrieverProgram
    from cairo_coder.core.agent_factory import AgentFactory

    agent_factory = AgentFactory(vector_db=vector_db, vector_store_config=vector_store_config)
    cairo_coder_agent = dspy.syncify(agent_factory.get_or_create_agent("cairo-coder"))
    return (cairo_coder_agent,)


@app.cell
def _(cairo_coder_agent, dspy):
    import random
    from pathlib import Path
    import json

    ### Let's add some examples

    # Note: we can add non-input fields in examples - others are considered labels or metadata
    # print current path
    example_dataset = [
        {
            "query": "Implement a simple counter contract in Cairo that anyone can increment or decrement with events for each action"
        },
        {
            "query": "Create an ERC20 token contract named 'MY_ERC20' with 18 decimals and an initial supply minted to the deployer"
        },
        {
            "query": "Create an ERC721 NFT collection capped at 10,000 items with a base URI setter restricted to the owner"
        },
        {
            "query": "Write a Cairo function to find the smallest number in a u32 array input and return its index"
        },
        {
            "query": "Implement a minimal fixed-point math library using Q32.32 with a single add function"
        },
        {
            "query": "Write unit-testable Cairo modules for an ERC20: tests for mint, burn, transfer, allowance, and edge cases"
        },
        {
            "query": "Build an Ownable access control module with transfer_ownership and renounce_ownership functions"
        },
        {
            "query": "Implement an upgradable class hash manager that supports rolling back to a previous implementation (with events)"
        },
        {
            "query": "Create a Pausable module that can pause and unpause transfers for an ERC20 token"
        },
        {
            "query": "Implement a ReentrancyGuard pattern for external functions using a storage-based lock flag"
        },
        {
            "query": "Write a u256 arithmetic library (add, sub, mul, div, mod) using Cairo builtins and safe overflow checks"
        },
        {
            "query": "Develop an upgradeable proxy contract for Starknet with get_implementation, set_implementation (owner-only), and delegate calls"
        },
        {
            "query": "Implement an ERC1155 multi-token contract with mint, batch_mint, and safe_transfer_from"
        },
        {
            "query": "Write a library to compute Poseidon hash of an array and verify a given hash matches contents"
        },
        {
            "query": "Create a Merkle tree proof verifier for membership proofs over felt252 leaves"
        }
    ]

    data = [dspy.Example(**d).with_inputs("query") for d in example_dataset]

    # Take maximum 300 random values from the dataset
    random.Random(0).shuffle(data)
    data = data[0:300]
    train_set = data[: int(len(data) * 0.33)]
    val_set = data[int(len(data) * 0.33) : int(len(data) * 0.66)]
    test_set = data[int(len(data) * 0.66) :]

    # Selecting one example
    example = data[0]
    print(example)
    # Querying with the examples
    response = cairo_coder_agent(example.query)
    print(response.answer)
    dspy.inspect_history(n=1)
    return example, response, test_set, train_set, val_set


@app.cell
def _(response):
    # Extract cairo code from answer, if any
    from cairo_coder.optimizers.generation.utils import extract_cairo_code, check_compilation

    answer_code = extract_cairo_code(response.answer)
    compil_res = check_compilation(answer_code)
    if compil_res["success"] is False:
        err_str = compil_res["error"]
        print(err_str)


    return


@app.cell
def _(XMLAdapter, dspy):
    # Defining our metrics here.
    from typing import Optional

    from cairo_coder.core.types import DocumentSource
    from cairo_coder.dspy.query_processor import RESOURCE_DESCRIPTIONS

    doc_source_strings = [d.value for d in DocumentSource]
    sources_descriptions = ", ".join(
        [f"{key}: {value}" for key, value in RESOURCE_DESCRIPTIONS.items()]
    )

    class ContextProviderRater(dspy.Signature):
        """
        Analyze the provided context and rate whether the information provided is sufficient to answer the input query.
        """

        query: str = dspy.InputField(desc="The query of the user")
        resources_given: list[str] = dspy.InputField(
            desc=f"The resources that were searched to answer this. This is a free form but the only valid values are {doc_source_strings} - if anything else is given, be very vocal about that it in your feedback."
        )
        search_queries: list[str] = dspy.InputField(
            desc="The list of search queries that were made to locate the context in the documentation. If the search queries have failed to identify the right context for the query, include what would have been better in your feedback"
        )
        context: list[str] = dspy.InputField(
            desc="Context provided to answer the query of the user"
        )
        score: float = dspy.OutputField(
            desc="A confidence score in range [0, 1.0] on the possibility to give a precise and fully accurate answer based on the provided context. 0 means that the information is totally absent, 0.5 means that the topic is mentioned but there are blind spots, 1.0 means that the question can be fully answered based on the given context."
        )
        feedback: Optional[str] = dspy.OutputField(
            desc=f"A textual feedback on how to improve the results. First, have we included all the relevant resources from the available resource list: {sources_descriptions}; and if not, what other should we have added? Second, what have we not been able to fetch from the context, and in which resource could it have been fetched? How could we have targetted it with better search_queries? Only add info if feedback is needed. If the original query is lacking context (following up a question we dont have) or is unclear or unrelated to starknet/blockchain/cairo/programming, simply indicate that the user's query was not specific enough to give feedback."
        )

    ## Metrics for self-improvement: Rating whether the context provided can be used to answer the question properly or not.
    context_rater = dspy.Predict(ContextProviderRater)

    def compute_metrics(gold, pred, trace=None) -> dict:
        if pred.retrieved_docs is None or len(pred.retrieved_docs) == 0:
            return {"score": 0.0, "feedback": "Could not retrieve anything that would answer this query."}
        with dspy.context(
            lm=dspy.LM("openrouter/x-ai/grok-4-fast:free", max_tokens=30000), adapter=XMLAdapter()
        ):
            response_rating = context_rater(
                query=gold.query,
                resources_given=pred.processed_query.resources,
                search_queries=pred.processed_query.search_queries,
                context=pred.retrieved_docs,
            )
        if response_rating.score > 1.0:
            response_rating.score /= 10
        return {"score": response_rating.score, "feedback": response_rating.feedback or ""}

    def compute_overall_score_with_feedback(
        gold, pred, trace=None, pred_name=None, pred_trace=None
    ):
        metrics = compute_metrics(gold, pred, trace)
        score = metrics["score"]
        llm_feedback = metrics["feedback"]
        if score < 0.2:
            import json
            from pathlib import Path

            # Create logs directory if it doesn't exist
            logs_dir = Path("optimizer_logs")
            logs_dir.mkdir(exist_ok=True)

            # Prepare data to save
            log_data = {
                "score": score,
                "gold": {"query": gold.query if hasattr(gold, "query") else str(gold)},
                "pred": {
                    "processed_query": (
                        {
                            "resources": (
                                pred.processed_query.resources
                                if hasattr(pred, "processed_query")
                                and hasattr(pred.processed_query, "resources")
                                else None
                            ),
                            "search_queries": (
                                pred.processed_query.search_queries
                                if hasattr(pred, "processed_query")
                                and hasattr(pred.processed_query, "search_queries")
                                else None
                            ),
                        }
                        if hasattr(pred, "processed_query")
                        else None
                    ),
                },
                "feedback": llm_feedback,
            }

            # Save to JSON file with thread safety
            import threading
            log_file = logs_dir / "optimizer_logs.json"

            # Use a global lock for thread safety
            if not hasattr(compute_overall_score_with_feedback, '_log_lock'):
                compute_overall_score_with_feedback._log_lock = threading.Lock()

            with compute_overall_score_with_feedback._log_lock:
                # Load existing logs or create new list
                existing_logs = []
                if log_file.exists():
                    try:
                        with open(log_file, "r") as f:
                            existing_logs = json.load(f)
                    except (json.JSONDecodeError, FileNotFoundError):
                        existing_logs = []

                # Append new log entry
                existing_logs.append(log_data)

                # Save updated logs
                with open(log_file, "w") as f:
                    json.dump(existing_logs, f, indent=2)
        feedback_text = f"The score assigned to this request is {score:.2f}. Here's an eventual associated feedback:\n {llm_feedback}"
        return dspy.Prediction(
            score=score,
            feedback=feedback_text,
        )
    return (compute_overall_score_with_feedback,)


@app.cell
def _(compute_overall_score_with_feedback, dspy, os):
    from dspy import GEPA
    gepa_run_dir = os.path.join(os.getcwd(), "./gepa-run-logs")
    prog_candidates_dir = os.path.join(gepa_run_dir, "prog_candidates")
    # Explicitly create inner prog_candidates to enable checkpoints
    os.makedirs(prog_candidates_dir, exist_ok=True)
    optimizer = GEPA(
        metric=compute_overall_score_with_feedback,
        auto="light", # <-- We will use a light budget for this tutorial. However, we typically recommend using auto="heavy" for optimized performance!
        num_threads=12,
        track_stats=True,
        log_dir="./gepa-run-logs",
        reflection_lm=dspy.LM(
            model="openrouter/x-ai/grok-4-fast:free", temperature=1.0, max_tokens=32000
        ),
    )
    return (optimizer,)


@app.cell
def _(optimizer, retriever, train_set, val_set):
    optimized_program = optimizer.compile(
        retriever,
        trainset=train_set,
        valset=val_set,
    )
    return (optimized_program,)


@app.cell
def _():
    return


@app.cell
def _(optimized_program):
    print(optimized_program)

    for name, pred in optimized_program.named_predictors():
        print("================================")
        print(f"Predictor: {name}")
        print("================================")
        print("Prompt:")
        print(pred.signature.instructions)
        print("*********************************")
    return


@app.cell
def _(optimized_program, os):
    os.makedirs("./dspy_program", exist_ok=True)
    optimized_program.save("./dspy_program/program.json", save_program=False)
    return


@app.cell
def _(compute_overall_score_with_feedback, dspy, test_set):
    evaluate = dspy.Evaluate(
        devset=test_set,
        metric=compute_overall_score_with_feedback,
        num_threads=12,
        display_table=True,
        display_progress=True,
    )
    return (evaluate,)


@app.cell
def _(evaluate, retriever):
    evaluate(retriever)
    return


@app.cell
def _(evaluate, optimized_program):
    evaluate(optimized_program)
    return


@app.cell
def _(RETRIEVER, os):
    compiled_program_path = "./dspy_program/program.json"
    if not os.path.exists(compiled_program_path):
        raise FileNotFoundError(f"{compiled_program_path} not found")

    loading_progr = RETRIEVER()
    loading_progr.load(compiled_program_path)
    return (loading_progr,)


@app.cell
def _(evaluate, loading_progr):

    evaluate(loading_progr)
    return


@app.cell
def _(dspy, example, loading_progr):
    # Querying with the examples
    response__ = loading_progr(example.query)
    print(f"Retrieved {len(response__.retrieved_docs)} docs")
    print(response__.processed_query)
    dspy.inspect_history(n=1)
    return


@app.cell
def _():
    return


@app.cell
def _():
    return


if __name__ == "__main__":
    app.run()
