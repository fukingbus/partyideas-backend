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
        var query = mysqlConn.query("SELECT * FROM item",function (err, sqlRes) {
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
                            msg : "No item record"
                        }
                    }));
                }
            }
        });
    })
    .post(function (req, res) {

    });
router.route('/:id')
    .post(function (req,res){
        var itemid = req.params.id;
        var username = req.body.username;
        var qty = req.body.qty;
        var price = req.body.price;
        sqlData =  {
            idItem : itemid,
            member : username,
            buyquantity : qty,
            amount : price
        };
        var query = mysqlConn.query('INSERT INTO orderlist SET ?',sqlData,function (err, sqlRes) {
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
                            msg : "SQL Response return 0 length"
                        }
                    }));
                }
            }
        });
    });

module.exports = router;
