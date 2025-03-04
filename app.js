const express = require("express");
require("express-async-errors");
const helmet = require("helmet");
const xss = require("xss-clean");
const rateLimiter = require("express-rate-limit");

const app = express();
const cookieParser = require("cookie-parser");

const csrf = require("host-csrf");

app.set("view engine", "ejs");

app.use(express.urlencoded({ extended: true }));

require("dotenv").config(); // to load the .env file into the process.env object

const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session);

let mongoURL = process.env.MONGO_URI;
if (process.env.NODE_ENV == "test") {
  mongoURL = process.env.MONGO_URI_TEST;
}

const store = new MongoDBStore({
  // may throw an error, which won't be caught
  uri: mongoURL,
  collection: "mySessions",
});
store.on("error", function (error) {
  console.log(error);
});

const sessionParms = {
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: true,
  store: store,
  cookie: { secure: false, sameSite: "strict" },
};

const csrfOptions = {
  protected_operations: ["POST"],
  protected_content_type: [
    "application/json",
    "application/x-www-form-urlencoded",
  ],
  development_mode: true,
};

if (app.get("env") === "production") {
  sessionParms.cookie.secure = true; // serve secure cookies
  csrfOptions.development_mode = false;
  app.set("trust proxy", 1); // trust first proxy
}
app.use(
  rateLimiter({
    windowMs: 15 * 60 * 1000, //15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
  })
);
app.use(helmet());
app.use(xss());

app.use(session(sessionParms));

const passport = require("passport");
const passportInit = require("./passport/passportInit");

passportInit();

app.use(passport.initialize());
app.use(passport.session());

// flash messages
app.use(require("connect-flash")());

app.use(require("./middleware/storeLocals"));

app.use(cookieParser(process.env.SESSION_SECRET));

const csrfMiddleware = csrf(csrfOptions);

app.use(csrfMiddleware);

app.use((req, res, next) => {
  if (req.path == "/multiply") {
    res.set("Content-Type", "application/json");
  } else {
    res.set("Content-Type", "text/html");
  }
  next();
});

app.get("/", (req, res) => {
  csrf.token(req, res);
  res.render("index");
});

app.use("/sessions", require("./routes/sessionRoutes"));

const jobsRouter = require("./routes/jobs");

// secret word handling
//let secretWord = "syzygy";

const secretWordRouter = require("./routes/secretWord");

const auth = require("./middleware/auth");

app.use("/jobs", auth, jobsRouter);
app.use("/secretWord", auth, secretWordRouter);

app.get("/multiply", (req, res) => {
  const result = req.query.first * req.query.second;
  if (result.isNaN) {
    result = "NaN";
  } else if (result == null) {
    result = "null";
  }
  res.json({ result: result });
});

app.use((req, res) => {
  res.status(404).send(`That page (${req.url}) was not found.`);
});

app.use((err, req, res, next) => {
  res.status(500).send(err.message);
  console.log(err);
});

const port = process.env.PORT || 3000;

const start = async () => {
  try {
    await require("./db/connect")(mongoURL);
    return app.listen(port, () =>
      console.log(`Server is listening on port ${port}...`)
    );
  } catch (error) {
    console.log(error);
  }
};

start();

module.exports = { app };
