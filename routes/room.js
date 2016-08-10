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
        getRoom(function (obj){
            if(obj.err){
                res.send(JSON.stringify({
                    status : false,
                    err : {
                        msg : obj.msg
                    }
                }));
            }
            else{
                if(obj.data != null) {
                    res.send(JSON.stringify({
                        status : true,
                        err : null,
                        data : obj.data
                    }));
                }
                else{
                    res.send(JSON.stringify({
                        status : false,
                        err : {
                            msg : "Rooms empty"
                        }
                    }));
                }
            }
        });
    })
    .post(function (req, res) {
        var mUsername = req.body.username;
        var eventName = req.body.eventName;
        var rsvp_limit = req.body.rsvpSlot;
        var unix = req.body.unix;
        var duration = req.body.duration;
        var idLoc = req.body.idLoc;
        var desc = req.body.desc;

        var userID = getUserID(mUsername,function (obj) {
            if(obj.err){
                res.send(JSON.stringify({
                    status : false,
                    err : {
                        msg : obj.msg
                    }
                }));
            }
            else{
                if(obj.data != null){
                    sqlData =  {
                        name : eventName,
                        member : JSON.stringify([obj.data.id]),
                        rsvp_yes : 0,
                        rsvp_limit : rsvp_limit,
                        unix : unix,
                        length : duration,
                        idLocation : idLoc,
                        description : desc,
                        status : 'PENDING'
                    };
                    var query = mysqlConn.query('INSERT INTO gameroom SET ?',sqlData,function (err, sqlRes) {

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
                        console.log(err);
                    });

                }
                else{
                    res.send(JSON.stringify({
                        status : false,
                        err : {
                            msg : "User not found"
                        }
                    }));
                }
            }
        })

    });
router.route('/member')
    .get(function (req, res) {
        var roomid = req.query.id;
        getMember(roomid,function (obj) {
            if(obj.err){
                res.send(JSON.stringify({
                    status : false,
                    err : {
                        msg : obj.msg
                    }
                }));
            }
            else{
                if(obj.data != null){
                    var memberArr = JSON.parse(obj.data.member);
                    var emptyArr = [];
                    var counter = 0;
                    memberArr.forEach(function (item,index,arr){
                        getMemberInfo(item,function(memberObj){
                           emptyArr.push(memberObj.data);
                            counter++;
                            if(counter === arr.length) {
                                res.send(JSON.stringify({
                                    status : false,
                                    err: null,
                                    data : emptyArr
                                }));
                            }
                        });
                    });
                }
                else{
                    res.send(JSON.stringify({
                        status : false,
                        err : {
                            msg : "not found"
                        }
                    }));
                }

            }
        });
    });
function getMember(rid,callback){
    var query = mysqlConn.query("SELECT member FROM gameroom WHERE id = '"+rid+"'",function (err, sqlRes) {
        if(err){
            callback({
                err : true,
                msg : err.msg
            });
        }
        else{
            callback({
                err : false,
                data : sqlRes[0]
            });
        }
    });
}
function getMemberInfo(uid,callback){
    var query = mysqlConn.query("SELECT id,username,email FROM user WHERE id = '"+uid+"'",function (err, sqlRes) {
        if(err){
            callback({
                err : true,
                msg : err.msg
            });
        }
        else{
            callback({
                err : false,
                data : sqlRes[0]
            });
        }
    });
}
function getRoom(callback){
    var query = mysqlConn.query("SELECT * FROM gameroom",function (err, sqlRes) {
        if(err){
            callback({
                err : true,
                msg : err.msg
            });
        }
        else{
            callback({
                err : false,
                data : sqlRes
            });
        }
    });
}
function getUserID(username,callback){
    var query = mysqlConn.query("SELECT id FROM user WHERE username = '"+username+"'",function (err, sqlRes) {
        console.log(err);
        if(err){
            callback({
                err : true,
                msg : err.msg
            });
        }
        else{
            callback({
                err : false,
                data : sqlRes[0]
            });
        }
    });
}
function hash(str){
    var sha256 = createHash('sha256');
    var res = sha256.update(str, 'utf8').digest("hex");
    console.log(str+" : "+res);
    return res;
}
module.exports = router;
