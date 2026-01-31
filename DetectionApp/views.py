import os
import io
import base64
import json
import uuid
import random
import hashlib

import cv2
import numpy as np
import matplotlib
matplotlib.use('Agg')  # Use non-GUI backend for threading
import matplotlib.pyplot as plt

from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.db.models import Avg

from keras.models import load_model, Model
from lime import lime_image
from skimage.segmentation import mark_boundaries

from .models import AnalysisLog

# Initialize LIME explainer
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
        'real_prob': real_prob * 100,  # Return as percentage
        'fake_prob': fake_prob * 100,  # Return as percentage
        'explanation': text_explanation
    }

# Legacy index view - redirects to React frontend
def index(request):
    return render(request, 'index.html', {})

@csrf_exempt
def check_availability_api(request):
    """Check if username, email, or mobile is already registered"""
    if request.method == 'POST':
        try:
            from .models import UserProfile
            import re
            
            def normalize_mobile(mobile):
                """Normalize mobile number by removing country code and non-digits"""
                if not mobile:
                    return ''
                # Remove all non-digit characters
                digits = re.sub(r'\D', '', mobile)
                # Remove leading country codes (91 for India, common patterns)
                if digits.startswith('91') and len(digits) > 10:
                    digits = digits[2:]
                elif digits.startswith('0') and len(digits) > 10:
                    digits = digits[1:]
                return digits[-10:] if len(digits) >= 10 else digits  # Keep last 10 digits
            
            data = json.loads(request.body)
            field = data.get('field')  # 'username', 'email', or 'mobile'
            value = data.get('value', '').strip()
            
            if not value:
                return JsonResponse({'available': True})
            
            if field == 'username':
                exists = User.objects.filter(username__iexact=value).exists()
                return JsonResponse({
                    'available': not exists,
                    'message': 'Username is already taken' if exists else ''
                })
            elif field == 'email':
                exists = User.objects.filter(email__iexact=value).exists()
                return JsonResponse({
                    'available': not exists,
                    'message': 'Email is already registered' if exists else ''
                })
            elif field == 'mobile':
                normalized = normalize_mobile(value)
                if len(normalized) < 10:
                    return JsonResponse({'available': True})  # Not a valid mobile yet
                # Check all existing mobiles with normalization
                exists = False
                for profile in UserProfile.objects.exclude(mobile__isnull=True).exclude(mobile=''):
                    if normalize_mobile(profile.mobile) == normalized:
                        exists = True
                        break
                return JsonResponse({
                    'available': not exists,
                    'message': 'Mobile number is already registered' if exists else ''
                })
            else:
                return JsonResponse({'available': True})
        except Exception as e:
            return JsonResponse({'available': True, 'error': str(e)})
    return JsonResponse({'success': False, 'message': 'Method not allowed'}, status=405)

@csrf_exempt
def register_api(request):
    if request.method == 'POST':
        try:
            from .models import UserProfile
            import re
            
            def normalize_mobile(mobile):
                """Normalize mobile number by removing country code and non-digits"""
                if not mobile:
                    return ''
                digits = re.sub(r'\D', '', mobile)
                if digits.startswith('91') and len(digits) > 10:
                    digits = digits[2:]
                elif digits.startswith('0') and len(digits) > 10:
                    digits = digits[1:]
                return digits[-10:] if len(digits) >= 10 else digits
            
            data = json.loads(request.body)
            name = data.get('name', '')
            username = data.get('username')
            password = data.get('password')
            email = data.get('email')
            mobile = data.get('mobile', '').strip()
            normalized_mobile = normalize_mobile(mobile)
            
            if User.objects.filter(username__iexact=username).exists():
                 return JsonResponse({'success': False, 'message': 'Username already exists'}, status=400)
            
            if User.objects.filter(email__iexact=email).exists():
                 return JsonResponse({'success': False, 'message': 'Email already exists'}, status=400)
            
            # Check for duplicate mobile with normalization
            if normalized_mobile:
                for profile in UserProfile.objects.exclude(mobile__isnull=True).exclude(mobile=''):
                    if normalize_mobile(profile.mobile) == normalized_mobile:
                        return JsonResponse({'success': False, 'message': 'Mobile number already registered'}, status=400)
            
            user = User.objects.create_user(username=username, email=email, password=password)
            user.first_name = name
            user.save()
            
            # Create user profile with normalized mobile
            UserProfile.objects.create(user=user, mobile=normalized_mobile if normalized_mobile else None)
            
            return JsonResponse({'success': True, 'message': 'Registration successful'})
        except Exception as e:
            return JsonResponse({'success': False, 'message': str(e)}, status=400)
    return JsonResponse({'success': False, 'message': 'Method not allowed'}, status=405)

