import marimo

__generated_with = "0.16.2"
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

    ## Setup embedder and LM in dspy.configure
    embedder = dspy.Embedder("gemini/gemini-embedding-001", dimensions=3072, batch_size=512)
    lm = dspy.LM("gemini/gemini-flash-lite-latest", max_tokens=15000, cache=False)
    dspy.configure(lm=lm, adapter=XMLAdapter(), embedder=embedder)

    ## Setup VectorDB for document retrieval - will use dspy.settings.embedder
    vector_store_config = get_vector_store_config()
    vector_db = SourceFilteredPgVectorRM(
        db_url=vector_store_config.dsn,
        pg_table_name=vector_store_config.table_name,
        content_field="content",
        fields=["id", "content", "metadata"],
        k=5,  # Default k, will be overridden by retriever
        include_similarity=True,
    )
    return XMLAdapter, dspy, os, vector_db, vector_store_config


@app.cell
def _(dspy, vector_db, vector_store_config):
    # Checking what responses look like without any Optimization / Training Set
    from cairo_coder.dspy.document_retriever import DocumentRetrieverProgram
    from cairo_coder.dspy.query_processor import ProcessedQuery, QueryProcessorProgram

    query_processor_program = dspy.syncify(QueryProcessorProgram())
    max_source_count = 5
    similarity_threshold = 0.4
    document_retriever = dspy.syncify(
        DocumentRetrieverProgram(
            vector_store_config=vector_store_config,
            vector_db=vector_db,
            max_source_count=max_source_count,
            similarity_threshold=similarity_threshold,
        )
    )

    class RETRIEVER(dspy.Module):
        def __init__(self):
            self.query_processor_program = query_processor_program

        def forward(self, query):
            try:
                processed_query = self.query_processor_program(query=query)
                retrieved_docs = document_retriever(
                    processed_query=processed_query, sources=processed_query.resources
                )

            except Exception:
                import traceback

                print(traceback.format_exc())
                return dspy.Prediction(
                    processed_query=ProcessedQuery(original=query, search_queries=[]),
                    retrieved_docs=[],
                )

            return dspy.Prediction(processed_query=processed_query, retrieved_docs=retrieved_docs)

    retriever = RETRIEVER()
    return RETRIEVER, retriever


@app.cell
def _(dspy, os, retriever):
    import json
    import random

    ### Let's add some examples

    # Note: we can add non-input fields in examples - others are considered labels or metadata
    # print current path
    dataset_path = f"{os.getcwd()}/optimizers/datasets/user_queries.json"
    with open(dataset_path, encoding="utf-8") as f:
        example_dataset = json.load(f)

    data = [dspy.Example({"query": d}).with_inputs("query") for d in example_dataset]

    # Take maximum 300 random values from the dataset
    random.seed(42)
    random.shuffle(data)
    data = data[0:300]
    train_set = data[: int(len(data) * 0.33)]
    val_set = data[int(len(data) * 0.33) : int(len(data) * 0.66)]
    test_set = data[int(len(data) * 0.66) :]

    # Selecting one example
    example = data[0]
    print(example)
    # Querying with the examples
    response = retriever(example.query)
    print(f"Retrieved {len(response.retrieved_docs)} docs")
    print(response.processed_query)
    dspy.inspect_history(n=1)
    return example, test_set, train_set, val_set


@app.cell
def _(XMLAdapter, dspy):
    # Defining our metrics here.
    from typing import Optional

    from cairo_coder.core.types import DocumentSource
    from cairo_coder.dspy.query_processor import RESOURCE_DESCRIPTIONS

    doc_source_strings = [d.value for d in DocumentSource]
    sources_descriptions = ", ".join(
        [f"{key.value}: {value}" for key, value in RESOURCE_DESCRIPTIONS.items()]
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
            lm=dspy.LM("openrouter/x-ai/grok-4-fast", max_tokens=30000), adapter=XMLAdapter()
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
                        with open(log_file) as f:
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
    compiled_program_path = "optimizers/results/optimized_retrieval_program.json"
    if not os.path.exists(compiled_program_path):
        raise FileNotFoundError(f"{compiled_program_path} not found")

    loading_progr = RETRIEVER()
    loading_progr.query_processor_program.retrieval_program.load(compiled_program_path)
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
