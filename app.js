"use strict"

var express = require("express");
var bodyParser = require("body-parser");
var sessions = require("express-session");

const magicToken = "concertina";
const idleTimeoutSeconds = 300;
var app = express();
var session;

app.use(express.static(__dirname+"/public/"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.use(sessions({
  secret: "secret",
  resave: true,
  saveUninitialized: false,
  cookie: {
    maxAge: idleTimeoutSeconds * 1000
  },
  rolling: true
}));

var reservationID = function(){
  return "R" + Math.random().toString().substr(2,8);
}

var token = function(){
  var rand = function(){
    return Math.random().toString(36).substr(2);
  }
  return rand() + rand();
}

var admin = {username: "admin",
             password: "admin",
             token: token()};

var people = {"doctorwhocomposer": {
                      username: "doctorwhocomposer",
                      forename: "Delia",
                      surname: "Derbyshire",
                      phone: "07412345678",
                      email: "delia@gmail.com",
                      password: "12345678",
                      reservation: ["T12345678"],
                      token: token()}};

var reservation = {"T12345678": {
                      id: "T12345678",
                      date: "28/01/2019",
                      time: "13:45",
                      size: "5",
                      name: "Delia Derbyshire",
                      phone: "07412345678"}};


//get all reservations
//only admin user can access it
app.get("/reservation",function(req,resp){
  if(req.query.access_token != admin.token && req.query.access_token != magicToken){
    resp.status(403).json({error: "Incorrect or missing access token."});
  } else{
    session = req.session;
    resp.status(200).json(reservation);
  }
});

//add reservations
app.post("/reservation",function(req,resp){
  if(req.body.access_token != req.session.uniqueID && req.body.access_token != magicToken){
    resp.status(403).json({error: "Incorrect or missiong access token."});
  } else{
    session = req.session;
    var user = findUserByToken(req.session.uniqueID);
    const id = reservationID();
    user.reservation.push(id);
    reservation[id] = {id: id,
                       date: req.body.date,
                       time: req.body.time,
                       size: req.body.size,
                       name: user.forename + " " + user.surname,
                       phone: user.phone};
    resp.status(200).end();
  }
});

app.get("/reservation/:username",function(req,resp){
  if(req.query.access_token != req.session.uniqueID && req.query.access_token != magicToken){
    resp.status(403).json({error: "Incorrect or missiong access token."});
  } else{
    session = req.session;
    var thisUser;
    const user = req.params.username;
    const keys = Object.keys(people);
    for(var i in keys){
      if(keys[i] == user){
        thisUser = keys[i];
        break;
      }
    }
    if(thisUser != null){
      var thisReservation = [];
      var temp = people[thisUser].reservation;
      for(var i in temp){
        thisReservation.push(reservation[temp[i]]);
      }
      resp.status(200).json(thisReservation);
    } else{
      resp.status(400).json("This people does not exist.")
    }
  }
});

app.delete("/reservation",function(req,resp){
  if(req.body.access_token != req.session.uniqueID && req.body.access_token != magicToken){
    resp.status(403).json({error: "Incorrect or missing access token."});
    return;
  }
  session = req.session;
  const arr = req.body.ids.split(",");
  const user = findUserByToken(req.session.uniqueID);
  for(var i in arr){
    delete reservation[arr[i]];
    user.reservation.splice(user.reservation.indexOf(arr[i]),1);
  }
  resp.status(200).end();
});

app.get("/people",function(req,resp){
  session = req.session;
  const keys = Object.keys(people);
  var result = [];
  for(var i in keys){
    result.push(people[keys[i]]);
  }
  resp.status(200).json(result);
});

app.get("/people/:username",function(req,resp){
  const user = req.params.username;
  const keys = Object.keys(people);
  var thisUser;
  for(var i in keys){
    if(keys[i] == user){
      thisUser = keys[i]
      break;
    }
  }
  if(thisUser != null){
    session = req.session;
    resp.status(200).json(people[thisUser]);
  } else{
    resp.status(400).json({error: "This people does not exist."})
  }
});

app.post("/people",function(req,resp){
  if(req.body.access_token != magicToken){
    resp.status(403).json({error: "Incorrect or missing access token."});
    return;
  }
  const username = req.body.username.trim();
  if(usernameChecker(username)){
    session = req.session;
    const newToken = token();
    people[username] = {username: username,
                        forename: req.body.forename.trim(),
                        surname: req.body.surname.trim(),
                        phone: req.body.phone,
                        email: req.body.email,
                        password: req.body.password,
                        reservation: [],
                        token: newToken};
    session = req.session;
    session.uniqueID = newToken;
    resp.status(200).send(username + "," + newToken);
  } else{
    resp.status(400).json({error: "This username is already taken."});
  }
});

app.put("/people/change-password",function(req,resp){
  if(req.body.access_token != req.session.uniqueID && req.body.access_token != magicToken){
    resp.status(403).json({error: "Incorrect or missing access token."});
    return;
  }
  var user = findUserByToken(req.session.uniqueID);
  if(user.password != req.body.old_password){
    resp.status(400).json({error: "Invalid old password."});
  } else if(user.password == req.body.new_password){
    resp.status(400).json({error: "New password cannot be the same as the old one."});
  } else{
    session = req.session;
    user.password = req.body.new_password;
    resp.status(200).end();
  }
});

app.put("/people/change-detail",function(req,resp){
  if(req.body.access_token != req.session.uniqueID && req.body.access_token != magicToken){
    resp.status(403).json({error: "Incorrect or missing access token."});
    return;
  }
  session = req.session;
  var user = findUserByToken(req.session.uniqueID);
  user.forename = req.body.forename;
  user.surname = req.body.surname;
  user.phone = req.body.phone;
  user.email = req.body.email;
  resp.status(200).end();
});

app.get("/login",function(req,resp){
  session = req.session;
  if(session.uniqueID){
    if(session.uniqueID == admin.token){
      resp.status(200).send("admin," + session.uniqueID);
    } else{
      resp.status(200).send(findUserByToken(session.uniqueID).username + "," + session.uniqueID);
    }
  } else{
    resp.status(200).json(false);
  }
});

app.post("/login",function(req,resp){
  const username = req.body.username;
  if(username == admin.username){
    resp.redirect(307,"/admin");
  } else{
    if(usernameChecker(username)){
      resp.status(400).json({error: "This user does not exist."});
    } else{
      if(people[username].password != req.body.password && req.body.access_token != magicToken && people[username].token != req.body.access_token){
        resp.status(400).json({error: "Username and password do not match."});
      } else{
        session = req.session;
        session.uniqueID = people[username].token;
        resp.status(200).send(username + "," + session.uniqueID);
      }
    }
  }
});

app.post("/admin",function(req,resp){
  if(req.body.password != admin.password && req.body.access_token != magicToken && req.body.access_token != admin.token){
    resp.status(400).json({error: "Username and password do not match."});
  } else{
    session = req.session;
    session.uniqueID = admin.token;
    resp.status(200).send(admin.username + "," + admin.token);
  }
});

app.get("/logout",function(req,resp){
  req.session.destroy();
  resp.end();
});

function usernameChecker(name){
  if(name == "admin"){
    return false;
  }
  const keys = Object.keys(people);
  for(var i in keys){
    if(keys[i] == name){
      return false;
    }
  }
  return true;
}

function findUserByToken(token){
  const keys = Object.keys(people);
  for(var i in keys){
    if(people[keys[i]].token == token){
      return people[keys[i]];
    }
  }
  return null;
}

module.exports = app;
