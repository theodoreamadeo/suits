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