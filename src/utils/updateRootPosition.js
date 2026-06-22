const User = require("../models/User");

async function setRootPosition(userId, rootPosition) {
  const user = await User.findById(userId);

  if (!user) return;

  user.rootPosition = rootPosition;
  await user.save();

  // Left Side
  for (const childId of user.leftChildren || []) {
    await setRootPosition(childId, rootPosition);
  }

  // Right Side
  for (const childId of user.rightChildren || []) {
    await setRootPosition(childId, rootPosition);
  }
}

async function migrateRootPosition() {
  try {
    // Root Users
    const roots = await User.find({
      parentId: null
    });

    for (const root of roots) {

      // Root ke LEFT tree
      for (const childId of root.leftChildren || []) {
        await setRootPosition(childId, "LEFT");
      }

      // Root ke RIGHT tree
      for (const childId of root.rightChildren || []) {
        await setRootPosition(childId, "RIGHT");
      }
    }

    console.log("✅ Root Position Migration Completed");
  } catch (err) {
    console.error(err);
  }
}

module.exports = migrateRootPosition;