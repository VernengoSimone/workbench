# Workbench

This project is meant to provide a tool to develop a TensorFlow.js implentation of object tracking models.

NOTE: Here we refer to models which determine if there are objects belonging to the classes of interest in a frame and output the position as *Object Detection models* (OD). When we talk about *Object Tracking models* (OT) we're referring to models which extend the previous definition by being able to also keep track of the identity of the instances of classes over time (through a sequence of frames).

## Project setup
```
yarn install
```

## Run the project
```
yarn serve
```

## TODO list
- [X] Implement bounding boxes support with a TF.js built-in OD model.
- [ ] Implement YoloV4-tiny and compare to built-in model
- [ ] Implement SORT OT algorithm
- [ ] Complete the menu inserting a list of suitable videos for test.
