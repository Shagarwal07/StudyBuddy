const CODEGEN_PROMPT_VERSION = "v2_standalone";
const PROMPT_VERSION = CODEGEN_PROMPT_VERSION;

/**
 * Builds standalone Competitive Programming prompt.
 * Strictly preserves the algorithmic tier and complexity.
 */
function buildStandalonePrompt({
  title,
  approachName = "Optimal",
  lang, // "cpp" | "python"
  baseCode = "",
  timeComplexity = "",
  spaceComplexity = "",
  explanation = "",
}) {
  const cleanLang = String(lang || "").toLowerCase().trim();
  const langName = cleanLang === "cpp" ? "C++ (GCC 14 / C++20)" : "Python 3";

  const hasJavaCode = Boolean(
    baseCode &&
    typeof baseCode === "string" &&
    baseCode.trim().length > 0 &&
    !baseCode.trim().startsWith("//")
  );

  const dynamicStrategy = hasJavaCode
    ? `=== DYNAMIC STRATEGY: JAVA SOLUTION DETECTED ===
1. DIRECT TRANSLATION & COMPLEXITY INHERITANCE:
   - Carefully inspect the Reference Java Solution below.
   - Examine its exact loops, data structures, recursion, and runtime behavior.
   - Faithfully translate this EXACT Java logic into ${langName}.
   - The generated ${langName} program MUST strictly preserve the same Time Complexity and Space Complexity as this Java code.
   - DO NOT change or upgrade the algorithm (e.g. if the Java code uses O(N^2) nested loops, write O(N^2) nested loops in ${langName}; if it uses a hash map or two pointers, use the exact same technique).

Reference Java Solution:
\`\`\`java
${baseCode}
\`\`\`
${timeComplexity ? `Stated Time Complexity: ${timeComplexity}` : ""}
${spaceComplexity ? `Stated Space Complexity: ${spaceComplexity}` : ""}`
    : `=== DYNAMIC STRATEGY: NO JAVA SOLUTION FOUND (TIER SYNTHESIS) ===
1. SYNTHESIS BY APPROACH TIER:
   - No reference Java solution was found for this approach.
   - You MUST design and write a solution strictly corresponding to the "${approachName}" algorithmic tier.
   ${timeComplexity ? `- Target Time Complexity: ${timeComplexity}` : ""}
   ${spaceComplexity ? `- Target Space Complexity: ${spaceComplexity}` : ""}
   ${explanation ? `- Approach Concept: ${explanation}` : ""}
   - Strict rule: If this tier is "Brute Force", you MUST write a pure unoptimized brute-force solution (e.g. nested O(N^2) loops or recursion). DO NOT optimize it to O(N) or O(N log N)!
   - If this is "Better", implement the intermediate technique (e.g., hashing or sorting).
   - If this is "Optimal", implement the most optimal algorithmic technique.`;

  return `You are an elite competitive programmer.
Write a 100% COMPLETE, STANDALONE, runnable competitive programming program in ${langName} for the problem "${title}".

APPROACH TIER: "${approachName}"

${dynamicStrategy}

CRITICAL EXECUTION REQUIREMENTS:
1. 100% COMPLETE, RUNNABLE STANDALONE CP PROGRAM:
   ${cleanLang === "cpp"
     ? `- Include all necessary standard libraries (#include <iostream>, <vector>, <string>, <algorithm>, <unordered_map>, etc.) and 'using namespace std;'.
   - Implement input reading from standard input (cin) in int main().
   - Execute the algorithm and print the final result to standard output (cout).
   - Use fast I/O: ios_base::sync_with_stdio(false); cin.tie(NULL);`
     : `- Include necessary imports (import sys, etc.).
   - Read inputs from standard input (sys.stdin or input()).
   - Execute the algorithm and print the result directly to stdout using print().
   - Wrap driver execution under if __name__ == "__main__":.`}
2. DO NOT use LeetCode 'class Solution' wrapper for this standalone mode. This code must be self-contained and runnable in any standard compiler by piping test inputs.
3. Output ONLY the raw ${langName} source code inside a single markdown code block:
\`\`\`${cleanLang}
// your complete code here
\`\`\`
Do NOT include commentary, markdown headers, or explanations.`;
}

/**
 * Builds the official LeetCode runner harness prompt.
 */
function buildOfficialHarnessPrompt({
  title,
  lang, // "cpp" | "java" | "python"
  officialCode = "",
}) {
  const cleanLang = String(lang || "").toLowerCase().trim();
  const langName =
    cleanLang === "cpp"
      ? "C++"
      : cleanLang === "java"
      ? "Java"
      : "Python";

  return `You are a systems programmer building a complete runner harness for a LeetCode problem.
Given the authentic Official LeetCode solution for "${title}", write the FULL RUNNABLE PROGRAM that wraps this exact solution so it can be compiled and executed in any standard compiler/terminal.

Official LeetCode Implementation:
\`\`\`${cleanLang}
${officialCode}
\`\`\`

REQUIREMENTS:
1. STRICT COMPATIBILITY: Keep the exact Official class/method logic intact. Do NOT alter the algorithm or signature.
2. Complete Runnable Harness:
   ${
     cleanLang === "cpp"
       ? `- Include standard headers: <iostream>, <vector>, <string>, <algorithm>, <unordered_map>, etc. and 'using namespace std;'.
   - Include the official 'class Solution'.
   - Add 'int main()' that reads the problem parameters from standard input (cin), instantiates 'Solution sol;', calls the solution method, and prints the result to standard output (cout).`
       : cleanLang === "java"
       ? `- Include standard imports (import java.util.*; etc.).
   - Include the official 'class Solution'.
   - Add a 'public class Main' with 'public static void main(String[] args)' that reads input using Scanner, instantiates 'Solution sol = new Solution();', calls the method, and prints the result to System.out.`
       : `- Include standard imports from typing (List, Optional, etc.) and sys.
   - Include the official 'class Solution'.
   - Add 'def main():' that parses input from sys.stdin, instantiates 'sol = Solution()', calls the method, and prints the result. Call main() under if __name__ == "__main__":.`
   }
3. Output ONLY the complete, runnable ${langName} program inside a single markdown code block:
\`\`\`${cleanLang}
// your complete code here
\`\`\`
Do NOT include commentary or extra markdown text outside the code block.`;
}

/**
 * Extracts raw source code from Gemini markdown code block
 */
function extractCodeFromReply(reply, cleanLang) {
  if (!reply) return "";
  const match = reply.match(
    new RegExp(`\`\`\`(?:${cleanLang}|c\\+\\+|cpp|python|py|java)?\\s*([\\s\\S]*?)\`\`\``, "i")
  );
  return match && match[1]?.trim() ? match[1].trim() : reply.replace(/```/g, "").trim();
}

module.exports = {
  CODEGEN_PROMPT_VERSION,
  PROMPT_VERSION: CODEGEN_PROMPT_VERSION,
  buildStandalonePrompt,
  buildOfficialHarnessPrompt,
  extractCodeFromReply,
};
