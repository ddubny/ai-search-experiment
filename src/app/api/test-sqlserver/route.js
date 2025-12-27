export async function GET() {
  const pool = await getSqlServerPool();
  const result = await pool
    .request()
    .query("SELECT 'OK' AS status");
  return Response.json({ success: true, result: result.recordset });
}
