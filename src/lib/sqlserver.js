import sql from "mssql";

const config = {
  user: "sa",
  password: process.env.SQLSERVER_PASSWORD,
  server: "localhost",
  port: 1433,
  database: process.env.SQLSERVER_DATABASE,
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true,
  },
  connectionTimeout: 15000,
  requestTimeout: 15000,
};

let pool;

export async function getSqlServerPool() {
  if (!pool) {
    pool = await sql.connect(config);
  }
  return pool;
}
