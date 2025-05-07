import postgres from "postgres";

const db = postgres(process.env.DATABASE_URL!);
export default db;
