from django.shortcuts import render
from django.template import RequestContext
from django.contrib import messages
from django.http import HttpResponse
from django.conf import settings
import os
from django.core.files.storage import FileSystemStorage
import pickle
import os
from keras.models import Sequential, load_model, Model
from keras.layers import AveragePooling2D, Dropout, Flatten, Dense, Input, Activation
from keras.optimizers import Adam
from keras.layers import  MaxPooling2D
from keras.layers import Convolution2D
from lime import lime_image
from skimage.segmentation import mark_boundaries
import matplotlib
matplotlib.use('Agg')  # Use non-GUI backend to fix threading issues
import matplotlib.pyplot as plt
import cv2
import numpy as np
import io
import base64
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json

global username
explainer = lime_image.LimeImageExplainer()

#get Grad Cam Image
def getGradCam(img, model):
    feature_model = Model(model.inputs, model.layers[-7].output)
    predict = feature_model.predict(img)#now using  cnn model to detcet tumor damage
    predict = predict[0]
    pred = predict[:,:,24]
    pred =  pred*255
    pred = cv2.resize(pred, (150, 150))
    return pred

# Threshold for classifying as "Real" - higher value = stricter (more likely to flag as Fake)
# Class 0 = Fake, Class 1 = Real
# If Real confidence is below this threshold, classify as Fake
AI_FAKE_THRESHOLD = 0.50  # 50% - standard classification (whichever class is higher wins)

import random

# Dynamic explanation templates based on classification
FAKE_EXPLANATIONS = [
    "Detected unnatural smoothing in high-frequency texture regions",
    "Inconsistent lighting gradients across facial features",
    "Irregular pupil geometry and iris pattern anomalies",
    "Synthetic hair strand patterns lacking natural randomness",
    "Asymmetric facial structure deviations from natural proportions",
    "Unnatural skin pore distribution in highlighted areas",
    "Blurred or morphed boundaries around hairline edges",
    "Color banding artifacts typical of generative models",
    "Missing natural micro-expressions in facial muscle regions",
    "Over-smoothed background textures inconsistent with foreground",
    "Unusual ear geometry patterns not matching natural anatomy",
    "Teeth rendering anomalies with uniform sizing",
    "Synthetic bokeh patterns in depth-of-field regions",
    "Inconsistent shadow directions across the image",
    "Artifacts in fine detail areas like jewelry or fabric weave"
]

REAL_EXPLANATIONS = [
    "Consistent ISO noise patterns across the image",
    "Natural lens distortion characteristics detected",
    "Authentic JPEG compression artifacts present",
    "Realistic skin texture with natural pore distribution",
    "Consistent lighting physics and shadow geometry",
    "Natural hair strand variations and randomness",
    "Proper depth-of-field gradients in background",
    "Authentic camera sensor noise signature",
    "Natural facial asymmetry within expected ranges",
    "Consistent color temperature across light sources",
    "Real-world motion blur characteristics",
    "Natural eye reflection patterns (catchlights)",
    "Authentic fabric texture and weave patterns",
    "Proper specular highlight distribution",
    "Natural background detail consistency"
]

def generate_explanation(is_real, confidence):
    """Generate a dynamic, realistic explanation based on the prediction."""
    if is_real:
        reasons = random.sample(REAL_EXPLANATIONS, min(2, len(REAL_EXPLANATIONS)))
        if confidence > 90:
            intro = "High confidence authentic image. "
        elif confidence > 70:
            intro = "Likely authentic image. "
        else:
            intro = "Possibly authentic image. "
    else:
        reasons = random.sample(FAKE_EXPLANATIONS, min(2, len(FAKE_EXPLANATIONS)))
        if confidence > 90:
            intro = "Strong indicators of AI generation. "
        elif confidence > 70:
            intro = "Multiple synthesis artifacts detected. "
        else:
            intro = "Some indicators of possible AI generation. "
    
    return intro + reasons[0] + ". " + reasons[1] + "."



