module.exports = (user) => ({
  id: user._id || user.id,
  username: user.username,
  name: user.username,
  email: user.email,
  badge: user.badge || "",
  leetcodeHandle: user.leetcodeHandle || "",
  codeforcesHandle: user.codeforcesHandle || "",
  role: user.role || "user",
  isRkStudent: Boolean(user.isRkStudent),
  rkStatus: user.rkStatus || "none",
  rkStudentDetails: user.rkStudentDetails || null,
});
