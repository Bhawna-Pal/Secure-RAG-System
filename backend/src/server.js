import app from "./app.js";
import { ENV } from "./config/env.js";

const server = app.listen(ENV.PORT, () =>{
    console.log(`Backend server running on http://localhost:${ENV.PORT} [${ENV.NODE_ENV}]`);
});

process.on('unhandledRejection', (err) => {
    console.error('Unhandles Rejection:', err);
    server.close(() => process.exit(1));
    
});