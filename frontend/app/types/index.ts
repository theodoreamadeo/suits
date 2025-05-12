export interface Point {
    x: number;
    y: number;
}

export interface FaceLandmark {
    landmark: Point[];
}

export interface ProcessedFrame {
    meshVisualization: string;
    segmentedFace: string;
    hasFace: boolean;
    fps:number;
}

export interface BodyFrame {
    hasPose: boolean;
    visualizationImage?: string;
    measurements ?: {
        shoulderWidth: number;
        torsoLength: number;
        legLength: number;
        totalHeight: number;
        scaleFactor: number;
    };
    calibrationStatus ?: {
        samples: number;
        required: number;
        isCalibrated: boolean;
    };
    calibrationData ?: {
        userHeight: number;
        shoulderWidth: number;
        cameraDistance: number;
    }
}

export interface MeasurementResultExport {
    timestamp: string;
    userInfo: {
        providedHeight: number;
        providedShoulderWidth: number;
    };
    measurements: {
        shoulderWidth: number;
        torsoLength: number;
        legLength: number;
        totalHeight: number;
        scaleFactor: number;
    };
}