# Deployment Guide: Railway

Follow these steps to deploy your Aircraft Inventory Management System to Railway.

## Prerequisites
1.  A [Railway](https://railway.app/) account.
2.  Your code pushed to a GitHub repository.

## Deployment Steps
1.  **Log in to Railway**: Go to [railway.app](https://railway.app/) and sign in with GitHub.
2.  **New Project**: Click on **+ New Project** and select **Deploy from GitHub repo**.
3.  **Select Repository**: Choose the repository containing this project.
4.  **Automatic Detection**: Railway will automatically detect the `package.json` and use the `build` and `start` scripts.
    -   **Build Command**: `npm run build`
    -   **Start Command**: `npm run start`
5.  **Environment Variables**: No specific environment variables are required for this frontend-only demo.
6.  **Deploy**: Click **Deploy Now**.
7.  **Generate Domain**: Once deployed, go to the **Settings** tab of your service and click **Generate Domain** under the Networking section to get a public URL.

## Local Test before Deploy
Run these commands to ensure the production build works:
```bash
npm install
npm run build
npm run start
```
The app will be available at `http://localhost:3000` (default port for `serve`).
