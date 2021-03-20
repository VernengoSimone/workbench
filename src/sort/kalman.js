import * as math from "mathjs"

export class KF {
    constructor({x0, P0, F, C, H, Qk, R}) {
        this.x = x0
        this.P = P0
        this.F = F
        this.C = C
        this.H = H
        this.Q = Qk
        this.R = R
    }

    predict() {
        // Predict State
        // x_k = F * X_{k-1}
        var xhat = math.multiply(this.F, this.x)

        // Predicted process Covariance Matrix
        // P_k = F * P_{k-1} * F^t + Q_k
        var Phat = this.F.multiply(this.P) multiply( this.F.transpose() ). add(this.Q)
        var Phat = math.add(
            math.multiply(math.multiply(this.F, this.P), math.transpose(this.F)), this.Q
            )


        this.x = xhat
        this.P = Phat
    }
  
    update(measure){
        const yk = measure

        // Kalman Gain, weight for measurement and model
        // K = P_k * H^t * (H * p_k * H^t + R)^-1
        var K = math.multiply(this.P, math.transpose(this.H))
        var T = math.add(math.multiply(this.H, K), this.R)

        K = math.multiply(K, math.inv(T))

        // Update state
        // X_k = x_k + K(y_k - H * x_k)
        const x = math.add(this.x, math.multiply(K, math.subtract(yk, math.multiply(this.H, this.x))));

        // Update process Covariance Matrix
        // P_k = (I - K * H) * p_k   = OR =   p_k - K * H * p_k 
        const P = math.subtract(this.P, math.multiply(math.multiply(K, this.H), this.P));

        // Set Current state
        this.x = x;
        this.P = P;
    }

    getState() {
      return this.x
    }

    setState(state) {
        this.x = state
    }
}
  