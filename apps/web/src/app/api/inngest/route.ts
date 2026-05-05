import { serve } from "inngest/next";
import { inngest } from "../../../inngest/client";
import { syncDeveloperProfile } from "../../../inngest/functions";

// Expose the zero-dependency API endpoint that Inngest polls/relays payloads to 
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    syncDeveloperProfile,
  ],
});
