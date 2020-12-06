const express = require('express')
const app = express()
const port = 3000

const bodyParser = require('body-parser')
const multer = require('multer') // v1.0.5
const upload = multer() // for parsing multipart/form-data

const jwt = require('jsonwebtoken')
const utils = require('./utils.js')

app.use(bodyParser.json()) // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })) 
app.use(function(req, res, next){
  //设置跨域访问
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Content-Length, Authorization, Accept, X-Requested-With , yourHeaderFeild');
  res.header('Access-Control-Allow-Methods', 'PUT, POST, GET, DELETE, OPTIONS');

  if (req.method == 'OPTIONS') {
    res.sendStatus(200); /*让options请求快速返回*/
  }else {
    next();
  }
})

app.listen(port, () => console.log(`app listening on port ${port}`)) 

const connection = require('./db')
connection.connect()

const dbQuery = {
	insert:'insert into user(id, name, phone, password) VALUES(0,?,?,?)',
  getUserByPhone:'select * from user where phone = ?',
  getUserById: 'select * from user where id = ?',
  queryPwd:'select * from user where password = ?',
  orderInsert:'insert into good_order (id,title,goodIid,nowprice,count,style,size,uid,cost,create_time,orderId) VALUES(0,?,?,?,?,?,?,?,?,?,?)',
  orderQuery: 'select * from good_order where uid = ?'
};

app.post('/login', upload.array(), (req, res) => {
  const params = req.body
  console.log(params);
  connection.query(dbQuery.getUserByPhone, params.phone, (err, result) => {
    console.log(result);
    if (err) {
      res.send({
        status: 500,
        msg: err
      })
      return
    }
    else {
      if (result.length == 0) {
        res.send({
          status: 401,
          msg: '该手机号尚未注册.'
        })
        res.end()
      } else {
        const user = result[0]
        if (user.phone == params.phone && user.password == params.password) {
          const data = {...user}
          delete data.password
          data.token = jwt.sign({uid: user.id}, 'seaturtle', { expiresIn: '7d' })
          res.send({
            status: 200,
            msg: '恭喜,登录成功.',
            data: data
          })
          res.end()
        } else {
          res.send({
            status: 401,
            msg: '手机号或者密码有误.'
          })
        }
      }
    }
  })
})

app.post('/reg', upload.array(), (req, res) => {
  const params = req.body
  connection.query(dbQuery.getUserByPhone, params.phone, (err, result) => {
    if (err) {
      res.send({
        status: 500,
        msg: err
      })
      return
    }
    else {
      //从数据库 查询 手机号 有没有注册
      if (result.length != 0) {
        res.send({
          status: 403,
          msg: '该手机号已经被注册'
        })
        res.end()
      } else if (result.length == 0) {
        let userInfo = [params.name, params.phone, params.password]
        connection.query(dbQuery.insert, userInfo, (err, result) => {
          if (err) {
            res.send({
              status: 500,
              msg: err
            })
            return
          }
          else {
            console.log(result.insertId)
            connection.query(dbQuery.getUserById, result.insertId, (err, result) => {
              if (err) {
                res.send({
                  status: 500,
                  msg: err
                })
                return
              }
              const user = result[0]
              const data = {...user}
              delete data.password
              data.token = jwt.sign({uid: user.id}, 'seaturtle', { expiresIn: '7d' })
              res.send({
                status: 201,
                msg: '恭喜,注册成功.',
                data: data
              })
            })
          }
        })
      }
    }
  })
})

app.post('/order', verifyToken,(req, res) => {
  const data = req.body
  if(data.length < 1) {
    res.sendStatus(400)
    return
  }
  for(let item of data){
    const order = { ...item }
    order.order = utils.randomNumber()
    const params = Object.values(order)

    connection.query(dbQuery.orderInsert, params, (err,_) => {
      if (err) {
        res.send({
          status: 500,
          msg: err
        })
        return
      }
    })
  }
  res.send({
    status: 201,
    message: '订单完成',
  })
})

app.get('/order', upload.array(), verifyToken,(req, res) => {
  console.log(req.query)
  try {
    const uid = req.query['uid']
    connection.query(dbQuery.orderQuery, uid, (err, result) => {
      if (err) {
        res.send({
          status: 500,
          msg: err
        })
        return
      }
      else {
        res.send({
          status: 200,
          message: '订单查询成功',
          data: result
        })
      }
    })
  } catch(err) {
    console.log(err)
  }
})

function verifyToken(req, res, next) {
  const token = req.headers['authorization']
  if (typeof token === 'undefined') {
    res.send({
      status:400,
      msg:'undefined'
    })
    return
  }else {
    jwt.verify(token, "seaturtle", function (err, decode) {
      if (err) {  
        res.send({'status':403,msg:'过期'});
        return          
      } else {
        next()
      }
    })
  }
}