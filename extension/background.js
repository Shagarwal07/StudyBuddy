// StudyBuddy Extension – Streamlined Background Service Worker (Ponytail Minimalist)
// Elevated host permissions bypass CORS, mixed-content, and CSP restrictions.

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  const handlers = {
    SYNC_SUBMISSION: handleSyncSubmission,
    TEST_CONNECTION: handleTestConnection,
    GET_USER_STATUS: handleGetUserStatus,
    SYNC_ALL_LEETCODE: handleSyncAllLeetCode,
    SYNC_ALL_CODEFORCES: handleSyncAllCodeforces,
    SYNC_YOUTUBE: handleSyncYoutube,
  };

  const fn = handlers[request.action];
  if (fn) {
    fn(request.payload || {})
      .then(sendResponse)
      .catch((err) => sendResponse({ success: false, message: err.message || "Operation failed." }));
    return true; // Keep async channel open
  }
});

/**
 * Resolves API URL & Token from payload or persistent storage
 */
async function getApiConfig(payload = {}) {
  let { apiUrl, token } = payload;
  if (!token || !apiUrl) {
    const stored = await chrome.storage.local.get(["studybuddy_token", "studybuddy_api_url"]);
    if (!token) token = stored.studybuddy_token || "";
    if (!apiUrl) apiUrl = stored.studybuddy_api_url;
  }
  return {
    token,
    apiUrl: (apiUrl || "http://localhost:5000/api").replace(/\/+$/, ""),
  };
}

const inFlightSyncs = new Map();
const recentSyncTimes = new Map();

/**
 * Syncs a single problem submission (LeetCode, Codeforces, GFG)
 */
