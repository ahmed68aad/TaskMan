const http = require("http");
const app = require("./app.js");
const connectDB = require("./config/db.js");

const port = process.env.PORT || 3000;

const startServer = async () => {
  try {
    await connectDB();
    const server = http.createServer(app);
    server.listen(port, () =>
      console.log(`Server running at http://localhost:${port}`),
    );
  } catch (err) {
    console.log("Error starting server:", err.message);
  }
};

startServer();
