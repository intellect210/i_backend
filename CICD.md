# Deploying a Node.js Application on AWS EC2 with CI/CD, Nginx, and HTTPS

This guide provides a comprehensive walkthrough for deploying a Node.js application on an AWS EC2 instance. It covers project setup, EC2 instance creation, CI/CD pipeline implementation using GitHub Actions, reverse proxy configuration with Nginx, and securing the application with HTTPS using Certbot.

## Phase 1: Local Development - Node.js Project Setup and GitHub Upload

### Step 1: Create a Node.js Project

1. **Initialize Project:**

    *   First, let's create a new directory for your project. You can name it anything you like. For example:

        ```bash
        mkdir my-nodejs-app
        ```

    *   Navigate into your newly created directory:

        ```bash
        cd my-nodejs-app
        ```

    *   Now, let's initialize a Node.js project. This will create a `package.json` file, which is essential for managing your project's dependencies and scripts. Run:

        ```bash
        npm init -y
        ```

        The `-y` flag automatically accepts the default settings.
2. **Install Express:**

    *   We'll use Express.js, a popular web framework for Node.js. Install it using:

        ```bash
        npm install express
        ```
3. **Create a Basic Express Server:**

    *   Create a file named `app.js` (or `index.js` if you prefer) in the root of your project.
    *   Paste the following code into the file. This code sets up a simple server that responds with "Hello World!" when you visit it in your browser:

    ```javascript
    const express = require('express');
    const app = express();
    const port = 3000; // You can change this port if needed

    app.get('/', (req, res) => {
      res.send('Hello World!');
    });

    app.listen(port, () => {
      console.log(`Example app listening at http://localhost:${port}`);
    });
    ```
4. **Test the Server:**

    *   Let's make sure everything is working. Run your server with:

        ```bash
        node app.js
        ```

    *   Open your web browser and go to `http://localhost:3000`. You should see the "Hello World!" message. If you do, you're all set!

### Step 2: Upload Project to GitHub

1. **Initialize Git Repository:**

    *   We'll use Git for version control and GitHub to host our code. First, initialize a Git repository in your project directory:

        ```bash
        git init
        ```

    *   Add all your project files to the staging area:

        ```bash
        git add .
        ```

    *   Commit your changes with a message describing what you did:

        ```bash
        git commit -m "First commit"
        ```
