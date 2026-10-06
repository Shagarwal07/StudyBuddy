/**
 * Automatic DSA Problem Categorizer & Taxonomy Engine
 * Standardizes problems into recognized interview pattern modules
 */

const DSA_MODULE_ORDER = [
  "Math & Fundamentals",
  "Arrays & Hashing",
  "Two Pointers & Sliding Window",
  "Prefix Sum",
  "Binary Search",
  "Strings",
  "Linked Lists",
  "Stack & Queue",
  "Trees & BST",
  "Graphs",
  "Dynamic Programming",
  "Heaps & Greedy",
  "Bit Manipulation",
];

const PATTERN_RULES = [
  {
    name: "Math & Fundamentals",
    regex: /watermelon|plus or minus|add two|subtract the product|divide a number|palindrome number|restoring three|helpful maths|digits|count the digits|power of|sqrt\(x\)|fizz buzz|greatest common divisor|gcd|lcm|primes?/i,
  },
  {
    name: "Binary Search",
    regex: /binary search|koko|eating bananas|ship packages|split array|aggressive cows|allocate.*pages|bouquets|bad version|guess number|search in rotated|find minimum in rotated|single element in|median of two/i,
  },
  {
    name: "Prefix Sum",
    regex: /pivot index|highest altitude|range sum|car pooling|flight bookings|prefix sum|subarray sum equals k|product of array except self/i,
  },
  {
    name: "Two Pointers & Sliding Window",
    regex: /two sum|container with most water|distinct subarrays|two pointer|sliding window|trapping rain|3sum|4sum|minimum window substring|longest substring without repeating|permutation in string/i,
  },
  {
    name: "Trees & BST",
    regex: /tree|bst|binary search tree|inorder|preorder|postorder|lca|ancestor|diameter of binary|maximum depth|invert binary|symmetric tree|path sum|serialize.*deserialize|level order/i,
  },
  {
    name: "Graphs",
    regex: /graph|island|bfs|dfs|network|cycle|bipartite|dijkstra|topological|course schedule|clone graph|pacific atlantic|word ladder|alien dictionary/i,
  },
  {
    name: "Dynamic Programming",
    regex: /dynamic programming|climbing stairs|coin change|knapsack|longest increasing subsequence|house robber|jump game|edit distance|word break|unique paths|partition equal subset|target sum/i,
  },
  {
    name: "Strings",
    regex: /string|anton and danik|anagram|roman to integer|integer to roman|valid parentheses|longest common prefix|decode string/i,
  },
  {
    name: "Linked Lists",
    regex: /linked list|reverse list|merge two sorted lists|reorder list|remove nth node|linked list cycle|copy list with random pointer/i,
  },
  {
    name: "Stack & Queue",
    regex: /stack|queue|daily temperatures|min stack|evaluate reverse polish|largest rectangle in histogram/i,
  },
  {
    name: "Heaps & Greedy",
    regex: /kth largest|heap|priority queue|top k frequent|find median from data stream|task scheduler|merge k sorted/i,
  },
  {
    name: "Arrays & Hashing",
    regex: /array|duplicate|candies|richest|largest|wealth|continuous increasing|group anagrams|encode and decode/i,
  },
];

const GENERIC_MODULE_NAMES = new Set([
  "dsa",
  "core dsa",
  "custom sheet",
  "dsa patterns",
  "general",
  "official problems",
  "custom-1",
  "core problems",
  "problems",
  "sheet",
  "all",
]);

/**
 * Infer the standard DSA module from problem title and any incoming raw category
 */
function inferProblemCategory(title = "", rawCategory = "") {
  const cur = String(rawCategory || "").trim();

  // If already a specific module, step, or category name, preserve it exactly
  if (cur && !GENERIC_MODULE_NAMES.has(cur.toLowerCase())) {
    return cur;
  }

  // Match by title keywords
  const t = String(title || "").trim();
  for (const rule of PATTERN_RULES) {
    if (rule.regex.test(t)) {
      return rule.name;
    }
  }

  return "Arrays & Hashing";
}

/**
 * Sort list of module names according to conventional pedagogical DSA order
 */
function sortModulesByPedagogy(moduleList = []) {
  const hasNumberedSteps = moduleList.some((m) => {
    const t = m.moduleTitle || m;
    return /^(step|day|module|week|level|rating|ladder)\s*\d+/i.test(t);
  });
  if (hasNumberedSteps) {
    return [...moduleList];
  }

  return [...moduleList].sort((a, b) => {
    const titleA = a.moduleTitle || a;
    const titleB = b.moduleTitle || b;
    const idxA = DSA_MODULE_ORDER.indexOf(titleA);
    const idxB = DSA_MODULE_ORDER.indexOf(titleB);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return 0;
  });
}

module.exports = {
  inferProblemCategory,
  sortModulesByPedagogy,
  DSA_MODULE_ORDER,
};
