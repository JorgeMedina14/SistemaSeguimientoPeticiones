const useSqlAuth = Boolean(process.env.DB_USER && process.env.DB_PASSWORD);

const sql = useSqlAuth
  ? require('mssql')
  : require('mssql/msnodesqlv8');

module.exports = sql;
module.exports.useSqlAuth = useSqlAuth;
