## Create dataset splits

Once you have your annotated images in COCO format you can use split_data.py to split the dataset in the train and test (optionally also validation) sets. The script assumes that the directory in which you run it contains a folder named images with all the images in .png format and a folder named annotations with the instances_default.json file with all the annotations.
When launched in the folder this script create the train and test splits. If needed you can import the Coco_dataset class to manipulate the dataset (e.g. rename, filter categories, change output/input directory).

## Colab notebooks for training

The pipeline has been developed in Google Colab. The file a described following the pipeline order.

### Create TFRecord

Converts cvat annotations in COCO format to TFRecord

### Train Model

Use a mounted Google Drive storage to train the model.

### Export to SavedModel

Convert to SavedModel format, this step is required in order to convert to tfjs

### Export SSD to TFJS

Export in the final format, which is the same of the files in the TFJS folder.s