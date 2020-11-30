# Workbench

This project is meant to provide a tool to develop TensorFlow.js implentation of object tracking models.

NOTE: Here we refer to models which determine if there is are objects belonging to the classes of interest in a frame (or a sequence of frames) and output the position as *Object Detection models*. When we talk about *Object Tracking models* we're referring to models which extend the previous definition by being able to also keep track of the identity of the instances of classes over time.

## Project setup
```
yarn install
```

## Run the project
```
yarn serve
```

## TODO list
- [X] Working object tracking bounding boxes with a TF.js built-in model.
- [ ] Implement YoloV4-tiny and compare to built-in model
- [ ] Implement SORT Object Tracking algorithm
- [ ] Complete the menu inserting a list of suitable videos for test.