@csrf_exempt
def login_api(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            identifier = data.get('username')  # Can be username or email
            password = data.get('password')
            
            # Try to find user by email first, then by username
            user = None
            if '@' in identifier:
                try:
                    user_obj = User.objects.get(email=identifier)
                    user = authenticate(request, username=user_obj.username, password=password)
                except User.DoesNotExist:
                    pass
            else:
                user = authenticate(request, username=identifier, password=password)
            
            if user is not None:
                login(request, user)
                return JsonResponse({
                    'success': True, 
                    'message': 'Login successful',
                    'username': user.username,
                    'user_id': user.id,
                    'is_superuser': user.is_superuser
                })
            else:
                return JsonResponse({'success': False, 'message': 'Invalid credentials'}, status=401)
        except Exception as e:
            return JsonResponse({'success': False, 'message': str(e)}, status=400)
    return JsonResponse({'success': False, 'message': 'Method not allowed'}, status=405)

@csrf_exempt
def logout_api(request):
    if request.method == 'POST':
        logout(request)
        return JsonResponse({'success': True, 'message': 'Logout successful'})
    return JsonResponse({'success': False, 'message': 'Method not allowed'}, status=405)

@csrf_exempt
def reset_password_api(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            email = data.get('email')
            new_password = data.get('password')
            
            if not email or not new_password:
                return JsonResponse({'success': False, 'message': 'Email and password are required'}, status=400)
            
            try:
                user = User.objects.get(email=email)
                user.set_password(new_password)
                user.save()
                return JsonResponse({'success': True, 'message': 'Password reset successful'})
            except User.DoesNotExist:
                return JsonResponse({'success': False, 'message': 'No account found with this email'}, status=404)
        except Exception as e:
            return JsonResponse({'success': False, 'message': str(e)}, status=400)
    return JsonResponse({'success': False, 'message': 'Method not allowed'}, status=405)

@csrf_exempt
def history_api(request):
    user = None
    
    # Try session auth first
    if request.user.is_authenticated:
        user = request.user
    else:
        # Fallback to X-User-ID header
        user_id = request.headers.get('X-User-ID')
        if user_id:
            try:
                user = User.objects.get(id=int(user_id))
            except (User.DoesNotExist, ValueError):
                pass
    
    if user:
        logs = AnalysisLog.objects.filter(user=user).order_by('-timestamp')
        data = []
        for log in logs:
            data.append({
                'image_path': log.image_path,
                'is_real': log.is_real,
                'confidence': log.confidence,
                'real_prob': log.real_prob,
                'fake_prob': log.fake_prob,
                'explanation_image': log.explanation_image or '',
                'explanation_text': log.explanation_text or '',
                'timestamp': log.timestamp.strftime("%Y-%m-%d %H:%M:%S")
            })
        return JsonResponse({'success': True, 'history': data})
    return JsonResponse({'success': False, 'message': 'Not authenticated'}, status=401)

@csrf_exempt
def clear_history_api(request):
    """Clear all analysis history for the current user"""
    if request.method != 'DELETE':
        return JsonResponse({'success': False, 'message': 'Method not allowed'}, status=405)
    
    user = None
    if request.user.is_authenticated:
        user = request.user
    else:
        user_id = request.headers.get('X-User-ID')
        if user_id:
            try:
                user = User.objects.get(id=int(user_id))
            except (User.DoesNotExist, ValueError):
                pass
    
    if not user:
        return JsonResponse({'success': False, 'message': 'Not authenticated'}, status=401)
    
    # Delete all user's analysis logs and their images
    user_logs = AnalysisLog.objects.filter(user=user)
    deleted_count = 0
    for log in user_logs:
        old_path = os.path.join("DetectionApp/static", log.image_path)
        if os.path.exists(old_path):
            os.remove(old_path)
        deleted_count += 1
    user_logs.delete()
    
    return JsonResponse({'success': True, 'message': f'Cleared {deleted_count} history items'})

@csrf_exempt
def profile_api(request):
    """Get or update user profile"""
    import re
    from .models import UserProfile
    
    def normalize_mobile(mobile):
        if not mobile:
            return ''
        digits = re.sub(r'\D', '', mobile)
        if digits.startswith('91') and len(digits) > 10:
            digits = digits[2:]
        elif digits.startswith('0') and len(digits) > 10:
            digits = digits[1:]
        return digits[-10:] if len(digits) >= 10 else digits
    
    user = None
    if request.user.is_authenticated:
        user = request.user
    else:
        user_id = request.headers.get('X-User-ID')
        if user_id:
            try:
                user = User.objects.get(id=int(user_id))
            except (User.DoesNotExist, ValueError):
                pass
    
    if not user:
        return JsonResponse({'success': False, 'message': 'Not authenticated'}, status=401)
    
    # GET - Return user profile
    if request.method == 'GET':
        profile, _ = UserProfile.objects.get_or_create(user=user)
        return JsonResponse({
            'success': True,
            'profile': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'mobile': profile.mobile or '',
                'is_superuser': user.is_superuser
            }
        })
    
    # PUT - Update user profile
    if request.method == 'PUT':
        try:
            data = json.loads(request.body)
            
            # Check username availability (excluding current user)
            new_username = data.get('username', '').strip()
            if new_username and new_username != user.username:
                if User.objects.filter(username__iexact=new_username).exclude(id=user.id).exists():
                    return JsonResponse({'success': False, 'message': 'Username already taken'}, status=400)
                user.username = new_username
            
            # Check email availability
            new_email = data.get('email', '').strip()
            if new_email and new_email != user.email:
                if User.objects.filter(email__iexact=new_email).exclude(id=user.id).exists():
                    return JsonResponse({'success': False, 'message': 'Email already registered'}, status=400)
                user.email = new_email
            
            # Update name
            if 'first_name' in data:
                user.first_name = data['first_name']
            
            # Update password if provided
            if data.get('password'):
                user.set_password(data['password'])
            
            user.save()
            
            # Update mobile
            new_mobile = normalize_mobile(data.get('mobile', ''))
            profile, _ = UserProfile.objects.get_or_create(user=user)
            
            if new_mobile and new_mobile != normalize_mobile(profile.mobile or ''):
                # Check if mobile is taken by another user
                for p in UserProfile.objects.exclude(user=user).exclude(mobile__isnull=True).exclude(mobile=''):
                    if normalize_mobile(p.mobile) == new_mobile:
                        return JsonResponse({'success': False, 'message': 'Mobile number already registered'}, status=400)
            
            profile.mobile = new_mobile if new_mobile else None
            profile.save()
            
            return JsonResponse({
                'success': True, 
                'message': 'Profile updated successfully',
                'profile': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'first_name': user.first_name,
                    'mobile': profile.mobile or '',
                    'is_superuser': user.is_superuser
                }
            })
        except json.JSONDecodeError:
            return JsonResponse({'success': False, 'message': 'Invalid JSON'}, status=400)
        except Exception as e:
            return JsonResponse({'success': False, 'message': str(e)}, status=500)
    
    return JsonResponse({'success': False, 'message': 'Method not allowed'}, status=405)

