import mongoose from 'mongoose';

// connection cache
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  // 1. Check if Env Var exists inside the function to prevent top-level crashes
  const MONGODB_URI = process.env.MONGODB_URI;

  if (!MONGODB_URI) {
    throw new Error('CRITICAL ERROR: MONGODB_URI is missing in Vercel Environment Variables.');
  }

  // 2. Return existing connection
  if (cached.conn) {
    return cached.conn;
  }

  // 3. Create new connection
  if (!cached.promise) {
    const opts = {
      bufferCommands: false, // Return errors immediately if driver is offline
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      console.log("✅ MongoDB Connected Successfully");
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    console.error("❌ MongoDB Connection Error:", e);
    throw e;
  }

  return cached.conn;
}

export default dbConnect;