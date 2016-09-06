var config = require('../config.json');
var express = require('express');
var createHash = require('sha.js');
var router = express.Router();
var mysql      = require('mysql');
var mysqlConn = mysql.createConnection({
    host     : config.MYSQL_SERVER_HOST,
    user     : 'partyideas_backend_api',
    password : 'api',
    database : 'partyideas',
    multipleStatements: true
});

var req,res;
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
        var game = req.body.game;

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
                        game:game,
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
router.route('/member/:id')
    .get(function (req, res) {
        var roomid = req.params.id;
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
                                    status : true,
                                    err: null,
                                    data : emptyArr,
                                    size : emptyArr.length
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
router.route('/join/:roomID')
    .post(function (req, res) {
        var roomId = req.params.roomID;
        var username = req.body.username;
        var token = req.body.token;
        authUser(username,token,function(callbackObj){
            if(!callbackObj.err){
                var userID = callbackObj.userData.id;
                getMember(roomId,function(memberObj){
                    if(memberObj.data == null){
                        res.send(JSON.stringify({
                            status : false,
                            err : {
                                msg : "room not found"
                            }
                        }));
                    }
                    else {
                        var memberArr = JSON.parse(memberObj.data.member);
                        if (memberArr.indexOf(userID) == -1) {
                            memberArr.push(callbackObj.userData.id);
                            getUserJoinedEvents(userID, function (joinedEvents) {
                                var eventArr = joinedEvents.data;
                                if (eventArr != null) {
                                    eventArr.push(roomId);
                                    var query = mysqlConn.query(
                                        "UPDATE gameroom SET member = '" + JSON.stringify(memberArr) + "' WHERE id = '" + roomId + "';" +
                                        "UPDATE gameroom SET rsvp_yes = rsvp_yes + 1 WHERE id = '"+roomId+"';"+
                                        "UPDATE user SET joinedRoom = '" + JSON.stringify(eventArr) + "' WHERE id = '" + userID + "';"
                                        , function (err, sqlRes) {
                                            if (err) {
                                                res.send(JSON.stringify({
                                                    status: false,
                                                    err: {
                                                        msg: err.msg
                                                    }
                                                }));
                                            }
                                            else {
                                                if (sqlRes[0].changedRows != 0) {
                                                    res.send(JSON.stringify({
                                                        status: true,
                                                        err: null
                                                    }));
                                                }
                                                else {
                                                    res.send(JSON.stringify({
                                                        status: false,
                                                        err: {
                                                            msg: "Fail to join event id: " + roomId
                                                        }
                                                    }));
                                                }
                                            }
                                        });
                                }
                            });
                        }
                        else {
                            res.send(JSON.stringify({
                                status: false,
                                err: {
                                    msg: "You already joined"
                                }
                            }));
                        }
                    }
                });
            }
            else{
                res.send(JSON.stringify({
                    status : false,
                    err : {
                        msg : callbackObj.msg
                    }
                }));
            }
        });
});
function authUser(username,token,callback){
    var accNotFound = {
        err : true,
        msg : 'account not found or password mismatch'
    };
    var query = mysqlConn.query("SELECT * FROM user WHERE username = '"+username+"'",function (err, sqlRes) {
        if(err){
            callback({
                err : true,
                msg : err.msg
            });
        }
        else{
            if(sqlRes.length!=0){
                var userObj = sqlRes[0];
                if(userObj.accType == 'general'){
                    if(userObj.password == token){
                        callback({
                            err:false,
                            userData: userObj
                        });
                    }
                    else
                        callback(accNotFound);
                }
                else if(userObj.accType == "google"){
                    if(userObj.gid == token){
                        callback({
                            err:false,
                            userData: userObj
                        });
                    }
                    else
                        callback(accNotFound);
                }
            }
            else{
                callback(accNotFound);
            }

        }
    });
}
function getUserJoinedEvents(uid,callback){
    var query = mysqlConn.query("SELECT joinedRoom FROM user WHERE id = '"+uid+"'",function (err, sqlRes) {
        if(err){
            callback({
                err : true,
                msg : err.msg
            });
        }
        else{
            callback({
                err : false,
                data : JSON.parse(sqlRes[0].joinedRoom == "" ? "[]" : sqlRes[0].joinedRoom)
            });
        }
    });
}
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
    return res;
}
module.exports = router;