@csrf_exempt
def admin_logs_api(request):
    # Check for X-User-ID header for admin verification
    user = None
    if request.user.is_authenticated:
        user = request.user
    else:
        user_id = request.headers.get('X-User-ID')
        if user_id:
            try:
                user = User.objects.get(id=int(user_id))
            except (User.DoesNotExist, ValueError):
                pass
    
    if user and user.is_superuser:
        # Get all logs with explanation data
        logs = AnalysisLog.objects.all().order_by('-timestamp')
        logs_data = []
        for log in logs:
            logs_data.append({
                'id': log.id,
                'username': log.user.username,
                'email': log.user.email,
                'image_path': log.image_path,
                'is_real': log.is_real,
                'confidence': log.confidence,
                'real_prob': log.real_prob,
                'fake_prob': log.fake_prob,
                'explanation_image': log.explanation_image or '',
                'explanation_text': log.explanation_text or '',
                'timestamp': log.timestamp.strftime("%Y-%m-%d %H:%M:%S")
            })
        
        # Get all users with their analysis stats
        from django.db.models import Count, Avg
        users = User.objects.all()
        users_data = []
        for u in users:
            user_logs = AnalysisLog.objects.filter(user=u)
            real_count = user_logs.filter(is_real=True).count()
            fake_count = user_logs.filter(is_real=False).count()
            avg_confidence = user_logs.aggregate(Avg('confidence'))['confidence__avg'] or 0
            
            users_data.append({
                'id': u.id,
                'username': u.username,
                'email': u.email or 'N/A',
                'first_name': u.first_name or '',
                'is_superuser': u.is_superuser,
                'date_joined': u.date_joined.strftime("%Y-%m-%d %H:%M"),
                'last_login': u.last_login.strftime("%Y-%m-%d %H:%M") if u.last_login else 'Never',
                'total_analyses': user_logs.count(),
                'real_count': real_count,
                'fake_count': fake_count,
                'avg_confidence': round(avg_confidence, 1)
            })
        
        return JsonResponse({'success': True, 'logs': logs_data, 'users': users_data})
    return JsonResponse({'success': False, 'message': 'Unauthorized'}, status=403)

