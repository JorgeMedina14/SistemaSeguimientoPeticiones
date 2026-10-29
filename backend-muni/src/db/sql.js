const useSqlAuth = Boolean(process.env.DB_USER && process.env.DB_PASSWORD);

let sql;
if (useSqlAuth) {
  sql = require('mssql');
} else {
  try {
    sql = require('mssql/msnodesqlv8');
  } catch {
    sql = require('mssql');
  }
}

module.exports = sql;
module.exports.useSqlAuth = useSqlAuth;
