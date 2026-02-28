import rateLimit from "express-rate-limit";
import express from "express";
import LCELRouter from "./routes/search_lcel.js";
import cors from "cors";

const limiter = rateLimit({
  limit: 10,
  windowMs: 10 * 60 * 1000, // 10 mins
  message: "Too many requests from this IP, please try again in an hour",
  handler: (req, res) => {
    res.status(429).json({
      status: "fail",
      message: "Too many requests from this IP, please try again later.",
      retryAfter: new Date(Date.now() + 60 * 60 * 1000).toLocaleString(
        "en-IN",
        {
          timeZone: "IST",
        },
      ),
    });
  },
});

// 🛜 Initializing the Server
const app = express();
// app.enable("trust proxy");
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGIN || "http://localhost:3000",
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
    credentials: false,
  }),
);

app.use("/api", limiter);

app.use("/status", (_, res) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toLocaleString("en-IN", {
      timeZone: "IST",
    }),
  });
});

app.use(
  express.json({
    limit: "10kb",
  }),
);

app.use("/api/v1/search", LCELRouter);

// Handling the unhandled routes
app.all("*", (req, res, next) => {
  next(new Error(`URL ${req.originalUrl} does not exist on this server !!!`));
});

if (process.env.NODE_ENV !== "production") {
  const port = process.env.PORT || 8000;
  const server = app.listen(port, () => {
    console.log(`App running on port ${port}`);
  });
  process.on("unhandledRejection", (err: Error) => {
    console.log(err.name, err.message);
    server.close(() => {
      process.exit(1);
    });
  });
  /*  
    |----------------------------------------------------------------------|
    |   SIGTERM is a signal that is sent to request the process terminates |
    |   that were rejected whose rejections have not yet been handled.     |  
    |   In other words, it is used for graceful shutdown of server.        |
    |----------------------------------------------------------------------|
*/
  process.on("SIGTERM", () => {
    // SIGTERM - signal fired when Heroku dynos restart
    console.log("SIGTERM RECEIVED! Shutting Down gracefully!");
    server.close(() => {
      console.log("Process Terminated");
    });
  });
}

export default app;
