# Quick CLI script to analyze a dataset of question-answer pairs.

import json

import dspy
from dspy.adapters.baml_adapter import BAMLAdapter


class DatasetAnalyzer(dspy.Signature):
    """
    You are provided a dataset of question-answer pairs.
    This dataset is related to the Starknet blockchain and the Cairo programming language, and contains
    mostly technical questions about code, infrastructure, and the overall Starknet ecosystem.
    Your task is to analyze the dataset and provide valuable insights.
    """

    dataset: list[dict] = dspy.InputField(
        desc="The dataset of question-answer pairs."
    )
    languages: list[str] = dspy.OutputField(
        desc="The list of all languages users have asked queries with."
    )
    topics: list[tuple[str, int]] = dspy.OutputField(
        desc="""The list of all topics users have asked queries about. Try to group similar queries under the same topic. For each topic, provide the approximative percentage of queries that belong to that topic.
        For example:
        - "how to read from a byte array string? How to read a word from it?" would be -> "Corelib features questions"
        - "convert a felt252 enoded string into a byterarray encoded string" would be -> "Corelib features questions"
        - "how to run specific test function" -> "writing tests questions"
        - "how do I get the current block time i.e block.timestamp in cairo smart contract" -> "APIs for interaction with the starknet state questions"
        - "When im importing stuff from a file in my smart contract, what is the difference between super:: and crate:: ?" -> "Cairo language questions"
        - "how to use the `assert!` macro in my smart contract" -> "Cairo language questions"
        - "I am writing a function in my smart contract. I need to be sure the caller has enough balance or it reverts. how do I do this?" -> "Starknet smart contracts questions"
        - "what does this error mean :\n```\n Account validation failed: \"StarknetError { code: KnownErrorCode(ValidateFailure), message: 'The 'validate' entry point panicked with: nError in contract (contract address: 0x0762c126b2655bc371c1075e2914edd42ba40fc2c485b5e8772f05c7e09fec26, class hash: 0x036078334509b514626504edc9fb252328d1a240e4e948bef8d0c08dff45927f, selector: 0x0289da278a8dc833409cabfdad1581e8e7d40e42dcaed693fa4008dcdb4963b3): n0x617267656e742f696e76616c69642d7369676e61747572652d6c656e677468 ('argent invalid signature length'). n' }```" -> "Debugging errors questions"
        - "How to declare and deploy a contract with constructor to sepolia or mainnet using starkli?" -> "Starknet network interactions questions"
        """
    )
    analysis: str = dspy.OutputField(
        desc="""A global analysis of the dataset. This field is free-form and can contain all the insights you can gather from the dataset and think are valuable.
        Focus on the following aspects to provide a well-rounded analysis that covers all data that could be relevant, including:
        - Most common topics and the types of questions asked about them
        - Are user's queries mostly answered properly? Does the dataset show that users double-down on answers that they feel are not satisfying?
        - What are the most common instances of users not being able to get the answer they want?
        - What's the overall quality of the answers?
        """
    )

def main():
    dspy.configure(lm=dspy.LM("openrouter/x-ai/grok-4-fast:free", max_tokens=30000, cache=False), adapter=BAMLAdapter())
    with open("qa_pairs.json") as f:
        dataset = json.load(f)
    analyzer = dspy.ChainOfThought(DatasetAnalyzer)
    response = analyzer(dataset=dataset)
    response_dict = {
        "languages": response.languages,
        "topics": response.topics,
        "analysis": response.analysis
    }

    with open("analysis.json", "w") as f:
        json.dump(response_dict, f, indent=4)




if __name__ == "__main__":
    main()