async function handleSyncSubmission(payload) {
  const { apiUrl, token } = await getApiConfig(payload);
  const { problemSlug, title, platform } = payload;

  if (!token) return { success: false, message: "StudyBuddy account not linked." };

  const normKey = (problemSlug || title || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  if (!normKey) return { success: false, message: "Invalid problem slug." };

  // 1. Coalesce concurrent duplicate requests
  if (inFlightSyncs.has(normKey)) {
    return inFlightSyncs.get(normKey);
  }

  // 2. Debounce recent sync within 60s
  const lastSync = recentSyncTimes.get(normKey) || 0;
  if (Date.now() - lastSync < 60000) {
    return { success: true, message: "Submission already synced recently.", alreadySolved: true };
  }

  const syncPromise = (async () => {
    try {
      const res = await fetch(`${apiUrl}/practice/sync-submission`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          problemSlug,
          title: title || problemSlug.replace(/[-_]/g, " "),
          platform: platform || "LeetCode",
          status: "Accepted",
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) return { success: false, message: data?.message || `Server error (${res.status})` };

      recentSyncTimes.set(normKey, Date.now());
      return data || { success: true, message: "Submission synced successfully!" };
    } catch (err) {
      return { success: false, message: `Unable to reach StudyBuddy at ${apiUrl}` };
    } finally {
      inFlightSyncs.delete(normKey);
    }
  })();

  inFlightSyncs.set(normKey, syncPromise);
  return syncPromise;
}

/**
 * Tests connection to StudyBuddy backend
 */
async function handleTestConnection(payload) {
  const { apiUrl, token } = await getApiConfig(payload);

  try {
    const healthRes = await fetch(`${apiUrl}/health`).catch(() => null);
    if (!healthRes?.ok) {
      return { success: false, message: `Cannot reach server at ${apiUrl}. Check server status.` };
    }

    if (token) {
      const userRes = await fetch(`${apiUrl}/practice/user-status`, {
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => null);

      if (userRes?.status === 401) {
        return { success: false, message: "Server online, but token is invalid or expired." };
      }
      if (userRes?.ok) {
        const userData = await userRes.json().catch(() => ({}));
        return { success: true, message: `Connected as ${userData.user?.name || "User"}! 🔥` };
      }
    }

    return { success: true, message: "Server connected successfully!" };
  } catch (err) {
    return { success: false, message: "Connection failed: " + err.message };
  }
}

/**
 * Fetches user profile and solved status
 */
async function handleGetUserStatus(payload) {
  const { apiUrl, token } = await getApiConfig(payload);
  if (!token) return { success: false, message: "No token provided." };

  try {
    const res = await fetch(`${apiUrl}/practice/user-status`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.ok ? await res.json() : { success: false };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

/**
 * Fetches all solved problems till date from LeetCode and batch syncs to StudyBuddy
 */
async function handleSyncAllLeetCode(payload) {
  const { apiUrl, token } = await getApiConfig(payload);
  if (!token) return { success: false, message: "Please connect your StudyBuddy account first!" };

  try {
    // 1. Fetch user's problem list from LeetCode session API
    const lcRes = await fetch("https://leetcode.com/api/problems/all/", { credentials: "include" });
    if (!lcRes.ok) return { success: false, message: "Failed to connect to LeetCode. Are you logged into leetcode.com?" };

    const lcData = await lcRes.json();
    if (!lcData.user_name) {
      return { success: false, message: "You are not logged into LeetCode. Please open leetcode.com and log in!" };
    }

    // 2. Validate handle match if user configured leetcodeHandle in StudyBuddy
    const userStatus = await handleGetUserStatus({ apiUrl, token });
    const profileHandle = userStatus?.user?.leetcodeHandle?.trim();
    if (profileHandle && profileHandle.toLowerCase() !== lcData.user_name.toLowerCase()) {
      return {
        success: false,
        message: `Account mismatch! Logged into LeetCode as '${lcData.user_name}', but StudyBuddy profile is set to '${profileHandle}'.`,
      };
    }

    // 3. Extract all problems where status === "ac"
    const problemSlugs = (lcData.stat_status_pairs || [])
      .filter((p) => p.status === "ac")
      .map((p) => p.stat?.question__title_slug)
      .filter(Boolean);

    if (problemSlugs.length === 0) {
      return { success: true, message: `Connected to LeetCode as ${lcData.user_name}, but 0 solved problems found yet.` };
    }

    // 4. Batch sync to StudyBuddy
    const syncRes = await fetch(`${apiUrl}/practice/sync-batch`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ problemSlugs }),
    });

    const syncData = await syncRes.json().catch(() => null);
    if (!syncRes.ok) return { success: false, message: syncData?.message || "Failed to batch sync problems." };

    return {
      success: true,
      message: `🎉 Synced ${syncData.newlySolvedCount || problemSlugs.length} problems! Total solved on StudyBuddy: ${syncData.totalSolved} 🔥`,
      totalSolved: syncData.totalSolved,
    };
  } catch (err) {
    return { success: false, message: "Sync failed: " + err.message };
  }
}

/**
 * Fetches all solved problems till date from Codeforces and batch syncs to StudyBuddy
 */
async function handleSyncAllCodeforces(payload) {
  const { apiUrl, token } = await getApiConfig(payload);
  if (!token) return { success: false, message: "Please connect your StudyBuddy account first!" };

  try {
    let cfHandle = payload.handle?.trim();

    // 1. Resolve handle: payload -> StudyBuddy profile -> active Codeforces tab
    if (!cfHandle) {
      const userStatus = await handleGetUserStatus({ apiUrl, token });
      cfHandle = userStatus?.user?.codeforcesHandle?.trim();
    }

    if (!cfHandle && chrome.tabs) {
      const allTabs = await chrome.tabs.query({}).catch(() => []);
      const cfTab = allTabs.find((t) => t.url?.includes("codeforces.com"));
      if (cfTab?.id) {
        const exec = await chrome.scripting.executeScript({
          target: { tabId: cfTab.id },
          func: () => document.querySelector(".lang-chooser a[href^='/profile/']")?.textContent?.trim() || null,
        }).catch(() => null);
        cfHandle = exec?.[0]?.result || "";
      }
    }

    if (!cfHandle) {
      return { success: false, message: "Please enter your Codeforces username above or save it in Settings!" };
    }

    // 2. Query Codeforces public submissions API
    const cfRes = await fetch(`https://codeforces.com/api/user.status?handle=${encodeURIComponent(cfHandle)}&from=1&count=5000`);
    if (!cfRes.ok) return { success: false, message: `Failed to query Codeforces for '${cfHandle}'. Check username and try again.` };

    const cfData = await cfRes.json();
    if (cfData.status !== "OK") return { success: false, message: cfData.comment || `Codeforces user '${cfHandle}' not found.` };

    // 3. Extract AC problems
    const solvedSet = new Set();
    for (const sub of (cfData.result || [])) {
      if (sub.verdict === "OK" && sub.problem) {
        const { contestId, index, name } = sub.problem;
        if (contestId && index) {
          solvedSet.add(`${contestId}${index}`);
          solvedSet.add(`cf-${contestId}${index}`.toLowerCase());
        }
        if (name) solvedSet.add(name);
      }
    }

    const problemSlugs = Array.from(solvedSet);
    if (problemSlugs.length === 0) {
      return { success: true, message: `Connected to Codeforces as '${cfHandle}', but 0 accepted problems found.` };
    }

    // 4. Batch sync to StudyBuddy
    const syncRes = await fetch(`${apiUrl}/practice/sync-batch`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ problemSlugs }),
    });

    const syncData = await syncRes.json().catch(() => null);
    if (!syncRes.ok) return { success: false, message: syncData?.message || "Failed to batch sync Codeforces problems." };

    return {
      success: true,
      message: `🎉 Synced ${syncData.newlySolvedCount || problemSlugs.length} Codeforces problems for ${cfHandle}! Total on StudyBuddy: ${syncData.totalSolved} 🔥`,
      totalSolved: syncData.totalSolved,
      handle: cfHandle,
    };
  } catch (err) {
    return { success: false, message: "Codeforces sync error: " + err.message };
  }
}

/**
 * Imports a YouTube playlist or video directly into StudyBuddy courses
 */
async function handleSyncYoutube(payload) {
  const { apiUrl, token } = await getApiConfig(payload);
  const { url } = payload;

  if (!token) return { success: false, message: "StudyBuddy account not linked. Click extension icon to link." };
  if (!url) return { success: false, message: "No YouTube URL provided." };

  try {
    const res = await fetch(`${apiUrl}/playlists/sync`, {
      method: "POST",
      signal: AbortSignal.timeout(25000),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ playlistUrl: url }),
    });

    const data = await res.json().catch(() => null);
    if (!res.ok) {
      return { success: false, message: data?.message || `Import failed (${res.status})` };
    }

    return {
      success: true,
      message: `🎉 Course "${data.playlist?.title || "Playlist"}" added to StudyBuddy!`,
      playlist: data.playlist,
    };
  } catch (err) {
    if (err.name === "TimeoutError" || err.name === "AbortError") {
      return { success: false, message: "YouTube import timed out. Please try again." };
    }
    return { success: false, message: `Unable to reach StudyBuddy at ${apiUrl}` };
  }
}

