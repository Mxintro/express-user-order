const mysql = require('mysql')
module.exports = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'hhmmxx',
  database: 'mall_db',
  port: 3306
})