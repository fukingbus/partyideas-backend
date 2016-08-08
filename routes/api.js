/** API
 *
 *         Important
 *   Before making a request to the API,
 *   please make sure the content type was
 *   successfully set into json and the data
 *   was sent with json format
 *
    Content-Type: application/json


 **/

var express = require('express');
var createHash = require('sha.js');
var router = express.Router();
var mysql      = require('mysql');
var mysqlConn = mysql.createConnection({
    host     : 'localhost',
    user     : 'root',
    password : '',
    database : 'partyideas'
});

/* GET home page. */
router.route('/user')
    .post(function (req,res) {
        //new user account
        var mUsername = isAlphanumeric(req.body.username);
        var mPass = isAlphanumeric(req.body.pass);
        var mEmail = (req.body.email).indexOf("@")!=-1 ? req.body.email : false;
        var mPhone = req.body.phone;
        var mAccType = isAlphanumeric(req.body.accType);

        if(!mUsername || !mPass || !mEmail || !mAccType){
            res.send(JSON.stringify({
                status : false,
                err : {
                    msg : "Invalid Data"
                }
            }));
        }
        else{
            var data =  {
                username : mUsername,
                password : hash(mPass),
                email : mEmail,
                phone : mPhone,
                accType : mAccType
            };
            var query = mysqlConn.query('INSERT INTO USER SET ?',data,function (err, sqlRes) {
                if(err){
                    res.send(JSON.stringify({
                        status : false,
                        err : {
                            msg : err.code
                        }
                    }));
                }
                else{
                    res.send(JSON.stringify({
                        status : true,
                        err : null
                    }));
                }
            });

        }
    });
router.route('/user/login')
    .post(function (req,res) {
        var mUsername = req.body.username;
        var mPass = hash(req.body.pass);

        var query = mysqlConn.query("SELECT * FROM USER WHERE USERNAME = '"+mUsername+"' AND PASSWORD = '"+mPass+"'",function (err, sqlRes) {
           if(err){
               res.send(JSON.stringify({
                   status : false,
                   err : {
                       msg : err.code,
                       code: 100
                   }
               }));
           }
           else{
               if(sqlRes.length==0){
                   res.send(JSON.stringify({
                       status : false,
                       err : {
                           msg : "Account not found or password mismatch",
                           code: 101
                       }
                   }));
               }
               else{
                   res.send(JSON.stringify({
                       status : true,
                       err : null,
                       data: {
                           username : sqlRes[0].username,
                           email : sqlRes[0].email,
                           phone: sqlRes[0].phone,
                           accType: sqlRes[0].accType
                       }
                   }));
               }
           }

        });
        console.log(query.sql);
    });
function isAlphanumeric( str ) {
    return /^[0-9a-zA-Z]+$/.test(str) ? str : false;
}
function hash(str){
    var sha256 = createHash('sha256');
   return sha256.update(str, 'utf8').digest("hex");
}


module.exports = router;
