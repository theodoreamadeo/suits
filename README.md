# SUITS - Smart Unified Intelligent Technology for Style

An AI-powered fashion recommendation system based on skin tone, gender, and occasion.

## Features

- Skin tone detection using Skin Tone Classifier (stone)
- Personalized clothing recommendations
- Integrated with Arduino Mega to guide the LED lamp.

## Project Structure

```
fashion-recommendation-system/
├── backend/
│   ├── alembic/
│   │   └── versions/
│   │   └── env.py
│   │   └── README
│   │   └── script.py.mako
│   ├── api/
│   │   └── routes/
│   │   └── auth.py
│   │   └── led_control.py
│   ├── models/
│   │   └── face_landmarker.task
│   │   └── auth.py
│   │   └── database.py
│   │   └── google_auth.py
│   ├── services/
│   │   └── ai/
│   │       └── segmentation_services.py
│   │       └── measurement.py
│   │       └── skin_tone_analyzer.py
│   └── alembic.ini
│   └── main.py
│   └── package-lock.json
│   └── package.json
│   └── requirements.txt
│
├── final_arduino_code
|   ├── final_arduino_code.ino
|
├── frontend/
|   ├── app/
│   │   └── _assets/
│   │   └── body-measurement/
│   │   └── components/
│   │   └── confirm/
│   │   └── context/
│   │   └── history/
│   │   └── preference-form/
│   │   └── recommendation-system/
│   │   └── services/
│   │   └── types/
│   │   └── favicon.ico
│   │   └── global.css
│   │   └── layout.tsx
│   │   └── page.tsx
|   ├── public/
|   ├── .env.local
|   ├── .gitignore
|   ├── next-env.d.ts
|   ├── next.config.ts
|   ├── package-lock.json
|   ├── package.json
|   ├── postcss.config.mjs
|   ├── tsconfig.json
|
├── .gitignore
├── LICENSE
├── package-lock.json
├── package.json
├── README.md
```

## Setup
### Backend Setup

1. Install dependencies:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

2. Run the backend server:
   ```bash
   uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
   ```

The server will start at http://localhost:8000.

3. Setup the database

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file with your API URL:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## License

This project is licensed under the MIT License - see the LICENSE file for details.