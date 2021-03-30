# Colab notebooks for training

The pipeline has been developed in Google Colab. The file a described following the pipeline order.

### Create TFRecord

Converts cvat annotations in COCO format to TFRecord

### Train Model

Use a mounted Google Drive storage to train the model.

### Export to SavedModel

Convert to SavedModel format, this step is required in order to convert to tfjs

### Export SSD to TFJS

Export in the final format, which is the same of the files in the TFJS folder.s