import pandas as pd
import os, json, math
from shutil import copyfile, rmtree

class Coco_dataset:
    def __init__(self, input_directory = "./", output_directory = "./", load_now = True):
        # assign input and output folder
        self.input_directory = input_directory
        self.output_directory = output_directory
        
        # declare all other attributes
        # the following will not be manipulated
        # we just store them for recreate the original json structure
        self.licenses = None
        self.info = None
        self.categories = None

        # we store these as pandas dataframes in order to access them easily
        self.images = None
        self.annotations = None
        self.train_images = None
        self.train_annotations = None
        self.test_images = None
        self.test_annotations = None
        self.create_val = False
        self.val_images = None
        self.val_annotations = None
        
        # load the annotations file we'll manipulate
        if load_now: self.load_json()

    def load_json(self):
        src_dir = os.path.join(self.input_directory, "annotations")
        dataset = json.load(open(os.path.join(src_dir, "instances_default.json"), "r"))

        self.licenses = dataset["licenses"]
        self.info = dataset["info"]
        self.categories = dataset["categories"]

        for key in ("images", "annotations"):
            with open(os.path.join(self.input_directory, key + ".json"), "w") as out:
                json.dump(dataset[key], out)        

        self.images = pd.read_json(open(self.input_directory + "/images.json"))
        self.annotations = pd.read_json(open(self.input_directory + "/annotations.json"))
        
        for key in ("images", "annotations"):
            os.remove(os.path.join(self.input_directory, key + ".json"))


    def filter_categories(self, usr_categories = [2]):
        # we select only ethernet ports (2)
        annotations = self.annotations[self.annotations.category_id.isin(usr_categories)]
        
        # we find any image with too many ethernet port annotated
        # any image without annotations of the categories of interest is not listed
        # by count()
        cat_count = annotations.groupby(["image_id", "category_id"])["category_id"].count()
        eth_count = cat_count[:, 2]
        wrong_images = eth_count[eth_count > 30]
        
        # and we remove them
        final_count = cat_count.drop(wrong_images.index)
        
        # now we update the annotations to show only the ones of interest
        self.annotations = annotations[annotations.image_id.isin(final_count.index.get_level_values(0))]
   
        # we remove the images that are not used
        self.images = self.images[self.images.id.isin(final_count.index.get_level_values(0))]
   
    def train_test_val(self, train_percentage = 0.8, test_percentage = 0.2):
        # we split the dataset in 80% train, 10% test, 10% validation
        train_size = math.ceil(train_percentage * self.images.shape[0])
        test_size = math.ceil((1 - train_percentage)/2 * self.images.shape[0])
        
        df = self.images.sample(frac = 1).reset_index(drop = True)
        self.train_images = df[:train_size]
        self.test_images = df[train_size:train_size + test_size]
        self.val_images = df[train_size + test_size:]
        
        self.train_annotations = self.annotations[self.annotations.image_id.isin(self.train_images.id)]        
        self.test_annotations = self.annotations[self.annotations.image_id.isin(self.test_images.id)]
        self.val_annotations = self.annotations[self.annotations.image_id.isin(self.val_images.id)]
        
        self.create_val = True
           
    def train_test(self, train_percentage = 0.8, test_percentage = 0.2):
        # we split the dataset in 80% train, 10% test, 10% validation
        train_size = math.ceil(train_percentage * self.images.shape[0])
        
        df = self.images.sample(frac = 1).reset_index(drop = True)
        self.train_images = df[:train_size]
        self.test_images = df[train_size:]
        
        self.train_annotations = self.annotations[self.annotations.image_id.isin(self.train_images.id)]        
        self.test_annotations = self.annotations[self.annotations.image_id.isin(self.test_images.id)]

    def export_dataset(self, build_now = True):
        src_dir = os.path.join(self.input_directory, "images")
        
        dst_dir = os.path.join(self.output_directory, "images")
        if "test" in os.listdir(dst_dir): rmtree(os.path.join(dst_dir, "test"))
        os.makedirs(os.path.join(dst_dir, "test"))
        for image_name in self.test_images.file_name:
            copyfile(os.path.join(src_dir, image_name), os.path.join(dst_dir, "test", image_name))

        dst_dir = os.path.join(self.output_directory, "images")
        if "train" in os.listdir(dst_dir): rmtree(os.path.join(dst_dir, "train"))
        os.makedirs(os.path.join(dst_dir, "train"))
        for image_name in self.train_images.file_name:
            copyfile(os.path.join(src_dir, image_name), os.path.join(dst_dir, "train", image_name))
        
        if self.create_val == True:
            dst_dir = os.path.join(self.output_directory, "images")
            if "val" in os.listdir(dst_dir): rmtree(os.path.join(dst_dir, "val"))
            os.makedirs(os.path.join(dst_dir, "val"))
            for image_name in self.val_images.file_name:
                copyfile(os.path.join(src_dir, image_name), os.path.join(dst_dir, "val", image_name))        

        if build_now == True: self.build_json()

    def create_annotations(self, dir = "annotations"):
        dst_dir = os.path.join(self.output_directory, dir)
    
        self.test_annotations.to_json(os.path.join(dst_dir, "test_annotations.json"), "records")
        self.val_annotations.to_json(os.path.join(dst_dir, "val_annotations.json"), "records")
        self.train_annotations.to_json(os.path.join(dst_dir, "train_annotations.json"), "records")

    def build_json(self, dir = "annotations"):
        
        # also create label map, this file must be provided to TF
        self.create_label_map()
        
        dst_dir = os.path.join(self.output_directory, dir)
        
        self.test_images.to_json(os.path.join(self.input_directory, "test_images.json"), "records")
        self.test_annotations.to_json(os.path.join(self.input_directory, "test_annotations.json"), "records")

        licenses = self.licenses       
        info = self.info
        categories = self.categories
        
        images = json.load(open(os.path.join(self.input_directory, "test_images.json"), "r"))
        annotations = json.load(open(os.path.join(self.input_directory, "test_annotations.json"), "r"))
        
        os.remove(os.path.join(self.input_directory, "test_images.json"))
        os.remove(os.path.join(self.input_directory, "test_annotations.json"))
        
        final = {"licenses": licenses, "info": info, "categories": categories, "images": images, "annotations": annotations}
        
        json.dump(final, open(os.path.join(dst_dir, "test_instances.json"), "w+"))
        

        self.train_images.to_json(os.path.join(self.input_directory, "train_images.json"), "records")
        self.train_annotations.to_json(os.path.join(self.input_directory, "train_annotations.json"), "records")

        images = json.load(open(os.path.join(self.input_directory, "train_images.json"), "r"))
        annotations = json.load(open(os.path.join(self.input_directory, "train_annotations.json"), "r"))
        
        os.remove(os.path.join(self.input_directory, "train_images.json"))
        os.remove(os.path.join(self.input_directory, "train_annotations.json"))
        
        final = {"licenses": licenses, "info": info, "categories": categories, "images": images, "annotations": annotations}
        
        json.dump(final, open(os.path.join(dst_dir, "train_instances.json"), "w+"))
            
        if self.create_val == True:    
            self.val_images.to_json(os.path.join(self.input_directory, "val_images.json"), "records")
            self.val_annotations.to_json(os.path.join(self.input_directory, "val_annotations.json"), "records")
    
            licenses = self.licenses       
            info = self.info
            categories = self.categories
            
            images = json.load(open(os.path.join(self.input_directory, "val_images.json"), "r"))
            annotations = json.load(open(os.path.join(self.input_directory, "val_annotations.json"), "r"))
            
            os.remove(os.path.join(self.input_directory, "val_images.json"))
            os.remove(os.path.join(self.input_directory, "val_annotations.json"))
            
            final = {"licenses": licenses, "info": info, "categories": categories, "images": images, "annotations": annotations}
            
            json.dump(final, open(os.path.join(dst_dir, "val_instances.json"), "w+"))
    
    def create_label_map(self):
        label_map = [{"id": "",  "name": "", "display_name": ""} for i in range(len(self.categories))]
        for i in range(len(self.categories)):
            label_map[i]["name"] = self.categories[i]["name"]
            label_map[i]["id"] = self.categories[i]["id"]
            label_map[i]["display_name"] = self.categories[i]["name"]
        
        self.categories = label_map
        
        dst_dir = os.path.join(self.output_directory, "annotations")
        if "label_map.pbtxt" in os.listdir(dst_dir):
            os.remove(os.path.join(dst_dir, "label_map.pbtxt"))
        
        output = open(os.path.join(dst_dir ,"label_map.pbtxt"), "a+")
        for item in label_map:
            obj = "item " + json.dumps(item) + " "
            obj = obj.replace('"id"', "id")
            obj = obj.replace('"name"', "name")
            obj = obj.replace('"display_name"', "display_name")
            
            output.write(obj)

    # must be called before splitting
    def change_image_name(self, dataset_name = "dataset", extension = ".png"):
        
        dst_dir = os.path.join(self.output_directory, "images")
                
        matches = []
        files = filter(lambda file: file.endswith(extension), os.listdir(dst_dir))
        index = 1
        for file_name in files:
            new_name = dataset_name + "-" + str(index) + extension
            os.rename(os.path.join(dst_dir, file_name), os.path.join(dst_dir, new_name))
            index += 1
            matches.append([file_name, new_name])
        
        matches = pd.DataFrame(matches, columns=("old_name", "new_name"))
        images_new = self.images.merge(right = matches, left_on = "file_name", right_on = "old_name")
        images_new = images_new.drop(labels = ["file_name", "old_name"], axis = 1)
        images_new = images_new.rename(columns = {"new_name": "file_name"})
        images_new = images_new.reset_index(drop = True)
        self.images = images_new
        
        if self.create_val == True: self.train_test_val()
        else: self.train_test()
        
        # modify name in original instances_default
        
        self.images.to_json(os.path.join(self.input_directory, "images.json"), "records")
        self.annotations.to_json(os.path.join(self.input_directory, "annotations.json"), "records")

        licenses = self.licenses       
        info = self.info
        categories = self.categories
        
        images = json.load(open(os.path.join(self.input_directory, "images.json"), "r"))
        annotations = json.load(open(os.path.join(self.input_directory, "annotations.json"), "r"))
        
        os.remove(os.path.join(self.input_directory, "images.json"))
        os.remove(os.path.join(self.input_directory, "annotations.json"))
        
        final = {"licenses": licenses, "info": info, "categories": categories, "images": images, "annotations": annotations}
        
        json.dump(final, open(os.path.join(self.output_directory, "annotations", "instances_default.json"), "w+"))
       
        
    # correct error in labeling, convert led labels to ethernet ports in DL2
    def led_to_etp(self):
        led_indices = self.annotations.category_id.isin([1])
        led_indices = led_indices[led_indices == True].index
        for index in led_indices:
            self.annotations.at[index, "category_id"] = 2    

    # classejs is the file that object_detection uses to recognize
    # category ID from tensorflow.js
    def create_classesjs(self):
        fp = open("classes.js", "w")
        fp.write("export const CLASSES = {\n")
        
        categories = self.categories
        categories.insert(0, {"id": 1, "name": "background"})
        
        for i, _ in enumerate(self.categories):
            fp.write("\t" + str(i) + ": {\n")
            fp.write("\t\t" + "name: \"" + self.categories[i]["name"] + "\"," + "\n")
            fp.write("\t\t" + "id: " + str(self.categories[i]["id"]) + "," + "\n")
            fp.write("\t\t" + "displayName: \"" + self.categories[i]["name"] + "\"," + "\n")
            fp.write("\t" + "}," + "\n")
        fp.write("}")
        
    @staticmethod
    def merge(df1, df2, input_dir = "./", output_dir = "./"):
        
        merged_dir = os.path.join(input_dir, "merged")
        if "merged" in os.listdir(input_dir):
            rmtree(merged_dir)
        os.makedirs("merged")
        os.makedirs(os.path.join(merged_dir, "images"))
        os.makedirs(os.path.join(merged_dir, "annotations"))
        
        # reset indices for images and annotations
        
        df1_key = df1.images["id"].to_frame("old_id").reset_index(drop = True)
        df1_key["new_id"] = range(1, df1_key.shape[0] + 1)
        
        df1_images = df1.images.merge(df1_key, left_on = "id", right_on = "old_id")
        df1_images = df1_images.drop(["id", "old_id"], axis = 1)
        df1_images = df1_images.rename(columns = {"new_id": "id"})
        
        df1_annotations = df1.annotations.merge(df1_key, left_on = "image_id", right_on = "old_id")
        df1_annotations = df1_annotations.drop(["image_id", "old_id"], axis = 1)
        df1_annotations = df1_annotations.rename(columns = {"new_id": "image_id"})
        
        df2_key =  df2.images["id"].to_frame("old_id")
        df2_key["new_id"] = range(df1_key.shape[0] + 1, df1_key.shape[0] + df2_key.shape[0] + 1)
        
        df2_images = df2.images.merge(df2_key, left_on = "id", right_on = "old_id")
        df2_images = df2_images.drop(["id", "old_id"], axis = 1)
        df2_images = df2_images.rename(columns = {"new_id": "id"})
        
        df2_annotations = df2.annotations.merge(df2_key, left_on = "image_id", right_on = "old_id")
        df2_annotations = df2_annotations.drop(["image_id", "old_id"], axis = 1)
        df2_annotations = df2_annotations.rename(columns = {"new_id": "image_id"})
        
        df_images = pd.concat((df1_images, df2_images), axis = 0).reset_index(drop = True)
        df_annotations = pd.concat((df1_annotations, df2_annotations), axis = 0).reset_index(drop = True)
        
        # save updated instances_default

        df_out = Coco_dataset(input_dir, output_dir, load_now = False)
        df_out.licences = df1.licenses
        df_out.info = df1.info
        df_out.categories = df1.categories
        df_out.images = df_images
        df_out.annotations = df_annotations
        
        df_out.images.to_json(os.path.join(merged_dir, "images.json"), "records")
        df_out.annotations.to_json(os.path.join(merged_dir, "annotations.json"), "records")

        licenses = df_out.licenses       
        info = df_out.info
        categories = df_out.categories
        
        images = json.load(open(os.path.join(merged_dir, "images.json"), "r"))
        annotations = json.load(open(os.path.join(merged_dir, "annotations.json"), "r"))
        
        os.remove(os.path.join(merged_dir, "images.json"))
        os.remove(os.path.join(merged_dir, "annotations.json"))
        
        final = {"licenses": licenses, "info": info, "categories": categories, "images": images, "annotations": annotations}
        
        json.dump(final, open(os.path.join(merged_dir, "annotations", "instances_default.json"), "w+"))

        # move files     
                
        df1_dir = os.path.join(df1.input_directory, "images")
        for file_name in df1_images.file_name:
            copyfile(os.path.join(df1_dir, file_name), os.path.join(merged_dir, "images", file_name))
            
        df2_dir = os.path.join(df2.input_directory, "images")
        for file_name in df2_images.file_name:
            copyfile(os.path.join(df2_dir, file_name), os.path.join(merged_dir, "images", file_name))        
        
        return df_out


# usage example of all the main functionalities
def merge(df1, df2, df1_folder, df2_folder):
    df1 = Coco_dataset(df1_folder, df1_folder)
    df2 = Coco_dataset(df2_folder, df2_folder)
    df = Coco_dataset.merge(df1, df2)
    
    main_dir = os.getcwd()
    os.chdir("merged")
    df.filter_categories([2])
    # to add also validation split use df.train_test_val()
    df.train_test()
    df.export_dataset()
    
    os.chdir(main_dir)

# TODO: add argument parser for bash use

# Run in the folder containing images and the annotations folders
if __name__ == "__main__":
    # the input folder must contain two folders:
    # annotations, containing only the instances_default.json file
    # and the images folder with all the images annotated
    # if you annotate in cvat and download the dataset in COCO form
    # this will be already set up.
    df = Coco_dataset("./", "./")
    df.filter_categories([2])
    df.train_test()
    df.export_dataset()
    
    

