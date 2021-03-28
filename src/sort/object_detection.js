import * as tfconv from '@tensorflow/tfjs-converter';
import * as tf from '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-webgl';
import '@tensorflow/tfjs-backend-cpu';

import {CLASSES} from './classes';

export async function load(config = {
  modelUrl: ""
}) {
  if (tf == null) {
    throw new Error(
        `Cannot find TensorFlow.js. If you are using a <script> tag, please ` +
        `also include @tensorflow/tfjs on the page before using this model.`);
  }
  const modelUrl = config.modelUrl;

  const objectDetection = new ObjectDetection(modelUrl);
  await objectDetection.load();
  return objectDetection;
}

export class ObjectDetection {
  constructor(modelUrl) {
    this.modelPath = modelUrl;
  }

   async load() {
    this.model = await tfconv.loadGraphModel(this.modelPath);


    const zeroTensor = tf.zeros([1, 300, 300, 3], 'int32');
    // Warmup the model.
    const result = await this.model.executeAsync(zeroTensor);
    await Promise.all(result.map(t => t.data()));
    result.map(t => t.dispose());
    zeroTensor.dispose();
  }

  /**
   * Infers through the model.
   *
   * @param img The image to classify. Can be a tensor or a DOM element image,
   * video, or canvas.
   * @param maxNumBoxes The maximum number of bounding boxes of detected
   * objects. There can be multiple objects of the same class, but at different
   * locations. Defaults to 20.
   * @param minScore The minimum score of the returned bounding boxes
   * of detected objects. Value between 0 and 1. Defaults to 0.5.
   */
  async infer(img, maxNumBoxes) {
    const batched = tf.tidy(() => {
      if (!(img instanceof tf.Tensor)) {
        img = tf.browser.fromPixels(img);
      }
      // Reshape to a single-element batch so we can pass it to executeAsync.
      return tf.expandDims(img);
    });
    const height = batched.shape[1];
    const width = batched.shape[2];

    const result = await this.model.executeAsync(batched)

    const scores = result[5].dataSync();
    const boxes = result[4].dataSync();
    
    // clean the webgl tensors
    batched.dispose();
    tf.dispose(result);
    
    const [maxScores, classes] = this.calculateMaxScores(scores, result[5].shape[1], result[5].shape[2]);
    
    const indexTensor = tf.range(0, maxNumBoxes, 1)
    const indexes = indexTensor.dataSync()
    
    return this.buildDetectedObjects(
        width, height, boxes, maxScores, indexes, classes);
  }

  buildDetectedObjects(width, height, boxes, scores, indexes, classes) {
    const count = indexes.length;
    const objects = [];
    for (let i = 0; i < count; i++) {
      // TODO: fix hasty implementation
      if (scores[indexes[i]] >= 0.25) {
        const bbox = [];
        for (let j = 0; j < 4; j++) {
          bbox[j] = boxes[indexes[i] * 4 + j];
        }
        const minY = bbox[0] * height;
        const minX = bbox[1] * width;
        const maxY = bbox[2] * height;
        const maxX = bbox[3] * width;
        bbox[0] = minX;
        bbox[1] = minY;
        bbox[2] = maxX - minX;
        bbox[3] = maxY - minY;
        objects.push({
          bbox: bbox,
          class: CLASSES[classes[indexes[i]]].displayName,
          score: scores[indexes[i]]
        });
      }
    }
    return objects;
  }

  // Computes for each box the detection with highest score
  calculateMaxScores(scores, numBoxes, numClasses){
    const maxes = [];
    const classes = [];
    for (let i = 0; i < numBoxes; i++) {
      let max = Number.MIN_VALUE;
      let index = -1;
      for (let j = 0; j < numClasses; j++) {
        if (scores[i * numClasses + j] > max) {
          max = scores[i * numClasses + j];
          index = j;
        }
      }
      maxes[i] = max;
      classes[i] = index;
    }
    return [maxes, classes];
  }

  /**
   * Detect objects for an image returning a list of bounding boxes with
   * assocated class and score.
   *
   * @param img The image to detect objects from. Can be a tensor or a DOM
   *     element image, video, or canvas.
   * @param maxNumBoxes The maximum number of bounding boxes of detected
   * objects. There can be multiple objects of the same class, but at different
   * locations. Defaults to 20.
   * @param minScore The minimum score of the returned bounding boxes
   * of detected objects. Value between 0 and 1. Defaults to 0.5.
   */
  async detect(img, maxNumBoxes = 20) {
    return this.infer(img, maxNumBoxes);
  }

  /**
   * Dispose the tensors allocated by the model. You should call this when you
   * are done with the model.
   */
  dispose() {
    if (this.model != null) {
      this.model.dispose();
    }
  }
}