2. **Create a GitHub Repository:**

    *   Go to [github.com](https://github.com) and log in or create a new account if you don't have one.
    *   Click the "+" icon in the top right corner and select "New repository".
    *   Give your repository a name (e.g., `my-nodejs-app`).
    *   Choose whether you want it to be public or private.
    *   Click "Create repository".
3. **Connect Local Repository to GitHub:**

    *   After creating the repository, GitHub will provide instructions on how to connect your local project to it. Look for the section titled "...or push an existing repository from the command line".
    *   Copy the commands provided. They will look similar to this (make sure to copy yours from the GitHub page, as the URL will be unique to your repository):

        ```bash
        git remote add origin <REMOTE_REPOSITORY_URL> 
        git branch -M main
        git push -u origin main
        ```

        *   `git remote add origin <REMOTE_REPOSITORY_URL>`: This connects your local repository to the remote GitHub repository.
        *   `git branch -M main`: This command renames the default branch to `main`.
        *   `git push -u origin main`: This pushes your local code to the `main` branch on GitHub and sets up tracking.

    *   Paste these commands into your terminal and run them. If prompted, enter your GitHub username and password or use a personal access token.
    *   Now, refresh your GitHub repository page. You should see your project files there!

## Phase 2: Cloud Deployment - EC2 Instance and CI/CD Setup

### Step 3: Create an EC2 Instance on AWS

1. **Log in to AWS Console:**

    *   Go to [aws.amazon.com](https://aws.amazon.com) and sign in to your AWS Management Console.

2. **Navigate to EC2:**

    *   In the AWS Console's search bar at the top, type "EC2" and select the "EC2" service.

3. **Launch Instance:**

    *   In the EC2 dashboard, you'll see a "Launch instances" button. Click it to start creating your virtual server.

4. **Choose AMI (Amazon Machine Image):**

    *   An AMI is like a template for your server.
    *   Select an appropriate Amazon Machine Image (AMI). For Node.js, **Amazon Linux 2** or **Ubuntu Server** are popular and reliable choices. You can find them in the "Quick Start" tab or search for them.

5. **Choose Instance Type:**

    *   The instance type determines the hardware resources (CPU, memory, etc.) of your server.
    *   For testing or small applications, the `t2.micro` instance type is a good starting point, and it's eligible for the AWS free tier.

6. **Configure Instance Details:**

    *   In most cases, the default settings on this page are fine for a basic setup. You can explore these options later as you become more familiar with AWS.

7. **Add Storage:**

    *   Here, you can choose how much storage space your server will have.
    *   The default storage size (usually 8GB) is often sufficient for a small Node.js application.

8. **Configure Security Group:**

    *   A security group acts as a virtual firewall for your instance, controlling inbound and outbound traffic.
    *   Click on "Create a new security group".
    *   Give your security group a descriptive name and description.
    *   Add the following inbound rules by clicking "Add Rule":
        *   **SSH:**
            *   Type: SSH
            *   Protocol: TCP
            *   Port Range: 22
            *   Source: My IP (this will automatically fill in your current IP address for secure access). For testing, you could use `0.0.0.0/0`, but be aware that this allows SSH access from anywhere, which is less secure.
        *   **HTTP:**
            *   Type: HTTP
            *   Protocol: TCP
            *   Port Range: 80
            *   Source: `0.0.0.0/0` (this allows access from anywhere on the internet).
        *   **HTTPS:**
            *   Type: HTTPS
            *   Protocol: TCP
            *   Port Range: 443
            *   Source: `0.0.0.0/0` (this allows access from anywhere on the internet).
        *   **Custom TCP Rule (for Node.js app):**
            *   Type: Custom TCP Rule
            *   Protocol: TCP
            *   Port Range: 3000 (or the port your Node.js app will use)
            *   Source: `0.0.0.0/0`

9. **Review and Launch:**

    *   Click the "Review and Launch" button.
    *   Review your instance's configuration details on the next page.

10. **Create/Choose Key Pair:**

    *   A key pair is used to securely connect to your EC2 instance.
    *   In the pop-up window, choose "Create a new key pair" from the dropdown.
    *   Give your key pair a name (e.g., `my-ec2-key`).
    *   Click "Download Key Pair".
    *   **Important:** Your browser will download a `.pem` file (e.g., `my-ec2-key.pem`). Save this file in a secure location on your computer. You'll need it to connect to your instance via SSH, and you won't be able to download it again.

11. **Launch Instance:**

    *   Click the "Launch Instances" button.
    *   AWS will now start creating your EC2 instance. You'll be taken to a "Launch Status" page.
    *   Click the "View Instances" button to go to the EC2 dashboard and see your instance's status.

### Step 4: Connect to Your EC2 Instance and Find its IP Address

1. **Find Your Instance:**

    *   In the EC2 dashboard, go to "Instances" on the left-hand menu.
    *   You should see your newly launched instance in the list.

2. **Get Public IP Address:**

    *   Select your instance by clicking the checkbox next to it.
    *   In the instance details panel below, look for the "Public IPv4 address" or "Public IPv4 DNS". This is the address you'll use to access your instance from the internet.

3. **Connect via SSH:**

    *   Open your terminal (or command prompt on Windows).
    *   Use the following command to connect to your instance, making the necessary replacements:

        ```bash
        ssh -i /path/to/your-key.pem ec2-user@<your-ec2-public-ip>
        ```

        *   `/path/to/your-key.pem`: Replace this with the actual path to where you saved the `.pem` file you downloaded earlier (e.g., `~/Downloads/my-ec2-key.pem`).
        *   `ec2-user`: This is the default username for Amazon Linux 2 AMIs. If you chose a different AMI (like Ubuntu), the username might be different (e.g., `ubuntu`). Check the AMI documentation if you're not sure.
        *   `<your-ec2-public-ip>`: Replace this with the public IP address or public DNS of your EC2 instance that you found in the previous step.

    *   You might be asked if you want to continue connecting (yes/no). Type `yes` and press Enter.

    *   If successful, you'll be connected to your EC2 instance, and you'll see the command prompt change to reflect that (e.g., `[ec2-user@your-ec2-ip ~]$`).

### Step 5: Set Up the Server Environment

1. **Update Package List:**
    *   Once you're connected to your EC2 instance via SSH, the first thing to do is update the package list:

        ```bash
        sudo yum update -y
        ```
        or, if `yum` is not available (e.g., on Ubuntu systems):

        ```bash
        sudo apt update -y
        ```
        The command `sudo` gives you administrator privileges, `yum update` or `apt update` refreshes the list of available packages, and `-y` automatically answers "yes" to any prompts.

2. **Install Node.js and NPM:**
    *   Install Node.js and npm (Node Package Manager) using the following command:

        ```bash
        sudo yum install -y nodejs
        ```

        or on Ubuntu:

        ```bash
        sudo apt install -y nodejs
        ```

3. **Install PM2 (Process Manager):**
    *   PM2 is a process manager that will keep your Node.js application running in the background and automatically restart it if it crashes. Install it globally using npm:

        ```bash
        sudo npm install -g pm2
        ```

4. **Install Git:**
    *   You'll need Git to clone your project from GitHub:

        ```bash
        sudo yum install -y git
        ```

        or on Ubuntu:

        ```bash
        sudo apt install -y git
        ```

5. **Configure Git:**

    *   Set your Git username and email address. This information is associated with your commits:

        ```bash
        git config --global user.name "Your Name"
        git config --global user.email "your.email@example.com"
        ```

        Replace `"Your Name"` and `"your.email@example.com"` with your actual name and email address.

6. **Create a Directory for Your Project:**

    *   Let's create a directory to store your project files. We'll use `/var/www` as a standard location:

        ```bash
        sudo mkdir -p /var/www
        sudo chown -R ec2-user:ec2-user /var/www
        ```

        *   `sudo mkdir -p /var/www`: This creates the `/var/www` directory. The `-p` option allows creating parent directories if they don't exist.
        *   `sudo chown -R ec2-user:ec2-user /var/www`: This changes the ownership of the `/var/www` directory to the `ec2-user` (or the appropriate user for your AMI). The `-R` option makes the ownership change recursive, applying it to all subdirectories and files.

7. **Clone Your GitHub Repository:**

    *   Navigate to the directory you just created:

        ```bash
        cd /var/www
        ```

    *   Clone your project from GitHub using the HTTPS URL of your repository:

        ```bash
        git clone <your-github-repo-url> your-project-directory
        ```

        *   Replace `<your-github-repo-url>` with the actual HTTPS URL of your GitHub repository (e.g., `https://github.com/your-username/my-nodejs-app.git`).
        *   Replace `your-project-directory` with the name you want to give to the directory where your project files will be stored on the EC2 instance (e.g., `my-nodejs-app`).

    *   `cd` into your project directory:

        ```bash
        cd your-project-directory
        ```

### Step 6: Set Up GitHub Actions for CI/CD

1. **Create a Self-Hosted Runner:**

    *   Go to your GitHub repository and click on **Settings** (the gear icon).
    *   In the left sidebar, click on **Actions**, then **Runners**.
    *   Click on the **New self-hosted runner** button.
    *   Choose **Linux** for the operating system.
    *   GitHub will display a set of instructions with commands to download, configure, and run the self-hosted runner on your EC2 instance. The commands will look similar to these (make sure to copy the commands directly from your GitHub page, as they will contain unique tokens for your repository):

    ```bash
    # Create a folder for the runner (you can choose a different location if you prefer)
    mkdir actions-runner && cd actions-runner

    # Download the latest runner package (replace the URL and version with the ones provided by GitHub)
    curl -o actions-runner-linux-x64-2.320.0.tar.gz -L https://github.com/actions/runner/releases/download/v2.320.0/actions-runner-linux-x64-2.320.0.tar.gz

    # Extract the runner
    tar xzf ./actions-runner-linux-x64-2.320.0.tar.gz

    # Configure the runner (replace the URL and token with the ones provided by GitHub)
    ./config.sh --url https://github.com/your-username/your-repo-name --token YOUR_REGISTRATION_TOKEN

    # Install as a service
    sudo ./svc.sh install

    # Start the runner service
    sudo ./svc.sh start
    ```

    *   Run these commands one by one on your EC2 instance.
    *   The runner will connect to your GitHub repository and listen for jobs.

2. **Create the Workflow File:**

    *   On your local machine, in your project's root directory, create a new folder named `.github`, and inside it, another folder named `workflows`.
    *   Inside the `workflows` directory, create a file named `deploy.yml` (you can choose a different name, but `.yml` is the extension for workflow files).
    *   Paste the following YAML code into `deploy.yml`. This code defines your CI/CD workflow:

    ```yaml
    name: Node.js CI/CD

    on:
      push:
        branches: [ "main" ]

    jobs:
      build:
        runs-on: self-hosted

        steps:
        - uses: actions/checkout@v4
        - name: Use Node.js 20.x
          uses: actions/setup-node@v3
          with:
            node-version: '20.x'
            cache: 'npm'
        - run: npm ci
        - run: |
            touch .env
            echo "${{ secrets.PROD_ENV }}" > .env
        - run: npm run build --if-present # Run build script if you have one
        - run: pm2 restart node-app
    ```

    *   Let's break down the YAML:
        *   `name`: The name of your workflow.
        *   `on`: Specifies the events that trigger the workflow. Here, it's triggered on pushes to the `main` branch.
        *   `jobs`: Defines the jobs that will run as part of the workflow.
        *   `build`: The name of the job (you can have multiple jobs).
        *   `runs-on: self-hosted`: Specifies that this job should run on your self-hosted runner.
        *   `steps`: A sequence of steps that will be executed in the job.
            *   `actions/checkout@v4`: Checks out your code from the repository.
            *   `actions/setup-node@v3`: Sets up a Node.js environment with the specified version.
            *   `npm ci`: Installs project dependencies using `npm ci` (clean install, faster and more reliable for CI).
            *   `touch .env`: this creates the .env file.
            *   `echo "${{ secrets.PROD_ENV }}" > .env`: this adds the github secret into the .env file.
            *   `npm run build --if-present`: Runs your build script (if you have one defined in `package.json`).
            *   `pm2 restart node-app`: Restarts your application using PM2.

3. **Set Up GitHub Secrets:**

    *   Go back to your GitHub repository's **Settings > Secrets and variables > Actions**.
    *   Click on **New repository secret**.
    *   Create the following secrets one by one:
        *   **`PROD_ENV`:**
            *   Name: `PROD_ENV`
            *   Secret: Paste the contents of your `.env` file here. For example:

                ```
                DATABASE_URL=your_database_url
                API_KEY=your_api_key
                PORT=3000
                ```

        *   **`REMOTE_HOST`:**
            *   Name: `REMOTE_HOST`
            *   Secret: Your EC2 instance's public IP address.
        *   **`REMOTE_USER`:**
            *   Name: `REMOTE_USER`
            *   Secret: The username you use to connect to your EC2 instance via SSH (e.g., `ec2-user` or `ubuntu`).
        *   **`SSH_PRIVATE_KEY`:**
            *   Name: `SSH_PRIVATE_KEY`
            *   Secret: Copy the *entire* contents of your `.pem` private key file and paste them here.

### Step 7: Create the .env File (Locally)

1. **Create the File:**

    *   In your local project's root directory, create a file named `.env`.

2. **Add Environment Variables:**

    *   Add your environment variables to this file. These variables will be used by your Node.js application. For example:

        ```
        DATABASE_URL=your_database_url_here
        API_KEY=your_secret_api_key
        PORT=3000
        ```

    *   **Important Security Note:** In a real production environment, it's strongly recommended **not** to hardcode sensitive credentials (like database URLs or API keys) directly in your `.env` file, especially if you're committing it to a public repository. Instead, consider using more secure methods like:
        *   **AWS Secrets Manager:** A service specifically designed for storing and managing secrets.
        *   **AWS Systems Manager Parameter Store:** Another service for storing configuration data and secrets.
        *   **Environment Variables on the Server:** Set environment variables directly on your EC2 instance, outside of your code repository.

    *   For this basic example, we're using `.env` for simplicity, but be aware of the security implications.

### Step 8: Set Up PM2 and Automation

1. **Create `ecosystem.config.js`:**

    *   On your EC2 instance, navigate to your project's root directory (e.g., `/var/www/your-project-directory`).
    *   Create a file named `ecosystem.config.js`.
    *   Paste the following configuration into the file:

    ```javascript
    module.exports = {
      apps : [{
        name: "node-app", // The name of your application
        script: "app.js", // The entry point of your application (or index.js)
        instances: "max", // Run as many instances as you have CPU cores
        autorestart: true, // Automatically restart the app if it crashes
        watch: false, // Disable watching for file changes (for production)
        max_memory_restart: '1G', // Restart the app if it reaches 1GB memory usage
        env: {
          NODE_ENV: "development", // Environment variables for development
        },
        env_production: {
          NODE_ENV: "production", // Environment variables for production
        }
      }]
    };
    ```

    *   **Explanation of the fields:**
        *   `name`: A name for your application (you can choose any name).
        *   `script`: The path to the main file of your Node.js application.
        *   `instances`: The number of instances of your application that PM2 will run. `"max"` means it will run as many instances as you have CPU cores, which is good for performance.
        *   `autorestart`: If `true`, PM2 will automatically restart your application if it crashes.
        *   `watch`: If `true`, PM2 will automatically restart your application whenever you make changes to the files. For production, it's generally better to set this to `false` and manually restart after deployments.
        *   `max_memory_restart`: Sets a memory threshold. If your application uses more than this amount of memory, PM2 will restart it.
        *   `env`: An object where you can define environment variables that will be available to your application.
        *   `env_production`: Environment variables specifically for the production environment.

2. **Start Your App with PM2:**

    *   Make sure you are in your project's root directory on the EC2 instance:

        ```bash
        cd /var/www/your-project-directory
        ```

    *   Start your application using PM2:

        ```bash
        pm2 start ecosystem.config.js
        ```

3. **Enable PM2 Startup:**

    *   To make sure that PM2 starts automatically when your EC2 instance reboots, run:

        ```bash
        pm2 startup
        ```

    *   PM2 will provide you with a command to run (it might look like `sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u ec2-user --hp /home/ec2-user`). Copy and run this command to set up the PM2 startup script.

4. **Save the PM2 Process List:**

    *   Save the current state of PM2 so that it can restore your application after a reboot:

        ```bash
        pm2 save
        ```

## Phase 3: Setting up Nginx as a Reverse Proxy

### Step 9: Install and Configure Nginx

1. **Install Nginx:**

    *   On your EC2 instance, install Nginx using the appropriate package manager:

        ```bash
        sudo yum install nginx -y
        ```

        or on Ubuntu:

        ```bash
        sudo apt install nginx -y
        ```

2. **Configure Nginx:**

    *   Open the default Nginx configuration file using `nano`:

        ```bash
        sudo nano /etc/nginx/sites-available/default
        ```

    *   Replace the entire content of the file with the following configuration, making adjustments where necessary:

        ```nginx
        server {
            listen 80;
            server_name your_ec2_public_ip_or_domain; # Replace with your EC2 instance's public IP or domain name (if you have one)

            location / {
                proxy_pass http://localhost:3000; # Replace 3000 with your app's port if different
                proxy_set_header Host $host;
                proxy_set_header X-Real-IP $remote_addr;
                proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
                proxy_set_header X-Forwarded-Proto $scheme;
            }
        }
        ```

    *   **Explanation of Directives:**
        *   `listen 80;`: Tells Nginx to listen on port 80 (the default HTTP port).
        *   `server_name`: Specifies the domain name or IP address that this server block should handle. Replace `your_ec2_public_ip_or_domain` with your EC2 instance's public IP address for now. Later, if you have a domain name, you'll replace it with your domain name.
        *   `location / { ... }`: This block defines how Nginx should handle requests for the root path (`/`).
            *   `proxy_pass http://localhost:3000;`: This is the most important directive. It tells Nginx to forward requests to your Node.js application, which is assumed to be running on `localhost` (the same server) and listening on port 3000. If your app uses a different port, change `3000` accordingly.
            *   `proxy_set_header Host $host;`: This sets the `Host` header in the forwarded request to the value of the `$host` variable (which contains the hostname from the original request). This is important for your Node.js application to know the original hostname.
            *   `proxy_set_header X-Real-IP $remote_addr;`: This sets the `X-Real-IP` header to the client's IP address. This allows your Node.js app to know the real IP address of the client, even though the request is being proxied through Nginx.
            *   `proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;`: This adds the client's IP address to the `X-Forwarded-For` header. This header can be used to track the chain of proxies that a request has passed through.
            *   `proxy_set_header X-Forwarded-Proto $scheme;`: This sets the `X-Forwarded-Proto` header to the original request's scheme (e.g., `http` or `https`). This is useful for your Node.js app to know whether the original request was made over HTTP or HTTPS.

    *   Save the changes (Ctrl+O, then Enter) and exit `nano` (Ctrl+X).

3. **Test Nginx Configuration:**

    *   It's always a good idea to test your Nginx configuration before restarting it:

        ```bash
        sudo nginx -t
        ```

    *   If the test is successful, you'll see output like this:

        ```
        nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
        nginx: configuration file /etc/nginx/nginx.conf test is successful
        ```

    *   If there are any errors, carefully review your configuration file and make sure you've followed the steps correctly.

4. **Restart Nginx:**

    *   Apply the changes by restarting Nginx:

        ```bash
        sudo systemctl restart nginx
        ```

## Phase 4: Setting up HTTPS with Certbot

### Step 10: Install and Configure Certbot

1. **Install Snapd:**

    *   `snapd` is a package manager that allows you to install Certbot. Check if it's already installed:

        ```bash
        snap --version
        ```

    *   If it's not installed, follow the instructions for your specific Linux distribution on the Snapcraft website: [https://snapcraft.io/docs/installing-snapd](https://snapcraft.io/docs/installing-snapd)
    *   Example for Ubuntu:

        ```bash
        sudo apt update
        sudo apt install snapd
        ```

2. **Install Certbot:**

    *   Use `snap` to install Certbot:

        ```bash
        sudo snap install core; sudo snap refresh core
        sudo apt remove certbot # If you have any previously installed certbot packages
        sudo snap install --classic certbot
        ```

3. **Prepare Certbot Command:**

    *   Create a symbolic link to make it easier to run Certbot:

        ```bash
        sudo ln -s /snap/bin/certbot /usr/bin/certbot
        ```

4. **Obtain and Install Certificate:**

    *   Run the following command to obtain a certificate for your domain and automatically configure Nginx to use it:

        ```bash
        sudo certbot --nginx -d your_domain.com -d www.your_domain.com
        ```
        If you don't have a domain yet use:
        ```bash
         sudo certbot --nginx -d your_ec2_public_ip
        ```

        *   Replace `your_domain.com` and `www.your_domain.com` with your actual domain name. If you don't have a domain name yet, you can skip the `-d` options for now, but you'll need a domain to get a valid SSL certificate.
        *   Certbot will ask you to provide an email address and agree to the terms of service.
        *   It will then communicate with Let's Encrypt (a certificate authority) to verify that you own the domain and obtain a certificate.
        *   Certbot will automatically modify your Nginx configuration to use the new certificate and redirect HTTP traffic to HTTPS.

5. **Verify Configuration of Nginx:**

    *   Open the default Nginx configuration file using `nano`:
        ```bash
        sudo nano /etc/nginx/sites-available/default
        ```
    *   Add your domain name to this line:
        ```
        ...
        server_name example.com www.example.com;
        ...
        ```
    *   Save the changes (Ctrl+O, then Enter) and exit `nano` (Ctrl+X).

6. **Test Nginx Configuration and reload:**
    ```bash
    sudo nginx -t
    sudo systemctl reload nginx
    ```

### Step 11: Test Automatic Renewal

*   Certbot automatically creates a scheduled task to renew your certificate before it expires. You can test the renewal process with a dry run:

    ```bash
    sudo certbot renew --dry-run
    ```

    This command simulates the renewal process without actually renewing the certificate.

### Verify Certbot Auto-Renewal
```bash
sudo systemctl status snap.certbot.renew.service
```

## Final Steps:

1. **Commit and Push Changes (to trigger CI/CD):**

    *   On your local machine, commit any changes you've made to your project (like adding the `deploy.yml`, `.env`, and `ecosystem.config.js` files):

        ```bash
        git add .
        git commit -m "Set up CI/CD with GitHub Actions and PM2"
        git push origin main
        ```

2. **Verify Deployment:**

    *   Go to your GitHub repository and click on the "Actions" tab.
    *   You should see your workflow running. Click on it to see the details of each step.
    *   If the workflow is successful, your updated code will be deployed to your EC2 instance.
    *   Open your web browser and visit your EC2 instance's public IP address or domain name (e.g., `http://your_ec2_public_ip` or `https://your_domain.com` if you set up HTTPS).
    *   You should see your Node.js application running!

## Congratulations!

You have successfully deployed your Node.js application to an AWS EC2 instance, automated the deployment process with a CI/CD pipeline using GitHub Actions, configured Nginx as a reverse proxy, and secured your application with HTTPS using Certbot.

## Important Considerations:

*   **Security:** This guide provides a basic setup. For production environments, it's crucial to follow security best practices:
    *   Use strong passwords and SSH keys.
    *   Regularly update your server's software.
    *   Carefully manage your AWS credentials and IAM roles.
    *   Consider using a firewall (like `ufw` on Ubuntu) to restrict access to your instance further.
    *   Use a dedicated service like AWS Secrets Manager or Parameter Store to manage sensitive information (database credentials, API keys, etc.) instead of hardcoding them in your `.env` file or code.
*   **Scalability:** As your application grows, you might need to consider scaling your infrastructure. AWS offers various services for this, such as:
    *   **Auto Scaling:** Automatically adjust the number of EC2 instances based on traffic.
    *   **Load Balancing:** Distribute traffic across multiple instances.
    *   **Amazon RDS:** A managed database service that makes it easier to set up and manage databases.
*   **Monitoring:** It's important to monitor your application and server to identify performance issues or errors. You can use tools like:
    *   **PM2 Monitoring:** PM2 provides built-in monitoring capabilities.
    *   **Amazon CloudWatch:** A comprehensive monitoring service from AWS.

This detailed guide should help you get started with deploying Node.js applications on AWS. Remember that this is just a starting point, and there's always more to learn as you build and deploy more complex applications. Good luck!
