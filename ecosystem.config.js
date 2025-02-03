module.exports = {
    apps: [
        {
            name: "i0",  
            script: "server.js",  
            instances: "max",  
            autorestart: true,  
            watch: false,  
            max_memory_restart: '1G',  
            stop_exit_codes: [0],
            env: {
                NODE_ENV: "development",
            },
            env_production: {
                NODE_ENV: "production",
            }
        },
        {
            name: "bull_worker",
            script: "bullServer.js",
            instances: 1, // Typically, Bull workers should run as a single instance to avoid duplicate job processing
            autorestart: true,
            watch: false,
            max_memory_restart: '1G',
            stop_exit_codes: [0],
            env: {
                NODE_ENV: "development",
            },
            env_production: {
                NODE_ENV: "production",
            }
        }
    ]
};
