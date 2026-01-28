"""
Training script for AI Fake Detection Model
This script retrains the CNN model with updated dataset
"""
import os
import cv2
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
from keras.utils.np_utils import to_categorical
from keras.callbacks import ModelCheckpoint
from keras.models import Sequential
from keras.layers import Convolution2D, MaxPooling2D, Flatten, Dense
import warnings
warnings.filterwarnings("ignore")

print("=" * 60)
print("AI Fake Detection Model - Retraining Script")
print("=" * 60)

# Global variable definition for images and label storage
X = []
Y = []
path = "Dataset"

# Function to load real and fake images
print("\n[1/5] Loading images from dataset...")
print("This may take a few minutes for large datasets...")
count = 0
for root, dirs, directory in os.walk(path):
    for j in range(len(directory)):
        if 'Thumbs.db' not in directory[j]:
            img = cv2.imread(root + "/" + directory[j])
            if img is not None:
                img = cv2.resize(img, (32, 32))
                label = 0  # for fake image label will be 0
                name = os.path.basename(root)
                if name == "real":  # for real images label will be 1
                    label = 1
                X.append(img)
                Y.append(label)
                count += 1
                if count % 5000 == 0:
                    print(f"  Loaded {count} images...")

X = np.array(X)
Y = np.array(Y)

print(f"Fake & Real Images Loading Completed")
print(f"Total images found in dataset = {X.shape[0]}")

# Count labels
unique, counts = np.unique(Y, return_counts=True)
print(f"Fake images (label 0): {counts[0]}")
print(f"Real images (label 1): {counts[1]}")

# Save processed data
print("\n[2/5] Saving preprocessed data...")
np.save('model/X.npy', X)
np.save('model/Y.npy', Y)
print("Saved X.npy and Y.npy")

# Dataset processing: shuffling and normalizing
print("\n[3/5] Preprocessing data...")
X = X.astype('float32')
X = X / 255
indices = np.arange(X.shape[0])
np.random.shuffle(indices)
X = X[indices]
Y = Y[indices]
Y = to_categorical(Y)
print("Images Shuffling & Normalization completed")

# Splitting images data into train and test
X_train, X_test, y_train, y_test = train_test_split(X, Y, test_size=0.2)
print(f"\nDataset Train & Test Split Details")
print(f"80% images used to train: {X_train.shape[0]}")
print(f"20% images used to test: {X_test.shape[0]}")

# Build and train the Sequential CNN model (same as notebook)
print("\n[4/5] Building and training CNN model...")
print("This may take 10-30 minutes depending on your hardware...")

# Create Sequential CNN model (matching the notebook architecture)
model = Sequential()
model.add(Convolution2D(32, (3, 3), input_shape=(X_train.shape[1], X_train.shape[2], X_train.shape[3]), activation='relu'))
model.add(MaxPooling2D(pool_size=(2, 2)))
model.add(Convolution2D(32, (3, 3), activation='relu'))
model.add(MaxPooling2D(pool_size=(2, 2)))
model.add(Flatten())
model.add(Dense(units=256, activation='relu'))
model.add(Dense(units=y_train.shape[1], activation='softmax'))

# Compile model
model.compile(optimizer='adam', loss='categorical_crossentropy', metrics=['accuracy'])

# Train the model
model_check_point = ModelCheckpoint(filepath='model/nasnet_weights.hdf5', 
                                     verbose=1, save_best_only=True)
hist = model.fit(X_train, y_train, 
                 batch_size=64, 
                 epochs=40, 
                 validation_data=(X_test, y_test), 
                 callbacks=[model_check_point], 
                 verbose=1)

# Evaluate the model
print("\n[5/5] Evaluating model performance...")
predict = model.predict(X_test)
predict = np.argmax(predict, axis=1)
y_test1 = np.argmax(y_test, axis=1)

accuracy = accuracy_score(y_test1, predict) * 100
print(f"\nModel Accuracy: {accuracy:.2f}%")

print("\n" + "=" * 60)
print("Training Complete!")
print("The model has been saved to: model/nasnet_weights.hdf5")
print("Please restart the Django server to use the new model.")
print("=" * 60)
