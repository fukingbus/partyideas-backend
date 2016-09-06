var config = require('../config.json');
var express = require('express');
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
        var query = mysqlConn.query("SELECT * FROM gameroom_game",function (err, sqlRes) {
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
                            msg : "No game record"
                        }
                    }));
                }
            }
        });
    })
    .post(function (req, res) {

    });

module.exports = router;
