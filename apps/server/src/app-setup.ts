import Fastify, { type FastifyInstance, type FastifyReply } from "fastify";
import swagger from "@fastify/swagger";

export default async function buildServer(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: true,
    pluginTimeout: 30000,
  });

  //register swagger ui for proper documentation
  await app.register(swagger, {
    openapi: {
      openapi: "3.1.0",
      info: {
        title: "Fastify API",
        description: "API documentation for Fastify application",
        version: "1.0.0",
      },
      servers: [
        {
          url: "http://127.0.0.1:3000/api/v1",
          description: "Development server",
        },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
            description: "Enter JWT token",
          },
        },
      },
      security: [{ bearerAuth: [] }],
    },
  });

  //health check endpoint
  app.get("/api/v1/health", async (_req, reply: FastifyReply) => {
    const startTime = Date.now();
    try {
      // @ts-expect-error
      const dbState = app.mongoose.connection.readyState;
      const dbStatus = dbState === 1 ? "connected" : "disconnected";

      let dbResponseTime = 0;
      // @ts-expect-error
      if (dbState === 1 && app.mongoose.connection.db) {
        const pingStart = Date.now();
        // @ts-expect-error
        await app.mongoose.connection.db.admin().ping();
        dbResponseTime = Date.now() - pingStart;
      }

      return {
        status: "ok",
        database: { status: dbStatus, responseTime: `${dbResponseTime}ms` },
        timestamp: new Date().toISOString(),
        responseTime: `${Date.now() - startTime}ms`,
      };
      return {
        status: "error",
        database: {
          status: "error",
          error: error instanceof Error ? error.message : "Unknown error",
        },
        timestamp: new Date().toISOString(),
        responseTime: `${Date.now() - startTime}ms`,
      };
    } finally {
      console.error("Health check failed:", error);
    }
  });

  return app;
}