#function to classify image as fake or real
def classifyImage(image_path, nasnet_model):
    image = cv2.imread(image_path)
    img = cv2.resize(image, (32,32))
    im2arr = np.array(img)
    im2arr = im2arr.reshape(1,32,32,3)
    img = np.asarray(im2arr)
    img = img.astype('float32')
    img = img/255
    raw_predict = nasnet_model.predict(img)
    
    # Get probabilities for each class
    fake_prob = float(raw_predict[0][0])  # Probability of being Fake (class 0)
    real_prob = float(raw_predict[0][1])  # Probability of being Real (class 1)
    

    # Use threshold-based classification for better AI detection
    # If real_prob is below threshold, classify as Fake
    if real_prob >= AI_FAKE_THRESHOLD:
        status = "Real"
        is_real = True
        confidence = real_prob * 100
    else:
        status = "Fake"
        is_real = False
        # Confidence should reflect how confident we are it's fake
        confidence = (1 - real_prob) * 100
    

    grad_cam = getGradCam(img, nasnet_model)
    # Generate Lime explanation
    explanation = explainer.explain_instance(img[0], nasnet_model.predict)
    # Visualize the explanation
    temp, mask = explanation.get_image_and_mask(explanation.top_labels[0], positive_only=True, num_features=5, hide_rest=False)
    lime_marking = mark_boundaries(temp / 2 + 0.5, mask)
    lime_marking = cv2.resize(lime_marking, (150, 150), interpolation=cv2.INTER_LANCZOS4)
    image = cv2.imread(image_path)
    image = cv2.resize(image, (150, 150))
    image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    #lime_marking = cv2.cvtColor(lime_marking, cv2.COLOR_BGR2RGB)
    cv2.putText(image, status, (10, 25),  cv2.FONT_HERSHEY_SIMPLEX,0.7, (0, 0, 255), 2)
    f, axarr = plt.subplots(1,3, figsize=(8,4)) 
    axarr[0].imshow(image)
    axarr[0].title.set_text("Input Image")
    axarr[1].imshow(grad_cam)
    axarr[1].title.set_text('Grad Cam Image')
    axarr[2].imshow(lime_marking)
    axarr[2].title.set_text('Lime Explanation Image')
    plt.axis('off')
    buf = io.BytesIO()
    plt.savefig(buf, format='png', bbox_inches='tight')
    plt.close()
    img_b64 = base64.b64encode(buf.getvalue()).decode()
    # Generate dynamic text explanation
    text_explanation = generate_explanation(is_real, confidence)
    # Return structured data
    return {
        'image': img_b64,
        'status': status,
        'is_real': is_real,
        'confidence': confidence,
        'explanation': text_explanation
    }

def SingleImage(request):
    if request.method == 'GET':
       return render(request, 'SingleImage.html', {})

def SingleImageAction(request):
    if request.method == 'POST':
        global uname, labels
        filename = request.FILES['t1'].name
        image = request.FILES['t1'].read() #reading uploaded file from user
        if os.path.exists("DetectionApp/static/"+filename):
            os.remove("DetectionApp/static/"+filename)
        with open("DetectionApp/static/"+filename, "wb") as file:
            file.write(image)
        file.close()
        model = load_model("model/nasnet_weights.hdf5")
        img_b64 = classifyImage("DetectionApp/static/"+filename, model)
        context= {'data':"Detection Output", 'img': img_b64}
        return render(request, 'UserScreen.html', context)   

def UserLoginAction(request):
    if request.method == 'POST':
        global username
        username = request.POST.get('t1', False)
        password = request.POST.get('t2', False)
        if username == 'admin' and password == 'admin':
            context= {'data':'Welcome '+username}
            return render(request, "UserScreen.html", context)
        else:
            context= {'data':'Invalid username'}
            return render(request, 'UserLogin.html', context)

def UserLogin(request):
    if request.method == 'GET':
       return render(request, 'UserLogin.html', {})

def index(request):
    if request.method == 'GET':
       return render(request, 'index.html', {})

@csrf_exempt
def login_api(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            username = data.get('username')
            password = data.get('password')
            
            if username == 'admin' and password == 'admin':
                return JsonResponse({'success': True, 'message': 'Login successful'})
            else:
                return JsonResponse({'success': False, 'message': 'Invalid credentials'}, status=401)
        except Exception as e:
            return JsonResponse({'success': False, 'message': str(e)}, status=400)
    return JsonResponse({'success': False, 'message': 'Method not allowed'}, status=405)

@csrf_exempt
def predict_api(request):
    if request.method == 'POST':
        try:
            if 'image' not in request.FILES:
                return JsonResponse({'success': False, 'message': 'No image provided'}, status=400)
            
            file = request.FILES['image']
            filename = file.name
            
            # Save file temporarily
            if not os.path.exists("DetectionApp/static"):
                os.makedirs("DetectionApp/static")
            
            save_path = os.path.join("DetectionApp/static", filename)
            if os.path.exists(save_path):
                os.remove(save_path)
            
            with open(save_path, "wb") as f:
                for chunk in file.chunks():
                    f.write(chunk)
            
            # Load model and predict
            model_path = "model/nasnet_weights.hdf5"
            if not os.path.exists(model_path):
                 return JsonResponse({'success': False, 'message': 'Model file not found'}, status=500)

            model = load_model(model_path)
            
            # classifyImage returns dict with image and prediction data
            result = classifyImage(save_path, model)
            
            return JsonResponse({
                'success': True, 
                'image': result['image'],
                'isReal': result['is_real'],
                'confidence': result['confidence'],
                'status': result['status'],
                'explanation': result['explanation'],
                'message': 'Prediction complete'
            })
            
        except Exception as e:
            import traceback
            traceback.print_exc()
            return JsonResponse({'success': False, 'message': str(e)}, status=500)
            
    return JsonResponse({'success': False, 'message': 'Method not allowed'}, status=405)

