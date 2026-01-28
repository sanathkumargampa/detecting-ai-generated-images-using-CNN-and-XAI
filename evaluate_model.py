import os
import cv2
import numpy as np
from keras.models import load_model
import glob

def evaluate_model():
    model_path = 'model/nasnet_weights.hdf5'
    print(f"Loading model from {model_path}...")
    try:
        model = load_model(model_path)
    except Exception as e:
        print(f"Error loading model: {e}")
        return

    # Evaluate Fake Images
    fake_path = "Dataset/fake"
    fake_images = glob.glob(os.path.join(fake_path, "*.*"))
    print(f"Found {len(fake_images)} fake images.")
    
    fake_correct = 0
    fake_samples = fake_images[:50] # Check first 50
    
    for img_path in fake_samples:
        try:
            image = cv2.imread(img_path)
            if image is None: continue
            img = cv2.resize(image, (32,32))
            img = img.astype('float32') / 255.0
            img = img.reshape(1, 32, 32, 3)
            pred = model.predict(img, verbose=0)
            real_prob = pred[0][1]
            if real_prob < 0.5: fake_correct += 1
        except: pass

    fake_acc = (fake_correct/len(fake_samples))*100 if len(fake_samples) > 0 else 0
    print(f"FAKE_ACCURACY: {fake_acc:.2f}% ({fake_correct}/{len(fake_samples)})")

    # Evaluate Real Images
    real_path = "Dataset/real"
    real_images = glob.glob(os.path.join(real_path, "*.*"))
    print(f"Found {len(real_images)} real images.")
    
    real_correct = 0
    real_samples = real_images[:50] # Check first 50
    
    for img_path in real_samples:
        try:
            image = cv2.imread(img_path)
            if image is None: continue
            img = cv2.resize(image, (32,32))
            img = img.astype('float32') / 255.0
            img = img.reshape(1, 32, 32, 3)
            pred = model.predict(img, verbose=0)
            real_prob = pred[0][1]
            if real_prob >= 0.5: real_correct += 1
        except: pass

    real_acc = (real_correct/len(real_samples))*100 if len(real_samples) > 0 else 0
    print(f"REAL_ACCURACY: {real_acc:.2f}% ({real_correct}/{len(real_samples)})")

if __name__ == "__main__":
    evaluate_model()