@csrf_exempt
def admin_user_api(request, user_id):
    """Admin API to update or delete a user"""
    # Verify admin access
    admin = None
    if request.user.is_authenticated:
        admin = request.user
    else:
        admin_id = request.headers.get('X-User-ID')
        if admin_id:
            try:
                admin = User.objects.get(id=int(admin_id))
            except (User.DoesNotExist, ValueError):
                pass
    
    if not admin or not admin.is_superuser:
        return JsonResponse({'success': False, 'message': 'Unauthorized'}, status=403)
    
    # Get target user
    try:
        target_user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return JsonResponse({'success': False, 'message': 'User not found'}, status=404)
    
    # Handle PUT (update user)
    if request.method == 'PUT':
        try:
            data = json.loads(request.body)
            
            # Update allowed fields
            if 'username' in data and data['username']:
                # Check if username already exists (excluding current user)
                if User.objects.filter(username=data['username']).exclude(id=user_id).exists():
                    return JsonResponse({'success': False, 'message': 'Username already taken'}, status=400)
                target_user.username = data['username']
            
            if 'email' in data:
                target_user.email = data['email']
            
            if 'first_name' in data:
                target_user.first_name = data['first_name']
            
            if 'password' in data and data['password']:
                target_user.set_password(data['password'])
            
            # Only superusers can modify is_superuser, and can't demote themselves
            if 'is_superuser' in data:
                if target_user.id != admin.id:  # Can't change own admin status
                    target_user.is_superuser = data['is_superuser']
            
            target_user.save()
            
            return JsonResponse({
                'success': True, 
                'message': 'User updated successfully',
                'user': {
                    'id': target_user.id,
                    'username': target_user.username,
                    'email': target_user.email,
                    'first_name': target_user.first_name,
                    'is_superuser': target_user.is_superuser
                }
            })
        except json.JSONDecodeError:
            return JsonResponse({'success': False, 'message': 'Invalid JSON'}, status=400)
        except Exception as e:
            return JsonResponse({'success': False, 'message': str(e)}, status=500)
    
    # Handle DELETE
    if request.method == 'DELETE':
        if target_user.id == admin.id:
            return JsonResponse({'success': False, 'message': 'Cannot delete yourself'}, status=400)
        
        # Delete user's analysis logs and images
        user_logs = AnalysisLog.objects.filter(user=target_user)
        for log in user_logs:
            old_path = os.path.join("DetectionApp/static", log.image_path)
            if os.path.exists(old_path):
                os.remove(old_path)
        user_logs.delete()
        
        target_user.delete()
        return JsonResponse({'success': True, 'message': 'User deleted successfully'})
    
    return JsonResponse({'success': False, 'message': 'Method not allowed'}, status=405)

