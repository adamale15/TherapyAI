import { createServer, type IncomingMessage, type ServerResponse } from "http";
import { parse } from "url";
import next from "next";

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME || "localhost";
const port = Number(process.env.PORT || 3000);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app
  .prepare()
  .then(() => {
    console.log("Next.js app prepared");
    const server = createServer(
      async (req: IncomingMessage, res: ServerResponse) => {
        try {
          const parsedUrl = parse(req.url!, true);
          await handle(req, res, parsedUrl);
        } catch (err: unknown) {
          console.error("Error occurred handling", req.url, err);
          res.statusCode = 500;
          res.end("internal server error");
        }
      }
    );

    server
      .once("error", (err: Error) => {
        console.error(err);
        process.exit(1);
      })
      .listen(port, () => {
        console.log(`> Ready on http://${hostname}:${port}`);
        console.log(`> Using Server-Sent Events (SSE) for real-time updates`);
      });
  })
  .catch((err: Error) => {
    console.error("Failed to start server:", err);
    process.exit(1);
  });
