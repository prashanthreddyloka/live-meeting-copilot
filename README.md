# PlantAutopsy

PlantAutopsy is a full-stack PWA that helps people diagnose plant issues from a photo, understand likely root causes, and follow a practical revival plan. It also includes an interactive plant explorer so users can ask about a random plant, learn its history, and see a representative image.

Live Website: https://plantautopsy.vercel.app/

## What PlantAutopsy Does

- Upload a plant photo for AI-powered diagnosis
- Get a severity rating, confidence score, survival chance, and recovery estimate
- Follow a structured revival plan with urgent steps, care schedule, and prevention tips
- Save diagnosis history locally on the device
- Explore plants interactively with AI-generated background, care notes, and a representative photo
- Install the app as a mobile-friendly PWA

## Local Development Setup

1. Install all dependencies:

   ```bash
   npm run install:all
   ```

2. Copy the backend environment file:

   ```bash
   cp server/.env.example server/.env
   ```

   On Windows PowerShell:

   ```powershell
   Copy-Item server/.env.example server/.env
   ```

3. Edit `server/.env` and add your `GEMINI_API_KEY`

4. Start both apps:

   ```bash
   npm run dev
   ```

5. Open the app:
   - Frontend: `http://localhost:3000`
   - Backend: `http://localhost:4000`

## Deploy Backend To Render

1. Push the repo to GitHub
2. Go to [render.com](https://render.com) and create a new Web Service
3. Connect your GitHub repo
4. Set the Root Directory to `server`
5. Use:
   - Build command: `npm install`
   - Start command: `node server.js`
6. Add environment variables:
   - `GEMINI_API_KEY`
   - `CLIENT_URL` with your Vercel frontend URL
7. Deploy the service
8. Copy the live Render URL after deploy

## Deploy Frontend To Vercel

1. Go to [vercel.com](https://vercel.com) and import the GitHub repo
2. Set the Root Directory to `client`
3. Select the framework preset for Create React App
4. Add the environment variable:
   - `REACT_APP_API_URL` = your Render backend URL
5. Deploy and copy the live Vercel URL
6. Go back to Render and set `CLIENT_URL` to your Vercel URL
7. Redeploy the backend if needed so CORS is aligned

## Play Store Submission

1. Go to [pwabuilder.com](https://www.pwabuilder.com)
2. Enter your live Vercel URL
3. Click `Build` and choose `Android`
4. Download the signed `.aab` package
5. Go to [play.google.com/console](https://play.google.com/console)
6. Pay the one-time $25 developer registration fee
7. Upload the `.aab`
8. Add screenshots, app description, and privacy policy
9. Submit for review
10. Review typically takes 3 to 7 days
