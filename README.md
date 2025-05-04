# SUITS - Smart Unified Intelligent Technology for Style

An AI-powered fashion recommendation system based on skin tone, body measurements, and occasion.

## Features

- Skin tone detection using SAM (Segment Anything Model)
- Body measurements analysis using SAIA Perfect Fit API
- Personalized clothing recommendations
- (Optional) AR "try on" feature

## Project Structure

```
fashion-recommendation-system/
├── backend/
│   ├── api/
│   │   └── routes/
│   │       └── segmentation_routes.py
│   ├── models/
│   │   └── face_landmarker.task  # You need to download this
│   ├── saved_faces/              # Directory for saved face images
│   ├── services/
│   │   └── ai/
│   │       └── segmentation_services.py
│   └── main.py
│
├── frontend/
    ├── components/
    │   ├── FaceMeshDisplay.tsx
    │   ├── SkinToneAnalysis.tsx
    │   └── WebcamCapture.tsx
    ├── pages/
    │   └── index.tsx
    ├── services/
    │   └── api.ts
    └── types/
        └── index.ts
│
└── .gitignore
└── LICENSE
└── README.md
```

## Setup

### Prerequisites
- Python 3.8+
- Node.js 14+
- MediaPipe
- OpenCV
- Numpy
- Pillow 
- Pandas
- Tensorflow
- FastAPI
- Uvicorn
- Next.js
- TypeScript
- Tailwind CSS

### Backend Setup

1. Create a virtual environment and activate it:
    ```bash
    cd backend
    python -m venv venv
    source venv/bin/activate  # On Windows: venv\Scripts\activate
    ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Run the backend server:
   ```bash
   python main.py
   ```

The server will start at http://localhost:8000.

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