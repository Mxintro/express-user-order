const express = require('express')
const app = express()
const port = 3000
const bodyParser = require('body-parser')
const multer = require('multer') // v1.0.5
const upload = multer() // for parsing multipart/form-data

app.use(bodyParser.json()) // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })) 

const connection = require('./db')
connection.connect()

const dbQuery = {
	insert:'insert into user(id, name, phone, password) VALUES(0,?,?,?)',
	getUserByPhone:'select * from user where phone = ?',
  queryPwd:'select * from user where password = ?',
  orderInsert:'insert into order(id, name, uid, good, price,count,cost) VALUES(0,?,?,?,?,?,?)',
  orderQuery: 'slect * from order where uid = ?'
};

app.post('/login', upload.array(), (req, res) => {
  const params = req.body
  connection.query(dbQuery.query, params.phone, (err, result) => {
    console.log(result);
    if (err) throw err
    else {
      if (result.length == 0) {
        res.send({
          status: 1,
          msg: '该手机号尚未注册.'
        })
        res.end()
      } else {
        const response = result[0]
        if (response.phone == params.phone && response.password == params.password) {
          res.send({
            status: 0,
            msg: '恭喜,登录成功.'
          })
          res.end()
        } else {
          res.send({
            status: 2,
            msg: '手机号或者密码有误.'
          })
          res.end()
        }
      }
    }
  })
})

app.post('/reg', upload.array(), (req, res) => {
  const params = req.body
  connection.query(dbQuery.getUserByPhone, params.phone, (err, result) => {
    console.log("++++++++++++");
    if (err) throw err
    else {
      //从数据库 查询 手机号 有没有注册
      if (result.length != 0) {
        res.send({
          status: 5,
          msg: '该手机号已经被注册'
        })
        res.end()
      } else if (result.length == 0) {
        var sql = dbQuery.insert;
        let userInfo = [params.name, params.phone, params.password];
        connection.query(sql, userInfo, (err, result) => {
          if (err) throw err
          else {
            console.log("++++++++++++");
            res.send({
              params,
              status: 0,
              message: '恭喜,注册成功.',
              result
            });
            res.end();
          }
        })
      }
    }
  })
})

app.post('/order', upload.array(), (req, res) => {
  const params = req.body
  connection.query(dbQuery.getUserByPhone, params.phone, (err,_) => {
    if (err) throw err
    else {
      connection.query(dbQuery.orderInsert, params, (err, result) => {
        if (err) throw err
        else {
          log(result)
          res.send({
            params,
            status: 0,
            message: '订单完成',
            result
          })
        }
      })
    }
  })
})

app.get('/order', upload.array(), (req, res) => {
  console.log(req.query);
  connection.query(dbQuery.orderQuery, req.query, (err, result) => {
    if(err) throw err
    else {
      res.send({
        params,
        status: 0,
        message: '订单查询成功',
        result
      })
    }
  })
  res.end()
})
app.listen(port, () => console.log(`app listening on port ${port}`)) 