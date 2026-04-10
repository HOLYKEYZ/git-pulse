import { Inngest } from "inngest";

// Initialize the Inngest client to push events to background workers 
export const inngest = new Inngest({ id: "gitpulse" });
