import { serve } from "inngest/next";
import { inngest } from "../../../inngest/client";
import { syncDeveloperProfile } from "../../../inngest/functions";

// Expose the zero-dependency API endpoint that Inngest polls/relays payloads to 
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    syncDeveloperProfile,
  ],
  validation: {
    input: (input) => {
      if (!input || typeof input !== 'object') {
        throw new Error('Invalid input');
      }
      // Add additional validation logic as needed
    },
    error: (error) => {
      console.error(error);
      // Add additional error handling logic as needed
    },
  },
});
