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
        var mGoogleID = mAccType == "google" ? hash("PI_GTOKEN_"+req.body.gid) : 0;

        var data;
        if(mAccType == "general") {
            if (!mUsername || !mPass || !mEmail || !mAccType) {
                res.send(JSON.stringify({
                    status: false,
                    err: {
                        msg: "Invalid Data"
                    }
                }));
            }
            data =  {
                username : mUsername,
                password : hash(mPass),
                email : mEmail,
                phone : mPhone,
                accType : "general"
            };
        }
        else{
            data =  {
                username : mUsername,
                email : mEmail,
                phone : mPhone,
                gid : mGoogleID,
                accType : "google"
            };
        }
        var preQuery = mysqlConn.query("SELECT id FROM USER WHERE username = '"+mUsername+"'",function (err, preQueryRes) {
            if(err){
                res.send(JSON.stringify({
                    status : false,
                    err : {
                        msg : err.code
                    }
                }));
            }
            else {
                if(preQueryRes.length!=0){
                    res.send(JSON.stringify({
                        status : false,
                        err : {
                            msg : "Account already exist",
                            code: 201
                        }
                    }));
                }
                else{
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
                                token : mGoogleID,
                                err : null
                            }));
                        }
                    });
                }
            }
        });

    })
    .get(function (req,res){
        var accType = req.query.type;
        var email;
        var username;
        if(accType == "google")
            email = req.query.email;
        else
            username = req.query.username;

        var sql = "SELECT ID FROM USER WHERE "+ (accType=="google" ? "email = '"+email+"' AND accType = 'google'" : "username = '"+username+"' AND accType = 'general'");
        var query = mysqlConn.query(sql,function (err, sqlRes) {
            if(err){
                res.send(JSON.stringify({
                    status : false,
                    err : {
                        msg : err.code
                    }
                }));
            }
            else{
                if(sqlRes.length!=0) {
                    res.send(JSON.stringify({
                        status: true,
                        err: null
                    }));
                }
                else{
                    res.send(JSON.stringify({
                        status : false,
                        err : {
                            msg : "Account not found",
                            code: 101
                        }
                    }));
                }
            }
        });
    });
router.route('/user/login')
    .post(function (req,res) {
        var mUsername = req.body.username;
        var mPass = req.body.pass;
        var mToken = req.body.token;
        var mType = req.body.type;
        var mEmail = req.body.email;

        var gSQL = "SELECT * FROM USER WHERE email = '"+mEmail+"' AND gid='"+mToken+"' AND accType = 'google'";
        var SQL = "SELECT * FROM USER WHERE username = '"+mUsername+"' AND password = '"+mPass+"' AND accType = 'general'";
        var query = mysqlConn.query(mType == 'google' ? gSQL : SQL,function (err, sqlRes) {
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
    var res = sha256.update(str, 'utf8').digest("hex");
    console.log(str+" : "+res);
   return res;
}


module.exports = router;
