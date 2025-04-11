# Documentation: Starknet Agent Document Quality Testing System

## 1. What Are We Testing, Exactly?

The Document Quality Tester is a sophisticated system designed to evaluate the quality of documentation sources in the Starknet ecosystem. It tests how well the RAG (Retrieval-Augmented Generation) pipeline can answer user queries based on the available documentation. Specifically, it evaluates:

### Core Testing Objectives

1. **Documentation Relevance**: Whether the documentation contains information that can answer common user queries.
2. **Answer Quality**: How clear, accurate, and comprehensive the generated answers are.
3. **Source Alignment**: How well the generated answers align with the retrieved documentation.
4. **Content Satisfaction**: How well the answers meet specific content expectations.

### Key Metrics Evaluated

- **Is Answered**: Whether the question can be answered at all using the available documentation.
- **Clarity Score**: How clear and understandable the generated answer is (0-1 scale).
- **Source Alignment**: How well the answer aligns with the retrieved documentation (0-1 scale).
- **Content Satisfaction**: How well the answer meets specific content expectations (0-1 scale).

### Documentation Sources Tested

The system can test various documentation sources in the Starknet ecosystem:

- Cairo Book
- Starknet Documentation
- Starknet Ecosystem
- Starknet Foundry
- Cairo By Example
- OpenZeppelin Documentation

## 2. Sequence Diagram / Testing Flow

```txt
┌─────────────┐      ┌───────────────┐      ┌────────────────┐      ┌────────────────┐      ┌────────────────┐
│ Test Runner │      │DocQualityTester│      │  RAG Pipeline  │      │ Evaluation LLM │      │  Report Engine │
└──────┬──────┘      └───────┬───────┘      └────────┬───────┘      └────────┬───────┘      └────────┬───────┘
       │                     │                       │                        │                       │
       │ Run test command    │                       │                        │                       │
       │────────────────────>│                       │                        │                       │
       │                     │                       │                        │                       │
       │                     │ For each test case    │                        │                       │
       │                     │─────────────────────┐ │                        │                       │
       │                     │                     │ │                        │                       │
       │                     │                     │ │                        │                       │
       │                     │ Process query       │ │                        │                       │
       │                     │────────────────────>│ │                        │                       │
       │                     │                     │ │                        │                       │
       │                     │                     │ │ Retrieve documents     │                       │
       │                     │                     │<│                        │                       │
       │                     │                     │ │                        │                       │
       │                     │                     │ │ Generate answer        │                       │
       │                     │                     │<│                        │                       │
       │                     │                     │ │                        │                       │
       │                     │ Calculate metrics   │ │                        │                       │
       │                     │────────────────────────────────────────────────>                       │
       │                     │                     │ │                        │                       │
       │                     │                     │ │                        │ Return metrics        │
       │                     │<───────────────────────────────────────────────                       │
       │                     │                     │ │                        │                       │
       │                     │ Generate            │ │                        │                       │
       │                     │ recommendations     │ │                        │                       │
       │                     │────────────────────────────────────────────────>                       │
       │                     │                     │ │                        │                       │
       │                     │                     │ │                        │ Return recommendations│
       │                     │<───────────────────────────────────────────────                       │
       │                     │                     │ │                        │                       │
       │                     │<────────────────────┘ │                        │                       │
       │                     │                       │                        │                       │
       │                     │ Calculate aggregate   │                        │                       │
       │                     │ metrics              │                        │                       │
       │                     │─────────────────────┐ │                        │                       │
       │                     │                     │ │                        │                       │
       │                     │<────────────────────┘ │                        │                       │
       │                     │                       │                        │                       │
       │                     │ Generate report       │                        │                       │
       │                     │────────────────────────────────────────────────────────────────────────>
       │                     │                       │                        │                       │
       │                     │                       │                        │                       │ Generate summary
       │                     │                       │                        │                       │─────────────────┐
       │                     │                       │                        │                       │                 │
       │                     │                       │                        │                       │<────────────────┘
       │                     │                       │                        │                       │
       │                     │                       │                        │                       │ Return report
       │                     │<───────────────────────────────────────────────────────────────────────
       │                     │                       │                        │                       │
       │ Return results      │                       │                        │                       │
       │<────────────────────│                       │                        │                       │
       │                     │                       │                        │                       │
```

### Detailed Testing Flow

1. **Test Initialization**:

   - Load test cases from a JSON file
   - Initialize LLM models and embeddings
   - Configure the RAG pipeline for the specific documentation source

2. **Test Execution** (for each test case):

   - Process the query through the RAG pipeline
   - Retrieve relevant documents from the vector store
   - Generate an answer based on the retrieved documents
   - Calculate quality metrics using an evaluation LLM
   - Generate recommendations for improving documentation

3. **Metrics Calculation**:

   - Aggregate metrics across all test cases
   - Calculate metrics by query type, difficulty level, and tags
   - Determine overall documentation quality scores

4. **Report Generation**:

   - Generate a comprehensive quality report
   - Provide specific recommendations for documentation improvement
   - Summarize strengths and weaknesses of the documentation

