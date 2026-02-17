# Deployment Guide: Railway

Follow these steps to deploy your Aircraft Inventory Management System to Railway.

## Prerequisites
1.  A [Railway](https://railway.app/) account.
2.  Your code pushed to a GitHub repository.

## Deployment Steps
1.  **Log in to Railway**: Go to [railway.app](https://railway.app/) and sign in with GitHub.
2.  **New Project**: Click on **+ New Project** and select **Deploy from GitHub repo**.
3.  **Select Repository**: Choose the repository containing this project.
4.  In the Dashboard, select your project.
5.  **Provision PostgreSQL**: Right-click the canvas > Database > PostgreSQL.
6.  **Configuration**:
    - Railway automatically sets the `DATABASE_URL` variable for services in the same project.
    - If you need to manually connect, use the **Private Networking** URL (e.g., `postgresql://user:pass@postgres.railway.internal:5432/railway`).
    - Go to your App service > **Variables** and ensure `DATABASE_URL` is set.
7.  **Automatic Detection**: Railway will automatically detect the `package.json` and use the `build` and `start` scripts.
    -   **Build Command**: `npm run build`
    -   **Start Command**: `npm run start`
8.  **Environment Variables**: No specific environment variables are required for this frontend-only demo.
9.  **Deploy**: Click **Deploy Now**.
10. **Generate Domain**: Once deployed, go to the **Settings** tab of your service and click **Generate Domain** under the Networking section to get a public URL.

## Local Test before Deploy
Run these commands to ensure the production build works:
```bash
npm install
npm run build
npm run start
```
The app will be available at `http://localhost:3000` (default port for `serve`).
