import * as kalman from "kalman"
import * as sylvester from "sylvester"
import * as munkres from "munkres-js"

// convert [x, y, width, height] to [xc, yc, s, r]
export function bbox_to_y(bbox) {
    const xc = bbox[0] + bbox[2]/2
    const yc = bbox[1] + bbox[3]/2
    const s = bbox[2] * bbox[3]
    const r = bbox[2] / bbox[3]

    const y = sylvester.Vector.create([xc, yc, s, r])

    return y
}

// convert [xc, yc, s, r] to [x, y, width, height]
export function tracker_to_bbox(tracker) {
    // to access a Sylvester Vector element we use the function e(i)
    // it returns the element a i-th position with i starting from 1 
    const width = Math.sqrt(tracker.e(3) * tracker.e(4))
    const x = tracker.e(1) - width/2
    const height = x.e(3) / width
    const y = tracker.e(2) - height/2

    const bbox = {x, y, width, height}

    return bbox
}

export function hungarian(costMat) {
    return munkres(costMat)
}

// computes pairwise IoU between bboxes in the form {x, y, width, height}
// trackers are saved in an array, elements of tracked are produced by SortTracker.getstate() (Kalman) in the format {x, y, width, height}
// detections are produced by the OD model as an array of objects of the form {x, y, width, height, score, class}
export function computeIou(detections, tracked) {
    /// convert to array of arrays of form [[x1, y1, x2, y2], [...], ...]
    // corner format yields more concise and intuitive formulas for IoU
    detections = detections.map(element => bbox_to_corner(element))
    tracked = tracked.map(element => bbox_to_corner(element))

    // flatten list of detections
    const det_flat = {x1: [], y1: [], x2: [], y2: []};
    var det_area = [];
    [det_flat.x1, det_flat.y1, det_flat.x2, det_flat.y2, det_area] = flatten(detections);

    const trk_flat = {x1: [], y1: [], x2: [], y2: []};
    var trk_area = [];
    [trk_flat.x1, trk_flat.y1, trk_flat.x2, trk_flat.y2, trk_area] = flatten(tracked);

    // find the pairwise maximum between all coordinates of the top left corner of the detections and the trackers
    // e.g. compare x_1d w/ x_1t and take the maximum, x_1d w/ x_2t and so on for all x_id
    // x_id -> x coordinate of i-th detection
    // x_it -> x coordinate of i-th tracker 
    const xx1 = pairWise(det_flat.x1, trk_flat.x1, Math.max)
    const yy1 = pairWise(det_flat.y1, trk_flat.y1, Math.max)

    // find pairwise minimum between all coordinates of the top left corner...
    const xx2 = pairWise(det_flat.x2, trk_flat.x2, Math.min)
    const yy2 = pairWise(det_flat.y2, trk_flat.y2, Math.min)

    // compute the area of the intersection rectangle
    // if w<0 or h<0 there is no overlap
    const w = xx2.subtract(xx1).map(x => Math.max(x, 0))
    const h = yy2.subtract(yy1).map(x => Math.max(x, 0))

    const intersection = mat_multiply(w, h)

    det_area = sylvester.Matrix.create(det_area)
    trk_area = sylvester.Matrix.create(trk_area)
        
    // compute the union
    const sum_area = pairWise(det_area.elements, trk_area.elements, (x, y) => Number(x) + Number(y))
    const union = sum_area.subtract(intersection)
    
    const iou = mat_divide(intersection, union)

    return iou
}

// expect mat as sylver.Matrix, output same format
// and mat1.dimensions = mat2.dimensions
export function mat_multiply(mat1, mat2) {
    const i_max = mat1.dimensions().rows
    const j_max = mat1.dimensions().cols

    const out = sylvester.Matrix.Zero(i_max, j_max)
    for (var i = 0; i < i_max; i++){
        for (var j = 0; j < j_max; j++){
            out.elements[i][j] = mat1.elements[i][j] * mat2.elements[i][j]
        }
    }

    return out
}

export function mat_divide(mat1, mat2) {
    const i_max = mat1.dimensions().rows
    const j_max = mat1.dimensions().cols

    const out = sylvester.Matrix.Zero(i_max, j_max)
    for (var i = 0; i < i_max; i++){
        for (var j = 0; j < j_max; j++){
            out.elements[i][j] = mat1.elements[i][j] / mat2.elements[i][j]
        }
    }

    return out
}

export function mat_sum(mat1, mat2) {
    const i_max = mat1.dimensions().rows
    const j_max = mat1.dimensions().cols

    const out = sylvester.Matrix.Zero(i_max, j_max)
    for (var i = 0; i < i_max; i++){
        for (var j = 0; j < j_max; j++){
            out.elements[i][j] = mat1.elements[i][j] + mat2.elements[i][j]
        }
    }

    return out
}

