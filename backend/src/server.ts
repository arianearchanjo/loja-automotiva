import { app } from "./app.js";

if (process.env.NODE_ENV !== "production") {
  app.listen(process.env.PORT ?? 3333, () => {
    console.log("[server] ouvindo em http://localhost:" + (process.env.PORT ?? 3333));
    console.log("[server] ambiente: " + (process.env.NODE_ENV ?? "development"));
  });
}

export default app;
