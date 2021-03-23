const express = require("express");
const app = express();
const jwt = require("express-jwt");
const jwtAuthz = require("express-jwt-authz");
const jwksRsa = require("jwks-rsa");
const { join } = require("path");
const authConfig = {
  "domain": "mousa-pizza42.us.auth0.com",
  "clientId": "5e9fZXswf0BFhqqGzcsAz4ke9zJ8iBHx",
  "audience": "https://mousa-pizza42.herokuapp.com"
};

//Check Scope for log fetching
const checkScopes = jwtAuthz(['read:logs']);

// Orders DB
let orders =[];
let orderTime =[];

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


//Auth configuration Endpoint - Public Endpoint, doesn't need authentication
app.get("/auth_config", (req, res) => {
  res.send(authConfig);
});

//New Order Endopoint - Private Endpoint, needs authentication
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

//Orders History Endpoint - Scoped Endpoint, needs authentication + scope 
app.get(`/orders/order-history`, checkJwt, checkScopes, (req, res) =>{
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