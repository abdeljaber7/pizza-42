const express = require("express");
const morgan = require("morgan");
const helmet = require("helmet");
const jwt = require("express-jwt");
const jwksRsa = require("jwks-rsa");
const jwtAuthz = require('express-jwt-authz');
const { join } = require("path");
const authConfig = {
  "domain": "mousa-pizza42.us.auth0.com",
  "clientId": "5e9fZXswf0BFhqqGzcsAz4ke9zJ8iBHx",
  "audience": "https://mousa-pizza42.herokuapp.com"
};

//Check Scope for log fetching
const checkScopes = jwtAuthz([ 'read:logs' ]);

const app = express();

// Orders DB
let orders =[];
let orderTime =[];

app.use(morgan("dev"));
app.use(helmet());
app.use(express.static(join(__dirname, "public")));

const checkJwt = jwt({
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: `https://${authConfig.domain}/.well-known/jwks.json`
  }),

  audience: authConfig.audience,
  issuer: `https://${authConfig.domain}/`,
  algorithms: ["RS256"]
});

//New Order API
app.get(`/orders/new-order`, checkJwt, (req, res) => {
  const email = req.query.email;
  //log Orders
  orders.push(
    email
    );
  orderTime.push(
    new Date()
  );
  res.send({
    msg: `success`
  });
});

//Orders History API
app.get(`/orders/order-history`, checkJwt, checkScopes, function(req, res){
  if(checkScopes){
    const email = req.query.email;
    let history =[];
    for(let i=0; i<orders.length; i++){
      if(orders[i]==email){
        history.push(orderTime[i])
      }
    }
    res.send({
      msg: `${history}`
    });
  } else{
    res.send({
      msg: `You don't have the right scopes to get the history`
    });
  }
  
});

app.get("/auth_config", (req, res) => {
  res.send(authConfig);
});

app.get("/*", (req, res) => {
  res.sendFile(join(__dirname, "index.html"));
});

app.use(function(err, req, res, next) {
  if (err.name === "UnauthorizedError") {
    return res.status(401).send({ msg: "Invalid token" });
  }

  next(err, req, res);
});

process.on("SIGINT", function() {
  process.exit();
});

// Listen on port 3000
app.listen(process.env.PORT || 3000, () => console.log("Pizza 42 is up!\n Access application on https://mousa-pizza42.herokuapp.com:3000"));