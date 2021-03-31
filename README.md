# Workbench

This project is meant to provide a tool to develop a TensorFlow.js (TF.js) implementation of object tracking models.

NOTE: Here we refer to models which determine if there are objects belonging to the classes of interest in a frame and output the position as **Object Detection** models (**OD**). When we talk about **Object Tracking** models (**OT**) we're referring to models which extend the previous definition by being able to also keep track of the identity of the instances of the classes over time (over a sequence of frames).

## TODO list
- [X] Implement bounding boxes support with a TF.js built-in OD model.
- [X] Create a statistic window
- [ ] Create a menu in which we can select a video from a list of suitable ones.
- [X] Implement YoloV3-tiny (or a previous version, depending on which works better on TF.js) and compare with built-in model
- [X] Webscrape images of network devices
- [X] Create a dataset by annotating the images
- [X] Train OD model for classes of interest
- [X] Track accuracy an  d speed metrics
- [X] Implement SORT OT algorithm

## Project setup
```
yarn install
```

## Run the project
```
yarn serve
```

## Load the model

To load the model expose both the detection model weights and the test video on localhost:8081.
Navigate the model folder TFJS/SSFfpn* and run

```
http-server -c1 --cors .
```

## Note

The two detection models have different outputs, when switching to the other you most modify object_detection.js in the sort folder. The scores and boxes variables in the infer() method must be set to the right element of the result array. The model is currently set for the 640x640 detection model.  