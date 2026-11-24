# Vercel Deployment

To deploy this project to Vercel, you'll need to configure your Vercel project to use the provided `vercel.json` and `build.sh` files.

1.  **Project Setup on Vercel:**
    - Create a new project on Vercel and connect it to your Git repository.

2.  **Build & Development Settings:**
    - **Framework Preset:** Other
    - **Build Command:** `./build.sh`
    - **Output Directory:** `.`
    - **Install Command:** `pip install -r requirements.txt`

3.  **Environment Variables:**
    You will need to set the same environment variables as in your `.env` file in the Vercel project settings.

4.  **Deploy:**
    After configuring the project, trigger a deployment. Vercel will use the `vercel.json` file to understand how to build and route your application, and it will execute the `build.sh` script to install dependencies and run database migrations.
