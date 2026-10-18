/**
 * Which store the app is running against.
 *
 * "database" writes to a SQLite file through server actions; it needs a
 * disk that survives between requests. "demo" keeps each visitor's
 * leads in their own browser and is what a serverless deployment gets,
 * because a file written on one instance is not there for the next
 * request and the loss would be silent.
 */
export type DataMode = 'database' | 'demo';

const declared = process.env.NEXT_PUBLIC_DATA_MODE;

export const DATA_MODE: DataMode =
  declared === 'database' || declared === 'demo'
    ? declared
    : // Vercel and other serverless hosts set this; nothing is inferred
      // from it beyond "there is no durable disk here".
      process.env.NEXT_PUBLIC_SERVERLESS === 'true'
      ? 'demo'
      : 'database';

export const IS_DEMO = DATA_MODE === 'demo';
