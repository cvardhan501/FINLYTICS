import mongoose from 'mongoose';

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

let cached = global.mongooseCache;

if (!cached) {
  cached = global.mongooseCache = { conn: null, promise: null };
}

export async function connectToDatabase(): Promise<typeof mongoose | null> {
  const MONGODB_URI = process.env.MONGODB_URI;

  if (!MONGODB_URI) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[FINLYTICS DB] MONGODB_URI environment variable is missing.');
    }
    return null;
  }

  // Reuse active connection if ready State is connected (1)
  if (cached?.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  // Clear stale promise if previous attempt failed or disconnected
  if (!cached?.promise || mongoose.connection.readyState === 0) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
      maxPoolSize: 10,
    };

    if (process.env.NODE_ENV === 'development') {
      console.log('[FINLYTICS DB] Connecting to MongoDB Atlas...');
    }

    cached!.promise = mongoose
      .connect(MONGODB_URI, opts)
      .then((mongooseInstance) => {
        if (process.env.NODE_ENV === 'development') {
          console.log('[FINLYTICS DB] Connection established successfully');
        }
        return mongooseInstance;
      })
      .catch((err) => {
        console.error('[FINLYTICS DB] Connection failed:', err.message || err);
        cached!.promise = null;
        cached!.conn = null;
        return null as any;
      });
  }

  try {
    cached!.conn = await cached!.promise;
  } catch (e) {
    cached!.promise = null;
    cached!.conn = null;
    return null;
  }

  return cached!.conn;
}