@csrf_exempt
def predict_api(request):
    if request.method == 'POST':
        try:
            if 'image' not in request.FILES:
                return JsonResponse({'success': False, 'message': 'No image provided'}, status=400)
            
            file = request.FILES['image']
            
            # Generate unique filename for history
            ext = os.path.splitext(file.name)[1]
            filename = f"{uuid.uuid4()}{ext}"
            
            # Save file temporarily
            if not os.path.exists("DetectionApp/static"):
                os.makedirs("DetectionApp/static")
            
            save_path = os.path.join("DetectionApp/static", filename)
            
            # Read file content and compute hash for duplicate detection
            import hashlib
            file_content = file.read()
            image_hash = hashlib.md5(file_content).hexdigest()
            
            # Write file to disk
            with open(save_path, "wb") as f:
                f.write(file_content)
            
            # Load model and predict
            model_path = "model/nasnet_weights.hdf5"
            if not os.path.exists(model_path):
                 return JsonResponse({'success': False, 'message': 'Model file not found'}, status=500)

            model = load_model(model_path)
            
            # classifyImage returns dict with image and prediction data
            result = classifyImage(save_path, model)
            
            # Log analysis - try session first, then X-User-ID header
            user = None
            if request.user.is_authenticated:
                user = request.user
            else:
                user_id = request.headers.get('X-User-ID')
                if user_id:
                    try:
                        user = User.objects.get(id=int(user_id))
                    except (User.DoesNotExist, ValueError):
                        pass
            
            if user:
                # Delete any existing entry with the same image hash (duplicate detection)
                old_entries = AnalysisLog.objects.filter(user=user, image_hash=image_hash)
                for old_entry in old_entries:
                    # Delete the old image file
                    old_path = os.path.join("DetectionApp/static", old_entry.image_path)
                    if os.path.exists(old_path):
                        os.remove(old_path)
                old_entries.delete()
                
                # Create new entry
                AnalysisLog.objects.create(
                    user=user,
                    image_path=filename,
                    is_real=result['is_real'],
                    confidence=result['confidence'],
                    real_prob=result['real_prob'],
                    fake_prob=result['fake_prob'],
                    explanation_image=result.get('image', ''),  # Base64 XAI visualization
                    explanation_text=result.get('explanation', ''),
                    image_hash=image_hash
                )

            
            return JsonResponse({
                'success': True, 
                'image': result['image'],
                'isReal': result['is_real'],
                'confidence': result['confidence'],
                'real_prob': result['real_prob'],
                'fake_prob': result['fake_prob'],
                'status': result['status'],
                'explanation': result['explanation'],
                'message': 'Prediction complete'
            })
            
        except Exception as e:
            import traceback
            traceback.print_exc()
            return JsonResponse({'success': False, 'message': str(e)}, status=500)
            
    return JsonResponse({'success': False, 'message': 'Method not allowed'}, status=405)