5. **Comparison** (optional):
   - Compare results between different documentation versions
   - Identify improvements and regressions
   - Generate recommendations for addressing regressions

## 3. How to Build a List of Test Cases

Test cases are defined in JSON files like `cairo_book_quality.json`. Each test case represents a query that users might ask about the documentation.

### Test Case Structure

```json
{
  "source": "cairo_book",
  "version": "1.0.0",
  "metadata": {
    "owner": "cairo-lang",
    "repository": "cairo-book"
  },
  "testCases": [
    {
      "query": "How do you declare a mutable variable in Cairo?",
      "expectedTopics": ["let keyword", "mut", "variables", "immutability"],
      "type": "procedural",
      "difficulty": "basic",
      "tags": ["variables", "syntax"]
    },
    {
      "query": "What happens if you try to reassign a variable declared without `mut`?",
      "expectedTopics": ["immutability", "let keyword", "compile error"],
      "expectedContent": "Detailed explanation of what should be in the answer...",
      "type": "conceptual",
      "difficulty": "basic",
      "tags": ["variables", "errors"]
    }
    // More test cases...
  ]
}
```

### Key Components of a Test Case

1. **Query**: The actual question to test against the documentation.
2. **Expected Topics**: Key topics that should be covered in the answer.
3. **Expected Content** (optional): Detailed description of what the answer should contain.
4. **Type**: Categorizes the query as:
   - `factual`: Simple fact-based questions
   - `procedural`: How-to questions
   - `conceptual`: Questions about concepts and understanding
5. **Difficulty**: Indicates the complexity level:
   - `basic`: Fundamental knowledge
   - `intermediate`: More complex topics
   - `advanced`: Expert-level topics
6. **Tags**: Custom categories for organizing and filtering test cases.

### Guidelines for Creating Effective Test Cases

1. **Coverage**: Create test cases that cover all major topics in the documentation.
2. **Variety**: Include a mix of query types (factual, procedural, conceptual) and difficulty levels.
3. **Realism**: Use queries that reflect real user questions.
4. **Specificity**: Make expected topics and content specific enough to evaluate answer quality.
5. **Progression**: Include basic questions that should definitely be answered, as well as more advanced edge cases.

### Example Test Case Categories

For a comprehensive test suite, include test cases for:

1. **Basic Concepts**: Fundamental Concepts
2. **Common Operations**: Frequently performed tasks
3. **Error Scenarios**: Common errors and how to fix them
4. **Advanced Features**: Complex or specialized functionality
5. **Best Practices**: Recommended approaches and patterns

## 4. How to Interact with the Testing System

The document quality testing system is accessed through a command-line interface defined in `testDocQuality.ts`.

### Running Tests

To test documentation quality:

```bash
pnpm run test-doc-quality test \
  --source cairo_book \
  --test-file ./tests/samples/cairo_book_quality.json \
  --output ./results/cairo_book_quality_report.json \
  --detailed-output
```

#### Command Options

- `--source`: Documentation source to test (e.g., `cairo_book`, `starknet_docs`)
- `--test-file`: Path to the JSON file containing test cases
- `--output`: (Optional) Path to save the JSON report
- `--no-detailed-output`: (Optional) Disable detailed test output
- `--thresholds`: (Optional) Custom thresholds for determining pass/fail status

### Comparing Documentation Versions

To compare results between different documentation versions:

```bash
pnpm run test-doc-quality compare \
  --source cairo_book \
  --baseline ./results/cairo_book_v1.0.0_report.json \
  --current ./results/cairo_book_v1.1.0_report.json \
  --output ./results/cairo_book_comparison.json
```

#### Comparison Options

- `--source`: Documentation source being compared
- `--baseline`: Path to the baseline results file (previous version)
- `--current`: Path to the current results file (new version)
- `--output`: (Optional) Path to save the comparison report

### Understanding Test Results

The test results include:

1. **Overall Metrics**:

   - Percentage of questions answered
   - Average clarity score
   - Average source alignment score
   - Average content satisfaction score

2. **Detailed Metrics** by:

   - Query type (factual, procedural, conceptual)
   - Difficulty level (basic, intermediate, advanced)
   - Tags (custom categories)

3. **Individual Test Case Results**:

   - Retrieved documents
   - Generated answer
   - Quality metrics
   - Recommendations for improvement

4. **Documentation Recommendations**:
   - Content improvements
   - Structural changes
   - Terminology clarifications
   - Additional examples needed

### Example Output

When running tests with detailed output, you'll see an output like:

```txt
Documentation Quality Report
===========================

Source: cairo_book
Version: 1.0.0
Test Cases: 50

Summary:
The Cairo Book documentation provides good coverage of basic language features with clear explanations of syntax and common operations. However, there are gaps in advanced topics, particularly around components, library calls, and optimization techniques. The documentation would benefit from more practical examples and clearer explanations of complex concepts.

Key Metrics:
- Relevance Score: 0.86
- Coverage Score: 0.78
- Answer Completeness: 0.82

Top Recommendations:
1. Add more examples of component integration in Starknet contracts
2. Improve explanations of library calls vs. contract calls
3. Expand documentation on bit-packing and storage optimization
```
