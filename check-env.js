// Script to check if environment variables are loaded correctly
console.log("Checking environment variables...");
console.log("VITE_GROQ_API_KEY present:", !!process.env.VITE_GROQ_API_KEY ? "Yes" : "No");

// List all environment variables
console.log("\nAll environment variables:");
Object.keys(process.env).forEach(key => {
  if (key.startsWith("VITE_")) {
    console.log(`${key}: ${process.env[key] ? "Present" : "Missing"}`);
  }
});

console.log("\nDone checking environment variables."); 