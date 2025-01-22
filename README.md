```markdown
# i_backend

THIS IS PROTECTED REPO OF BACKEND CODE OF I1 CODE.

## Project Setup

### Prerequisites

- Node.js (v14.x or later)
- npm (v6.x or later) or yarn (v1.x or later)
- Express
- MongoDB
- Redis

### Installation

1. Clone the repository:
    ```sh
    git clone https://github.com/yourusername/i_backend.git
    cd i_backend
    ```

2. Install dependencies:
    ```sh
    npm install
    # or
    yarn install
    ```

3. Create a `.env` file in the root directory and add the following environment variables:
    ```properties
    PORT=8080
    MONGODB_URI=your_mongodb_uri
    JWT_SECRET=your_jwt_secret
    REDIS_URI=your_redis_uri
    GEMINI_API_KEY=your_gemini_api_key
    PINECONE_API_KEY=your_pinecone_api_key
    PINECONE_ENVIRONMENT=your_pinecone_environment
    REMOTE_HOST=your_remote_host
    REMOTE_USER=your_remote_user
    SSH_PRIVATE_KEY=your_ssh_private_key
    AES_ENCRYPTION_KEY=your_aes_encryption_key
    GOOGLE_CLIENT_ID=your_google_client_id
    GOOGLE_CLIENT_SECRET=your_google_client_secret
    GOOGLE_REDIRECT_URI=your_google_redirect_uri
    ```

### Running the Project

1. Start the server:
    ```sh
    npm start
    # or
    yarn start
    ```

2. For development mode with hot-reloading:
    ```sh
    npm run dev
    # or
    yarn dev
    ```

### Running Tests

```sh
npm test
# or
yarn test
```

For detailed information on all available API endpoints, please refer to the [API Documentation](APITEST.md).

## How to Get API Keys

Here's a step-by-step guide on how to obtain each of the required API keys:

### 1. `GEMINI_API_KEY`

   - **Description:** This key is used to access the Google Gemini API, which allows you to use Google's AI models.
   - **How to get it:**
     1. Go to the [Google AI Studio](https://aistudio.google.com/).
     2. Sign in with your Google account.
     3. Create a new project, or select an existing one.
     4. In the left navigation bar, click on "Get API key".
     5. Generate a new API key and copy it.
   
### 2. `PINECONE_API_KEY` and `PINECONE_ENVIRONMENT`

   - **Description:** These keys are needed to interact with the Pinecone vector database service.
   - **How to get them:**
     1. Go to the [Pinecone website](https://www.pinecone.io/).
     2. Sign up for a new account or log in to your existing one.
     3. Navigate to the API Keys section in the console.
     4. You will find your API key and your environment listed there. Copy both.

### 3. `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `GOOGLE_REDIRECT_URI`

   - **Description:** These credentials are required for implementing Google OAuth 2.0 for user authentication.
   - **How to get them:**
     1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
     2. Create a new project, or select an existing one.
     3. Open the "APIs & Services" -> "Credentials" page.
     4. Click "Create Credentials" and choose "OAuth client ID".
     5. Select the application type. (For a backend, it is usually "Web application").
     6. Configure the "Authorized redirect URIs" to match your application's redirect URI (e.g., `http://localhost:8080/auth/google/callback` if you are testing locally).
     7. After creating the OAuth client ID, you will see the client ID and client secret. Copy these values along with the redirect URI.

### 4. `MONGODB_URI`
  - **Description:** This is the connection string required to connect to your MongoDB database.
  -  **How to get it:**
    1.  Go to [MongoDB Atlas](https://www.mongodb.com/atlas/database).
    2.  Sign up or log in to your account.
    3.  Create a new project and a cluster.
    4.  Navigate to the "Database" section.
    5.  Click on the "Connect" button.
    6.  Select "Connect your application".
    7.  Copy the connection string that is provided.

### 5. `REDIS_URI`
  - **Description:** This is the connection string required to connect to your Redis database.
  - **How to get it:**
     1. Depending on where you are hosting Redis, the URI will be different. If you use Redis Cloud or any cloud provider, you will find the connection string in the dashboard.
     2. Example with Redis Cloud:
         - Log in to your account
         - Navigate to "Databases" section.
         - Select the database and you will find the connection string.
     3. If you are running Redis locally, it will typically be: `redis://localhost:6379`

### 6. `JWT_SECRET`
  - **Description:** This secret key is used to sign and verify JSON Web Tokens, which are used for authentication.
  - **How to get it:**
      - You can generate this key using any method you like, it is recommended that the key is long and complex. You can generate a strong key by using a tool like openssl: `openssl rand -base64 32`.
      - Important: This should be a secure, randomly generated string and should be kept secret.

### 7. `REMOTE_HOST`, `REMOTE_USER`, and `SSH_PRIVATE_KEY`
   - **Description:** These are used to connect to a remote server using SSH.
   - **How to get them:**
     - `REMOTE_HOST`: This is the hostname or IP address of your remote server.
     - `REMOTE_USER`: This is the username you use to log into the remote server.
     - `SSH_PRIVATE_KEY`: This is the private key that corresponds to the public key that is installed on the remote server to enable passwordless authentication. You can generate a private/public key pair using `ssh-keygen` tool on Linux. The `SSH_PRIVATE_KEY` variable should contain the path to your private key file (e.g., /path/to/your/private_key).

### 8. `AES_ENCRYPTION_KEY`
  - **Description:** This key is used for encrypting and decrypting sensitive data with AES encryption algorithm.
  - **How to get it:**
      - Like the JWT secret, you can generate this using a tool like openssl: `openssl rand -base64 32` or using any method you like.
      - Important: This key should be kept secure and should be a random, long string.

**Important Notes:**

*   **Security:** Treat all API keys and secrets as highly sensitive information. Do not commit them directly to your repository.
*   **.env File:** The `.env` file should be added to your `.gitignore` file to prevent accidental commits of your environment variables.
*   **Environment Variables:** You can also set these environment variables directly in your shell or operating system environment if you prefer.

By following these steps, you should be able to obtain all the necessary API keys and environment variables to properly configure your `i_backend` project.
```