var config = require('../config.json');
var express = require('express');
var createHash = require('sha.js');
var router = express.Router();
var mysql      = require('mysql');
var mysqlConn = mysql.createConnection({
    host     : config.MYSQL_SERVER_HOST,
    user     : 'partyideas_backend_api',
    password : 'api',
    database : 'partyideas'
});

router.route('/')
    .get(function (req, res) {
        var query = mysqlConn.query("SELECT * FROM location",function (err, sqlRes) {
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
                        err: null,
                        data : sqlRes,
                        size : sqlRes.length
                    }));
                }
                else{
                    res.send(JSON.stringify({
                        status : false,
                        err : {
                            msg : "No location record"
                        }
                    }));
                }
            }
        });
    })
    .post(function (req, res) {

    });
router.route('/:id')
    .get(function(req,res){
        var query = mysqlConn.query("SELECT * FROM location WHERE id = '"+req.params.id+"'",function (err, sqlRes) {
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
                        err: null,
                        data : sqlRes
                    }));
                }
                else{
                    res.send(JSON.stringify({
                        status : false,
                        err : {
                            msg : "No location record"
                        }
                    }));
                }
            }
        });
    });

function hash(str){
    var sha256 = createHash('sha256');
    var res = sha256.update(str, 'utf8').digest("hex");
    console.log(str+" : "+res);
    return res;
}
module.exports = router;