// compute pairwise comparison between to 1d array of lengths arr1.length and arr2.length
// output arr1.len x arr2.len sylvester.Matrix
export function pairWise(arr1, arr2, operator) {
    const i_max = arr1.length
    const j_max = arr2.length

    const out = sylvester.Matrix.Zero(i_max, j_max)
    for (var i = 0; i < i_max; i++) {
        for (var j = 0; j < j_max; j++) {
                out.elements[i][j] = operator(arr1[i], arr2[j])    
        }
    }

    return out
}

// convert from object {x, y, width, height} to array [x1, y1, x2, y2]
// (x1, y1) top left corner
// (x2, y2) bottom right corner
export function bbox_to_corner(bbox) {
    const x1 = bbox.x
    const y1 = bbox.y
    const x2 = bbox.x + bbox.width
    const y2 = bbox.y + bbox.height
    const area = bbox.width * bbox.height
    
    return [x1, y1, x2, y2, area]
}


export function flatten(list) {
    const x1Flat = []
    const y1Flat = []
    const x2Flat = []
    const y2Flat = []
    const area = []

    for (var i = 0; i < list.length; i++) {
        x1Flat.push(list[i][0])
        y1Flat.push(list[i][1])
        x2Flat.push(list[i][2])
        y2Flat.push(list[i][3])
        area.push(list[i][4])
    }

    return [x1Flat, y1Flat, x2Flat, y2Flat, area]

}

export class SortTracker {
    constructor(measure) {
        // The state of each target is described by
        // x = [u, v, s, r, u', v', s']
        // u and v represent the horizontal and vertical positions
        // of the center of the target
        // s is the scale (area) of the object
        // r the ratio of the target bounding box
        // a single quote ' after variable names indicates
        // the derivative
        
        // These values will be used only for initialization

        const x0 = bbox_to_y(measure).elements.concat([0, 0, 0])
        const x = sylvester.Vector.create(x0)

        // P0 - (P in SORT) State Covariance matrix
        // we assign high uncertainty to unobservable initial velocities
        const P = sylvester.Matrix.Diagonal([10, 10, 10, 10, 10000, 10000, 10000])

        // create Kalman Filter object, this will be updated every step
        this.kf = new kalman.KF(x, P)

        // These values will be passed to kalman every update

        // A (F in SORT) - State Transition matrix
        // This matrix is used to define the prediction model.
        // We adopt a constant velocity model with time-step 1.
        this.A = sylvester.Matrix.create([
            // position along the axis
            // x = x_0 + v * dt
            [1,0,0,0,1,0,0],
            [0,1,0,0,0,1,0],
            [0,0,1,0,0,0,1],
            // ratio of the box
            // we assume tha ratio remains constant
            [0,0,0,1,0,0,0],
            // velocities
            // v = v_0     
            [0,0,0,0,1,0,0],
            [0,0,0,0,0,1,0],
            [0,0,0,0,0,0,1]
        ]);
        
        // B - input design matrix
        // convert input to state's vector space.
        this.B = sylvester.Matrix.I(7)

        // u - linear input variable. No input, u is zero.
        this.u = sylvester.Vector.Zero(7)
        
        // H - Observation matrix
        // This matrix's purpose is to linearly map the measure vector
        // to the state vector's space. In this case we map a 7-dimensional
        // vector (the state of the system) into a 4-dimensional one (the coordinates of the bounding boxes).
        // Check x0 for further informations about the state's space.
        // We do not measure the derivatives therefore the last 3 columns's entires
        // are all 0s
        this.H = sylvester.Matrix.create([
            [1,0,0,0,0,0,0],
            [0,1,0,0,0,0,0],
            [0,0,1,0,0,0,0],
            [0,0,0,1,0,0,0]
        ])  
        
        // R - Detection Noise Coviarance
        // self.R = eye(dim_z)
        this.R = sylvester.Matrix.Diagonal([1, 1, 10, 10])

        // Q - Process noise covariance matrix
        this.Q = sylvester.Matrix.Diagonal([1, 1, 1, 1, 0.01, 0.01, 0.0001])

        // C - measurement design matrix (identity matrix)
        // used to apply an optional linear transformation to the measurements
        this.C = sylvester.Matrix.I(4)

        // we keep track of how much time passed after last detection
        this.timeSinceUpdate = 0
        this.id = SortTracker.count
        SortTracker.count += 1
        this.history = [this.kf.x.elements]
        this.hits = 0
        this.hitStreak = 0
        this.age = 0
    }

    static count = 0

    update(detection) {
        this.timeSinceUpdate = 0
        this.hits += 1
        this.hitStreak += 1
        this.kf.update({
            A: this.A,
            B: this.B,
            u: this.u,
            H: this.H,
            R: this.R,
            Q: this.Q,
            C: this.C,
            y: bbox_to_y(detection)
        })
        this.history.push(this.kf.x.elements)
    }

    getState() {
        return tracker_to_bbox(this.kf.x)
    }
}

export class Sort {
    constructor(maxAge = 1, minHits = 3, iouTreshold = 0.3) {
        this.maxAge = maxAge
        this.minHits = minHits
        this.iouTreshold = iouTreshold
        this.trackers = []
        this.frameCount = 0
    }
}