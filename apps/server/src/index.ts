import buildServer from "./app-setup";

async function main() {
  const app = await buildServer();
  const PORT = process.env || 3000;

  try {
    // await app.register(connectDB);
    await app.listen({
      port: Number(PORT),
      host: "0.0.0.0",
    });
  } catch (err: any) {
    console.error("Failed to start server", err.message);
    process.exit(1);
  }
}

main();
